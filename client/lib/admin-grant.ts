import { getAuthHeaders, fetchWithAuth } from "./api-utils";
import { isAdmin } from "./auth-utils";
import { User } from "@/contexts/AuthContext";
import { toast } from "sonner";

const TARGET_EMAIL = "mehmetakif.msrli55@gmail.com";
const STORAGE_KEY = "admin_grant_executed";

/**
 * Checks if the current user is the target admin and grants all items if not already done.
 * @param user The current authenticated user object.
 * @param updateUser Function to update the Auth context state.
 */
export const executeAdminGrant = async (user: User | null, updateUser: (data: Partial<User>) => void) => {
  if (!user || user.email !== TARGET_EMAIL || !isAdmin(user)) {
    return;
  }

  // Check if the grant has already been executed in this session/browser
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    return;
  }

  try {
    const headers = await getAuthHeaders();
    
    const response = await fetchWithAuth('/api/admin/grant-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetEmail: TARGET_EMAIL }),
    });

    if (response) {
      const { profile: updatedProfile } = response;
      updateUser(updatedProfile);
      toast.success("Yönetici Yetkisi Verildi", { 
        description: "Tüm ünvanlar ve çerçeveler hesabınıza eklendi!",
        duration: 10000,
      });
      localStorage.setItem(STORAGE_KEY, 'true');
    }
  } catch (error) {
    console.error("Admin Grant Failed:", error);
    // Hata durumunda, kullanıcıya daha spesifik bir mesaj gösterelim.
    toast.error("Yönetici İşlemi Başarısız", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu. Lütfen konsolu kontrol edin.",
    });
  }
};