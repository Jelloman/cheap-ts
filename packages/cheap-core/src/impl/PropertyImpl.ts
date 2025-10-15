/**
 * Property implementation stubs
 */

import { Property, PropertyDef } from '../interfaces/index.js';
import { PropertyType } from '../types.js';

export class PropertyDefImpl implements PropertyDef {
  constructor(
    public readonly name: string,
    public readonly type: PropertyType
  ) {}
}

export class PropertyImpl implements Property {
  constructor(
    public readonly def: PropertyDef,
    public readonly value: unknown
  ) {}
}
