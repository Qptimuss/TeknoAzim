import { 
  Award, BookOpen, MessageSquare, ThumbsUp, FilePlus2, Zap, Star,
  PenSquare, TrendingUp, Users, Lightbulb, Sparkles, MessageSquareQuote,
  GraduationCap, PenTool, Rocket
} from "lucide-react";
import { Profile } from "@shared/api";
import { toast } from "sonner";
import React from "react";
import { getAuthHeaders } from "./api-utils";
import { supabase } from "@/integrations/supabase/client"; // Supabase import edildi

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
  { name: "Beğeni Başlangıcı", description: "Bir gönderin 2 beğeni alsın.", icon: ThumbsUp }, // YENİ ROZET
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeni alsın.", icon: ThumbsUp },
  { name: "Popüler Yazar", description: "Bir gönderin 10 beğeni alsın.", icon: Star },
];

// --- EXP KAZANIM EYLEM ANAHTARLARI (Client-side only for reference/lookup) ---
// The server holds the authoritative amounts.
export const EXP_ACTIONS = {
  CREATE_POST: 'CREATE_POST',
  REMOVE_POST: 'REMOVE_POST',
  EARN_BADGE: 'EARN_BADGE',
  CREATE_COMMENT: 'CREATE_COMMENT',
} as const;

// Function to add experience points to a user (NOW SECURE VIA SERVER)
export const addExp = async (userId: string, actionType: keyof typeof EXP_ACTIONS): Promise<Profile | null> => {
  const headers = await getAuthHeaders();
  
  // 1. Fetch current profile state to check for level up later
  const { data: profileBefore, error: fetchError } = await supabase
    .from('profiles')
    .select('level')
    .eq('id', userId)
    .single();

  if (fetchError || !profileBefore) {
    console.error("Error fetching profile before EXP addition:", fetchError);
    // Continue, but skip level check
  }
  
  const response = await fetch('/api/gamification/exp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actionType, // Send action type instead of amount/action
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add EXP via server.");
  }
  
  const updatedProfile = await response.json();
  
  // Check for level up notification (client side)
  if (profileBefore && updatedProfile.level > profileBefore.level) {
    toast.success(`Tebrikler! Seviye ${updatedProfile.level} oldun!`);
  }
  
  return updatedProfile as Profile;
};

// Function to remove experience points from a user (NOW SECURE VIA SERVER)
export const removeExp = async (userId: string, actionType: keyof typeof EXP_ACTIONS): Promise<Profile | null> => {
  const headers = await getAuthHeaders();
  
  // 1. Fetch current profile state to check for level drop later
  const { data: profileBefore, error: fetchError } = await supabase
    .from('profiles')
    .select('level, selected_title')
    .eq('id', userId)
    .single();

  if (fetchError || !profileBefore) {
    console.error("Error fetching profile before EXP removal:", fetchError);
    // Continue, but skip level check
  }

  const response = await fetch('/api/gamification/exp', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      actionType, // Send action type instead of amount/action
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to remove EXP via server.");
  }
  
  const updatedProfile = await response.json();
  
  // Check for level down notification (client side)
  if (profileBefore && updatedProfile.level < profileBefore.level) {
    toast.warning(`Seviye ${profileBefore.level}'den Seviye ${updatedProfile.level}'e düştün!`);
    
    // Check if the selected title was removed due to level drop
    if (profileBefore.selected_title && updatedProfile.selected_title === null) {
       toast.info("Seviyen düştüğü için ünvanın kaldırıldı.");
    }
  }

  return updatedProfile as Profile;
};

// Function to award a badge to a user (NOW SECURE VIA SERVER)
export const awardBadge = async (userId: string, badgeName: string): Promise<Profile | null> => {
  const headers = await getAuthHeaders();
  
  // 1. Fetch current profile state to check for level up later
  const { data: profileBefore, error: fetchError } = await supabase
    .from('profiles')
    .select('badges, level')
    .eq('id', userId)
    .single();

  if (fetchError || !profileBefore) {
    console.error("Error fetching profile before badge award:", fetchError);
    // Continue, but skip checks
  }
  
  // Client-side check to prevent unnecessary API call if already owned
  if (profileBefore?.badges?.includes(badgeName)) {
    return null; 
  }

  const response = await fetch('/api/gamification/badge', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      badgeName,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to award badge via server.");
  }
  
  const updatedProfile = await response.json();
  
  // Client-side notification for badge and gem/exp gain
  toast.success("Yeni Rozet Kazandın!", {
    description: `"${badgeName}" rozetini kazandın, 50 EXP ve 30 Gem elde ettin!`,
  });
  
  // Check for level up notification (client side)
  if (profileBefore && updatedProfile.level > profileBefore.level) {
    toast.success(`Tebrikler! Seviye ${updatedProfile.level} oldun!`);
  }
  
  return updatedProfile as Profile;
};