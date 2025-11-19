/**
 * PostgreSQL database implementation for CHEAP model
 */

import pkg from "pg";
const { Pool } = pkg;
import { SCHEMA_SQL } from "./schema.js";
import { randomUUID } from "crypto";

export interface PostgresConfig {
  host?: string;
  port?: number;
  database?: string;
  user?: string;
  password?: string;
  connectionString?: string;
}

/**
 * PostgreSQL database wrapper for CHEAP model
 */
export class CheapDatabase {
  private pool: typeof Pool.prototype;

  constructor(config: PostgresConfig) {
    this.pool = new Pool(config);
  }

  /**
   * Initialize database schema
   */
  async initSchema(): Promise<void> {
    const client = await this.pool.connect();
    try {
      await client.query(SCHEMA_SQL);
    } finally {
      client.release();
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
      `INSERT INTO catalogs (id, species, upstream, version) VALUES ($1, $2, $3, 0)`,
      [id, species, upstream]
    );
    return id;
  }

  async getCatalog(id: string): Promise<any | null> {
    const result = await this.pool.query(`SELECT * FROM catalogs WHERE id = $1`, [id]);
    return result.rows[0] || null;
  }

  async listCatalogs(): Promise<any[]> {
    const result = await this.pool.query(`SELECT * FROM catalogs ORDER BY created_at DESC`);
    return result.rows;
  }

  async deleteCatalog(id: string): Promise<boolean> {
    const result = await this.pool.query(`DELETE FROM catalogs WHERE id = $1`, [id]);
    return (result.rowCount ?? 0) > 0;
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
    const client = await this.pool.connect();
    try {
      await client.query("BEGIN");

      // Insert AspectDef
      await client.query(
        `INSERT INTO aspect_defs (id, catalog_id, name, readable, writable, can_add_properties, can_remove_properties)
         VALUES ($1, $2, $3, true, true, false, false)`,
        [aspectDefId, catalogId, name]
      );

      // Insert PropertyDefs
      for (const propDef of propertyDefs) {
        const propId = randomUUID();
        await client.query(
          `INSERT INTO property_defs (
            id, aspect_def_id, name, type_code, default_value, has_default_value,
            readable, writable, nullable, removable, multivalued
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
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

      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }

  async getAspectDef(catalogId: string, aspectDefId: string): Promise<any | null> {
    const aspectDefResult = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE id = $1 AND catalog_id = $2`,
      [aspectDefId, catalogId]
    );

    if (aspectDefResult.rows.length === 0) return null;

    const aspectDef = aspectDefResult.rows[0];

    const propDefsResult = await this.pool.query(
      `SELECT * FROM property_defs WHERE aspect_def_id = $1`,
      [aspectDefId]
    );

    return { ...aspectDef, propertyDefs: propDefsResult.rows };
  }

  async getAspectDefByName(catalogId: string, name: string): Promise<any | null> {
    const aspectDefResult = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE catalog_id = $1 AND name = $2`,
      [catalogId, name]
    );

    if (aspectDefResult.rows.length === 0) return null;

    const aspectDef = aspectDefResult.rows[0];

    const propDefsResult = await this.pool.query(
      `SELECT * FROM property_defs WHERE aspect_def_id = $1`,
      [aspectDef.id]
    );

    return { ...aspectDef, propertyDefs: propDefsResult.rows };
  }

  async listAspectDefs(catalogId: string, limit = 20, offset = 0): Promise<any[]> {
    const result = await this.pool.query(
      `SELECT * FROM aspect_defs WHERE catalog_id = $1 ORDER BY name LIMIT $2 OFFSET $3`,
      [catalogId, limit, offset]
    );
    return result.rows;
  }

  // Aspect operations

  async upsertAspect(
    catalogId: string,
    entityId: string,
    aspectDefId: string,
    properties: Record<string, any>,
  ): Promise<{ aspectId: string; created: boolean }> {
    const client = await this.pool.connect();
    let created = false;
    let aspectId = "";

    try {
      await client.query("BEGIN");

      // Ensure entity exists
      await client.query(`INSERT INTO entities (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [
        entityId,
      ]);

      // Check if aspect exists
      const aspectResult = await client.query(
        `SELECT id FROM aspects WHERE catalog_id = $1 AND entity_id = $2 AND aspect_def_id = $3`,
        [catalogId, entityId, aspectDefId]
      );

      if (aspectResult.rows.length === 0) {
        // Create new aspect
        aspectId = randomUUID();
        await client.query(
          `INSERT INTO aspects (id, catalog_id, entity_id, aspect_def_id) VALUES ($1, $2, $3, $4)`,
          [aspectId, catalogId, entityId, aspectDefId]
        );
        created = true;
      } else {
        aspectId = aspectResult.rows[0].id;
        // Delete existing property values
        await client.query(`DELETE FROM property_values WHERE aspect_id = $1`, [aspectId]);
      }

      // Insert property values
      for (const [propName, value] of Object.entries(properties)) {
        const propId = randomUUID();
        await client.query(
          `INSERT INTO property_values (id, aspect_id, property_name, value_json) VALUES ($1, $2, $3, $4)`,
          [propId, aspectId, propName, JSON.stringify(value)]
        );
      }

      await client.query("COMMIT");
      return { aspectId, created };
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
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
      WHERE a.catalog_id = $1 AND a.aspect_def_id = $2
    `;
    const params: any[] = [catalogId, aspectDefId];

    if (entityIds && entityIds.length > 0) {
      query += ` AND a.entity_id = ANY($3)`;
      params.push(entityIds);
    }

    const result = await this.pool.query(query, params);

    // Load property values for each aspect
    const aspects = await Promise.all(
      result.rows.map(async (aspect: any) => {
        const propsResult = await this.pool.query(
          `SELECT property_name, value_json FROM property_values WHERE aspect_id = $1`,
          [aspect.id]
        );

        const properties: Record<string, any> = {};
        for (const prop of propsResult.rows as any[]) {
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
      `INSERT INTO hierarchies (id, catalog_id, name, type, aspect_def_id, version) VALUES ($1, $2, $3, $4, $5, 0)`,
      [id, catalogId, name, type, aspectDefId || null]
    );
    return id;
  }

  async getHierarchy(catalogId: string, name: string): Promise<any | null> {
    const result = await this.pool.query(
      `SELECT * FROM hierarchies WHERE catalog_id = $1 AND name = $2`,
      [catalogId, name]
    );
    return result.rows[0] || null;
  }

  // Hierarchy entity operations (for EntityList, EntitySet)

  async addEntityToHierarchy(hierarchyId: string, entityId: string, position?: number): Promise<void> {
    // Ensure entity exists
    await this.pool.query(`INSERT INTO entities (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [
      entityId,
    ]);

    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO hierarchy_entities (id, hierarchy_id, entity_id, position) VALUES ($1, $2, $3, $4)`,
      [id, hierarchyId, entityId, position || null]
    );
  }

  async removeEntityFromHierarchy(hierarchyId: string, entityId: string): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM hierarchy_entities WHERE hierarchy_id = $1 AND entity_id = $2`,
      [hierarchyId, entityId]
    );
    return result.rowCount ?? 0;
  }

  async getHierarchyEntities(hierarchyId: string, limit = 20, offset = 0): Promise<string[]> {
    const result = await this.pool.query(
      `SELECT entity_id FROM hierarchy_entities WHERE hierarchy_id = $1 ORDER BY position, id LIMIT $2 OFFSET $3`,
      [hierarchyId, limit, offset]
    );
    return result.rows.map((row) => row.entity_id);
  }

  // Hierarchy directory operations (for EntityDirectory)

  async addDirectoryEntry(hierarchyId: string, entryName: string, entityId: string): Promise<void> {
    // Ensure entity exists
    await this.pool.query(`INSERT INTO entities (id) VALUES ($1) ON CONFLICT (id) DO NOTHING`, [
      entityId,
    ]);

    const id = randomUUID();
    await this.pool.query(
      `INSERT INTO hierarchy_directory (id, hierarchy_id, entry_name, entity_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (hierarchy_id, entry_name) DO UPDATE SET entity_id = EXCLUDED.entity_id`,
      [id, hierarchyId, entryName, entityId]
    );
  }

  async removeDirectoryEntryByName(hierarchyId: string, entryName: string): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM hierarchy_directory WHERE hierarchy_id = $1 AND entry_name = $2`,
      [hierarchyId, entryName]
    );
    return result.rowCount ?? 0;
  }

  async removeDirectoryEntryByEntityId(hierarchyId: string, entityId: string): Promise<number> {
    const result = await this.pool.query(
      `DELETE FROM hierarchy_directory WHERE hierarchy_id = $1 AND entity_id = $2`,
      [hierarchyId, entityId]
    );
    return result.rowCount ?? 0;
  }

  async getDirectoryEntries(hierarchyId: string): Promise<Record<string, string>> {
    const result = await this.pool.query(
      `SELECT entry_name, entity_id FROM hierarchy_directory WHERE hierarchy_id = $1 ORDER BY entry_name`,
      [hierarchyId]
    );

    const entries: Record<string, string> = {};
    for (const row of result.rows as any[]) {
      entries[row.entry_name] = row.entity_id;
    }
    return entries;
  }
}
