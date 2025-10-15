/**
 * @cheapjs/json - JSON serialization/deserialization for CHEAP model
 */

import type { Aspect, Entity, Catalog, Hierarchy } from '@cheapjs/core';

export interface Serializer<T> {
  serialize(value: T): string;
}

export interface Deserializer<T> {
  deserialize(json: string): T;
}

// Placeholder serializers - to be implemented
export class AspectSerializer implements Serializer<Aspect> {
  serialize(_value: Aspect): string {
    throw new Error('Not implemented');
  }
}

export class EntitySerializer implements Serializer<Entity> {
  serialize(_value: Entity): string {
    throw new Error('Not implemented');
  }
}

export class HierarchySerializer implements Serializer<Hierarchy> {
  serialize(_value: Hierarchy): string {
    throw new Error('Not implemented');
  }
}

export class CatalogSerializer implements Serializer<Catalog> {
  serialize(_value: Catalog): string {
    throw new Error('Not implemented');
  }
}
