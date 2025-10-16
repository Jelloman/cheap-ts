/**
 * @cheapjs/db-postgres - PostgreSQL database implementation for CHEAP model
 */

import { CatalogImpl } from '@cheapjs/core';

/**
 * PostgreSQL-backed catalog implementation.
 * This is a stub implementation that extends CatalogImpl.
 *
 * Database catalogs use the SOURCE species for read-only access
 * or SINK species for read-write access to external data sources.
 */
export class PostgresCatalog extends CatalogImpl {
  constructor() {
    // Create a SINK catalog (read-write external data source)
    super();
  }

  /**
   * Connect to a PostgreSQL database with the specified connection string.
   *
   * @param connectionString PostgreSQL connection string
   */
  async connect(_connectionString: string): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Close the database connection.
   */
  async close(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Load entities from the database into this catalog.
   */
  async load(): Promise<void> {
    throw new Error('Not implemented');
  }

  /**
   * Save entities from this catalog to the database.
   */
  async save(): Promise<void> {
    throw new Error('Not implemented');
  }
}
