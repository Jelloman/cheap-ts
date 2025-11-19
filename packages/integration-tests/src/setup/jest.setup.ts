/**
 * Jest setup file for integration tests
 */
import { TestServer } from "./server.js";

// Global test server instance
let globalServer: TestServer | null = null;

// Detect database type from environment
const dbType = (process.env.CHEAP_DB_TYPE || "sqlite") as "sqlite" | "postgres" | "mariadb";

// Configure database connection based on type
const dbConfig =
  dbType === "postgres"
    ? {
        host: process.env.POSTGRES_HOST || "localhost",
        port: parseInt(process.env.POSTGRES_PORT || "5432"),
        database: process.env.POSTGRES_DB || "cheap_test",
        user: process.env.POSTGRES_USER || "postgres",
        password: process.env.POSTGRES_PASSWORD || "postgres",
      }
    : dbType === "mariadb"
      ? {
          host: process.env.MARIADB_HOST || "localhost",
          port: parseInt(process.env.MARIADB_PORT || "3306"),
          database: process.env.MARIADB_DB || "cheap_test",
          user: process.env.MARIADB_USER || "root",
          password: process.env.MARIADB_PASSWORD || "password",
        }
      : undefined;

beforeAll(async () => {
  console.log(`Starting test server with ${dbType} database...`);

  globalServer = new TestServer({
    port: 3456, // Use different port for tests
    dbType,
    dbConfig,
  });

  try {
    await globalServer.start();
    const healthy = await globalServer.healthCheck();
    if (!healthy) {
      throw new Error("Server health check failed");
    }
    console.log(`Test server started successfully on port 3456`);
  } catch (error) {
    console.error("Failed to start test server:", error);
    throw error;
  }
}, 30000);

afterAll(async () => {
  if (globalServer) {
    console.log("Stopping test server...");
    await globalServer.stop();
    globalServer = null;
  }
}, 10000);

// Export for use in tests
export function getTestServer(): TestServer {
  if (!globalServer) {
    throw new Error("Test server not initialized");
  }
  return globalServer;
}
