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
export const getXpForNextLevel = (level: number): number => {
  if (level <= 0) return 25;
  return level * 25;
};

// Toplam XP'ye göre hangi seviyede olunması gerektiğini hesaplar.
export const calculateLevel = (xp: number): { level: number, xpForNextLevel: number, currentLevelXp: number } => {
  let level = 1;
  let cumulativeXp = 0;

  while (xp >= cumulativeXp + getXpForNextLevel(level)) {
    cumulativeXp += getXpForNextLevel(level);
    level++;
  }
  
  const xpForNextLevel = getXpForNextLevel(level);
  const currentLevelXp = cumulativeXp;

  return { level, xpForNextLevel, currentLevelXp };
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

// --- XP KAZANIM MİKTARLARI ---
export const XP_ACTIONS = {
  CREATE_POST: 25,
  CREATE_COMMENT: 10,
  RECEIVE_LIKE: 5,
  EARN_BADGE: 50,
};

// Function to add experience points to a user
export const addXp = async (userId: string, amount: number): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp, level')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile for XP update:", fetchError);
    return null;
  }

  const newXp = (profile.xp || 0) + amount;
  const { level: newLevel } = calculateLevel(newXp);

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ xp: newXp, level: newLevel })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error updating profile XP:", updateError);
    return null;
  }

  if (newLevel > (profile.level || 1)) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldun!`);
  }

  return updatedProfile as Profile;
};

// Function to remove experience points from a user
export const removeXp = async (userId: string, amount: number): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('xp, level, selected_title')
    .eq('id', userId)
    .single();

  if (fetchError || !profile) {
    console.error("Error fetching profile for XP removal:", fetchError);
    return null;
  }

  const newXp = Math.max(0, (profile.xp || 0) - amount);
  const { level: newLevel } = calculateLevel(newXp);
  
  const updatePayload: Partial<Profile> = { xp: newXp, level: newLevel };

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
    console.error("Error updating profile after XP removal:", updateError);
    return null;
  }

  return updatedProfile as Profile;
};

// Function to award a badge to a user
export const awardBadge = async (userId: string, badgeName: string): Promise<Profile | null> => {
  const { data: profile, error: fetchError } = await supabase
    .from('profiles')
    .select('badges, xp, level, gems')
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
  const newXp = (profile.xp || 0) + XP_ACTIONS.EARN_BADGE;
  const newGems = (profile.gems || 0) + 10; // Updated to 10 gems
  const { level: newLevel } = calculateLevel(newXp);

  const { data: updatedProfile, error: updateError } = await supabase
    .from('profiles')
    .update({ badges: newBadges, xp: newXp, level: newLevel, gems: newGems })
    .eq('id', userId)
    .select()
    .single();

  if (updateError) {
    console.error("Error awarding badge:", updateError);
    return null;
  }

  toast.success("Yeni Rozet Kazandın!", {
    description: `"${badgeName}" rozetini kazandın, ${XP_ACTIONS.EARN_BADGE} XP ve 10 Gem elde ettin!`,
  });

  if (newLevel > (profile.level || 1)) {
    toast.success(`Tebrikler! Seviye ${newLevel} oldun!`);
  }

  return updatedProfile as Profile;
};