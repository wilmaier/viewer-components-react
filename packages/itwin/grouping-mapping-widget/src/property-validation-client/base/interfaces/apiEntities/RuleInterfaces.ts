/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CollectionResponse, FunctionParameters, Link } from "../CommonInterfaces";

/** Links that belong to Rule entity returned from Property Validation API. */
export interface RuleDetailLink {
  /** Link to get complete Rule details. */
  rule: Link;
}

export interface RuleUserInfoLinks {
  /** Link to get user info of creator. */
  createdBy: Link;
  /** Link to get user info of last modifier. */
  lastModifiedBy: Link;
}

export interface RuleSelfLink {
  /** Link to get created/updated rule. */
  self: Link;
}

/** Minimal representation of a Rule. */
export interface MinimalRule {
  /** Rule id. */
  id: string;
  /** Rule display name. */
  displayName: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: RuleDetailLink;
}

/** Full representation of a Rule. */
export interface RuleDetails {
  /** Rule id. */
  id: string;
  /** Rule display name. */
  displayName: string;
  /** Rule description. */
  description: string;
  /** Rule creation date/time. */
  creationDateTime: string;
  /** Rule modification date/time. */
  modificationDateTime: string;
  /** Rule template id. */
  templateId: string;
  /** Rule function parameters. */
  functionParameters: FunctionParameters;
  /** Rule severity ('low', 'medium', 'high', 'veryHigh'). */
  severity: string;
  /** EC schema of Rule. */
  ecSchema: string;
  /** EC class of Rule. */
  ecClass: string;
  /** Where clause of Rule. */
  whereClause?: string;
  /** Function name of Rule. */
  functionName: string;
  /** Data type of Rule ('property', 'aspect', 'typeDefinition'). */
  dataType: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: RuleUserInfoLinks;
}

/** Get Rule API response. */
export interface ResponseFromGetRule {
  rule: RuleDetails;
}

/** Minimal Rule list API response. */
export interface ResponseFromGetRuleListMinimal extends CollectionResponse {
  rules: MinimalRule[];
}

/** Representation Rule list API response. */
export interface ResponseFromGetRuleList extends CollectionResponse {
  rules: RuleDetails[];
}

/** Create Rule API Response. */
export interface ResponseFromCreateRule {
  rule: Rule;
}

/** Create Rule API Response. */
export type ResponseFromUpdateRule = ResponseFromCreateRule;

/** Create/update Rule Response object. */
export interface Rule {
  /** Rule id. */
  id: string;
  /** Rule display name. */
  displayName: string;
  /** Rule description. */
  description: string;
  /** Rule template id. */
  templateId: string;
  /** Rule function parameters. */
  functionParameters: FunctionParameters;
  /** Rule severity ('low', 'medium', 'high', 'veryHigh'). */
  severity: string;
  /** EC schema of Rule. */
  ecSchema: string;
  /** EC class of Rule. */
  ecClass: string;
  /** Where clause of Rule. */
  whereClause?: string;
  /** Data type of Rule ('property', 'aspect', 'typeDefinition'). */
  dataType: string;
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: RuleSelfLink;
}
