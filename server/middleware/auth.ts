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
      
      // Supabase Auth hatasını doğrudan döndür
      return res.status(401).json({ 
        error: "Unauthorized: Invalid token or session expired.",
        details: error?.message || "Token verification failed."
      });
    }

    // Attach the authenticated user's ID to the request
    req.userId = data.user.id;
    next();
  } catch (e) {
    // Catch errors from getSupabaseAdmin (e.g., missing service key) or JWT verification issues
    console.error("Error during token verification or admin client initialization:", e);
    
    // Eğer hata bir Error nesnesiyse, mesajını döndür.
    const errorMessage = e instanceof Error ? e.message : "Internal server error during authentication.";
    
    // Eğer hata Supabase Admin Client'ın başlatılmasıyla ilgiliyse (ki check-env true dediği için bu düşük ihtimal)
    if (errorMessage.includes("SUPABASE_SERVICE_ROLE_KEY is missing")) {
      return res.status(500).json({ error: "Server configuration error: Supabase Service Role Key is missing." });
    }

    res.status(500).json({ error: errorMessage });
  }
};