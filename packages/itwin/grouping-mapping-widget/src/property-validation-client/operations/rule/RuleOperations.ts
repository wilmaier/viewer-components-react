/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/OperationsBase";
import { PreferReturn } from "../../base/interfaces/CommonInterfaces";
import { MinimalRule, ResponseFromCreateRule, ResponseFromGetRule, ResponseFromGetRuleList, ResponseFromGetRuleListMinimal, ResponseFromUpdateRule, Rule, RuleDetails } from "../../base/interfaces/apiEntities/RuleInterfaces";
import { EntityListIterator } from "../../base/iterators/EntityListIterator";
import { EntityListIteratorImpl } from "../../base/iterators/EntityListIteratorImpl";
import { OperationOptions } from "../OperationOptions";
import { ParamsToCreateRule, ParamsToDeleteRule, ParamsToGetRule, ParamsToGetRuleList, ParamsToUpdateRule } from "./RuleOperationParams";

export class RuleOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
  ) {
    super(options);
  }

  /**
   * Gets Rules for a specific project. This method returns Rules in their minimal representation. The
   * returned iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-rules/ Get Rules}
   * operation from Property Validation API.
   * @param {ParamsToGetRuleList} params parameters for this operation. See {@link ParamsToGetRuleList}.
   * @returns {EntityListIterator<MinimalRule>} iterator for Rule list. See {@link EntityListIterator},
   * {@link MinimalRule}.
   */
  public getMinimalList(params: ParamsToGetRuleList): EntityListIterator<MinimalRule> {
    const entityCollectionAccessor = (response: unknown) => {
      const rules = (response as ResponseFromGetRuleListMinimal).rules;
      return rules;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<MinimalRule>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getRuleListUrl({urlParams: params.urlParams }),
      preferReturn: PreferReturn.Minimal,
      entityCollectionAccessor,
    }));
  }

  /**
   * Gets Rules for a specific project. This method returns Rules in their full representation. The returned
   * iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-rules/ Get Rules}
   * operation from Property Validation API.
   * @param {ParamsToGetRuleList} params parameters for this operation. See {@link ParamsToGetRuleList}.
   * @returns {EntityListIterator<RuleDetails>} iterator for Rule list. See {@link EntityListIterator},
   * {@link RuleDetails}.
   */
  public getRepresentationList(params: ParamsToGetRuleList): EntityListIterator<RuleDetails> {
    const entityCollectionAccessor = (response: unknown) => {
      const rules = (response as ResponseFromGetRuleList).rules;
      return rules;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<RuleDetails>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getRuleListUrl({urlParams: params.urlParams }),
      preferReturn: PreferReturn.Representation,
      entityCollectionAccessor,
    }));
  }

  /**
   * Gets a single Rule identified by id. This method returns a Rule in its full representation.
   * Wraps the {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-rule/
   * Get Rule} operation from Property Validation API.
   * @param {ParamsToGetRule} params parameters for this operation. See {@link ParamsToGetRule}.
   * @returns {Promise<RuleDetails>} a Rule with specified id. See {@link RuleDetails}.
   */
  public async getSingle(params: ParamsToGetRule): Promise<RuleDetails> {
    const { accessToken, ruleId } = params;
    const response = await this.sendGetRequest<ResponseFromGetRule>({
      accessToken: accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getSingleRuleUrl({ ruleId }),
    });
    return response.rule;
  }

  /**
   * Deletes a single Rule identified by id.
   * Wraps the {@link https://developer.bentley.com/apis/validation/operations/delete-validation-propertyvalue-rule/
   * Delete Rule} operation from Property Validation API.
   * @param {ParamsToDeleteRule} params parameters for this operation. See {@link ParamsToDeleteRule}.
   * @returns {Promise<void>}.
   */
  public async delete(params: ParamsToDeleteRule): Promise<void> {
    const { accessToken, ruleId } = params;
    await this.sendDeleteRequest<void>({
      accessToken: accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.deleteRuleUrl({ ruleId }),
    });
  }

  /**
   * Creates a Rule. Wraps the {@link https://developer.bentley.com/apis/validation/operations/create-validation-propertyvalue-rule/
   * Create Rule} operation from Property Validation API.
   * @param {ParamsToCreateRule} params parameters for this operation. See {@link ParamsToCreateRule}.
   * @returns {Promise<Rule>} newly created Rule. See {@link Rule}.
   */
  public async create(params: ParamsToCreateRule): Promise<Rule> {
    const body = {
      templateId: params.templateId,
      displayName: params.displayName,
      description: params.description,
      ecClass: params.ecClass,
      ecSchema: params.ecSchema,
      whereClause: params.whereClause,
      severity: params.severity,
      dataType: params.dataType,
      functionParameters: params.functionParameters,
    };
    const response = await this.sendPostRequest<ResponseFromCreateRule>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.createRuleUrl(),
      body,
    });

    return response.rule;
  }

  /**
   * Updates a Rule. Wraps the {@link https://developer.bentley.com/apis/validation/operations/update-validation-propertyvalue-rule/
   * Update Rule} operation from Property Validation API.
   * @param {ParamsToUpdateRule} params parameters for this operation. See {@link ParamsToUpdateRule}.
   * @returns {Promise<Rule>} newly updated Rule. See {@link Rule}.
   */
  public async update(params: ParamsToUpdateRule): Promise<Rule> {
    const body = {
      displayName: params.displayName,
      description: params.description,
      ecClass: params.ecClass,
      ecSchema: params.ecSchema,
      whereClause: params.whereClause,
      severity: params.severity,
    };
    const response = await this.sendPutRequest<ResponseFromUpdateRule>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.updateRuleUrl(params),
      body,
    });

    return response.rule;
  }
}
