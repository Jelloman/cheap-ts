/**
 * Aspect implementation stubs
 */

import { Aspect, AspectDef, Property, PropertyDef } from '../interfaces/index.js';

export class AspectDefImpl implements AspectDef {
  constructor(
    public readonly name: string,
    public readonly properties: ReadonlyMap<string, PropertyDef>
  ) {}
}

export class AspectImpl implements Aspect {
  constructor(
    public readonly def: AspectDef,
    public readonly properties: ReadonlyMap<string, Property>
  ) {}
}
