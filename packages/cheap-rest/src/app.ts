/**
 * Express application setup
 */

import express, { Express, Request, Response, NextFunction } from "express";
import cors from "cors";
import { catalogRouter } from "./routes/catalogRoutes.js";

export function createApp(): Express {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());

  // Routes
  app.use("/api/catalogs", catalogRouter);

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
