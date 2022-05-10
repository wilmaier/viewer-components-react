/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { AccessTokenCallback, ApiOptions } from "./base/interfaces/CommonInterfaces";
import { RecursiveRequired } from "./base/interfaces/UtilityTypes";
import { AxiosRestClient } from "./base/rest/AxiosRestClient";
import { RestClient } from "./base/rest/RestClient";
import { Constants } from "./Constants";
import { RuleOperations } from "./operations/rule/RuleOperations";
import { RunOperations } from "./operations/run/RunOperations";
import { ResultOperations } from "./operations/result/ResultOperations";
import { TestOperations } from "./operations/test/TestOperations";
import { TemplateOperations } from "./operations/template/TemplateOperations";
import { PropertyValidationApiUrlFormatter } from "./operations/PropertyValidationApiUrlFormatter";
import { OperationOptions } from "./operations/OperationOptions";
import { AuthorizationCallback } from "@itwin/imodels-client-management";

/** User-configurable Property Validation client options. */
export interface PropertyValidationClientOptions {
  /**
   * Rest client that is used for making HTTP requests. If `undefined` the default client is used which is implemented
   * using `axios` library. See {@link AxiosRestClient}.
   */
  restClient?: RestClient;
  /** Property Validation API options. See {@link ApiOptions}. */
  api?: ApiOptions;
}

/**
 * Property Validation API client for property validation workflows. For more information on the API visit the
 * {@link https://developer.bentley.com/apis/validation/ Property Validation API documentation page}.
 */
export class PropertyValidationClient {
  protected _operationsOptions: OperationOptions;
  public templateId: string;
  public ruleId: string;
  public testId: string;
  public runId: string;
  public resultId: string;

  /**
   * Class constructor.
   * @param {PropertyValidationClientOptions} options client options. If `options` are `undefined` or if some of the properties
   * are `undefined` the client uses defaults. See {@link PropertyValidationClientOptions}.
   */
  constructor(options?: PropertyValidationClientOptions, accessTokenCallback?: AccessTokenCallback) {
    const filledPropertyValidationClientOptions = PropertyValidationClient.fillConfiguration(options);
    this._operationsOptions = {
      ...filledPropertyValidationClientOptions,
      urlFormatter: new PropertyValidationApiUrlFormatter(filledPropertyValidationClientOptions.api.baseUrl),
      accessTokenCallback,
    };
    this.templateId = "";
    this.ruleId = "";
    this.testId = "";
    this.runId = "";
    this.resultId = "";
  }

  /** Template operations. See {@link TemplateOperations}. */
  public get templates(): TemplateOperations<OperationOptions> {
    return new TemplateOperations(this._operationsOptions);
  }

  /** Rule operations. See {@link RuleOperations}. */
  public get rules(): RuleOperations<OperationOptions> {
    return new RuleOperations(this._operationsOptions);
  }

  /** Test operations. See {@link TestOperations}. */
  public get tests(): TestOperations<OperationOptions> {
    return new TestOperations(this._operationsOptions);
  }

  /** Run operations. See {@link RunOperations}. */
  public get runs(): RunOperations<OperationOptions> {
    return new RunOperations(this._operationsOptions);
  }

  /** Result operations. See {@link ResultOperations}. */
  public get results(): ResultOperations<OperationOptions> {
    return new ResultOperations(this._operationsOptions);
  }

  /**
   * Creates a required configuration instance from user provided options and applying default ones for not specified
   * options. See {@link PropertyValidationClientOptions}.
   * @param {PropertyValidationClientOptions} options user-passed client options.
   * @returns {RecursiveRequired<PropertyValidationClientOptions>} required Property Validation client configuration options.
   */
  public static fillConfiguration(options?: PropertyValidationClientOptions): RecursiveRequired<PropertyValidationClientOptions> {
    return {
      api: {
        baseUrl: options?.api?.baseUrl ?? Constants.api.baseUrl,
        version: options?.api?.version ?? Constants.api.version,
      },
      restClient: options?.restClient ?? new AxiosRestClient(),
    };
  }

  public static toAuthorizationCallback(accessToken: string): AuthorizationCallback {
    const splitAccessToken = accessToken.split(" ");
    const authorization = {
      scheme: splitAccessToken[0],
      token: splitAccessToken[1],
    };
    return async () => authorization;
  }
}
