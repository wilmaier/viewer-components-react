/*---------------------------------------------------------------------------------------------
* Copyright (c) Bentley Systems, Incorporated. All rights reserved.
* See LICENSE.md in the project root for license terms and full copyright notice.
*--------------------------------------------------------------------------------------------*/

/** Property Validation API endpoint options. */
export interface ApiOptions {
  /** Property Validation API base url. Default value is `https://api.bentley.com/validation`. */
  baseUrl?: string;
  /** Validation API version. Default value is `itwin-platform.v1`. */
  version?: string;
}

export type AccessTokenCallback = () => Promise<string>;

/** Authorization data parameter. This interface is extended by all other specific operation parameter interfaces. */
export interface AuthorizationParam {
  /** Authorization token. eg: 'Bearer ey...'*/
  accessToken?: string;
}

/** Common url parameters that are supported for all entity list requests. */
export interface CollectionRequestParams {
  /**
   * Specifies how many entities should be returned in an entity page. The value must not exceed 1000.
   * If not specified 100 entities per page will be returned.
   */
  $top?: number;
}

/** Link to some other entity or entity list that is related to the main entity in the API response. */
export interface Link {
  /** Url to access the related entity. */
  href: string;
}

/**
 * Links that are included in all entity list page responses. They simplify pagination implementation because users
 * can send requests using these urls that already include pagination url parameters without having to
 * manually keep track of queried entity count.
 */
export interface CollectionLinks {
  /** Link to the current page. */
  self: Link;
  /** Link to the next page. If `null` it means that the next page is empty. */
  next: Link | null;
}

/** Common properties of all entity list page responses. */
export interface CollectionResponse {
  /** Common entity list page response links. See {@link CollectionLinks}. */
  // eslint-disable-next-line @typescript-eslint/naming-convention
  _links: CollectionLinks;
}

/**
 * Values for return preference used in `Prefer` header. The header value is formed by joining
 * `return=` and the enum value.
 */
export enum PreferReturn {
  /** Instructs the server to return minimal entity representation. */
  Minimal = "minimal",
  /** Instructs the server to return full entity representation. */
  Representation = "representation"
}

/** Function parameters - vary depending on the selected rule template */
export interface FunctionParameters {
  /** Property name. */
  propertyName?: string;
  /** Regex pattern. */
  pattern?: string;
  /** Upper bound of property value. */
  upperBound?: string;
  /** Lower bound of property value. */
  lowerBound?: string;
  /** Nested template id (multi-property validation). */
  templateId?: string;
  /** Nested parameters (multi-property validation). */
  functionParameters?: string;
  /** Array of schemas/entities/properties to process (multi-property validation). */
  schemas?: SchemaList[];
}

/** List of schemas containing properties to process (multi-property validation). */
export interface SchemaList {
  /** Schema name. */
  name: string;
  /** Schema label. */
  label?: string;
  /** List of entities in schema. */
  entities: ClassList;
}

/** List of classes containing properties to process (multi-property validation). */
export interface ClassList {
  /** Class name. */
  name: string;
  /** Class label. */
  label?: string;
  /** List of Class properties. */
  properties?: PropertyList;
  /** List of aspect properties of the Class. */
  aspects?: PropertyList;
  /** List of type definition properties of the Class. */
  typeDefinitions?: PropertyList;
}

/** List of properties to process (multi-property validation). */
export interface PropertyList {
  /** Property name. */
  name: string;
  /** Property label. */
  label?: string;
}
