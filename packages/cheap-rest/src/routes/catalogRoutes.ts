/**
 * Catalog REST API routes
 */

import { Router, Request, Response } from "express";
import { getDatabase } from "../services/DatabaseService.js";

export const catalogRouter = Router();

/**
 * POST /api/catalogs - Create a new catalog
 */
catalogRouter.post("/", (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const catalogId = db.createCatalog("SINK");
    res.status(201).json({
      id: catalogId,
      species: "SINK",
      created: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create catalog",
    });
  }
});

/**
 * GET /api/catalogs - List all catalogs
 */
catalogRouter.get("/", (_req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const catalogs = db.listCatalogs();
    res.json({
      catalogs: catalogs.map((cat) => ({
        id: cat.id,
        species: cat.species,
      })),
      total: catalogs.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list catalogs",
    });
  }
});

/**
 * GET /api/catalogs/:id - Get a specific catalog
 */
catalogRouter.get("/:id", (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    const catalog = db.getCatalog(req.params.id);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    res.json({
      id: catalog.id,
      species: catalog.species,
      uri: catalog.uri ?? null,
      upstream: catalog.upstream,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get catalog",
    });
  }
});

/**
 * DELETE /api/catalogs/:id - Delete a catalog
 */
catalogRouter.delete("/:id", (req: Request, res: Response) => {
  try {
    const db = getDatabase();
    db.deleteCatalog(req.params.id);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to delete catalog",
    });
  }
});
