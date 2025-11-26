import { Announcement } from "@shared/api";

/**
 * Fetches all announcements from the server API.
 */
export const getAnnouncements = async (): Promise<Announcement[]> => {
  const response = await fetch('/api/announcement');

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Duyurular yüklenemedi.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};