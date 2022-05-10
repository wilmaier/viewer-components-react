/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { ValidationError, ValidationErrorCode, ValidationErrorDetail } from "./interfaces/ValidationErrorInterfaces";

interface ValidationApiErrorWrapper {
  error: ValidationApiError;
}

interface ValidationApiError {
  code: string;
  message?: string;
  details?: ValidationApiErrorDetail[];
}

interface ValidationApiErrorDetail {
  code: string;
  message: string;
  target: string;
}

export function isValidationApiError(error: unknown): error is ValidationError {
  const errorCode: unknown = (error as ValidationError)?.code;
  return errorCode !== undefined && typeof errorCode === "string";
}

export class ValidationErrorImpl extends Error implements ValidationError {
  public code: ValidationErrorCode;
  public details?: ValidationErrorDetail[];

  constructor(params: { code: ValidationErrorCode, message: string, details?: ValidationErrorDetail[] }) {
    super();
    this.name = this.code = params.code;
    this.message = params.message;
    this.details = params.details;
  }
}

export class ValidationErrorParser {
  private static readonly _defaultErrorMessage = "Unknown error occurred";

  public static parse(response: { statusCode?: number, body?: unknown }): Error {
    if (!response.statusCode) {
      return new ValidationErrorImpl({ code: ValidationErrorCode.Unknown, message: ValidationErrorParser._defaultErrorMessage });
    }
    // TODO: remove the special handling when APIM team fixes incorrect error body
    if (response.statusCode === 401) {
      return new ValidationErrorImpl({ code: ValidationErrorCode.Unauthorized, message: "The user is unauthorized. Please provide valid authentication credentials." });
    }
    const errorFromApi: ValidationApiErrorWrapper | undefined = response.body as ValidationApiErrorWrapper;
    const errorCode: ValidationErrorCode = ValidationErrorParser.parseCode(errorFromApi?.error?.code);
    const errorDetails: ValidationErrorDetail[] | undefined = ValidationErrorParser.parseDetails(errorFromApi.error?.details);
    const errorMessage: string = ValidationErrorParser.parseAndFormatMessage(errorFromApi?.error?.message, errorDetails);

    return new ValidationErrorImpl({
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
    });
  }

  private static parseCode(errorCode: string | undefined): ValidationErrorCode {
    if (!errorCode) {
      return ValidationErrorCode.Unrecognized;
    }
    let parsedCode: ValidationErrorCode | undefined = ValidationErrorCode[errorCode as keyof typeof ValidationErrorCode];
    if (!parsedCode) {
      parsedCode = ValidationErrorCode.Unrecognized;
    }
    return parsedCode;
  }

  private static parseDetails(details: ValidationApiErrorDetail[] | undefined): ValidationErrorDetail[] | undefined {
    if (!details) {
      return undefined;
    }
    return details.map((unparsedDetail) => {
      return { ...unparsedDetail, code: this.parseCode(unparsedDetail.code) };
    });
  }

  private static parseAndFormatMessage(message: string | undefined, errorDetails: ValidationErrorDetail[] | undefined): string {
    let result = message ?? ValidationErrorParser._defaultErrorMessage;
    if (!errorDetails || errorDetails.length === 0) {
      return result;
    }
    result += " Details:\n";
    for (let i = 0; i < errorDetails.length; i++) {
      result += `${i + 1}. ${errorDetails[i].code}: ${errorDetails[i].message}`;
      if (errorDetails[i].target) {
        result += ` Target: ${errorDetails[i].target}.`;
      }
      result += "\n";
    }

    return result;
  }
}
