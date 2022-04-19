/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { useActiveIModelConnection } from "@itwin/appui-react";
import {
  SvgAdd,
  SvgDelete,
  SvgEdit,
  SvgImport,
  SvgMore,
} from "@itwin/itwinui-icons-react";
import type {
  TablePaginatorRendererProps,
} from "@itwin/itwinui-react";
import {
  Button,
  ButtonGroup,
  DropdownMenu,
  IconButton,
  LabeledInput,
  MenuItem,
  Table,
  Text,
  tableFilters,
  TablePaginator,
} from "@itwin/itwinui-react";
import type { CellProps } from "react-table";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import { CreateTypeFromInterface, EmptyMessage, LoadingOverlay } from "./utils";
import { handleError, WidgetHeader } from "./utils";
import "./Reports.scss";
import DeleteModal from "./DeleteModal";
import type { Report } from "../../reporting";
import { ReportingClient } from "../../reporting/reportingClient";
import { IModelApp } from "@itwin/core-frontend";
import ReportAction from "./ReportAction";
import { ReportMappings } from "./ReportMappings";
import { LocalizedTablePaginator } from "./LocalizedTablePaginator";
import { HorizontalTile } from "./HorizontalTile";
import { SearchBar } from "./SearchBar";

export type ReportType = CreateTypeFromInterface<Report>;

enum ReportsView {
  REPORTS = "reports",
  REPORTSMAPPING = "reportsmapping",
  ADDING = "adding",
  MODIFYING = "modifying",
}

const fetchReports = async (
  setReports: React.Dispatch<React.SetStateAction<Report[]>>,
  iTwinId: string | undefined,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
) => {
  try {
    if (!iTwinId) return;
    setIsLoading(true);
    const accessToken = (await IModelApp.authorizationClient?.getAccessToken()) ?? "";
    const reportingClientApi = new ReportingClient();
    const reports = await reportingClientApi.getReports(accessToken, iTwinId);
    setReports(reports.reports ?? []);
  } catch (error: any) {
    handleError(error.status);
  } finally {
    setIsLoading(false);
  }
};

const useFetchReports = (
  iTwinId: string | undefined,
  setIsLoading: React.Dispatch<React.SetStateAction<boolean>>
): [
    Report[],
    React.Dispatch<React.SetStateAction<Report[]>>
  ] => {
  const [reports, setReports] = useState<Report[]>([]);
  useEffect(() => {
    void fetchReports(setReports, iTwinId, setIsLoading);
  }, [iTwinId, setIsLoading]);

  return [reports, setReports];
};

export const Reports = () => {
  const iTwinId = useActiveIModelConnection()?.iTwinId;
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [reportsView, setReportsView] = useState<ReportsView>(
    ReportsView.REPORTS
  );
  const [selectedReport, setSelectedReport] = useState<
    Report | undefined
  >(undefined);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [reports, setReports] = useFetchReports(iTwinId, setIsLoading);
  const [searchValue, setSearchValue] = useState<string>("");

  const refresh = useCallback(async () => {
    setReportsView(ReportsView.REPORTS);
    setSelectedReport(undefined);
    setReports([]);
    await fetchReports(setReports, iTwinId, setIsLoading);
  }, [iTwinId, setReports]);

  const addReport = () => {
    setReportsView(ReportsView.ADDING);
  };

  const filteredReports = useMemo(() => reports.filter((x) =>
    [x.displayName, x.description]
      .join(' ')
      .toLowerCase()
      .includes(searchValue.toLowerCase())), [reports, searchValue])


  switch (reportsView) {
    case ReportsView.ADDING:
      return iTwinId ? <ReportAction iTwinId={iTwinId ?? ""} returnFn={refresh} /> : null;
    case ReportsView.MODIFYING:
      return iTwinId ?
        <ReportAction
          iTwinId={iTwinId}
          report={selectedReport}
          returnFn={refresh}
        />
        : null;
    case ReportsView.REPORTSMAPPING:
      return selectedReport ? <ReportMappings report={selectedReport} goBack={refresh} /> : null;
    default:
      return (
        <>
          <WidgetHeader title={IModelApp.localization.getLocalizedString("ReportsWidget:ITwinReports")} />
          <div className="reports-list-container">
            <div className="toolbar">
              <Button
                startIcon={<SvgAdd />}
                onClick={() => addReport()}
                styleType="high-visibility"
              >
                {IModelApp.localization.getLocalizedString("ReportsConfigWidget:New")}
              </Button>
            </div>
            <div className="search-bar-container">
              <SearchBar searchValue={searchValue} setSearchValue={setSearchValue} disabled={isLoading} />
            </div>
            {isLoading ?
              <LoadingOverlay /> :
              reports.length === 0 ?
                <EmptyMessage>
                  <>
                    {IModelApp.localization.getLocalizedString("ReportsWidget:NoReports")}
                    <Text
                      className="iui-anchor"
                      onClick={() => addReport()}
                    > {IModelApp.localization.getLocalizedString("ReportsWidget:CreateOneReportCTA")}</Text>
                  </>
                </EmptyMessage> :
                <div className="reports-list">
                  {filteredReports.map((report) =>
                    <HorizontalTile
                      key={report.id}
                      title={report.displayName ?? ""}
                      subText={report.description ?? ""}
                      subtextToolTip={report.description ?? ""}
                      titleTooltip={report.displayName}
                      onClickTitle={() => {
                        setSelectedReport(report);
                        setReportsView(ReportsView.REPORTSMAPPING);
                      }}
                      button={
                        <DropdownMenu
                          menuItems={(close: () => void) => [
                            <MenuItem
                              key={0}
                              onClick={() => {
                                setSelectedReport(report);
                                setReportsView(ReportsView.MODIFYING);
                              }}
                              icon={<SvgEdit />}
                            >
                              {IModelApp.localization.getLocalizedString("ReportsWidget:Modify")}
                            </MenuItem>,
                            <MenuItem
                              key={1}
                              onClick={() => {
                                setSelectedReport(report);
                                setShowDeleteModal(true);
                                close();
                              }}
                              icon={<SvgDelete />}
                            >
                              {IModelApp.localization.getLocalizedString("ReportsWidget:Remove")}
                            </MenuItem>,
                          ]}
                        >
                          <IconButton styleType="borderless">
                            <SvgMore
                              style={{
                                width: "16px",
                                height: "16px",
                              }}
                            />
                          </IconButton>
                        </DropdownMenu>
                      }
                    />
                  )}
                </div>
            }

          </div>
          <DeleteModal
            entityName={selectedReport?.displayName ?? ""}
            show={showDeleteModal}
            setShow={setShowDeleteModal}
            onDelete={async () => {
              const accessToken = (await IModelApp.authorizationClient?.getAccessToken()) ?? "";
              const reportingClientApi = new ReportingClient();
              await reportingClientApi.deleteReport(
                accessToken,
                selectedReport?.id ?? ""
              );
            }}
            refresh={refresh}
          />
        </>
      );
  }
};
