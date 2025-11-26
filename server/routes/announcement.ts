import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";

const announcementSchema = z.object({
  title: z.string().min(5),
  content: z.string().min(20),
});

// POST /api/announcement (Admin only)
export const handleCreateAnnouncement: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = announcementSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    const insertPayload: Database['public']['Tables']['announcements']['Insert'] = {
        title: validatedData.title,
        content: validatedData.content,
        user_id: userId,
    };

    const { data, error } = await (supabaseAdmin
      .from("announcements") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      // Hata detayını konsola yazdır
      console.error("Supabase insert announcement error:", error);
      // İstemciye daha açıklayıcı bir hata mesajı gönder
      return res.status(500).json({ error: "Failed to create announcement.", details: error.message });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error creating announcement:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// GET /api/announcement (Public access)
export const handleGetAnnouncements: RequestHandler = async (_req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all announcements, ordered by creation date
    const { data, error } = await supabaseAdmin
      .from("announcements")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Supabase fetch announcements error:", error);
      return res.status(500).json({ error: "Failed to fetch announcements." });
    }

    res.status(200).json(data);
  } catch (e) {
    console.error("Error fetching announcements:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};