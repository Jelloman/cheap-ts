/**
 * Property implementation stubs
 */

import { Property, PropertyDef, Constructor } from '../interfaces/index.js';
import { PropertyType } from '../types.js';
import { CheapHasher } from '../util/CheapHasher.js';

export class PropertyDefImpl implements PropertyDef {
  private _cachedHash: bigint = 0n;

  constructor(
    private readonly _name: string,
    private readonly _type: PropertyType,
    private readonly _defaultValue: unknown = null,
    private readonly _hasDefaultValue: boolean = false,
    private readonly _isReadable: boolean = true,
    private readonly _isWritable: boolean = true,
    private readonly _isNullable: boolean = false,
    private readonly _isRemovable: boolean = false,
    private readonly _isMultivalued: boolean = false
  ) {}

  name(): string {
    return this._name;
  }

  type(): PropertyType {
    return this._type;
  }

  defaultValue(): unknown {
    return this._defaultValue;
  }

  hasDefaultValue(): boolean {
    return this._hasDefaultValue;
  }

  isReadable(): boolean {
    return this._isReadable;
  }

  isWritable(): boolean {
    return this._isWritable;
  }

  isNullable(): boolean {
    return this._isNullable;
  }

  isRemovable(): boolean {
    return this._isRemovable;
  }

  isMultivalued(): boolean {
    return this._isMultivalued;
  }

  fullyEquals(other: PropertyDef): boolean {
    if (other == null) {
      return false;
    }
    return (
      this.hasDefaultValue() === other.hasDefaultValue() &&
      this.isReadable() === other.isReadable() &&
      this.isWritable() === other.isWritable() &&
      this.isNullable() === other.isNullable() &&
      this.isRemovable() === other.isRemovable() &&
      this.defaultValue() === other.defaultValue() &&
      this.type() === other.type() &&
      this.name() === other.name()
    );
  }

  hash(): bigint {
    if (this._cachedHash === 0n) {
      const hasher = new CheapHasher();

      // Hash all property definition fields in order
      hasher.updateString(this._name);
      hasher.updateString(this._type.toString());
      hasher.updateBoolean(this._hasDefaultValue);

      // Hash default value if it exists
      if (this._hasDefaultValue && this._defaultValue !== null) {
        // Hash based on the type of the default value
        const defaultVal = this._defaultValue;
        if (typeof defaultVal === 'string') {
          hasher.updateString(defaultVal);
        } else if (typeof defaultVal === 'number') {
          hasher.updateNumber(defaultVal);
        } else if (typeof defaultVal === 'boolean') {
          hasher.updateBoolean(defaultVal);
        } else if (typeof defaultVal === 'bigint') {
          hasher.updateBigInt(defaultVal);
        } else if (defaultVal instanceof Date) {
          hasher.updateDate(defaultVal);
        } else if (defaultVal instanceof URL) {
          hasher.updateURL(defaultVal);
        } else if (defaultVal instanceof Uint8Array) {
          hasher.updateBytes(defaultVal);
        } else {
          // For other types, hash their string representation
          hasher.updateString(String(defaultVal));
        }
      } else if (this._hasDefaultValue && this._defaultValue === null) {
        // Hash null explicitly
        hasher.updateString(null);
      }

      hasher.updateBoolean(this._isReadable);
      hasher.updateBoolean(this._isWritable);
      hasher.updateBoolean(this._isNullable);
      hasher.updateBoolean(this._isRemovable);
      hasher.updateBoolean(this._isMultivalued);

      this._cachedHash = hasher.getHash();
    }
    return this._cachedHash;
  }

  validatePropertyValue(value: unknown, throwExceptions: boolean): boolean {
    // Check nullability
    if (value == null && !this.isNullable()) {
      if (throwExceptions) {
        throw new Error(`Property '${this.name()}' does not allow null values`);
      }
      return false;
    }

    // Check type compatibility if value is not null
    if (value != null) {
      const expectedType = this.type();
      const expectedJsType = expectedType.getJsType();

      if (this.isMultivalued()) {
        // For multivalued properties, expect an Array
        if (!Array.isArray(value)) {
          if (throwExceptions) {
            throw new Error(
              `Property '${this.name()}' is multivalued and expects an Array but got ${typeof value}`
            );
          }
          return false;
        }

        // Because of type erasure, the only way to validate the correctness of
        // the type of the array is to examine each element. For performance reasons,
        // we examine only the first element, if there is one.
        if (value.length > 0) {
          const element = value[0];
          if (element != null && !(element instanceof expectedJsType)) {
            if (throwExceptions) {
              throw new Error(
                `Property '${this.name()}' expects Array<${expectedJsType.name}> but the first element is ${typeof element}`
              );
            }
            return false;
          }
        }
      } else {
        // For single-valued properties, validate the value directly
        // Check primitive types with typeof, objects with instanceof
        let isValid = false;
        if (expectedJsType === Number) {
          isValid = typeof value === 'number';
        } else if (expectedJsType === String) {
          isValid = typeof value === 'string';
        } else if (expectedJsType === Boolean) {
          isValid = typeof value === 'boolean';
        } else if (expectedJsType === BigInt) {
          isValid = typeof value === 'bigint';
        } else {
          // For object types (Date, URL, Uint8Array, etc.), use instanceof
          isValid = value instanceof expectedJsType;
        }

        if (!isValid) {
          if (throwExceptions) {
            throw new Error(
              `Property '${this.name()}' expects type ${expectedJsType.name} but got ${typeof value}`
            );
          }
          return false;
        }
      }
    }
    return true;
  }
}

export class PropertyImpl implements Property {
  constructor(
    private readonly _def: PropertyDef,
    private readonly _value: unknown
  ) {}

  def(): PropertyDef {
    return this._def;
  }

  unsafeRead(): unknown {
    return this._value;
  }

  read(): unknown {
    const def = this.def();
    const name = def.name();
    if (!def.isReadable()) {
      throw new Error(`Property '${name}' is not readable.`);
    }
    return this.unsafeRead();
  }

  unsafeReadAs<T>(): T {
    return this.read() as T;
  }

  readAs<T>(type: Constructor<T>): T {
    const def = this.def();
    const name = def.name();
    if (!def.isReadable()) {
      throw new Error(`Property '${name}' is not readable.`);
    }
    const value = this.unsafeRead();
    if (value == null) {
      return value as T;
    }
    if (!(value instanceof type)) {
      throw new Error(
        `Property '${name}' of type '${typeof value}' cannot be assigned to type '${type.name}'.`
      );
    }
    return value as T;
  }
}
