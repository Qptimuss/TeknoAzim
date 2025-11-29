import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin.ts";
import { z } from "zod";
import { Database } from "../lib/database.types.ts";
import { SERVER_EXP_ACTIONS, BADGE_REWARD_GEMS } from "../lib/gamification-constants.ts";
import { FRAMES, RARITIES } from "../lib/store-items.ts";
import { parseBody } from "../lib/body-parser.ts";

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
  
  return { level, expForNextLevel: getExpForNextLevel(level), currentLevelExp: cumulativeExp };
};

// --- Schemas ---

const expUpdateSchema = z.object({
  actionType: z.enum(['CREATE_POST', 'REMOVE_POST', 'CREATE_COMMENT']),
});

const badgeAwardSchema = z.object({
  badgeName: z.string().min(1),
});

const crateOpenSchema = z.object({
  cost: z.number().int().positive(),
});

// --- Crate Logic ---

const REFUND_AMOUNTS: { [key: string]: number } = {
  [RARITIES.SIRADAN.name]: 5,
  [RARITIES.SIRADISI.name]: 10,
  [RARITIES.ENDER.name]: 15,
  [RARITIES.EFSANEVI.name]: 25,
  [RARITIES.ÖZEL.name]: 100,
};

const selectRandomFrame = () => {
  const rand = Math.random() * 100;
  let selectedRarityName: string;

  if (rand < 0.5) selectedRarityName = RARITIES.ÖZEL.name; // %0.5 şans
  else if (rand < 5.5) selectedRarityName = RARITIES.EFSANEVI.name; // %5 şans (5.5 - 0.5)
  else if (rand < 20.5) selectedRarityName = RARITIES.ENDER.name; // %15 şans (20.5 - 5.5)
  else if (rand < 50.5) selectedRarityName = RARITIES.SIRADISI.name; // %30 şans (50.5 - 20.5)
  else selectedRarityName = RARITIES.SIRADAN.name; // %49.5 şans (100 - 50.5)

  const framesInRarity = FRAMES.filter(frame => frame.rarity === selectedRarityName);
  if (framesInRarity.length === 0) {
    // Eğer seçilen nadirlikte çerçeve yoksa, sıradan bir çerçeve ver
    const commonFrames = FRAMES.filter(frame => frame.rarity === RARITIES.SIRADAN.name);
    return commonFrames[Math.floor(Math.random() * commonFrames.length)];
  }
  return framesInRarity[Math.floor(Math.random() * framesInRarity.length)];
};


// --- Handlers ---

export const handleUpdateExp: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validatedData = expUpdateSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();
    
    const actionKey = validatedData.actionType;
    const expChange = SERVER_EXP_ACTIONS[actionKey];

    if (expChange === undefined) {
        return res.status(400).json({ error: "Invalid gamification action type." });
    }

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
    newExp = Math.max(0, newExp);

    const { level: newLevel } = calculateLevel(newExp);
    
    const updatePayload: Database['public']['Tables']['profiles']['Update'] = {
      exp: newExp,
      level: newLevel,
    };
    
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

export const handleAwardBadge: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validatedData = badgeAwardSchema.parse(bodyData);
    const { badgeName } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();
    
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
      return res.status(200).json(profile); 
    }

    const expReward = SERVER_EXP_ACTIONS.EARN_BADGE;
    const gemReward = BADGE_REWARD_GEMS; 

    const newBadges = [...currentBadges, badgeName];
    const newExp = (profile.exp || 0) + expReward;
    const newGems = (profile.gems || 0) + gemReward; 
    const { level: newLevel } = calculateLevel(newExp);

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

export const handleClaimDailyReward: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    // Daily reward handler does not require parsing body data, but we keep the pattern for consistency if it were to change.
    // const bodyData = parseBody(req); // Not needed here, but keeping the pattern in mind.
    const supabaseAdmin = getSupabaseAdmin();

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

    const DAILY_REWARD_GEMS = 20;
    const newGems = (profile.gems || 0) + DAILY_REWARD_GEMS;
    
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

export const handleOpenCrate: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validatedData = crateOpenSchema.parse(bodyData);
    const { cost } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();

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

    const itemWon = selectRandomFrame();
    const ownedFrames = profile.owned_frames || [];
    const isOwned = ownedFrames.includes(itemWon.name);

    let newGems = (profile.gems || 0) - cost;
    let newOwnedFrames = ownedFrames;
    let refund = 0;

    if (isOwned) {
      refund = REFUND_AMOUNTS[itemWon.rarity] || 5;
      newGems += refund;
    } else {
      newOwnedFrames = [...ownedFrames, itemWon.name];
    }

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

    res.status(200).json({ updatedProfile, itemWon, alreadyOwned: isOwned, refundAmount: refund });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error opening crate:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};