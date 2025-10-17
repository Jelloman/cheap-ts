/**
 * AspectBuilder implementation classes
 */

import { Aspect, AspectBuilder, AspectDef, Entity, Property } from "../interfaces/index.js";
import { AspectPropertyMapImpl, AspectObjectMapImpl } from "./AspectImpl.js";
import { PropertyImpl } from "./PropertyImpl.js";

/**
 * Abstract base class providing common functionality for AspectBuilder implementations.
 * This class handles entity management, aspect definition storage, property collection,
 * and validation logic that is shared across different builder implementations.
 */
export abstract class AspectBuilderBase implements AspectBuilder {
  private _entity: Entity | null = null;
  private _aspectDef: AspectDef | null = null;
  private readonly _properties: Map<string, unknown>;

  /**
   * Creates a new AspectBuilderBase with empty initial state.
   */
  protected constructor() {
    this._properties = new Map();
  }

  /**
   * Sets the entity for the aspect being built.
   */
  entity(entity: Entity): AspectBuilder {
    if (!entity) {
      throw new Error("Entity cannot be null");
    }
    this._entity = entity;
    return this;
  }

  /**
   * Sets the aspect definition that defines the structure and schema for the aspect.
   */
  aspectDef(aspectDef: AspectDef): AspectBuilder {
    if (!aspectDef) {
      throw new Error("AspectDef cannot be null");
    }
    this._aspectDef = aspectDef;
    return this;
  }

  /**
   * Adds a property with the specified name and value to the aspect being built.
   * This overload accepts either a property name and value, or a Property object.
   */
  property(propertyNameOrProperty: string | Property, value?: unknown): AspectBuilder {
    if (typeof propertyNameOrProperty === "string") {
      // Called with (propertyName, value)
      const propertyName = propertyNameOrProperty;
      if (!propertyName) {
        throw new Error("Property name cannot be null");
      }
      this._properties.set(propertyName, value);
    } else {
      // Called with (property)
      const property = propertyNameOrProperty;
      if (!property) {
        throw new Error("Property cannot be null");
      }
      const propertyName = property.def().name();
      const propertyValue = property.read();
      this._properties.set(propertyName, propertyValue);
    }
    return this;
  }

  /**
   * Builds and returns the configured Aspect instance.
   */
  build(): Aspect {
    this.validateBuildPrerequisites();
    return this.createAspect();
  }

  /**
   * Resets this builder to its initial state, clearing all configured values.
   */
  reset(): AspectBuilder {
    this._entity = null;
    this._aspectDef = null;
    this._properties.clear();
    return this;
  }

  /**
   * Validates that all required components are set before building an aspect.
   */
  protected validateBuildPrerequisites(): void {
    if (!this._entity) {
      throw new Error("Entity must be set before building aspect");
    }
    if (!this._aspectDef) {
      throw new Error("AspectDef must be set before building aspect");
    }
  }

  /**
   * Returns the entity that has been set for this builder.
   */
  protected getEntity(): Entity {
    if (!this._entity) {
      throw new Error("Entity has not been set");
    }
    return this._entity;
  }

  /**
   * Returns the aspect definition that has been set for this builder.
   */
  protected getAspectDef(): AspectDef {
    if (!this._aspectDef) {
      throw new Error("AspectDef has not been set");
    }
    return this._aspectDef;
  }

  /**
   * Returns a copy of the properties that have been set for this builder.
   */
  protected getProperties(): Map<string, unknown> {
    return new Map(this._properties);
  }

  /**
   * Applies all configured properties to the specified aspect by calling
   * Aspect.write() for each property.
   */
  protected applyPropertiesToAspect(aspect: Aspect): void {
    if (!aspect) {
      throw new Error("Aspect cannot be null");
    }
    for (const [key, value] of this._properties.entries()) {
      aspect.write(key, value);
    }
  }

  /**
   * Creates and returns the specific aspect type with the configured entity,
   * aspect definition, and properties.
   */
  protected abstract createAspect(): Aspect;
}

/**
 * Builder implementation for creating AspectPropertyMapImpl instances using the builder pattern.
 * This builder enforces strict validation against the AspectDef.
 */
export class AspectPropertyMapBuilder implements AspectBuilder {
  private _entity: Entity | null = null;
  private _aspectDef: AspectDef | null = null;
  private readonly _properties: Map<string, Property>;

  constructor() {
    this._properties = new Map();
  }

  /**
   * Sets the entity for the aspect being built.
   */
  entity(entity: Entity): AspectBuilder {
    if (!entity) {
      throw new Error("Entity cannot be null");
    }
    this._entity = entity;
    return this;
  }

  /**
   * Sets the aspect definition that defines the structure and schema for the aspect.
   */
  aspectDef(aspectDef: AspectDef): AspectBuilder {
    if (!aspectDef) {
      throw new Error("AspectDef cannot be null");
    }
    this._aspectDef = aspectDef;

    // Revalidate existing properties if any
    if (this._properties.size > 0) {
      for (const property of this._properties.values()) {
        this.validateProperty(property);
      }
    }
    return this;
  }

  /**
   * Adds a property with the specified name and value to the aspect being built.
   * This overload accepts either a property name and value, or a Property object.
   */
  property(propertyNameOrProperty: string | Property, value?: unknown): AspectBuilder {
    if (typeof propertyNameOrProperty === "string") {
      // Called with (propertyName, value)
      const propertyName = propertyNameOrProperty;
      if (!propertyName) {
        throw new Error("Property name cannot be null");
      }

      if (!this._aspectDef) {
        throw new Error("AspectDef must be set before adding properties by name and value.");
      }

      const propertyDef = this._aspectDef.propertyDef(propertyName);
      if (!propertyDef) {
        throw new Error(`Property '${propertyName}' is not defined in AspectDef '${this._aspectDef.name()}'`);
      }
      const property = new PropertyImpl(propertyDef, value);
      this.validateProperty(property);
      this._properties.set(propertyName, property);
    } else {
      // Called with (property)
      const property = propertyNameOrProperty;
      if (!property) {
        throw new Error("Property cannot be null");
      }

      if (this._aspectDef) {
        this.validateProperty(property);
      }

      this._properties.set(property.def().name(), property);
    }
    return this;
  }

  /**
   * Validate a property. The AspectDef MUST be set before calling this method.
   */
  private validateProperty(property: Property): void {
    if (!this._aspectDef) {
      throw new Error("Cannot call validateProperty() before the AspectDef is set.");
    }
    const propName = property.def().name();
    const expectedPropertyDef = this._aspectDef.propertyDef(propName);

    if (!expectedPropertyDef) {
      if (!this._aspectDef.canAddProperties()) {
        throw new Error(
          `AspectDef '${this._aspectDef.name()}' does not define property '${propName}' and does not allow adding Properties.`,
        );
      }
    } else if (expectedPropertyDef !== property.def() && !expectedPropertyDef.fullyEquals(property.def())) {
      throw new Error(
        `Property definition for '${propName}' does not match the definition in AspectDef '${this._aspectDef.name()}'`,
      );
    }
    // Validate value, throwing exceptions on failure
    property.def().validatePropertyValue(property.read(), true);
  }

  /**
   * Builds and returns the configured AspectPropertyMapImpl instance.
   */
  build(): Aspect {
    if (!this._entity) {
      throw new Error("Entity must be set before building aspect");
    }
    if (!this._aspectDef) {
      throw new Error("AspectDef must be set before building aspect");
    }

    const aspect = new AspectPropertyMapImpl(this._entity, this._aspectDef);

    // Add all configured properties to the aspect
    for (const property of this._properties.values()) {
      // Use unsafe because validation was performed when the property was added to this builder
      aspect.unsafeAdd(property);
    }

    return aspect;
  }

  /**
   * Resets this builder to its initial state, clearing all configured values.
   */
  reset(): AspectBuilder {
    this._entity = null;
    this._aspectDef = null;
    this._properties.clear();
    return this;
  }
}

/**
 * Builder implementation for creating AspectObjectMapImpl instances using the builder pattern.
 * This implementation extends AspectBuilderBase to inherit common builder functionality.
 */
export class AspectObjectMapBuilder extends AspectBuilderBase {
  constructor() {
    super();
  }

  /**
   * Creates and returns an AspectObjectMapImpl instance with the configured entity,
   * aspect definition, and properties.
   */
  protected createAspect(): Aspect {
    const aspect = new AspectObjectMapImpl(this.getEntity(), this.getAspectDef());
    this.applyPropertiesToAspect(aspect);
    return aspect;
  }
}
