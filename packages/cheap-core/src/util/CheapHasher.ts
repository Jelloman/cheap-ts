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

/**
 * Utility class for computing 64-bit FNV-1a hash values of various typed inputs.
 *
 * The FNV-1a (Fowler-Noll-Vo) hash algorithm is a fast, non-cryptographic hash
 * function that provides good distribution for hash table and checksum applications.
 *
 * This class provides two modes of operation:
 * - **Static methods** - Compute standalone hash values for individual inputs
 * - **Instance methods** - Maintain a rolling hash that can be updated incrementally
 *
 * Supports common TypeScript/JavaScript types:
 * - number (for both integer and floating-point values)
 * - bigint
 * - boolean
 * - string
 * - Uint8Array (byte arrays)
 * - Date (for DateTime)
 * - URL (for URI)
 * - crypto.UUID (string representation)
 */
export class CheapHasher {
  // FNV-1a 64-bit constants
  private static readonly FNV_OFFSET_BASIS_64 = 0xcbf29ce484222325n;
  private static readonly FNV_PRIME_64 = 0x100000001b3n;
  private static readonly MASK_64 = 0xffffffffffffffffn; // 64-bit mask

  /**
   * The current rolling hash value maintained by this instance.
   */
  private hash: bigint;

  /**
   * Creates a new CheapHasher with the default FNV-1a offset basis.
   */
  constructor();
  /**
   * Creates a new CheapHasher with a custom seed value.
   *
   * @param seed the initial hash value
   */
  constructor(seed: bigint);
  constructor(seed?: bigint) {
    this.hash = seed ?? CheapHasher.FNV_OFFSET_BASIS_64;
  }

  /**
   * Returns the current rolling hash value.
   *
   * @return the current hash value
   */
  getHash(): bigint {
    return this.hash;
  }

  /**
   * Resets the rolling hash to the default FNV-1a offset basis or specified seed.
   *
   * @param seed optional new hash value
   */
  reset(seed?: bigint): void {
    this.hash = seed ?? CheapHasher.FNV_OFFSET_BASIS_64;
  }

  // ===== Static Hash Methods =====

  /**
   * Computes the FNV-1a hash of a byte array.
   *
   * @param bytes the byte array to hash
   * @return the 64-bit hash value
   */
  static hashBytes(bytes: Uint8Array | null): bigint;
  /**
   * Computes the FNV-1a hash of a byte array using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param bytes the byte array to hash
   * @return the 64-bit hash value
   */
  static hashBytes(seed: bigint, bytes: Uint8Array | null): bigint;
  static hashBytes(
    seedOrBytes: bigint | Uint8Array | null,
    bytes?: Uint8Array | null
  ): bigint {
    let seed: bigint;
    let data: Uint8Array | null;

    if (typeof seedOrBytes === 'bigint') {
      seed = seedOrBytes;
      data = bytes ?? null;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      data = seedOrBytes;
    }

    if (data === null) {
      return CheapHasher.hashNull(seed);
    }

    let hash = seed;
    for (let i = 0; i < data.length; i++) {
      hash ^= BigInt(data[i] & 0xff);
      hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
    }
    return hash;
  }

  /**
   * Computes the FNV-1a hash of a String converted to UTF-8 bytes.
   *
   * @param value the string to hash
   * @return the 64-bit hash value
   */
  static hashString(value: string | null): bigint;
  /**
   * Computes the FNV-1a hash of a String converted to UTF-8 bytes using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the string to hash
   * @return the 64-bit hash value
   */
  static hashString(seed: bigint, value: string | null): bigint;
  static hashString(
    seedOrValue: bigint | string | null,
    value?: string | null
  ): bigint {
    let seed: bigint;
    let str: string | null;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      str = value ?? null;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      str = seedOrValue;
    }

    if (str === null) {
      return CheapHasher.hashNull(seed);
    }

    // Convert string to UTF-8 bytes
    const encoder = new TextEncoder();
    const bytes = encoder.encode(str);
    return CheapHasher.hashBytes(seed, bytes);
  }

  /**
   * Computes the FNV-1a hash of a number value (treated as 64-bit long/double).
   *
   * @param value the number to hash
   * @return the 64-bit hash value
   */
  static hashNumber(value: number): bigint;
  /**
   * Computes the FNV-1a hash of a number value using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the number to hash
   * @return the 64-bit hash value
   */
  static hashNumber(seed: bigint, value: number): bigint;
  static hashNumber(seedOrValue: bigint | number, value?: number): bigint {
    let seed: bigint;
    let num: number;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      num = value!;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      num = seedOrValue;
    }

    // For floating-point numbers, convert to raw bits representation
    // For integers, treat as long (64-bit)
    const buffer = new ArrayBuffer(8);
    const view = new DataView(buffer);

    if (Number.isInteger(num)) {
      // Treat as 64-bit signed integer
      view.setBigInt64(0, BigInt(num), true); // little-endian
    } else {
      // Treat as 64-bit float (double)
      view.setFloat64(0, num, true); // little-endian
    }

    let hash = seed;
    for (let i = 0; i < 8; i++) {
      hash ^= BigInt(view.getUint8(i));
      hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
    }
    return hash;
  }

  /**
   * Computes the FNV-1a hash of a bigint value.
   *
   * @param value the bigint to hash
   * @return the 64-bit hash value
   */
  static hashBigInt(value: bigint | null): bigint;
  /**
   * Computes the FNV-1a hash of a bigint value using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the bigint to hash
   * @return the 64-bit hash value
   */
  static hashBigInt(seed: bigint, value: bigint | null): bigint;
  static hashBigInt(
    seedOrValue: bigint | null,
    value?: bigint | null
  ): bigint {
    let seed: bigint;
    let bigIntValue: bigint | null;

    if (value !== undefined) {
      seed = seedOrValue as bigint;
      bigIntValue = value;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      bigIntValue = seedOrValue;
    }

    if (bigIntValue === null) {
      return CheapHasher.hashNull(seed);
    }

    // Hash the string representation to match Java's BigInteger.toString()
    return CheapHasher.hashString(seed, bigIntValue.toString());
  }

  /**
   * Computes the FNV-1a hash of a Boolean value.
   *
   * @param value the boolean to hash
   * @return the 64-bit hash value
   */
  static hashBoolean(value: boolean): bigint;
  /**
   * Computes the FNV-1a hash of a Boolean value using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the boolean to hash
   * @return the 64-bit hash value
   */
  static hashBoolean(seed: bigint, value: boolean): bigint;
  static hashBoolean(seedOrValue: bigint | boolean, value?: boolean): bigint {
    let seed: bigint;
    let bool: boolean;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      bool = value!;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      bool = seedOrValue;
    }

    let hash = seed;
    hash ^= bool ? 1n : 0n;
    hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
    return hash;
  }

  /**
   * Computes the FNV-1a hash of a Date by hashing its ISO-8601 string representation.
   *
   * @param value the Date to hash
   * @return the 64-bit hash value
   */
  static hashDate(value: Date | null): bigint;
  /**
   * Computes the FNV-1a hash of a Date using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the Date to hash
   * @return the 64-bit hash value
   */
  static hashDate(seed: bigint, value: Date | null): bigint;
  static hashDate(seedOrValue: bigint | Date | null, value?: Date | null): bigint {
    let seed: bigint;
    let date: Date | null;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      date = value ?? null;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      date = seedOrValue;
    }

    if (date === null) {
      return CheapHasher.hashNull(seed);
    }

    return CheapHasher.hashString(seed, date.toISOString());
  }

  /**
   * Computes the FNV-1a hash of a URL by hashing its string representation.
   *
   * @param value the URL to hash
   * @return the 64-bit hash value
   */
  static hashURL(value: URL | null): bigint;
  /**
   * Computes the FNV-1a hash of a URL using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the URL to hash
   * @return the 64-bit hash value
   */
  static hashURL(seed: bigint, value: URL | null): bigint;
  static hashURL(seedOrValue: bigint | URL | null, value?: URL | null): bigint {
    let seed: bigint;
    let url: URL | null;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      url = value ?? null;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      url = seedOrValue;
    }

    if (url === null) {
      return CheapHasher.hashNull(seed);
    }

    return CheapHasher.hashString(seed, url.toString());
  }

  /**
   * Computes the FNV-1a hash of a UUID string by hashing its canonical representation.
   * Note: Unlike Java's UUID which has getMostSignificantBits/getLeastSignificantBits,
   * JavaScript/TypeScript UUIDs are strings, so we hash the string representation.
   *
   * @param value the UUID string to hash
   * @return the 64-bit hash value
   */
  static hashUUID(value: string | null): bigint;
  /**
   * Computes the FNV-1a hash of a UUID string using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @param value the UUID string to hash
   * @return the 64-bit hash value
   */
  static hashUUID(seed: bigint, value: string | null): bigint;
  static hashUUID(
    seedOrValue: bigint | string | null,
    value?: string | null
  ): bigint {
    let seed: bigint;
    let uuid: string | null;

    if (typeof seedOrValue === 'bigint') {
      seed = seedOrValue;
      uuid = value ?? null;
    } else {
      seed = CheapHasher.FNV_OFFSET_BASIS_64;
      uuid = seedOrValue;
    }

    if (uuid === null) {
      return CheapHasher.hashNull(seed);
    }

    // Parse UUID string to extract most/least significant bits
    // Format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
    const hex = uuid.replace(/-/g, '');
    if (hex.length !== 32) {
      throw new Error(`Invalid UUID format: ${uuid}`);
    }

    // Split into MSB (first 16 hex chars) and LSB (last 16 hex chars)
    const msbHex = hex.substring(0, 16);
    const lsbHex = hex.substring(16, 32);

    let msb = BigInt('0x' + msbHex);
    let lsb = BigInt('0x' + lsbHex);

    let hash = seed;

    // Hash most significant bits (8 bytes)
    for (let i = 0; i < 8; i++) {
      hash ^= msb & 0xffn;
      hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
      msb >>= 8n;
    }

    // Hash least significant bits (8 bytes)
    for (let i = 0; i < 8; i++) {
      hash ^= lsb & 0xffn;
      hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
      lsb >>= 8n;
    }

    return hash;
  }

  /**
   * Returns a hash value for null inputs.
   * Uses a distinct marker byte (0xFF) to ensure null hashes differently from empty/zero values.
   *
   * @return the hash value representing null
   */
  static hashNull(): bigint;
  /**
   * Returns a hash value for null inputs using the specified seed.
   *
   * @param seed the initial hash value (seed)
   * @return the hash value representing null
   */
  static hashNull(seed: bigint): bigint;
  static hashNull(seed?: bigint): bigint {
    const actualSeed = seed ?? CheapHasher.FNV_OFFSET_BASIS_64;
    let hash = actualSeed;
    hash ^= 0xffn;
    hash = (hash * CheapHasher.FNV_PRIME_64) & CheapHasher.MASK_64;
    return hash;
  }

  // ===== Instance Update Methods =====

  /**
   * Updates the rolling hash with a byte array.
   *
   * @param bytes the byte array to hash
   * @return this CheapHasher instance for method chaining
   */
  updateBytes(bytes: Uint8Array | null): this {
    this.hash = CheapHasher.hashBytes(this.hash, bytes);
    return this;
  }

  /**
   * Updates the rolling hash with a String converted to UTF-8 bytes.
   *
   * @param value the string to hash
   * @return this CheapHasher instance for method chaining
   */
  updateString(value: string | null): this {
    this.hash = CheapHasher.hashString(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a number value.
   *
   * @param value the number to hash
   * @return this CheapHasher instance for method chaining
   */
  updateNumber(value: number): this {
    this.hash = CheapHasher.hashNumber(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a bigint value.
   *
   * @param value the bigint to hash
   * @return this CheapHasher instance for method chaining
   */
  updateBigInt(value: bigint | null): this {
    this.hash = CheapHasher.hashBigInt(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a Boolean value.
   *
   * @param value the boolean to hash
   * @return this CheapHasher instance for method chaining
   */
  updateBoolean(value: boolean): this {
    this.hash = CheapHasher.hashBoolean(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a Date by hashing its ISO-8601 string representation.
   *
   * @param value the Date to hash
   * @return this CheapHasher instance for method chaining
   */
  updateDate(value: Date | null): this {
    this.hash = CheapHasher.hashDate(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a URL by hashing its string representation.
   *
   * @param value the URL to hash
   * @return this CheapHasher instance for method chaining
   */
  updateURL(value: URL | null): this {
    this.hash = CheapHasher.hashURL(this.hash, value);
    return this;
  }

  /**
   * Updates the rolling hash with a UUID string.
   *
   * @param value the UUID string to hash
   * @return this CheapHasher instance for method chaining
   */
  updateUUID(value: string | null): this {
    this.hash = CheapHasher.hashUUID(this.hash, value);
    return this;
  }

  /**
   * Generic update method that accepts any value and dispatches to the appropriate
   * type-specific hash method.
   *
   * @param value the value to hash
   * @return this CheapHasher instance for method chaining
   */
  update(value: unknown): this {
    if (value === null || value === undefined) {
      this.hash = CheapHasher.hashNull(this.hash);
    } else if (typeof value === 'string') {
      this.updateString(value);
    } else if (typeof value === 'number') {
      this.updateNumber(value);
    } else if (typeof value === 'bigint') {
      this.updateBigInt(value);
    } else if (typeof value === 'boolean') {
      this.updateBoolean(value);
    } else if (value instanceof Date) {
      this.updateDate(value);
    } else if (value instanceof URL) {
      this.updateURL(value);
    } else if (value instanceof Uint8Array) {
      this.updateBytes(value);
    } else {
      // For objects, hash their string representation
      this.updateString(String(value));
    }
    return this;
  }
}
