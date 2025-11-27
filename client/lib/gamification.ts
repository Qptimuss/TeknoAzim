import { Profile } from "@shared/api";
import { getAuthHeaders } from "./api-utils";

// --- ÜNVAN SİSTEMİ ---
export const TITLES: { [key: number]: { name: string; icon: React.ElementType } } = {
  1: { name: "Yeni Blogger", icon: require("lucide-react").PenSquare },
  2: { name: "Gelişen Yazar", icon: require("lucide-react").TrendingUp },
  3: { name: "Topluluk Üyesi", icon: require("lucide-react").Users },
  4: { name: "Fikir Lideri", icon: require("lucide-react").Lightbulb },
  5: { name: "İçerik Ustası", icon: require("lucide-react").Sparkles },
  6: { name: "Bilge Paylaşımcı", icon: require("lucide-react").BookOpen },
  7: { name: "Tartışma Başlatan", icon: require("lucide-react").MessageSquareQuote },
  8: { name: "Topluluk Mentoru", icon: require("lucide-react").GraduationCap },
  9: { name: "Usta Kalem", icon: require("lucide-react").PenTool },
  10: { name: "TeknoAzim Elçisi", icon: require("lucide-react").Rocket },
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
  { name: "İlk Blog", description: "İlk blog yazını yayınla.", icon: require("lucide-react").BookOpen },
  { name: "Hevesli Katılımcı", description: "İki blog yazısı yayınla.", icon: require("lucide-react").FilePlus2 },
  { name: "Topluluk İnşacısı", description: "5 blog yazısı yayınla.", icon: require("lucide-react").Award },
  { name: "İlk Yorumcu", description: "Bir gönderiye ilk yorumu yap.", icon: require("lucide-react").MessageSquare },
  { name: "Hızlı Parmaklar", description: "Üç farklı gönderiye ilk yorumu yap.", icon: require("lucide-react").Zap },
  { name: "Beğeni Başlangıcı", description: "Bir gönderin 2 beğeni alsın.", icon: require("lucide-react").ThumbsUp },
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeni alsın.", icon: require("lucide-react").Heart },
  { name: "Popüler Yazar", description: "Bir gönderin 10 beğeni alsın.", icon: require("lucide-react").Star },
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