import { getAuthHeaders } from "./api-utils";
import { Profile } from "@shared/api";

type UpdatableProfileFields = Pick<Profile, 'name' | 'avatar_url' | 'description' | 'selected_title' | 'selected_frame'>;

/**
 * Updates non-gamification profile details via the secure server API.
 * @param updateData Partial profile data to update.
 * @returns The updated subset of profile fields.
 */
export const updateProfileDetails = async (updateData: Partial<UpdatableProfileFields>): Promise<Partial<Profile>> => {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/profile', {
    method: 'PUT',
    headers,
    body: JSON.stringify(updateData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update profile details via server.");
  }
  
  // The server returns a subset of the profile (id, name, avatar_url, description, selected_title, selected_frame)
  return await response.json();
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
    // Already claimed today
    throw new Error("Daily reward already claimed today.");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to claim daily reward via server.");
  }
  
  return await response.json();
};

/**
 * Opens a crate securely via the server API, deducting gems and awarding an item.
 * @param cost The cost of the crate.
 * @returns The full updated profile object and the item won.
 */
export const openCrate = async (cost: number): Promise<{ updatedProfile: Profile, itemWon: string }> => {
  const headers = await getAuthHeaders();

  const response = await fetch('/api/gamification/open-crate', {
    method: 'POST',
    headers,
    body: JSON.stringify({ cost }),
  });

  if (response.status === 403) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Insufficient gems.");
  }

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to open crate via server.");
  }
  
  return await response.json();
};