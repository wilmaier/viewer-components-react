/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Result details. */
export interface ResultDetails {
  /** Element id. */
  elementId: string;
  /** Element display name. */
  elementLabel: string;
  /** Rule index. */
  ruleIndex: string;
  /** Result value. */
  badValue: string;
}

/** Rule details. */
export interface RuleList {
  /** Rule id. */
  id: string;
  /** Rule display name. */
  displayName: string;
}

/** Get Result API response. */
export interface ResponseFromGetResult {
  /* Results of property validation test run */
  result: ResultDetails[];
  /* List of rules referenced in ResultDetails by ruleIndex */
  ruleList: RuleList[];
}
