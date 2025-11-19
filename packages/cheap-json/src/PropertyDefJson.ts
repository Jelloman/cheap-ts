/**
 * JSON serialization/deserialization for PropertyDef and Property
 */

import { PropertyDef, Property, PropertyDefImpl, PropertyImpl } from "@cheap-ts/core";
import { PropertyType } from "@cheap-ts/core";

/**
 * JSON representation of a PropertyDef
 */
export interface PropertyDefJson {
  name: string;
  type: string; // PropertyType code (e.g., "STR", "INT")
  defaultValue?: unknown;
  hasDefaultValue?: boolean;
  readable?: boolean;
  writable?: boolean;
  nullable?: boolean;
  removable?: boolean;
  multivalued?: boolean;
}

/**
 * JSON representation of a Property
 */
export interface PropertyJson {
  name: string;
  value: unknown;
}

/**
 * Serializes a PropertyDef to JSON
 */
export function serializePropertyDef(propDef: PropertyDef): PropertyDefJson {
  const json: PropertyDefJson = {
    name: propDef.name(),
    type: propDef.type().typeCode(),
  };

  if (propDef.hasDefaultValue()) {
    json.hasDefaultValue = true;
    json.defaultValue = serializePropertyValue(propDef.defaultValue(), propDef.type());
  }

  // Only include flags if they're non-default values
  if (!propDef.isReadable()) {
    json.readable = false;
  }
  if (!propDef.isWritable()) {
    json.writable = false;
  }
  if (propDef.isNullable()) {
    json.nullable = true;
  }
  if (propDef.isRemovable()) {
    json.removable = true;
  }
  if (propDef.isMultivalued()) {
    json.multivalued = true;
  }

  return json;
}

/**
 * Deserializes a PropertyDef from JSON
 */
export function deserializePropertyDef(json: PropertyDefJson): PropertyDef {
  const type = PropertyType.fromTypeCode(json.type);
  if (!type) {
    throw new Error(`Unknown property type code: ${json.type}`);
  }

  const defaultValue = json.hasDefaultValue ? deserializePropertyValue(json.defaultValue, type) : null;

  return new PropertyDefImpl(
    json.name,
    type,
    defaultValue,
    json.hasDefaultValue ?? false,
    json.readable ?? true,
    json.writable ?? true,
    json.nullable ?? false,
    json.removable ?? false,
    json.multivalued ?? false,
  );
}

/**
 * Serializes a property value based on its type
 */
export function serializePropertyValue(value: unknown, type: PropertyType): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle multivalued properties (arrays)
  if (Array.isArray(value)) {
    return value.map((v) => serializePropertyValue(v, type));
  }

  // Handle different property types
  switch (type) {
    case PropertyType.Integer:
    case PropertyType.Float:
    case PropertyType.Boolean:
    case PropertyType.String:
    case PropertyType.Text:
      return value;

    case PropertyType.BigInteger:
      return (value as bigint).toString();

    case PropertyType.BigDecimal:
      return String(value);

    case PropertyType.DateTime:
      return (value as Date).toISOString();

    case PropertyType.URI:
      return (value as URL).toString();

    case PropertyType.UUID:
      return String(value);

    case PropertyType.CLOB:
      return String(value);

    case PropertyType.BLOB:
      // Convert Uint8Array to base64
      if (value instanceof Uint8Array) {
        return Buffer.from(value).toString("base64");
      }
      return value;

    default:
      return String(value);
  }
}

/**
 * Deserializes a property value based on its type
 */
export function deserializePropertyValue(value: unknown, type: PropertyType): unknown {
  if (value === null || value === undefined) {
    return null;
  }

  // Handle multivalued properties (arrays)
  if (Array.isArray(value)) {
    return value.map((v) => deserializePropertyValue(v, type));
  }

  // Handle different property types
  switch (type) {
    case PropertyType.Integer:
    case PropertyType.Float:
      return Number(value);

    case PropertyType.Boolean:
      return Boolean(value);

    case PropertyType.String:
    case PropertyType.Text:
      return String(value);

    case PropertyType.BigInteger:
      return BigInt(value as string);

    case PropertyType.BigDecimal:
      return String(value);

    case PropertyType.DateTime:
      return new Date(value as string);

    case PropertyType.URI:
      return new URL(value as string);

    case PropertyType.UUID:
      return String(value);

    case PropertyType.CLOB:
      return String(value);

    case PropertyType.BLOB:
      // Convert base64 to Uint8Array
      if (typeof value === "string") {
        return new Uint8Array(Buffer.from(value, "base64"));
      }
      return value;

    default:
      return value;
  }
}

/**
 * Serializes a Property to JSON
 */
export function serializeProperty(prop: Property): PropertyJson {
  return {
    name: prop.def().name(),
    value: serializePropertyValue(prop.unsafeRead(), prop.def().type()),
  };
}

/**
 * Deserializes a Property from JSON
 */
export function deserializeProperty(json: PropertyJson, propDef: PropertyDef): Property {
  const value = deserializePropertyValue(json.value, propDef.type());
  return new PropertyImpl(propDef, value);
}
