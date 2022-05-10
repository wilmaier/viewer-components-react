/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PropertyValidationClient, PropertyValidationClientOptions } from "../../property-validation-client/PropertyValidationClient";
import { take } from "../../property-validation-client/base/iterators/IteratorUtilFunctions";
import { EntityListIterator } from "../../property-validation-client/base/iterators/EntityListIterator";
import { Rule, RuleTemplate, Run, RunDetails, Test } from "../../property-validation-client/base";
import { ParamsToCreateRule, ParamsToCreateTest, ParamsToDeleteRule, ParamsToDeleteRun, ParamsToDeleteTest, ParamsToGetResult, ParamsToGetRun, ParamsToGetTemplateList, ParamsToRunTest } from "../../property-validation-client/operations";
import ValidateResultsTable from "./ValidateResultsTable";
import type { IModelConnection } from "@itwin/core-frontend";
import type {
  ContentDescriptorRequestOptions,
  Field,
  KeySet,
  NestedContentField,
  PropertiesField,
  Ruleset,
  RulesetVariable,
  StructFieldMemberDescription,
} from "@itwin/presentation-common";
import {
  ContentSpecificationTypes,
  DefaultContentDisplayTypes,
  PropertyValueFormat,
  RelationshipMeaning,
  RuleTypes,
} from "@itwin/presentation-common";
import { Presentation } from "@itwin/presentation-frontend";
import { useActiveIModelConnection } from "@itwin/appui-react";
import type {
  SelectOption,
} from "@itwin/itwinui-react";
import {
  Fieldset,
  LabeledInput,
  LabeledSelect,
  Small,
  Text,
} from "@itwin/itwinui-react";
import React, { useContext, useEffect, useState } from "react";

import ValidateActionPanel from "./ValidateActionPanel";
import { WidgetHeader } from "./utils";
import "./GroupPropertyAction.scss";
import type { ECProperty } from "@itwin/insights-client";
import { ReportingClient } from "@itwin/insights-client";
import { ApiContext } from "./GroupingMapping";

interface GroupPropertyValidateActionProps {
  iModelId: string;
  mappingId: string;
  groupId: string;
  groupPropertyId?: string;
  groupPropertyName?: string;
  keySet: KeySet;
  returnFn: () => Promise<void>;
}

export const validationTypeSelectionOptions: SelectOption<string>[] = [
  { value: "PropertyValueRange", label: "Range" },
  // { value: "PropertyValueAtMost", label: "Upper Bound" },
  // { value: "PropertyValueAtLeast", label: "Lower Bound" },
  // { value: "PropertyValuePattern", label: "Pattern" },
  // { value: "PropertyValueDefined", label: "Value Set" },
  // { value: "PropertyValueUnique", label: "Value Unique" },
  // { value: "PropertyValueCountAtLeast", label: "Count Elements Above Lower Bound" },
  // { value: "PropertyValueCountAtMost", label: "Count Elements Below Upper Bound" },
  // { value: "PropertyValueCountRange", label: "Count Elements in Range" },
  // { value: "PropertyValueSumAtLeast", label: "Sum Values Above Lower Bound" },
  // { value: "PropertyValueSumAtMost", label: "Sum Values Below Upper Bound" },
  // { value: "PropertyValueSumRange", label: "Sum Values in Range" },
  // { value: "PropertyValuePercentAvailable", label: "Percent of Elements With Property Set" },
];
interface Property {
  name: string;
  label: string;
  type: string;
}

interface NavigationProperty {
  navigationName: string;
  rootClassName: string;
}

const extractPrimitive = (
  propertiesField: PropertiesField,
  classToPropertiesMapping: Map<string, Property[]>,
  navigation?: NavigationProperty
) => {
  // There are rare cases which only happens in multiple selections where it returns more than one.
  // This also checks if this property comes from a navigation property
  const className =
    navigation?.rootClassName ??
    propertiesField.properties[0].property.classInfo.name;
  // Sometimes class names are not defined. Type error. Not guaranteed.
  if (!className) {
    return;
  }

  if (!classToPropertiesMapping.has(className)) {
    classToPropertiesMapping.set(className, []);
  }

  // Gets property name. Appends path if from navigation.
  const propertyName = navigation
    ? `${navigation.navigationName}.${propertiesField.properties[0].property.name}`
    : propertiesField.properties[0].property.name;

  const label = navigation
    ? `${propertiesField.label} (${navigation?.navigationName})`
    : propertiesField.label;

  // Ignore hardcoded BisCore navigation properties
  if (propertiesField.type.typeName === "navigation") {
    return;
  } else {
    classToPropertiesMapping.get(className)?.push({
      name: propertyName,
      label,
      type: propertiesField.properties[0].property.type,
    });
  }
};

const extractStructProperties = (
  name: string,
  className: string,
  classToPropertiesMapping: Map<string, Property[]>,
  members: StructFieldMemberDescription[]
) => {
  for (const member of members) {
    if (member.type.valueFormat === PropertyValueFormat.Primitive) {
      if (!classToPropertiesMapping.has(className)) {
        classToPropertiesMapping.set(className, []);
      }

      classToPropertiesMapping.get(className)?.push({
        name: `${name}.${member.name}`,
        label: member.label,
        type: member.type.typeName,
      });
    } else if (member.type.valueFormat === PropertyValueFormat.Struct) {
      extractStructProperties(
        `${name}.${member.name}`,
        className,
        classToPropertiesMapping,
        member.type.members
      );
    }
  }
};

const extractProperties = (
  properties: Field[],
  classToPropertiesMapping: Map<string, Property[]>,
  navigation?: NavigationProperty
) => {
  for (const property of properties) {
    switch (property.type.valueFormat) {
      case PropertyValueFormat.Primitive: {
        extractPrimitive(
          property as PropertiesField,
          classToPropertiesMapping,
          navigation
        );
        break;
      }
      // Get structs
      case PropertyValueFormat.Struct: {
        const nestedContentField = property as NestedContentField;
        // Only handling single path and not handling nested content fields within navigations
        if (
          nestedContentField.pathToPrimaryClass &&
          nestedContentField.pathToPrimaryClass.length > 1
        ) {
          break;
        }

        switch (nestedContentField.relationshipMeaning) {
          case RelationshipMeaning.SameInstance: {
            // Check for aspects. Ignore them if coming from navigation.
            if (
              !navigation &&
              (nestedContentField.pathToPrimaryClass[0].relationshipInfo
                .name === "BisCore:ElementOwnsUniqueAspect" ||
                nestedContentField.pathToPrimaryClass[0].relationshipInfo
                  .name === "BisCore:ElementOwnsMultiAspects")
            ) {
              const className = nestedContentField.contentClassInfo.name;
              if (!classToPropertiesMapping.has(className)) {
                classToPropertiesMapping.set(className, []);
              }

              extractProperties(
                nestedContentField.nestedFields,
                classToPropertiesMapping,
                navigation
              );
            }

            break;
          }
          // Navigation properties
          case RelationshipMeaning.RelatedInstance: {
            if (
              // Deal with a TypeDefinition
              nestedContentField.pathToPrimaryClass[0].relationshipInfo.name ===
              "BisCore:GeometricElement3dHasTypeDefinition"
            ) {
              const className =
                nestedContentField.pathToPrimaryClass[0].targetClassInfo.name;
              extractProperties(
                nestedContentField.nestedFields,
                classToPropertiesMapping,
                {
                  navigationName: "TypeDefinition",
                  rootClassName: className,
                }
              );
              // Hardcoded BisCore navigation properties for the type definition.
              classToPropertiesMapping.get(className)?.push({
                name: "TypeDefinition.Model.ModeledElement.UserLabel",
                label: "Model UserLabel (TypeDefinition)",
                type: "string",
              });

              classToPropertiesMapping.get(className)?.push({
                name: "TypeDefinition.Model.ModeledElement.CodeValue",
                label: "Model CodeValue (TypeDefinition)",
                type: "string",
              });

            }
            break;
          }
          default: {
            // Some elements don't have a path to primary class or relationship meaning..
            // Most likely a simple struct property
            if (!nestedContentField.pathToPrimaryClass) {
              const columnName = (property as PropertiesField).properties[0]
                .property.name;
              const className = (property as PropertiesField).properties[0]
                .property.classInfo.name;
              extractStructProperties(
                navigation
                  ? `${navigation.navigationName}.${columnName}`
                  : columnName,
                navigation ? navigation.rootClassName : className,
                classToPropertiesMapping,
                property.type.members
              );

            }
          }
        }
      }
    }
  }
};

const GroupPropertyValidateAction = ({
  iModelId,
  mappingId,
  groupId,
  groupPropertyId,
  groupPropertyName,
  keySet,
  returnFn,
}: GroupPropertyValidateActionProps) => {
  const iModelConnection = useActiveIModelConnection() as IModelConnection;
  const apiContext = useContext(ApiContext);
  const [validationType, setValidationType] = useState<string>("Range");
  const [upperBound, setUpperBound] = useState<string>("");
  const [lowerBound, setLowerBound] = useState<string>("");
  const [ecProperties, setEcProperties] = useState<ECProperty[]>(
    []
  );
  const [resultId, setResultId] = useState<
  string | undefined
  >(undefined);
  const [propertyValidationClient, setPropertyValidationClient] = useState<
  PropertyValidationClient | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  useEffect(() => {
    const getContent = async () => {
      setIsLoading(true);
      const ruleSet: Ruleset = {
        id: "element-properties",
        rules: [
          {
            ruleType: RuleTypes.Content,
            specifications: [
              {
                specType: ContentSpecificationTypes.SelectedNodeInstances,
              },
            ],
          }],
      };
      const requestOptions: ContentDescriptorRequestOptions<
      IModelConnection,
      KeySet,
      RulesetVariable
      > = {
        imodel: iModelConnection,
        keys: keySet,
        rulesetOrId: ruleSet,
        displayType: DefaultContentDisplayTypes.PropertyPane,
      };
      const content = await Presentation.presentation.getContentDescriptor(
        requestOptions
      );

      // Only primitives and structs for now
      const properties =
        content?.fields.filter(
          (field) =>
            field.type.valueFormat === PropertyValueFormat.Primitive ||
            field.type.valueFormat === PropertyValueFormat.Struct
        ) ?? [];

      // Map properties to their classes
      const classToPropertiesMapping = new Map<string, Property[]>();

      extractProperties(properties, classToPropertiesMapping);

      let newEcProperties: ECProperty[];
      const reportingClientApi = new ReportingClient(apiContext.prefix);
      // Fetch already existing ec properties then add all classes from presentation
      if (groupPropertyId) {
        // TODO Error handling
        const response = await reportingClientApi.getGroupProperty(
          apiContext.accessToken,
          iModelId,
          mappingId,
          groupId,
          groupPropertyId
        );
        newEcProperties = response.property?.ecProperties ?? [];
      } else {
        newEcProperties = Array.from(classToPropertiesMapping)
          .map(([key]) => ({
            ecSchemaName: key.split(":")[0],
            ecClassName: key.split(":")[1],
            // Placeholders for properties
            ecPropertyName: "",
            ecPropertyType: "",
          }))
          .reverse();
      }

      setEcProperties(newEcProperties);

      setIsLoading(false);
    };
    void getContent();
  }, [apiContext.accessToken, apiContext.prefix, groupId, groupPropertyId, iModelConnection, iModelId, keySet, mappingId]);

  const onValidate = async () => {
    setResultId(undefined);
    setIsLoading(true);
    const projectId = iModelConnection.iTwinId!;
    const iModelId = iModelConnection.iModelId!;
    const options: PropertyValidationClientOptions = {};
    const accessTokenCallback = async () => apiContext.accessToken;
    const propertyValidationClient: PropertyValidationClient = new PropertyValidationClient(options, accessTokenCallback);
    setPropertyValidationClient(propertyValidationClient);

    const paramsToGetTemplateList: ParamsToGetTemplateList = {
      urlParams: {
        projectId
      },
    };
    const templatesIterator: EntityListIterator<RuleTemplate> = propertyValidationClient.templates.getList(paramsToGetTemplateList);
    const templates: RuleTemplate[] = await take(templatesIterator, 100);
    let templateId: string = "";
    for (const template of templates) {
      if (template.displayName === "PropertyValueRange") {
        templateId = template.id;
        break;
      }
    }

    const ecProperty: string = ecProperties[0].ecPropertyName!;
    const ecSchema: string = ecProperties[0].ecSchemaName!;
    const ecClass: string = ecProperties[0].ecClassName!;

    const paramsToCreateRule: ParamsToCreateRule = {
      templateId,
      displayName: "GMTestRule1",
      description: "G&M Test rule 1",
      severity: "medium",
      ecSchema,
      ecClass,
      whereClause: "",
      dataType: "property",
      functionParameters: {
        propertyName: ecProperty,
        upperBound,
        lowerBound,
      },
    };
    const rule: Rule = await propertyValidationClient.rules.create(paramsToCreateRule);
    const paramsToCreateTest: ParamsToCreateTest = {
      projectId,
      displayName: "GMTest1",
      description: "G&M Test 1",
      stopExecutionOnFailure: false,
      rules: [ rule.id ],
    };
    const test: Test = await propertyValidationClient.tests.create(paramsToCreateTest);

    const paramsToRunTest: ParamsToRunTest = {
      testId: test.id,
      iModelId,
    };
    const run: Run | undefined = await propertyValidationClient.tests.runTest(paramsToRunTest);
    const paramsToGetRun: ParamsToGetRun = {
      runId: run!.id,
    };
    const pause = async (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
    let runDetails: RunDetails;
    do {
      await pause(10000);
      runDetails = await propertyValidationClient.runs.getSingle(paramsToGetRun);
    } while (runDetails.status !== "completed");

    setResultId(runDetails.resultId);

    const paramsToDeleteRule: ParamsToDeleteRule = {
      ruleId: rule.id,
    };
    await propertyValidationClient.rules.delete(paramsToDeleteRule);

    const paramsToDeleteTest: ParamsToDeleteTest = {
      testId: test.id,
    };
    await propertyValidationClient.tests.delete(paramsToDeleteTest);

    setIsLoading(false);

    // const paramsToDeleteRun: ParamsToDeleteRun = {
    //   runId: run!.id,
    // };
    // await propertyValidationClient.runs.delete(paramsToDeleteRun);
  };

  return (
    <>
      <WidgetHeader
        title={groupPropertyName ?? "Validate Property"}
        returnFn={returnFn}
      />
      <div className='group-property-validate-action-container'>
        <Fieldset className='property-options' legend='Validation Details'>
          <Small className='field-legend'>
            Asterisk * indicates mandatory fields.
          </Small>
          <LabeledSelect<string>
            label='Validation Type'
            disabled={isLoading}
            required
            options={validationTypeSelectionOptions}
            value={validationType}
            onChange={setValidationType}
            onShow={() => { }}
            onHide={() => { }}
          />
          <LabeledInput
            id='lowerBound'
            label='Lower Bound'
            value={lowerBound}
            required
            disabled={isLoading}
            onChange={(event) => {
              setLowerBound(event.target.value);
            }}
          />
          <LabeledInput
            id='upperBound'
            label='Upper Bound'
            value={upperBound}
            required
            disabled={isLoading}
            onChange={(event) => {
              setUpperBound(event.target.value);
            }}
          />
          <Fieldset className='property-options' legend='Results'>
            <ValidateResultsTable
              propertyValidationClient={propertyValidationClient!}
              resultId={resultId}
              isLoading={isLoading}
            />
          </Fieldset>
        </Fieldset>
      </div>
      {/* TODO: Disable when no properties are selected. Will do when I rework property selection. */}
      <ValidateActionPanel
        onValidate={onValidate}
        onCancel={returnFn}
        isLoading={isLoading}
        isValidateDisabled={!(validationType && lowerBound && upperBound)}
      />
    </>
  );
};

export default GroupPropertyValidateAction;
