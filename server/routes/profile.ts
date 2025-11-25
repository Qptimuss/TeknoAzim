import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin.ts";
import { z } from "zod";
import { Database } from "../lib/database.types.ts";

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(), // Made optional for partial updates
  avatar_url: z.string().url("Geçerli bir URL olmalıdır.").optional().or(z.literal('')),
  description: z.string().max(200).optional().or(z.literal('')),
  selected_title: z.string().optional().nullable(), // Added
  selected_frame: z.string().optional().nullable(), // Added
});

// PUT /api/profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    // Allow partial updates by using .partial()
    const validatedData = updateProfileSchema.partial().parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // Supabase'e boş string yerine null göndermek için dönüşüm yapıyoruz.
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      name: validatedData.name,
      avatar_url: validatedData.avatar_url === '' ? null : validatedData.avatar_url,
      description: validatedData.description === '' ? null : validatedData.description,
      selected_title: validatedData.selected_title,
      selected_frame: validatedData.selected_frame,
    };
    
    // Remove undefined keys to allow partial updates
    Object.keys(updatePayload).forEach(key => updatePayload[key as keyof typeof updatePayload] === undefined && delete updatePayload[key as keyof typeof updatePayload]);

    if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update." });
    }

    // FIX 5: Cast the result of .from() to any
    const { data, error } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', userId) 
      .select('id, name, avatar_url, description, selected_title, selected_frame') // Select updated fields
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