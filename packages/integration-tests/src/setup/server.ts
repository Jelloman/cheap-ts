/**
 * Server lifecycle management for integration tests
 */
import { spawn, ChildProcess } from "child_process";
import { CheapRestClient } from "@cheap-ts/rest-client";
import { TestClient } from "./test-client.js";

export interface ServerConfig {
  port: number;
  dbType: "sqlite" | "postgres" | "mariadb";
  dbConfig?: {
    host?: string;
    port?: number;
    database?: string;
    user?: string;
    password?: string;
  };
}

export class TestServer {
  private process: ChildProcess | null = null;
  private config: ServerConfig;
  public client: TestClient;

  constructor(config: ServerConfig) {
    this.config = config;
    const restClient = new CheapRestClient({
      baseURL: `http://localhost:${config.port}`,
      timeout: 10000,
    });
    this.client = new TestClient(restClient);
  }

  async start(): Promise<void> {
    return new Promise((resolve, reject) => {
      const env = {
        ...process.env,
        PORT: this.config.port.toString(),
        CHEAP_DB_TYPE: this.config.dbType,
      };

      // Add database-specific configuration
      if (this.config.dbType === "postgres" && this.config.dbConfig) {
        env.POSTGRES_HOST = this.config.dbConfig.host || "localhost";
        env.POSTGRES_PORT = (this.config.dbConfig.port || 5432).toString();
        env.POSTGRES_DB = this.config.dbConfig.database || "cheap_test";
        env.POSTGRES_USER = this.config.dbConfig.user || "postgres";
        env.POSTGRES_PASSWORD = this.config.dbConfig.password || "postgres";
      } else if (this.config.dbType === "mariadb" && this.config.dbConfig) {
        env.MARIADB_HOST = this.config.dbConfig.host || "localhost";
        env.MARIADB_PORT = (this.config.dbConfig.port || 3306).toString();
        env.MARIADB_DB = this.config.dbConfig.database || "cheap_test";
        env.MARIADB_USER = this.config.dbConfig.user || "root";
        env.MARIADB_PASSWORD = this.config.dbConfig.password || "password";
      } else if (this.config.dbType === "sqlite") {
        env.SQLITE_PATH = ":memory:";
      }

      this.process = spawn("node", ["dist/index.js"], {
        cwd: `${process.cwd()}/../cheap-rest`,
        env,
        stdio: ["ignore", "pipe", "pipe"],
      });

      let startupOutput = "";

      this.process.stdout?.on("data", (data) => {
        const output = data.toString();
        startupOutput += output;
        if (output.includes(`Server running on port ${this.config.port}`)) {
          // Give server a moment to fully initialize
          setTimeout(() => resolve(), 500);
        }
      });

      this.process.stderr?.on("data", (data) => {
        console.error(`Server error: ${data.toString()}`);
      });

      this.process.on("error", (error) => {
        reject(new Error(`Failed to start server: ${error.message}`));
      });

      this.process.on("exit", (code) => {
        if (code !== 0 && code !== null) {
          reject(new Error(`Server exited with code ${code}\n${startupOutput}`));
        }
      });

      // Timeout if server doesn't start within 10 seconds
      setTimeout(() => {
        reject(new Error(`Server failed to start within 10 seconds\n${startupOutput}`));
      }, 10000);
    });
  }

  async stop(): Promise<void> {
    return new Promise((resolve) => {
      if (this.process) {
        this.process.on("exit", () => {
          this.process = null;
          resolve();
        });
        this.process.kill("SIGTERM");

        // Force kill after 5 seconds
        setTimeout(() => {
          if (this.process) {
            this.process.kill("SIGKILL");
          }
        }, 5000);
      } else {
        resolve();
      }
    });
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`http://localhost:${this.config.port}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}
