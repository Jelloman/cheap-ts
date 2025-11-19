/**
 * Aspect REST API routes
 */

import { Router, Request, Response } from "express";
import { getDatabase } from "../services/DatabaseService.js";
import type { AspectJson } from "@cheap-ts/json";

export const aspectRouter = Router({ mergeParams: true });

/**
 * POST /api/catalogs/:catalogId/aspects - Upsert aspects (create entities if needed)
 */
aspectRouter.post("/", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const { aspectDefName, aspects } = req.body as { aspectDefName: string; aspects: AspectJson[] };

    if (!aspectDefName || !aspects || !Array.isArray(aspects)) {
      res.status(400).json({ error: "Missing required fields: aspectDefName and aspects array" });
      return;
    }

    // Find the AspectDef by name
    const aspectDef = db.getAspectDefByName(req.params.catalogId, aspectDefName);
    if (!aspectDef) {
      res.status(404).json({ error: `AspectDef '${aspectDefName}' not found` });
      return;
    }

    const results: { entityId: string; created: boolean }[] = [];

    // Process each aspect
    for (const aspectJson of aspects) {
      const result = db.upsertAspect(
        req.params.catalogId,
        aspectJson.entityId,
        aspectDef.globalId,
        aspectJson.properties
      );

      results.push({
        entityId: aspectJson.entityId,
        created: result.created,
      });
    }

    res.status(200).json({
      aspectDefName,
      results,
      total: results.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to upsert aspects",
    });
  }
});

/**
 * GET /api/catalogs/:catalogId/aspects - Query aspects
 */
aspectRouter.get("/", (req: Request, res: Response) => {
  try {
    const db = getDatabase();

    // Verify catalog exists
    const catalog = db.getCatalog(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const aspectDefName = req.query.aspectDefName as string;
    const entityIds = req.query.entityIds as string | string[] | undefined;

    if (!aspectDefName) {
      res.status(400).json({ error: "Missing required query parameter: aspectDefName" });
      return;
    }

    // Find the AspectDef by name
    const aspectDef = db.getAspectDefByName(req.params.catalogId, aspectDefName);
    if (!aspectDef) {
      res.status(404).json({ error: `AspectDef '${aspectDefName}' not found` });
      return;
    }

    // Query aspects from database
    const entityIdArray = entityIds ? (Array.isArray(entityIds) ? entityIds : [entityIds]) : undefined;
    const aspects = db.queryAspects(req.params.catalogId, aspectDef.globalId, entityIdArray);

    res.json({
      aspectDefName,
      aspects,
      total: aspects.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to query aspects",
    });
  }
});
