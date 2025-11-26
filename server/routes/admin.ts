import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { ALL_FRAME_NAMES } from "../lib/store-items";
import { ALL_TITLE_NAMES } from "../lib/gamification-constants";
import { z } from "zod";

const grantAllSchema = z.object({
  targetEmail: z.string().email(),
});

// POST /api/admin/grant-all
export const handleGrantAll: RequestHandler = async (req, res) => {
  // req.userId is the ID of the authenticated admin user making the request
  const adminId = req.userId; 

  try {
    const validatedData = grantAllSchema.parse(req.body);
    const { targetEmail } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Find the target user ID by email using the filter option
    // listUsers expects an options object as the first argument.
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.listUsers({
        filter: `email eq '${targetEmail}'`,
    });

    if (userError || !userData.users || userData.users.length === 0) {
        return res.status(404).json({ error: "Target user not found in Auth system." });
    }

    const targetUserId = userData.users[0].id;

    // 2. Update the target user's profile with all items
    const updatePayload = {
      owned_frames: ALL_FRAME_NAMES,
      selected_frame: ALL_FRAME_NAMES[ALL_FRAME_NAMES.length - 1], // Set the last one (Nova) as selected
      selected_title: ALL_TITLE_NAMES[ALL_TITLE_NAMES.length - 1], // Set the last one as selected
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