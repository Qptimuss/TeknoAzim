import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import { handleDemo } from "./routes/demo";
import { requireAuth } from "./middleware/auth";
import { requireAdmin } from "./middleware/admin";

import { handleDeleteUser, handleUpdateProfile, handleAdminDeleteUser } from "./routes/user";

import {
  handleCreatePost,
  handleUpdatePost,
  handleDeletePost,
  handleAddComment,
  handleDeleteComment,
  handleCastVote,
} from "./routes/blog";

import {
  handleUpdateExp,
  handleAwardBadge,
  handleClaimDailyReward,
  handleOpenCrate,
} from "./routes/gamification";

import {
  handleCreateAnnouncement,
  handleGetAnnouncements,
  handleUpdateAnnouncement,
  handleDeleteAnnouncement,
} from "./routes/announcement";

import { handleCheckEnv } from "./routes/check-env";
import { handleGetAnnouncementById } from "./routes/announcement";
import { handleGetLeaderboardProfiles } from "./routes/leaderboard"; // Yeni import

export function createServer(env?: Record<string, string | undefined>) {
  // Load .env variables
  dotenv.config();
  console.log(`[createServer] After initial dotenv.config(), ADMIN_EMAILS: ${process.env.ADMIN_EMAILS ? 'Set' : 'Not Set'}`);


  // Merge passed env variables into process.env
  if (env) {
    console.log("[createServer] Merging environment variables from function handler...");
    for (const key in env) {
      if (env[key]) {
        process.env[key] = env[key];
      }
    }
    console.log(`[createServer] After merge, ADMIN_EMAILS: ${process.env.ADMIN_EMAILS ? 'Set' : 'Not Set'}`);
  }

  console.log("Creating Express server...");
  console.log(`[createServer] Final check, SUPABASE_URL is set: ${!!process.env.SUPABASE_URL}`);
  console.log(`[createServer] Final check, SUPABASE_SERVICE_ROLE_KEY is set: ${!!process.env.SUPABASE_SERVICE_ROLE_KEY}`);
  console.log(`[createServer] Final check, ADMIN_EMAILS value: ${process.env.ADMIN_EMAILS}`);


  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // --- Diagnostic Route ---
  app.get("/api/check-env", handleCheckEnv);

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  app.get("/api/demo", handleDemo);

  // User routes
  app.delete("/api/user", requireAuth, handleDeleteUser);
  app.put("/api/profile", requireAuth, handleUpdateProfile);

  // Blog routes
  app.post("/api/blog/post", requireAuth, handleCreatePost);
  app.put("/api/blog/post/:id", requireAuth, handleUpdatePost);
  app.delete("/api/blog/post/:id", requireAuth, handleDeletePost);

  // Comment
  app.post("/api/blog/comment", requireAuth, handleAddComment);
  app.delete("/api/blog/comment/:id", requireAuth, handleDeleteComment);

  // Vote
  app.post("/api/blog/vote", requireAuth, handleCastVote);

  // Gamification
  app.post("/api/gamification/exp", requireAuth, handleUpdateExp);
  app.post("/api/gamification/badge", requireAuth, handleAwardBadge);
  app.post("/api/gamification/daily-reward", requireAuth, handleClaimDailyReward);
  app.post("/api/gamification/open-crate", requireAuth, handleOpenCrate);

  // Admin
  app.delete("/api/admin/user/:id", requireAuth, requireAdmin, handleAdminDeleteUser);

  // Announcements
  app.post("/api/announcement", requireAuth, requireAdmin, handleCreateAnnouncement);
  app.get("/api/announcement", handleGetAnnouncements);
  app.get("/api/announcement/:id", handleGetAnnouncementById);
  app.put("/api/announcement/:id", requireAuth, requireAdmin, handleUpdateAnnouncement);
  app.delete("/api/announcement/:id", requireAuth, requireAdmin, handleDeleteAnnouncement);

  // Leaderboard
  app.get("/api/leaderboard/profiles", handleGetLeaderboardProfiles); // Yeni rota

  return app;
}