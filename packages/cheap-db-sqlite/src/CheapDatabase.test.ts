/**
 * Unit tests for CheapDatabase
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { CheapDatabase } from "./CheapDatabase.js";
import { randomUUID } from "crypto";

describe("CheapDatabase", () => {
  let db: CheapDatabase;

  beforeEach(() => {
    // Use in-memory database for tests
    db = new CheapDatabase(":memory:");
  });

  afterEach(() => {
    db.close();
  });

  describe("Catalog Operations", () => {
    it("should create a catalog", () => {
      const catalogId = db.createCatalog("SINK");
      expect(catalogId).toBeDefined();
      expect(typeof catalogId).toBe("string");
    });

    it("should get a catalog by ID", () => {
      const catalogId = db.createCatalog("SINK");
      const catalog = db.getCatalog(catalogId);

      expect(catalog).toBeDefined();
      expect(catalog.id).toBe(catalogId);
      expect(catalog.species).toBe("SINK");
    });

    it("should return null for non-existent catalog", () => {
      const catalog = db.getCatalog("non-existent-id");
      expect(catalog).toBeFalsy();
    });

    it("should list all catalogs", () => {
      const id1 = db.createCatalog("SINK");
      const id2 = db.createCatalog("SOURCE");

      const catalogs = db.listCatalogs();
      expect(catalogs).toHaveLength(2);
      expect(catalogs.map(c => c.id)).toContain(id1);
      expect(catalogs.map(c => c.id)).toContain(id2);
    });

    it("should delete a catalog", () => {
      const catalogId = db.createCatalog("SINK");
      const deleted = db.deleteCatalog(catalogId);

      expect(deleted).toBe(true);
      expect(db.getCatalog(catalogId)).toBeFalsy();
    });

    it("should return false when deleting non-existent catalog", () => {
      const deleted = db.deleteCatalog("non-existent-id");
      expect(deleted).toBe(false);
    });

    it("should create catalog with upstream", () => {
      const upstreamId = db.createCatalog("SOURCE");
      const catalogId = db.createCatalog("SINK", upstreamId);

      const catalog = db.getCatalog(catalogId);
      expect(catalog?.upstream).toBe(upstreamId);
    });
  });

  describe("AspectDef Operations", () => {
    let catalogId: string;

    beforeEach(() => {
      catalogId = db.createCatalog("SINK");
    });

    it("should create an AspectDef with properties", () => {
      const aspectDefId = randomUUID();
      const propertyDefs = [
        { name: "name", typeCode: "STRING" },
        { name: "age", typeCode: "INT" },
      ];

      db.createAspectDef(catalogId, aspectDefId, "Person", propertyDefs);

      const aspectDef = db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.name).toBe("Person");
      expect(aspectDef.propertyDefs).toHaveLength(2);
    });

    it("should get AspectDef by name", () => {
      const aspectDefId = randomUUID();
      const propertyDefs = [{ name: "title", typeCode: "STRING" }];

      db.createAspectDef(catalogId, aspectDefId, "Book", propertyDefs);

      const aspectDef = db.getAspectDefByName(catalogId, "Book");
      expect(aspectDef).toBeDefined();
      expect(aspectDef.id).toBe(aspectDefId);
      expect(aspectDef.name).toBe("Book");
    });

    it("should return null for non-existent AspectDef", () => {
      const aspectDef = db.getAspectDef(catalogId, "non-existent-id");
      expect(aspectDef).toBeNull();
    });

    it("should list AspectDefs with pagination", () => {
      // Create multiple AspectDefs
      for (let i = 0; i < 5; i++) {
        db.createAspectDef(
          catalogId,
          randomUUID(),
          `AspectDef${i}`,
          [{ name: "prop", typeCode: "STRING" }]
        );
      }

      const page1 = db.listAspectDefs(catalogId, 2, 0);
      expect(page1).toHaveLength(2);

      const page2 = db.listAspectDefs(catalogId, 2, 2);
      expect(page2).toHaveLength(2);

      const page3 = db.listAspectDefs(catalogId, 2, 4);
      expect(page3).toHaveLength(1);
    });

    it("should create AspectDef with property defaults", () => {
      const aspectDefId = randomUUID();
      const propertyDefs = [
        {
          name: "status",
          typeCode: "STRING",
          defaultValue: "active",
          hasDefaultValue: true,
          nullable: false,
          writable: true,
        },
      ];

      db.createAspectDef(catalogId, aspectDefId, "User", propertyDefs);

      const aspectDef = db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef.propertyDefs[0].default_value).toBe('"active"');
      expect(aspectDef.propertyDefs[0].has_default_value).toBe(1);
    });
  });

  describe("Aspect Operations", () => {
    let catalogId: string;
    let aspectDefId: string;

    beforeEach(() => {
      catalogId = db.createCatalog("SINK");
      aspectDefId = randomUUID();
      db.createAspectDef(catalogId, aspectDefId, "Person", [
        { name: "name", typeCode: "STRING" },
        { name: "age", typeCode: "INT" },
      ]);
    });

    it("should upsert a new aspect", () => {
      const entityId = randomUUID();
      const properties = { name: "John Doe", age: 30 };

      const result = db.upsertAspect(catalogId, entityId, aspectDefId, properties);

      expect(result.aspectId).toBeDefined();
      expect(result.created).toBe(true);
    });

    it("should update an existing aspect", () => {
      const entityId = randomUUID();
      const properties1 = { name: "John Doe", age: 30 };

      const result1 = db.upsertAspect(catalogId, entityId, aspectDefId, properties1);
      expect(result1.created).toBe(true);

      const properties2 = { name: "John Doe", age: 31 };
      const result2 = db.upsertAspect(catalogId, entityId, aspectDefId, properties2);

      expect(result2.created).toBe(false);
      expect(result2.aspectId).toBe(result1.aspectId);
    });

    it("should query aspects by aspectDefId", () => {
      const entityId1 = randomUUID();
      const entityId2 = randomUUID();

      db.upsertAspect(catalogId, entityId1, aspectDefId, { name: "Alice", age: 25 });
      db.upsertAspect(catalogId, entityId2, aspectDefId, { name: "Bob", age: 35 });

      const aspects = db.queryAspects(catalogId, aspectDefId);

      expect(aspects).toHaveLength(2);
      expect(aspects.map(a => a.entity_id)).toContain(entityId1);
      expect(aspects.map(a => a.entity_id)).toContain(entityId2);
    });

    it("should query aspects filtered by entity IDs", () => {
      const entityId1 = randomUUID();
      const entityId2 = randomUUID();
      const entityId3 = randomUUID();

      db.upsertAspect(catalogId, entityId1, aspectDefId, { name: "Alice", age: 25 });
      db.upsertAspect(catalogId, entityId2, aspectDefId, { name: "Bob", age: 35 });
      db.upsertAspect(catalogId, entityId3, aspectDefId, { name: "Charlie", age: 45 });

      const aspects = db.queryAspects(catalogId, aspectDefId, [entityId1, entityId3]);

      expect(aspects).toHaveLength(2);
      expect(aspects.map(a => a.entity_id)).toContain(entityId1);
      expect(aspects.map(a => a.entity_id)).toContain(entityId3);
      expect(aspects.map(a => a.entity_id)).not.toContain(entityId2);
    });

    it("should include properties in queried aspects", () => {
      const entityId = randomUUID();
      const properties = { name: "John Doe", age: 30 };

      db.upsertAspect(catalogId, entityId, aspectDefId, properties);

      const aspects = db.queryAspects(catalogId, aspectDefId, [entityId]);

      expect(aspects).toHaveLength(1);
      expect(aspects[0].properties).toEqual(properties);
    });
  });

  describe("Hierarchy Operations", () => {
    let catalogId: string;

    beforeEach(() => {
      catalogId = db.createCatalog("SINK");
    });

    it("should create an entity list hierarchy", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myList", "ENTITY_LIST");
      expect(hierarchyId).toBeDefined();

      const hierarchy = db.getHierarchy(catalogId, "myList");
      expect(hierarchy).toBeDefined();
      expect(hierarchy.name).toBe("myList");
      expect(hierarchy.type).toBe("ENTITY_LIST");
    });

    it("should create an entity set hierarchy", () => {
      const hierarchyId = db.createHierarchy(catalogId, "mySet", "ENTITY_SET");
      const hierarchy = db.getHierarchy(catalogId, "mySet");
      expect(hierarchy.type).toBe("ENTITY_SET");
    });

    it("should create an entity directory hierarchy", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const hierarchy = db.getHierarchy(catalogId, "myDir");
      expect(hierarchy.type).toBe("ENTITY_DIR");
    });

    it("should add entities to hierarchy", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myList", "ENTITY_LIST");
      const entityIds = [randomUUID(), randomUUID()];

      db.addEntityToHierarchy(hierarchyId, entityIds[0]);
      db.addEntityToHierarchy(hierarchyId, entityIds[1]);

      const entities = db.getHierarchyEntities(hierarchyId);
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entityIds[0]);
      expect(entities).toContain(entityIds[1]);
    });

    it("should remove entities from hierarchy", () => {
      const hierarchyId = db.createHierarchy(catalogId, "mySet", "ENTITY_SET");
      const entityId = randomUUID();

      db.addEntityToHierarchy(hierarchyId, entityId);
      const removed = db.removeEntityFromHierarchy(hierarchyId, entityId);

      expect(removed).toBe(1);
      const entities = db.getHierarchyEntities(hierarchyId);
      expect(entities).toHaveLength(0);
    });

    it("should add directory entries", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entries = [
        { name: "entry1", entityId: randomUUID() },
        { name: "entry2", entityId: randomUUID() },
      ];

      db.addDirectoryEntry(hierarchyId, entries[0].name, entries[0].entityId);
      db.addDirectoryEntry(hierarchyId, entries[1].name, entries[1].entityId);

      const dirEntries = db.getDirectoryEntries(hierarchyId);
      expect(dirEntries["entry1"]).toBe(entries[0].entityId);
      expect(dirEntries["entry2"]).toBe(entries[1].entityId);
    });

    it("should remove directory entries by name", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entry = { name: "entry1", entityId: randomUUID() };

      db.addDirectoryEntry(hierarchyId, entry.name, entry.entityId);
      const removed = db.removeDirectoryEntryByName(hierarchyId, entry.name);

      expect(removed).toBe(1);
      const dirEntries = db.getDirectoryEntries(hierarchyId);
      expect(dirEntries["entry1"]).toBeUndefined();
    });

    it("should remove directory entries by entity ID", () => {
      const hierarchyId = db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entry = { name: "entry1", entityId: randomUUID() };

      db.addDirectoryEntry(hierarchyId, entry.name, entry.entityId);
      const removed = db.removeDirectoryEntryByEntityId(hierarchyId, entry.entityId);

      expect(removed).toBe(1);
      const dirEntries = db.getDirectoryEntries(hierarchyId);
      expect(Object.keys(dirEntries)).toHaveLength(0);
    });
  });

  describe("Transaction Handling", () => {
    let catalogId: string;
    let aspectDefId: string;

    beforeEach(() => {
      catalogId = db.createCatalog("SINK");
      aspectDefId = randomUUID();
      db.createAspectDef(catalogId, aspectDefId, "Person", [
        { name: "name", typeCode: "STRING" },
      ]);
    });

    it("should handle aspect upsert with multiple properties atomically", () => {
      const entityId = randomUUID();
      const properties = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
      };

      const result = db.upsertAspect(catalogId, entityId, aspectDefId, properties);
      expect(result.created).toBe(true);

      // All properties should be inserted in a single transaction
      const aspects = db.queryAspects(catalogId, aspectDefId, [entityId]);
      expect(aspects).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty property list for AspectDef", () => {
      const catalogId = db.createCatalog("SINK");
      const aspectDefId = randomUUID();

      db.createAspectDef(catalogId, aspectDefId, "Empty", []);

      const aspectDef = db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.propertyDefs).toHaveLength(0);
    });

    it("should handle aspect with no properties", () => {
      const catalogId = db.createCatalog("SINK");
      const aspectDefId = randomUUID();
      db.createAspectDef(catalogId, aspectDefId, "Empty", []);

      const entityId = randomUUID();
      const result = db.upsertAspect(catalogId, entityId, aspectDefId, {});

      expect(result.created).toBe(true);
    });

    it("should handle special characters in names", () => {
      const catalogId = db.createCatalog("SINK");
      const aspectDefId = randomUUID();
      const name = "Person's \"Special\" Aspect";

      db.createAspectDef(catalogId, aspectDefId, name, [
        { name: "field", typeCode: "STRING" },
      ]);

      const aspectDef = db.getAspectDefByName(catalogId, name);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.name).toBe(name);
    });
  });
});
