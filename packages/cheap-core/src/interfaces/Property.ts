/**
 * Property interfaces
 */

import { PropertyType } from '../types.js';

export interface PropertyDef {
  readonly name: string;
  readonly type: PropertyType;
}

export interface Property {
  readonly def: PropertyDef;
  readonly value: unknown;
}
