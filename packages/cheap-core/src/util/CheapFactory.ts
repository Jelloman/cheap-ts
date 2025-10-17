/*
 * Copyright (c) 2025. David Noha
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *  http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { PropertyDef } from "../interfaces/Property.js";
import { AspectDef, Aspect, AspectBuilder } from "../interfaces/Aspect.js";
import { Entity } from "../interfaces/Entity.js";
import { PropertyType, LocalEntityType } from "../types.js";
import { PropertyDefImpl, PropertyImpl } from "../impl/PropertyImpl.js";
import { MutableAspectDefImpl, ImmutableAspectDefImpl } from "../impl/AspectDefImpl.js";
import { EntityImpl } from "../impl/EntityImpl.js";
import { PropertyValueAdapter } from "./PropertyValueAdapter.js";
import { AspectObjectMapImpl, AspectPropertyMapImpl } from "../impl/AspectImpl.js";
import { AspectObjectMapBuilder } from "../impl/AspectBuilderImpl.js";

/**
 * Factory class providing instance-based factory methods for creating instances of all
 * concrete implementation classes in the CHEAP model.
 *
 * All factory methods return interface types from the interfaces package
 * rather than concrete implementation types, promoting loose coupling and
 * implementation hiding.
 *
 * This factory can be configured with a default LocalEntityType to control
 * which implementation is used when creating LocalEntity instances.
 *
 * This factory simplifies object creation and provides a clean API for
 * instantiating Cheap model objects without directly depending on implementation classes.
 */
export class CheapFactory {
  /** The default LocalEntity type to create when not explicitly specified. */
  private readonly defaultLocalEntityType: LocalEntityType;
  /** The default AspectBuilder class to use when creating builders. */
  private readonly aspectBuilderClass: new () => AspectBuilder;
  private readonly aspectDefs: Map<string, AspectDef> = new Map();
  private readonly entities: Map<string, Entity> = new Map();
  private readonly propertyAdapter: PropertyValueAdapter;
  private timeZone: string;

  /**
   * Creates a new CheapFactory with the defaults of LocalEntityType.SINGLE_CATALOG
   * and AspectObjectMapBuilder.
   */
  constructor();

  /**
   * Creates a new CheapFactory with the specified default LocalEntity type and AspectBuilder class.
   * If null, these default to LocalEntityType.SINGLE_CATALOG and AspectObjectMapBuilder.
   *
   * @param defaultLocalEntityType the default type of LocalEntity to create
   * @param aspectBuilderClass the default AspectBuilder class to use
   */
  constructor(defaultLocalEntityType?: LocalEntityType | null, aspectBuilderClass?: (new () => AspectBuilder) | null);

  constructor(defaultLocalEntityType?: LocalEntityType | null, aspectBuilderClass?: (new () => AspectBuilder) | null) {
    this.defaultLocalEntityType = defaultLocalEntityType ?? LocalEntityType.SINGLE_CATALOG;
    this.aspectBuilderClass = aspectBuilderClass ?? AspectObjectMapBuilder;
    this.timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    this.propertyAdapter = new PropertyValueAdapter(this.timeZone);
  }

  getTimeZone(): string {
    return this.timeZone;
  }

  setTimeZone(timeZone: string): void {
    this.timeZone = timeZone;
    this.propertyAdapter.setTimeZone(timeZone);
  }

  /**
   * Returns the default LocalEntity type configured for this factory.
   *
   * @returns the default LocalEntity type
   */
  getDefaultLocalEntityType(): LocalEntityType {
    return this.defaultLocalEntityType;
  }

  /**
   * Returns the default AspectBuilder class configured for this factory.
   *
   * @returns the default AspectBuilder class
   */
  getAspectBuilderClass(): new () => AspectBuilder {
    return this.aspectBuilderClass;
  }

  /**
   * Creates a new AspectBuilder instance of the configured type.
   *
   * @returns a new AspectBuilder instance
   */
  createAspectBuilder(): AspectBuilder {
    return new this.aspectBuilderClass();
  }

  /**
   * Return the AspectDef registered in this factory with the given name, or
   * null if not found.
   *
   * @param name aspectDef name
   * @returns the aspectDef with that name
   */
  getAspectDef(name: string): AspectDef | undefined {
    return this.aspectDefs.get(name);
  }

  /**
   * Register an AspectDef with this factory.
   *
   * @param aspectDef the aspectDef to register
   * @returns the existing AspectDef registered under that name, if any
   */
  registerAspectDef(aspectDef: AspectDef): AspectDef | undefined {
    const existing = this.aspectDefs.get(aspectDef.name());
    this.aspectDefs.set(aspectDef.name(), aspectDef);
    return existing;
  }

  /**
   * Return the Entity registered in this factory with the given id, or
   * undefined if not found.
   *
   * @param id entity id
   * @returns the entity with that id
   */
  getEntity(id: string): Entity | undefined {
    return this.entities.get(id);
  }

  /**
   * Register an Entity with this factory.
   *
   * @param entity the Entity to register
   * @returns the existing Entity registered under that id, if any
   */
  registerEntity(entity: Entity): Entity | undefined {
    const existing = this.entities.get(entity.globalId());
    this.entities.set(entity.globalId(), entity);
    return existing;
  }

  // ===== Entity Factory Methods =====

  /**
   * Creates a new entity with a random UUID.
   *
   * @returns a new Entity instance
   */
  createEntity(): Entity;

  /**
   * Creates a new entity with the specified global ID.
   *
   * @param globalId the UUID for the entity
   * @returns a new Entity instance
   */
  createEntity(globalId: string): Entity;

  createEntity(globalId?: string): Entity {
    if (globalId === undefined) {
      return new EntityImpl();
    }
    return new EntityImpl(globalId);
  }

  /**
   * Creates a new entity with a random UUID and registers it.
   *
   * @returns a new Entity instance
   */
  createAndRegisterEntity(): Entity {
    const entity = this.createEntity();
    this.entities.set(entity.globalId(), entity);
    return entity;
  }

  /**
   * Find the registered entity with the specified global ID; if it's not
   * found, create and register a new one.
   *
   * @param globalId the UUID for the entity
   * @returns an Entity instance
   */
  getOrRegisterNewEntity(globalId: string): Entity {
    let entity = this.entities.get(globalId);
    if (entity) {
      return entity;
    }
    entity = this.createEntity(globalId);
    this.entities.set(globalId, entity);
    return entity;
  }

  // TODO: Implement createLocalEntity() method
  // The Java version has a single LocalEntityImpl class, but the TypeScript version
  // has specialized implementations (LocalEntityOneCatalogImpl, LocalEntityMultiCatalogImpl, etc.)
  // This needs to be refactored to use the appropriate implementation based on defaultLocalEntityType.

  // ===== Aspect Definition Factory Methods =====

  /**
   * Creates a new mutable aspect definition.
   *
   * @param name the name of this aspect definition
   * @returns a new mutable AspectDef instance
   */
  createMutableAspectDef(name: string): AspectDef;

  /**
   * Creates a new mutable aspect definition with property definitions.
   *
   * @param name the name of this aspect definition
   * @param propertyDefs the map of property names to property definitions
   * @returns a new mutable AspectDef instance
   */
  createMutableAspectDef(name: string, propertyDefs: Map<string, PropertyDef>): AspectDef;

  /**
   * Creates a new mutable aspect definition with explicit UUID and property definitions.
   *
   * @param name the name of this aspect definition
   * @param aspectDefId the global ID of this aspect definition
   * @param propertyDefs the map of property names to property definitions
   * @returns a new mutable AspectDef instance
   */
  createMutableAspectDef(name: string, aspectDefId: string, propertyDefs: Map<string, PropertyDef>): AspectDef;

  createMutableAspectDef(
    name: string,
    aspectDefIdOrPropertyDefs?: string | Map<string, PropertyDef>,
    propertyDefs?: Map<string, PropertyDef>,
  ): AspectDef {
    if (aspectDefIdOrPropertyDefs === undefined) {
      // Single parameter: name only
      return new MutableAspectDefImpl(name, crypto.randomUUID(), undefined);
    } else if (typeof aspectDefIdOrPropertyDefs === "string") {
      // Three parameters: name, aspectDefId, propertyDefs
      return new MutableAspectDefImpl(name, aspectDefIdOrPropertyDefs, propertyDefs);
    } else {
      // Two parameters: name, propertyDefs
      return new MutableAspectDefImpl(name, crypto.randomUUID(), aspectDefIdOrPropertyDefs);
    }
  }

  /**
   * Creates a new immutable aspect definition.
   *
   * @param name the name of this aspect definition
   * @param propertyDefs the map of property names to property definitions
   * @returns a new immutable AspectDef instance
   */
  createImmutableAspectDef(name: string, propertyDefs: Map<string, PropertyDef>): AspectDef;

  /**
   * Creates a new immutable aspect definition with explicit UUID.
   *
   * @param name the name of this aspect definition
   * @param aspectDefId the global ID of this aspect definition
   * @param propertyDefs the map of property names to property definitions
   * @returns a new immutable AspectDef instance
   */
  createImmutableAspectDef(name: string, aspectDefId: string, propertyDefs: Map<string, PropertyDef>): AspectDef;

  createImmutableAspectDef(
    name: string,
    aspectDefIdOrPropertyDefs: string | Map<string, PropertyDef>,
    propertyDefs?: Map<string, PropertyDef>,
  ): AspectDef {
    if (typeof aspectDefIdOrPropertyDefs === "string") {
      // Three parameters: name, aspectDefId, propertyDefs
      return new ImmutableAspectDefImpl(name, aspectDefIdOrPropertyDefs, propertyDefs!);
    } else {
      // Two parameters: name, propertyDefs
      return new ImmutableAspectDefImpl(name, crypto.randomUUID(), aspectDefIdOrPropertyDefs);
    }
  }

  /**
   * Convenience alias for createMutableAspectDef.
   *
   * @param name the name of this aspect definition
   * @returns a new mutable AspectDef instance
   */
  createAspectDef(name: string): AspectDef;

  /**
   * Convenience alias for createMutableAspectDef.
   *
   * @param name the name of this aspect definition
   * @param propertyDefs the map of property names to property definitions
   * @returns a new mutable AspectDef instance
   */
  createAspectDef(name: string, propertyDefs: Map<string, PropertyDef>): AspectDef;

  createAspectDef(name: string, propertyDefs?: Map<string, PropertyDef>): AspectDef {
    return this.createMutableAspectDef(name, propertyDefs as any);
  }

  // ===== Property Factory Methods =====

  /**
   * Creates a new property definition with default settings.
   *
   * @param name the name of the property
   * @param type the data type of the property
   * @returns a new PropertyDef instance
   */
  createPropertyDef(name: string, type: PropertyType): PropertyDef;

  /**
   * Creates a new property definition with full configuration.
   *
   * @param name the name of the property
   * @param type the data type of the property
   * @param defaultValue the default value for the property
   * @param hasDefaultValue whether the property has a default value
   * @param isReadable whether the property can be read
   * @param isWritable whether the property can be written
   * @param isNullable whether the property accepts null values
   * @param isRemovable whether the property can be removed
   * @param isMultivalued whether the property can hold multiple values
   * @returns a new PropertyDef instance
   */
  createPropertyDef(
    name: string,
    type: PropertyType,
    defaultValue: unknown,
    hasDefaultValue: boolean,
    isReadable: boolean,
    isWritable: boolean,
    isNullable: boolean,
    isRemovable: boolean,
    isMultivalued: boolean,
  ): PropertyDef;

  createPropertyDef(
    name: string,
    type: PropertyType,
    defaultValue?: unknown,
    hasDefaultValue?: boolean,
    isReadable?: boolean,
    isWritable?: boolean,
    isNullable?: boolean,
    isRemovable?: boolean,
    isMultivalued?: boolean,
  ): PropertyDef {
    if (defaultValue === undefined) {
      // Simple overload: just name and type
      return new PropertyDefImpl(name, type);
    }

    // Full overload with all parameters
    return new PropertyDefImpl(
      name,
      type,
      defaultValue,
      hasDefaultValue ?? false,
      isReadable ?? true,
      isWritable ?? true,
      isNullable ?? false,
      isRemovable ?? false,
      isMultivalued ?? false,
    );
  }

  /**
   * Creates a new read-only property definition.
   *
   * @param name the name of the property
   * @param type the data type of the property
   * @param isNullable whether the property accepts null values
   * @param isRemovable whether the property can be removed
   * @returns a new read-only PropertyDef instance
   */
  createReadOnlyPropertyDef(name: string, type: PropertyType, isNullable: boolean, isRemovable: boolean): PropertyDef {
    return new PropertyDefImpl(
      name,
      type,
      null,
      false,
      true, // isReadable
      false, // isWritable
      isNullable,
      isRemovable,
      false, // isMultivalued
    );
  }

  /**
   * Creates a new property with the specified value.
   * The value will be coerced to the type specified in the PropertyDef if necessary.
   *
   * @param def the property definition for this property
   * @param value the value to store in this property
   * @returns a new Property instance
   * @throws Error if the value cannot be coerced to the required type
   */
  createProperty(def: PropertyDef, value: unknown) {
    const coercedValue = this.propertyAdapter.coerce(def, value);
    return new PropertyImpl(def, coercedValue);
  }

  // ===== Aspect Factory Methods =====

  /**
   * Creates a new aspect with object-based property storage.
   *
   * @param entity the entity this aspect is attached to
   * @param def the aspect definition describing this aspect's structure
   * @returns a new Aspect instance
   */
  createObjectMapAspect(entity: Entity | null, def: AspectDef): Aspect {
    return new AspectObjectMapImpl(entity, def);
  }

  /**
   * Creates a new aspect with Property-based storage.
   *
   * @param entity the entity this aspect is attached to
   * @param def the aspect definition describing this aspect's structure
   * @returns a new Aspect instance
   */
  createPropertyMapAspect(entity: Entity | null, def: AspectDef): Aspect {
    return new AspectPropertyMapImpl(entity, def);
  }
}
