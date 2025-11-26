import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar_url: z.string().url().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  selected_title: z.string().nullable().optional(),
  selected_frame: z.string().nullable().optional(),
});

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = updateProfileSchema.partial().parse(req.body);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Explicitly cast to the correct Supabase Update type
    const updatePayload = validatedData as Database['public']['Tables']['profiles']['Update'];

    const { data, error } = await (supabaseAdmin
      .from("profiles") as any)        
      .update(updatePayload) 
      .eq("id", userId)
      .select("id, name, avatar_url, description, selected_title, selected_frame")
      .single();

    if (error) {
      console.error("Supabase update profile error:", error);
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
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Delete the user from the auth system. This should cascade to the profiles table.
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Supabase delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user account." });
    }

    // Note: Supabase automatically handles session invalidation upon user deletion.
    res.status(204).send();
  } catch (e) {
    console.error("Error deleting user:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};