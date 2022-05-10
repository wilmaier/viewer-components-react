/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Possible error codes. */
export enum ValidationErrorCode {
  Unrecognized = "Unrecognized",

  Unknown = "Unknown",
  Unauthorized = "Unauthorized",
  InsufficientPermissions = "InsufficientPermissions",
  RateLimitExceeded = "RateLimitExceeded",
  TooManyRequests = "TooManyRequests",
  InvalidValidationRequest = "InvalidValidationRequest",
  RequestTooLarge = "RequestTooLarge",
  ResourceQuotaExceeded = "ResourceQuotaExceeded",
  MutuallyExclusivePropertiesProvided = "MutuallyExclusivePropertiesProvided",
  MissingRequiredProperty = "MissingRequiredProperty",
  MissingRequiredParameter = "MissingRequiredParameter",
  MissingRequiredHeader = "MissingRequiredHeader",
  InvalidValue = "InvalidValue",
  InvalidHeaderValue = "InvalidHeaderValue",
  InvalidRequestBody = "InvalidRequestBody",
  MissingRequestBody = "MissingRequestBody",
  ProjectNotFound = "ProjectNotFound",
  IModelNotFound = "iModelNotFound",
  NamedVersionNotFound = "NamedVersionNotFound",
  ValidationResultNotFound = "ValidationResultNotFound",
  ValidationRuleNotFound = "ValidationRuleNotFound",
  ValidationRuleTemplateNotFound = "ValidationRuleTemplateNotFound",
  ValidationRunNotFound = "ValidationRunNotFound",
  ValidationTestNotFound = "ValidationTestNotFound"
}

/** Error detail information. */
export interface ValidationErrorDetail {
  /** Error detail code. See {@link ValidationErrorCode}. */
  code: ValidationErrorCode;
  /** Message that describes the error detail. */
  message: string;
  /** Name of the property or parameter which is related to the issue. */
  target?: string;
}

/** Interface for the errors thrown by this library. */
export interface ValidationError extends Error {
  /** Error code. See {@link ValidationErrorCode}. */
  code: ValidationErrorCode;
  /** Data that describes the error in more detail. See {@link ValidationErrorDetail}. */
  details?: ValidationErrorDetail[];
}
