/**
 * Unit tests for CheapRestClient
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import MockAdapter from "axios-mock-adapter";
import { CheapRestClient, CheapRestClientException } from "./CheapRestClient.js";
import type { AspectDefJson, AspectJson } from "@cheap-ts/json";

describe("CheapRestClient", () => {
  let client: CheapRestClient;
  let mock: MockAdapter;

  beforeEach(() => {
    client = new CheapRestClient({
      baseURL: "http://localhost:3000/api",
      timeout: 5000,
    });
    // Create mock adapter for the client's axios instance
    mock = new MockAdapter((client as any).axios);
  });

  afterEach(() => {
    mock.restore();
  });

  describe("Catalog Operations", () => {
    describe("createCatalog", () => {
      it("should create a catalog successfully", async () => {
        const mockResponse = {
          id: "catalog-123",
          species: "SINK",
          created: "2025-01-01T00:00:00Z",
        };

        mock.onPost("/catalogs").reply(201, mockResponse);

        const result = await client.createCatalog();

        expect(result).toEqual(mockResponse);
        expect(result.id).toBe("catalog-123");
        expect(result.species).toBe("SINK");
      });

      it("should throw exception on error", async () => {
        mock.onPost("/catalogs").reply(500, { error: "Internal server error" });

        await expect(client.createCatalog()).rejects.toThrow(CheapRestClientException);
      });
    });

    describe("listCatalogs", () => {
      it("should list all catalogs", async () => {
        const mockResponse = {
          catalogs: [
            { id: "catalog-1", species: "SINK" },
            { id: "catalog-2", species: "SOURCE" },
          ],
          total: 2,
        };

        mock.onGet("/catalogs").reply(200, mockResponse);

        const result = await client.listCatalogs();

        expect(result.catalogs).toHaveLength(2);
        expect(result.total).toBe(2);
      });
    });

    describe("getCatalog", () => {
      it("should get a specific catalog", async () => {
        const catalogId = "catalog-123";
        const mockResponse = {
          id: catalogId,
          species: "SINK",
          uri: null,
          upstream: null,
        };

        mock.onGet(`/catalogs/${catalogId}`).reply(200, mockResponse);

        const result = await client.getCatalog(catalogId);

        expect(result.id).toBe(catalogId);
        expect(result.species).toBe("SINK");
      });

      it("should throw exception for non-existent catalog", async () => {
        mock.onGet("/catalogs/non-existent").reply(404, { error: "Catalog not found" });

        await expect(client.getCatalog("non-existent")).rejects.toThrow(
          CheapRestClientException,
        );
      });
    });

    describe("deleteCatalog", () => {
      it("should delete a catalog", async () => {
        const catalogId = "catalog-123";

        mock.onDelete(`/catalogs/${catalogId}`).reply(204);

        await expect(client.deleteCatalog(catalogId)).resolves.toBeUndefined();
      });
    });
  });

  describe("AspectDef Operations", () => {
    const catalogId = "catalog-123";

    describe("addAspectDef", () => {
      it("should add a new AspectDef", async () => {
        const aspectDef: AspectDefJson = {
          name: "Person",
          globalId: "aspect-def-123",
          properties: {
            name: { type: "STRING" },
            age: { type: "INT" },
          },
        };

        const mockResponse = {
          id: "aspect-def-123",
          name: "Person",
          created: "2025-01-01T00:00:00Z",
        };

        mock.onPost(`/catalogs/${catalogId}/aspect-defs`).reply(201, mockResponse);

        const result = await client.addAspectDef(catalogId, aspectDef);

        expect(result.id).toBe("aspect-def-123");
        expect(result.name).toBe("Person");
      });

      it("should throw exception for duplicate AspectDef", async () => {
        const aspectDef: AspectDefJson = {
          name: "Person",
          globalId: "aspect-def-123",
          properties: {
            name: { type: "STRING" },
          },
        };

        mock
          .onPost(`/catalogs/${catalogId}/aspect-defs`)
          .reply(409, { error: "AspectDef with name 'Person' already exists" });

        await expect(client.addAspectDef(catalogId, aspectDef)).rejects.toThrow(
          CheapRestClientException,
        );
      });
    });

    describe("listAspectDefs", () => {
      it("should list AspectDefs with pagination", async () => {
        const mockResponse = {
          aspectDefs: [
            { name: "Person", globalId: "aspect-def-1", properties: {} },
            { name: "Book", globalId: "aspect-def-2", properties: {} },
          ],
          page: 0,
          size: 20,
          total: 2,
          totalPages: 1,
        };

        mock.onGet(`/catalogs/${catalogId}/aspect-defs`).reply(200, mockResponse);

        const result = await client.listAspectDefs(catalogId);

        expect(result.aspectDefs).toHaveLength(2);
        expect(result.page).toBe(0);
        expect(result.size).toBe(20);
        expect(result.total).toBe(2);
      });

      it("should support custom pagination parameters", async () => {
        const mockResponse = {
          aspectDefs: [],
          page: 2,
          size: 10,
          total: 25,
          totalPages: 3,
        };

        mock
          .onGet(`/catalogs/${catalogId}/aspect-defs`, { params: { page: 2, size: 10 } })
          .reply(200, mockResponse);

        const result = await client.listAspectDefs(catalogId, 2, 10);

        expect(result.page).toBe(2);
        expect(result.size).toBe(10);
      });
    });

    describe("getAspectDef", () => {
      it("should get an AspectDef by ID", async () => {
        const aspectDefId = "aspect-def-123";
        const mockResponse: AspectDefJson = {
          name: "Person",
          globalId: aspectDefId,
          properties: {
            name: { type: "STRING" },
          },
        };

        mock
          .onGet(`/catalogs/${catalogId}/aspect-defs/${aspectDefId}`)
          .reply(200, mockResponse);

        const result = await client.getAspectDef(catalogId, aspectDefId);

        expect(result.globalId).toBe(aspectDefId);
        expect(result.name).toBe("Person");
      });
    });

    describe("getAspectDefByName", () => {
      it("should get an AspectDef by name", async () => {
        const name = "Person";
        const mockResponse: AspectDefJson = {
          name,
          globalId: "aspect-def-123",
          properties: {
            name: { type: "STRING" },
          },
        };

        mock
          .onGet(`/catalogs/${catalogId}/aspect-defs/by-name/${name}`)
          .reply(200, mockResponse);

        const result = await client.getAspectDefByName(catalogId, name);

        expect(result.name).toBe(name);
        expect(result.globalId).toBe("aspect-def-123");
      });

      it("should throw exception for non-existent name", async () => {
        mock
          .onGet(`/catalogs/${catalogId}/aspect-defs/by-name/NonExistent`)
          .reply(404, { error: "AspectDef not found" });

        await expect(client.getAspectDefByName(catalogId, "NonExistent")).rejects.toThrow(
          CheapRestClientException,
        );
      });
    });
  });

  describe("Aspect Operations", () => {
    const catalogId = "catalog-123";

    describe("upsertAspects", () => {
      it("should upsert aspects successfully", async () => {
        const aspects: AspectJson[] = [
          {
            entityId: "entity-1",
            properties: { name: "John Doe", age: 30 },
          },
          {
            entityId: "entity-2",
            properties: { name: "Jane Smith", age: 25 },
          },
        ];

        const mockResponse = {
          aspectDefName: "Person",
          results: [
            { entityId: "entity-1", created: true },
            { entityId: "entity-2", created: false },
          ],
          total: 2,
        };

        mock.onPost(`/catalogs/${catalogId}/aspects`).reply(200, mockResponse);

        const result = await client.upsertAspects(catalogId, "Person", aspects);

        expect(result.aspectDefName).toBe("Person");
        expect(result.results).toHaveLength(2);
        expect(result.total).toBe(2);
      });
    });

    describe("queryAspects", () => {
      it("should query all aspects for an AspectDef", async () => {
        const mockResponse = {
          aspectDefName: "Person",
          aspects: [
            { entityId: "entity-1", properties: { name: "John Doe" } },
            { entityId: "entity-2", properties: { name: "Jane Smith" } },
          ],
          total: 2,
        };

        mock.onGet(`/catalogs/${catalogId}/aspects`).reply(200, mockResponse);

        const result = await client.queryAspects(catalogId, "Person");

        expect(result.aspectDefName).toBe("Person");
        expect(result.aspects).toHaveLength(2);
        expect(result.total).toBe(2);
      });

      it("should query aspects filtered by entity IDs", async () => {
        const entityIds = ["entity-1", "entity-3"];
        const mockResponse = {
          aspectDefName: "Person",
          aspects: [
            { entityId: "entity-1", properties: { name: "John Doe" } },
            { entityId: "entity-3", properties: { name: "Bob Johnson" } },
          ],
          total: 2,
        };

        mock.onGet(`/catalogs/${catalogId}/aspects`).reply(200, mockResponse);

        const result = await client.queryAspects(catalogId, "Person", entityIds);

        expect(result.aspects).toHaveLength(2);
        expect(result.aspects.map((a) => a.entityId)).toEqual(["entity-1", "entity-3"]);
      });
    });
  });

  describe("Hierarchy Operations", () => {
    const catalogId = "catalog-123";

    describe("getHierarchy", () => {
      it("should get an entity list hierarchy", async () => {
        const mockResponse = {
          type: "ENTITY_LIST",
          name: "myList",
          entities: ["entity-1", "entity-2", "entity-3"],
          page: 0,
          size: 20,
          total: 3,
        };

        mock.onGet(`/catalogs/${catalogId}/hierarchies/myList`).reply(200, mockResponse);

        const result = await client.getHierarchy(catalogId, "myList");

        expect(result.type).toBe("ENTITY_LIST");
        expect(result.name).toBe("myList");
        expect(result.entities).toHaveLength(3);
      });

      it("should get an entity directory hierarchy", async () => {
        const mockResponse = {
          type: "ENTITY_DIR",
          name: "myDir",
          entries: {
            entry1: "entity-1",
            entry2: "entity-2",
          },
        };

        mock.onGet(`/catalogs/${catalogId}/hierarchies/myDir`).reply(200, mockResponse);

        const result = await client.getHierarchy(catalogId, "myDir");

        expect(result.type).toBe("ENTITY_DIR");
        expect(result.entries).toBeDefined();
        expect(result.entries!["entry1"]).toBe("entity-1");
      });
    });

    describe("addEntityIds", () => {
      it("should add entity IDs to a hierarchy", async () => {
        const entityIds = ["entity-4", "entity-5"];
        const mockResponse = {
          added: 2,
          total: 5,
        };

        mock
          .onPost(`/catalogs/${catalogId}/hierarchies/myList/entity-ids`)
          .reply(200, mockResponse);

        const result = await client.addEntityIds(catalogId, "myList", entityIds);

        expect(result.added).toBe(2);
        expect(result.total).toBe(5);
      });
    });

    describe("removeEntityIds", () => {
      it("should remove entity IDs from a hierarchy", async () => {
        const entityIds = ["entity-1", "entity-2"];
        const mockResponse = {
          removed: 2,
          total: 3,
        };

        mock
          .onDelete(`/catalogs/${catalogId}/hierarchies/myList/entity-ids`)
          .reply(200, mockResponse);

        const result = await client.removeEntityIds(catalogId, "myList", entityIds);

        expect(result.removed).toBe(2);
        expect(result.total).toBe(3);
      });
    });

    describe("addDirectoryEntries", () => {
      it("should add directory entries", async () => {
        const entries = [
          { name: "entry3", entityId: "entity-3" },
          { name: "entry4", entityId: "entity-4" },
        ];
        const mockResponse = {
          added: 2,
          total: 4,
        };

        mock
          .onPost(`/catalogs/${catalogId}/hierarchies/myDir/directory-entries`)
          .reply(200, mockResponse);

        const result = await client.addDirectoryEntries(catalogId, "myDir", entries);

        expect(result.added).toBe(2);
        expect(result.total).toBe(4);
      });
    });

    describe("removeDirectoryEntriesByNames", () => {
      it("should remove directory entries by names", async () => {
        const names = ["entry1", "entry2"];
        const mockResponse = {
          removed: 2,
          total: 2,
        };

        mock
          .onDelete(`/catalogs/${catalogId}/hierarchies/myDir/directory-entries/by-names`)
          .reply(200, mockResponse);

        const result = await client.removeDirectoryEntriesByNames(catalogId, "myDir", names);

        expect(result.removed).toBe(2);
        expect(result.total).toBe(2);
      });
    });

    describe("removeDirectoryEntriesByEntityIds", () => {
      it("should remove directory entries by entity IDs", async () => {
        const entityIds = ["entity-1", "entity-2"];
        const mockResponse = {
          removed: 2,
          total: 2,
        };

        mock
          .onDelete(`/catalogs/${catalogId}/hierarchies/myDir/directory-entries/by-entity-ids`)
          .reply(200, mockResponse);

        const result = await client.removeDirectoryEntriesByEntityIds(
          catalogId,
          "myDir",
          entityIds,
        );

        expect(result.removed).toBe(2);
        expect(result.total).toBe(2);
      });
    });
  });

  describe("Error Handling", () => {
    it("should throw CheapRestClientException with status code", async () => {
      mock.onGet("/catalogs/test").reply(404, { error: "Not found" });

      try {
        await client.getCatalog("test");
        fail("Should have thrown exception");
      } catch (error) {
        expect(error).toBeInstanceOf(CheapRestClientException);
        const clientError = error as CheapRestClientException;
        expect(clientError.statusCode).toBe(404);
        expect(clientError.message).toBe("Not found");
      }
    });

    it("should throw CheapRestClientException for network errors", async () => {
      mock.onGet("/catalogs").networkError();

      await expect(client.listCatalogs()).rejects.toThrow(CheapRestClientException);
    });

    it("should throw CheapRestClientException for timeout", async () => {
      mock.onGet("/catalogs").timeout();

      await expect(client.listCatalogs()).rejects.toThrow(CheapRestClientException);
    });
  });

  describe("Configuration", () => {
    it("should use custom headers", () => {
      const customClient = new CheapRestClient({
        baseURL: "http://localhost:3000/api",
        headers: {
          "X-Custom-Header": "custom-value",
        },
      });

      const headers = (customClient as any).axios.defaults.headers;
      expect(headers["X-Custom-Header"]).toBe("custom-value");
    });

    it("should use custom timeout", () => {
      const customClient = new CheapRestClient({
        baseURL: "http://localhost:3000/api",
        timeout: 10000,
      });

      const timeout = (customClient as any).axios.defaults.timeout;
      expect(timeout).toBe(10000);
    });
  });
});
