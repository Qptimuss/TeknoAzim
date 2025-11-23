import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";

// Schema for profile updates
const updateProfileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").optional(),
  description: z.string().max(200, "Açıklama 200 karakteri geçemez.").optional().nullable(),
  selected_title: z.string().optional().nullable(),
  selected_frame: z.string().optional().nullable(),
  gems: z.number().optional(),
  owned_frames: z.array(z.string()).optional(),
  avatar_url: z.string().url().optional().nullable(),
});

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID missing." });
  }

  try {
    const validatedData = updateProfileSchema.parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }

    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(validatedData)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.error("Supabase profile update error:", error);
      return res.status(500).json({ error: "Failed to update profile." });
    }

    res.status(200).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error updating profile:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

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