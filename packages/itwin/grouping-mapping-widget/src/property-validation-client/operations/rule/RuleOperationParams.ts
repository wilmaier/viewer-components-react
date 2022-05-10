/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AuthorizationParam, CollectionRequestParams, FunctionParameters } from "../../base/interfaces/CommonInterfaces";

/** Url parameters supported in Rule list query. */
export interface ParamsToGetRuleListUrl extends CollectionRequestParams {
  /** Filters Rules for a specific project. */
  projectId: string;
}

/** Parameters for get Rule list operation. */
export interface ParamsToGetRuleList extends AuthorizationParam {
  /** Parameters that will be appended to the entity list request url that will narrow down the results. */
  urlParams?: ParamsToGetRuleListUrl;
}

/** Parameters for get single Rule operation. */
export interface ParamsToGetRule extends AuthorizationParam {
  /** Rule id. */
  ruleId: string;
}

/** Parameters for delete single Rule operation. */
export type ParamsToDeleteRule = ParamsToGetRule;

/** Parameters for create Rule operation. */
export interface ParamsToCreateRule extends AuthorizationParam {
  /** Rule template id. */
  templateId: string;
  /** Rule display name. */
  displayName: string;
  /** Rule description. */
  description: string;
  /** EC class of Rule. */
  ecClass: string;
  /** EC schema of Rule. */
  ecSchema: string;
  /** Where clause of Rule. */
  whereClause: string;
  /** Rule severity ('low', 'medium', 'high', 'veryHigh'). */
  severity: string;
  /** Data type of Rule ('property', 'aspect', 'typeDefinition'). */
  dataType: string;
  /** Rule function parameters. */
  functionParameters: FunctionParameters;
}

/** Parameters for update Rule operation. */
export interface ParamsToUpdateRule extends ParamsToGetRule {
  /** Rule display name. */
  displayName: string;
  /** Rule description. */
  description: string;
  /** EC class of Rule. */
  ecClass: string;
  /** EC schema of Rule. */
  ecSchema: string;
  /** Where clause of Rule. */
  whereClause: string;
  /** Rule severity ('low', 'medium', 'high', 'veryHigh'). */
  severity: string;
}
