/**
 * Property interfaces
 */

import { PropertyType } from '../types.js';

/**
 * Type alias for a constructor function
 */
export type Constructor<T> = new (...args: any[]) => T;

/**
 * Defines the metadata and constraints for a property within the Cheap data model.
 * A property definition specifies the name, type, and access characteristics of
 * a property that can be associated with aspects.
 *
 * In the Cheap model, properties represent the atomic units of data,
 * similar to columns in a database table or instance variables in objects.
 * The PropertyDef serves as the schema definition that determines how property
 * values are stored, accessed, and validated.
 */
export interface PropertyDef {
  /**
   * Returns the unique name identifier for this property definition.
   *
   * @returns the property name, never null
   */
  name(): string;

  /**
   * Returns the data type of this property.
   * The type determines what kind of values can be stored in properties
   * created from this definition.
   *
   * @returns the property type, never null
   */
  type(): PropertyType;

  /**
   * Returns the default value of this property, which may be null.
   * Defaults to null.
   *
   * @returns the default value
   */
  defaultValue(): unknown;

  /**
   * Determines whether this property has a default value. This allows for
   * a difference between not having a default value and having a default value
   * of null. Defaults to false.
   *
   * @returns true if the default value should be used
   */
  hasDefaultValue(): boolean;

  /**
   * Determines whether properties of this type can be read. Defaults to true.
   *
   * @returns true if the property can be read, false otherwise
   */
  isReadable(): boolean;

  /**
   * Determines whether properties of this type can be written or modified.
   *
   * @returns true if the property can be written, false otherwise
   */
  isWritable(): boolean;

  /**
   * Determines whether properties of this type can have null values.
   *
   * @returns true if null values are allowed, false if the property is required
   */
  isNullable(): boolean;

  /**
   * Determines whether properties of this type can be removed from their parent aspect.
   *
   * @returns true if the property can be removed, false if it is mandatory
   */
  isRemovable(): boolean;

  /**
   * Determines whether properties of this type can hold multiple values.
   * A multivalued property can contain a collection of values rather than a single value.
   *
   * @returns true if the property can hold multiple values, false if it holds a single value
   */
  isMultivalued(): boolean;

  /**
   * Perform a full comparison of every field of this PropertyDef.
   * Normal equals() compares only by name, for performance reasons.
   *
   * @param other the other PropertyDef to compare to
   * @returns true if the other PropertyDef is fully identical to this one
   */
  fullyEquals(other: PropertyDef): boolean;

  /**
   * Generate a Cheap-specific FNV-1a hash of this PropertyDef.
   * This hash should be consistent across all Cheap implementations.
   *
   * Implementations of this interface should probably cache the result of this
   * default method for improved performance.
   *
   * @returns a 64-bit hash value (as bigint)
   */
  hash(): bigint;

  /**
   * Validates that a property value is compatible with this property definition.
   *
   * For multivalued properties (where isMultivalued() returns true), the value
   * must be an Array, and each element in the array is validated against the property type.
   * For single-valued properties, the value itself is validated against the property type.
   *
   * @param value the value to validate
   * @param throwExceptions whether this method should throw exceptions or merely return true/false
   * @throws Error if the value is invalid for the property definition, and throwExceptions is true
   * @returns true if the value is valid, false otherwise
   */
  validatePropertyValue(value: unknown, throwExceptions: boolean): boolean;
}

/**
 * Represents an individual, immutable property within an aspect, serving as the "P"
 * in the Cheap acronym (Catalog, Hierarchy, Entity, Aspect, Property). A Property
 * combines a value with its definition and provides type-safe access to the data.
 *
 * Properties are analogous to columns in database terminology or individual
 * attributes in object-oriented programming. Each property has a definition that
 * specifies its type, constraints, and access permissions.
 *
 * Properties are immutable once created - their values cannot be changed through
 * this interface. To modify property values, new Property instances must be created
 * and applied to their containing Aspect.
 */
export interface Property {
  /**
   * Returns the property definition that describes this property's type,
   * constraints, and access permissions.
   *
   * The property definition serves as the schema for this property instance,
   * defining the expected type and validation rules for its value.
   *
   * @returns the property definition for this property, never null
   */
  def(): PropertyDef;

  /**
   * Reads the property value without performing any validation or security checks.
   * This method provides direct access to the raw value for maximum performance.
   *
   * Use with caution - this method bypasses readability constraints and
   * may return unexpected types or values.
   *
   * @returns the raw property value, may be null
   */
  unsafeRead(): unknown;

  /**
   * Reads the property value with full validation against the property definition.
   * This is the safest read method, performing readability checks before returning the value.
   *
   * This method verifies that the property is readable according to its
   * definition before returning the value.
   *
   * @returns the property value as an Object, may be null
   * @throws Error if the property is not readable
   */
  read(): unknown;

  /**
   * Reads the property value with type casting but without validation.
   * This method bypasses security checks but provides convenient type casting.
   *
   * Use with caution - this method may result in type errors if
   * the actual value type is incompatible with the requested type.
   *
   * @returns the property value cast to type T, may be null
   */
  unsafeReadAs<T>(): T;

  /**
   * Reads the property value with full validation and safe type casting.
   * This is the recommended method for reading typed property values safely.
   *
   * This method performs readability validation and uses TypeScript's type casting
   * mechanisms to ensure type safety. It provides the best balance of safety
   * and usability for typed property access.
   *
   * @param type the Constructor representing the expected type, must not be null
   * @returns the property value cast to the specified type, may be null
   * @throws Error if the property is not readable
   * @throws Error if the value cannot be cast to the specified type
   */
  readAs<T>(type: Constructor<T>): T;
}
