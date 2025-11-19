/**
 * SQLite database implementation for CHEAP model
 */

import Database from "better-sqlite3";
import { SCHEMA_SQL } from "./schema.js";
import { randomUUID } from "crypto";

/**
 * SQLite database wrapper for CHEAP model
 */
export class CheapDatabase {
  private db: Database.Database;

  constructor(filename: string = ":memory:") {
    this.db = new Database(filename);
    this.db.pragma("foreign_keys = ON");
    this.initSchema();
  }

  /**
   * Initialize database schema
   */
  private initSchema(): void {
    this.db.exec(SCHEMA_SQL);
  }

  /**
   * Close the database connection
   */
  close(): void {
    this.db.close();
  }

  // Catalog operations

  createCatalog(species: string, upstream: string | null = null): string {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO catalogs (id, species, upstream, version)
      VALUES (?, ?, ?, 0)
    `);
    stmt.run(id, species, upstream);
    return id;
  }

  getCatalog(id: string): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM catalogs WHERE id = ?
    `);
    return stmt.get(id) as any;
  }

  listCatalogs(): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM catalogs ORDER BY created_at DESC
    `);
    return stmt.all();
  }

  deleteCatalog(id: string): boolean {
    const stmt = this.db.prepare(`
      DELETE FROM catalogs WHERE id = ?
    `);
    const result = stmt.run(id);
    return result.changes > 0;
  }

  // AspectDef operations

  createAspectDef(
    catalogId: string,
    aspectDefId: string,
    name: string,
    propertyDefs: Array<{
      name: string;
      typeCode: string;
      defaultValue?: any;
      hasDefaultValue?: boolean;
      readable?: boolean;
      writable?: boolean;
      nullable?: boolean;
      removable?: boolean;
      multivalued?: boolean;
    }>,
  ): void {
    const tx = this.db.transaction(() => {
      // Insert AspectDef
      const aspectDefStmt = this.db.prepare(`
        INSERT INTO aspect_defs (id, catalog_id, name, readable, writable, can_add_properties, can_remove_properties)
        VALUES (?, ?, ?, 1, 1, 0, 0)
      `);
      aspectDefStmt.run(aspectDefId, catalogId, name);

      // Insert PropertyDefs
      const propDefStmt = this.db.prepare(`
        INSERT INTO property_defs (
          id, aspect_def_id, name, type_code, default_value, has_default_value,
          readable, writable, nullable, removable, multivalued
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const propDef of propertyDefs) {
        const propId = randomUUID();
        propDefStmt.run(
          propId,
          aspectDefId,
          propDef.name,
          propDef.typeCode,
          propDef.defaultValue ? JSON.stringify(propDef.defaultValue) : null,
          propDef.hasDefaultValue ? 1 : 0,
          propDef.readable !== false ? 1 : 0,
          propDef.writable !== false ? 1 : 0,
          propDef.nullable ? 1 : 0,
          propDef.removable ? 1 : 0,
          propDef.multivalued ? 1 : 0,
        );
      }
    });
    tx();
  }

  getAspectDef(catalogId: string, aspectDefId: string): any | null {
    const aspectDefStmt = this.db.prepare(`
      SELECT * FROM aspect_defs WHERE id = ? AND catalog_id = ?
    `);
    const aspectDef = aspectDefStmt.get(aspectDefId, catalogId);

    if (!aspectDef) return null;

    const propDefsStmt = this.db.prepare(`
      SELECT * FROM property_defs WHERE aspect_def_id = ?
    `);
    const propertyDefs = propDefsStmt.all(aspectDefId);

    return { ...aspectDef, propertyDefs };
  }

  getAspectDefByName(catalogId: string, name: string): any | null {
    const aspectDefStmt = this.db.prepare(`
      SELECT * FROM aspect_defs WHERE catalog_id = ? AND name = ?
    `);
    const aspectDef = aspectDefStmt.get(catalogId, name);

    if (!aspectDef) return null;

    const propDefsStmt = this.db.prepare(`
      SELECT * FROM property_defs WHERE aspect_def_id = ?
    `);
    const propertyDefs = propDefsStmt.all((aspectDef as any).id);

    return { ...aspectDef, propertyDefs };
  }

  listAspectDefs(catalogId: string, limit = 20, offset = 0): any[] {
    const stmt = this.db.prepare(`
      SELECT * FROM aspect_defs
      WHERE catalog_id = ?
      ORDER BY name
      LIMIT ? OFFSET ?
    `);
    return stmt.all(catalogId, limit, offset);
  }

  // Aspect operations

  upsertAspect(
    catalogId: string,
    entityId: string,
    aspectDefId: string,
    properties: Record<string, any>,
  ): { aspectId: string; created: boolean } {
    let created = false;
    let aspectId: string = "";

    const tx = this.db.transaction(() => {
      // Ensure entity exists
      const entityStmt = this.db.prepare(`
        INSERT OR IGNORE INTO entities (id) VALUES (?)
      `);
      entityStmt.run(entityId);

      // Check if aspect exists
      const checkStmt = this.db.prepare(`
        SELECT id FROM aspects
        WHERE catalog_id = ? AND entity_id = ? AND aspect_def_id = ?
      `);
      const aspect = checkStmt.get(catalogId, entityId, aspectDefId) as any;

      if (!aspect) {
        // Create new aspect
        aspectId = randomUUID();
        const insertStmt = this.db.prepare(`
          INSERT INTO aspects (id, catalog_id, entity_id, aspect_def_id)
          VALUES (?, ?, ?, ?)
        `);
        insertStmt.run(aspectId, catalogId, entityId, aspectDefId);
        created = true;
      } else {
        aspectId = aspect.id;
        // Delete existing property values
        const deleteStmt = this.db.prepare(`
          DELETE FROM property_values WHERE aspect_id = ?
        `);
        deleteStmt.run(aspectId);
      }

      // Insert property values
      const propStmt = this.db.prepare(`
        INSERT INTO property_values (id, aspect_id, property_name, value_json)
        VALUES (?, ?, ?, ?)
      `);

      for (const [propName, value] of Object.entries(properties)) {
        const propId = randomUUID();
        propStmt.run(propId, aspectId, propName, JSON.stringify(value));
      }
    });

    tx();
    return { aspectId, created };
  }

  queryAspects(catalogId: string, aspectDefId: string, entityIds?: string[]): any[] {
    let query = `
      SELECT a.*, e.id as entity_id
      FROM aspects a
      JOIN entities e ON a.entity_id = e.id
      WHERE a.catalog_id = ? AND a.aspect_def_id = ?
    `;
    const params: any[] = [catalogId, aspectDefId];

    if (entityIds && entityIds.length > 0) {
      query += ` AND a.entity_id IN (${entityIds.map(() => "?").join(",")})`;
      params.push(...entityIds);
    }

    const stmt = this.db.prepare(query);
    const aspects = stmt.all(...params);

    // Load property values for each aspect
    const propStmt = this.db.prepare(`
      SELECT property_name, value_json
      FROM property_values
      WHERE aspect_id = ?
    `);

    return (aspects as any[]).map((aspect) => {
      const properties: Record<string, any> = {};
      const props = propStmt.all(aspect.id);
      for (const prop of props as any[]) {
        properties[prop.property_name] = JSON.parse(prop.value_json);
      }
      return { ...aspect, properties };
    });
  }

  // Hierarchy operations

  createHierarchy(catalogId: string, name: string, type: string, aspectDefId?: string): string {
    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO hierarchies (id, catalog_id, name, type, aspect_def_id, version)
      VALUES (?, ?, ?, ?, ?, 0)
    `);
    stmt.run(id, catalogId, name, type, aspectDefId || null);
    return id;
  }

  getHierarchy(catalogId: string, name: string): any | null {
    const stmt = this.db.prepare(`
      SELECT * FROM hierarchies WHERE catalog_id = ? AND name = ?
    `);
    return stmt.get(catalogId, name) as any;
  }

  // Hierarchy entity operations (for EntityList, EntitySet)

  addEntityToHierarchy(hierarchyId: string, entityId: string, position?: number): void {
    // Ensure entity exists
    const entityStmt = this.db.prepare(`
      INSERT OR IGNORE INTO entities (id) VALUES (?)
    `);
    entityStmt.run(entityId);

    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT INTO hierarchy_entities (id, hierarchy_id, entity_id, position)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, hierarchyId, entityId, position || null);
  }

  removeEntityFromHierarchy(hierarchyId: string, entityId: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM hierarchy_entities
      WHERE hierarchy_id = ? AND entity_id = ?
    `);
    const result = stmt.run(hierarchyId, entityId);
    return result.changes;
  }

  getHierarchyEntities(hierarchyId: string, limit = 20, offset = 0): string[] {
    const stmt = this.db.prepare(`
      SELECT entity_id FROM hierarchy_entities
      WHERE hierarchy_id = ?
      ORDER BY position, id
      LIMIT ? OFFSET ?
    `);
    const rows = stmt.all(hierarchyId, limit, offset);
    return (rows as any[]).map((row) => row.entity_id);
  }

  // Hierarchy directory operations (for EntityDirectory)

  addDirectoryEntry(hierarchyId: string, entryName: string, entityId: string): void {
    // Ensure entity exists
    const entityStmt = this.db.prepare(`
      INSERT OR IGNORE INTO entities (id) VALUES (?)
    `);
    entityStmt.run(entityId);

    const id = randomUUID();
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO hierarchy_directory (id, hierarchy_id, entry_name, entity_id)
      VALUES (?, ?, ?, ?)
    `);
    stmt.run(id, hierarchyId, entryName, entityId);
  }

  removeDirectoryEntryByName(hierarchyId: string, entryName: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM hierarchy_directory
      WHERE hierarchy_id = ? AND entry_name = ?
    `);
    const result = stmt.run(hierarchyId, entryName);
    return result.changes;
  }

  removeDirectoryEntryByEntityId(hierarchyId: string, entityId: string): number {
    const stmt = this.db.prepare(`
      DELETE FROM hierarchy_directory
      WHERE hierarchy_id = ? AND entity_id = ?
    `);
    const result = stmt.run(hierarchyId, entityId);
    return result.changes;
  }

  getDirectoryEntries(hierarchyId: string): Record<string, string> {
    const stmt = this.db.prepare(`
      SELECT entry_name, entity_id FROM hierarchy_directory
      WHERE hierarchy_id = ?
      ORDER BY entry_name
    `);
    const rows = stmt.all(hierarchyId);
    const result: Record<string, string> = {};
    for (const row of rows as any[]) {
      result[row.entry_name] = row.entity_id;
    }
    return result;
  }
}
