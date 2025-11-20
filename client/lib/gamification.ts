import { supabase } from "@/integrations/supabase/client";
import { Award, BookOpen, MessageSquare, ThumbsUp } from "lucide-react";
import { Profile } from "@shared/api";
import { toast } from "sonner";

// --- ÜNVAN SİSTEMİ ---
export const TITLES: { [key: number]: string } = {
  1: "Yeni Blogger",
  2: "Gelişen Yazar",
  3: "Topluluk Üyesi",
  4: "Fikir Lideri",
  5: "İçerik Ustası",
  10: "TeknoAzim Elçisi",
};

// --- SEVİYE ATLAMA EŞİKLERİ ---
export const getExpForNextLevel = (level: number): number => {
  if (level <= 0) return 25;
  return level * 25;
};

// Toplam EXP'ye göre hangi seviyede olunması gerektiğini hesaplar.
export const calculateLevel = (exp: number): { level: number, expForNextLevel: number, currentLevelExp: number } => {
  let level = 1;
  let cumulativeExp = 0;

  while (exp >= cumulativeExp + getExpForNextLevel(level)) {
    cumulativeExp += getExpForNextLevel(level);
    level++;
  }
  
  const expForNextLevel = getExpForNextLevel(level);
  const currentLevelExp = cumulativeExp;

  return { level, expForNextLevel, currentLevelExp };
};


// --- ROZETLER ---
export const ALL_BADGES = [
  { name: "İlk Blog", description: "İlk blog yazını yayınla.", icon: BookOpen },
  { name: "İlk Yorumcu", description: "Bir gönderiye ilk yorumu yap.", icon: MessageSquare },
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeni alsın.", icon: ThumbsUp },
  { name: "Topluluk İnşacısı", description: "5 blog yazısı yayınla.", icon: Award },
];

// --- EXP KAZANIM MİKTARLARI ---
export const EXP_ACTIONS = {
  CREATE_POST: 25,
  CREATE_COMMENT: 10,
  RECEIVE_LIKE: 5,
  EARN_BADGE: 50,
};

// Function to add experience points to a user
export const addExp = async (userId: string, amount: number): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('exp, level')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile for EXP update:", fetchError);
    return null;
  }

  const newExp = (profile.exp || 0) + amount;
  const { level: newLevel } = calculateLevel(newExp);

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ exp: newExp, level: newLevel })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating profile EXP:", updateError);
    return null;
  }

  if (newLevel > (profile.level || 1)) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldun!`);
  }

  return updatedProfile as Profile;
};

// Function to award a badge to a user
export const awardBadge = async (userId: string, badgeName: string): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('badges, exp, level')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile for badge award:", fetchError);
    return null;
  }

  const currentBadges = profile.badges || [];
  if (currentBadges.includes(badgeName)) {
    return null; // User already has the badge
  }

  const newBadges = [...currentBadges, badgeName];
  const newExp = (profile.exp || 0) + EXP_ACTIONS.EARN_BADGE;
  const { level: newLevel } = calculateLevel(newExp);

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ badges: newBadges, exp: newExp, level: newLevel })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error awarding badge:", updateError);
    return null;
  }

  toast.success("Yeni Rozet Kazandın!", {
    description: `"${badgeName}" rozetini kazandın ve ${EXP_ACTIONS.EARN_BADGE} EXP elde ettin!`,
  });

  if (newLevel > (profile.level || 1)) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldun!`);
  }

  return updatedProfile as Profile;
};