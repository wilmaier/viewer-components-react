/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/OperationsBase";
import { ResponseFromCreateTest, ResponseFromGetTest, ResponseFromGetTestList, ResponseFromRunTest, ResponseFromUpdateTest, Run, Test, TestDetails, TestItem } from "../../base/interfaces/apiEntities/TestInterfaces";
import { EntityListIterator } from "../../base/iterators/EntityListIterator";
import { EntityListIteratorImpl } from "../../base/iterators/EntityListIteratorImpl";
import { OperationOptions } from "../OperationOptions";
import { ParamsToCreateTest, ParamsToDeleteTest, ParamsToGetTest, ParamsToGetTestList, ParamsToRunTest, ParamsToUpdateTest } from "./TestOperationParams";
import { AuthorizationCallback, GetNamedVersionListParams, IModelsClient, MinimalNamedVersion, NamedVersionOrderByProperty, OrderByOperator, toArray } from "@itwin/imodels-client-management";
import { PropertyValidationClient } from "../../PropertyValidationClient";

export class TestOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
  ) {
    super(options);
  }

  /**
   * Gets Tests for a specific project. This method returns Tests in their summary representation. The returned
   * iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-tests/ Get Tests}
   * operation from Property Validation API.
   * @param {ParamsToGetTestList} params parameters for this operation. See {@link ParamsToGetTestList}.
   * @returns {EntityListIterator<TestItem>} iterator for Test list. See {@link EntityListIterator},
   * {@link TestItem}.
   */
  public getList(params: ParamsToGetTestList): EntityListIterator<TestItem> {
    const entityCollectionAccessor = (response: unknown) => {
      const tests = (response as ResponseFromGetTestList).tests;
      return tests;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<TestItem>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getTestListUrl({ urlParams: params.urlParams }),
      entityCollectionAccessor,
    }));
  }

  /**
   * Gets a single Test identified by id. This method returns a Test in its full representation.
   * Wraps the {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-test/
   * Get Test} operation from Property Validation API.
   * @param {ParamsToGetTest} params parameters for this operation. See {@link ParamsToGetTest}.
   * @returns {Promise<TestDetails>} a Test with specified id. See {@link TestDetails}.
   */
  public async getSingle(params: ParamsToGetTest): Promise<TestDetails> {
    const { accessToken, testId } = params;
    const response = await this.sendGetRequest<ResponseFromGetTest>({
      accessToken: accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getSingleTestUrl({ testId }),
    });
    return response.test;
  }

  /**
   * Creates a Test. Wraps the {@link https://developer.bentley.com/apis/validation/operations/create-validation-propertyvalue-test/
   * Create Test} operation from Property Validation API.
   * @param {ParamsToCreateTest} params parameters for this operation. See {@link ParamsToCreateTest}.
   * @returns {Promise<Test>} newly created Test. See {@link Test}.
   */
  public async create(params: ParamsToCreateTest): Promise<Test> {
    const body = {
      projectId: params.projectId,
      displayName: params.displayName,
      description: params.description,
      stopExecutionOnFailure: params.stopExecutionOnFailure,
      rules: params.rules,
    };
    const response = await this.sendPostRequest<ResponseFromCreateTest>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.createTestUrl(),
      body,
    });

    return response.test;
  }

  /**
   * Updates a Test. Wraps the {@link https://developer.bentley.com/apis/validation/operations/update-validation-propertyvalue-test/
   * Update Test} operation from Property Validation API.
   * @param {ParamsToUpdateTest} params parameters for this operation. See {@link ParamsToUpdateTest}.
   * @returns {Promise<Test>} newly updated Test. See {@link Test}.
   */
  public async update(params: ParamsToUpdateTest): Promise<Test> {
    const body = {
      displayName: params.displayName,
      description: params.description,
      stopExecutionOnFailure: params.stopExecutionOnFailure,
      rules: params.rules,
    };
    const response = await this.sendPutRequest<ResponseFromUpdateTest>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.updateTestUrl(params),
      body,
    });

    return response.test;
  }

  /**
   * Runs a test. Wraps the {@link https://developer.bentley.com/apis/validation/operations/run-validation-propertyvalue-test/
   * Run test} operation from Property Validation API.
   * @param {ParamsToRunTest} params parameters for this operation. See {@link ParamsToRunTest}.
   * @returns {Promise<Run>} newly started Run. See {@link Run}.
   */
  public async runTest(params: ParamsToRunTest): Promise<Run | undefined> {
    // If namedVersionId is not specified, then try to get latest version as default
    if (params.namedVersionId === undefined) {
      const iModelsClient: IModelsClient = new IModelsClient();
      let authorization: AuthorizationCallback;
      if (params.accessToken) {
        authorization = PropertyValidationClient.toAuthorizationCallback(params.accessToken);
      } else if (this._options.accessTokenCallback) {
        const accessToken = await this._options.accessTokenCallback();
        authorization = PropertyValidationClient.toAuthorizationCallback(accessToken);
      } else {
        throw new Error(`Access token is required`);
      }
      const getNamedVersionListParams: GetNamedVersionListParams = {
        authorization,
        iModelId: params.iModelId,
        urlParams: {
          $orderBy: {
            property: NamedVersionOrderByProperty.ChangesetIndex,
            operator: OrderByOperator.Descending,
          },
        },
      };
      const namedVersionsIterator: EntityListIterator<MinimalNamedVersion> = iModelsClient.namedVersions.getMinimalList(getNamedVersionListParams);
      const namedVersions: MinimalNamedVersion[] = await toArray(namedVersionsIterator);
      if (namedVersions.length === 0) {
        return undefined;
      }
      params.namedVersionId = namedVersions[0].id;
    }
    const body = {
      testId: params.testId,
      iModelId: params.iModelId,
      namedVersionId: params.namedVersionId,
    };
    const response = await this.sendPostRequest<ResponseFromRunTest>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.runTestUrl(),
      body,
    });

    return response.run;
  }

  /**
   * Deletes a single Test identified by id.
   * Wraps the {@link https://developer.bentley.com/apis/validation/operations/delete-validation-propertyvalue-test/
   * Get Rule} operation from Property Validation API.
   * @param {ParamsToDeleteTest} params parameters for this operation. See {@link ParamsToDeleteTest}.
   * @returns {Promise<void>}.
   */
  public async delete(params: ParamsToDeleteTest): Promise<void> {
    const { accessToken, testId } = params;
    await this.sendDeleteRequest<void>({
      accessToken: accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.deleteTestUrl({ testId }),
    });
  }
}
