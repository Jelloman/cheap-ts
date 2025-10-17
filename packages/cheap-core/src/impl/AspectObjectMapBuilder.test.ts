/**
 * Unit tests for AspectObjectMapBuilder
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { Entity, AspectDef, PropertyDef, Property } from "../interfaces/index.js";
import { PropertyType } from "../types.js";
import { AspectObjectMapBuilder } from "./AspectBuilderImpl.js";
import { EntityImpl } from "./EntityImpl.js";
import { MutableAspectDefImpl } from "./AspectDefImpl.js";
import { PropertyDefImpl, PropertyImpl } from "./PropertyImpl.js";
import { AspectObjectMapImpl } from "./AspectImpl.js";

describe("AspectObjectMapBuilder", () => {
  let builder: AspectObjectMapBuilder;
  let entity: Entity;
  let aspectDef: AspectDef;
  let propDef1: PropertyDef;
  let propDef2: PropertyDef;
  let property1: Property;
  let property2: Property;
  let entityId: string;

  beforeEach(() => {
    builder = new AspectObjectMapBuilder();
    entityId = crypto.randomUUID();
    entity = new EntityImpl(entityId);
    aspectDef = new MutableAspectDefImpl("testAspect", crypto.randomUUID(), undefined);
    propDef1 = new PropertyDefImpl("prop1", PropertyType.String);
    propDef2 = new PropertyDefImpl("prop2", PropertyType.Integer);
    property1 = new PropertyImpl(propDef1, "test-value");
    property2 = new PropertyImpl(propDef2, 42);

    (aspectDef as MutableAspectDefImpl).add(propDef1);
    (aspectDef as MutableAspectDefImpl).add(propDef2);
  });

  describe("constructor", () => {
    it("should create empty builder", () => {
      const builder = new AspectObjectMapBuilder();
      expect(builder).not.toBeNull();
    });
  });

  describe("entity", () => {
    it("should set entity and return builder", () => {
      const result = builder.entity(entity);
      expect(result).toBe(builder);
    });

    it("should throw exception for null entity", () => {
      expect(() => builder.entity(null as any)).toThrow();
    });
  });

  describe("aspectDef", () => {
    it("should set aspectDef and return builder", () => {
      const result = builder.aspectDef(aspectDef);
      expect(result).toBe(builder);
    });

    it("should throw exception for null aspectDef", () => {
      expect(() => builder.aspectDef(null as any)).toThrow();
    });
  });

  describe("property", () => {
    it("should add property with name and value", () => {
      const result = builder.property("testProp", "testValue");
      expect(result).toBe(builder);
    });

    it("should throw exception for null property name", () => {
      expect(() => builder.property(null as any, "value")).toThrow();
    });

    it("should add property object", () => {
      const result = builder.property(property1);
      expect(result).toBe(builder);
    });

    it("should throw exception for null property", () => {
      expect(() => builder.property(null as any)).toThrow();
    });
  });

  describe("build", () => {
    it("should create AspectObjectMapImpl with required fields", () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property("prop1", "test-value")
        .property("prop2", 42)
        .build();

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(AspectObjectMapImpl);
      expect(result.entity()).toBe(entity);
      expect(result.def()).toBe(aspectDef);
      expect(result.readObj("prop1")).toBe("test-value");
      expect(result.readObj("prop2")).toBe(42);
    });

    it("should create aspect with property objects", () => {
      const result = builder.entity(entity).aspectDef(aspectDef).property(property1).property(property2).build();

      expect(result).not.toBeNull();
      expect(result).toBeInstanceOf(AspectObjectMapImpl);
      expect(result.readObj("prop1")).toBe("test-value");
      expect(result.readObj("prop2")).toBe(42);
    });

    it("should throw exception when entity not set", () => {
      expect(() => builder.aspectDef(aspectDef).build()).toThrow(/Entity must be set/);
    });

    it("should throw exception when aspectDef not set", () => {
      expect(() => builder.entity(entity).build()).toThrow(/AspectDef must be set/);
    });
  });

  describe("reset", () => {
    it("should clear all state", () => {
      builder.entity(entity).aspectDef(aspectDef).property("prop1", "test-value");

      const result = builder.reset();
      expect(result).toBe(builder);

      // Should throw exception since state is cleared
      expect(() => builder.build()).toThrow();
    });

    it("should allow reuse", () => {
      // Build first aspect
      const aspect1 = builder.entity(entity).aspectDef(aspectDef).property("prop1", "value1").build();

      // Reset and build second aspect
      const entity2 = new EntityImpl();
      const aspect2 = builder.reset().entity(entity2).aspectDef(aspectDef).property("prop1", "value2").build();

      expect(aspect1).not.toBe(aspect2);
      expect(aspect1.readObj("prop1")).toBe("value1");
      expect(aspect2.readObj("prop1")).toBe("value2");
      expect(aspect1.entity()).not.toBe(aspect2.entity());
    });
  });

  describe("fluent interface", () => {
    it("should chain methods", () => {
      const result = builder
        .entity(entity)
        .aspectDef(aspectDef)
        .property("prop1", "test-value")
        .property(property2)
        .build();

      expect(result).not.toBeNull();
      expect(result.readObj("prop1")).toBe("test-value");
      expect(result.readObj("prop2")).toBe(42);
    });
  });
});
