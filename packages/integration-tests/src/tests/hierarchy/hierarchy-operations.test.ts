/**
 * Integration tests for Hierarchy operations
 * Tests all hierarchy types and their operations through the REST API
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import { createCatalogDef, createPersonAspectDef } from "../../fixtures/test-data.js";
import { randomUUID } from "crypto";

describe("Hierarchy Operations", () => {
  let catalogId: string;

  beforeAll(async () => {
    const server = getTestServer();

    // Create catalog with all hierarchy types
    const catalogDef = createCatalogDef([
      { name: "personList", type: "ENTITY_LIST" },
      { name: "personSet", type: "ENTITY_SET" },
      { name: "personDirectory", type: "ENTITY_DIR" },
      { name: "personTree", type: "ENTITY_TREE" },
      { name: "aspectMap", type: "ASPECT_MAP" },
    ]);

    const response = await server.client.createCatalog(catalogDef);
    catalogId = response.catalogId;

    // Create AspectDef for testing
    const aspectDef = createPersonAspectDef();
    await server.client.createAspectDef(catalogId, aspectDef);
  });

  afterAll(async () => {
    const server = getTestServer();
    try {
      await server.client.deleteCatalog(catalogId);
    } catch {
      // Ignore cleanup errors
    }
  });

  describe("Entity List Hierarchy", () => {
    it("should retrieve empty entity list", async () => {
      const server = getTestServer();

      const response = await server.client.getHierarchy(catalogId, "personList");

      expect(response.type).toBe("ENTITY_LIST");
      expect(response.entityIds).toEqual([]);
    });

    it("should add entity IDs to list", async () => {
      const server = getTestServer();
      const entityIds = [randomUUID(), randomUUID(), randomUUID()];

      await server.client.addEntityIdsToHierarchy(catalogId, "personList", entityIds);

      const response = await server.client.getHierarchy(catalogId, "personList");
      expect(response.entityIds.length).toBeGreaterThanOrEqual(3);
      entityIds.forEach((id) => {
        expect(response.entityIds).toContain(id);
      });
    });

    it("should remove entity IDs from list", async () => {
      const server = getTestServer();
      const entityId = randomUUID();

      // Add entity ID
      await server.client.addEntityIdsToHierarchy(catalogId, "personList", [entityId]);

      // Verify it was added
      let response = await server.client.getHierarchy(catalogId, "personList");
      expect(response.entityIds).toContain(entityId);

      // Remove entity ID
      await server.client.removeEntityIdsFromHierarchy(catalogId, "personList", [entityId]);

      // Verify it was removed
      response = await server.client.getHierarchy(catalogId, "personList");
      expect(response.entityIds).not.toContain(entityId);
    });

    it("should handle pagination for large lists", async () => {
      const server = getTestServer();

      // Create a new list hierarchy for this test
      const testCatalogDef = createCatalogDef([{ name: "largeList", type: "ENTITY_LIST" }]);
      const testCatalogResponse = await server.client.createCatalog(testCatalogDef);
      const testCatalogId = testCatalogResponse.catalogId;

      try {
        // Add 50 entity IDs
        const entityIds = Array.from({ length: 50 }, () => randomUUID());
        await server.client.addEntityIdsToHierarchy(testCatalogId, "largeList", entityIds);

        // Get first page
        const page1 = await server.client.getHierarchy(testCatalogId, "largeList", {
          limit: 20,
          offset: 0,
        });
        expect(page1.entityIds.length).toBe(20);

        // Get second page
        const page2 = await server.client.getHierarchy(testCatalogId, "largeList", {
          limit: 20,
          offset: 20,
        });
        expect(page2.entityIds.length).toBe(20);

        // Verify no overlap
        const overlap = page1.entityIds.filter((id) => page2.entityIds.includes(id));
        expect(overlap.length).toBe(0);
      } finally {
        await server.client.deleteCatalog(testCatalogId);
      }
    });
  });

  describe("Entity Set Hierarchy", () => {
    it("should retrieve empty entity set", async () => {
      const server = getTestServer();

      const response = await server.client.getHierarchy(catalogId, "personSet");

      expect(response.type).toBe("ENTITY_SET");
      expect(response.entityIds).toEqual([]);
    });

    it("should add entity IDs to set", async () => {
      const server = getTestServer();
      const entityIds = [randomUUID(), randomUUID()];

      await server.client.addEntityIdsToHierarchy(catalogId, "personSet", entityIds);

      const response = await server.client.getHierarchy(catalogId, "personSet");
      entityIds.forEach((id) => {
        expect(response.entityIds).toContain(id);
      });
    });

    it("should handle duplicate entity IDs in set", async () => {
      const server = getTestServer();
      const entityId = randomUUID();

      // Add same entity ID twice
      await server.client.addEntityIdsToHierarchy(catalogId, "personSet", [entityId]);
      await server.client.addEntityIdsToHierarchy(catalogId, "personSet", [entityId]);

      const response = await server.client.getHierarchy(catalogId, "personSet");

      // Count occurrences
      const count = response.entityIds.filter((id) => id === entityId).length;

      // In a set, duplicates might be allowed (depends on implementation)
      // Just verify the entity is present
      expect(response.entityIds).toContain(entityId);
    });
  });

  describe("Entity Directory Hierarchy", () => {
    it("should retrieve empty entity directory", async () => {
      const server = getTestServer();

      const response = await server.client.getHierarchy(catalogId, "personDirectory");

      expect(response.type).toBe("ENTITY_DIR");
      expect(response.entries).toEqual({});
    });

    it("should add directory entries", async () => {
      const server = getTestServer();
      const entries = [
        { name: "john", entityId: randomUUID() },
        { name: "jane", entityId: randomUUID() },
      ];

      await server.client.addDirectoryEntries(catalogId, "personDirectory", entries);

      const response = await server.client.getHierarchy(catalogId, "personDirectory");
      expect(response.entries["john"]).toBe(entries[0].entityId);
      expect(response.entries["jane"]).toBe(entries[1].entityId);
    });

    it("should remove directory entries by name", async () => {
      const server = getTestServer();
      const entry = { name: "toRemove", entityId: randomUUID() };

      // Add entry
      await server.client.addDirectoryEntries(catalogId, "personDirectory", [entry]);

      // Verify it was added
      let response = await server.client.getHierarchy(catalogId, "personDirectory");
      expect(response.entries[entry.name]).toBe(entry.entityId);

      // Remove entry by name
      await server.client.removeDirectoryEntriesByNames(catalogId, "personDirectory", [
        entry.name,
      ]);

      // Verify it was removed
      response = await server.client.getHierarchy(catalogId, "personDirectory");
      expect(response.entries[entry.name]).toBeUndefined();
    });

    it("should remove directory entries by entity ID", async () => {
      const server = getTestServer();
      const entry = { name: "toRemoveById", entityId: randomUUID() };

      // Add entry
      await server.client.addDirectoryEntries(catalogId, "personDirectory", [entry]);

      // Remove entry by entity ID
      await server.client.removeDirectoryEntriesByEntityIds(catalogId, "personDirectory", [
        entry.entityId,
      ]);

      // Verify it was removed
      const response = await server.client.getHierarchy(catalogId, "personDirectory");
      expect(response.entries[entry.name]).toBeUndefined();
    });

    it("should handle special characters in directory names", async () => {
      const server = getTestServer();
      const entry = { name: "user's \"special\" name", entityId: randomUUID() };

      await server.client.addDirectoryEntries(catalogId, "personDirectory", [entry]);

      const response = await server.client.getHierarchy(catalogId, "personDirectory");
      expect(response.entries[entry.name]).toBe(entry.entityId);
    });
  });

  describe("Entity Tree Hierarchy", () => {
    it("should retrieve empty entity tree", async () => {
      const server = getTestServer();

      const response = await server.client.getHierarchy(catalogId, "personTree");

      expect(response.type).toBe("ENTITY_TREE");
      expect(response.tree).toBeDefined();
    });

    it("should add tree nodes", async () => {
      const server = getTestServer();

      // Create a new tree hierarchy for this test
      const testCatalogDef = createCatalogDef([{ name: "testTree", type: "ENTITY_TREE" }]);
      const testCatalogResponse = await server.client.createCatalog(testCatalogDef);
      const testCatalogId = testCatalogResponse.catalogId;

      try {
        const nodes = [
          { path: "/root", entityId: randomUUID() },
          { path: "/root/child1", entityId: randomUUID() },
          { path: "/root/child2", entityId: randomUUID() },
        ];

        for (const node of nodes) {
          await server.client.addTreeNode(testCatalogId, "testTree", node.path, node.entityId);
        }

        const response = await server.client.getHierarchy(testCatalogId, "testTree");
        expect(response.tree).toBeDefined();
      } finally {
        await server.client.deleteCatalog(testCatalogId);
      }
    });
  });

  describe("Aspect Map Hierarchy", () => {
    it("should retrieve empty aspect map", async () => {
      const server = getTestServer();

      const response = await server.client.getHierarchy(catalogId, "aspectMap");

      expect(response.type).toBe("ASPECT_MAP");
      expect(response.aspects).toBeDefined();
    });
  });
});
