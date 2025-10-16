/**
 * Unit tests for AspectPropertyMapBuilder
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { Entity, AspectDef, PropertyDef, Property } from '../interfaces/index.js';
import { PropertyType } from '../types.js';
import { AspectPropertyMapBuilder } from './AspectBuilderImpl.js';
import { EntityImpl } from './EntityImpl.js';
import { MutableAspectDefImpl } from '../impl/AspectDefImpl.js';
import { PropertyDefImpl, PropertyImpl } from './PropertyImpl.js';
import { AspectPropertyMapImpl } from './AspectImpl.js';

describe('AspectPropertyMapBuilder', () => {
  let builder: AspectPropertyMapBuilder;
  let entity: Entity;
  let aspectDef: AspectDef;
  let stringPropDef: PropertyDef;
  let intPropDef: PropertyDef;
  let nullablePropDef: PropertyDef;
  let stringProperty: Property;
  let intProperty: Property;
  let entityId: string;

  beforeEach(() => {
    builder = new AspectPropertyMapBuilder();
    entityId = crypto.randomUUID();
    entity = new EntityImpl(entityId);
    aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), undefined);

    // Create property definitions
    stringPropDef = new PropertyDefImpl('stringProp', PropertyType.String, null, false, true, true, false, true, false);
    intPropDef = new PropertyDefImpl('intProp', PropertyType.Integer, null, false, true, true, false, true, false);
    nullablePropDef = new PropertyDefImpl('nullableProp', PropertyType.String, null, false, true, true, true, true, false);

    // Add properties to aspect definition
    (aspectDef as MutableAspectDefImpl).add(stringPropDef);
    (aspectDef as MutableAspectDefImpl).add(intPropDef);
    (aspectDef as MutableAspectDefImpl).add(nullablePropDef);

    // Create property instances
    stringProperty = new PropertyImpl(stringPropDef, 'test-value');
    intProperty = new PropertyImpl(intPropDef, 42);
  });

  describe('constructor', () => {
    it('should create empty builder', () => {
      const builder = new AspectPropertyMapBuilder();
      expect(builder).not.toBeNull();
    });
  });

  describe('entity', () => {
    it('should set entity and return builder', () => {
      const result = builder.entity(entity);
      expect(result).toBe(builder);
    });

    it('should throw exception for null entity', () => {
      expect(() => builder.entity(null as any)).toThrow();
    });
  });

  describe('aspectDef', () => {
    it('should set aspectDef and return builder', () => {
      const result = builder.aspectDef(aspectDef);
      expect(result).toBe(builder);
    });

    it('should throw exception for null aspectDef', () => {
      expect(() => builder.aspectDef(null as any)).toThrow();
    });
  });

  describe('property with name and value', () => {
    it('should add property with valid name and value', () => {
      builder.aspectDef(aspectDef);
      const result = builder.property('stringProp', 'test-value');
      expect(result).toBe(builder);
    });

    it('should throw exception for null property name', () => {
      builder.aspectDef(aspectDef);
      expect(() => builder.property(null as any, 'value')).toThrow();
    });

    it('should throw exception when aspectDef not set', () => {
      expect(() => builder.property('stringProp', 'value')).toThrow(/AspectDef must be set/);
    });

    it('should throw exception for undefined property name', () => {
      builder.aspectDef(aspectDef);
      expect(() => builder.property('undefinedProp', 'value')).toThrow(/not defined in AspectDef/);
    });

    it('should throw exception for wrong type', () => {
      builder.aspectDef(aspectDef);
      expect(() => builder.property('intProp', 'not-an-integer')).toThrow(/expects type/);
    });

    it('should throw exception for null value on non-nullable property', () => {
      builder.aspectDef(aspectDef);
      expect(() => builder.property('stringProp', null)).toThrow(/does not allow null values/);
    });

    it('should succeed with null value for nullable property', () => {
      builder.aspectDef(aspectDef);
      const result = builder.property('nullableProp', null);
      expect(result).toBe(builder);
    });
  });

  describe('property with Property object', () => {
    it('should add property object', () => {
      builder.aspectDef(aspectDef);
      const result = builder.property(stringProperty);
      expect(result).toBe(builder);
    });

    it('should throw exception for null property', () => {
      builder.aspectDef(aspectDef);
      expect(() => builder.property(null as any)).toThrow();
    });

    it('should succeed when no aspectDef set', () => {
      expect(() => builder.property(stringProperty)).not.toThrow();
    });

    it('should throw exception for property undefined in aspectDef', () => {
      const emptyAspectDef = new MutableAspectDefImpl('emptyAspect', crypto.randomUUID(), undefined);
      (emptyAspectDef as MutableAspectDefImpl).add(intPropDef);
      // Mark as non-extensible
      Object.defineProperty(emptyAspectDef, 'canAddProperties', {
        value: () => false,
        writable: false,
      });
      builder.aspectDef(emptyAspectDef);

      expect(() => builder.property(stringProperty)).toThrow();
    });

    it('should throw exception for property with mismatched definition', () => {
      const differentDef = new PropertyDefImpl('stringProp', PropertyType.String, null, false, false, true, false, true, false);
      const propertyWithDifferentDef = new PropertyImpl(differentDef, 'value');
      builder.aspectDef(aspectDef);

      expect(() => builder.property(propertyWithDifferentDef)).toThrow(/does not match the definition/);
    });
  });

  describe('build', () => {
    it('should create AspectPropertyMapImpl with required fields', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'test-value')
        .property('intProp', 42)
        .build();

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(AspectPropertyMapImpl);
      expect(result.entity()).toBe(entity);
      expect(result.def()).toBe(aspectDef);
      expect(result.readObj('stringProp')).toBe('test-value');
      expect(result.readObj('intProp')).toBe(42);
    });

    it('should create aspect with entity', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'test-value')
        .build();

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(AspectPropertyMapImpl);
      expect(result.entity().globalId()).toBe(entityId);
      expect(result.def()).toBe(aspectDef);
      expect(result.readObj('stringProp')).toBe('test-value');
    });

    it('should create aspect with property objects', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property(stringProperty)
        .property(intProperty)
        .build();

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(AspectPropertyMapImpl);
      expect(result.readObj('stringProp')).toBe('test-value');
      expect(result.readObj('intProp')).toBe(42);
    });

    it('should throw exception when entity not set', () => {
      expect(() => builder.aspectDef(aspectDef).build()).toThrow(/Entity must be set/);
    });

    it('should throw exception when aspectDef not set', () => {
      expect(() => builder.entity(entity).build()).toThrow(/AspectDef must be set/);
    });

    it('should create aspect with nullable property', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('nullableProp', null)
        .build();

      expect(result).not.toBeNull();
      expect(result.readObj('nullableProp')).toBeNull();
    });
  });

  describe('reset', () => {
    it('should clear all state', () => {
      builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'test-value');

      const result = builder.reset();
      expect(result).toBe(builder);

      // Should throw exception since state is cleared
      expect(() => builder.build()).toThrow();
    });

    it('should allow reuse', () => {
      // Build first aspect
      const aspect1 = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'value1')
        .build();

      // Reset and build second aspect
      const entity2 = new EntityImpl();
      const aspect2 = builder
        .reset()
        .entity(entity2)
        .aspectDef(aspectDef)
        .property('stringProp', 'value2')
        .build();

      expect(aspect1).not.toBe(aspect2);
      expect(aspect1.readObj('stringProp')).toBe('value1');
      expect(aspect2.readObj('stringProp')).toBe('value2');
      expect(aspect1.entity()).not.toBe(aspect2.entity());
    });
  });

  describe('fluent interface', () => {
    it('should chain methods', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'test-value')
        .property(intProperty)
        .build();

      expect(result).not.toBeNull();
      expect(result.readObj('stringProp')).toBe('test-value');
      expect(result.readObj('intProp')).toBe(42);
    });

    it('should handle mixed property and name-value calls', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'from-name-value')
        .property(intProperty)
        .property('nullableProp', null)
        .build();

      expect(result).not.toBeNull();
      expect(result.readObj('stringProp')).toBe('from-name-value');
      expect(result.readObj('intProp')).toBe(42);
      expect(result.readObj('nullableProp')).toBeNull();
    });

    it('should use latest value when property overwritten', () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property('stringProp', 'first-value')
        .property('stringProp', 'second-value')
        .build();

      expect(result).not.toBeNull();
      expect(result.readObj('stringProp')).toBe('second-value');
    });
  });
});
