/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import { Point2d, Point3d } from "@bentley/geometry-core";
import { Marker, Viewport } from "@bentley/imodeljs-frontend";
import { render } from "@testing-library/react";
import React, { useContext } from "react";

import {
  IModelJsViewProvider,
  MarkerDecoration,
  MarkerDecorationContext,
} from "../IModelJsViewProvider";
import { useMarker } from "./useMarker";

jest.mock("@bentley/bentleyjs-core");

jest.mock("@bentley/imodeljs-frontend", () => {
  const actual = jest.requireActual("@bentley/imodeljs-frontend");
  return {
    ...actual,
    IModelApp: {
      viewManager: {
        __vp: {},
        addDecorator: jest.fn(),
        forEachViewport(func: (vp: Viewport) => void) {
          func(this.__vp as any as Viewport);
        },
        invalidateViewportScenes: jest.fn(),
        onViewOpen: {
          addListener: jest.fn(),
        },
        invalidateDecorationsAllViews: jest.fn(),
      },
    },
  };
});

const dontCareMarkerOpts = [
  Point3d.create(0, 0, 0),
  Point2d.create(30, 30),
] as const;

describe("Hook useMarker", () => {
  it("markers are applied in tree order", async () => {
    let markers: Marker[];
    const ListenContext = () => {
      const { decoration } = useContext(MarkerDecorationContext);
      markers = (decoration as MarkerDecoration as any)._markersRef;
      return null;
    };
    const A = () => {
      useMarker(() => Marker, dontCareMarkerOpts[0], Point2d.create(1, 0));
      return (
        <>
          <B /> <C />
        </>
      );
    };
    const B = () => {
      useMarker(() => Marker, dontCareMarkerOpts[0], Point2d.create(2, 0));
      return null;
    };
    const C = () => {
      useMarker(() => Marker, dontCareMarkerOpts[0], Point2d.create(3, 0));
      return null;
    };
    render(
      <IModelJsViewProvider>
        <ListenContext />
        <A />
      </IModelJsViewProvider>
    );

    expect(markers![0].size.x).toEqual(1);
    expect(markers![1].size.x).toEqual(2);
    expect(markers![2].size.x).toEqual(3);
  });
});
