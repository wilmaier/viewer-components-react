/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { CollectionResponse, FunctionParameters } from "../CommonInterfaces";

/** Template item. */
export interface RuleTemplate {
  /** Template id. */
  id: string;
  /** Template display name. */
  displayName: string;
  /** Template description. */
  description: string;
  /** Template prompt string. */
  prompt: string;
  /** Template function parameters. */
  templateExpression: FunctionParameters;
}

/** Rule Template list API response. */
export interface ResponseFromGetTemplates extends CollectionResponse {
  ruleTemplates: RuleTemplate[];
}

