/**
 * Aspect interfaces
 */

import { Property, PropertyDef } from './Property.js';

export interface AspectDef {
  readonly name: string;
  readonly properties: ReadonlyMap<string, PropertyDef>;
}

export interface Aspect {
  readonly def: AspectDef;
  readonly properties: ReadonlyMap<string, Property>;
}

export interface AspectBuilder {
  setProperty(name: string, value: unknown): this;
  build(): Aspect;
}

export interface MutableAspectDef {
  addProperty(propertyDef: PropertyDef): void;
}
