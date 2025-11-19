/**
 * Integration tests for Catalog operations
 * Tests catalog CRUD operations through the REST API
 */
import { describe, it, expect, afterEach } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import { createCatalogDef } from "../../fixtures/test-data.js";

describe("Catalog Operations", () => {
  const createdCatalogIds: string[] = [];

  afterEach(async () => {
    // Clean up created catalogs
    const server = getTestServer();
    for (const id of createdCatalogIds) {
      try {
        await server.client.deleteCatalog(id);
      } catch {
        // Ignore errors during cleanup
      }
    }
    createdCatalogIds.length = 0;
  });

  it("should create a catalog", async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef();

    const response = await server.client.createCatalog(catalogDef);

    expect(response.catalogId).toBeDefined();
    expect(typeof response.catalogId).toBe("string");
    createdCatalogIds.push(response.catalogId);
  });

  it("should retrieve a catalog by ID", async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef();

    const createResponse = await server.client.createCatalog(catalogDef);
    createdCatalogIds.push(createResponse.catalogId);

    const catalog = await server.client.getCatalog(createResponse.catalogId);

    expect(catalog.id).toBe(createResponse.catalogId);
    expect(catalog.species).toBe("SINK");
  });

  it("should list catalogs", async () => {
    const server = getTestServer();

    // Create multiple catalogs
    const catalogDef1 = createCatalogDef();
    const catalogDef2 = createCatalogDef();

    const response1 = await server.client.createCatalog(catalogDef1);
    const response2 = await server.client.createCatalog(catalogDef2);

    createdCatalogIds.push(response1.catalogId, response2.catalogId);

    const catalogs = await server.client.listCatalogs();

    expect(catalogs.length).toBeGreaterThanOrEqual(2);
    const catalogIds = catalogs.map((c) => c.id);
    expect(catalogIds).toContain(response1.catalogId);
    expect(catalogIds).toContain(response2.catalogId);
  });

  it("should get catalog definition", async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef([
      { name: "myList", type: "ENTITY_LIST" },
      { name: "mySet", type: "ENTITY_SET" },
    ]);

    const createResponse = await server.client.createCatalog(catalogDef);
    createdCatalogIds.push(createResponse.catalogId);

    const definition = await server.client.getCatalogDefinition(createResponse.catalogId);

    expect(definition.species).toBe("SINK");
    expect(definition.hierarchyDefs).toHaveLength(2);
    expect(definition.hierarchyDefs.map((h) => h.name)).toContain("myList");
    expect(definition.hierarchyDefs.map((h) => h.name)).toContain("mySet");
  });

  it("should create catalog with upstream reference", async () => {
    const server = getTestServer();

    // Create upstream catalog
    const upstreamDef = createCatalogDef();
    const upstreamResponse = await server.client.createCatalog(upstreamDef);
    createdCatalogIds.push(upstreamResponse.catalogId);

    // Create downstream catalog with upstream reference
    const downstreamDef = {
      ...createCatalogDef(),
      upstream: upstreamResponse.catalogId,
    };
    const downstreamResponse = await server.client.createCatalog(downstreamDef);
    createdCatalogIds.push(downstreamResponse.catalogId);

    const catalog = await server.client.getCatalog(downstreamResponse.catalogId);
    expect(catalog.upstream).toBe(upstreamResponse.catalogId);
  });

  it("should delete a catalog", async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef();

    const createResponse = await server.client.createCatalog(catalogDef);
    const catalogId = createResponse.catalogId;

    // Verify catalog exists
    const catalog = await server.client.getCatalog(catalogId);
    expect(catalog.id).toBe(catalogId);

    // Delete catalog
    await server.client.deleteCatalog(catalogId);

    // Verify catalog is deleted
    await expect(server.client.getCatalog(catalogId)).rejects.toThrow();
  });

  it("should handle pagination for catalog listing", async () => {
    const server = getTestServer();

    // Create 5 catalogs
    for (let i = 0; i < 5; i++) {
      const response = await server.client.createCatalog(createCatalogDef());
      createdCatalogIds.push(response.catalogId);
    }

    // Get first page
    const page1 = await server.client.listCatalogs({ limit: 2, offset: 0 });
    expect(page1.length).toBeLessThanOrEqual(2);

    // Get second page
    const page2 = await server.client.listCatalogs({ limit: 2, offset: 2 });
    expect(page2.length).toBeGreaterThan(0);

    // Verify no overlap
    const page1Ids = page1.map((c) => c.id);
    const page2Ids = page2.map((c) => c.id);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });
});
