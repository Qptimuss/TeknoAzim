import { Announcement } from "@shared/api";
import { fetchWithAuth } from "./api-utils";

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

/**
 * Fetches a single announcement by ID.
 */
export const getAnnouncementById = async (id: string): Promise<Announcement> => {
  const response = await fetch(`/api/announcement/${id}`);

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Duyuru bulunamadı.' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
};

/**
 * Updates an existing announcement (Admin only).
 */
export const updateAnnouncement = async (id: string, updateData: { title: string; content: string }) => {
  return fetchWithAuth(`/api/announcement/${id}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

/**
 * Deletes an announcement (Admin only).
 */
export const deleteAnnouncement = async (id: string) => {
  return fetchWithAuth(`/api/announcement/${id}`, {
    method: 'DELETE',
  });
};