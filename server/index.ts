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

  // In development, all non-API GET routes should serve the main index.html
  // to let the client-side router handle the path.
  // This regex matches any path that does NOT start with /api
  app.get(/^(?!\/api).*/, (_req, res) => {
    res.sendFile(path.join(process.cwd(), "index.html"));
  });

  return app;
}