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

import { PropertyDef } from '../interfaces/Property.js';
import { PropertyType } from '../types.js';

/**
 * Provides coercion functions to allow a wider variety of types to be
 * assigned to Cheap Properties.
 */
export class PropertyValueAdapter {
  private timeZone: string;

  constructor(timeZone?: string) {
    this.timeZone = timeZone || Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  getTimeZone(): string {
    return this.timeZone;
  }

  setTimeZone(timeZone: string): void {
    this.timeZone = timeZone;
  }

  /**
   * Attempts to coerce the given value to the type represented by this PropertyType.
   * If the value is already of the correct type, it is returned as-is.
   * If the value is a List or array (for multivalued properties), each element is coerced.
   * If the value can be converted to the target type, the converted value is returned.
   * If conversion is not possible, an Error is thrown.
   *
   * @param propDef the property definition
   * @param value the value to coerce to this property type
   * @returns the coerced value
   * @throws Error if the value cannot be coerced to this type
   */
  coerce(propDef: PropertyDef, value: unknown): unknown {
    if (value === null || value === undefined) {
      if (!propDef.isNullable()) {
        throw new Error(`Property '${propDef.name()}' cannot be null.`);
      }
      return null;
    }

    if (!propDef.isMultivalued()) {
      return this.coerceSingleValue(propDef.type(), value);
    }

    // Handle arrays for multivalued properties
    if (Array.isArray(value)) {
      // Check if any element needs coercion
      let needsCoercion = false;
      for (const element of value) {
        const coerced = this.coerceSingleValue(propDef.type(), element);
        if (coerced !== element) {
          needsCoercion = true;
          break;
        }
      }

      if (needsCoercion) {
        // Coerce all elements
        return value.map((element) => this.coerceSingleValue(propDef.type(), element));
      }

      // No element needed coercion, return as-is
      return value;
    }

    throw new Error(
      `Property '${propDef.name()}' is multivalued and cannot be assigned from ${typeof value}.`
    );
  }

  /**
   * Coerces a single (non-collection) value to the type represented by this PropertyType.
   *
   * @param type the property type
   * @param value the single value to coerce
   * @returns the coerced value
   * @throws Error if the value cannot be coerced to this type
   */
  private coerceSingleValue(type: PropertyType, value: unknown): unknown {
    // Get the expected JavaScript type
    const expectedType = type.getJsType();

    // If value is already the correct type, return it
    if (value instanceof expectedType || typeof value === expectedType.name.toLowerCase()) {
      return value;
    }

    // Attempt type-specific coercion
    try {
      if (type === PropertyType.Integer) {
        return this.coerceToLong(value);
      } else if (type === PropertyType.Float) {
        return this.coerceToDouble(value);
      } else if (type === PropertyType.Boolean) {
        return this.coerceToBoolean(value);
      } else if (
        type === PropertyType.String ||
        type === PropertyType.Text ||
        type === PropertyType.CLOB
      ) {
        return this.coerceToString(value);
      } else if (type === PropertyType.BigInteger) {
        return this.coerceToBigInteger(value);
      } else if (type === PropertyType.BigDecimal) {
        return this.coerceToBigDecimal(value);
      } else if (type === PropertyType.DateTime) {
        return this.coerceToDate(value);
      } else if (type === PropertyType.URI) {
        return this.coerceToURI(value);
      } else if (type === PropertyType.UUID) {
        return this.coerceToUUID(value);
      } else if (type === PropertyType.BLOB) {
        return this.coerceToByteArray(value);
      }
    } catch (e) {
      throw this.illegalArgument(type, value, e as Error);
    }

    throw this.illegalArgument(type, value);
  }

  private illegalArgument(type: PropertyType, value: unknown, cause?: Error): Error {
    const message = `Cannot coerce value of type ${typeof value} to PropertyType ${type.name()} (JS type: ${type.getJsType().name})`;
    if (cause) {
      return new Error(`${message}: ${cause.message}`, { cause });
    }
    return new Error(message);
  }

  public coerceToLong(value: unknown): number {
    if (typeof value === 'number') {
      return Math.floor(value);
    }
    if (typeof value === 'string') {
      const parsed = parseInt(value, 10);
      if (isNaN(parsed)) {
        throw this.illegalArgument(PropertyType.Integer, value);
      }
      return parsed;
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    throw this.illegalArgument(PropertyType.Integer, value);
  }

  public coerceToDouble(value: unknown): number {
    if (typeof value === 'number') {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = parseFloat(value);
      if (isNaN(parsed)) {
        throw this.illegalArgument(PropertyType.Float, value);
      }
      return parsed;
    }
    if (typeof value === 'bigint') {
      return Number(value);
    }
    throw this.illegalArgument(PropertyType.Float, value);
  }

  public coerceToBoolean(value: unknown): boolean {
    if (typeof value === 'boolean') {
      return value;
    }
    if (typeof value === 'string') {
      const lowerValue = value.toLowerCase();
      if (lowerValue === 'true') return true;
      if (lowerValue === 'false') return false;
      // Try to parse as number
      const num = parseFloat(value);
      if (!isNaN(num)) {
        return num !== 0;
      }
      throw this.illegalArgument(PropertyType.Boolean, value);
    }
    if (typeof value === 'number') {
      return value !== 0;
    }
    throw this.illegalArgument(PropertyType.Boolean, value);
  }

  public coerceToString(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  }

  public coerceToBigInteger(value: unknown): bigint {
    if (typeof value === 'bigint') {
      return value;
    }
    if (typeof value === 'number') {
      return BigInt(Math.floor(value));
    }
    if (typeof value === 'string') {
      // Handle BigDecimal strings by removing decimal part
      const dotIndex = value.indexOf('.');
      const integerPart = dotIndex >= 0 ? value.substring(0, dotIndex) : value;
      try {
        return BigInt(integerPart);
      } catch (e) {
        throw this.illegalArgument(PropertyType.BigInteger, value, e as Error);
      }
    }
    throw this.illegalArgument(PropertyType.BigInteger, value);
  }

  public coerceToBigDecimal(value: unknown): string {
    // BigDecimal is stored as string in TypeScript
    if (typeof value === 'string') {
      // Validate it's a valid number string
      if (isNaN(parseFloat(value))) {
        throw this.illegalArgument(PropertyType.BigDecimal, value);
      }
      return value;
    }
    if (typeof value === 'number') {
      return value.toString();
    }
    if (typeof value === 'bigint') {
      return value.toString();
    }
    throw this.illegalArgument(PropertyType.BigDecimal, value);
  }

  public coerceToDate(value: unknown): Date {
    if (value instanceof Date) {
      return value;
    }
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (isNaN(parsed.getTime())) {
        throw this.illegalArgument(PropertyType.DateTime, value);
      }
      return parsed;
    }
    if (typeof value === 'number') {
      // Assume timestamp in milliseconds
      return new Date(value);
    }
    throw this.illegalArgument(PropertyType.DateTime, value);
  }

  public coerceToURI(value: unknown): URL {
    if (value instanceof URL) {
      return value;
    }
    if (typeof value === 'string') {
      try {
        return new URL(value);
      } catch (e) {
        throw this.illegalArgument(PropertyType.URI, value, e as Error);
      }
    }
    throw this.illegalArgument(PropertyType.URI, value);
  }

  public coerceToUUID(value: unknown): string {
    if (typeof value === 'string') {
      // Basic UUID validation (8-4-4-4-12 hex digits)
      const uuidRegex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!uuidRegex.test(value)) {
        throw new Error(`Invalid UUID format: ${value}`);
      }
      return value.toLowerCase();
    }
    throw this.illegalArgument(PropertyType.UUID, value);
  }

  public coerceToByteArray(value: unknown): Uint8Array {
    if (value instanceof Uint8Array) {
      return value;
    }
    if (value instanceof ArrayBuffer) {
      return new Uint8Array(value);
    }
    if (typeof value === 'string') {
      // Parse hex string
      try {
        return this.parseHexString(value);
      } catch (e) {
        throw this.illegalArgument(PropertyType.BLOB, value, e as Error);
      }
    }
    if (Array.isArray(value)) {
      // Convert number array to Uint8Array
      return new Uint8Array(value);
    }
    throw this.illegalArgument(PropertyType.BLOB, value);
  }

  /**
   * Parse a hex string into a Uint8Array.
   * Supports formats with or without spaces/delimiters.
   *
   * @param hex the hex string to parse
   * @returns the parsed byte array
   */
  private parseHexString(hex: string): Uint8Array {
    // Remove common delimiters
    const cleanHex = hex.replace(/[\s:-]/g, '');

    if (cleanHex.length % 2 !== 0) {
      throw new Error('Hex string must have an even number of characters');
    }

    const bytes = new Uint8Array(cleanHex.length / 2);
    for (let i = 0; i < cleanHex.length; i += 2) {
      const byte = parseInt(cleanHex.substring(i, i + 2), 16);
      if (isNaN(byte)) {
        throw new Error(`Invalid hex string at position ${i}: ${cleanHex.substring(i, i + 2)}`);
      }
      bytes[i / 2] = byte;
    }

    return bytes;
  }
}
