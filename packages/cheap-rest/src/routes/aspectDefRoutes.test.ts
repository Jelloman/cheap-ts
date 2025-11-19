/**
 * Unit tests for AspectDef REST API routes
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { aspectDefRouter } from "./aspectDefRoutes.js";
import { randomUUID } from "crypto";

// Mock the DatabaseService
jest.mock("../services/DatabaseService.js", () => {
  const mockCatalogs: Record<string, any> = { "test-catalog": { id: "test-catalog" } };
  const mockAspectDefs: Record<string, any> = {};
  let mockDb: any;

  return {
    getDatabase: () => {
      if (!mockDb) {
        mockDb = {
          getCatalog: jest.fn((id: string) => mockCatalogs[id]),
          getAspectDefByName: jest.fn((catalogId: string, name: string) => {
            return Object.values(mockAspectDefs).find((def: any) => def.name === name);
          }),
          createAspectDef: jest.fn((catalogId: string, aspectDefId: string, name: string, propertyDefs: any[]) => {
            mockAspectDefs[aspectDefId] = {
              id: aspectDefId,
              name,
              globalId: aspectDefId,
              propertyDefs,
            };
          }),
          getAspectDef: jest.fn((catalogId: string, aspectDefId: string) => mockAspectDefs[aspectDefId]),
          listAspectDefs: jest.fn((catalogId: string, limit: number, offset: number) => {
            const defs = Object.values(mockAspectDefs);
            return defs.slice(offset, offset + limit);
          }),
        };
      }
      return mockDb;
    },
    __resetMockData: () => {
      Object.keys(mockAspectDefs).forEach(key => delete mockAspectDefs[key]);
    },
  };
});

describe("AspectDef Routes", () => {
  let app: express.Application;
  const catalogId = "test-catalog";

  beforeEach(() => {
    app = express();
    app.use(express.json());
    app.use("/api/catalogs/:catalogId/aspect-defs", aspectDefRouter);

    const { __resetMockData } = require("../services/DatabaseService.js");
    __resetMockData();
  });

  describe("POST /api/catalogs/:catalogId/aspect-defs", () => {
    it("should create a new AspectDef", async () => {
      const aspectDefJson = {
        name: "Person",
        properties: {
          name: { type: "STRING" },
          age: { type: "INT" },
        },
      };

      const response = await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send(aspectDefJson)
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.name).toBe("Person");
      expect(response.body).toHaveProperty("created");
    });

    it("should return 400 for missing required fields", async () => {
      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send({ name: "InvalidAspect" })
        .expect(400);
    });

    it("should return 404 for non-existent catalog", async () => {
      await request(app)
        .post("/api/catalogs/non-existent/aspect-defs")
        .send({
          name: "Person",
          properties: { name: { type: "STRING" } },
        })
        .expect(404);
    });

    it("should return 409 for duplicate AspectDef name", async () => {
      const aspectDefJson = {
        name: "Person",
        properties: { name: { type: "STRING" } },
      };

      // Create first AspectDef
      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send(aspectDefJson)
        .expect(201);

      // Try to create duplicate
      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send(aspectDefJson)
        .expect(409);
    });
  });

  describe("GET /api/catalogs/:catalogId/aspect-defs", () => {
    it("should list all AspectDefs", async () => {
      // Create a couple of AspectDefs first
      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send({
          name: "Person",
          properties: { name: { type: "STRING" } },
        });

      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send({
          name: "Book",
          properties: { title: { type: "STRING" } },
        });

      const response = await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs`)
        .expect(200);

      expect(response.body).toHaveProperty("aspectDefs");
      expect(Array.isArray(response.body.aspectDefs)).toBe(true);
      expect(response.body).toHaveProperty("total");
    });

    it("should support pagination", async () => {
      const response = await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs?page=0&size=10`)
        .expect(200);

      expect(response.body.page).toBe(0);
      expect(response.body.size).toBe(10);
    });
  });

  describe("GET /api/catalogs/:catalogId/aspect-defs/:aspectDefId", () => {
    it("should get a specific AspectDef by ID", async () => {
      const createResponse = await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send({
          name: "Person",
          properties: { name: { type: "STRING" } },
        });

      const aspectDefId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs/${aspectDefId}`)
        .expect(200);

      expect(response.body.id).toBe(aspectDefId);
    });

    it("should return 404 for non-existent AspectDef", async () => {
      await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs/non-existent-id`)
        .expect(404);
    });
  });

  describe("GET /api/catalogs/:catalogId/aspect-defs/by-name/:name", () => {
    it("should get an AspectDef by name", async () => {
      await request(app)
        .post(`/api/catalogs/${catalogId}/aspect-defs`)
        .send({
          name: "Person",
          properties: { name: { type: "STRING" } },
        });

      const response = await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs/by-name/Person`)
        .expect(200);

      expect(response.body.name).toBe("Person");
    });

    it("should return 404 for non-existent AspectDef name", async () => {
      await request(app)
        .get(`/api/catalogs/${catalogId}/aspect-defs/by-name/NonExistent`)
        .expect(404);
    });
  });
});
