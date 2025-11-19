/**
 * MariaDB database implementation for CHEAP model
 */

import mariadb from "mariadb";
import { SCHEMA_SQL } from "./schema.js";
import { randomUUID } from "crypto";

export interface MariaConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionLimit?: number;
}

/**
 * MariaDB database wrapper for CHEAP model
 */
export class CheapDatabase {
  private pool: mariadb.Pool;

  constructor(config: MariaConfig) {
    this.pool = mariadb.createPool({
      ...config,
      connectionLimit: config.connectionLimit || 5,
    });
  }

  /**
   * Initialize database schema
   */
  async initSchema(): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      // Split and execute each statement separately for MariaDB
      const statements = SCHEMA_SQL.split(";").filter((s) => s.trim());
      for (const statement of statements) {
        if (statement.trim()) {
          await conn.query(statement);
        }
      }
    } finally {
      conn.release();
    }
  }

  /**
   * Close the database connection pool
   */
  async close(): Promise<void> {
    await this.pool.end();
  }

  // Catalog operations

  async createCatalog(species: string, upstream: string | null = null): Promise<string> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO catalogs (id, species, upstream, version) VALUES (?, ?, ?, 0)`,
      [id, species, upstream]
    );
    return id;
  }

  async getCatalog(id: string): Promise<any | null> {
    const rows = await this.pool.query(`SELECT * FROM catalogs WHERE id = ?`, [id]);
    return rows.length > 0 ? rows[0] : null;
  }

  async listCatalogs(): Promise<any[]> {
    const rows = await this.pool.query(`SELECT * FROM catalogs ORDER BY created_at DESC`);
    return rows;
  }

  async deleteCatalog(id: string): Promise<boolean> {
    const result: any = await this.pool.query(`DELETE FROM catalogs WHERE id = ?`, [id]);
    return result.affectedRows > 0;
  }

  // AspectDef operations

  async createAspectDef(
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
  ): Promise<void> {
    const conn = await this.pool.getConnection();
    try {
      await conn.beginTransaction();

      // Insert AspectDef
      await conn.query(
        `INSERT INTO aspect_defs (id, catalog_id, name, readable, writable, can_add_properties, can_remove_properties)
         VALUES (?, ?, ?, 1, 1, 0, 0)`,
        [aspectDefId, catalogId, name]
      );

      // Insert PropertyDefs
      for (const propDef of propertyDefs) {
        const propId = randomUUID();
        await conn.query(
          `INSERT INTO property_defs (
            id, aspect_def_id, name, type_code, default_value, has_default_value,
            readable, writable, nullable, removable, multivalued
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            propId,
            aspectDefId,
            propDef.name,
            propDef.typeCode,
            propDef.defaultValue ? JSON.stringify(propDef.defaultValue) : null,
            propDef.hasDefaultValue ?? false,
            propDef.readable !== false,
            propDef.writable !== false,
            propDef.nullable ?? true,
            propDef.removable ?? true,
            propDef.multivalued ?? false,
          ]
        );
      }

      await conn.commit();
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async getAspectDef(catalogId: string, aspectDefId: string): Promise<any | null> {
    const aspectDefRows = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE id = ? AND catalog_id = ?`,
      [aspectDefId, catalogId]
    );

    if (aspectDefRows.length === 0) return null;

    const aspectDef = aspectDefRows[0];

    const propDefRows = await this.pool.query(
      `SELECT * FROM property_defs WHERE aspect_def_id = ?`,
      [aspectDefId]
    );

    return { ...aspectDef, propertyDefs: propDefRows };
  }

  async getAspectDefByName(catalogId: string, name: string): Promise<any | null> {
    const aspectDefRows = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE catalog_id = ? AND name = ?`,
      [catalogId, name]
    );

    if (aspectDefRows.length === 0) return null;

    const aspectDef = aspectDefRows[0];

    const propDefRows = await this.pool.query(
      `SELECT * FROM property_defs WHERE aspect_def_id = ?`,
      [aspectDef.id]
    );

    return { ...aspectDef, propertyDefs: propDefRows };
  }

  async listAspectDefs(catalogId: string, limit = 20, offset = 0): Promise<any[]> {
    const rows = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE catalog_id = ? ORDER BY name LIMIT ? OFFSET ?`,
      [catalogId, limit, offset]
    );
    return rows;
  }

  // Aspect operations

  async upsertAspect(
    catalogId: string,
    entityId: string,
    aspectDefId: string,
    properties: Record<string, any>,
  ): Promise<{ aspectId: string; created: boolean }> {
    const conn = await this.pool.getConnection();
    let created = false;
    let aspectId = "";

    try {
      await conn.beginTransaction();

      // Ensure entity exists
      await conn.query(`INSERT IGNORE INTO entities (id) VALUES (?)`, [entityId]);

      // Check if aspect exists
      const aspectRows = await conn.query(
        `SELECT id FROM aspects WHERE catalog_id = ? AND entity_id = ? AND aspect_def_id = ?`,
        [catalogId, entityId, aspectDefId]
      );

      if (aspectRows.length === 0) {
        // Create new aspect
        aspectId = randomUUID();
        await conn.query(
          `INSERT INTO aspects (id, catalog_id, entity_id, aspect_def_id) VALUES (?, ?, ?, ?)`,
          [aspectId, catalogId, entityId, aspectDefId]
        );
        created = true;
      } else {
        aspectId = aspectRows[0].id;
        // Delete existing property values
        await conn.query(`DELETE FROM property_values WHERE aspect_id = ?`, [aspectId]);
      }

      // Insert property values
      for (const [propName, value] of Object.entries(properties)) {
        const propId = randomUUID();
        await conn.query(
          `INSERT INTO property_values (id, aspect_id, property_name, value_json) VALUES (?, ?, ?, ?)`,
          [propId, aspectId, propName, JSON.stringify(value)]
        );
      }

      await conn.commit();
      return { aspectId, created };
    } catch (error) {
      await conn.rollback();
      throw error;
    } finally {
      conn.release();
    }
  }

  async queryAspects(
    catalogId: string,
    aspectDefId: string,
    entityIds?: string[],
  ): Promise<any[]> {
    let query = `
      SELECT a.*, e.id as entity_id
      FROM aspects a
      JOIN entities e ON a.entity_id = e.id
      WHERE a.catalog_id = ? AND a.aspect_def_id = ?
    `;
    const params: any[] = [catalogId, aspectDefId];

    if (entityIds && entityIds.length > 0) {
      const placeholders = entityIds.map(() => "?").join(",");
      query += ` AND a.entity_id IN (${placeholders})`;
      params.push(...entityIds);
    }

    const rows = await this.pool.query(query, params);

    // Load property values for each aspect
    const aspects = await Promise.all(
      rows.map(async (aspect: any) => {
        const propRows = await this.pool.query(
          `SELECT property_name, value_json FROM property_values WHERE aspect_id = ?`,
          [aspect.id]
        );

        const properties: Record<string, any> = {};
        for (const prop of propRows as any[]) {
          properties[prop.property_name] = JSON.parse(prop.value_json);
        }

        return { ...aspect, properties };
      })
    );

    return aspects;
  }

  // Hierarchy operations

  async createHierarchy(
    catalogId: string,
    name: string,
    type: string,
    aspectDefId?: string,
  ): Promise<string> {
    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO hierarchies (id, catalog_id, name, type, aspect_def_id, version) VALUES (?, ?, ?, ?, ?, 0)`,
      [id, catalogId, name, type, aspectDefId || null]
    );
    return id;
  }

  async getHierarchy(catalogId: string, name: string): Promise<any | null> {
    const rows = await this.pool.query(
      `SELECT * FROM hierarchies WHERE catalog_id = ? AND name = ?`,
      [catalogId, name]
    );
    return rows.length > 0 ? rows[0] : null;
  }

  // Hierarchy entity operations (for EntityList, EntitySet)

  async addEntityToHierarchy(
    hierarchyId: string,
    entityId: string,
    position?: number,
  ): Promise<void> {
    // Ensure entity exists
    await this.pool.query(`INSERT IGNORE INTO entities (id) VALUES (?)`, [entityId]);

    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO hierarchy_entities (id, hierarchy_id, entity_id, position) VALUES (?, ?, ?, ?)`,
      [id, hierarchyId, entityId, position || null]
    );
  }

  async removeEntityFromHierarchy(hierarchyId: string, entityId: string): Promise<number> {
    const result: any = await this.pool.query(
      `DELETE FROM hierarchy_entities WHERE hierarchy_id = ? AND entity_id = ?`,
      [hierarchyId, entityId]
    );
    return result.affectedRows;
  }

  async getHierarchyEntities(hierarchyId: string, limit = 20, offset = 0): Promise<string[]> {
    const rows = await this.pool.query(
      `SELECT entity_id FROM hierarchy_entities WHERE hierarchy_id = ? ORDER BY position, id LIMIT ? OFFSET ?`,
      [hierarchyId, limit, offset]
    );
    return rows.map((row: any) => row.entity_id);
  }

  // Hierarchy directory operations (for EntityDirectory)

  async addDirectoryEntry(
    hierarchyId: string,
    entryName: string,
    entityId: string,
  ): Promise<void> {
    // Ensure entity exists
    await this.pool.query(`INSERT IGNORE INTO entities (id) VALUES (?)`, [entityId]);

    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO hierarchy_directory (id, hierarchy_id, entry_name, entity_id)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE entity_id = VALUES(entity_id)`,
      [id, hierarchyId, entryName, entityId]
    );
  }

  async removeDirectoryEntryByName(hierarchyId: string, entryName: string): Promise<number> {
    const result: any = await this.pool.query(
      `DELETE FROM hierarchy_directory WHERE hierarchy_id = ? AND entry_name = ?`,
      [hierarchyId, entryName]
    );
    return result.affectedRows;
  }

  async removeDirectoryEntryByEntityId(hierarchyId: string, entityId: string): Promise<number> {
    const result: any = await this.pool.query(
      `DELETE FROM hierarchy_directory WHERE hierarchy_id = ? AND entity_id = ?`,
      [hierarchyId, entityId]
    );
    return result.affectedRows;
  }

  async getDirectoryEntries(hierarchyId: string): Promise<Record<string, string>> {
    const rows = await this.pool.query(
      `SELECT entry_name, entity_id FROM hierarchy_directory WHERE hierarchy_id = ? ORDER BY entry_name`,
      [hierarchyId]
    );

    const entries: Record<string, string> = {};
    for (const row of rows as any[]) {
      entries[row.entry_name] = row.entity_id;
    }
    return entries;
  }
}
