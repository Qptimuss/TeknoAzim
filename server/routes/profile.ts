import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin.ts";
import { z } from "zod";
import { Database } from "../lib/database.types.ts";

const updateProfileSchema = z.object({
  name: z.string().min(2),
  // Avatar URL'si boş string veya null olabilir, ancak varsa geçerli bir URL olmalıdır.
  avatar_url: z.string().url("Geçerli bir URL olmalıdır.").optional().or(z.literal('')),
  // Açıklama boş string veya null olabilir, maks 200 karakter.
  description: z.string().max(200).optional().or(z.literal('')),
});

// PUT /api/profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // Supabase'e boş string yerine null göndermek için dönüşüm yapıyoruz.
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      name: validatedData.name,
      avatar_url: validatedData.avatar_url || null,
      description: validatedData.description || null,
    };

    // FIX 5: Keep 'as any' cast for update
    const { data, error } = await supabaseAdmin
      .from("profiles")
      .update(updatePayload as any)
      .eq('id', userId) 
      .select('id, name, avatar_url, description')
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