/**
 * Database service layer - wraps CheapDatabase with singleton pattern
 */

import { CheapDatabase } from "@cheap-ts/db-sqlite";

/**
 * Singleton database instance
 * In production, this would be configured via environment variables
 */
let db: CheapDatabase | null = null;

/**
 * Get or create the database instance
 */
export function getDatabase(): CheapDatabase {
  if (!db) {
    const dbPath = process.env.DB_PATH || ":memory:";
    console.log(`Initializing database: ${dbPath}`);
    db = new CheapDatabase(dbPath);
  }
  return db;
}

/**
 * Close the database connection
 */
export function closeDatabase(): void {
  if (db) {
    db.close();
    db = null;
  }
}
