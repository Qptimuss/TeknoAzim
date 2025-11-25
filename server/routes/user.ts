import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";

// Extend the Express Request type to include the user property
declare global {
  namespace Express {
    interface Request {
      userId?: string;
    }
  }
}

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().max(200).optional().nullable(),
});

// Helper function to call the Edge Function for moderation
async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Invoke the Edge Function (using the existing comment moderation function)
  const { data, error } = await supabaseAdmin.functions.invoke('moderate-comment', {
    body: { content },
  });

  if (error) {
    console.error("Error invoking moderation function:", error);
    return { isModerated: true }; 
  }

  return data as { isModerated: boolean };
}

// PUT /api/user/profile
export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) {
    return res.status(401).json({ error: "User ID missing." });
  }

  try {
    const validatedData = updateProfileSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();
    
    const updatePayload: { name?: string, description?: string | null } = {};

    // Moderation for Name
    if (validatedData.name !== undefined) {
      const { isModerated } = await moderateContent(validatedData.name);
      if (!isModerated) {
        return res.status(403).json({ error: "Kullanıcı adı uygunsuz içerik barındırdığı için reddedildi." });
      }
      updatePayload.name = validatedData.name;
    }

    // Moderation for Description
    if (validatedData.description !== undefined) {
      if (validatedData.description !== null) {
        const { isModerated } = await moderateContent(validatedData.description);
        if (!isModerated) {
          return res.status(403).json({ error: "Profil açıklaması uygunsuz içerik barındırdığı için reddedildi." });
        }
      }
      updatePayload.description = validatedData.description;
    }

    if (Object.keys(updatePayload).length === 0) {
        return res.status(400).json({ error: "No valid fields provided for update." });
    }

    // Update the profile table
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .update(updatePayload)
      .eq('id', userId)
      .select('id, name, description')
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