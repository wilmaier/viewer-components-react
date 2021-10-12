/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/
import { Marker } from "@bentley/imodeljs-frontend";
import { XAndY, XYAndZ } from "@bentley/geometry-core";
import { useMarker, JsxMarker } from "./useMarker";

// defaults need to be stable refs, which module scope does
const defaultClass = () => JsxMarker;
const defaultWorldLoc = { x: 0, y: 0, z: 0 };
const defaultSize = { x: 30, y: 30 };
const defaultDependencies = {};

/** component equivalent of the `useMarker` hook, just calls useMarker and renders null */
export function MarkerComponent<
  C extends new (...args: any[]) => Marker,
  S extends {}
>(props: {
  makeClass?: (s: S) => C;
  worldLocation?: XYAndZ;
  size?: XAndY;
  dependencies?: S;
}) {
  useMarker(
    props.makeClass ?? (defaultClass as any as (s: S) => C),
    props.worldLocation ?? defaultWorldLoc,
    props.size ?? defaultSize,
    props.dependencies ?? (defaultDependencies as S)
  );
  return null;
}
