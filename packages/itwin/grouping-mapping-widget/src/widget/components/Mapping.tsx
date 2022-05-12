/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Presentation } from "@itwin/presentation-frontend";
import React, { useEffect } from "react";
import type { CreateTypeFromInterface } from "../utils";
import { onSelectionChanged } from "./utils";
import "./Mapping.scss";
import { Groupings } from "./Grouping";
import type { Mapping } from "@itwin/insights-client";

export type MappingType = CreateTypeFromInterface<Mapping>;

export const Mappings = () => {

  useEffect(() => {
    const removeListener =
      Presentation.selection.selectionChange.addListener(onSelectionChanged);
    return () => {
      removeListener();
    };
  }, []);

  return (
    <Groupings
    />
  );
};
