import { Award, BookOpen, MessageSquare, ThumbsUp, UserPlus } from "lucide-react";
import { Profile } from "@shared/api";

// --- YENİ: ÜNVAN SİSTEMİ ---
export const TITLES: { [key: number]: string } = {
  1: "Yeni Blogger",
  2: "Gelişen Yazar",
  3: "Topluluk Üyesi",
  4: "Fikir Lideri",
  5: "İçerik Ustası",
  10: "TeknoAzim Elçisi",
};

// --- GÜNCELLENDİ: SEVİYE ATLAMA EŞİKLERİ ---
// Artık dinamik olarak hesaplanıyor.
// Seviye 1 -> 2: 25 EXP
// Seviye 2 -> 3: 50 EXP
// Seviye 3 -> 4: 75 EXP
// ...
export const getExpForNextLevel = (level: number): number => {
  if (level <= 0) return 25;
  return level * 25;
};

// Toplam EXP'ye göre hangi seviyede olunması gerektiğini hesaplar.
export const calculateLevel = (exp: number): { level: number, expForNextLevel: number, currentLevelExp: number } => {
  let level = 1;
  let requiredExp = 0;
  let cumulativeExp = 0;

  while (exp >= cumulativeExp + getExpForNextLevel(level)) {
    cumulativeExp += getExpForNextLevel(level);
    level++;
  }
  
  requiredExp = getExpForNextLevel(level);
  const currentLevelExp = cumulativeExp;

  return { level, expForNextLevel: requiredExp, currentLevelExp };
};


// --- ROZETLER ---
export const ALL_BADGES = [
  { name: "İlk Adım", description: "İlk blog yazını yayınla.", icon: BookOpen },
  { name: "Sohbet Başlatıcı", description: "İlk yorumunu yap.", icon: MessageSquare },
  { name: "Hoş Geldin", description: "Hesabını oluştur.", icon: UserPlus },
  { name: "Takdir Edici", description: "Bir gönderiyi beğen.", icon: ThumbsUp },
  { name: "Topluluk İnşacısı", description: "5 blog yazısı yayınla.", icon: Award },
];

// --- EXP KAZANIM MİKTARLARI ---
export const EXP_ACTIONS = {
  CREATE_POST: 20,
  CREATE_COMMENT: 10,
  RECEIVE_LIKE: 5,
  // --- YENİ: ROZET KAZANMA ÖDÜLÜ ---
  EARN_BADGE: 50,
};

// --- ROZET KONTROL MANTIĞI ---
// Bu fonksiyon, bir aksiyon sonrası yeni rozet kazanılıp kazanılmadığını kontrol eder.
// Şimdilik bu mantık sunucu tarafında veya daha karmaşık bir yapıda olmalı,
// bu yüzden burası konsepti göstermek amaçlıdır.
export const checkNewBadges = (profile: Profile, action: 'create_post' | 'create_comment' | 'receive_like', userStats: { postCount: number, commentCount: number }): string[] => {
    const newBadges: string[] = [];
    const currentBadges = profile.badges || [];

    // "Hoş Geldin" rozeti (genellikle kayıt sırasında verilir)
    if (!currentBadges.includes("Hoş Geldin")) {
        newBadges.push("Hoş Geldin");
    }

    // "İlk Adım" rozeti
    if (action === 'create_post' && !currentBadges.includes("İlk Adım")) {
        newBadges.push("İlk Adım");
    }

    // "Sohbet Başlatıcı" rozeti
    if (action === 'create_comment' && !currentBadges.includes("Sohbet Başlatıcı")) {
        newBadges.push("Sohbet Başlatıcı");
    }
    
    // "Topluluk İnşacısı" rozeti
    if (action === 'create_post' && userStats.postCount >= 5 && !currentBadges.includes("Topluluk İnşacısı")) {
        newBadges.push("Topluluk İnşacısı");
    }

    // Diğer rozetler için de benzer kontroller eklenebilir...

    return newBadges;
};