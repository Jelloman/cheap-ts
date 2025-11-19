/**
 * Hierarchy REST API routes
 */

import { Router, Request, Response } from "express";
import { catalogStore } from "../services/CatalogService.js";
import {
  EntityImpl,
  EntityListHierarchyImpl,
  EntitySetHierarchyImpl,
  EntityDirectoryHierarchyImpl,
  EntityTreeHierarchyImpl,
  AspectMapHierarchyImpl,
} from "@cheap-ts/core";

export const hierarchyRouter = Router({ mergeParams: true });

/**
 * GET /api/catalogs/:catalogId/hierarchies/:name - Get hierarchy contents
 */
hierarchyRouter.get("/:name", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    const page = parseInt(req.query.page as string) || 0;
    const size = parseInt(req.query.size as string) || 20;

    // Handle different hierarchy types
    if (hierarchy instanceof EntityListHierarchyImpl) {
      const total = hierarchy.length;
      const start = page * size;
      const end = start + size;
      const entities = hierarchy.slice(start, end);

      res.json({
        type: "ENTITY_LIST",
        name: hierarchy.name(),
        entities: entities.map((e) => e.globalId()),
        page,
        size,
        total,
      });
    } else if (hierarchy instanceof EntitySetHierarchyImpl) {
      const entities = Array.from(hierarchy);
      const total = entities.length;
      const start = page * size;
      const end = start + size;
      const paged = entities.slice(start, end);

      res.json({
        type: "ENTITY_SET",
        name: hierarchy.name(),
        entities: paged.map((e) => e.globalId()),
        page,
        size,
        total,
      });
    } else if (hierarchy instanceof EntityDirectoryHierarchyImpl) {
      const entries: Record<string, string> = {};
      for (const [key, entity] of hierarchy.entries()) {
        entries[key] = entity.globalId();
      }

      res.json({
        type: "ENTITY_DIR",
        name: hierarchy.name(),
        entries,
      });
    } else if (hierarchy instanceof EntityTreeHierarchyImpl) {
      // Simplified tree representation - just return root nodes for now
      res.json({
        type: "ENTITY_TREE",
        name: hierarchy.name(),
        message: "Tree hierarchy serialization not yet fully implemented",
      });
    } else if (hierarchy instanceof AspectMapHierarchyImpl) {
      // AspectMapHierarchy is a Map<Entity, Aspect>, use Map.values()
      const aspects = Array.from(hierarchy.values());
      const total = aspects.length;
      const start = page * size;
      const end = start + size;
      const paged = aspects.slice(start, end);

      res.json({
        type: "ASPECT_MAP",
        name: hierarchy.name(),
        aspectDefName: hierarchy.aspectDef().name(),
        aspects: paged.map((aspect) => ({
          entityId: aspect.entity().globalId(),
          // Include aspect properties here if needed
        })),
        page,
        size,
        total,
      });
    } else {
      res.status(500).json({ error: "Unknown hierarchy type" });
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to get hierarchy",
    });
  }
});

/**
 * POST /api/catalogs/:catalogId/hierarchies/:name/entity-ids - Add entity IDs to list/set
 */
hierarchyRouter.post("/:name/entity-ids", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    const { entityIds } = req.body as { entityIds: string[] };
    if (!entityIds || !Array.isArray(entityIds)) {
      res.status(400).json({ error: "Missing or invalid entityIds array" });
      return;
    }

    if (hierarchy instanceof EntityListHierarchyImpl) {
      // Add entities to list
      for (const id of entityIds) {
        hierarchy.push(new EntityImpl(id));
      }
      res.json({ added: entityIds.length, total: hierarchy.length });
    } else if (hierarchy instanceof EntitySetHierarchyImpl) {
      // Add entities to set
      let added = 0;
      for (const id of entityIds) {
        const entity = new EntityImpl(id);
        if (!hierarchy.has(entity)) {
          hierarchy.add(entity);
          added++;
        }
      }
      res.json({ added, total: hierarchy.size });
    } else {
      res.status(400).json({ error: "Hierarchy type does not support entity ID operations" });
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to add entity IDs",
    });
  }
});

/**
 * DELETE /api/catalogs/:catalogId/hierarchies/:name/entity-ids - Remove entity IDs from list/set
 */
hierarchyRouter.delete("/:name/entity-ids", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    const { entityIds } = req.body as { entityIds: string[] };
    if (!entityIds || !Array.isArray(entityIds)) {
      res.status(400).json({ error: "Missing or invalid entityIds array" });
      return;
    }

    if (hierarchy instanceof EntityListHierarchyImpl) {
      // Remove entities from list (remove all occurrences)
      let removed = 0;
      for (const id of entityIds) {
        const entity = new EntityImpl(id);
        let index;
        while ((index = hierarchy.findIndex((e) => e.globalId() === entity.globalId())) !== -1) {
          hierarchy.splice(index, 1);
          removed++;
        }
      }
      res.json({ removed, total: hierarchy.length });
    } else if (hierarchy instanceof EntitySetHierarchyImpl) {
      // Remove entities from set
      let removed = 0;
      for (const id of entityIds) {
        const entity = new EntityImpl(id);
        if (hierarchy.delete(entity)) {
          removed++;
        }
      }
      res.json({ removed, total: hierarchy.size });
    } else {
      res.status(400).json({ error: "Hierarchy type does not support entity ID operations" });
    }
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to remove entity IDs",
    });
  }
});

/**
 * POST /api/catalogs/:catalogId/hierarchies/:name/directory-entries - Add directory entries
 */
hierarchyRouter.post("/:name/directory-entries", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    if (!(hierarchy instanceof EntityDirectoryHierarchyImpl)) {
      res.status(400).json({ error: "Hierarchy is not an EntityDirectory" });
      return;
    }

    const { entries } = req.body as { entries: Array<{ name: string; entityId: string }> };
    if (!entries || !Array.isArray(entries)) {
      res.status(400).json({ error: "Missing or invalid entries array" });
      return;
    }

    let added = 0;
    for (const entry of entries) {
      if (!entry.name || !entry.entityId) {
        continue;
      }
      hierarchy.set(entry.name, new EntityImpl(entry.entityId));
      added++;
    }

    res.json({ added, total: hierarchy.size });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to add directory entries",
    });
  }
});

/**
 * DELETE /api/catalogs/:catalogId/hierarchies/:name/directory-entries/by-names - Remove by names
 */
hierarchyRouter.delete("/:name/directory-entries/by-names", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    if (!(hierarchy instanceof EntityDirectoryHierarchyImpl)) {
      res.status(400).json({ error: "Hierarchy is not an EntityDirectory" });
      return;
    }

    const { names } = req.body as { names: string[] };
    if (!names || !Array.isArray(names)) {
      res.status(400).json({ error: "Missing or invalid names array" });
      return;
    }

    let removed = 0;
    for (const name of names) {
      if (hierarchy.delete(name)) {
        removed++;
      }
    }

    res.json({ removed, total: hierarchy.size });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to remove directory entries",
    });
  }
});

/**
 * DELETE /api/catalogs/:catalogId/hierarchies/:name/directory-entries/by-entity-ids - Remove by entity IDs
 */
hierarchyRouter.delete("/:name/directory-entries/by-entity-ids", (req: Request, res: Response) => {
  try {
    const catalog = catalogStore.get(req.params.catalogId);
    if (!catalog) {
      res.status(404).json({ error: "Catalog not found" });
      return;
    }

    const hierarchy = catalog.hierarchy(req.params.name);
    if (!hierarchy) {
      res.status(404).json({ error: "Hierarchy not found" });
      return;
    }

    if (!(hierarchy instanceof EntityDirectoryHierarchyImpl)) {
      res.status(400).json({ error: "Hierarchy is not an EntityDirectory" });
      return;
    }

    const { entityIds } = req.body as { entityIds: string[] };
    if (!entityIds || !Array.isArray(entityIds)) {
      res.status(400).json({ error: "Missing or invalid entityIds array" });
      return;
    }

    let removed = 0;
    const entriesToRemove: string[] = [];

    // Find all keys that map to these entity IDs
    for (const [key, entity] of hierarchy.entries()) {
      if (entityIds.includes(entity.globalId())) {
        entriesToRemove.push(key);
      }
    }

    // Remove the entries
    for (const key of entriesToRemove) {
      if (hierarchy.delete(key)) {
        removed++;
      }
    }

    res.json({ removed, total: hierarchy.size });
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : "Failed to remove directory entries",
    });
  }
});

/**
 * POST /api/catalogs/:catalogId/hierarchies/:name/tree-nodes - Add tree nodes
 */
hierarchyRouter.post("/:name/tree-nodes", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Tree node operations not yet implemented" });
});

/**
 * DELETE /api/catalogs/:catalogId/hierarchies/:name/tree-nodes - Remove tree nodes
 */
hierarchyRouter.delete("/:name/tree-nodes", (_req: Request, res: Response) => {
  res.status(501).json({ error: "Tree node operations not yet implemented" });
});
