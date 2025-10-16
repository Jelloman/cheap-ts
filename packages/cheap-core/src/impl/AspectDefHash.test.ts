import { describe, it, expect } from '@jest/globals';
import {
  MutableAspectDefImpl,
  ImmutableAspectDefImpl,
  FullAspectDefImpl,
} from './AspectDefImpl.js';
import { PropertyDefBuilder } from './PropertyDefBuilder.js';
import { PropertyDef } from '../interfaces/Property.js';
import { PropertyType } from '../types.js';

/**
 * Tests for verifying that identical AspectDef instances produce the same hash value,
 * even when using different implementations (FullAspectDefImpl vs MutableAspectDefImpl).
 */
describe('AspectDefHash', () => {
  it('hash_IdenticalFullAndMutableAspectDefs_ProduceSameHash', () => {
    // Create shared UUID and property definitions
    const globalId = crypto.randomUUID();
    const propertyDefs = new Map<string, PropertyDef>();
    propertyDefs.set(
      'prop1',
      new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
    );
    propertyDefs.set(
      'prop2',
      new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
    );

    // Create FullAspectDefImpl with all mutability flags set to true (same as MutableAspectDefImpl)
    const fullAspectDef = new FullAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs),
      true, // isReadable
      true, // isWritable
      true, // canAddProperties
      true // canRemoveProperties
    );

    // Create MutableAspectDefImpl with same properties
    const mutableAspectDef = new MutableAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs)
    );

    // Verify both have the same hash
    expect(fullAspectDef.hash()).toBe(mutableAspectDef.hash());
  });

  it('hash_IdenticalFullAndImmutableAspectDefs_ProduceSameHash', () => {
    // Create shared UUID and property definitions
    const globalId = crypto.randomUUID();
    const propertyDefs = new Map<string, PropertyDef>();
    propertyDefs.set(
      'prop1',
      new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
    );
    propertyDefs.set(
      'prop2',
      new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
    );

    // Create FullAspectDefImpl with all mutability flags set to false (same as ImmutableAspectDefImpl)
    const fullAspectDef = new FullAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs),
      true, // isReadable
      true, // isWritable
      false, // canAddProperties
      false // canRemoveProperties
    );

    // Create ImmutableAspectDefImpl with same properties
    const immutableAspectDef = new ImmutableAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs)
    );

    // Verify both have the same hash
    expect(fullAspectDef.hash()).toBe(immutableAspectDef.hash());
  });

  it('hash_TwoFullAspectDefsWithDifferentMutabilityFlags_ProduceDifferentHash', () => {
    // Create shared UUID and property definitions
    const globalId = crypto.randomUUID();
    const propertyDefs = new Map<string, PropertyDef>();
    propertyDefs.set(
      'prop1',
      new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
    );
    propertyDefs.set(
      'prop2',
      new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
    );

    // Create FullAspectDefImpl with canAddProperties=true
    const aspectDef1 = new FullAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs),
      true, // isReadable
      true, // isWritable
      true, // canAddProperties
      false // canRemoveProperties
    );

    // Create FullAspectDefImpl with canAddProperties=false
    const aspectDef2 = new FullAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs),
      true, // isReadable
      true, // isWritable
      false, // canAddProperties (different!)
      false // canRemoveProperties
    );

    // Verify they have different hashes
    expect(aspectDef1.hash()).not.toBe(aspectDef2.hash());
  });

  it('hash_MutableAndImmutableAspectDefs_ProduceDifferentHash', () => {
    // Create shared UUID and property definitions
    const globalId = crypto.randomUUID();
    const propertyDefs = new Map<string, PropertyDef>();
    propertyDefs.set(
      'prop1',
      new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build()
    );
    propertyDefs.set(
      'prop2',
      new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build()
    );

    // Create MutableAspectDefImpl
    const mutableAspectDef = new MutableAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs)
    );

    // Create ImmutableAspectDefImpl
    const immutableAspectDef = new ImmutableAspectDefImpl(
      'testAspect',
      globalId,
      new Map(propertyDefs)
    );

    // Verify they have different hashes due to different mutability flags
    expect(mutableAspectDef.hash()).not.toBe(immutableAspectDef.hash());
  });
});
