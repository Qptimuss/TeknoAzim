import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

/**
 * Middleware to verify the user's session via the Authorization header
 * and attach the user ID to req.userId.
 */
export const requireAuth: RequestHandler = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: "Unauthorized: Missing or invalid token." });
  }

  const token = authHeader.split(' ')[1];

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // Use supabaseAdmin to verify the JWT
    const { data, error } = await supabaseAdmin.auth.getUser(token);

    if (error || !data.user) {
      console.error("JWT verification failed:", error?.message);
      return res.status(401).json({ error: "Unauthorized: Invalid token." });
    }

    // Attach the authenticated user's ID to the request
    req.userId = data.user.id;
    next();
  } catch (e) {
    console.error("Error during token verification:", e);
    res.status(500).json({ error: "Internal server error during authentication." });
  }
};