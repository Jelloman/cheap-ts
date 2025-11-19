/**
 * Unit tests for Catalog REST API routes
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import request from "supertest";
import express from "express";
import { catalogRouter } from "./catalogRoutes.js";
import { CheapDatabase } from "@cheap-ts/db-sqlite";

// Mock the DatabaseService to use an in-memory database
let testDb: CheapDatabase;

jest.mock("../services/DatabaseService.js", () => ({
  getDatabase: () => testDb,
}));

describe("Catalog Routes", () => {
  let app: express.Application;

  beforeEach(() => {
    // Create a fresh in-memory database for each test
    testDb = new CheapDatabase(":memory:");

    app = express();
    app.use(express.json());
    app.use("/api/catalogs", catalogRouter);
  });

  afterEach(() => {
    // Close the database after each test
    testDb.close();
  });

  describe("POST /api/catalogs", () => {
    it("should create a new catalog", async () => {
      const response = await request(app)
        .post("/api/catalogs")
        .send({})
        .expect(201);

      expect(response.body).toHaveProperty("id");
      expect(response.body.species).toBe("SINK");
      expect(response.body).toHaveProperty("created");
    });
  });

  describe("GET /api/catalogs", () => {
    it("should list all catalogs", async () => {
      // Create a catalog first
      await request(app).post("/api/catalogs").send({});

      const response = await request(app)
        .get("/api/catalogs")
        .expect(200);

      expect(response.body).toHaveProperty("catalogs");
      expect(Array.isArray(response.body.catalogs)).toBe(true);
      expect(response.body).toHaveProperty("total");
    });

    it("should return empty list when no catalogs exist", async () => {
      const response = await request(app)
        .get("/api/catalogs")
        .expect(200);

      expect(response.body.catalogs).toHaveLength(0);
      expect(response.body.total).toBe(0);
    });
  });

  describe("GET /api/catalogs/:id", () => {
    it("should get a specific catalog", async () => {
      const createResponse = await request(app).post("/api/catalogs").send({});
      const catalogId = createResponse.body.id;

      const response = await request(app)
        .get(`/api/catalogs/${catalogId}`)
        .expect(200);

      expect(response.body.id).toBe(catalogId);
      expect(response.body.species).toBe("SINK");
    });

    it("should return 404 for non-existent catalog", async () => {
      await request(app)
        .get("/api/catalogs/non-existent-id")
        .expect(404);
    });
  });

  describe("DELETE /api/catalogs/:id", () => {
    it("should delete a catalog", async () => {
      const createResponse = await request(app).post("/api/catalogs").send({});
      const catalogId = createResponse.body.id;

      await request(app)
        .delete(`/api/catalogs/${catalogId}`)
        .expect(204);
    });
  });
});
