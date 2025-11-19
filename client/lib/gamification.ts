import { supabase } from "@/integrations/supabase/client";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import { BookOpen, MessageSquare, Users, Heart } from "lucide-react";
import React from "react";

// Seviye atlamak için gereken toplam EXP miktarları
// Seviye 1: 0-24 EXP, Seviye 2: 25-74 EXP, Seviye 3: 75-149 EXP vb.
export const LEVEL_THRESHOLDS = [0, 25, 75, 150, 300, 500, 1000];

export type BadgeDefinition = {
  name: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const ALL_BADGES: BadgeDefinition[] = [
  { name: "İlk Blog", description: "İlk blog yazını başarıyla yayınladın!", icon: BookOpen },
  { name: "Yorum Ustası", description: "Bir gönderiye ilk yorumu sen yaptın.", icon: MessageSquare },
  { name: "Topluluk Katılımcısı", description: "Platforma katıldığın için teşekkürler!", icon: Users },
  { name: "Beğenilen Yazar", description: "Bir blog yazısı 5'ten fazla beğeni aldı.", icon: Heart },
];

export const calculateLevel = (exp: number) => {
  let level = 1;
  for (let i = LEVEL_THRESHOLDS.length - 1; i >= 0; i--) {
    if (exp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
      break;
    }
  }
  return level;
};

export const getExpForNextLevel = (level: number) => {
  if (level >= LEVEL_THRESHOLDS.length) {
    return Infinity; // Max level
  }
  return LEVEL_THRESHOLDS[level];
};

// Kullanıcıya EXP ekleyen ve seviye kontrolü yapan fonksiyon
export const addExp = async (userId: string, amount: number): Promise<Partial<Profile> | null> => {
  const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('exp, level')
    .eq('id', userId)
    .single();

  if (fetchError || !currentProfile) {
    console.error("Error fetching user for EXP update:", fetchError);
    return null;
  }

  const newExp = currentProfile.exp + amount;
  const newLevel = calculateLevel(newExp);

  if (newLevel > currentProfile.level) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldunuz!`);
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ exp: newExp, level: newLevel })
    .eq('id', userId)
    .select('level, exp')
    .single();

  if (updateError) {
    console.error("Error updating user EXP:", updateError);
    return null;
  }

  return updatedProfile;
};

// Kullanıcıya yeni bir rozet veren fonksiyon
export const awardBadge = async (userId: string, badge: string): Promise<Partial<Profile> | null> => {
    const { data: currentProfile, error: fetchError } = await supabase
    .from('profiles')
    .select('badges')
    .eq('id', userId)
    .single();

  if (fetchError || !currentProfile) {
    console.error("Error fetching user for badge award:", fetchError);
    return null;
  }

  const currentBadges = currentProfile.badges || [];
  if (currentBadges.includes(badge)) {
    return null; // Already has the badge
  }

  const newBadges = [...currentBadges, badge];

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ badges: newBadges })
    .eq('id', userId)
    .select('badges')
    .single();
  
  if (updateError) {
    console.error("Error awarding badge:", updateError);
    return null;
  }

  toast.info("Yeni bir rozet kazandın!", { description: `"${badge}" rozeti profiline eklendi.` });
  return updatedProfile;
};