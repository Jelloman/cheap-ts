import { describe, it, expect } from "@jest/globals";
import { PropertyValueAdapter } from "./PropertyValueAdapter.js";
import { PropertyDefImpl } from "../impl/PropertyImpl.js";
import { PropertyType } from "../types.js";

/**
 * Unit tests for the PropertyValueAdapter class.
 * Tests value coercion for all property types with various input types.
 */
describe("PropertyValueAdapter", () => {
  const adapter = new PropertyValueAdapter();
  const utcAdapter = new PropertyValueAdapter("UTC");

  describe("coerceToLong (Integer)", () => {
    it("should coerce from number", () => {
      expect(adapter.coerceToLong(42)).toBe(42);
      expect(adapter.coerceToLong(42.9)).toBe(42); // Truncates
      expect(adapter.coerceToLong(BigInt(42))).toBe(42);
    });

    it("should coerce from string", () => {
      expect(adapter.coerceToLong("42")).toBe(42);
      expect(adapter.coerceToLong("-123")).toBe(-123);
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToLong("not a number")).toThrow();
      expect(() => adapter.coerceToLong(true as any)).toThrow();
    });
  });

  describe("coerceToDouble (Float)", () => {
    it("should coerce from number", () => {
      expect(adapter.coerceToDouble(42.5)).toBe(42.5);
      expect(adapter.coerceToDouble(42)).toBe(42.0);
      expect(adapter.coerceToDouble(BigInt(42))).toBe(42.0);
    });

    it("should coerce from string", () => {
      expect(adapter.coerceToDouble("42.5")).toBe(42.5);
      expect(adapter.coerceToDouble("-123.456")).toBe(-123.456);
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToDouble("not a number")).toThrow();
      expect(() => adapter.coerceToDouble(true as any)).toThrow();
    });
  });

  describe("coerceToBoolean", () => {
    it("should coerce from string", () => {
      expect(adapter.coerceToBoolean("true")).toBe(true);
      expect(adapter.coerceToBoolean("false")).toBe(false);
      expect(adapter.coerceToBoolean("1")).toBe(true);
      expect(adapter.coerceToBoolean("0")).toBe(false);
    });

    it("should coerce from number", () => {
      expect(adapter.coerceToBoolean(1)).toBe(true);
      expect(adapter.coerceToBoolean(0)).toBe(false);
      expect(adapter.coerceToBoolean(42)).toBe(true);
      expect(adapter.coerceToBoolean(-1)).toBe(true);
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToBoolean({} as any)).toThrow();
    });
  });

  describe("coerceToString", () => {
    it("should coerce various types", () => {
      expect(adapter.coerceToString("hello")).toBe("hello");
      expect(adapter.coerceToString(42)).toBe("42");
      expect(adapter.coerceToString(true)).toBe("true");
      expect(adapter.coerceToString(42.5)).toBe("42.5");
    });
  });

  describe("coerceToBigInteger", () => {
    it("should coerce from number", () => {
      expect(adapter.coerceToBigInteger(42)).toBe(BigInt(42));
      expect(adapter.coerceToBigInteger(42.9)).toBe(BigInt(42)); // Truncates
    });

    it("should coerce from string", () => {
      expect(adapter.coerceToBigInteger("12345678901234567890")).toBe(BigInt("12345678901234567890"));
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToBigInteger("not a number")).toThrow();
      expect(() => adapter.coerceToBigInteger(true as any)).toThrow();
    });
  });

  describe("coerceToBigDecimal", () => {
    it("should coerce from number", () => {
      expect(adapter.coerceToBigDecimal(42.5)).toBe("42.5");
      expect(adapter.coerceToBigDecimal(42)).toBe("42");
      expect(adapter.coerceToBigDecimal(BigInt(42))).toBe("42");
    });

    it("should coerce from string", () => {
      expect(adapter.coerceToBigDecimal("123.456")).toBe("123.456");
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToBigDecimal("not a number")).toThrow();
      expect(() => adapter.coerceToBigDecimal(true as any)).toThrow();
    });
  });

  describe("coerceToDate (DateTime)", () => {
    it("should coerce from string", () => {
      const expected = new Date("2025-01-15T10:30:00Z");
      const result = adapter.coerceToDate("2025-01-15T10:30:00Z");
      expect(result.getTime()).toBe(expected.getTime());
    });

    it("should coerce from timestamp", () => {
      const timestamp = Date.parse("2025-01-15T10:30:00Z");
      const result = utcAdapter.coerceToDate(timestamp);
      expect(result.getTime()).toBe(timestamp);
    });

    it("should preserve Date instances", () => {
      const date = new Date();
      expect(adapter.coerceToDate(date)).toBe(date);
    });

    it("should throw for invalid input via coerce method", () => {
      const dateProp = new PropertyDefImpl("date", PropertyType.DateTime, null, false, true, true, true, true, false);
      expect(() => adapter.coerce(dateProp, "not a date")).toThrow();
    });
  });

  describe("coerceToURI", () => {
    it("should coerce from string", () => {
      const expected = new URL("https://example.com/path");
      const result = adapter.coerceToURI("https://example.com/path");
      expect(result.toString()).toBe(expected.toString());
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToURI(42 as any)).toThrow();
    });
  });

  describe("coerceToUUID", () => {
    it("should coerce from string", () => {
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(adapter.coerceToUUID(uuid)).toBe(uuid.toLowerCase());
    });

    it("should throw for invalid UUID", () => {
      expect(() => adapter.coerceToUUID("not a uuid")).toThrow();
      expect(() => adapter.coerceToUUID(42 as any)).toThrow();
    });
  });

  describe("coerceToByteArray", () => {
    it("should coerce from hex string", () => {
      const input = "0102ABCD";
      const expected = new Uint8Array([1, 2, 171, 205]);
      const result = adapter.coerceToByteArray(input);
      expect(Array.from(result)).toEqual(Array.from(expected));
    });

    it("should preserve Uint8Array", () => {
      const input = new Uint8Array([1, 2, 3]);
      expect(adapter.coerceToByteArray(input)).toBe(input);
    });

    it("should throw for invalid input", () => {
      expect(() => adapter.coerceToByteArray(42 as any)).toThrow();
    });
  });

  describe("coerce with PropertyDef", () => {
    it("should return already correct type", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, false);
      const value = 42;

      const result = adapter.coerce(propDef, value);
      expect(result).toBe(value);
    });

    it("should coerce when needed", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, false);

      const result = adapter.coerce(propDef, "42");
      expect(result).toBe(42);
    });

    it("should allow null for nullable property", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.String, null, false, true, true, true, true, false);

      const result = adapter.coerce(propDef, null);
      expect(result).toBeNull();
    });

    it("should throw for null in non-nullable property", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.String, null, false, true, true, false, true, false);

      expect(() => adapter.coerce(propDef, null)).toThrow("cannot be null");
    });
  });

  describe("multivalued properties", () => {
    it("should coerce from array", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, true);
      const input = [1, 2, 3];

      const result = adapter.coerce(propDef, input) as number[];
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(3);
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
      expect(result[2]).toBe(3);
    });

    it("should coerce array elements with string input", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, true);
      const input = ["1", "2", "3"];

      const result = adapter.coerce(propDef, input) as number[];
      expect(result[0]).toBe(1);
      expect(result[1]).toBe(2);
      expect(result[2]).toBe(3);
    });

    it("should return same array when no coercion needed", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, true);
      const input = [1, 2, 3];

      const result = adapter.coerce(propDef, input);
      expect(result).toBe(input); // Same reference
    });

    it("should throw for non-array in multivalued property", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, true);

      expect(() => adapter.coerce(propDef, "not a collection")).toThrow("multivalued");
    });

    it("should handle empty array", () => {
      const propDef = new PropertyDefImpl("test", PropertyType.Integer, null, false, true, true, true, true, true);
      const input: number[] = [];

      const result = adapter.coerce(propDef, input);
      expect(Array.isArray(result)).toBe(true);
      expect((result as number[]).length).toBe(0);
    });
  });

  describe("all PropertyTypes", () => {
    it("should coerce Integer", () => {
      const propDef = new PropertyDefImpl("int", PropertyType.Integer, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, 42)).toBe(42);
    });

    it("should coerce Float", () => {
      const propDef = new PropertyDefImpl("float", PropertyType.Float, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, 42.5)).toBe(42.5);
    });

    it("should coerce Boolean", () => {
      const propDef = new PropertyDefImpl("bool", PropertyType.Boolean, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, "true")).toBe(true);
    });

    it("should coerce String", () => {
      const propDef = new PropertyDefImpl("string", PropertyType.String, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, "hello")).toBe("hello");
    });

    it("should coerce Text", () => {
      const propDef = new PropertyDefImpl("text", PropertyType.Text, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, "hello")).toBe("hello");
    });

    it("should coerce CLOB", () => {
      const propDef = new PropertyDefImpl("clob", PropertyType.CLOB, null, false, true, true, true, true, false);
      expect(adapter.coerce(propDef, "hello")).toBe("hello");
    });

    it("should coerce BigInteger", () => {
      const propDef = new PropertyDefImpl(
        "bigint",
        PropertyType.BigInteger,
        null,
        false,
        true,
        true,
        true,
        true,
        false,
      );
      expect(adapter.coerce(propDef, 42)).toBe(BigInt(42));
    });

    it("should coerce BigDecimal", () => {
      const propDef = new PropertyDefImpl(
        "bigdec",
        PropertyType.BigDecimal,
        null,
        false,
        true,
        true,
        true,
        true,
        false,
      );
      expect(adapter.coerce(propDef, 42.5)).toBe("42.5");
    });

    it("should coerce DateTime", () => {
      const propDef = new PropertyDefImpl("date", PropertyType.DateTime, null, false, true, true, true, true, false);
      const expected = new Date("2025-01-15T10:30:00Z");
      const result = adapter.coerce(propDef, "2025-01-15T10:30:00Z") as Date;
      expect(result.getTime()).toBe(expected.getTime());
    });

    it("should coerce URI", () => {
      const propDef = new PropertyDefImpl("uri", PropertyType.URI, null, false, true, true, true, true, false);
      const result = adapter.coerce(propDef, "https://example.com") as URL;
      expect(result.toString()).toBe("https://example.com/");
    });

    it("should coerce UUID", () => {
      const propDef = new PropertyDefImpl("uuid", PropertyType.UUID, null, false, true, true, true, true, false);
      const uuid = "550e8400-e29b-41d4-a716-446655440000";
      expect(adapter.coerce(propDef, uuid)).toBe(uuid);
    });

    it("should coerce BLOB", () => {
      const propDef = new PropertyDefImpl("blob", PropertyType.BLOB, null, false, true, true, true, true, false);
      const expected = new Uint8Array([1, 2, 171, 205]);
      const result = adapter.coerce(propDef, "0102ABCD") as Uint8Array;
      expect(Array.from(result)).toEqual(Array.from(expected));
    });
  });

  describe("TimeZone getter/setter", () => {
    it("should get and set timezone", () => {
      const testAdapter = new PropertyValueAdapter();
      expect(testAdapter.getTimeZone()).toBeTruthy();

      testAdapter.setTimeZone("UTC");
      expect(testAdapter.getTimeZone()).toBe("UTC");
    });
  });
});
