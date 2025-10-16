/**
 * Tests to verify that hash caching is working correctly for PropertyDef and AspectDef implementations.
 */

import { describe, it, expect } from '@jest/globals';
import { PropertyDefBuilder } from './PropertyDefBuilder.js';
import { PropertyType } from '../types.js';
import {
  ImmutableAspectDefImpl,
  MutableAspectDefImpl,
  FullAspectDefImpl,
} from './AspectDefImpl.js';
import { PropertyDef } from '../interfaces/index.js';

describe('HashCaching', () => {
  describe('PropertyDefImpl', () => {
    it('should cache hash value - multiple calls return same value', () => {
      const propDef = new PropertyDefBuilder()
        .setName('testProp')
        .setType(PropertyType.String)
        .build();

      const hash1 = propDef.hash();
      const hash2 = propDef.hash();
      const hash3 = propDef.hash();

      expect(hash2).toBe(hash1);
      expect(hash3).toBe(hash1);
      expect(hash1).not.toBe(0n);
    });
  });

  describe('ImmutableAspectDefImpl', () => {
    it('should cache hash value - multiple calls return same value', () => {
      const propertyDefs = new Map<string, PropertyDef>([
        [
          'prop1',
          new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build(),
        ],
        [
          'prop2',
          new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build(),
        ],
      ]);

      const aspectDef = new ImmutableAspectDefImpl('testAspect', propertyDefs);

      const hash1 = aspectDef.hash();
      const hash2 = aspectDef.hash();
      const hash3 = aspectDef.hash();

      expect(hash2).toBe(hash1);
      expect(hash3).toBe(hash1);
      expect(hash1).not.toBe(0n);
    });
  });

  describe('MutableAspectDefImpl', () => {
    it('should invalidate cache on add', () => {
      const propertyDefs = new Map<string, PropertyDef>([
        [
          'prop1',
          new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build(),
        ],
      ]);

      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      const hashBeforeAdd = aspectDef.hash();

      // Add a property - should invalidate cache
      aspectDef.add(
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const hashAfterAdd = aspectDef.hash();

      expect(hashAfterAdd).not.toBe(hashBeforeAdd);
      expect(hashBeforeAdd).not.toBe(0n);
      expect(hashAfterAdd).not.toBe(0n);
    });

    it('should invalidate cache on remove', () => {
      const prop1 = new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build();
      const prop2 = new PropertyDefBuilder()
        .setName('prop2')
        .setType(PropertyType.Integer)
        .build();
      const propertyDefs = new Map<string, PropertyDef>([
        ['prop1', prop1],
        ['prop2', prop2],
      ]);

      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      const hashBeforeRemove = aspectDef.hash();

      // Remove a property - should invalidate cache
      aspectDef.remove(prop2);

      const hashAfterRemove = aspectDef.hash();

      expect(hashAfterRemove).not.toBe(hashBeforeRemove);
      expect(hashBeforeRemove).not.toBe(0n);
      expect(hashAfterRemove).not.toBe(0n);
    });

    it('should cache hash value after multiple modifications', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      // Add properties
      aspectDef.add(
        new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
      );
      aspectDef.add(
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      // Get hash (should be computed and cached)
      const hash1 = aspectDef.hash();
      const hash2 = aspectDef.hash();
      const hash3 = aspectDef.hash();

      // All should be the same (cached)
      expect(hash2).toBe(hash1);
      expect(hash3).toBe(hash1);

      // Modify again
      aspectDef.add(
        new PropertyDefBuilder().setName('prop3').setType(PropertyType.Boolean).build()
      );

      const hash4 = aspectDef.hash();
      const hash5 = aspectDef.hash();

      // Hash should have changed
      expect(hash4).not.toBe(hash1);
      // But new hash should be cached
      expect(hash5).toBe(hash4);
    });
  });

  describe('FullAspectDefImpl', () => {
    it('should invalidate cache on add when allowed', () => {
      const propertyDefs = new Map<string, PropertyDef>([
        [
          'prop1',
          new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build(),
        ],
      ]);

      const aspectDef = new FullAspectDefImpl(
        'testAspect',
        crypto.randomUUID(),
        propertyDefs,
        true, // isReadable
        true, // isWritable
        true, // canAddProperties
        false // canRemoveProperties
      );

      const hashBeforeAdd = aspectDef.hash();

      // Add a property - should invalidate cache
      aspectDef.add(
        new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
      );

      const hashAfterAdd = aspectDef.hash();

      expect(hashAfterAdd).not.toBe(hashBeforeAdd);
      expect(hashBeforeAdd).not.toBe(0n);
      expect(hashAfterAdd).not.toBe(0n);
    });

    it('should invalidate cache on remove when allowed', () => {
      const prop1 = new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build();
      const prop2 = new PropertyDefBuilder()
        .setName('prop2')
        .setType(PropertyType.Integer)
        .build();
      const propertyDefs = new Map<string, PropertyDef>([
        ['prop1', prop1],
        ['prop2', prop2],
      ]);

      const aspectDef = new FullAspectDefImpl(
        'testAspect',
        crypto.randomUUID(),
        propertyDefs,
        true, // isReadable
        true, // isWritable
        false, // canAddProperties
        true // canRemoveProperties
      );

      const hashBeforeRemove = aspectDef.hash();

      // Remove a property - should invalidate cache
      aspectDef.remove(prop2);

      const hashAfterRemove = aspectDef.hash();

      expect(hashAfterRemove).not.toBe(hashBeforeRemove);
      expect(hashBeforeRemove).not.toBe(0n);
      expect(hashAfterRemove).not.toBe(0n);
    });
  });
});
