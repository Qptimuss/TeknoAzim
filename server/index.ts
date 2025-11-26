import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { requireAuth } from "./middleware/auth";
import { handleDeleteUser, handleUpdateProfile } from "./routes/user";
import { 
  handleCreatePost, 
  handleUpdatePost, 
  handleDeletePost, 
  handleAddComment, 
  handleDeleteComment, 
  handleCastVote 
} from "./routes/blog";
import {
  handleUpdateExp,
  handleAwardBadge,
  handleClaimDailyReward,
  handleOpenCrate
} from "./routes/gamification";

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

  // User routes
  app.delete("/api/user", requireAuth, handleDeleteUser);
  app.put("/api/profile", requireAuth, handleUpdateProfile);

  // Blog Post Routes (Requires Auth for CUD operations)
  app.post("/api/blog/post", requireAuth, handleCreatePost);
  app.put("/api/blog/post/:id", requireAuth, handleUpdatePost);
  app.delete("/api/blog/post/:id", requireAuth, handleDeletePost);

  // Comment Routes (Requires Auth)
  app.post("/api/blog/comment", requireAuth, handleAddComment);
  app.delete("/api/blog/comment/:id", requireAuth, handleDeleteComment);

  // Vote Routes (Requires Auth)
  app.post("/api/blog/vote", requireAuth, handleCastVote);

  // Gamification Routes (Requires Auth)
  app.post("/api/gamification/exp", requireAuth, handleUpdateExp);
  app.post("/api/gamification/badge", requireAuth, handleAwardBadge);
  app.post("/api/gamification/daily-reward", requireAuth, handleClaimDailyReward);
  app.post("/api/gamification/open-crate", requireAuth, handleOpenCrate);

  return app;
}