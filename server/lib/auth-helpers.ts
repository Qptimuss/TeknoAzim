import { getSupabaseAdmin } from "./supabase-admin";

/**
 * Belirtilen userId'ye sahip kullanıcının ADMIN_EMAILS listesinde olup olmadığını kontrol eder.
 * @param userId Kontrol edilecek kullanıcının ID'si.
 * @returns Kullanıcı admin ise true, değilse false.
 */
export const isRequesterAdmin = async (userId: string): Promise<boolean> => {
  const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(',').map(e => e.trim()).filter(e => e.length > 0);

  if (ADMIN_EMAILS.length === 0) {
    console.warn("Admin check failed: ADMIN_EMAILS environment variable is not set or empty.");
    return false;
  }

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const { data: { user }, error: userFetchError } = await supabaseAdmin.auth.admin.getUserById(userId);

    if (userFetchError || !user || !user.email) {
      console.error("Error fetching requester user details for admin check:", userFetchError?.message);
      return false;
    }

    return ADMIN_EMAILS.includes(user.email);
  } catch (e) {
    console.error("Error during requester admin check:", e);
    return false;
  }
};