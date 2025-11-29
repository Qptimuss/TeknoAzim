import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

/**
 * Middleware to check if the authenticated user is an administrator by checking their email.
 * Requires requireAuth middleware to run first (req.userId must be present).
 */
export const requireAdmin: RequestHandler = async (req, res, next) => {
  const userId = req.userId;

  // ADMIN_EMAILS'i burada, fonksiyonun içinde okuyoruz, böylece process.env'in tamamen yüklendiğinden emin oluruz.
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim()).filter(e => e.length > 0);

  console.log(`[requireAdmin] Checking ADMIN_EMAILS at middleware execution: ${process.env.ADMIN_EMAILS}`);
  console.log(`[requireAdmin] Parsed ADMIN_EMAILS array: ${ADMIN_EMAILS}`);

  if (!userId) {
    return res.status(401).json({ error: "Unauthorized: User ID missing." });
  }

  if (ADMIN_EMAILS.length === 0) {
    console.warn("Admin check failed: ADMIN_EMAILS environment variable is not set or empty.");
    return res.status(403).json({ error: "Forbidden: Admin privileges required (Server not configured)." });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    
    // Mevcut kimliği doğrulanmış kullanıcının e-postasını almak için detaylarını çekiyoruz
    const { data: { user }, error: userFetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userFetchError || !user || !user.email) {
      console.error("Error fetching admin user details:", userFetchError?.message);
      return res.status(403).json({ error: "Forbidden: Could not verify admin user email." });
    }

    if (!ADMIN_EMAILS.includes(user.email)) {
      console.warn(`Admin check failed: User ${user.email} is not in ADMIN_EMAILS list.`);
      return res.status(403).json({ error: "Forbidden: Admin privileges required." });
    }

    next(); // Kullanıcı bir admin, bir sonraki middleware/işleyiciye geç
  } catch (e) {
    console.error("Error during admin check:", e);
    res.status(500).json({ error: "Internal server error during admin check." });
  }
};