/**
 * PropertyDefBuilder implementation
 */

import { PropertyDef } from '../interfaces/index.js';
import { PropertyType } from '../types.js';
import { PropertyDefImpl } from './PropertyImpl.js';

/**
 * Builder class for creating PropertyDef instances using the builder pattern.
 * Provides a fluent interface for configuring property definitions.
 */
export class PropertyDefBuilder {
  private _name: string | null = null;
  private _type: PropertyType | null = null;
  private _defaultValue: unknown = null;
  private _hasDefaultValue: boolean = false;
  private _isReadable: boolean = true;
  private _isWritable: boolean = true;
  private _isNullable: boolean = true;
  private _isRemovable: boolean = true;
  private _isMultivalued: boolean = false;

  /**
   * Sets the name of the property definition.
   */
  setName(name: string): PropertyDefBuilder {
    this._name = name;
    return this;
  }

  /**
   * Sets the type of the property definition.
   */
  setType(type: PropertyType): PropertyDefBuilder {
    this._type = type;
    return this;
  }

  /**
   * Sets the default value for the property definition.
   * Also sets hasDefaultValue to true.
   */
  setDefaultValue(defaultValue: unknown): PropertyDefBuilder {
    this._defaultValue = defaultValue;
    this._hasDefaultValue = true;
    return this;
  }

  /**
   * Sets whether this property has a default value.
   * If set to false, clears the default value.
   */
  setHasDefaultValue(hasDefaultValue: boolean): PropertyDefBuilder {
    this._hasDefaultValue = hasDefaultValue;
    if (!hasDefaultValue) {
      this._defaultValue = null;
    }
    return this;
  }

  /**
   * Sets whether this property is readable.
   */
  setIsReadable(isReadable: boolean): PropertyDefBuilder {
    this._isReadable = isReadable;
    return this;
  }

  /**
   * Sets whether this property is writable.
   */
  setIsWritable(isWritable: boolean): PropertyDefBuilder {
    this._isWritable = isWritable;
    return this;
  }

  /**
   * Sets whether this property can have null values.
   */
  setIsNullable(isNullable: boolean): PropertyDefBuilder {
    this._isNullable = isNullable;
    return this;
  }

  /**
   * Sets whether this property can be removed from its parent aspect.
   */
  setIsRemovable(isRemovable: boolean): PropertyDefBuilder {
    this._isRemovable = isRemovable;
    return this;
  }

  /**
   * Sets whether this property can hold multiple values.
   */
  setIsMultivalued(isMultivalued: boolean): PropertyDefBuilder {
    this._isMultivalued = isMultivalued;
    return this;
  }

  /**
   * Builds and returns the configured PropertyDef instance.
   * Validates that required fields (name and type) are set.
   */
  build(): PropertyDef {
    if (!this._name) {
      throw new Error('Property name must be set before building');
    }
    if (!this._type) {
      throw new Error('Property type must be set before building');
    }

    return new PropertyDefImpl(
      this._name,
      this._type,
      this._defaultValue,
      this._hasDefaultValue,
      this._isReadable,
      this._isWritable,
      this._isNullable,
      this._isRemovable,
      this._isMultivalued
    );
  }

  /**
   * Resets this builder to its initial state, clearing all configured values.
   */
  reset(): PropertyDefBuilder {
    this._name = null;
    this._type = null;
    this._defaultValue = null;
    this._hasDefaultValue = false;
    this._isReadable = true;
    this._isWritable = true;
    this._isNullable = true;
    this._isRemovable = true;
    this._isMultivalued = false;
    return this;
  }
}
