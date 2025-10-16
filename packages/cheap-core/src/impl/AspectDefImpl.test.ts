import { describe, it, expect, beforeEach } from '@jest/globals';
import { MutableAspectDefImpl, ImmutableAspectDefImpl } from './AspectDefImpl.js';
import { PropertyDefBuilder } from './PropertyDefBuilder.js';
import { PropertyDef } from '../interfaces/Property.js';
import { PropertyType } from '../types.js';

describe('MutableAspectDefImpl', () => {
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let propDef3: PropertyDef;
  let propertyDefs: Map<string, PropertyDef>;

  beforeEach(() => {
    propDef1 = new PropertyDefBuilder()
      .setName('prop1')
      .setType(PropertyType.String)
      .build();
    propDef2 = new PropertyDefBuilder()
      .setName('prop2')
      .setType(PropertyType.Integer)
      .build();
    propDef3 = new PropertyDefBuilder()
      .setName('prop3')
      .setType(PropertyType.Boolean)
      .build();

    propertyDefs = new Map();
    propertyDefs.set('prop1', propDef1);
    propertyDefs.set('prop2', propDef2);
  });

  describe('constructor', () => {
    it('should create empty mutable aspect def with name only', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      expect(aspectDef.name()).toBe('testAspect');
      expect(aspectDef.propertyDefs().length).toBe(0);
      expect(aspectDef.canAddProperties()).toBe(true);
      expect(aspectDef.canRemoveProperties()).toBe(true);
    });

    it('should create mutable aspect def with name and properties', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      expect(aspectDef.name()).toBe('testAspect');
      expect(aspectDef.propertyDefs().length).toBe(2);
      expect(aspectDef.propertyDef('prop1')).toBe(propDef1);
      expect(aspectDef.propertyDef('prop2')).toBe(propDef2);
      expect(aspectDef.canAddProperties()).toBe(true);
      expect(aspectDef.canRemoveProperties()).toBe(true);
    });

    it('should throw for null name', () => {
      expect(() => {
        new MutableAspectDefImpl('', crypto.randomUUID());
      }).toThrow();
    });

    it('should throw for null property map', () => {
      expect(() => {
        new MutableAspectDefImpl('testAspect', crypto.randomUUID(), null as any);
      }).toThrow();
    });
  });

  describe('add', () => {
    it('should add new property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      const result = aspectDef.add(propDef1);

      expect(result).toBeNull();
      expect(aspectDef.propertyDefs().length).toBe(1);
      expect(aspectDef.propertyDef('prop1')).toBe(propDef1);
    });

    it('should return old property when replacing existing property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);
      const newProp = new PropertyDefBuilder()
        .setName('prop1')
        .setType(PropertyType.Boolean)
        .build();

      const result = aspectDef.add(newProp);

      expect(result).toBe(propDef1);
      expect(aspectDef.propertyDefs().length).toBe(2);
      expect(aspectDef.propertyDef('prop1')).toBe(newProp);
    });

    it('should add multiple properties', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      aspectDef.add(propDef1);
      aspectDef.add(propDef2);
      aspectDef.add(propDef3);

      expect(aspectDef.propertyDefs().length).toBe(3);
      expect(aspectDef.propertyDef('prop1')).toBe(propDef1);
      expect(aspectDef.propertyDef('prop2')).toBe(propDef2);
      expect(aspectDef.propertyDef('prop3')).toBe(propDef3);
    });

    it('should throw for null property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      expect(() => {
        aspectDef.add(null as any);
      }).toThrow();
    });
  });

  describe('remove', () => {
    it('should remove existing property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      const result = aspectDef.remove(propDef1);

      expect(result).toBe(propDef1);
      expect(aspectDef.propertyDefs().length).toBe(1);
      expect(aspectDef.propertyDef('prop1')).toBeNull();
      expect(aspectDef.propertyDef('prop2')).toBe(propDef2);
    });

    it('should return null for non-existent property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      const result = aspectDef.remove(propDef1);

      expect(result).toBeNull();
      expect(aspectDef.propertyDefs().length).toBe(0);
    });

    it('should remove property with same name', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);
      const differentPropSameName = new PropertyDefBuilder()
        .setName('prop1')
        .setType(PropertyType.Float)
        .build();

      const result = aspectDef.remove(differentPropSameName);

      expect(result).toBe(propDef1); // Returns the original property that was removed
      expect(aspectDef.propertyDefs().length).toBe(1);
      expect(aspectDef.propertyDef('prop1')).toBeNull();
    });

    it('should throw for null property', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      expect(() => {
        aspectDef.remove(null as any);
      }).toThrow();
    });
  });

  describe('canAddProperties', () => {
    it('should always return true', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      expect(aspectDef.canAddProperties()).toBe(true);

      // Should still return true after adding properties
      aspectDef.add(propDef1);
      expect(aspectDef.canAddProperties()).toBe(true);
    });
  });

  describe('canRemoveProperties', () => {
    it('should always return true', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      expect(aspectDef.canRemoveProperties()).toBe(true);

      // Should still return true after removing properties
      aspectDef.remove(propDef1);
      expect(aspectDef.canRemoveProperties()).toBe(true);

      // Should still return true even when empty
      aspectDef.remove(propDef2);
      expect(aspectDef.canRemoveProperties()).toBe(true);
    });
  });

  describe('name', () => {
    it('should return provided name', () => {
      const aspectDef = new MutableAspectDefImpl('myAspect', crypto.randomUUID());

      expect(aspectDef.name()).toBe('myAspect');
    });
  });

  describe('propertyDefs', () => {
    it('should allow adding properties via add method', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      aspectDef.add(propDef3);

      expect(aspectDef.propertyDefs().length).toBe(1);
      expect(aspectDef.propertyDef('prop3')).toBe(propDef3);
    });

    it('should return same collection on multiple calls', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      const first = aspectDef.propertyDefs();
      const second = aspectDef.propertyDefs();

      // Arrays are new each time, but should have same contents
      expect(first.length).toBe(second.length);
    });
  });

  describe('addAndRemove chained operations', () => {
    it('should work correctly', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());

      // Add properties
      expect(aspectDef.add(propDef1)).toBeNull();
      expect(aspectDef.add(propDef2)).toBeNull();
      expect(aspectDef.propertyDefs().length).toBe(2);

      // Remove one property
      expect(aspectDef.remove(propDef1)).toBe(propDef1);
      expect(aspectDef.propertyDefs().length).toBe(1);

      // Add it back
      expect(aspectDef.add(propDef1)).toBeNull();
      expect(aspectDef.propertyDefs().length).toBe(2);

      // Remove all
      expect(aspectDef.remove(propDef1)).toBe(propDef1);
      expect(aspectDef.remove(propDef2)).toBe(propDef2);
      expect(aspectDef.propertyDefs().length).toBe(0);
    });
  });

  describe('special character names', () => {
    it('should handle special characters in name', () => {
      const specialName = 'aspect-with_special.chars@123';
      const aspectDef = new MutableAspectDefImpl(specialName, crypto.randomUUID());

      expect(aspectDef.name()).toBe(specialName);
    });

    it('should handle whitespace in name', () => {
      const whitespaceName = '  aspect with spaces  ';
      const aspectDef = new MutableAspectDefImpl(whitespaceName, crypto.randomUUID());

      expect(aspectDef.name()).toBe(whitespaceName);
    });
  });

  describe('constructor with initial properties', () => {
    it('should modify when original map is modified', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      // Modify original map
      propertyDefs.set('prop3', propDef3);

      // AspectDef should be affected (since it uses the same map)
      expect(aspectDef.propertyDefs().length).toBe(3);
      expect(aspectDef.propertyDef('prop3')).toBe(propDef3);
    });
  });

  describe('property with special name', () => {
    it('should handle add with special name', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());
      const specialProp = new PropertyDefBuilder()
        .setName('_special_')
        .setType(PropertyType.String)
        .build();

      const result = aspectDef.add(specialProp);

      expect(result).toBeNull();
      expect(aspectDef.propertyDefs().length).toBe(1);
      expect(aspectDef.propertyDef('_special_')).toBe(specialProp);
    });

    it('should handle remove with special name', () => {
      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID());
      const specialProp = new PropertyDefBuilder()
        .setName('_special_')
        .setType(PropertyType.String)
        .build();
      aspectDef.add(specialProp);

      const result = aspectDef.remove(specialProp);

      expect(result).toBe(specialProp);
      expect(aspectDef.propertyDefs().length).toBe(0);
    });
  });

  describe('large number of properties', () => {
    it('should handle correctly', () => {
      const aspectDef = new MutableAspectDefImpl('largeAspect', crypto.randomUUID());

      // Add many properties
      const props: PropertyDef[] = [];
      for (let i = 0; i < 1000; i++) {
        const prop = new PropertyDefBuilder()
          .setName('prop' + i)
          .setType(PropertyType.String)
          .build();
        props.push(prop);
        aspectDef.add(prop);
      }

      expect(aspectDef.propertyDefs().length).toBe(1000);

      // Remove half of them
      for (let i = 0; i < 500; i++) {
        expect(aspectDef.remove(props[i])).toBe(props[i]);
      }

      expect(aspectDef.propertyDefs().length).toBe(500);

      // Verify remaining properties
      for (let i = 500; i < 1000; i++) {
        expect(aspectDef.propertyDef('prop' + i)).toBe(props[i]);
      }
    });
  });

  describe('fullyEquals', () => {
    it('should return false for identical instances with different UUIDs', () => {
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

      const aspectDef1 = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs1);
      const aspectDef2 = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs2);

      // Different instances have different globalId UUIDs, so fullyEquals returns false
      expect(aspectDef1.fullyEquals(aspectDef2)).toBe(false);
      expect(aspectDef2.fullyEquals(aspectDef1)).toBe(false);
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

      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

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

      const aspectDef1 = new MutableAspectDefImpl('testAspect1', crypto.randomUUID(), propertyDefs);
      const aspectDef2 = new MutableAspectDefImpl('testAspect2', crypto.randomUUID(), propertyDefs);

      expect(aspectDef1.fullyEquals(aspectDef2)).toBe(false);
    });
  });

  describe('hash', () => {
    it('should return different hash for instances with different UUIDs', () => {
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

      const aspectDef1 = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs1);
      const aspectDef2 = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs2);

      // Different instances have different globalId UUIDs, so hashes are different
      expect(aspectDef1.hash()).not.toBe(aspectDef2.hash());
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

      const aspectDef = new MutableAspectDefImpl('testAspect', crypto.randomUUID(), propertyDefs);

      expect(aspectDef.hash()).toBe(aspectDef.hash());
    });

    it('should return different hash for different property order', () => {
      const propertyDefs1 = new Map<string, PropertyDef>();
      const prop1 = new PropertyDefBuilder().setName('prop1').setType(PropertyType.String).build();
      const prop2 = new PropertyDefBuilder().setName('prop2').setType(PropertyType.Integer).build();

      propertyDefs1.set('prop1', prop1);
      propertyDefs1.set('prop2', prop2);

      const propertyDefs2 = new Map<string, PropertyDef>();
      propertyDefs2.set('prop2', prop2);
      propertyDefs2.set('prop1', prop1);

      const uuid = crypto.randomUUID();
      const aspectDef1 = new MutableAspectDefImpl('testAspect', uuid, propertyDefs1);
      const aspectDef2 = new MutableAspectDefImpl('testAspect', uuid, propertyDefs2);

      // Property order affects hash value
      // Note: Map iteration order is insertion order in JavaScript
      expect(aspectDef1.hash()).not.toBe(aspectDef2.hash());
    });
  });
});

describe('ImmutableAspectDefImpl', () => {
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let propertyDefs: Map<string, PropertyDef>;

  beforeEach(() => {
    propDef1 = new PropertyDefBuilder()
      .setName('prop1')
      .setType(PropertyType.String)
      .build();
    propDef2 = new PropertyDefBuilder()
      .setName('prop2')
      .setType(PropertyType.Integer)
      .build();

    propertyDefs = new Map();
    propertyDefs.set('prop1', propDef1);
    propertyDefs.set('prop2', propDef2);
  });

  describe('constructor', () => {
    it('should create immutable aspect def with properties', () => {
      const aspectDef = new ImmutableAspectDefImpl(
        'testAspect',
        crypto.randomUUID(),
        propertyDefs
      );

      expect(aspectDef.name()).toBe('testAspect');
      expect(aspectDef.propertyDefs().length).toBe(2);
      expect(aspectDef.canAddProperties()).toBe(false);
      expect(aspectDef.canRemoveProperties()).toBe(false);
    });

    it('should throw for empty property map', () => {
      expect(() => {
        new ImmutableAspectDefImpl('testAspect', crypto.randomUUID(), new Map());
      }).toThrow('must contain at least one property');
    });
  });

  describe('canAddProperties', () => {
    it('should return false', () => {
      const aspectDef = new ImmutableAspectDefImpl(
        'testAspect',
        crypto.randomUUID(),
        propertyDefs
      );

      expect(aspectDef.canAddProperties()).toBe(false);
    });
  });

  describe('canRemoveProperties', () => {
    it('should return false', () => {
      const aspectDef = new ImmutableAspectDefImpl(
        'testAspect',
        crypto.randomUUID(),
        propertyDefs
      );

      expect(aspectDef.canRemoveProperties()).toBe(false);
    });
  });
});
