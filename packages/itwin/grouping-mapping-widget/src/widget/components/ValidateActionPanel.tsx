/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Button } from "@itwin/itwinui-react";
import * as React from "react";
import "./ValidateActionPanel.scss";
import { LoadingSpinner } from "./utils";

export interface ValidateActionPanelProps {
  onValidate: () => void;
  onCancel: () => void;
  isCancelDisabled?: boolean;
  isValidateDisabled?: boolean;
  isLoading?: boolean;
}

const ValidateActionPanel = ({
  onValidate,
  onCancel,
  isCancelDisabled = false,
  isValidateDisabled = false,
  isLoading = false,
}: ValidateActionPanelProps): JSX.Element => {
  return (
    <div id='validate-action' className='validate-action-panel-container'>
      <div className='validate-action-panel'>
        {isLoading &&
          <LoadingSpinner />
        }
        <Button
          disabled={isValidateDisabled || isLoading}
          styleType='high-visibility'
          id='validate-btn'
          onClick={onValidate}
        >
          Validate
        </Button>
        <Button
          styleType='default'
          type='button'
          id='cancel'
          onClick={onCancel}
          disabled={isCancelDisabled || isLoading}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
};

export default ValidateActionPanel;
