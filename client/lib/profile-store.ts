import { getAuthHeaders, fetchWithAuth } from "./api-utils";
import { Profile } from "@shared/api";
import { supabase } from "@/integrations/supabase/client"; // Merkezi istemciyi import et

type UpdatableProfileFields = Pick<Profile, 'name' | 'avatar_url' | 'description' | 'selected_title' | 'selected_frame'>;

/**
 * Fetches the user profile by ID using the Supabase client.
 * @param userId The ID of the user.
 * @returns The profile object or null if not found.
 */
export const getProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      // Eğer RLS hatası veya 404 (kayıt bulunamadı) varsa
      if (error.code === 'PGRST116' || error.message.includes('Row not found')) {
        return null;
      }
      console.error("Error fetching profile via Supabase client:", error);
      throw new Error(error.message || 'Failed to fetch profile');
    }

    return data as Profile;
  } catch (error) {
    console.error("Error fetching profile:", error);
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