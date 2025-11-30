import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { EXCLUDED_LEADERBOARD_EMAILS, SPECIAL_LEADERBOARD_EMAILS } from "../lib/gamification-constants";
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

    const processedProfiles: Profile[] = [];

    profiles.forEach(profile => {
      // Öncelikle, liderlik tablosundan genel olarak dışlanan kullanıcıları filtrele
      if (excludedFromAllLeaderboardUserIds.has(profile.id)) {
        return; // Bu profili atla
      }

      const isSpecial = specialUserIds.has(profile.id);
      processedProfiles.push({
        ...profile,
        is_special_leaderboard_user: isSpecial,
      });
    });

    // Özel sıralama fonksiyonu:
    // 1. Normal kullanıcılar EXP'ye göre azalan sırada sıralanır.
    // 2. Özel kullanıcılar her zaman en altta yer alır, kendi aralarında EXP'ye göre azalan sırada sıralanır.
    processedProfiles.sort((a, b) => {
      const aIsSpecial = a.is_special_leaderboard_user;
      const bIsSpecial = b.is_special_leaderboard_user;

      if (aIsSpecial && !bIsSpecial) return 1; // a (özel) b'den (normal) sonra gelir
      if (!aIsSpecial && bIsSpecial) return -1; // a (normal) b'den (özel) önce gelir

      // Hem normal hem de özel ise, EXP'ye göre azalan sırada sırala
      return (b.exp || 0) - (a.exp || 0);
    });

    res.status(200).json(processedProfiles);
  } catch (e) {
    console.error("Error fetching leaderboard profiles:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};