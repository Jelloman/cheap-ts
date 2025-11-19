/**
 * AspectDef REST API routes
 */

import { Router, Request, Response } from "express";
import { catalogStore } from "../services/CatalogService.js";
import { AspectMapHierarchyImpl } from "@cheap-ts/core";
import { serializeAspectDef, deserializeAspectDef, type AspectDefJson } from "@cheap-ts/json";

export const aspectDefRouter = Router({ mergeParams: true });

/**
 * POST /api/catalogs/:catalogId/aspect-defs - Create a new AspectDef
 */
aspectDefRouter.post("/", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
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

    // Deserialize the AspectDef from JSON
    const aspectDef = deserializeAspectDef(aspectDefJson);

    // Create an AspectMapHierarchy for this AspectDef in the catalog
    // This is done by the catalog's addAspectDef method (if we had one)
    // For now, we'll store it directly
    const aspectMap = catalog.aspects(aspectDef.name());
    if (aspectMap) {
      res.status(409).json({ error: `AspectDef with name '${aspectDef.name()}' already exists` });
      return;
    }

    // Add the aspect def to the catalog by creating an AspectMapHierarchy
    // The catalog will automatically register the AspectDef
    const hierarchy = new AspectMapHierarchyImpl(catalog, aspectDef);
    catalog.addHierarchy(hierarchy);

    res.status(201).json({
      id: aspectDef.globalId(),
      name: aspectDef.name(),
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
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;

    const allAspectDefs = Array.from(catalog.aspectDefs());
    const total = allAspectDefs.length;
    const start = page * size;
    const end = start + size;
    const pagedAspectDefs = allAspectDefs.slice(start, end);

    res.json({
      aspectDefs: pagedAspectDefs.map((def) => serializeAspectDef(def)),
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
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDef = Array.from(catalog.aspectDefs()).find(
      (def) => def.globalId() === req.params.aspectDefId
    );

    if (!aspectDef) {
      res.status(404).json({ error: "AspectDef not found" });
      return;
    }

    res.json(serializeAspectDef(aspectDef));
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
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDef = Array.from(catalog.aspectDefs()).find(
      (def) => def.name() === req.params.name
    );

    if (!aspectDef) {
      res.status(404).json({ error: "AspectDef not found" });
      return;
    }

    res.json(serializeAspectDef(aspectDef));
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get AspectDef",
    });
  }
});
