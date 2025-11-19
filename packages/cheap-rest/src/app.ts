/**
 * Express application setup
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalogRoutes.js";
import { aspectDefRouter } from "./routes/aspectDefRoutes.js";
import { aspectRouter } from "./routes/aspectRoutes.js";
import { hierarchyRouter } from "./routes/hierarchyRoutes.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/catalogs", catalogRouter);
  app.use("/api/catalogs/:catalogId/aspect-defs", aspectDefRouter);
  app.use("/api/catalogs/:catalogId/aspects", aspectRouter);
  app.use("/api/catalogs/:catalogId/hierarchies", hierarchyRouter);

  // Health check
  app.get("/health", (_req: Request, res: Response) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Error handler
  app.use((err: Error, _req: Request, res: Response, _next: NextFunction) => {
    console.error("Error:", err);
    res.status(500).json({
      error: err.message || "Internal server error",
    });
  });

  return app;
}
