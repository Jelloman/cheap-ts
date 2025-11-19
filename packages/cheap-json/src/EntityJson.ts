/**
 * JSON serialization/deserialization for Entity
 */

import { Entity, EntityImpl } from "@cheap-ts/core";

/**
 * JSON representation of an Entity
 */
export interface EntityJson {
  globalId: string;
}

/**
 * Serializes an Entity to JSON
 */
export function serializeEntity(entity: Entity): EntityJson {
  return {
    globalId: entity.globalId(),
  };
}

/**
 * Deserializes an Entity from JSON
 */
export function deserializeEntity(json: EntityJson): Entity {
  return new EntityImpl(json.globalId);
}

/**
 * Serializes an Entity to a JSON string (just the UUID)
 */
export function entityToString(entity: Entity): string {
  return entity.globalId();
}

/**
 * Deserializes an Entity from a JSON string (just the UUID)
 */
export function entityFromString(globalId: string): Entity {
  return new EntityImpl(globalId);
}
