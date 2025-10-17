/**
 * Unit tests for AspectObjectMapImpl
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Entity, MutableAspectDef, PropertyDef, Property } from "../interfaces/index.js";
import { PropertyType } from "../types.js";
import { AspectObjectMapImpl } from "./AspectImpl.js";
import { EntityImpl } from "./EntityImpl.js";
import { MutableAspectDefImpl } from "./AspectDefImpl.js";
import { PropertyDefImpl, PropertyImpl } from "./PropertyImpl.js";

describe("AspectObjectMapImpl", () => {
  let entity: Entity;
  let aspectDef: MutableAspectDef;
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let property1: Property;
  let property2: Property;
  let aspect: AspectObjectMapImpl;

  beforeEach(() => {
    entity = new EntityImpl();
    aspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
    propDef1 = new PropertyDefImpl("prop1", PropertyType.String);
    propDef2 = new PropertyDefImpl("prop2", PropertyType.Integer);
    property1 = new PropertyImpl(propDef1, "test-value");
    property2 = new PropertyImpl(propDef2, 42);
    aspect = new AspectObjectMapImpl(entity, aspectDef);
  });

  describe("constructor", () => {
    it("should create empty aspect with default capacity", () => {
      const aspect = new AspectObjectMapImpl(entity, aspectDef);

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

  describe("readObj", () => {
    it("should return null when property not present", () => {
      expect(aspect.unsafeReadObj("nonexistent")).toBeNull();
    });

    it("should return property value when present", () => {
      aspectDef.add(propDef1);
      aspect.put(property1);

      const result = aspect.readObj("prop1");
      expect(result).toBe(property1.unsafeRead());
    });
  });

  describe("put", () => {
    it("should add new property", () => {
      aspectDef.add(propDef1);
      aspect.put(property1);

      expect(aspect.contains("prop1")).toBe(true);
      expect(aspect.readObj("prop1")).toBe(property1.read());
    });

    it("should add multiple properties", () => {
      aspectDef.add(propDef1);
      aspectDef.add(propDef2);
      aspect.put(property1);
      aspect.put(property2);

      expect(aspect.contains("prop1")).toBe(true);
      expect(aspect.contains("prop2")).toBe(true);
      expect(aspect.readObj("prop1")).toBe(property1.read());
      expect(aspect.readObj("prop2")).toBe(property2.read());
    });
  });

  describe("unsafeWrite", () => {
    it("should throw exception when property not present", () => {
      expect(() => aspect.unsafeWrite("nonexistent", "value")).toThrow(/does not contain prop named 'nonexistent'/);
    });

    it("should update property when present", () => {
      const mutableDef = aspectDef as MutableAspectDefImpl;
      mutableDef.add(propDef1);
      (aspect as any).props.set("prop1", "old-value");

      aspect.unsafeWrite("prop1", "new-value");

      const result = aspect.readObj("prop1");
      expect(typeof result).toBe("string");
      expect(result).toBe("new-value");
    });

    it("should throw exception when aspectDef missing property", () => {
      (aspect as any).props.set("prop1", property1);

      expect(() => aspect.unsafeWrite("prop1", "new-value")).toThrow(/does not contain prop named 'prop1'/);
    });
  });

  describe("unsafeRemove", () => {
    it("should remove property when present", () => {
      aspect.put(property1);
      expect(aspect.contains("prop1")).toBe(true);

      aspect.unsafeRemove("prop1");

      expect(aspect.contains("prop1")).toBe(false);
      expect(aspect.unsafeReadObj("prop1")).toBeNull();
    });

    it("should do nothing when property not present", () => {
      expect(() => aspect.unsafeRemove("nonexistent")).not.toThrow();
    });
  });
});
