// This file holds the authoritative, hardcoded values for gamification rewards.
// The client should only send the action type, not the amount.

export const SERVER_EXP_ACTIONS = {
  CREATE_POST: 25,
  REMOVE_POST: -25,
  EARN_BADGE: 50,
  CREATE_COMMENT: 10, // Although not currently used by client, defining here for completeness
  CLAIM_DAILY_REWARD: 25, // Yeni: Günlük ödül için 25 EXP
};

export const BADGE_REWARD_GEMS = 30;

export const ALL_TITLE_NAMES = [
  "Yeni Blogger",
  "Gelişen Yazar",
  "Topluluk Üyesi",
  "Fikir Lideri",
  "İçerik Ustası",
  "Bilge Paylaşımcı",
  "Tartışma Başlatan",
  "Topluluk Mentoru",
  "Usta Kalem",
  "TeknoAzim Elçisi",
];

export const ALL_BADGE_NAMES = [
  "İlk Blog",
  "Hevesli Katılımcı",
  "Topluluk İnşacısı",
  "İlk Yorumcu",
  "Hızlı Parmaklar",
  "Beğeni Başlangıcı",
  "Beğeni Mıknatısı",
  "Popüler Yazar",
];

// These emails will be excluded from the leaderboard
export const EXCLUDED_LEADERBOARD_EMAILS = [
  // "qptimus06@gmail.com", // Artık özel kullanıcı olarak dahil edilecek
  // "zeynepecemsezer5566@hotmail.com", // Artık özel kullanıcı olarak dahil edilecek
];

// Liderlik tablosunda özel muamele görecek kullanıcıların e-postaları
export const SPECIAL_LEADERBOARD_EMAILS = [
  "qptimus06@gmail.com",
  "zeynepecemsezer5566@hotmail.com",
];