/**
 * Unit tests for AspectDef REST API routes
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { aspectDefRouter } from "./aspectDefRoutes.js";
import { CheapDatabase } from "@cheap-ts/db-sqlite";

// Mock the DatabaseService to use an in-memory database
let testDb: CheapDatabase;

jest.mock("../services/DatabaseService.js", () => ({
  getDatabase: () => testDb,
}));

describe("AspectDef Routes", () => {
  let app: express.Application;
  let catalogId: string;

  beforeEach(() => {
    // Create a fresh in-memory database for each test
    testDb = new CheapDatabase(":memory:");
    catalogId = testDb.createCatalog("SINK");

    app = express();
    app.use(express.json());
    app.use("/api/catalogs/:catalogId/aspect-defs", aspectDefRouter);
  });

  afterEach(() => {
    // Close the database after each test
    testDb.close();
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
