import { getAuthHeaders, fetchWithAuth } from "./api-utils";
import { User } from "@/contexts/AuthContext";
import { toast } from "sonner";

// TARGET_EMAIL kaldırıldı. Artık sunucu ADMIN_EMAILS değişkenini kullanıyor.
const STORAGE_KEY = "admin_grant_executed";

/**
 * Checks if the current user is the target admin and grants all items if not already done.
 * @param user The current authenticated user object.
 * @param updateUser Function to update the Auth context state.
 */
export const executeAdminGrant = async (user: User | null, updateUser: (data: Partial<User>) => void) => {
  // Bu işlem sadece kullanıcı giriş yapmışsa ve daha önce yapılmamışsa denenir.
  if (!user) {
    return;
  }

  // Check if the grant has already been executed in this session/browser
  if (localStorage.getItem(STORAGE_KEY) === 'true') {
    return;
  }

  // Admin yetkisi verme işlemi sadece admin olduğu düşünülen kullanıcılar için denenmeli.
  // Ancak, bu kontrolü sunucuya bırakıyoruz. Eğer kullanıcı admin değilse, sunucu 403 dönecektir.
  
  try {
    const headers = await getAuthHeaders();
    
    // targetEmail'i göndermeye gerek yok, sunucu zaten oturumdaki kullanıcıyı kontrol edecek.
    // Ancak, mevcut sunucu rotası hala targetEmail bekliyor. Bu yüzden kullanıcının kendi e-postasını gönderelim.
    // NOT: Sunucu rotasını değiştirmek yerine, mevcut yapıyı koruyarak kullanıcının kendi e-postasını gönderiyoruz.
    const targetEmail = user.email;
    if (!targetEmail) return;

    const response = await fetchWithAuth('/api/admin/grant-all', {
      method: 'POST',
      headers,
      body: JSON.stringify({ targetEmail }),
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
    // Sunucu 403 (Forbidden) döndüğünde bu blok çalışır.
    // Bu, kullanıcının admin olmadığını gösterir ve bu durumda hata mesajı göstermeye gerek yoktur.
    if (error instanceof Error && error.message.includes("Forbidden")) {
        // Admin olmayan kullanıcılar için sessizce başarısız ol.
        localStorage.setItem(STORAGE_KEY, 'true'); // Tekrar denemeyi engelle
        return;
    }
    
    console.error("Admin Grant Failed:", error);
    toast.error("Yönetici İşlemi Başarısız", {
        description: error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu. Lütfen konsolu kontrol edin.",
    });
  }
};