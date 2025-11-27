import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";

// GET /api/user/profile/:id
export const handleGetProfileById: RequestHandler = async (req, res) => {
  const { id } = req.params;
  if (!id) return res.status(400).json({ error: "User ID is required." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      // Supabase returns this code when no rows are found for .single()
      if (error.code === 'PGRST116') {
        return res.status(404).json({ error: "Profile not found." });
      }
      throw error;
    }

    if (!data) return res.status(404).json({ error: "Profile not found." });

    res.status(200).json(data);
  } catch (e: any) {
    console.error(`Error fetching profile for user ${id}:`, e);
    res.status(500).json({ error: "Internal server error.", details: e.message });
  }
};

// GET /api/user/posts/:userId
export const handleGetPostsByUserId: RequestHandler = async (req, res) => {
    const { userId } = req.params;
    if (!userId) return res.status(400).json({ error: "User ID is required." });

    try {
        const supabaseAdmin = getSupabaseAdmin();
        const { data, error } = await supabaseAdmin
            .from('blog_posts')
            .select('*, profiles(*)')
            .eq('user_id', userId)
            .order('created_at', { ascending: false });

        if (error) throw error;

        res.status(200).json(data);
    } catch (e: any) {
        console.error(`Error fetching posts for user ${userId}:`, e);
        res.status(500).json({ error: "Internal server error.", details: e.message });
    }
};