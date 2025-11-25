import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin.ts";
import { z } from "zod";
import { Database } from "../lib/database.types.ts";
import { SERVER_EXP_ACTIONS, BADGE_REWARD_GEMS } from "../lib/gamification-constants.ts";

// --- Helper Functions (Crucial for server-side level calculation) ---

const getExpForNextLevel = (level: number): number => {
  if (level <= 0) return 25;
  return level * 25;
};

const calculateLevel = (exp: number): { level: number, expForNextLevel: number, currentLevelExp: number } => {
  let level = 1;
  let cumulativeExp = 0;

  while (exp >= cumulativeExp + getExpForNextLevel(level)) {
    cumulativeExp += getExpForNextLevel(level);
    level++;
  }
  
  // Note: We only need the final level for the update logic.
  return { level, expForNextLevel: getExpForNextLevel(level), currentLevelExp: cumulativeExp };
};

// --- Schemas ---

const expUpdateSchema = z.object({
  // Client now sends the action type, not the amount or action (add/remove)
  actionType: z.enum(['CREATE_POST', 'REMOVE_POST', 'CREATE_COMMENT']),
});

const badgeAwardSchema = z.object({
  badgeName: z.string().min(1),
});

const crateOpenSchema = z.object({
  cost: z.number().int().positive(),
});

// --- Handlers ---

// POST /api/gamification/exp
export const handleUpdateExp: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = expUpdateSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();
    
    const actionKey = validatedData.actionType;
    const expChange = SERVER_EXP_ACTIONS[actionKey];

    if (expChange === undefined) {
        return res.status(400).json({ error: "Invalid gamification action type." });
    }

    // 1. Fetch current profile data
    const { data: profileData, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('exp, level, selected_title')
      .eq('id', userId)
      .single();

    type ExpProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'exp' | 'level' | 'selected_title'>;
    const profile = profileData as ExpProfile | null;

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    let newExp = (profile.exp || 0) + expChange;
    newExp = Math.max(0, newExp); // Ensure EXP doesn't go below zero

    const { level: newLevel } = calculateLevel(newExp);
    
    // 2. Update profile
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      exp: newExp,
      level: newLevel,
    };
    
    // If level drops, check if selected title needs to be removed (simplified check)
    if (newLevel < profile.level && profile.selected_title) {
        // We rely on the client to handle the title selection logic based on the new level.
        // For now, we won't force remove the title here unless we implement the full TITLES logic on the server.
    }

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', userId) 
      .select('*')
      .single();

    if (updateError) {
      console.error("Supabase EXP update error:", updateError);
      return res.status(500).json({ error: "Failed to update EXP." });
    }

    res.status(200).json(updatedProfile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error updating EXP:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/gamification/badge
export const handleAwardBadge: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = badgeAwardSchema.parse(req.body);
    const { badgeName } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();
    
    // 1. Fetch current profile data
    const { data: profileData, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('badges, exp, level, gems')
      .eq('id', userId)
      .single();

    type BadgeProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'badges' | 'exp' | 'level' | 'gems'>;
    const profile = profileData as BadgeProfile | null;

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const currentBadges = profile.badges || [];
    if (currentBadges.includes(badgeName)) {
      // Already has badge, return current profile (200 OK)
      return res.status(200).json(profile); 
    }

    // --- Server-side fixed rewards for earning a badge ---
    const expReward = SERVER_EXP_ACTIONS.EARN_BADGE;
    const gemReward = BADGE_REWARD_GEMS; 
    // -----------------------------------------------------

    const newBadges = [...currentBadges, badgeName];
    const newExp = (profile.exp || 0) + expReward;
    const newGems = (profile.gems || 0) + gemReward; 
    const { level: newLevel } = calculateLevel(newExp);

    // 2. Update profile
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      badges: newBadges,
      exp: newExp,
      level: newLevel,
      gems: newGems,
    };

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', userId) 
      .select('*')
      .single();

    if (updateError) {
      console.error("Supabase badge update error:", updateError);
      return res.status(500).json({ error: "Failed to award badge." });
    }

    res.status(200).json(updatedProfile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error awarding badge:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/gamification/daily-reward
export const handleClaimDailyReward: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch current profile data
    const { data: profileData, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('gems, last_daily_reward_claimed_at')
      .eq('id', userId)
      .single();

    type DailyRewardProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'gems' | 'last_daily_reward_claimed_at'>;
    const profile = profileData as DailyRewardProfile | null;

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    const lastClaimed = profile.last_daily_reward_claimed_at
      ? new Date(profile.last_daily_reward_claimed_at)
      : null;
    const today = new Date();
    
    // Helper to check if the last reward was claimed today
    const isSameDay = (d1: Date, d2: Date) => {
      return (
        d1.getFullYear() === d2.getFullYear() &&
        d1.getMonth() === d2.getMonth() &&
        d1.getDate() === d2.getDate()
      );
    };

    if (lastClaimed && isSameDay(lastClaimed, today)) {
      return res.status(409).json({ error: "Daily reward already claimed today." });
    }

    // --- Server-side fixed reward ---
    const DAILY_REWARD_GEMS = 20;
    // --------------------------------

    const newGems = (profile.gems || 0) + DAILY_REWARD_GEMS;
    
    // 2. Update profile
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      gems: newGems,
      last_daily_reward_claimed_at: today.toISOString(),
    };

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', userId) 
      .select('*')
      .single();

    if (updateError) {
      console.error("Supabase daily reward update error:", updateError);
      return res.status(500).json({ error: "Failed to claim daily reward." });
    }

    res.status(200).json(updatedProfile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error claiming daily reward:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/gamification/open-crate
export const handleOpenCrate: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = crateOpenSchema.parse(req.body);
    const { cost } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();

    // 1. Fetch current profile data
    const { data: profileData, error: fetchError } = await supabaseAdmin
      .from('profiles')
      .select('gems, owned_frames')
      .eq('id', userId)
      .single();

    type CrateProfile = Pick<Database['public']['Tables']['profiles']['Row'], 'gems' | 'owned_frames'>;
    const profile = profileData as CrateProfile | null;

    if (fetchError || !profile) {
      return res.status(404).json({ error: "Profile not found." });
    }

    if ((profile.gems || 0) < cost) {
      return res.status(403).json({ error: "Insufficient gems." });
    }

    // --- Crate Opening Logic (Simplified for now) ---
    
    // Define minimal item pool here for server-side control
    const MOCK_FRAMES = [
      { name: 'Klasik Bronz', rarity: 'Sıradan' },
      { name: 'Çift Halkalı Altın', rarity: 'Sıradışı' },
      { name: 'Kraliyet Moru', rarity: 'Ender' },
    ];

    const ownedFrames = profile.owned_frames || [];
    const unownedFrame = MOCK_FRAMES.find(f => !ownedFrames.includes(f.name));
    
    let newOwnedFrames = ownedFrames;
    let itemWon = null;

    if (unownedFrame) {
      newOwnedFrames = [...ownedFrames, unownedFrame.name];
      itemWon = unownedFrame.name;
    } else {
      // If all frames owned, give 5 gems back (fallback)
      itemWon = "5 Gem (Tüm çerçeveler zaten sende)";
    }

    const newGems = (profile.gems || 0) - cost + (itemWon.includes("Gem") ? 5 : 0);

    // 2. Update profile
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      gems: newGems,
      owned_frames: newOwnedFrames,
    };

    const { data: updatedProfile, error: updateError } = await (supabaseAdmin
      .from("profiles") as any)
      .update(updatePayload)
      .eq('id', userId) 
      .select('*')
      .single();

    if (updateError) {
      console.error("Supabase crate open error:", updateError);
      return res.status(500).json({ error: "Failed to open crate." });
    }

    // Return the updated profile and the item won
    res.status(200).json({ updatedProfile, itemWon });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error opening crate:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};