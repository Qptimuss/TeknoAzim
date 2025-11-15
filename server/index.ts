import "dotenv/config";
import express from "express";
import cors from "cors";
import path from "path";
import { handleDemo } from "./routes/demo";

export function createServer() {
  const app = express();

  // Middleware
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // In development, all non-API routes should serve the main index.html
  // to let the client-side router handle the path.
  app.get("*", (req, res, next) => {
    if (req.path.startsWith("/api/")) {
      // This is an API route that wasn't found, let it 404
      return next();
    }
    // For all other routes, serve the SPA's entry point
    res.sendFile(path.join(process.cwd(), "index.html"));
  });

  return app;
}