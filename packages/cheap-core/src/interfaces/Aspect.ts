/**
 * Aspect interfaces
 *
 * An Aspect represents a collection of related properties that describe a particular facet
 * or characteristic of an entity. Aspects are analogous to rows in database terminology
 * or file attributes in a filesystem context.
 */

import { Property, PropertyDef } from './Property.js';
import { Entity } from './Entity.js';

/**
 * Defines the structure and metadata for an aspect type within the Cheap data model.
 * An aspect definition specifies the properties that can be associated with entities
 * and controls the read/write capabilities and mutability of those properties.
 *
 * AspectDef extends Entity, so it has a global ID.
 */
export interface AspectDef extends Entity {
  /**
   * Returns the unique name identifier for this aspect definition.
   */
  name(): string;

  /**
   * Returns all property definitions that belong to this aspect.
   */
  propertyDefs(): ReadonlyArray<PropertyDef>;

  /**
   * Return the number of properties in this AspectDef.
   */
  size(): number;

  /**
   * Retrieves a specific property definition by name.
   * Returns null if not found.
   */
  propertyDef(name: string): PropertyDef | null;

  /**
   * Determines whether aspects of this type can be read.
   * Defaults to true.
   */
  isReadable(): boolean;

  /**
   * Determines whether aspects of this type can be written or modified.
   * Defaults to true.
   */
  isWritable(): boolean;

  /**
   * Determines whether new properties can be dynamically added to aspects of this type.
   * This controls the mutability of the aspect at runtime, but it does NOT control the
   * mutability of the AspectDef itself.
   * Defaults to false.
   */
  canAddProperties(): boolean;

  /**
   * Determines whether properties can be dynamically removed from aspects of this type.
   * Defaults to false.
   */
  canRemoveProperties(): boolean;

  /**
   * Perform a full comparison of every field of this AspectDef.
   * Normal equals() compares only by name, for performance reasons.
   */
  fullyEquals(other: AspectDef): boolean;

  /**
   * Generate a Cheap-specific FNV-1a hash of this AspectDef.
   * This hash should be consistent across all Cheap implementations.
   *
   * Implementations should cache the result of this method for improved performance.
   */
  hash(): bigint;
}

/**
 * Mutable variant of AspectDef that allows adding and removing property definitions.
 */
export interface MutableAspectDef extends AspectDef {
  /**
   * Adds a property definition to this mutable aspect definition.
   * Returns the previous property definition with the same name, or null if none existed.
   */
  add(prop: PropertyDef): PropertyDef | null;

  /**
   * Removes a property definition from this mutable aspect definition.
   * Returns the removed property definition, or null if it wasn't present.
   */
  remove(prop: PropertyDef): PropertyDef | null;
}

/**
 * Represents an aspect that can be attached to an entity.
 *
 * Aspects have three lifecycle stages:
 * 1. Detached (optional): not attached to any entity
 * 2. Attached: attached to an entity, but not in any catalog
 * 3. Saved: Attached to an entity and stored in a catalog
 *
 * This interface provides both safe (type-checked) and unsafe (unchecked) methods
 * for reading and writing property values.
 */
export interface Aspect {
  /**
   * Returns the aspect definition that describes this aspect's structure.
   */
  def(): AspectDef;

  /**
   * Returns the entity that owns this aspect.
   */
  entity(): Entity;

  /**
   * Set the entity that owns this aspect. If the entity is already set
   * and this is not flagged as transferable by its AspectDef, an
   * Error will be thrown.
   */
  setEntity(entity: Entity): void;

  /**
   * Reads a property value without performing validation against the aspect definition.
   * Use with caution - this method can return unexpected types or throw runtime
   * exceptions if the property doesn't exist or has an incompatible type.
   */
  unsafeReadObj(propName: string): unknown;

  /**
   * Returns a flag indicating whether this aspect may be transferred between entities.
   * Defaults to false.
   */
  isTransferable(): boolean;

  /**
   * Writes a property value without performing validation against the aspect definition.
   * Use with caution - this method can corrupt data if used with incompatible
   * types or violate business rules defined by the aspect definition.
   */
  unsafeWrite(propName: string, value: unknown): void;

  /**
   * Adds a new property to this aspect without validation.
   * Use with caution - this method can violate aspect definition constraints.
   */
  unsafeAdd(prop: Property): void;

  /**
   * Removes a property from this aspect without validation.
   * Use with caution - this method can violate aspect definition constraints.
   */
  unsafeRemove(propName: string): void;

  /**
   * Checks whether this aspect contains a property with the specified name.
   * A property is considered present if its value is not null.
   */
  contains(propName: string): boolean;

  /**
   * Reads a property value with type casting but without validation against
   * the aspect definition. This provides a balance between performance and usability.
   */
  uncheckedRead<T>(propName: string): T;

  /**
   * Reads a property value with type casting and no validation against the
   * aspect definition. This is the fastest read method but provides no safety guarantees.
   */
  unsafeRead<T>(propName: string): T;

  /**
   * Reads a property value with full validation against the aspect definition.
   * This is the safest read method, performing all security and existence checks.
   */
  readObj(propName: string): unknown;

  /**
   * Reads a property value with type casting and validation.
   */
  readAs<T>(propName: string): T;

  /**
   * Gets a property with full validation and access control.
   */
  get(propName: string): Property;

  /**
   * Stores a property in this aspect with full validation and access control.
   */
  put(prop: Property): void;

  /**
   * Removes a property from this aspect with full validation.
   */
  remove(prop: Property): void;

  /**
   * Writes a property value with full validation against the aspect definition.
   */
  write(propName: string, value: unknown): void;

  /**
   * Adds multiple properties to this aspect with validation.
   */
  putAll(properties: Iterable<Property>): void;

  /**
   * Writes multiple properties without validation.
   */
  unsafeWriteAll(properties: Iterable<Property>): void;
}

/**
 * A builder interface for creating Aspect instances using the builder pattern.
 */
export interface AspectBuilder {
  /**
   * Sets the entity for the aspect being built.
   */
  entity(entity: Entity): AspectBuilder;

  /**
   * Sets the aspect definition that defines the structure and schema for the aspect.
   */
  aspectDef(aspectDef: AspectDef): AspectBuilder;

  /**
   * Adds a property with the specified name and value to the aspect being built.
   */
  property(propertyName: string, value: unknown): AspectBuilder;

  /**
   * Adds a property to the aspect being built.
   */
  property(property: Property): AspectBuilder;

  /**
   * Builds and returns the configured Aspect instance.
   */
  build(): Aspect;

  /**
   * Resets this builder to its initial state, clearing all configured values.
   */
  reset(): AspectBuilder;
}
