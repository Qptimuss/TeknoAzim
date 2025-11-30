import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { EXCLUDED_LEADERBOARD_EMAILS, SPECIAL_LEADERBOARD_EMAILS, SPECIAL_USER_RANKING_ORDER } from "../lib/gamification-constants";
import { Profile } from "@shared/api"; // Profile arayüzünü import et

/**
 * Handles fetching all user profiles, excluding specific emails, for the leaderboard.
 * This route is publicly accessible as it only returns non-sensitive profile data.
 */
export const handleGetLeaderboardProfiles: RequestHandler = async (_req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Tüm profilleri çek
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*");

    if (profilesError) {
      console.error("Supabase fetch profiles error for leaderboard:", profilesError);
      return res.status(500).json({ error: "Failed to fetch profiles for leaderboard." });
    }

    // Filtreleme ve özel kullanıcıları belirlemek için tüm auth.users'ı çek
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error("Supabase fetch auth users error for leaderboard:", authUsersError);
      return res.status(500).json({ error: "Failed to fetch user emails for filtering." });
    }

    const userEmailMap = new Map<string, string>(); // userId -> email
    authUsers.users.forEach(user => {
      if (user.id && user.email) {
        userEmailMap.set(user.id, user.email);
      }
    });

    const specialUserIds = new Set<string>();
    SPECIAL_LEADERBOARD_EMAILS.forEach(email => {
      const user = authUsers.users.find(u => u.email === email);
      if (user?.id) {
        specialUserIds.add(user.id);
      }
    });

    const excludedFromAllLeaderboardUserIds = new Set(
      authUsers.users
        .filter(user => EXCLUDED_LEADERBOARD_EMAILS.includes(user.email || ''))
        .map(user => user.id)
    );

    const processedProfiles: (Profile & { is_special_leaderboard_user: boolean, email: string | undefined })[] = [];

    profiles.forEach(profile => {
      // Öncelikle, liderlik tablosundan genel olarak dışlanan kullanıcıları filtrele
      if (excludedFromAllLeaderboardUserIds.has(profile.id)) {
        return; // Bu profili atla
      }

      const email = userEmailMap.get(profile.id);
      const isSpecial = specialUserIds.has(profile.id);
      
      processedProfiles.push({
        ...profile,
        is_special_leaderboard_user: isSpecial,
        email: email,
      });
    });

    // Özel sıralama fonksiyonu:
    // 1. Normal kullanıcılar EXP'ye göre azalan sırada sıralanır.
    // 2. Özel kullanıcılar her zaman en altta yer alır. Kendi aralarında ise SPECIAL_USER_RANKING_ORDER'a göre sıralanır.
    processedProfiles.sort((a, b) => {
      const aIsSpecial = a.is_special_leaderboard_user;
      const bIsSpecial = b.is_special_leaderboard_user;

      if (aIsSpecial && !bIsSpecial) return 1; // a (özel) b'den (normal) sonra gelir
      if (!aIsSpecial && bIsSpecial) return -1; // a (normal) b'den (özel) önce gelir

      if (aIsSpecial && bIsSpecial) {
        // Her ikisi de özel ise, sabit sıralama önceliğini kullan
        const aIndex = SPECIAL_USER_RANKING_ORDER.indexOf(a.email || '');
        const bIndex = SPECIAL_USER_RANKING_ORDER.indexOf(b.email || '');

        // Eğer ikisi de listede bulunuyorsa, indekse göre sırala (küçük indeks önde)
        if (aIndex !== -1 && bIndex !== -1) {
          return aIndex - bIndex;
        }
        
        // Eğer biri veya hiçbiri listede yoksa, EXP'ye göre sırala (yedek)
        return (b.exp || 0) - (a.exp || 0);
      }

      // Her ikisi de normal ise, EXP'ye göre azalan sırada sırala
      return (b.exp || 0) - (a.exp || 0);
    });

    // E-posta alanını client'a göndermeden önce temizle
    const finalProfiles = processedProfiles.map(({ email, ...rest }) => rest);

    res.status(200).json(finalProfiles);
  } catch (e) {
    console.error("Error fetching leaderboard profiles:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};