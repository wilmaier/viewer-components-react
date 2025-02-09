/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  SvgAdd,
  SvgCheckmark,
  SvgDelete,
  SvgEdit,
  SvgMore,
} from "@itwin/itwinui-icons-react";
import {
  Button,
  DropdownMenu,
  IconButton,
  MenuItem,
  Table,
} from "@itwin/itwinui-react";
import React, { useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CreateTypeFromInterface } from "../utils";
import type { CellProps } from "react-table";
import DeleteModal from "./DeleteModal";
import { PropertyMenuView } from "./PropertyMenu";
import { handleError } from "./utils";
import type { GroupProperty } from "@itwin/insights-client";
import { ReportingClient } from "@itwin/insights-client";
import type { Api } from "./GroupingMapping";
import { ApiContext } from "./GroupingMapping";

export type GroupPropertyType = CreateTypeFromInterface<GroupProperty>;

const fetchGroupProperties = async (
  setGroupProperties: React.Dispatch<React.SetStateAction<GroupPropertyType[]>>,
  iModelId: string,
  mappingId: string,
  groupId: string,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>,
  apiContext: Api
) => {
  try {
    setIsLoading(true);
    const reportingClientApi = new ReportingClient(apiContext.prefix);
    const groupProperties = await reportingClientApi.getGroupProperties(
      apiContext.accessToken,
      iModelId,
      mappingId,
      groupId,
    );
    setGroupProperties(groupProperties);
  } catch (error: any) {
    handleError(error.status);
  } finally {
    setIsLoading(false);
  }
};

interface GroupPropertyTableProps {
  iModelId: string;
  mappingId: string;
  groupId: string;

  setSelectedGroupProperty: React.Dispatch<
  React.SetStateAction<
  CreateTypeFromInterface<GroupProperty> | undefined
  >
  >;
  setGroupModifyView: React.Dispatch<React.SetStateAction<PropertyMenuView>>;
  onGroupPropertyValidate: (value: CellProps<GroupProperty>) => void;
  onGroupPropertyModify: (value: CellProps<GroupPropertyType>) => void;
  selectedGroupProperty?: GroupPropertyType;
}

const GroupPropertyTable = ({
  iModelId,
  mappingId,
  groupId,
  selectedGroupProperty,
  onGroupPropertyValidate,
  onGroupPropertyModify,
  setSelectedGroupProperty,
  setGroupModifyView,
}: GroupPropertyTableProps) => {
  const apiContext = useContext(ApiContext);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [showGroupPropertyDeleteModal, setShowGroupPropertyDeleteModal] =
    useState<boolean>(false);
  const [groupProperties, setGroupProperties] = useState<GroupPropertyType[]>([]);

  useEffect(() => {
    void fetchGroupProperties(
      setGroupProperties,
      iModelId,
      mappingId,
      groupId,
      setIsLoading,
      apiContext
    );
  }, [apiContext, groupId, iModelId, mappingId, setIsLoading]);

  const refresh = useCallback(async () => {
    setGroupProperties([]);
    await fetchGroupProperties(
      setGroupProperties,
      iModelId,
      mappingId,
      groupId,
      setIsLoading,
      apiContext
    );
  }, [apiContext, groupId, iModelId, mappingId, setGroupProperties]);

  const groupPropertiesColumns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: "propertyName",
            Header: "Property",
            accessor: "propertyName",
            Cell: (value: CellProps<GroupPropertyType>) => (
              <div
                className='iui-anchor'
                onClick={() => onGroupPropertyModify(value)}
              >
                {value.row.original.propertyName}
              </div>
            ),
          },
          {
            id: "dropdown",
            Header: "",
            width: 80,
            Cell: (value: CellProps<GroupPropertyType>) => {
              return (
                <DropdownMenu
                  menuItems={(close: () => void) => [
                    <MenuItem
                      key={0}
                      onClick={() => onGroupPropertyValidate(value)}
                      icon={<SvgCheckmark />}
                    >
                      Validate
                    </MenuItem>,
                    <MenuItem
                      key={1}
                      onClick={() => onGroupPropertyModify(value)}
                      icon={<SvgEdit />}
                    >
                      Modify
                    </MenuItem>,
                    <MenuItem
                      key={2}
                      onClick={() => {
                        setSelectedGroupProperty(value.row.original);
                        setShowGroupPropertyDeleteModal(true);
                        close();
                      }}
                      icon={<SvgDelete />}
                    >
                      Remove
                    </MenuItem>,
                  ]}
                >
                  <IconButton styleType='borderless'>
                    <SvgMore
                      style={{
                        width: "16px",
                        height: "16px",
                      }}
                    />
                  </IconButton>
                </DropdownMenu>
              );
            },
          },
        ],
      },
    ],
    [onGroupPropertyValidate, onGroupPropertyModify, setSelectedGroupProperty],
  );

  return (
    <>
      <Button
        startIcon={<SvgAdd />}
        styleType='high-visibility'
        onClick={() => {
          setGroupModifyView(PropertyMenuView.ADD_GROUP_PROPERTY);
        }}
      >
        Add Validation Property
      </Button>
      <Table<GroupPropertyType>
        data={groupProperties}
        density='extra-condensed'
        columns={groupPropertiesColumns}
        emptyTableContent='No Group Properties'
        isSortable
        isLoading={isLoading}
      />
      <DeleteModal
        entityName={selectedGroupProperty?.propertyName ?? ""}
        show={showGroupPropertyDeleteModal}
        setShow={setShowGroupPropertyDeleteModal}
        onDelete={async () => {
          const reportingClientApi = new ReportingClient(apiContext.prefix);
          await reportingClientApi.deleteGroupProperty(
            apiContext.accessToken,
            iModelId,
            mappingId,
            groupId,
            selectedGroupProperty?.id ?? "",
          );
        }}
        refresh={refresh}
      />
    </>
  );
};

export default GroupPropertyTable;
