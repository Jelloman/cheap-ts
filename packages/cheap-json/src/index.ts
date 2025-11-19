/**
 * @cheap-ts/json - JSON serialization/deserialization for CHEAP model
 */

import type { Aspect, AspectDef, Entity, Catalog, Hierarchy, PropertyDef } from "@cheap-ts/core";

export interface Serializer<T> {
  serialize(value: T): string;
}

export interface Deserializer<T> {
  deserialize(json: string): T;
}

// Export JSON serialization functions
export * from "./PropertyDefJson.js";
export * from "./AspectDefJson.js";
export * from "./EntityJson.js";

// Re-export types
export type { PropertyDefJson, PropertyJson } from "./PropertyDefJson.js";
export type { AspectDefJson, AspectJson } from "./AspectDefJson.js";
export type { EntityJson } from "./EntityJson.js";

// Serializer implementations using the JSON functions
import { serializePropertyDef, deserializePropertyDef } from "./PropertyDefJson.js";
import { serializeAspectDef, deserializeAspectDef, serializeAspect } from "./AspectDefJson.js";
import { serializeEntity, deserializeEntity } from "./EntityJson.js";

/**
 * Serializer for PropertyDef
 */
export class PropertyDefSerializer implements Serializer<PropertyDef> {
  serialize(value: PropertyDef): string {
    return JSON.stringify(serializePropertyDef(value), null, 2);
  }
}

/**
 * Deserializer for PropertyDef
 */
export class PropertyDefDeserializer implements Deserializer<PropertyDef> {
  deserialize(json: string): PropertyDef {
    return deserializePropertyDef(JSON.parse(json));
  }
}

/**
 * Serializer for AspectDef
 */
export class AspectDefSerializer implements Serializer<AspectDef> {
  serialize(value: AspectDef): string {
    return JSON.stringify(serializeAspectDef(value), null, 2);
  }
}

/**
 * Deserializer for AspectDef
 */
export class AspectDefDeserializer implements Deserializer<AspectDef> {
  deserialize(json: string): AspectDef {
    return deserializeAspectDef(JSON.parse(json));
  }
}

/**
 * Serializer for Aspect
 */
export class AspectSerializer implements Serializer<Aspect> {
  serialize(value: Aspect): string {
    return JSON.stringify(serializeAspect(value), null, 2);
  }
}

/**
 * Serializer for Entity
 */
export class EntitySerializer implements Serializer<Entity> {
  serialize(value: Entity): string {
    return JSON.stringify(serializeEntity(value), null, 2);
  }
}

/**
 * Deserializer for Entity
 */
export class EntityDeserializer implements Deserializer<Entity> {
  deserialize(json: string): Entity {
    return deserializeEntity(JSON.parse(json));
  }
}

// Placeholder serializers for Hierarchy and Catalog (to be implemented)
export class HierarchySerializer implements Serializer<Hierarchy> {
  serialize(_value: Hierarchy): string {
    throw new Error("HierarchySerializer not yet implemented");
  }
}

export class CatalogSerializer implements Serializer<Catalog> {
  serialize(_value: Catalog): string {
    throw new Error("CatalogSerializer not yet implemented");
  }
}
