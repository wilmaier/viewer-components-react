/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import {
  Table,
} from "@itwin/itwinui-react";
import { EmphasizeElements, IModelApp, MarginOptions, MarginPercent, ViewChangeOptions } from "@itwin/core-frontend";
import { ColorDef,  FeatureOverrideType } from "@itwin/core-common";
import React, { useEffect, useMemo, useState } from "react";
import type { CreateTypeFromInterface } from "../utils";
import type { CellProps } from "react-table";
import { PropertyValidationClient } from "../../property-validation-client/PropertyValidationClient";
import { ParamsToGetResult } from "../../property-validation-client/operations";
import { ResponseFromGetResult, ResultDetails } from "../../property-validation-client/base";
import { handleError, LoadingSpinner } from "./utils";

export type ValidateResultType = CreateTypeFromInterface<ResultDetails>;

const fetchValidateResults = async (
  propertyValidationClient: PropertyValidationClient | undefined,
  resultId: string | undefined,
  setValidateResults: React.Dispatch<React.SetStateAction<ValidateResultType[]>>,
) => {
  try {
    if (propertyValidationClient && resultId) {
      const paramsToGetResult: ParamsToGetResult = {
        resultId,
      };
      const validateResults: ResponseFromGetResult = await propertyValidationClient.results.get(paramsToGetResult);
      // Replace ruleIndex in results with rule display name
      for (const result of validateResults.result) {
        const index = +result.ruleIndex;
        result.ruleIndex = validateResults.ruleList[index].displayName;
      }
      setValidateResults(validateResults.result);
    }
  } catch (error: any) {
    handleError(error.status);
  }
};

interface ValidateResultTableProps {
  propertyValidationClient: PropertyValidationClient | undefined,
  resultId: string | undefined,
  isLoading: boolean,
}

const ValidateResultsTable = ({
  propertyValidationClient,
  resultId,
  isLoading,
}: ValidateResultTableProps) => {
  const [validateResults, setValidateResults] = useState<ValidateResultType[]>([]);
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
          emph.overrideElements(
            [elementId],
            vp,
            ColorDef.fromString("red"),
            FeatureOverrideType.ColorOnly,
            true,
          );
          emph.wantEmphasis = true;
          emph.emphasizeElements([elementId], vp, undefined, true);
          const viewChangeOpts: ViewChangeOptions & MarginOptions = {};
          viewChangeOpts.animateFrustumChange = true;
          viewChangeOpts.marginPercent = new MarginPercent(0.25, 0.25, 0.25, 0.25);
          vp.zoomToElements([elementId], { ...viewChangeOpts });
        }
      }
      setSelectedRow(row.original);
    },
    [setSelectedRow]
  );

  useEffect(() => {

    void fetchValidateResults(
      propertyValidationClient,
      resultId,
      setValidateResults,
    );
  }, [propertyValidationClient, resultId]);

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
        data={validateResults}
        density='extra-condensed'
        columns={validateResultColumns}
        emptyTableContent='No Validation Results'
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
