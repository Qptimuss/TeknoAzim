import "dotenv/config";
import express from "express";
import cors from "cors";
import { handleDemo } from "./routes/demo";
import { handleModerate } from "./routes/moderate";
import { requireAuth } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";
import { 
  handleCreatePost, 
  handleUpdatePost, 
  handleDeletePost, 
  handleAddComment, 
  handleDeleteComment, 
  handleCastVote 
} from "./routes/blog";
import { handleUpdateProfile } from "./routes/profile";
import { handleDeleteUser } from "./routes/user";
import { 
  handleUpdateExp, 
  handleAwardBadge, 
  handleClaimDailyReward, 
  handleOpenCrate 
} from "./routes/gamification";
import { handleCreateAnnouncement } from "./routes/announcement";

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

  // --- Secure Routes (Requires Authentication) ---

  // Profile
  app.put("/api/profile", requireAuth, handleUpdateProfile);

  // Gamification (NEW SECURE ENDPOINTS)
  app.post("/api/gamification/exp", requireAuth, handleUpdateExp);
  app.post("/api/gamification/badge", requireAuth, handleAwardBadge);
  app.post("/api/gamification/daily-reward", requireAuth, handleClaimDailyReward);
  app.post("/api/gamification/open-crate", requireAuth, handleOpenCrate);

  // Posts
  app.post("/api/blog/post", requireAuth, handleCreatePost);
  app.put("/api/blog/post/:id", requireAuth, handleUpdatePost);
  app.delete("/api/blog/post/:id", requireAuth, handleDeletePost);

  // Comments
  app.post("/api/blog/comment", requireAuth, handleAddComment);
  app.delete("/api/blog/comment/:id", requireAuth, handleDeleteComment);

  // Votes
  app.post("/api/blog/vote", requireAuth, handleCastVote);

  // User
  app.delete("/api/user", requireAuth, handleDeleteUser);

  // Announcements (Requires Admin)
  app.post("/api/announcement", requireAuth, requireAdmin, handleCreateAnnouncement);

  return app;
}