import { User } from "@/contexts/AuthContext";

/**
 * Checks if the given user object corresponds to an administrator.
 * This is a client-side check for UI purposes only. Server-side validation is mandatory.
 */
export const isAdmin = (user: User | null): boolean => {
  // WARNING: This list is for UI purposes only. Server must enforce security.
  // Lütfen kendi admin e-postalarınızı buraya ekleyin.
  const ADMIN_EMAILS = ["zeynepecemsezer5566@hotmail.com",""];

  if (!user || !user.email) {
    return false;
  }

  return ADMIN_EMAILS.includes(user.email);
};