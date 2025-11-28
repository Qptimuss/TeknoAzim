import { getAuthHeaders, fetchWithAuth } from "./api-utils";
import { Profile } from "@shared/api";

type UpdatableProfileFields = Pick<Profile, 'name' | 'avatar_url' | 'description' | 'selected_title' | 'selected_frame'>;

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

/**
 * Fetches the user profile by ID using the REST API.
 * @param userId The ID of the user.
 * @returns The profile object or null if not found.
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=*&id=eq.${userId}`, {
      headers: {
        'apikey': SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'Accept': 'application/vnd.pgrst.object+json', // Tek bir nesne döndürmesini sağlar
      },
    });

    if (response.status === 404 || response.status === 406) return null;

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.message || 'Failed to fetch profile');
    }

    const data = await response.json();
    return data as Profile;
  } catch (error) {
    console.error("Error fetching profile via REST:", error);
    return null;
  }
};

/**
 * Updates non-gamification profile details via the secure server API.
 * @param updateData Partial profile data to update.
 * @returns The updated subset of profile fields.
 */
export const updateProfileDetails = async (updateData: Partial<UpdatableProfileFields>): Promise<Partial<Profile>> => {
  return fetchWithAuth('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Claims the daily gem reward securely via the server API.
 * @returns The full updated profile object.
 */
export const claimDailyReward = async (): Promise<Profile> => {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/gamification/daily-reward', {
    method: 'POST',
    headers,
  });

  if (response.status === 409) {
    throw new Error("Daily reward already claimed today.");
  }

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Bilinmeyen bir sunucu hatası oluştu.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }
  
  return await response.json();
};

/**
 * Opens a crate securely via the server API, deducting gems and awarding an item.
 * @param cost The cost of the crate.
 * @returns The full updated profile object and the item won.
 */
export const openCrate = async (cost: number): Promise<{ updatedProfile: Profile, itemWon: any, alreadyOwned: boolean, refundAmount: number }> => {
  return fetchWithAuth('/api/gamification/open-crate', {
    method: 'POST',
    body: JSON.stringify({ cost }),
  });
};
