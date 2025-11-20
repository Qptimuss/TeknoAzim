import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

export const handleDeleteUser: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID missing." });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Supabase delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user account." });
    }

    // On successful deletion, Supabase's CASCADE constraint will handle the profile.
    res.status(204).send();
  } catch (e) {
    console.error("Error deleting user:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};