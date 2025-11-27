import { Profile } from "@shared/api";
import { getAuthHeaders } from "./api-utils";
import {
  PenSquare,
  TrendingUp,
  Users,
  Lightbulb,
  Sparkles,
  BookOpen,
  MessageSquareQuote,
  GraduationCap,
  PenTool,
  Rocket,
  FilePlus2,
  Award,
  MessageSquare,
  Zap,
  ThumbsUp,
  Heart,
  Star,
} from "lucide-react";

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
  { name: "Beğeni Başlangıcı", description: "Bir gönderin 2 beğeni alsın.", icon: ThumbsUp },
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeni alsın.", icon: Heart },
  { name: "Popüler Yazar", description: "Bir gönderin 10 beğeni alsın.", icon: Star },
];

// --- EXP KAZANIM EYLEM ANAHTARLARI (Client-side only for reference/lookup) ---
export const EXP_ACTIONS = {
  CREATE_POST: 'CREATE_POST',
  REMOVE_POST: 'REMOVE_POST',
  EARN_BADGE: 'EARN_BADGE',
  CREATE_COMMENT: 'CREATE_COMMENT',
} as const;

// Function to add experience points to a user (NOW SECURE VIA SERVER)
export const addExp = async (actionType: keyof typeof EXP_ACTIONS): Promise<Profile | null> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch('/api/gamification/exp', {
    method: 'POST',
    headers,
    body: JSON.stringify({ actionType }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add EXP via server.");
  }
  
  const updatedProfile = await response.json();
  return updatedProfile as Profile;
};

// Function to remove experience points from a user (NOW SECURE VIA SERVER)
export const removeExp = async (actionType: keyof typeof EXP_ACTIONS): Promise<Profile | null> => {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/gamification/exp', {
    method: 'POST',
    headers,
    body: JSON.stringify({ actionType }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to remove EXP via server.");
  }
  
  const updatedProfile = await response.json();
  return updatedProfile as Profile;
};

// Function to award a badge to a user (NOW SECURE VIA SERVER)
export const awardBadge = async (badgeName: string): Promise<Profile | null> => {
  const headers = await getAuthHeaders();
  
  const response = await fetch('/api/gamification/badge', {
    method: 'POST',
    headers,
    body: JSON.stringify({ badgeName }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to award badge via server.");
  }
  
  const updatedProfile = await response.json();
  return updatedProfile as Profile;
};