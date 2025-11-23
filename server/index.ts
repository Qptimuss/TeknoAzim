import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { requireAuth } from "./middleware/auth";
import { checkToxicity } from "./middleware/toxicity";
import { handleDeleteUser, handleUpdateProfile } from "./routes/user";
import { 
  handleCreatePost, 
  handleUpdatePost, 
  handleAddComment,
  handleDeletePost,
  handleDeleteComment,
  handleCastVote
} from "./routes/blog";

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

  // Blog routes with toxicity checks
  app.post("/api/blog/post", requireAuth, checkToxicity, handleCreatePost);
  app.put("/api/blog/post/:id", requireAuth, checkToxicity, handleUpdatePost);
  app.delete("/api/blog/post/:id", requireAuth, handleDeletePost);
  
  app.post("/api/blog/comment", requireAuth, checkToxicity, handleAddComment);
  app.delete("/api/blog/comment/:id", requireAuth, handleDeleteComment);

  app.post("/api/blog/vote", requireAuth, handleCastVote);

  // User routes with toxicity checks
  app.put("/api/user/profile", requireAuth, checkToxicity, handleUpdateProfile);
  app.delete("/api/user", requireAuth, handleDeleteUser);

  return app;
}