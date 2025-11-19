import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo.ts";
import { handleModerate } from "./routes/moderate.ts";
import { requireAuth } from "./middleware/auth.ts";
import { 
  handleCreatePost, 
  handleUpdatePost, 
  handleDeletePost, 
  handleAddComment, 
  handleDeleteComment, 
  handleCastVote 
} from "./routes/blog.ts";

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

  // Moderation route
  app.post("/api/moderate", handleModerate);

  // --- Secure Blog Routes (Requires Authentication) ---
  
  // Posts
  app.post("/api/blog/post", requireAuth, handleCreatePost);
  app.put("/api/blog/post/:id", requireAuth, handleUpdatePost);
  app.delete("/api/blog/post/:id", requireAuth, handleDeletePost);

  // Comments
  app.post("/api/blog/comment", requireAuth, handleAddComment);
  app.delete("/api/blog/comment/:id", requireAuth, handleDeleteComment);

  // Votes
  app.post("/api/blog/vote", requireAuth, handleCastVote);

  return app;
}