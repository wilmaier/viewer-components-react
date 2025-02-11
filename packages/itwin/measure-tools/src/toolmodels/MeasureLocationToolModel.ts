/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

import type { Point3d } from "@itwin/core-geometry";
import { MeasurementToolModel } from "../api/MeasurementToolModel";
import type { LocationMeasurementProps } from "../measurements/LocationMeasurement";
import { LocationMeasurement } from "../measurements/LocationMeasurement";
import type { MeasurementProps } from "../api/MeasurementProps";

// Properties of LocationMeasurementProps that are NOT inherited from MeasurementProps
// We don't want to expose anything from the MeasurementProps for addLocation
type LocationMeasurementPropsOnly = Omit<LocationMeasurementProps, keyof MeasurementProps>;

// We want 'location' to be a Point3d, not a XYZProps
export interface AddLocationProps extends Omit<LocationMeasurementPropsOnly, "location"> {
  location: Point3d;
  viewType: string;
}

export class MeasureLocationToolModel extends MeasurementToolModel<LocationMeasurement> {
  private _currentMeasurement?: LocationMeasurement;

  public override get dynamicMeasurement(): LocationMeasurement | undefined { return this._currentMeasurement; }

  constructor() {
    super();
  }

  public addLocation(props: AddLocationProps): void {
    const { viewType, ...rest } = props;
    const measurement = new LocationMeasurement(rest);
    measurement.viewTarget.include(viewType);

    // Set a temporary dynamic
    this._currentMeasurement = measurement;
    this.notifyNewMeasurement();
    this._currentMeasurement = undefined;

    this.addMeasurementAndReset(measurement);
  }
}
