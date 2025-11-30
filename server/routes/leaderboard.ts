import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { EXCLUDED_LEADERBOARD_EMAILS } from "../lib/gamification-constants"; // EXCLUDED_LEADERBOARD_EMAILS hala kullanılabilir
import { Profile } from "@shared/api";

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

    // Filtreleme ve admin kullanıcıları belirlemek için tüm auth.users'ı çek
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error("Supabase fetch auth users error for leaderboard:", authUsersError);
      return res.status(500).json({ error: "Failed to fetch user emails for filtering." });
    }

    // ADMIN_EMAILS ortam değişkenini al ve bir Set'e dönüştür
    const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim()).filter(e => e.length > 0);
    const adminUserEmails = new Set(ADMIN_EMAILS);
    const adminUserIds = new Set<string>();

    authUsers.users.forEach(user => {
      if (user.email && adminUserEmails.has(user.email)) {
        adminUserIds.add(user.id);
      }
    });

    const excludedFromAllLeaderboardUserIds = new Set(
      authUsers.users
        .filter(user => EXCLUDED_LEADERBOARD_EMAILS.includes(user.email || ''))
        .map(user => user.id)
    );

    const processedProfiles: Profile[] = [];

    profiles.forEach(profile => {
      // Genel dışlama listesindeki kullanıcıları filtrele
      if (excludedFromAllLeaderboardUserIds.has(profile.id)) {
        return; // Bu profili atla
      }

      const isAdminUser = adminUserIds.has(profile.id);
      processedProfiles.push({
        ...profile,
        is_admin_leaderboard_user: isAdminUser,
        // is_special_leaderboard_user artık kullanılmıyor, admin bayrağı yeterli
      });
    });

    // Özel sıralama fonksiyonu:
    // 1. Normal kullanıcılar EXP'ye göre azalan sırada sıralanır.
    // 2. Admin kullanıcılar her zaman en altta yer alır, kendi aralarında EXP'ye göre azalan sırada sıralanır.
    processedProfiles.sort((a, b) => {
      const aIsAdmin = a.is_admin_leaderboard_user;
      const bIsAdmin = b.is_admin_leaderboard_user;

      if (aIsAdmin && !bIsAdmin) return 1; // a (admin) b'den (normal) sonra gelir
      if (!aIsAdmin && bIsAdmin) return -1; // a (normal) b'den (admin) önce gelir

      // Hem normal hem de admin ise, EXP'ye göre azalan sırada sırala
      return (b.exp || 0) - (a.exp || 0);
    });

    res.status(200).json(processedProfiles);
  } catch (e) {
    console.error("Error fetching leaderboard profiles:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};