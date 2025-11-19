/**
 * Performance baseline tests
 * Establishes performance metrics for key operations
 */
import { describe, it, expect, beforeAll, afterAll } from "@jest/globals";
import { getTestServer } from "../../setup/jest.setup.js";
import { createCatalogDef } from "../../fixtures/test-data.js";

describe("Performance Baselines", () => {
  let catalogId: string;

  beforeAll(async () => {
    const server = getTestServer();
    const catalogDef = createCatalogDef([
      { name: "perfList", type: "ENTITY_LIST" },
      { name: "perfDir", type: "ENTITY_DIR" },
    ]);

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

  it("should measure bulk aspect upsert performance", async () => {
    const server = getTestServer();

    // Create AspectDef
    const aspectDef = {
      name: "PerfTest",
      propertyDefs: [
        { name: "index", typeCode: "INT" },
        { name: "data", typeCode: "STRING" },
        { name: "value", typeCode: "DOUBLE" },
      ],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    // Measure time for 1000 aspect upserts
    const count = 1000;
    const startTime = Date.now();

    for (let i = 0; i < count; i++) {
      await server.client.upsertAspect(catalogId, aspectDefId, {
        index: i,
        data: `Test data ${i}`,
        value: i * 1.5,
      });
    }

    const duration = Date.now() - startTime;
    const avgTime = duration / count;

    console.log(`\nBulk Aspect Upsert Performance:`);
    console.log(`  Total: ${count} aspects in ${duration}ms`);
    console.log(`  Average: ${avgTime.toFixed(2)}ms per aspect`);
    console.log(`  Throughput: ${(count / (duration / 1000)).toFixed(2)} aspects/sec`);

    // Verify all were created
    const queryResponse = await server.client.queryAspects(catalogId, aspectDefId, {
      limit: 1500,
    });
    expect(queryResponse.aspects.length).toBe(count);

    // Baseline: Should complete in reasonable time (adjust based on requirements)
    expect(avgTime).toBeLessThan(100); // Less than 100ms per aspect
  });

  it("should measure aspect query performance with large dataset", async () => {
    const server = getTestServer();

    // Create AspectDef
    const aspectDef = {
      name: "QueryPerfTest",
      propertyDefs: [{ name: "value", typeCode: "INT" }],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    // Create 500 aspects
    const count = 500;
    for (let i = 0; i < count; i++) {
      await server.client.upsertAspect(catalogId, aspectDefId, { value: i });
    }

    // Measure query performance
    const startTime = Date.now();
    const queryResponse = await server.client.queryAspects(catalogId, aspectDefId, {
      limit: 1000,
    });
    const duration = Date.now() - startTime;

    console.log(`\nAspect Query Performance:`);
    console.log(`  Query ${count} aspects in ${duration}ms`);

    expect(queryResponse.aspects.length).toBe(count);
    expect(duration).toBeLessThan(5000); // Less than 5 seconds
  });

  it("should measure paginated query performance", async () => {
    const server = getTestServer();

    // Create AspectDef
    const aspectDef = {
      name: "PaginationPerfTest",
      propertyDefs: [{ name: "value", typeCode: "INT" }],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    // Create 200 aspects
    const count = 200;
    for (let i = 0; i < count; i++) {
      await server.client.upsertAspect(catalogId, aspectDefId, { value: i });
    }

    // Measure pagination performance
    const pageSize = 50;
    const startTime = Date.now();

    let totalFetched = 0;
    for (let offset = 0; offset < count; offset += pageSize) {
      const pageResponse = await server.client.queryAspects(catalogId, aspectDefId, {
        limit: pageSize,
        offset,
      });
      totalFetched += pageResponse.aspects.length;
    }

    const duration = Date.now() - startTime;

    console.log(`\nPaginated Query Performance:`);
    console.log(`  Fetched ${totalFetched} aspects in ${Math.ceil(count / pageSize)} pages`);
    console.log(`  Total time: ${duration}ms`);
    console.log(`  Average per page: ${(duration / Math.ceil(count / pageSize)).toFixed(2)}ms`);

    expect(totalFetched).toBe(count);
  });

  it("should measure hierarchy operations performance", async () => {
    const server = getTestServer();

    // Create AspectDef and entities
    const aspectDef = {
      name: "HierarchyPerfTest",
      propertyDefs: [{ name: "value", typeCode: "INT" }],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    // Create 100 entities
    const entityIds: string[] = [];
    for (let i = 0; i < 100; i++) {
      const response = await server.client.upsertAspect(catalogId, aspectDefId, { value: i });
      entityIds.push(response.entityId);
    }

    // Measure bulk add to hierarchy
    const addStartTime = Date.now();
    await server.client.addEntityIdsToHierarchy(catalogId, "perfList", entityIds);
    const addDuration = Date.now() - addStartTime;

    console.log(`\nHierarchy Add Performance:`);
    console.log(`  Added ${entityIds.length} entities in ${addDuration}ms`);

    // Measure hierarchy retrieval
    const getStartTime = Date.now();
    const hierarchy = await server.client.getHierarchy(catalogId, "perfList");
    const getDuration = Date.now() - getStartTime;

    console.log(`\nHierarchy Retrieval Performance:`);
    console.log(`  Retrieved ${hierarchy.entityIds.length} entities in ${getDuration}ms`);

    expect(hierarchy.entityIds.length).toBeGreaterThanOrEqual(100);
  });

  it("should measure directory operations performance", async () => {
    const server = getTestServer();

    // Create entities
    const aspectDef = {
      name: "DirectoryPerfTest",
      propertyDefs: [{ name: "value", typeCode: "INT" }],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    const entries = [];
    for (let i = 0; i < 100; i++) {
      const response = await server.client.upsertAspect(catalogId, aspectDefId, { value: i });
      entries.push({ name: `entry_${i}`, entityId: response.entityId });
    }

    // Measure bulk add to directory
    const addStartTime = Date.now();
    await server.client.addDirectoryEntries(catalogId, "perfDir", entries);
    const addDuration = Date.now() - addStartTime;

    console.log(`\nDirectory Add Performance:`);
    console.log(`  Added ${entries.length} entries in ${addDuration}ms`);

    // Measure directory retrieval
    const getStartTime = Date.now();
    const directory = await server.client.getHierarchy(catalogId, "perfDir");
    const getDuration = Date.now() - getStartTime;

    console.log(`\nDirectory Retrieval Performance:`);
    console.log(`  Retrieved ${Object.keys(directory.entries).length} entries in ${getDuration}ms`);

    expect(Object.keys(directory.entries).length).toBeGreaterThanOrEqual(100);
  });

  it("should measure concurrent operations", async () => {
    const server = getTestServer();

    // Create AspectDef
    const aspectDef = {
      name: "ConcurrencyPerfTest",
      propertyDefs: [{ name: "value", typeCode: "INT" }],
    };

    const aspectDefResponse = await server.client.createAspectDef(catalogId, aspectDef);
    const aspectDefId = aspectDefResponse.aspectDefId;

    // Measure concurrent aspect creation
    const count = 50;
    const startTime = Date.now();

    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(server.client.upsertAspect(catalogId, aspectDefId, { value: i }));
    }

    await Promise.all(promises);
    const duration = Date.now() - startTime;

    console.log(`\nConcurrent Operations Performance:`);
    console.log(`  Created ${count} aspects concurrently in ${duration}ms`);
    console.log(`  Average: ${(duration / count).toFixed(2)}ms per aspect`);

    // Verify all were created
    const queryResponse = await server.client.queryAspects(catalogId, aspectDefId, {
      limit: 100,
    });
    expect(queryResponse.aspects.length).toBe(count);
  });
});
