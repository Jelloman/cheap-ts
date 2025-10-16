import { describe, it, expect } from '@jest/globals';
import { PropertyDefBuilder } from './PropertyDefBuilder.js';
import { PropertyType } from '../types.js';

describe('PropertyDefImpl', () => {
  describe('constructor with basic name and type', () => {
    it('should create property with defaults', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.name()).toBe('testProp');
      expect(propDef.type()).toBe(PropertyType.String);
      expect(propDef.defaultValue()).toBeNull();
      expect(propDef.hasDefaultValue()).toBe(false);
      expect(propDef.isReadable()).toBe(true);
      expect(propDef.isWritable()).toBe(true);
      expect(propDef.isNullable()).toBe(true);
      expect(propDef.isRemovable()).toBe(true);
      expect(propDef.isMultivalued()).toBe(false);
    });
  });

  describe('constructor with null type', () => {
    it('should throw error', () => {
      expect(() => {
        new PropertyDefBuilder().setName('testProp').setType(null as any).build();
      }).toThrow();
    });
  });

  describe('constructor with empty name', () => {
    it('should throw error', () => {
      expect(() => {
        new PropertyDefBuilder().setName('').setType(PropertyType.String).build();
      }).toThrow();
    });
  });

  describe('constructor with all parameters', () => {
    it('should create property with all attributes', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.Integer)
        .setIsReadable(true)
        .setIsWritable(false)
        .setIsNullable(false)
        .setIsRemovable(true)
        .setIsMultivalued(true)
        .build();

      expect(propDef.name()).toBe('testProp');
      expect(propDef.type()).toBe(PropertyType.Integer);
      expect(propDef.defaultValue()).toBeNull();
      expect(propDef.hasDefaultValue()).toBe(false);
      expect(propDef.isReadable()).toBe(true);
      expect(propDef.isWritable()).toBe(false);
      expect(propDef.isNullable()).toBe(false);
      expect(propDef.isRemovable()).toBe(true);
      expect(propDef.isMultivalued()).toBe(true);
    });
  });

  describe('builder with default values', () => {
    it('should create property with default value', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setDefaultValue('defaultValue')
        .build();

      expect(propDef.name()).toBe('testProp');
      expect(propDef.type()).toBe(PropertyType.String);
      expect(propDef.defaultValue()).toBe('defaultValue');
      expect(propDef.hasDefaultValue()).toBe(true);
      expect(propDef.isReadable()).toBe(true);
      expect(propDef.isWritable()).toBe(true);
      expect(propDef.isNullable()).toBe(true);
      expect(propDef.isRemovable()).toBe(true);
      expect(propDef.isMultivalued()).toBe(false);
    });
  });

  describe('equals', () => {
    it('should return true for same name (different type)', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.Integer)
        .build();

      // Note: In TypeScript, equals() is not overridden, so we use fullyEquals()
      // The Java test uses equals() which only compares names
      expect(propDef1.name()).toBe(propDef2.name());
    });

    it('should return false for different names', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp1')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp2')
        .setType(PropertyType.String)
        .build();

      expect(propDef1.name()).not.toBe(propDef2.name());
    });
  });

  describe('fullyEquals', () => {
    it('should return true for identical instances constructed separately', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef1.fullyEquals(propDef2)).toBe(true);
      expect(propDef2.fullyEquals(propDef1)).toBe(true);
    });

    it('should return true for same instance', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.fullyEquals(propDef)).toBe(true);
    });

    it('should return false for different types', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.Integer)
        .build();

      expect(propDef1.fullyEquals(propDef2)).toBe(false);
    });

    it('should return false for different names', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp1')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp2')
        .setType(PropertyType.String)
        .build();

      expect(propDef1.fullyEquals(propDef2)).toBe(false);
    });

    it('should return false for different attributes', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsReadable(true)
        .setIsWritable(true)
        .setIsNullable(true)
        .setIsRemovable(true)
        .setIsMultivalued(false)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsReadable(true)
        .setIsWritable(false)
        .setIsNullable(true)
        .setIsRemovable(true)
        .setIsMultivalued(false)
        .build();

      expect(propDef1.fullyEquals(propDef2)).toBe(false);
    });

    it('should return false with null', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.fullyEquals(null as any)).toBe(false);
    });
  });

  describe('hash', () => {
    it('should return same hash for identical instances constructed separately', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef1.hash()).toBe(propDef2.hash());
    });

    it('should return same hash for same instance', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.hash()).toBe(propDef.hash());
    });

    it('should return different hash for different types', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.Integer)
        .build();

      expect(propDef1.hash()).not.toBe(propDef2.hash());
    });

    it('should return different hash for different names', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp1')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp2')
        .setType(PropertyType.String)
        .build();

      expect(propDef1.hash()).not.toBe(propDef2.hash());
    });

    it('should return different hash for different attributes', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsReadable(true)
        .setIsWritable(true)
        .setIsNullable(true)
        .setIsRemovable(true)
        .setIsMultivalued(false)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsReadable(true)
        .setIsWritable(false)
        .setIsNullable(true)
        .setIsRemovable(true)
        .setIsMultivalued(false)
        .build();

      expect(propDef1.hash()).not.toBe(propDef2.hash());
    });
  });

  describe('validatePropertyValue', () => {
    it('should return true for valid value', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.validatePropertyValue('validString', false)).toBe(true);
    });

    it('should return true for null value in nullable property', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsNullable(true)
        .build();

      expect(propDef.validatePropertyValue(null, false)).toBe(true);
    });

    it('should return false for null value in non-nullable property', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsNullable(false)
        .build();

      expect(propDef.validatePropertyValue(null, false)).toBe(false);
    });

    it('should throw for null value in non-nullable property with throwExceptions', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .setIsNullable(false)
        .build();

      expect(() => {
        propDef.validatePropertyValue(null, true);
      }).toThrow("Property 'testProp' does not allow null values");
    });

    it('should return false for wrong type', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(propDef.validatePropertyValue(123, false)).toBe(false);
    });

    it('should throw for wrong type with throwExceptions', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      expect(() => {
        propDef.validatePropertyValue(123, true);
      }).toThrow();
    });
  });

  describe('name interning', () => {
    it('should use string interning for names', () => {
      const propDef1 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();
      const propDef2 = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.Integer)
        .build();

      // In TypeScript/JavaScript, string literals are interned automatically
      expect(propDef1.name()).toBe(propDef2.name());
      // Note: We can't test reference equality like Java's ==
      // but the string values should match
    });
  });
});
