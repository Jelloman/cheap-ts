/**
 * Entity implementation stubs
 */

import { Entity, LocalEntity, Aspect } from '../interfaces/index.js';

export class EntityImpl implements Entity {
  constructor(
    public readonly id: string,
    public readonly globalId: string,
    public readonly aspects: ReadonlyMap<string, Aspect>
  ) {}
}

export class LocalEntityImpl extends EntityImpl implements LocalEntity {
  constructor(
    id: string,
    globalId: string,
    aspects: ReadonlyMap<string, Aspect>,
    public readonly catalogId: string
  ) {
    super(id, globalId, aspects);
  }
}
