import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";

// --- Profil Güncelleme Mantığı ---

const updateProfileSchema = z.object({
  name: z.string().min(2, "İsim en az 2 karakter olmalıdır.").optional(),
  avatar_url: z.string().url("Geçerli bir URL olmalıdır.").nullable().optional(),
  description: z.string().max(200, "Açıklama en fazla 200 karakter olabilir.").nullable().optional(),
  selected_title: z.string().nullable().optional(),
  selected_frame: z.string().nullable().optional(),
});

export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = updateProfileSchema.partial().parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    if (Object.keys(validatedData).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update." });
    }

    const { data, error } = await (supabaseAdmin
      .from("profiles") as any) // Hata 3'ü düzeltmek için 'as any' eklendi
      .update(validatedData)
      .eq('id', userId) 
      .select('id, name, avatar_url, description, selected_title, selected_frame')
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


// --- Kullanıcı Silme Mantığı ---

export const handleDeleteUser: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID missing." });
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error(`Error deleting user ${userId}:`, error);
      return res.status(500).json({ error: "Failed to delete user account." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Server error during user deletion:", e);
    res.status(500).json({ error: "Internal server error during account deletion." });
  }
};