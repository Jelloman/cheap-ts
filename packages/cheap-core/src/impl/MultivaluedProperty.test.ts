/**
 * Unit tests for multivalued properties in the Cheap system.
 * Tests reading and writing properties that hold multiple values (arrays).
 */

import { describe, it, expect } from '@jest/globals';
import { MutableAspectDef } from '../interfaces/index.js';
import { PropertyType } from '../types.js';
import { CheapFactory } from '../util/CheapFactory.js';

describe('MultivaluedProperty', () => {
  const factory = new CheapFactory();

  describe('Create and Read', () => {
    it('should create and read multivalued String property', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      expect(propDef.isMultivalued()).toBe(true);
      expect(propDef.type()).toBe(PropertyType.String);

      const tags = ['java', 'cheap', 'data'];
      const property = factory.createProperty(propDef, tags);

      expect(property).not.toBeNull();
      expect(property.def()).toBe(propDef);

      const value = property.unsafeRead();
      expect(Array.isArray(value)).toBe(true);

      const readTags = value as string[];
      expect(readTags.length).toBe(3);
      expect(readTags[0]).toBe('java');
      expect(readTags[1]).toBe('cheap');
      expect(readTags[2]).toBe('data');
    });

    it('should create and read multivalued Integer property', () => {
      const propDef = factory.createPropertyDef(
        'scores',
        PropertyType.Integer,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      expect(propDef.isMultivalued()).toBe(true);
      expect(propDef.type()).toBe(PropertyType.Integer);

      const scores = [100, 95, 87, 92];
      const property = factory.createProperty(propDef, scores);

      expect(property).not.toBeNull();

      const readScores = property.unsafeRead() as number[];
      expect(readScores.length).toBe(4);
      expect(readScores[0]).toBe(100);
      expect(readScores[1]).toBe(95);
      expect(readScores[2]).toBe(87);
      expect(readScores[3]).toBe(92);
    });

    it('should create and read multivalued Boolean property', () => {
      const propDef = factory.createPropertyDef(
        'flags',
        PropertyType.Boolean,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      expect(propDef.isMultivalued()).toBe(true);

      const flags = [true, false, true, true];
      const property = factory.createProperty(propDef, flags);

      const readFlags = property.read() as boolean[];
      expect(readFlags.length).toBe(4);
      expect(readFlags[0]).toBe(true);
      expect(readFlags[1]).toBe(false);
      expect(readFlags[2]).toBe(true);
      expect(readFlags[3]).toBe(true);
    });

    it('should create and read multivalued Float property', () => {
      const propDef = factory.createPropertyDef(
        'temperatures',
        PropertyType.Float,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const temps = [98.6, 99.1, 97.8, 98.2];
      const property = factory.createProperty(propDef, temps);

      const readTemps = property.read() as number[];
      expect(readTemps.length).toBe(4);
      expect(readTemps[0]).toBeCloseTo(98.6, 2);
      expect(readTemps[1]).toBeCloseTo(99.1, 2);
    });

    it('should create and read multivalued UUID property', () => {
      const propDef = factory.createPropertyDef(
        'identifiers',
        PropertyType.UUID,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const id1 = crypto.randomUUID();
      const id2 = crypto.randomUUID();
      const ids = [id1, id2];

      const property = factory.createProperty(propDef, ids);

      const readIds = property.read() as string[];
      expect(readIds.length).toBe(2);
      expect(readIds[0]).toBe(id1);
      expect(readIds[1]).toBe(id2);
    });

    it('should create and read multivalued URI property', () => {
      const propDef = factory.createPropertyDef(
        'links',
        PropertyType.URI,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const uri1 = new URL('https://example.com');
      const uri2 = new URL('https://test.com');
      const uris = [uri1, uri2];

      const property = factory.createProperty(propDef, uris);

      const readUris = property.read() as URL[];
      expect(readUris.length).toBe(2);
      expect(readUris[0]).toEqual(uri1);
      expect(readUris[1]).toEqual(uri2);
    });

    it('should create and read multivalued BigInteger property', () => {
      const propDef = factory.createPropertyDef(
        'bigNumbers',
        PropertyType.BigInteger,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const big1 = 12345678901234567890n;
      const big2 = 98765432109876543210n;
      const bigInts = [big1, big2];

      const property = factory.createProperty(propDef, bigInts);

      const readBigInts = property.read() as bigint[];
      expect(readBigInts.length).toBe(2);
      expect(readBigInts[0]).toBe(big1);
      expect(readBigInts[1]).toBe(big2);
    });

    it('should create and read multivalued BigDecimal property', () => {
      const propDef = factory.createPropertyDef(
        'prices',
        PropertyType.BigDecimal,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const price1 = '123.45';
      const price2 = '678.90';
      const prices = [price1, price2];

      const property = factory.createProperty(propDef, prices);

      const readPrices = property.read() as string[];
      expect(readPrices.length).toBe(2);
      expect(readPrices[0]).toBe(price1);
      expect(readPrices[1]).toBe(price2);
    });

    it('should create and read multivalued DateTime property', () => {
      const propDef = factory.createPropertyDef(
        'timestamps',
        PropertyType.DateTime,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const time1 = new Date();
      const time2 = new Date(time1.getTime() + 3600000); // +1 hour
      const times = [time1, time2];

      const property = factory.createProperty(propDef, times);

      const readTimes = property.read() as Date[];
      expect(readTimes.length).toBe(2);
      expect(readTimes[0].getTime()).toBe(time1.getTime());
      expect(readTimes[1].getTime()).toBe(time2.getTime());
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty list', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const emptyList: string[] = [];
      const property = factory.createProperty(propDef, emptyList);

      const readList = property.read() as string[];
      expect(readList).not.toBeNull();
      expect(readList.length).toBe(0);
    });

    it('should handle null value when nullable', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true, // nullable=true
        true,
        true
      );

      const property = factory.createProperty(propDef, null);

      expect(property.read()).toBeNull();
    });
  });

  describe('In Aspect', () => {
    it('should write and read multivalued properties in aspect', () => {
      const entity = factory.createEntity();

      const tagsDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );
      const scoresDef = factory.createPropertyDef(
        'scores',
        PropertyType.Integer,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const aspectDef = factory.createMutableAspectDef('testAspect') as MutableAspectDef;
      aspectDef.add(tagsDef);
      aspectDef.add(scoresDef);

      const aspect = factory.createObjectMapAspect(entity, aspectDef);

      const tags = ['test', 'multivalued'];
      const scores = [100, 95];

      const tagsProperty = factory.createProperty(tagsDef, tags);
      const scoresProperty = factory.createProperty(scoresDef, scores);

      aspect.put(tagsProperty);
      aspect.put(scoresProperty);

      expect(aspect.contains('tags')).toBe(true);
      expect(aspect.contains('scores')).toBe(true);

      const readTags = aspect.readObj('tags') as string[];
      expect(readTags.length).toBe(2);
      expect(readTags[0]).toBe('test');
      expect(readTags[1]).toBe('multivalued');

      const readScores = aspect.readObj('scores') as number[];
      expect(readScores.length).toBe(2);
      expect(readScores[0]).toBe(100);
      expect(readScores[1]).toBe(95);
    });
  });

  describe('Validation', () => {
    it('should validate list value successfully', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const tags = ['java', 'cheap'];

      const isValid = propDef.validatePropertyValue(tags, false);
      expect(isValid).toBe(true);
    });

    it('should validate list with exceptions without throwing', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const tags = ['java', 'cheap'];

      expect(() => propDef.validatePropertyValue(tags, true)).not.toThrow();
    });

    it('should fail validation with wrong element type', () => {
      const propDef = factory.createPropertyDef(
        'numbers',
        PropertyType.Integer,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const wrongTypeList = ['not', 'numbers'];

      const isValid = propDef.validatePropertyValue(wrongTypeList, false);
      expect(isValid).toBe(false);

      expect(() => propDef.validatePropertyValue(wrongTypeList, true)).toThrow();
    });

    it('should fail validation with non-list value', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        true
      );

      const singleValue = 'not a list';

      const isValid = propDef.validatePropertyValue(singleValue, false);
      expect(isValid).toBe(false);

      expect(() => {
        propDef.validatePropertyValue(singleValue, true);
      }).toThrow(/multivalued.*Array/i);
    });
  });

  describe('Single-Valued vs Multi-Valued', () => {
    it('should not be multivalued when flag is false', () => {
      const propDef = factory.createPropertyDef(
        'name',
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        false // isMultivalued = false
      );

      expect(propDef.isMultivalued()).toBe(false);

      const name = 'test';
      const property = factory.createProperty(propDef, name);

      expect(property.read()).toBe('test');
      expect(Array.isArray(property.read())).toBe(false);
    });
  });

  describe('Read-Only and Default Values', () => {
    it('should support read-only multivalued property', () => {
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        null,
        false,
        true, // isReadable
        false, // isWritable
        true,
        true,
        true // isMultivalued
      );

      expect(propDef.isMultivalued()).toBe(true);
      expect(propDef.isReadable()).toBe(true);
      expect(propDef.isWritable()).toBe(false);

      const tags = ['readonly', 'tags'];
      const property = factory.createProperty(propDef, tags);

      const readTags = property.read() as string[];
      expect(readTags.length).toBe(2);
    });

    it('should support multivalued property with default value', () => {
      const defaultTags = ['default'];
      const propDef = factory.createPropertyDef(
        'tags',
        PropertyType.String,
        defaultTags,
        true, // hasDefaultValue
        true,
        true,
        true,
        true,
        true
      );

      expect(propDef.hasDefaultValue()).toBe(true);
      expect(propDef.isMultivalued()).toBe(true);

      const readDefault = propDef.defaultValue() as string[];
      expect(readDefault.length).toBe(1);
      expect(readDefault[0]).toBe('default');
    });
  });
});
