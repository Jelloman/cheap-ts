/**
 * Unit tests for AspectPropertyMapImpl
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Entity, PropertyDef, Property } from "../interfaces/index.js";
import { PropertyType } from "../types.js";
import { AspectPropertyMapImpl } from "./AspectImpl.js";
import { EntityImpl } from "./EntityImpl.js";
import { MutableAspectDefImpl } from "./AspectDefImpl.js";
import { PropertyDefImpl, PropertyImpl } from "./PropertyImpl.js";

describe("AspectPropertyMapImpl", () => {
  let entity: Entity;
  let aspectDef: MutableAspectDefImpl;
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let property1: Property;
  let property2: Property;
  let aspect: AspectPropertyMapImpl;

  beforeEach(() => {
    entity = new EntityImpl();
    aspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
    propDef1 = new PropertyDefImpl("prop1", PropertyType.String);
    propDef2 = new PropertyDefImpl("prop2", PropertyType.Integer);
    property1 = new PropertyImpl(propDef1, "test-value");
    property2 = new PropertyImpl(propDef2, 42);
    aspect = new AspectPropertyMapImpl(entity, aspectDef);
  });

  describe("constructor", () => {
    it("should create empty aspect with default capacity", () => {
      const aspect = new AspectPropertyMapImpl(entity, aspectDef);

      expect(aspect.entity()).toBe(entity);
      expect(aspect.def()).toBe(aspectDef);
      expect((aspect as any).props).not.toBeNull();
      expect((aspect as any).props.size).toBe(0);
    });
  });

  describe("contains", () => {
    it("should return false when property not present", () => {
      expect(aspect.contains("nonexistent")).toBe(false);
    });

    it("should return true when property present", () => {
      aspect.put(property1);
      expect(aspect.contains("prop1")).toBe(true);
    });
  });

  describe("unsafeReadObj", () => {
    it("should return null when property not present", () => {
      expect(aspect.unsafeReadObj("nonexistent")).toBeNull();
    });

    it("should return property value when present", () => {
      aspect.put(property1);
      const result = aspect.unsafeReadObj("prop1");
      expect(result).toBe("test-value");
    });
  });

  describe("get", () => {
    it("should throw exception when aspect not readable", () => {
      // Override isReadable to return false
      const nonReadableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      Object.defineProperty(nonReadableAspectDef, "isReadable", {
        value: () => false,
        writable: false,
      });
      aspect = new AspectPropertyMapImpl(entity, nonReadableAspectDef);
      aspect.put(property1);

      expect(() => aspect.get("prop1")).toThrow(/is not readable/);
    });

    it("should throw exception when property not present", () => {
      const readableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, readableAspectDef);

      expect(() => aspect.get("nonexistent")).toThrow(/does not contain prop named/);
    });

    it("should throw exception when property not readable", () => {
      const readableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, readableAspectDef);
      const nonReadablePropDef = new PropertyDefImpl(
        "readonly",
        PropertyType.String,
        null,
        false,
        false,
        true,
        true,
        true,
        false,
      );
      const nonReadableProperty = new PropertyImpl(nonReadablePropDef, "value");
      (aspect as any).props.set("readonly", nonReadableProperty);

      expect(() => aspect.get("readonly")).toThrow(/is not readable/);
    });

    it("should return property when valid", () => {
      const readableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, readableAspectDef);
      const readablePropDef = new PropertyDefImpl(
        "readable",
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        false,
      );
      const readableProperty = new PropertyImpl(readablePropDef, "value");
      aspect.put(readableProperty);

      const result = aspect.get("readable");
      expect(result).toBe(readableProperty);
    });
  });

  describe("put", () => {
    it("should throw exception when aspect not writable", () => {
      const nonWritableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      Object.defineProperty(nonWritableAspectDef, "isWritable", {
        value: () => false,
        writable: false,
      });
      aspect = new AspectPropertyMapImpl(entity, nonWritableAspectDef);

      expect(() => aspect.put(property1)).toThrow(/is not writable/);
    });

    it("should throw exception for new property when not extensible", () => {
      const nonExtensibleAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      Object.defineProperty(nonExtensibleAspectDef, "canAddProperties", {
        value: () => false,
        writable: false,
      });
      aspect = new AspectPropertyMapImpl(entity, nonExtensibleAspectDef);

      expect(() => aspect.put(property1)).toThrow(/is not extensible/);
    });

    it("should add new property when extensible", () => {
      const writableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, writableAspectDef);

      aspect.put(property1);

      expect(aspect.contains("prop1")).toBe(true);
      expect((aspect as any).props.get("prop1")).toBe(property1);
    });

    it("should throw exception when existing property not writable", () => {
      const writableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, writableAspectDef);
      const nonWritablePropDef = new PropertyDefImpl(
        "readonly",
        PropertyType.String,
        null,
        false,
        true,
        false,
        true,
        true,
        false,
      );
      const existingProperty = new PropertyImpl(nonWritablePropDef, "old-value");
      (aspect as any).props.set("readonly", existingProperty);

      const newProperty = new PropertyImpl(nonWritablePropDef, "new-value");
      expect(() => aspect.put(newProperty)).toThrow(/is marked not writable/);
    });

    it("should throw exception when property def conflicts", () => {
      const writableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, writableAspectDef);
      const propDef1 = new PropertyDefImpl("prop", PropertyType.String, null, false, true, true, true, true, false);
      writableAspectDef.add(propDef1);

      const propDef2 = new PropertyDefImpl("prop", PropertyType.Integer, null, false, true, true, true, true, false);

      const existingProperty = new PropertyImpl(propDef1, "value");
      (aspect as any).props.set("prop", existingProperty);

      const newProperty = new PropertyImpl(propDef2, 42);
      expect(() => aspect.put(newProperty)).toThrow(/conflicts with the existing definition/);
    });

    it("should update property when same def", () => {
      const writableAspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
      aspect = new AspectPropertyMapImpl(entity, writableAspectDef);
      const writablePropDef = new PropertyDefImpl(
        "writable",
        PropertyType.String,
        null,
        false,
        true,
        true,
        true,
        true,
        false,
      );

      const existingProperty = new PropertyImpl(writablePropDef, "old-value");
      (aspect as any).props.set("writable", existingProperty);

      const newProperty = new PropertyImpl(writablePropDef, "new-value");
      aspect.put(newProperty);

      expect((aspect as any).props.get("writable")).toBe(newProperty);
    });
  });

  describe("unsafeAdd", () => {
    it("should add new property", () => {
      aspect.unsafeAdd(property1);

      expect(aspect.contains("prop1")).toBe(true);
      expect((aspect as any).props.get("prop1")).toBe(property1);
    });

    it("should add multiple properties", () => {
      aspect.unsafeAdd(property1);
      aspect.unsafeAdd(property2);

      expect(aspect.contains("prop1")).toBe(true);
      expect(aspect.contains("prop2")).toBe(true);
      expect((aspect as any).props.get("prop1")).toBe(property1);
      expect((aspect as any).props.get("prop2")).toBe(property2);
    });
  });

  describe("unsafeWrite", () => {
    it("should throw exception when property not present", () => {
      expect(() => aspect.unsafeWrite("nonexistent", "value")).toThrow(/does not contain prop named 'nonexistent'/);
    });

    it("should update property when present", () => {
      (aspect as any).props.set("prop1", property1);

      aspect.unsafeWrite("prop1", "new-value");

      const result = (aspect as any).props.get("prop1");
      expect(result).not.toBe(property1);
      expect(result?.unsafeRead()).toBe("new-value");
      expect(result?.def()).toBe(propDef1);
    });
  });

  describe("unsafeRemove", () => {
    it("should remove property when present", () => {
      aspect.put(property1);
      expect(aspect.contains("prop1")).toBe(true);

      aspect.unsafeRemove("prop1");

      expect(aspect.contains("prop1")).toBe(false);
      expect((aspect as any).props.get("prop1")).toBeUndefined();
    });

    it("should do nothing when property not present", () => {
      expect(() => aspect.unsafeRemove("nonexistent")).not.toThrow();
    });
  });
});
