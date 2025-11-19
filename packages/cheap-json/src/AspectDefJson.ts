/**
 * JSON serialization/deserialization for AspectDef and Aspect
 */

import {
  AspectDef,
  Aspect,
  ImmutableAspectDefImpl,
  PropertyDef,
  AspectPropertyMapImpl,
  Entity,
} from "@cheap-ts/core";
import { serializePropertyDef, deserializePropertyDef } from "./PropertyDefJson.js";

/**
 * JSON representation of an AspectDef
 */
export interface AspectDefJson {
  name: string;
  globalId: string; // UUID - globalId from Entity interface
  properties: Record<string, any>; // Map of property names to PropertyDefJson
  readable?: boolean;
  writable?: boolean;
}

/**
 * JSON representation of an Aspect
 */
export interface AspectJson {
  entityId: string;
  aspectDefName: string;
  properties: Record<string, unknown>; // Map of property names to values
}

/**
 * Serializes an AspectDef to JSON
 */
export function serializeAspectDef(aspectDef: AspectDef): AspectDefJson {
  const properties: Record<string, any> = {};

  for (const propDef of aspectDef.propertyDefs()) {
    properties[propDef.name()] = serializePropertyDef(propDef);
  }

  const json: AspectDefJson = {
    name: aspectDef.name(),
    globalId: aspectDef.globalId(),
    properties,
  };

  if (!aspectDef.isReadable()) {
    json.readable = false;
  }

  if (!aspectDef.isWritable()) {
    json.writable = false;
  }

  return json;
}

/**
 * Deserializes an AspectDef from JSON
 */
export function deserializeAspectDef(json: AspectDefJson): AspectDef {
  const propertyDefsMap = new Map<string, PropertyDef>();

  for (const propName in json.properties) {
    const propDefJson = json.properties[propName];
    const propDef = deserializePropertyDef(propDefJson);
    propertyDefsMap.set(propDef.name(), propDef);
  }

  // Create an immutable aspect def with name, globalId, and property defs
  return new ImmutableAspectDefImpl(json.name, json.globalId, propertyDefsMap);
}

/**
 * Serializes an Aspect to JSON
 */
export function serializeAspect(aspect: Aspect): AspectJson {
  const properties: Record<string, unknown> = {};

  for (const propDef of aspect.def().propertyDefs()) {
    const propName = propDef.name();
    if (aspect.contains(propName)) {
      const prop = aspect.readObj(propName);
      properties[propName] = prop;
    }
  }

  return {
    entityId: aspect.entity().globalId(),
    aspectDefName: aspect.def().name(),
    properties,
  };
}

/**
 * Deserializes an Aspect from JSON
 */
export function deserializeAspect(json: AspectJson, aspectDef: AspectDef, entity: Entity): Aspect {
  const aspect = new AspectPropertyMapImpl(entity, aspectDef);

  for (const propName in json.properties) {
    const propDef = aspectDef.propertyDef(propName);
    if (propDef) {
      aspect.unsafeWrite(propName, json.properties[propName]);
    }
  }

  return aspect;
}
