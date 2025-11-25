import { Request, Response } from "express";
import { supabase } from "../integrations/supabase";

// EXP puanını güncelle
export const handleUpdateExp = async (req: Request, res: Response) => {
  const { exp } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("exp")
      .eq("id", user.id)
      .single();

    if (error) throw error;

    const newExp = data.exp + exp;

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ exp: newExp })
      .eq("id", user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: "EXP updated successfully" });
  } catch (error) {
    console.error("Error updating EXP:", error);
    res.status(500).json({ error: "Failed to update EXP" });
  }
};

// Rozet ve Elmas ödülü ver
export const handleAwardBadge = async (req: Request, res: Response) => {
  const { badge } = req.body;
  const user = req.user;

  if (!user) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("badges, gems")
      .eq("id", user.id)
      .single();

    if (profileError) throw profileError;

    if (profile.badges.includes(badge)) {
      return res.status(200).json({ message: "Badge already awarded" });
    }

    const newBadges = [...profile.badges, badge];
    const newGems = profile.gems + 30; // DÜZELTME: Rozet ödülü 30 Elmas olarak ayarlandı.

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ badges: newBadges, gems: newGems })
      .eq("id", user.id);

    if (updateError) throw updateError;

    res.status(200).json({ message: "Badge and gems awarded successfully" });
  } catch (error) {
    console.error("Error awarding badge:", error);
    res.status(500).json({ error: "Failed to award badge" });
  }
};

// Günlük Elmas ödülünü talep et
export const handleClaimDailyReward = async (req: Request, res: Response) => {
    const user = req.user;

    if (!user) {
        return res.status(401).json({ error: "Unauthorized" });
    }

    try {
        const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("gems, last_daily_reward_claimed_at")
            .eq("id", user.id)
            .single();

        if (profileError) throw profileError;

        const now = new Date();
        const lastClaimed = profile.last_daily_reward_claimed_at
            ? new Date(profile.last_daily_reward_claimed_at)
            : null;

        if (lastClaimed) {
            const hoursSinceLastClaim = (now.getTime() - lastClaimed.getTime()) / (1000 * 60 * 60);
            if (hoursSinceLastClaim < 24) {
                return res.status(429).json({ error: "Daily reward already claimed within the last 24 hours." });
            }
        }

        const newGems = profile.gems + 20; // DÜZELTME: Günlük ödül 20 Elmas olarak ayarlandı.

        const { error: updateError } = await supabase
            .from("profiles")
            .update({ gems: newGems, last_daily_reward_claimed_at: now.toISOString() })
            .eq("id", user.id);

        if (updateError) throw updateError;

        res.status(200).json({ message: "Daily reward claimed successfully", gems: newGems });
    } catch (error) {
        console.error("Error claiming daily reward:", error);
        res.status(500).json({ error: "Failed to claim daily reward" });
    }
};


// Sandık açma (Bu fonksiyon şimdilik bir yer tutucu)
export const handleOpenCrate = async (req: Request, res: Response) => {
    // Bu özellik gelecekte eklenecek.
    res.status(511).json({ message: "Not implemented yet" });
};