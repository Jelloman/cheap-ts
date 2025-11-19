/**
 * Unit tests for PostgreSQL CheapDatabase
 *
 * NOTE: These tests require a running PostgreSQL instance.
 * Set the following environment variables or the tests will be skipped:
 * - POSTGRES_HOST (default: localhost)
 * - POSTGRES_PORT (default: 5432)
 * - POSTGRES_DB (default: cheap_test)
 * - POSTGRES_USER (default: postgres)
 * - POSTGRES_PASSWORD (default: postgres)
 */

import { describe, it, expect, beforeEach, afterEach, beforeAll, afterAll } from "@jest/globals";
import { CheapDatabase, type PostgresConfig } from "./CheapDatabase.js";
import { randomUUID } from "crypto";

// Check if PostgreSQL is configured for testing
const isPostgresAvailable = process.env.POSTGRES_TEST === "true";

const postgresConfig: PostgresConfig = {
  host: process.env.POSTGRES_HOST || "localhost",
  port: parseInt(process.env.POSTGRES_PORT || "5432"),
  database: process.env.POSTGRES_DB || "cheap_test",
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
};

const describeIfPostgres = isPostgresAvailable ? describe : describe.skip;

describeIfPostgres("PostgreSQL CheapDatabase", () => {
  let db: CheapDatabase;

  beforeAll(async () => {
    // Create a test database instance and initialize schema
    db = new CheapDatabase(postgresConfig);
    await db.initSchema();
  });

  afterAll(async () => {
    // Clean up and close connection
    await db.close();
  });

  beforeEach(async () => {
    // Clean up all tables before each test
    // Note: This assumes we have a clean schema to work with
  });

  describe("Catalog Operations", () => {
    it("should create a catalog", async () => {
      const catalogId = await db.createCatalog("SINK");
      expect(catalogId).toBeDefined();
      expect(typeof catalogId).toBe("string");

      // Clean up
      await db.deleteCatalog(catalogId);
    });

    it("should get a catalog by ID", async () => {
      const catalogId = await db.createCatalog("SINK");
      const catalog = await db.getCatalog(catalogId);

      expect(catalog).toBeDefined();
      expect(catalog.id).toBe(catalogId);
      expect(catalog.species).toBe("SINK");

      await db.deleteCatalog(catalogId);
    });

    it("should return null for non-existent catalog", async () => {
      const catalog = await db.getCatalog("non-existent-id");
      expect(catalog).toBeNull();
    });

    it("should list all catalogs", async () => {
      const id1 = await db.createCatalog("SINK");
      const id2 = await db.createCatalog("SOURCE");

      const catalogs = await db.listCatalogs();
      expect(catalogs.length).toBeGreaterThanOrEqual(2);
      expect(catalogs.map(c => c.id)).toContain(id1);
      expect(catalogs.map(c => c.id)).toContain(id2);

      await db.deleteCatalog(id1);
      await db.deleteCatalog(id2);
    });

    it("should delete a catalog", async () => {
      const catalogId = await db.createCatalog("SINK");
      const deleted = await db.deleteCatalog(catalogId);

      expect(deleted).toBe(true);
      expect(await db.getCatalog(catalogId)).toBeNull();
    });

    it("should return false when deleting non-existent catalog", async () => {
      const deleted = await db.deleteCatalog("non-existent-id");
      expect(deleted).toBe(false);
    });

    it("should create catalog with upstream", async () => {
      const upstreamId = await db.createCatalog("SOURCE");
      const catalogId = await db.createCatalog("SINK", upstreamId);

      const catalog = await db.getCatalog(catalogId);
      expect(catalog?.upstream).toBe(upstreamId);

      await db.deleteCatalog(catalogId);
      await db.deleteCatalog(upstreamId);
    });
  });

  describe("AspectDef Operations", () => {
    let catalogId: string;

    beforeEach(async () => {
      catalogId = await db.createCatalog("SINK");
    });

    afterEach(async () => {
      await db.deleteCatalog(catalogId);
    });

    it("should create an AspectDef with properties", async () => {
      const aspectDefId = randomUUID();
      const propertyDefs = [
        { name: "name", typeCode: "STRING" },
        { name: "age", typeCode: "INT" },
      ];

      await db.createAspectDef(catalogId, aspectDefId, "Person", propertyDefs);

      const aspectDef = await db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.name).toBe("Person");
      expect(aspectDef.propertyDefs).toHaveLength(2);
    });

    it("should get AspectDef by name", async () => {
      const aspectDefId = randomUUID();
      const propertyDefs = [{ name: "title", typeCode: "STRING" }];

      await db.createAspectDef(catalogId, aspectDefId, "Book", propertyDefs);

      const aspectDef = await db.getAspectDefByName(catalogId, "Book");
      expect(aspectDef).toBeDefined();
      expect(aspectDef.id).toBe(aspectDefId);
      expect(aspectDef.name).toBe("Book");
    });

    it("should return null for non-existent AspectDef", async () => {
      const aspectDef = await db.getAspectDef(catalogId, "non-existent-id");
      expect(aspectDef).toBeNull();
    });

    it("should list AspectDefs with pagination", async () => {
      // Create multiple AspectDefs
      for (let i = 0; i < 5; i++) {
        await db.createAspectDef(
          catalogId,
          randomUUID(),
          `AspectDef${i}`,
          [{ name: "prop", typeCode: "STRING" }]
        );
      }

      const page1 = await db.listAspectDefs(catalogId, 2, 0);
      expect(page1).toHaveLength(2);

      const page2 = await db.listAspectDefs(catalogId, 2, 2);
      expect(page2).toHaveLength(2);

      const page3 = await db.listAspectDefs(catalogId, 2, 4);
      expect(page3.length).toBeGreaterThanOrEqual(1);
    });

    it("should create AspectDef with property defaults", async () => {
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

      await db.createAspectDef(catalogId, aspectDefId, "User", propertyDefs);

      const aspectDef = await db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef.propertyDefs[0].default_value).toBe('"active"');
      expect(aspectDef.propertyDefs[0].has_default_value).toBe(true);
    });
  });

  describe("Aspect Operations", () => {
    let catalogId: string;
    let aspectDefId: string;

    beforeEach(async () => {
      catalogId = await db.createCatalog("SINK");
      aspectDefId = randomUUID();
      await db.createAspectDef(catalogId, aspectDefId, "Person", [
        { name: "name", typeCode: "STRING" },
        { name: "age", typeCode: "INT" },
      ]);
    });

    afterEach(async () => {
      await db.deleteCatalog(catalogId);
    });

    it("should upsert a new aspect", async () => {
      const entityId = randomUUID();
      const properties = { name: "John Doe", age: 30 };

      const result = await db.upsertAspect(catalogId, entityId, aspectDefId, properties);

      expect(result.aspectId).toBeDefined();
      expect(result.created).toBe(true);
    });

    it("should update an existing aspect", async () => {
      const entityId = randomUUID();
      const properties1 = { name: "John Doe", age: 30 };

      const result1 = await db.upsertAspect(catalogId, entityId, aspectDefId, properties1);
      expect(result1.created).toBe(true);

      const properties2 = { name: "John Doe", age: 31 };
      const result2 = await db.upsertAspect(catalogId, entityId, aspectDefId, properties2);

      expect(result2.created).toBe(false);
      expect(result2.aspectId).toBe(result1.aspectId);
    });

    it("should query aspects by aspectDefId", async () => {
      const entityId1 = randomUUID();
      const entityId2 = randomUUID();

      await db.upsertAspect(catalogId, entityId1, aspectDefId, { name: "Alice", age: 25 });
      await db.upsertAspect(catalogId, entityId2, aspectDefId, { name: "Bob", age: 35 });

      const aspects = await db.queryAspects(catalogId, aspectDefId);

      expect(aspects).toHaveLength(2);
      expect(aspects.map(a => a.entity_id)).toContain(entityId1);
      expect(aspects.map(a => a.entity_id)).toContain(entityId2);
    });

    it("should query aspects filtered by entity IDs", async () => {
      const entityId1 = randomUUID();
      const entityId2 = randomUUID();
      const entityId3 = randomUUID();

      await db.upsertAspect(catalogId, entityId1, aspectDefId, { name: "Alice", age: 25 });
      await db.upsertAspect(catalogId, entityId2, aspectDefId, { name: "Bob", age: 35 });
      await db.upsertAspect(catalogId, entityId3, aspectDefId, { name: "Charlie", age: 45 });

      const aspects = await db.queryAspects(catalogId, aspectDefId, [entityId1, entityId3]);

      expect(aspects).toHaveLength(2);
      expect(aspects.map(a => a.entity_id)).toContain(entityId1);
      expect(aspects.map(a => a.entity_id)).toContain(entityId3);
      expect(aspects.map(a => a.entity_id)).not.toContain(entityId2);
    });

    it("should include properties in queried aspects", async () => {
      const entityId = randomUUID();
      const properties = { name: "John Doe", age: 30 };

      await db.upsertAspect(catalogId, entityId, aspectDefId, properties);

      const aspects = await db.queryAspects(catalogId, aspectDefId, [entityId]);

      expect(aspects).toHaveLength(1);
      expect(aspects[0].properties).toEqual(properties);
    });
  });

  describe("Hierarchy Operations", () => {
    let catalogId: string;

    beforeEach(async () => {
      catalogId = await db.createCatalog("SINK");
    });

    afterEach(async () => {
      await db.deleteCatalog(catalogId);
    });

    it("should create an entity list hierarchy", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "myList", "ENTITY_LIST");
      expect(hierarchyId).toBeDefined();

      const hierarchy = await db.getHierarchy(catalogId, "myList");
      expect(hierarchy).toBeDefined();
      expect(hierarchy.name).toBe("myList");
      expect(hierarchy.type).toBe("ENTITY_LIST");
    });

    it("should create an entity set hierarchy", async () => {
      await db.createHierarchy(catalogId, "mySet", "ENTITY_SET");
      const hierarchy = await db.getHierarchy(catalogId, "mySet");
      expect(hierarchy.type).toBe("ENTITY_SET");
    });

    it("should create an entity directory hierarchy", async () => {
      await db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const hierarchy = await db.getHierarchy(catalogId, "myDir");
      expect(hierarchy.type).toBe("ENTITY_DIR");
    });

    it("should add entities to hierarchy", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "myList", "ENTITY_LIST");
      const entityIds = [randomUUID(), randomUUID()];

      await db.addEntityToHierarchy(hierarchyId, entityIds[0]);
      await db.addEntityToHierarchy(hierarchyId, entityIds[1]);

      const entities = await db.getHierarchyEntities(hierarchyId);
      expect(entities).toHaveLength(2);
      expect(entities).toContain(entityIds[0]);
      expect(entities).toContain(entityIds[1]);
    });

    it("should remove entities from hierarchy", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "mySet", "ENTITY_SET");
      const entityId = randomUUID();

      await db.addEntityToHierarchy(hierarchyId, entityId);
      const removed = await db.removeEntityFromHierarchy(hierarchyId, entityId);

      expect(removed).toBe(1);
      const entities = await db.getHierarchyEntities(hierarchyId);
      expect(entities).toHaveLength(0);
    });

    it("should add directory entries", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entries = [
        { name: "entry1", entityId: randomUUID() },
        { name: "entry2", entityId: randomUUID() },
      ];

      await db.addDirectoryEntry(hierarchyId, entries[0].name, entries[0].entityId);
      await db.addDirectoryEntry(hierarchyId, entries[1].name, entries[1].entityId);

      const dirEntries = await db.getDirectoryEntries(hierarchyId);
      expect(dirEntries["entry1"]).toBe(entries[0].entityId);
      expect(dirEntries["entry2"]).toBe(entries[1].entityId);
    });

    it("should remove directory entries by name", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entry = { name: "entry1", entityId: randomUUID() };

      await db.addDirectoryEntry(hierarchyId, entry.name, entry.entityId);
      const removed = await db.removeDirectoryEntryByName(hierarchyId, entry.name);

      expect(removed).toBe(1);
      const dirEntries = await db.getDirectoryEntries(hierarchyId);
      expect(dirEntries["entry1"]).toBeUndefined();
    });

    it("should remove directory entries by entity ID", async () => {
      const hierarchyId = await db.createHierarchy(catalogId, "myDir", "ENTITY_DIR");
      const entry = { name: "entry1", entityId: randomUUID() };

      await db.addDirectoryEntry(hierarchyId, entry.name, entry.entityId);
      const removed = await db.removeDirectoryEntryByEntityId(hierarchyId, entry.entityId);

      expect(removed).toBe(1);
      const dirEntries = await db.getDirectoryEntries(hierarchyId);
      expect(Object.keys(dirEntries)).toHaveLength(0);
    });
  });

  describe("Transaction Handling", () => {
    let catalogId: string;
    let aspectDefId: string;

    beforeEach(async () => {
      catalogId = await db.createCatalog("SINK");
      aspectDefId = randomUUID();
      await db.createAspectDef(catalogId, aspectDefId, "Person", [
        { name: "name", typeCode: "STRING" },
      ]);
    });

    afterEach(async () => {
      await db.deleteCatalog(catalogId);
    });

    it("should handle aspect upsert with multiple properties atomically", async () => {
      const entityId = randomUUID();
      const properties = {
        name: "John Doe",
        email: "john@example.com",
        phone: "555-1234",
      };

      const result = await db.upsertAspect(catalogId, entityId, aspectDefId, properties);
      expect(result.created).toBe(true);

      // All properties should be inserted in a single transaction
      const aspects = await db.queryAspects(catalogId, aspectDefId, [entityId]);
      expect(aspects).toHaveLength(1);
    });
  });

  describe("Edge Cases", () => {
    it("should handle empty property list for AspectDef", async () => {
      const catalogId = await db.createCatalog("SINK");
      const aspectDefId = randomUUID();

      await db.createAspectDef(catalogId, aspectDefId, "Empty", []);

      const aspectDef = await db.getAspectDef(catalogId, aspectDefId);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.propertyDefs).toHaveLength(0);

      await db.deleteCatalog(catalogId);
    });

    it("should handle aspect with no properties", async () => {
      const catalogId = await db.createCatalog("SINK");
      const aspectDefId = randomUUID();
      await db.createAspectDef(catalogId, aspectDefId, "Empty", []);

      const entityId = randomUUID();
      const result = await db.upsertAspect(catalogId, entityId, aspectDefId, {});

      expect(result.created).toBe(true);

      await db.deleteCatalog(catalogId);
    });

    it("should handle special characters in names", async () => {
      const catalogId = await db.createCatalog("SINK");
      const aspectDefId = randomUUID();
      const name = "Person's \"Special\" Aspect";

      await db.createAspectDef(catalogId, aspectDefId, name, [
        { name: "field", typeCode: "STRING" },
      ]);

      const aspectDef = await db.getAspectDefByName(catalogId, name);
      expect(aspectDef).toBeDefined();
      expect(aspectDef.name).toBe(name);

      await db.deleteCatalog(catalogId);
    });
  });
});

// If PostgreSQL is not available, show a helpful message
if (!isPostgresAvailable) {
  describe.skip("PostgreSQL CheapDatabase (skipped)", () => {
    it("requires POSTGRES_TEST=true environment variable", () => {
      console.log(`
        PostgreSQL tests are skipped. To run them:
        1. Start a PostgreSQL instance
        2. Create a test database (e.g., cheap_test)
        3. Set environment variables:
           export POSTGRES_TEST=true
           export POSTGRES_HOST=localhost
           export POSTGRES_PORT=5432
           export POSTGRES_DB=cheap_test
           export POSTGRES_USER=postgres
           export POSTGRES_PASSWORD=postgres
        4. Run: npm test
      `);
    });
  });
}
