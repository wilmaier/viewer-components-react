/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { PropertyValidationClient, PropertyValidationClientOptions } from "@itwin/property-validation-client";
import { take } from "@itwin/property-validation-client";
import { EntityListIterator } from "@itwin/property-validation-client";
import { ResponseFromGetResult, Rule, RuleTemplate, Run, RunDetails, Test } from "@itwin/property-validation-client";
import {
  ParamsToCreateRule,
  ParamsToCreateTest,
  ParamsToDeleteRule,
  ParamsToDeleteRun,
  ParamsToDeleteTest,
  ParamsToGetResult,
  ParamsToGetRun,
  ParamsToGetTemplateList,
  ParamsToRunTest,
} from "@itwin/property-validation-client";
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
  { value: "PropertyValueRange", label: "Within Range" },
  { value: "PropertyValueAtMost", label: "Value At Most" },
  { value: "PropertyValueAtLeast", label: "Value At Least" },
  { value: "PropertyValueDefined", label: "Value Is Set" },
  { value: "PropertyValueUnique", label: "Value Unique" },
  { value: "PropertyValueSumAtLeast", label: "Value Sum At Least" },
  { value: "PropertyValueSumAtMost", label: "Value Sum At Most" },
  { value: "PropertyValueSumRange", label: "Value Sum in Range" },
  { value: "PropertyValueCountAtLeast", label: "Element Count At Least" },
  { value: "PropertyValueCountAtMost", label: "Element Count At Most" },
  { value: "PropertyValueCountRange", label: "Element Count in Range" },
  { value: "PropertyValuePattern", label: "Matches Pattern" },
  { value: "PropertyValuePercentAvailable", label: "Percent of Elements Where Value Is Set" },
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
  const [validationType, setValidationType] = useState<string>("");
  const [pattern, setPattern] = useState<string>("");
  const [upperBound, setUpperBound] = useState<string>("");
  const [lowerBound, setLowerBound] = useState<string>("");
  const [ecProperties, setEcProperties] = useState<ECProperty[]>(
    []
  );
  const [validateResults, setValidateResults] = useState<
  ResponseFromGetResult | undefined
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
    setValidateResults(undefined);
    setIsLoading(true);
    const projectId = iModelConnection.iTwinId!;
    const iModelId = iModelConnection.iModelId!;
    const options: PropertyValidationClientOptions = {};
    const accessTokenCallback = async () => apiContext.accessToken;
    const propertyValidationClient: PropertyValidationClient = new PropertyValidationClient(options, accessTokenCallback);
    const paramsToGetTemplateList: ParamsToGetTemplateList = {
      urlParams: {
        projectId
      },
    };
    const templatesIterator: EntityListIterator<RuleTemplate> = propertyValidationClient.templates.getList(paramsToGetTemplateList);
    const templates: RuleTemplate[] = await take(templatesIterator, 100);
    let templateId: string = "";
    for (const template of templates) {
      if (template.displayName === validationType) {
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
        pattern,
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
      await pause(5000);
      runDetails = await propertyValidationClient.runs.getSingle(paramsToGetRun);
    } while (runDetails.status !== "completed");

    const paramsToGetResult: ParamsToGetResult = {
      resultId: runDetails.resultId,
    };
    const validateResults: ResponseFromGetResult = await propertyValidationClient.results.get(paramsToGetResult);
    // Replace ruleIndex in results with rule display name
    for (const result of validateResults.result) {
      const index = +result.ruleIndex;
      result.ruleIndex = validateResults.ruleList[index].displayName;
    }
    setValidateResults(validateResults);

    const paramsToDeleteRule: ParamsToDeleteRule = {
      ruleId: rule.id,
    };
    await propertyValidationClient.rules.delete(paramsToDeleteRule);

    const paramsToDeleteTest: ParamsToDeleteTest = {
      testId: test.id,
    };
    await propertyValidationClient.tests.delete(paramsToDeleteTest);

    setIsLoading(false);

    const paramsToDeleteRun: ParamsToDeleteRun = {
      runId: run!.id,
    };
    await propertyValidationClient.runs.delete(paramsToDeleteRun);
  };

  const showLowerBound = new Set<string>(
    ["PropertyValueRange", "PropertyValueCountRange", "PropertyValueSumRange", "PropertyValueAtLeast", "PropertyValueCountAtLeast", "PropertyValueSumAtLeast"]
  );
  const showUpperBound = new Set<string>(
    ["PropertyValueRange", "PropertyValueCountRange", "PropertyValueSumRange", "PropertyValueAtMost", "PropertyValueCountAtMost", "PropertyValueSumAtMost"]
  );
  const showMeters = new Set<string>(
    ["PropertyValueRange", "PropertyValueSumRange", "PropertyValueAtMost", "PropertyValueSumAtMost", "PropertyValueAtLeast", "PropertyValueSumAtLeast"]
    );
  const metersLabel = showMeters.has(validationType) ? " (in meters)" : "";
  const lowerBoundLabel = "Lower Limit" + metersLabel;
  const upperBoundLabel = "Upper Limit" + metersLabel;

  let resultTitle = "Result";
  if (validationType !== "PropertyValuePercentAvailable") {
    resultTitle = "Failures";
    if (validateResults) {
      resultTitle += " (" + validateResults.result.length + ")";
    }
  }

  return (
    <>
      <WidgetHeader
        title={groupPropertyName ?? "Validate Property"}
        returnFn={returnFn}
      />
      <div className='group-property-validate-action-container'>
        <Fieldset className='property-options' legend='Validation Criteria'>
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
          {showLowerBound.has(validationType) &&
            <LabeledInput
              id='lowerBound'
              label={lowerBoundLabel}
              value={lowerBound}
              required
              disabled={isLoading}
              onChange={(event) => {
                setLowerBound(event.target.value);
              }}
            />
          }
          {showUpperBound.has(validationType) &&
            <LabeledInput
              id='upperBound'
              label={upperBoundLabel}
              value={upperBound}
              required
              disabled={isLoading}
              onChange={(event) => {
                setUpperBound(event.target.value);
              }}
            />}
          {validationType === "PropertyValuePattern" &&
            <LabeledInput
              id='pattern'
              label='Pattern'
              value={pattern}
              required
              disabled={isLoading}
              onChange={(event) => {
                setPattern(event.target.value);
              }}
            />
          }
          <ValidateActionPanel
            onValidate={onValidate}
            onCancel={returnFn}
            isLoading={isLoading}
            isValidateDisabled={!validationType ||
              (showLowerBound.has(validationType) && !lowerBound) ||
              (showUpperBound.has(validationType) && !upperBound) ||
              (validationType === "PropertyValuePattern" && !pattern)}
          />
          <Fieldset className='property-options'>
            <legend>{resultTitle}</legend>
            <ValidateResultsTable
              validateResults={validateResults}
              isLoading={isLoading}
            />
          </Fieldset>
        </Fieldset>
      </div>
      </>
  );
};

export default GroupPropertyValidateAction;
