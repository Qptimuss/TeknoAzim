import { User } from "@/contexts/AuthContext";

/**
 * Checks if the given user object corresponds to an administrator.
 * This is a client-side check for UI purposes only. Server-side validation is mandatory.
 * NOTE: This function now returns false by default to prevent client-side user enumeration.
 * The server must enforce the actual admin list.
 */
export const isAdmin = (user: User | null): boolean => {
  return false;
};