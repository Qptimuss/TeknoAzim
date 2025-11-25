import { RequestHandler } from "express";

// WARNING: In a production environment, this list should be managed securely, 
// ideally via environment variables (e.g., comma-separated list of IDs) or a database lookup.
const ADMIN_USER_IDS = [
  "admin_user_id_1", // Replace with actual admin user IDs
];

/**
 * Middleware to check if the authenticated user is an administrator.
 * Requires requireAuth middleware to run first (req.userId must be present).
 */
export const requireAdmin: RequestHandler = (req, res, next) => {
  const userId = req.userId;

  if (!userId) {
    // This should ideally not happen if requireAuth runs first
    return res.status(401).json({ error: "Unauthorized: User ID missing." });
  }

  // Check if the user ID is in the list of administrators
  if (!ADMIN_USER_IDS.includes(userId)) {
    return res.status(403).json({ error: "Forbidden: Admin privileges required." });
  }

  next();
};