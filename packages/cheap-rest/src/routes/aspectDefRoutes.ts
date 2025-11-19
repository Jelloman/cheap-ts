/**
 * AspectDef REST API routes
 */

import { Router, Request, Response } from "express";
import { getDatabase } from "../services/DatabaseService.js";
import type { AspectDefJson } from "@cheap-ts/json";
import { randomUUID } from "crypto";

export const aspectDefRouter = Router({ mergeParams: true });

/**
 * POST /api/catalogs/:catalogId/aspect-defs - Create a new AspectDef
 */
aspectDefRouter.post("/", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDefJson = req.body as AspectDefJson;

    // Validate required fields
    if (!aspectDefJson.name || !aspectDefJson.properties) {
      res.status(400).json({ error: "Missing required fields: name and properties" });
      return;
    }

    // Check if AspectDef with this name already exists
    const existing = db.getAspectDefByName(req.params.catalogId, aspectDefJson.name);
    if (existing) {
      res.status(409).json({ error: `AspectDef with name '${aspectDefJson.name}' already exists` });
      return;
    }

    // Convert properties from Record to Array
    const propertyDefs = Object.entries(aspectDefJson.properties).map(([propName, propDef]) => ({
      name: propName,
      typeCode: propDef.type,
      defaultValue: propDef.defaultValue,
      hasDefaultValue: propDef.hasDefaultValue,
      readable: propDef.readable,
      writable: propDef.writable,
      nullable: propDef.nullable,
      removable: propDef.removable,
      multivalued: propDef.multivalued,
    }));

    // Create the AspectDef in the database
    const globalId = aspectDefJson.globalId || randomUUID();
    db.createAspectDef(
      req.params.catalogId,
      globalId,
      aspectDefJson.name,
      propertyDefs
    );

    res.status(201).json({
      id: globalId,
      name: aspectDefJson.name,
      created: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to create AspectDef",
    });
  }
});

/**
 * GET /api/catalogs/:catalogId/aspect-defs - List all AspectDefs in a catalog
 */
aspectDefRouter.get("/", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;

    const offset = page * size;
    const aspectDefs = db.listAspectDefs(req.params.catalogId, size, offset);

    // Get total count (simplified - in production would use a COUNT query)
    const allAspectDefs = db.listAspectDefs(req.params.catalogId, 10000, 0);
    const total = allAspectDefs.length;

    res.json({
      aspectDefs,
      page,
      size,
      total,
      totalPages: Math.ceil(total / size),
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to list AspectDefs",
    });
  }
});

/**
 * GET /api/catalogs/:catalogId/aspect-defs/:aspectDefId - Get a specific AspectDef by ID
 */
aspectDefRouter.get("/:aspectDefId", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDef = db.getAspectDef(req.params.catalogId, req.params.aspectDefId);

    if (!aspectDef) {
      res.status(404).json({ error: "AspectDef not found" });
      return;
    }

    res.json(aspectDef);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get AspectDef",
    });
  }
});

/**
 * GET /api/catalogs/:catalogId/aspect-defs/by-name/:name - Get an AspectDef by name
 */
aspectDefRouter.get("/by-name/:name", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDef = db.getAspectDefByName(req.params.catalogId, req.params.name);

    if (!aspectDef) {
      res.status(404).json({ error: "AspectDef not found" });
      return;
    }

    res.json(aspectDef);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get AspectDef",
    });
  }
});
