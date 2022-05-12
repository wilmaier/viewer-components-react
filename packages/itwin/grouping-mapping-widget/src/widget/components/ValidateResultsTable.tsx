/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  Table,
} from "@itwin/itwinui-react";
import { EmphasizeElements, IModelApp } from "@itwin/core-frontend";
import { ColorDef,  FeatureOverrideType } from "@itwin/core-common";
import React, { useMemo, useState } from "react";
import type { CreateTypeFromInterface } from "../utils";
import type { CellProps } from "react-table";
import { ResponseFromGetResult, ResultDetails } from "../../property-validation-client/base";
import { LoadingSpinner } from "./utils";

export type ValidateResultType = CreateTypeFromInterface<ResultDetails>;

interface ValidateResultTableProps {
  validateResults: ResponseFromGetResult | undefined,
  isLoading: boolean,
}

const ValidateResultsTable = ({
  validateResults,
  isLoading,
}: ValidateResultTableProps) => {
  const [selectedRow, setSelectedRow] = useState<any>();

  const onValidateResultRowClick = useMemo(
    () => (_: any, row: any) => {
      if (row.original === selectedRow) {
        row.toggleRowSelected(false);
      } else {
        row.toggleRowSelected(true);
        const vp = IModelApp.viewManager.selectedView;
        if (vp) {
          const elementId = row.original?.elementId;
          vp.iModel.selectionSet.replace(elementId);
          const emph = EmphasizeElements.getOrCreate(vp);
          emph.overrideElements(elementId, vp, ColorDef.red, FeatureOverrideType.ColorOnly, true);
          emph.wantEmphasis = true;
          emph.emphasizeElements([elementId], vp, undefined, true);
          vp.zoomToElements([elementId], { animateFrustumChange: true });
        }
      }
      setSelectedRow(row.original);
    },
    [setSelectedRow]
  );

  //Single select
  const tableStateSingleSelectReducer = (newState: any, action: any): any => {
    switch (action.type) {
      case 'toggleRowSelected': {
        return { ...newState, selectedRowIds: { [action.id]: action.value } };
      }
      default:
        break;
    }
    return newState;
  };

  const validateResultColumns = useMemo(
    () => [
      {
        Header: "Table",
        columns: [
          {
            id: "elementLabel",
            Header: "Element Label",
            accessor: "elementLabel",
            Cell: (value: CellProps<ResultDetails>) => (
              <div className='iui-anchor'>
                {value.row.original.elementLabel}
              </div>
            ),
          },
          {
            id: "rule",
            Header: "Rule",
            accessor: "ruleIndex",
            Cell: (value: CellProps<ResultDetails>) => (
              <div className='iui-anchor'>
                {value.row.original.ruleIndex}
              </div>
            ),
          },
          {
            id: "value",
            Header: "Value",
            accessor: "badValue",
            Cell: (value: CellProps<ResultDetails>) => (
              <div className='iui-anchor'>
                {value.row.original.badValue}
              </div>
            ),
          },
        ],
      },
    ],
    [],
  );

  return (
    <>
      {isLoading &&
        <LoadingSpinner />
      }
      {!isLoading && <Table<ValidateResultType>
        data={validateResults ? validateResults.result : []}
        density='extra-condensed'
        columns={validateResultColumns}
        emptyTableContent='No Results'
        isSortable
        isLoading={isLoading}
        stateReducer={tableStateSingleSelectReducer}
        onRowClick={onValidateResultRowClick}
        selectRowOnClick={true}
      />}
    </>
  );
};

export default ValidateResultsTable;
