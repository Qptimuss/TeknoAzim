import { supabase } from "@/integrations/supabase/client";
import { 
  Award, BookOpen, MessageSquare, ThumbsUp, FilePlus2, Zap, Star,
  PenSquare, TrendingUp, Users, Lightbulb, Sparkles, MessageSquareQuote,
  GraduationCap, PenTool, Rocket
} from "lucide-react";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import React from "react";

// --- ÜNVAN SİSTEMİ ---
export const TITLES: { [key: number]: { name: string; icon: React.ElementType } } = {
  1: { name: "Yeni Blogger", icon: PenSquare },
  2: { name: "Gelişen Yazar", icon: TrendingUp },
  3: { name: "Topluluk Üyesi", icon: Users },
  4: { name: "Fikir Lideri", icon: Lightbulb },
  5: { name: "İçerik Ustası", icon: Sparkles },
  6: { name: "Bilge Paylaşımcı", icon: BookOpen },
  7: { name: "Tartışma Başlatan", icon: MessageSquareQuote },
  8: { name: "Topluluk Mentoru", icon: GraduationCap },
  9: { name: "Usta Kalem", icon: PenTool },
  10: { name: "TeknoAzim Elçisi", icon: Rocket },
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
  { name: "Hevesli Katılımcı", description: "İki blog yazısı yayınla.", icon: FilePlus2 },
  { name: "Topluluk İnşacısı", description: "5 blog yazısı yayınla.", icon: Award },
  { name: "İlk Yorumcu", description: "Bir gönderiye ilk yorumu yap.", icon: MessageSquare },
  { name: "Hızlı Parmaklar", description: "Üç farklı gönderiye ilk yorumu yap.", icon: Zap },
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeni alsın.", icon: ThumbsUp },
  { name: "Popüler Yazar", description: "Bir gönderin 10 beğeni alsın.", icon: Star },
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

// Function to remove experience points from a user
export const removeExp = async (userId: string, amount: number): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('exp, level, selected_title')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile for EXP removal:", fetchError);
    return null;
  }

  const newExp = Math.max(0, (profile.exp || 0) - amount);
  const { level: newLevel } = calculateLevel(newExp);
  
  const updatePayload: Partial<Profile> = { exp: newExp, level: newLevel };

  if (newLevel < profile.level) {
    toast.warning(`Seviye ${profile.level}'den Seviye ${newLevel}'e düştün!`);
    
    // Check if the selected title is still unlocked
    if (profile.selected_title) {
      const titleEntry = Object.entries(TITLES).find(([, t]) => t.name === profile.selected_title);
      if (titleEntry) {
        const requiredLevel = parseInt(titleEntry[0]);
        if (newLevel < requiredLevel) {
          updatePayload.selected_title = null;
          toast.info("Seviyen düştüğü için ünvanın kaldırıldı.");
        }
      }
    }
  }

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update(updatePayload)
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating profile after EXP removal:", updateError);
    return null;
  }

  return updatedProfile as Profile;
};

// Function to award a badge to a user
export const awardBadge = async (userId: string, badgeName: string): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('badges, exp, level, gems')
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
  const newGems = (profile.gems || 0) + 10; // Updated to 10 gems
  const { level: newLevel } = calculateLevel(newExp);

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ badges: newBadges, exp: newExp, level: newLevel, gems: newGems })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error awarding badge:", updateError);
    return null;
  }

  toast.success("Yeni Rozet Kazandın!", {
    description: `"${badgeName}" rozetini kazandın, ${EXP_ACTIONS.EARN_BADGE} EXP ve 10 Elmas elde ettin!`,
  });

  if (newLevel > (profile.level || 1)) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldun!`);
  }

  return updatedProfile as Profile;
};