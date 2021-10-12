/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { XAndY, XYAndZ } from "@bentley/geometry-core";
import { Marker } from "@bentley/imodeljs-frontend";
import React, { useContext, useEffect, useRef } from "react";
import ReactDOM from "react-dom";
import { useClass } from "@bentley/react-hooks";

import { MarkerDecorationContext } from "../IModelJsViewProvider";
import { useOnMountInRenderOrder } from "../utils/basic-hooks";

/** a marker with which you can set the `jsxElement` property to JSX instead of the `htmlElement`
 * this makes it easy to use JSX fragments for dynamic react-controlled marker content like so:
 * @example
 * ```tsx
 * function MyComponent(props) {
 *   const [isHovered, setIsHovered] = useState(false);
 *   const myMarker = useMarker((state) => class MyMarker extends JsxMarker{}, props.worldLoc, props.size);
 *   myMarker.jsxElement = <div style={{ backgroundColor: isHovered ? "red" : "blue" }} />;
 * }
 * ```
 */
export class JsxMarker extends Marker {
  set jsxElement(val: React.ReactElement | undefined) {
    if (val) {
      this.htmlElement = document.createElement("div");
      ReactDOM.render(val, this.htmlElement);
    } else {
      delete this.htmlElement;
    }
  }
}

/** Use an instance of a marker class in your component for easy access to React state
 *
 *
 * @example
 * ```tsx
 * useMarker(() => Marker, {x: 0, y: 100, z: 100}, {x: 30, y: 30});
 * ```
 *
 * @example
 * ```tsx
 * const [myState, setMyState] = useState(10);
 * const marker = useMarker(() => JsxMarker, Point3d.create(0, 0, 0) Point2d.create(0,0));
 * // the above is the default arguments, so you can just do the following instead:
 * //const marker = useMarker();
 * marker.jsxElement = <div>The state is {myState}!</div>;
 * ```
 *
 * @example
 * ```tsx
 * const [isHovered, setIsHovered] = useState(10);
 * const marker = useMarker((componentState) =>
 *   class MyMarker extends Marker {
 *     onMouseButton(ev: BeButtonEvent) {
 *       if (ev.button === BeButton.Data && ev.isDown) {
 *         setIsHovered(!componentState.isHovered);
 *       }
 *     }
 *   },
 *   Point3d.create(0, 0, 0),
 *   Point2d.create(30, 30),
 *   { isHovered },
 * );
 * ```
 */
export const useMarker = <
  C extends new (...args: any[]) => Marker,
  S extends {}
>(
  makeClass: (s: S) => C = () => JsxMarker as any as C,
  worldLocation: XYAndZ = { x: 0, y: 0, z: 0 },
  size: XAndY = { x: 30, y: 30 },
  dependencies: S = {} as S
) => {
  const marker = new (useClass(makeClass, dependencies))(worldLocation, size);

  /** to prevent wasteful rerendering caused by consumers using
   * object and array literals, memoization is done specially, or unnecessary
   * view invalidations would be made.
   */
  const {
    // these removed properties are the whitelist of custom-memoized items
    worldLocation: _worldLocation,
    size: _size,
    imageSize: _imageSize,
    imageOffset: _imageOffset,
    ...normallyMemoizedOptionValues // picks up all other direct properties (i.e. not methods cuz they're on the prototype)
  } = marker;

  const optionsToInvalidateOnChanges = [
    ...Object.values(normallyMemoizedOptionValues),
    worldLocation.x,
    worldLocation.y,
    worldLocation.z,
    size.x,
    size.y,
    marker.imageSize?.x,
    marker.imageSize?.y,
    marker.imageOffset?.x,
    marker.imageOffset?.y,
  ];

  const {
    register: addMarker,
    unregister: removeMarker,
    enqueueViewInvalidation,
    refreshPosition,
  } = useContext(MarkerDecorationContext);

  refreshPosition(marker);

  useOnMountInRenderOrder(() => {
    addMarker(marker);
    return () => removeMarker(marker);
  });

  // invalidate view synchronously on option changes
  useEffect(() => {
    setTimeout(enqueueViewInvalidation);
  }, [enqueueViewInvalidation, ...optionsToInvalidateOnChanges]);

  return marker;
};

export default useMarker;
