/**
 * Integration tests for Aspect operations
 * Tests aspect upsert and query operations through the REST API
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import {
  createCatalogDef,
  createPersonAspectDef,
  createPersonAspect,
  generatePersonAspects,
} from "../../fixtures/test-data.js";

describe("Aspect Operations", () => {
  let catalogId: string;
  let aspectDefId: string;

  beforeAll(async () => {
    const server = getTestServer();

    // Create catalog
    const catalogDef = createCatalogDef();
    const catalogResponse = await server.client.createCatalog(catalogDef);
    catalogId = catalogResponse.catalogId;

    // Create AspectDef
    const aspectDef = createPersonAspectDef();
    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    aspectDefId = aspectDefResponse.aspectDefId;
  });

  afterAll(async () => {
    const server = getTestServer();
    try {
      await server.client.deleteCatalog(catalogId);
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should upsert a new aspect", async () => {
    const server = getTestServer();
    const aspect = createPersonAspect("John", "Doe", 30, "john.doe@example.com");

    const response = await server.client.upsertAspect(catalogId, aspectDefId, aspect.properties);

    expect(response.entityId).toBeDefined();
    expect(response.created).toBe(true);
  });

  it("should update an existing aspect", async () => {
    const server = getTestServer();

    // Create initial aspect
    const aspect1 = createPersonAspect("Jane", "Smith", 25, "jane.smith@example.com");
    const response1 = await server.client.upsertAspect(catalogId, aspectDefId, aspect1.properties);

    // Update the same aspect (same entity)
    const aspect2 = createPersonAspect("Jane", "Smith", 26, "jane.smith@example.com");
    const response2 = await server.client.upsertAspect(
      catalogId,
      aspectDefId,
      aspect2.properties,
      response1.entityId
    );

    expect(response2.entityId).toBe(response1.entityId);
    expect(response2.created).toBe(false);
  });

  it("should query aspects by AspectDef", async () => {
    const server = getTestServer();

    // Create multiple aspects
    const aspect1 = createPersonAspect("Alice", "Johnson", 28, "alice@example.com");
    const aspect2 = createPersonAspect("Bob", "Williams", 35, "bob@example.com");

    await server.client.upsertAspect(catalogId, aspectDefId, aspect1.properties);
    await server.client.upsertAspect(catalogId, aspectDefId, aspect2.properties);

    const response = await server.client.queryAspects(catalogId, aspectDefId);

    expect(response.aspects.length).toBeGreaterThanOrEqual(2);
    expect(response.aspects.some((a) => a.properties.firstName === "Alice")).toBe(true);
    expect(response.aspects.some((a) => a.properties.firstName === "Bob")).toBe(true);
  });

  it("should query aspects with entity ID filter", async () => {
    const server = getTestServer();

    // Create aspects
    const aspect1 = createPersonAspect("Charlie", "Brown", 40, "charlie@example.com");
    const aspect2 = createPersonAspect("Diana", "Prince", 32, "diana@example.com");

    const response1 = await server.client.upsertAspect(catalogId, aspectDefId, aspect1.properties);
    const response2 = await server.client.upsertAspect(catalogId, aspectDefId, aspect2.properties);

    // Query with specific entity IDs
    const queryResponse = await server.client.queryAspects(catalogId, aspectDefId, {
      entityIds: [response1.entityId],
    });

    expect(queryResponse.aspects.length).toBe(1);
    expect(queryResponse.aspects[0].entityId).toBe(response1.entityId);
    expect(queryResponse.aspects[0].properties.firstName).toBe("Charlie");
  });

  it("should handle pagination for aspect queries", async () => {
    const server = getTestServer();

    // Create a new AspectDef for this test to avoid interference
    const testAspectDef = {
      name: "PaginationTest",
      propertyDefs: [
        { name: "value", typeCode: "INT" },
      ],
    };
    const aspectDefResponse = await server.client.createAspectDef(catalogId, testAspectDef);
    const testAspectDefId = aspectDefResponse.aspectDefId;

    // Create 10 aspects
    for (let i = 0; i < 10; i++) {
      await server.client.upsertAspect(catalogId, testAspectDefId, { value: i });
    }

    // Get first page
    const page1 = await server.client.queryAspects(catalogId, testAspectDefId, {
      limit: 5,
      offset: 0,
    });
    expect(page1.aspects.length).toBe(5);

    // Get second page
    const page2 = await server.client.queryAspects(catalogId, testAspectDefId, {
      limit: 5,
      offset: 5,
    });
    expect(page2.aspects.length).toBe(5);

    // Verify no overlap
    const page1Ids = page1.aspects.map((a) => a.entityId);
    const page2Ids = page2.aspects.map((a) => a.entityId);
    const overlap = page1Ids.filter((id) => page2Ids.includes(id));
    expect(overlap.length).toBe(0);
  });

  it("should handle bulk aspect creation", async () => {
    const server = getTestServer();

    // Create a new AspectDef for bulk testing
    const bulkAspectDef = {
      name: "BulkTest",
      propertyDefs: [
        { name: "index", typeCode: "INT" },
        { name: "data", typeCode: "STRING" },
      ],
    };
    const aspectDefResponse = await server.client.createAspectDef(catalogId, bulkAspectDef);
    const bulkAspectDefId = aspectDefResponse.aspectDefId;

    // Create 100 aspects
    const startTime = Date.now();
    for (let i = 0; i < 100; i++) {
      await server.client.upsertAspect(catalogId, bulkAspectDefId, {
        index: i,
        data: `Test data ${i}`,
      });
    }
    const duration = Date.now() - startTime;

    console.log(`Created 100 aspects in ${duration}ms (${(duration / 100).toFixed(2)}ms per aspect)`);

    // Verify all were created
    const queryResponse = await server.client.queryAspects(catalogId, bulkAspectDefId, {
      limit: 200,
    });

    expect(queryResponse.aspects.length).toBe(100);
  });

  it("should return empty result for query with no matches", async () => {
    const server = getTestServer();

    const response = await server.client.queryAspects(catalogId, aspectDefId, {
      entityIds: ["00000000-0000-0000-0000-000000000000"],
    });

    expect(response.aspects.length).toBe(0);
  });
});
