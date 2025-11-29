import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

// WARNING: In a production environment, this list should be managed securely, 
// ideally via environment variables or a database lookup.
// We now rely on an environment variable for the admin list.
const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim()).filter(e => e.length > 0);

/**
 * Middleware to check if the authenticated user is an administrator by checking their email.
 * Requires requireAuth middleware to run first (req.userId must be present).
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const userId = req.userId;

  if (!userId) {
    // This should ideally not happen if requireAuth runs first
    return res.status(401).json({ error: "Unauthorized: User ID missing." });
  }

  // If no ADMIN_EMAILS are configured, deny access by default
  if (ADMIN_EMAILS.length === 0) {
    console.warn("Admin check failed: ADMIN_EMAILS environment variable is not set.");
    return res.status(403).json({ error: "Forbidden: Admin privileges required (Server not configured)." });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Fetch user details (specifically email) using the admin client
    const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (error || !userData.user) {
        console.error("Admin check failed: User not found or error fetching user details:", error?.message);
        return res.status(401).json({ error: "Unauthorized: Invalid user details." });
    }

    const userEmail = userData.user.email;

    // 2. Check if the user's email is in the list of administrators
    if (!userEmail || !ADMIN_EMAILS.includes(userEmail)) {
      return res.status(403).json({ error: "Forbidden: Admin privileges required." });
    }

    next();
  } catch (e) {
    console.error("Error during admin check:", e);
    res.status(500).json({ error: "Internal server error during admin check." });
  }
};