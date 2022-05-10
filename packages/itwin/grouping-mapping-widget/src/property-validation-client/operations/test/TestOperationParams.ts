/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams } from "../../base/interfaces/CommonInterfaces";

/** Url parameters supported in Test list query. */
export interface ParamsToGetTestListUrl extends CollectionRequestParams {
  /** Filters Tests for a specific project. */
  projectId: string;
}

/** Parameters for get Test list operation. */
export interface ParamsToGetTestList extends AuthorizationParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: ParamsToGetTestListUrl;
}

/** Parameters for get single Test operation. */
export interface ParamsToGetTest extends AuthorizationParam {
  /** Test id. */
  testId: string;
}

/** Parameters for delete Test operation. */
export type ParamsToDeleteTest = ParamsToGetTest;

/** Parameters for create Test operation. */
export interface ParamsToCreateTest extends AuthorizationParam {
  /** Project id to associate with test. */
  projectId: string;
  /** Test display name. */
  displayName: string;
  /** Test description. */
  description: string;
  /** Stop execution on failure flag. */
  stopExecutionOnFailure: boolean;
  /** Array of rule ids to associate with test. */
  rules: string[];
}

/** Parameters for update Test operation. */
export interface ParamsToUpdateTest extends ParamsToGetTest {
  /** Test display name. */
  displayName: string;
  /** Test description. */
  description: string;
  /** Stop execution on failure flag. */
  stopExecutionOnFailure: boolean;
  /** Array of rule ids to associate with test. */
  rules: string[];
}

/** Parameters for Run Test operation. */
export interface ParamsToRunTest extends AuthorizationParam {
  /** Test id. */
  testId: string;
  /** iModel id. */
  iModelId: string;
  /** Named version id. */
  namedVersionId?: string;
}
