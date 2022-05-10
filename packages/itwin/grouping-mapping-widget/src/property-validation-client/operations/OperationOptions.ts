/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OperationsBaseOptions } from "../base/OperationsBase";
import { PropertyValidationApiUrlFormatter } from "./PropertyValidationApiUrlFormatter";

export interface OperationOptions extends OperationsBaseOptions {
  urlFormatter: PropertyValidationApiUrlFormatter;
}
