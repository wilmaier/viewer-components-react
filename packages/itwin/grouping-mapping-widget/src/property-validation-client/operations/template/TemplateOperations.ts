/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { OperationsBase } from "../../base/OperationsBase";
import { ResponseFromGetTemplates, RuleTemplate } from "../../base/interfaces/apiEntities/TemplateInterfaces";
import { EntityListIterator } from "../../base/iterators/EntityListIterator";
import { EntityListIteratorImpl } from "../../base/iterators/EntityListIteratorImpl";
import { OperationOptions } from "../OperationOptions";
import { ParamsToGetTemplateList } from "./TemplateOperationParams";

export class TemplateOperations<TOptions extends OperationOptions> extends OperationsBase<TOptions> {
  constructor(
    options: TOptions,
  ) {
    super(options);
  }

  /**
   * Gets Rule Templates for a specific project. This method returns Rule Templates in their full representation. The returned
   * iterator internally queries entities in pages. Wraps the
   * {@link https://developer.bentley.com/apis/validation/operations/get-validation-propertyvalue-rule-templates/ Get Rule Template}
   * operation from Property Validation API.
   * @param {ParamsToGetTemplateList} params parameters for this operation. See {@link ParamsToGetTemplateList}.
   * @returns {EntityListIterator<RuleTemplate>} iterator for Template list. See {@link EntityListIterator},
   * {@link RuleTemplate}.
   */
  public getList(params: ParamsToGetTemplateList): EntityListIterator<RuleTemplate> {
    const entityCollectionAccessor = (response: unknown) => {
      const templates = (response as ResponseFromGetTemplates).ruleTemplates;
      return templates;
    };

    return new EntityListIteratorImpl(async () => this.getEntityCollectionPage<RuleTemplate>({
      accessToken: params.accessToken ?? await this._options.accessTokenCallback!(),
      url: this._options.urlFormatter.getTemplateListUrl({ urlParams: params.urlParams }),
      entityCollectionAccessor,
    }));
  }
}
