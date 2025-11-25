import { User } from "@/contexts/AuthContext";

// WARNING: This list must match the list in server/middleware/admin.ts for consistency.
const ADMIN_EMAILS = [
  "zeynepecemsezer5566@hotmail.com",
  "mehmetakif.msrli55@gmail.com",
];

/**
 * Checks if the given user object corresponds to an administrator.
 * This is a client-side check for UI purposes only. Server-side validation is mandatory.
 */
export const isAdmin = (user: User | null): boolean => {
  if (!user || !user.email) {
    return false;
  }
  return ADMIN_EMAILS.includes(user.email);
};