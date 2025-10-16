import { describe, it, expect } from '@jest/globals';
import { CheapHasher } from './CheapHasher.js';

/**
 * Unit tests for the CheapHasher class.
 * Tests FNV-1a hash computation for all supported types.
 */
describe('CheapHasher', () => {
  describe('hashString', () => {
    it('should hash strings consistently', () => {
      const str1 = 'hello';
      const str2 = 'hello';
      const str3 = 'world';

      const hash1 = CheapHasher.hashString(str1);
      const hash2 = CheapHasher.hashString(str2);
      const hash3 = CheapHasher.hashString(str3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes (highly likely)
      expect(hash1).not.toBe(hash3);

      // Test null string
      const nullHash = CheapHasher.hashString(null);
      expect(hash1).not.toBe(nullHash);
    });
  });

  describe('hashNumber (as Long)', () => {
    it('should hash integer numbers consistently', () => {
      const long1 = 12345;
      const long2 = 12345;
      const long3 = 67890;

      const hash1 = CheapHasher.hashNumber(long1);
      const hash2 = CheapHasher.hashNumber(long2);
      const hash3 = CheapHasher.hashNumber(long3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('hashNumber (as Double)', () => {
    it('should hash floating-point numbers consistently', () => {
      const double1 = 3.14159;
      const double2 = 3.14159;
      const double3 = 2.71828;

      const hash1 = CheapHasher.hashNumber(double1);
      const hash2 = CheapHasher.hashNumber(double2);
      const hash3 = CheapHasher.hashNumber(double3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('hashBoolean', () => {
    it('should hash booleans consistently', () => {
      const bool1 = true;
      const bool2 = true;
      const bool3 = false;

      const hash1 = CheapHasher.hashBoolean(bool1);
      const hash2 = CheapHasher.hashBoolean(bool2);
      const hash3 = CheapHasher.hashBoolean(bool3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('hashBytes', () => {
    it('should hash byte arrays consistently', () => {
      const bytes1 = new Uint8Array([1, 2, 3, 4, 5]);
      const bytes2 = new Uint8Array([1, 2, 3, 4, 5]);
      const bytes3 = new Uint8Array([5, 4, 3, 2, 1]);

      const hash1 = CheapHasher.hashBytes(bytes1);
      const hash2 = CheapHasher.hashBytes(bytes2);
      const hash3 = CheapHasher.hashBytes(bytes3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);

      // Test null byte array
      const nullHash = CheapHasher.hashBytes(null);
      expect(hash1).not.toBe(nullHash);

      // Test empty byte array
      const empty = new Uint8Array(0);
      const emptyHash = CheapHasher.hashBytes(empty);
      expect(hash1).not.toBe(emptyHash);
    });
  });

  describe('hashBigInt', () => {
    it('should hash BigIntegers consistently', () => {
      const bigInt1 = BigInt('123456789012345678901234567890');
      const bigInt2 = BigInt('123456789012345678901234567890');
      const bigInt3 = BigInt('987654321098765432109876543210');

      const hash1 = CheapHasher.hashBigInt(bigInt1);
      const hash2 = CheapHasher.hashBigInt(bigInt2);
      const hash3 = CheapHasher.hashBigInt(bigInt3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);

      // Test null BigInteger
      const nullHash = CheapHasher.hashBigInt(null);
      expect(hash1).not.toBe(nullHash);
    });
  });

  describe('hashDate (ZonedDateTime)', () => {
    it('should hash dates consistently', () => {
      const time1 = new Date('2025-01-15T10:30:00Z');
      const time2 = new Date('2025-01-15T10:30:00Z');
      const time3 = new Date('2025-12-31T23:59:59Z');

      const hash1 = CheapHasher.hashDate(time1);
      const hash2 = CheapHasher.hashDate(time2);
      const hash3 = CheapHasher.hashDate(time3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);

      // Test null ZonedDateTime
      const nullHash = CheapHasher.hashDate(null);
      expect(hash1).not.toBe(nullHash);
    });
  });

  describe('hashURL (URI)', () => {
    it('should hash URLs consistently', () => {
      const uri1 = new URL('https://example.com/path');
      const uri2 = new URL('https://example.com/path');
      const uri3 = new URL('https://example.org/other');

      const hash1 = CheapHasher.hashURL(uri1);
      const hash2 = CheapHasher.hashURL(uri2);
      const hash3 = CheapHasher.hashURL(uri3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);

      // Test null URI
      const nullHash = CheapHasher.hashURL(null);
      expect(hash1).not.toBe(nullHash);
    });
  });

  describe('hashUUID', () => {
    it('should hash UUIDs consistently', () => {
      const uuid1 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid2 = '123e4567-e89b-12d3-a456-426614174000';
      const uuid3 = '987fcdeb-51a2-43f1-89ab-fedcba987654';

      const hash1 = CheapHasher.hashUUID(uuid1);
      const hash2 = CheapHasher.hashUUID(uuid2);
      const hash3 = CheapHasher.hashUUID(uuid3);

      // Identical inputs should produce identical hashes
      expect(hash1).toBe(hash2);

      // Different inputs should produce different hashes
      expect(hash1).not.toBe(hash3);

      // Test null UUID
      const nullHash = CheapHasher.hashUUID(null);
      expect(hash1).not.toBe(nullHash);
    });
  });

  describe('instance hasher', () => {
    it('should maintain rolling hash', () => {
      const hasher = new CheapHasher();

      // Update with multiple values
      hasher.updateString('hello');
      const hash1 = hasher.getHash();

      hasher.updateNumber(42);
      const hash2 = hasher.getHash();

      hasher.updateNumber(3.14);
      const hash3 = hasher.getHash();

      // Each update should change the hash
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
    });
  });

  describe('reset', () => {
    it('should reset hash to default offset basis', () => {
      const hasher = new CheapHasher();

      hasher.updateString('hello');
      const hash1 = hasher.getHash();

      hasher.reset();
      const resetHash = hasher.getHash();

      // After reset, hash should return to default offset basis
      const fresh = new CheapHasher();
      expect(resetHash).toBe(fresh.getHash());

      hasher.updateString('hello');
      const hash2 = hasher.getHash();

      // After reset and same update, should get same hash
      expect(hash1).toBe(hash2);
    });
  });

  describe('custom seed', () => {
    it('should support custom seed values', () => {
      const seed = 0x123456789abcdef0n;
      const hasher1 = new CheapHasher(seed);
      const hasher2 = new CheapHasher(seed);

      expect(hasher1.getHash()).toBe(hasher2.getHash());

      hasher1.updateString('test');
      hasher2.updateString('test');

      expect(hasher1.getHash()).toBe(hasher2.getHash());
    });

    it('should reset with custom seed', () => {
      const seed = 0xfedcba9876543210n;
      const hasher = new CheapHasher();

      hasher.reset(seed);
      expect(hasher.getHash()).toBe(seed);

      hasher.updateString('data');
      const hash1 = hasher.getHash();

      hasher.reset(seed);
      hasher.updateString('data');
      const hash2 = hasher.getHash();

      // Resetting to same seed and applying same updates should give same result
      expect(hash1).toBe(hash2);
    });
  });

  describe('instance update methods', () => {
    it('should match static methods for String', () => {
      const hasher = new CheapHasher();
      hasher.updateString('test');

      const staticHash = CheapHasher.hashString('test');
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for Long', () => {
      const hasher = new CheapHasher();
      hasher.updateNumber(12345);

      const staticHash = CheapHasher.hashNumber(12345);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for Double', () => {
      const hasher = new CheapHasher();
      hasher.updateNumber(3.14159);

      const staticHash = CheapHasher.hashNumber(3.14159);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for Boolean', () => {
      const hasher = new CheapHasher();
      hasher.updateBoolean(true);

      const staticHash = CheapHasher.hashBoolean(true);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for byte array', () => {
      const bytes = new Uint8Array([1, 2, 3, 4, 5]);
      const hasher = new CheapHasher();
      hasher.updateBytes(bytes);

      const staticHash = CheapHasher.hashBytes(bytes);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for BigInteger', () => {
      const bigInt = BigInt('123456789012345678901234567890');
      const hasher = new CheapHasher();
      hasher.updateBigInt(bigInt);

      const staticHash = CheapHasher.hashBigInt(bigInt);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for Date', () => {
      const time = new Date('2025-01-15T10:30:00Z');
      const hasher = new CheapHasher();
      hasher.updateDate(time);

      const staticHash = CheapHasher.hashDate(time);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for URL', () => {
      const uri = new URL('https://example.com/path');
      const hasher = new CheapHasher();
      hasher.updateURL(uri);

      const staticHash = CheapHasher.hashURL(uri);
      expect(hasher.getHash()).toBe(staticHash);
    });

    it('should match static methods for UUID', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const hasher = new CheapHasher();
      hasher.updateUUID(uuid);

      const staticHash = CheapHasher.hashUUID(uuid);
      expect(hasher.getHash()).toBe(staticHash);
    });
  });

  describe('method chaining', () => {
    it('should support method chaining', () => {
      const hasher = new CheapHasher();

      const result = hasher
        .updateString('hello')
        .updateNumber(42)
        .updateNumber(3.14)
        .updateBoolean(true)
        .updateBytes(new Uint8Array([1, 2, 3]));

      expect(result).toBe(hasher);
    });
  });

  describe('rolling hash order', () => {
    it('should produce different hashes for different order', () => {
      const hasher1 = new CheapHasher();
      hasher1.updateString('hello').updateString('world');

      const hasher2 = new CheapHasher();
      hasher2.updateString('world').updateString('hello');

      // Different order should produce different hashes
      expect(hasher1.getHash()).not.toBe(hasher2.getHash());
    });
  });

  describe('consistent hash across instances', () => {
    it('should produce consistent hashes', () => {
      const testString = 'consistent test';

      const hash1 = CheapHasher.hashString(testString);
      const hash2 = CheapHasher.hashString(testString);
      const hash3 = CheapHasher.hashString(testString);

      expect(hash1).toBe(hash2);
      expect(hash2).toBe(hash3);
    });
  });

  describe('null handling', () => {
    it('should hash all null values the same', () => {
      const hasher = new CheapHasher();

      hasher.updateString(null);
      const hash1 = hasher.getHash();

      hasher.reset();
      hasher.updateBytes(null);
      expect(hasher.getHash()).toBe(hash1);

      hasher.reset();
      hasher.updateBigInt(null);
      expect(hasher.getHash()).toBe(hash1);

      hasher.reset();
      hasher.updateDate(null);
      expect(hasher.getHash()).toBe(hash1);

      hasher.reset();
      hasher.updateURL(null);
      expect(hasher.getHash()).toBe(hash1);

      hasher.reset();
      hasher.updateUUID(null);
      expect(hasher.getHash()).toBe(hash1);
    });
  });

  describe('complex rolling hash', () => {
    it('should handle mixed types in sequence', () => {
      const hasher1 = new CheapHasher();
      hasher1
        .updateString('test string')
        .updateNumber(42)
        .updateNumber(3.14159)
        .updateBoolean(true)
        .updateBigInt(BigInt('123456789'))
        .updateDate(new Date('2025-01-15T10:30:00Z'))
        .updateURL(new URL('https://example.com'))
        .updateUUID('123e4567-e89b-12d3-a456-426614174000')
        .updateBytes(new Uint8Array([1, 2, 3, 4, 5]));

      const hasher2 = new CheapHasher();
      hasher2
        .updateString('test string')
        .updateNumber(42)
        .updateNumber(3.14159)
        .updateBoolean(true)
        .updateBigInt(BigInt('123456789'))
        .updateDate(new Date('2025-01-15T10:30:00Z'))
        .updateURL(new URL('https://example.com'))
        .updateUUID('123e4567-e89b-12d3-a456-426614174000')
        .updateBytes(new Uint8Array([1, 2, 3, 4, 5]));

      // Same sequence should produce same hash
      expect(hasher1.getHash()).toBe(hasher2.getHash());
    });
  });

  describe('different values same type', () => {
    it('should produce different hashes for different strings', () => {
      const strings = ['a', 'b', 'c', 'abc', 'xyz', 'test', 'hello', 'world'];

      for (let i = 0; i < strings.length; i++) {
        for (let j = i + 1; j < strings.length; j++) {
          const hash1 = CheapHasher.hashString(strings[i]);
          const hash2 = CheapHasher.hashString(strings[j]);
          expect(hash1).not.toBe(hash2);
        }
      }
    });

    it('should produce different hashes for different numbers', () => {
      const numbers = [0, 1, 2, 100, 1000, -1, -100];

      for (let i = 0; i < numbers.length; i++) {
        for (let j = i + 1; j < numbers.length; j++) {
          const hash1 = CheapHasher.hashNumber(numbers[i]);
          const hash2 = CheapHasher.hashNumber(numbers[j]);
          expect(hash1).not.toBe(hash2);
        }
      }
    });

    it('should produce different hashes for different doubles', () => {
      const doubles = [0.0, 1.0, -1.0, 3.14, 2.71];

      for (let i = 0; i < doubles.length; i++) {
        for (let j = i + 1; j < doubles.length; j++) {
          const hash1 = CheapHasher.hashNumber(doubles[i]);
          const hash2 = CheapHasher.hashNumber(doubles[j]);
          expect(hash1).not.toBe(hash2);
        }
      }
    });
  });

  describe('UTF-8 encoding', () => {
    it('should properly encode unicode strings', () => {
      const unicodeString = 'Hello \u4E16\u754C'; // "Hello 世界"
      const hash = CheapHasher.hashString(unicodeString);

      // Should produce consistent hash
      expect(hash).toBe(CheapHasher.hashString(unicodeString));

      // Different unicode strings should produce different hashes
      const otherUnicode = 'Hello \u65E5\u672C'; // "Hello 日本"
      expect(hash).not.toBe(CheapHasher.hashString(otherUnicode));
    });
  });

  describe('empty inputs', () => {
    it('should hash empty string and empty bytes the same', () => {
      const emptyStringHash = CheapHasher.hashString('');
      const emptyBytesHash = CheapHasher.hashBytes(new Uint8Array(0));

      // Empty string and empty bytes should produce same hash
      // (because empty string encodes to empty byte array)
      expect(emptyStringHash).toBe(emptyBytesHash);

      // But different from a non-empty input
      expect(emptyStringHash).not.toBe(CheapHasher.hashString('a'));
    });
  });

  describe('UUID components', () => {
    it('should hash UUIDs based on their bits', () => {
      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const hash1 = CheapHasher.hashUUID(uuid);

      // Same UUID should always produce same hash
      const sameUuid = '123e4567-e89b-12d3-a456-426614174000';
      const hash2 = CheapHasher.hashUUID(sameUuid);

      expect(hash1).toBe(hash2);

      // UUID with only 1 bit different should produce different hash
      const differentUuid = '123e4567-e89b-12d3-a456-426614174001';
      const hash3 = CheapHasher.hashUUID(differentUuid);

      expect(hash1).not.toBe(hash3);
    });
  });

  describe('static hash with seed', () => {
    it('should support seed parameter for strings', () => {
      const seed = 0x123456789abcdef0n;
      const testString = 'test';

      // Hash with default seed
      const defaultHash = CheapHasher.hashString(testString);

      // Hash with custom seed
      const customHash = CheapHasher.hashString(seed, testString);

      // Should produce different hashes
      expect(defaultHash).not.toBe(customHash);

      // Same seed and value should produce same hash
      const customHash2 = CheapHasher.hashString(seed, testString);
      expect(customHash).toBe(customHash2);
    });

    it('should support seed for all types', () => {
      const seed = 0xfedcba9876543210n;

      // Test with different types
      const stringHash1 = CheapHasher.hashString(seed, 'test');
      const stringHash2 = CheapHasher.hashString(seed, 'test');
      expect(stringHash1).toBe(stringHash2);

      const numberHash1 = CheapHasher.hashNumber(seed, 12345);
      const numberHash2 = CheapHasher.hashNumber(seed, 12345);
      expect(numberHash1).toBe(numberHash2);

      const doubleHash1 = CheapHasher.hashNumber(seed, 3.14159);
      const doubleHash2 = CheapHasher.hashNumber(seed, 3.14159);
      expect(doubleHash1).toBe(doubleHash2);

      const boolHash1 = CheapHasher.hashBoolean(seed, true);
      const boolHash2 = CheapHasher.hashBoolean(seed, true);
      expect(boolHash1).toBe(boolHash2);

      const bytes = new Uint8Array([1, 2, 3]);
      const bytesHash1 = CheapHasher.hashBytes(seed, bytes);
      const bytesHash2 = CheapHasher.hashBytes(seed, bytes);
      expect(bytesHash1).toBe(bytesHash2);

      const bigInt = BigInt('123456789');
      const bigIntHash1 = CheapHasher.hashBigInt(seed, bigInt);
      const bigIntHash2 = CheapHasher.hashBigInt(seed, bigInt);
      expect(bigIntHash1).toBe(bigIntHash2);

      const time = new Date('2025-01-15T10:30:00Z');
      const timeHash1 = CheapHasher.hashDate(seed, time);
      const timeHash2 = CheapHasher.hashDate(seed, time);
      expect(timeHash1).toBe(timeHash2);

      const uri = new URL('https://example.com');
      const uriHash1 = CheapHasher.hashURL(seed, uri);
      const uriHash2 = CheapHasher.hashURL(seed, uri);
      expect(uriHash1).toBe(uriHash2);

      const uuid = '123e4567-e89b-12d3-a456-426614174000';
      const uuidHash1 = CheapHasher.hashUUID(seed, uuid);
      const uuidHash2 = CheapHasher.hashUUID(seed, uuid);
      expect(uuidHash1).toBe(uuidHash2);
    });

    it('should produce different hashes with different seeds', () => {
      const value = 'same value';

      const seed1 = 0x1111111111111111n;
      const seed2 = 0x2222222222222222n;
      const seed3 = 0x3333333333333333n;

      const hash1 = CheapHasher.hashString(seed1, value);
      const hash2 = CheapHasher.hashString(seed2, value);
      const hash3 = CheapHasher.hashString(seed3, value);

      // Different seeds should produce different hashes
      expect(hash1).not.toBe(hash2);
      expect(hash2).not.toBe(hash3);
      expect(hash1).not.toBe(hash3);
    });
  });

  describe('instance uses static methods', () => {
    it('should use static methods with instance hash as seed', () => {
      const hasher = new CheapHasher();

      // First update
      const value1 = 'first';
      hasher.updateString(value1);
      const afterFirst = hasher.getHash();

      // This should be equivalent to hash(defaultSeed, value1)
      const staticEquivalent1 = CheapHasher.hashString(value1);
      expect(afterFirst).toBe(staticEquivalent1);

      // Second update
      const value2 = 'second';
      hasher.updateString(value2);
      const afterSecond = hasher.getHash();

      // This should be equivalent to hash(afterFirst, value2)
      const staticEquivalent2 = CheapHasher.hashString(afterFirst, value2);
      expect(afterSecond).toBe(staticEquivalent2);
    });
  });

  describe('rolling hash using seeds', () => {
    it('should verify rolling hash behavior using seeds', () => {
      const seed = 0xabcdef0123456789n;

      // Build hash step by step
      const hash1 = CheapHasher.hashString(seed, 'hello');
      const hash2 = CheapHasher.hashNumber(hash1, 42);
      const hash3 = CheapHasher.hashBoolean(hash2, true);

      // Should match instance-based rolling hash
      const hasher = new CheapHasher(seed);
      hasher.updateString('hello').updateNumber(42).updateBoolean(true);

      expect(hash3).toBe(hasher.getHash());
    });
  });

  describe('seed with null values', () => {
    it('should handle nulls correctly with custom seeds', () => {
      const seed = 0x9999999999999999n;

      const nullHash1 = CheapHasher.hashString(seed, null);
      const nullHash2 = CheapHasher.hashDate(seed, null);
      const nullHash3 = CheapHasher.hashBigInt(seed, null);

      // All null values should produce the same hash with same seed
      expect(nullHash1).toBe(nullHash2);
      expect(nullHash2).toBe(nullHash3);

      // But different from non-null values
      expect(nullHash1).not.toBe(CheapHasher.hashString(seed, ''));
      expect(nullHash1).not.toBe(CheapHasher.hashNumber(seed, 0));
      expect(nullHash1).not.toBe(CheapHasher.hashBoolean(seed, false));
    });
  });
});
