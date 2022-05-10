/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/OperationsBase";
import { ResponseFromGetResult } from "../../base/interfaces/apiEntities/ResultInterfaces";
import { OperationOptions } from "../OperationOptions";
import { ParamsToGetResult } from "./ResultOperationParams";

export class ResultOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
  ) {
    super(options);
  }

  /**
   * Gets a Result identified by id. This method returns a Result in its full representation.
   * Wraps the {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-result/
   * Get Result} operation from Property Validation API.
   * @param {ParamsToGetResult} params parameters for this operation. See {@link ParamsToGetResult}.
   * @returns {Promise<ResponseFromGetResult>} a Result with specified id. See {@link ResponseFromGetResult}.
   */
  public async get(params: ParamsToGetResult): Promise<ResponseFromGetResult> {
    const { accessToken, resultId } = params;
    const response = await this.sendGetRequest<ResponseFromGetResult>({
      accessToken: accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getResultUrl({ resultId }),
    });
    return response;
  }

}
