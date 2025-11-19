/**
 * Aspect REST API routes
 */

import { Router, Request, Response } from "express";
import { catalogStore } from "../services/CatalogService.js";
import { EntityImpl, AspectPropertyMapImpl } from "@cheap-ts/core";
import { serializeAspect, type AspectJson } from "@cheap-ts/json";

export const aspectRouter = Router({ mergeParams: true });

/**
 * POST /api/catalogs/:catalogId/aspects - Upsert aspects (create entities if needed)
 */
aspectRouter.post("/", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const { aspectDefName, aspects } = req.body as { aspectDefName: string; aspects: AspectJson[] };

    if (!aspectDefName || !aspects || !Array.isArray(aspects)) {
      res.status(400).json({ error: "Missing required fields: aspectDefName and aspects array" });
      return;
    }

    // Find the AspectDef
    const aspectDef = Array.from(catalog.aspectDefs()).find((def) => def.name() === aspectDefName);
    if (!aspectDef) {
      res.status(404).json({ error: `AspectDef '${aspectDefName}' not found` });
      return;
    }

    // Get the AspectMapHierarchy for this AspectDef
    const aspectMap = catalog.aspects(aspectDef);
    if (!aspectMap) {
      res.status(500).json({ error: `No AspectMap found for AspectDef '${aspectDefName}'` });
      return;
    }

    const results: { entityId: string; created: boolean }[] = [];

    // Process each aspect
    for (const aspectJson of aspects) {
      // Get or create entity
      let entity = new EntityImpl(aspectJson.entityId);
      let created = false;

      // Check if entity already exists in this catalog
      const existingAspect = aspectMap.get(entity);
      if (!existingAspect) {
        created = true;
      }

      // Create the aspect with the entity
      const aspect = new AspectPropertyMapImpl(entity, aspectDef);

      // Set property values
      for (const propName in aspectJson.properties) {
        const propDef = aspectDef.propertyDef(propName);
        if (propDef) {
          aspect.unsafeWrite(propName, aspectJson.properties[propName]);
        }
      }

      // Add/update aspect in the catalog
      aspectMap.add(aspect);

      results.push({
        entityId: entity.globalId(),
        created,
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
    const catalog = catalogStore.get(req.params.catalogId);
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

    // Find the AspectDef
    const aspectDef = Array.from(catalog.aspectDefs()).find((def) => def.name() === aspectDefName);
    if (!aspectDef) {
      res.status(404).json({ error: `AspectDef '${aspectDefName}' not found` });
      return;
    }

    // Get the AspectMapHierarchy
    const aspectMap = catalog.aspects(aspectDef);
    if (!aspectMap) {
      res.status(404).json({ error: `No aspects found for AspectDef '${aspectDefName}'` });
      return;
    }

    // Get all aspects or filter by entity IDs
    // AspectMapHierarchy is a Map<Entity, Aspect>, so we can use Map.values()
    let aspects = Array.from(aspectMap.values());

    if (entityIds) {
      const entityIdArray = Array.isArray(entityIds) ? entityIds : [entityIds];
      aspects = aspects.filter((aspect) =>
        entityIdArray.includes(aspect.entity().globalId())
      );
    }

    res.json({
      aspectDefName,
      aspects: aspects.map((aspect) => serializeAspect(aspect)),
      total: aspects.length,
    });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to query aspects",
    });
  }
});
