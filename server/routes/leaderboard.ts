import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { EXCLUDED_LEADERBOARD_EMAILS } from "../lib/gamification-constants";
import { Profile } from "@shared/api";

/**
 * Handles fetching all user profiles, excluding specific emails, for the leaderboard.
 * This route is publicly accessible as it only returns non-sensitive profile data.
 */
export const handleGetLeaderboardProfiles: RequestHandler = async (_req, res) => {
  try {
    const supabaseAdmin = getSupabaseAdmin();

    // Fetch all profiles
    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .order("exp", { ascending: false }); // Deneyime göre sırala

    if (profilesError) {
      console.error("Supabase fetch profiles error for leaderboard:", profilesError);
      return res.status(500).json({ error: "Failed to fetch profiles for leaderboard." });
    }

    // Fetch all auth.users to get email addresses for filtering
    const { data: authUsers, error: authUsersError } = await supabaseAdmin.auth.admin.listUsers();

    if (authUsersError) {
      console.error("Supabase fetch auth users error for leaderboard:", authUsersError);
      return res.status(500).json({ error: "Failed to fetch user emails for filtering." });
    }

    const excludedUserIds = new Set(
      authUsers.users
        .filter(user => EXCLUDED_LEADERBOARD_EMAILS.includes(user.email || ''))
        .map(user => user.id)
    );

    // Filter out profiles belonging to excluded emails
    const filteredProfiles = profiles.filter(profile => !excludedUserIds.has(profile.id));

    res.status(200).json(filteredProfiles);
  } catch (e) {
    console.error("Error fetching leaderboard profiles:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};