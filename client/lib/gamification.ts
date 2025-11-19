import { supabase } from "@/integrations/supabase/client";
import { getProfileById } from "./blog-store";
import { toast } from "sonner";
import { Award, BookUser, MessageSquarePlus, Heart } from "lucide-react";

export const LEVEL_THRESHOLDS = [
  0, 100, 250, 500, 1000, 2000, 4000, 8000, 15000, 30000
];

export const ALL_BADGES = [
  { name: "İlk Blog", description: "İlk blog yazını yayınladın.", icon: BookUser },
  { name: "İlk Yorumcu", description: "Bir gönderiye ilk yorumu sen yaptın.", icon: MessageSquarePlus },
  { name: "Beğeni Mıknatısı", description: "Bir gönderin 5 beğeniye ulaştı.", icon: Heart },
  { name: "Topluluk Üyesi", description: "Platforma kayıt oldun.", icon: Award },
];

export function getExpForNextLevel(level: number): number {
  if (level >= LEVEL_THRESHOLDS.length) {
    return Infinity; // Max level
  }
  return LEVEL_THRESHOLDS[level];
}

export async function addExp(userId: string, amount: number) {
  const profile = await getProfileById(userId);
  if (!profile) return null;

  const newExp = (profile.exp || 0) + amount;
  let newLevel = profile.level || 1;

  while (newLevel < LEVEL_THRESHOLDS.length && newExp >= getExpForNextLevel(newLevel)) {
    newLevel++;
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ exp: newExp, level: newLevel })
    .eq("id", userId)
    .select('exp, level')
    .single();

  if (error) {
    console.error("Error adding EXP:", error);
    return null;
  }
  return data;
}

export async function awardBadge(userId: string, badgeName: string) {
  const profile = await getProfileById(userId);
  if (!profile) return null;

  const currentBadges = profile.badges || [];
  if (currentBadges.includes(badgeName)) {
    // Kullanıcı bu rozete zaten sahip
    return null;
  }

  // Rozeti ve 50 EXP'yi ekle
  const newBadges = [...currentBadges, badgeName];
  const newExp = (profile.exp || 0) + 50;

  // Seviyeyi yeniden hesapla
  let newLevel = profile.level || 1;
  while (newLevel < LEVEL_THRESHOLDS.length && newExp >= getExpForNextLevel(newLevel)) {
    newLevel++;
  }

  // Veritabanını güncelle
  const { data, error } = await supabase
    .from("profiles")
    .update({ 
      badges: newBadges,
      exp: newExp,
      level: newLevel 
    })
    .eq("id", userId)
    .select('exp, level, badges')
    .single();

  if (error) {
    console.error("Error awarding badge:", error);
    return null;
  }

  // Başarı bildirimi göster
  toast.success(`Rozet Kazanıldı: ${badgeName}!`, {
    description: "+50 EXP kazandınız!",
  });

  return data;
}