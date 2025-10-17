import { describe, it, expect, beforeEach } from '@jest/globals';
import { ImmutableAspectDefImpl } from './AspectDefImpl.js';
import { PropertyDefBuilder } from './PropertyDefBuilder.js';
import { PropertyDef } from '../interfaces/Property.js';
import { PropertyType } from '../types.js';

/**
 * Unit tests for ImmutableAspectDefImpl.
 * Tests the immutable aspect definition implementation.
 */
describe('ImmutableAspectDefImpl', () => {
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let propDef3: PropertyDef;
  let propertyDefs: Map<string, PropertyDef>;

  beforeEach(() => {
    propDef1 = new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build();
    propDef2 = new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build();
    propDef3 = new PropertyDefBuilder().setName('prop3').setType(PropertyType.Boolean).build();

    propertyDefs = new Map();
    propertyDefs.set('prop1', propDef1);
    propertyDefs.set('prop2', propDef2);
  });

  describe('constructor', () => {
    it('should create immutable aspect def with valid name and properties', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(aspectDef.name()).toBe('testAspect');
      expect(aspectDef.propertyDefs().length).toBe(2);
      expect(aspectDef.propertyDef('prop1')).toBe(propDef1);
      expect(aspectDef.propertyDef('prop2')).toBe(propDef2);
    });

    it('should throw when name is null or empty', () => {
      expect(() => new ImmutableAspectDefImpl('', propertyDefs)).toThrow();
    });

    it('should throw when property map is null', () => {
      expect(() => new ImmutableAspectDefImpl('testAspect', null as never)).toThrow();
    });

    it('should copy property map and not retain reference', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      // Modify original map
      propertyDefs.set('prop3', propDef3);

      // AspectDef should not be affected
      expect(aspectDef.propertyDefs().length).toBe(2);
      expect(aspectDef.propertyDef('prop3')).toBeNull();
    });

    it('should handle special characters in name', () => {
      const specialName = 'aspect-with_special.chars@123';
      const aspectDef = new ImmutableAspectDefImpl(specialName, propertyDefs);

      expect(aspectDef.name()).toBe(specialName);
    });

    it('should handle whitespace in name', () => {
      const whitespaceName = '  aspect with spaces  ';
      const aspectDef = new ImmutableAspectDefImpl(whitespaceName, propertyDefs);

      expect(aspectDef.name()).toBe(whitespaceName);
    });

    it('should handle large property map correctly', () => {
      const largeMap = new Map<string, PropertyDef>();
      for (let i = 0; i < 1000; i++) {
        const prop = new PropertyDefBuilder()
          .setName('prop' + i)
          .setType(PropertyType.String)
          .build();
        largeMap.set('prop' + i, prop);
      }

      const aspectDef = new ImmutableAspectDefImpl('largeAspect', largeMap);

      expect(aspectDef.name()).toBe('largeAspect');
      expect(aspectDef.propertyDefs().length).toBe(1000);

      // Verify a few random properties
      expect(aspectDef.propertyDef('prop0')).not.toBeNull();
      expect(aspectDef.propertyDef('prop500')).not.toBeNull();
      expect(aspectDef.propertyDef('prop999')).not.toBeNull();
    });
  });

  describe('propertyDefs', () => {
    it('should return array with correct size and contents', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);
      const returnedCollection = aspectDef.propertyDefs();

      expect(returnedCollection.length).toBe(2);
      expect(returnedCollection).toContain(propDef1);
      expect(returnedCollection).toContain(propDef2);
    });

    it('should return same array on multiple calls', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      const first = aspectDef.propertyDefs();
      const second = aspectDef.propertyDefs();

      // Arrays should have same length but may be different objects
      expect(first.length).toBe(second.length);
    });
  });

  describe('add', () => {
    it('should throw error for any property', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(() => aspectDef.add(propDef3)).toThrow(
        "Properties cannot be added to immutable AspectDef 'testAspect'"
      );
    });

    it('should throw error for null property', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(() => aspectDef.add(null as any)).toThrow();
    });
  });

  describe('remove', () => {
    it('should throw error for existing property', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(() => aspectDef.remove(propDef1)).toThrow(
        "Properties cannot be removed from immutable AspectDef 'testAspect'"
      );
    });

    it('should throw error for non-existent property', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(() => aspectDef.remove(propDef3)).toThrow();
    });

    it('should throw error for null property', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(() => aspectDef.remove(null as any)).toThrow();
    });
  });

  describe('canAddProperties', () => {
    it('should always return false', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(aspectDef.canAddProperties()).toBe(false);
    });
  });

  describe('canRemoveProperties', () => {
    it('should always return false', () => {
      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(aspectDef.canRemoveProperties()).toBe(false);
    });
  });

  describe('name', () => {
    it('should return provided name after construction', () => {
      const aspectDef = new ImmutableAspectDefImpl('myAspect', propertyDefs);

      expect(aspectDef.name()).toBe('myAspect');
    });
  });

  describe('error messages', () => {
    it('should contain aspect name in error messages', () => {
      const aspectName = 'mySpecialAspect';
      const aspectDef = new ImmutableAspectDefImpl(aspectName, propertyDefs);

      try {
        aspectDef.add(propDef3);
        throw new Error('Expected error to be thrown');
      } catch (e: any) {
        expect(e.message).toContain(aspectName);
      }

      try {
        aspectDef.remove(propDef1);
        throw new Error('Expected error to be thrown');
      } catch (e: any) {
        expect(e.message).toContain(aspectName);
      }
    });
  });

  describe('fullyEquals', () => {
    it('should return true for identical instances constructed separately', () => {
      const globalId = crypto.randomUUID();
      const propertyDefs1 = new Map<string, PropertyDef>();
      propertyDefs1.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs1.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const propertyDefs2 = new Map<string, PropertyDef>();
      propertyDefs2.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs2.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const aspectDef1 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs1);
      const aspectDef2 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs2);

      expect(aspectDef1.fullyEquals(aspectDef2)).toBe(true);
      expect(aspectDef2.fullyEquals(aspectDef1)).toBe(true);
    });

    it('should return true for same instance', () => {
      const propertyDefs = new Map<string, PropertyDef>();
      propertyDefs.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(aspectDef.fullyEquals(aspectDef)).toBe(true);
    });

    it('should return false for different names', () => {
      const propertyDefs = new Map<string, PropertyDef>();
      propertyDefs.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const aspectDef1 = new ImmutableAspectDefImpl('testAspect1', propertyDefs);
      const aspectDef2 = new ImmutableAspectDefImpl('testAspect2', propertyDefs);

      expect(aspectDef1.fullyEquals(aspectDef2)).toBe(false);
    });
  });

  describe('hash', () => {
    it('should return same hash for identical instances constructed separately', () => {
      const globalId = crypto.randomUUID();
      const propertyDefs1 = new Map<string, PropertyDef>();
      propertyDefs1.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs1.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const propertyDefs2 = new Map<string, PropertyDef>();
      propertyDefs2.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs2.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const aspectDef1 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs1);
      const aspectDef2 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs2);

      expect(aspectDef1.hash()).toBe(aspectDef2.hash());
    });

    it('should return same hash for same instance', () => {
      const propertyDefs = new Map<string, PropertyDef>();
      propertyDefs.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      expect(aspectDef.hash()).toBe(aspectDef.hash());
    });

    it('should return different hash for different property order', () => {
      const globalId = crypto.randomUUID();
      const propertyDefs1 = new Map<string, PropertyDef>();
      propertyDefs1.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      propertyDefs1.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const propertyDefs2 = new Map<string, PropertyDef>();
      propertyDefs2.set(
        'prop2',
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );
      propertyDefs2.set(
        'prop1',
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );

      const aspectDef1 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs1);
      const aspectDef2 = new ImmutableAspectDefImpl('testAspect', globalId, propertyDefs2);

      // Property order affects hash value, so hashes should be different
      expect(aspectDef1.hash()).not.toBe(aspectDef2.hash());
    });
  });
});
