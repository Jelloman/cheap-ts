/**
 * Integration tests for AspectDef operations
 * Tests aspect definition CRUD operations through the REST API
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import {
  createCatalogDef,
  createPersonAspectDef,
  createAddressAspectDef,
  createProductAspectDef,
} from "../../fixtures/test-data.js";

describe("AspectDef Operations", () => {
  let catalogId: string;

  beforeAll(async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef();
    const response = await server.client.createCatalog(catalogDef);
    catalogId = response.catalogId;
  });

  afterAll(async () => {
    const server = getTestServer();
    try {
      await server.client.deleteCatalog(catalogId);
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should create an AspectDef", async () => {
    const server = getTestServer();
    const aspectDef = createPersonAspectDef();

    const response = await server.client.createAspectDef(catalogId, aspectDef);

    expect(response.aspectDefId).toBeDefined();
    expect(typeof response.aspectDefId).toBe("string");
  });

  it("should retrieve AspectDef by ID", async () => {
    const server = getTestServer();
    const aspectDef = createAddressAspectDef();

    const createResponse = await server.client.createAspectDef(catalogId, aspectDef);

    const retrieved = await server.client.getAspectDef(catalogId, createResponse.aspectDefId);

    expect(retrieved.id).toBe(createResponse.aspectDefId);
    expect(retrieved.name).toBe("Address");
    expect(retrieved.propertyDefs).toHaveLength(4);
  });

  it("should retrieve AspectDef by name", async () => {
    const server = getTestServer();
    const aspectDef = createProductAspectDef();

    await server.client.createAspectDef(catalogId, aspectDef);

    const retrieved = await server.client.getAspectDefByName(catalogId, "Product");

    expect(retrieved.name).toBe("Product");
    expect(retrieved.propertyDefs).toHaveLength(4);
    expect(retrieved.propertyDefs.map((p) => p.name)).toContain("name");
    expect(retrieved.propertyDefs.map((p) => p.name)).toContain("price");
  });

  it("should list AspectDefs", async () => {
    const server = getTestServer();

    // Create multiple AspectDefs
    const aspectDef1 = { name: "TestAspect1", propertyDefs: [{ name: "field1", typeCode: "STRING" }] };
    const aspectDef2 = { name: "TestAspect2", propertyDefs: [{ name: "field2", typeCode: "INT" }] };

    const response1 = await server.client.createAspectDef(catalogId, aspectDef1);
    const response2 = await server.client.createAspectDef(catalogId, aspectDef2);

    const aspectDefs = await server.client.listAspectDefs(catalogId);

    expect(aspectDefs.length).toBeGreaterThanOrEqual(2);
    const aspectDefIds = aspectDefs.map((a) => a.id);
    expect(aspectDefIds).toContain(response1.aspectDefId);
    expect(aspectDefIds).toContain(response2.aspectDefId);
  });

  it("should handle pagination for AspectDef listing", async () => {
    const server = getTestServer();

    // Create 5 AspectDefs
    for (let i = 0; i < 5; i++) {
      const aspectDef = {
        name: `PaginationTest${i}`,
        propertyDefs: [{ name: "field", typeCode: "STRING" }],
      };
      await server.client.createAspectDef(catalogId, aspectDef);
    }

    // Get first page
    const page1 = await server.client.listAspectDefs(catalogId, { limit: 3, offset: 0 });
    expect(page1.length).toBeLessThanOrEqual(3);

    // Get second page
    const page2 = await server.client.listAspectDefs(catalogId, { limit: 3, offset: 3 });
    expect(page2.length).toBeGreaterThan(0);
  });

  it("should create AspectDef with property defaults", async () => {
    const server = getTestServer();
    const aspectDef = {
      name: "WithDefaults",
      propertyDefs: [
        {
          name: "status",
          typeCode: "STRING",
          defaultValue: "active",
          hasDefaultValue: true,
          nullable: false,
          writable: true,
        },
        {
          name: "count",
          typeCode: "INT",
          defaultValue: "0",
          hasDefaultValue: true,
          nullable: false,
          writable: true,
        },
      ],
    };

    const createResponse = await server.client.createAspectDef(catalogId, aspectDef);

    const retrieved = await server.client.getAspectDef(catalogId, createResponse.aspectDefId);

    expect(retrieved.propertyDefs[0].defaultValue).toBeDefined();
    expect(retrieved.propertyDefs[0].hasDefaultValue).toBe(true);
    expect(retrieved.propertyDefs[1].defaultValue).toBeDefined();
  });

  it("should throw error for non-existent AspectDef", async () => {
    const server = getTestServer();
    const nonExistentId = "00000000-0000-0000-0000-000000000000";

    await expect(server.client.getAspectDef(catalogId, nonExistentId)).rejects.toThrow();
  });

  it("should throw error for non-existent AspectDef name", async () => {
    const server = getTestServer();

    await expect(
      server.client.getAspectDefByName(catalogId, "NonExistentAspectDef")
    ).rejects.toThrow();
  });
});
