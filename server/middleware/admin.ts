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

  // Yeni log ekliyoruz
  console.log(`[requireAdmin] Checking ADMIN_EMAILS at middleware execution: ${process.env.ADMIN_EMAILS}`);
  console.log(`[requireAdmin] Parsed ADMIN_EMAILS array: ${ADMIN_EMAILS}`);


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
    const { data: userData, error } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email eq '${targetEmail}'`,
    } as any);

    if (userError || !userData.users || userData.users.length === 0) {
        return res.status(404).json({ error: "Target user not found in Auth system." });
    }

    const targetUserId = userData.users[0].id;

    // Calculate EXP needed for Level 10 (the highest title level)
    const MAX_LEVEL = 10;
    const EXP_FOR_MAX_LEVEL = calculateExpForLevel(MAX_LEVEL);

    // 2. Update the target user's profile with all items
    const updatePayload = {
      owned_frames: ALL_FRAME_NAMES,
      selected_frame: ALL_FRAME_NAMES[ALL_FRAME_NAMES.length - 1], // Set the last one (Nova) as selected
      badges: ALL_BADGE_NAMES, // Grant all badges
      selected_title: ALL_TITLE_NAMES[ALL_TITLE_NAMES.length - 1], // Set the last title
      exp: EXP_FOR_MAX_LEVEL, // Set max EXP
      level: MAX_LEVEL, // Set max level
    };

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', targetUserId) 
      .select('*')
      .single();

    if (updateError) {
      console.error("Supabase profile update error:", updateError);
      return res.status(500).json({ error: "Failed to grant items to profile." });
    }

    console.log(`Admin ${adminId} successfully granted all items to user ${targetUserId} (${targetEmail}).`);
    
    res.status(200).json({ 
        message: `All items granted to ${targetEmail}.`,
        profile: updatedProfile,
    });

  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error granting all items:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};