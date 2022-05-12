/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import type { IModelConnection } from "@itwin/core-frontend";
import { Presentation } from "@itwin/presentation-frontend";
import { useActiveIModelConnection } from "@itwin/appui-react";
import React, { useCallback, useEffect, useState } from "react";

import { fetchIdsFromQuery, WidgetHeader } from "./utils";
import {
  clearEmphasizedElements,
  manufactureKeys,
  visualizeElements,
  visualizeElementsByKeys,
  zoomToElements,
} from "./viewerUtils";
import type { GroupType } from "./Grouping";
import "./PropertyMenu.scss";
import GroupPropertyAction from "./GroupPropertyAction";
import GroupPropertyValidateAction from "./GroupPropertyValidateAction";
import type { GroupPropertyType } from "./GroupPropertyTable";
import GroupPropertyTable from "./GroupPropertyTable";
import {
  IconButton,
  InformationPanel,
  InformationPanelBody,
  InformationPanelHeader,
  InformationPanelWrapper,
  LabeledTextarea,
  ProgressRadial,
  Text,
  toaster,
} from "@itwin/itwinui-react";
import type { CellProps } from "react-table";
import { KeySet } from "@itwin/presentation-common";
import { SvgProperties } from "@itwin/itwinui-icons-react";

interface PropertyModifyProps {
  iModelId: string;
  mappingId: string;
  group: GroupType;
  goBack: () => Promise<void>;
  hideGroupProps?: boolean;
}

export enum PropertyMenuView {
  DEFAULT = "default",
  ADD_GROUP_PROPERTY = "add_group_property",
  VALIDATE_GROUP_PROPERTY = "validate_group_property",
  MODIFY_GROUP_PROPERTY = "modify_group_property",
}

export const PropertyMenu = ({
  iModelId,
  mappingId,
  group,
  goBack,
  hideGroupProps = false,
}: PropertyModifyProps) => {
  const iModelConnection = useActiveIModelConnection() as IModelConnection;
  const [propertyMenuView, setPropertyMenuView] = useState<PropertyMenuView>(
    PropertyMenuView.DEFAULT,
  );
  const [selectedGroupProperty, setSelectedGroupProperty] = useState<
  GroupPropertyType | undefined
  >(undefined);
  const [isInformationPanelOpen, setIsInformationPanelOpen] =
    useState<boolean>(false);
  const [resolvedHiliteIds, setResolvedHiliteIds] = useState<string[]>([]);
  const [keySet, setKeySet] = useState<KeySet>();
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initialize = async () => {
      try {
        const ids = await fetchIdsFromQuery(group.query ?? "", iModelConnection);
        if (ids.length === 0) {
          toaster.warning("The query is valid but produced no results.");
          await goBack();
        }
        const keys = await manufactureKeys(ids, iModelConnection);
        setKeySet(keys);
        Presentation.selection.clearSelection(
          "GroupingMappingWidget",
          iModelConnection,
        );
        clearEmphasizedElements();
        const resolvedIds = await visualizeElementsByKeys(keys, "red");
        await zoomToElements(resolvedIds);
        setResolvedHiliteIds(resolvedIds);
        setIsLoading(false);
      } catch {
        toaster.negative(`Could not load ${group.groupName}.`);
        await goBack();
      }
    };
    void initialize();
  }, [iModelConnection, group.query, goBack, group.groupName]);

  const onGroupPropertyValidate = useCallback(
    (value: CellProps<GroupPropertyType>) => {
      setSelectedGroupProperty(value.row.original);
      setPropertyMenuView(PropertyMenuView.VALIDATE_GROUP_PROPERTY);
    },
    [],
  );

  const onGroupPropertyModify = useCallback(
    (value: CellProps<GroupPropertyType>) => {
      setSelectedGroupProperty(value.row.original);
      setPropertyMenuView(PropertyMenuView.MODIFY_GROUP_PROPERTY);
    },
    [],
  );

  if (isLoading) {
    return (
      <div className='loading-overlay'>
        <Text>Loading Group</Text>
        <ProgressRadial indeterminate />
        <Text>Please wait...</Text>
      </div>
    );
  }

  switch (propertyMenuView) {
    case PropertyMenuView.ADD_GROUP_PROPERTY:
      return (
        <GroupPropertyAction
          iModelId={iModelId}
          mappingId={mappingId}
          groupId={group.id ?? ""}
          keySet={keySet ?? new KeySet()}
          returnFn={async () => {
            setPropertyMenuView(PropertyMenuView.DEFAULT);
          }}
        />
      );
    case PropertyMenuView.VALIDATE_GROUP_PROPERTY:
      return (
        <GroupPropertyValidateAction
          iModelId={iModelId}
          mappingId={mappingId}
          groupId={group.id ?? ""}
          keySet={keySet ?? new KeySet()}
          groupPropertyId={selectedGroupProperty?.id ?? ""}
          groupPropertyName={selectedGroupProperty?.propertyName ?? ""}
          returnFn={async () => {
            setPropertyMenuView(PropertyMenuView.DEFAULT);
          }}
        />
      );
    case PropertyMenuView.MODIFY_GROUP_PROPERTY:
      return (
        <GroupPropertyAction
          iModelId={iModelId}
          mappingId={mappingId}
          groupId={group.id ?? ""}
          keySet={keySet ?? new KeySet()}
          groupPropertyId={selectedGroupProperty?.id ?? ""}
          groupPropertyName={selectedGroupProperty?.propertyName ?? ""}
          returnFn={async () => {
            setPropertyMenuView(PropertyMenuView.DEFAULT);
          }}
        />
      );
    default:
      return (
        <InformationPanelWrapper className='property-menu-wrapper'>
          <div className='property-header'>
            <WidgetHeader
              title={`${group.groupName ?? ""}`}
              returnFn={goBack}
            />
            <IconButton
              styleType='borderless'
              onClick={() => setIsInformationPanelOpen(true)}
            >
              <SvgProperties />
            </IconButton>
          </div>
          <div className='property-menu-container'>
            {!hideGroupProps && (
              <div className='property-table'>
                <GroupPropertyTable
                  iModelId={iModelId}
                  mappingId={mappingId}
                  groupId={group.id ?? ""}
                  onGroupPropertyValidate={onGroupPropertyValidate}
                  onGroupPropertyModify={onGroupPropertyModify}
                  setSelectedGroupProperty={setSelectedGroupProperty}
                  setGroupModifyView={setPropertyMenuView}
                  selectedGroupProperty={selectedGroupProperty}
                />
              </div>
            )}
          </div>
          <InformationPanel
            className='information-panel'
            isOpen={isInformationPanelOpen}
          >
            <InformationPanelHeader
              onClose={() => setIsInformationPanelOpen(false)}
            >
              <Text variant='subheading'>{`${group.groupName ?? ""
              } Information`}</Text>
            </InformationPanelHeader>
            <InformationPanelBody>
              <div className='information-body'>
                <LabeledTextarea
                  label='Query'
                  rows={15}
                  readOnly
                  defaultValue={group.query ?? ""}
                />
              </div>
            </InformationPanelBody>
          </InformationPanel>
        </InformationPanelWrapper>
      );
  }
};
