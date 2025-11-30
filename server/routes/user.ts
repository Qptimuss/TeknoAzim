import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";
import { parseBody } from "../lib/body-parser";
import { isRequesterAdmin } from "../lib/auth-helpers"; // Yeni import

const updateProfileSchema = z.object({
  name: z.string().min(2).optional(),
  avatar_url: z.string().url().nullable().optional(),
  description: z.string().max(200).nullable().optional(),
  selected_title: z.string().nullable().optional(),
  selected_frame: z.string().nullable().optional(),
});

// Moderasyon fonksiyonunu tekrar tanımlıyoruz (blog.ts'den kopyalandı)
async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.functions.invoke("moderate-comment", {
    body: { content },
  });

  if (error) {
    console.error("Moderasyon servisi çağrılırken hata:", error);
    throw new Error(`Moderasyon servisi hatası: ${error.message}`);
  }

  if (!data || typeof data !== 'object' || data === null) {
    console.error("Moderasyon fonksiyonu geçersiz yanıt döndürdü:", data);
    throw new Error("Moderasyon iç hatası: Geçersiz yanıt yapısı.");
  }

  if (data.error) {
    console.error("Moderasyon fonksiyonu hata döndürdü:", data.error);
    throw new Error(`Moderasyon iç hatası: ${data.error}`);
  }

  if (data.isModerated === false) {
    // Eğer içerik uygunsuzsa, özel bir hata mesajı fırlat
    throw new Error(`İçerik, yapay zeka tarafından uygunsuz içerik barındırdığı için reddedildi. (Sebep: ${data.reason || 'Bilinmiyor'})`);
  }

  return data as { isModerated: boolean };
}


export const handleUpdateProfile: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    // body'yi her zaman parseBody ile alıyoruz
    const bodyData = await parseBody(req);

    const validatedData = updateProfileSchema.partial().parse(bodyData);

    if (Object.keys(validatedData).length === 0) {
      return res.status(400).json({ error: "No valid fields provided for update." });
    }

    // Moderasyon Kontrolleri
    if (validatedData.name) {
        await moderateContent(validatedData.name);
    }
    if (validatedData.description) {
        // Description null olabilir, sadece string ise kontrol et
        if (typeof validatedData.description === 'string' && validatedData.description.length > 0) {
            await moderateContent(validatedData.description);
        }
    }

    const supabaseAdmin = getSupabaseAdmin();

    // Cast gerekli — Supabase types ile uyum için
    const updatePayload = validatedData as Database["public"]["Tables"]["profiles"]["Update"];

    const { data, error } = await (supabaseAdmin
      .from("profiles") as any) // Fix 2
      .update(updatePayload)
      .eq("id", userId)
      .select("id, name, avatar_url, description, selected_title, selected_frame")
      .single();

    if (error) {
      console.error("Supabase update profile error:", error);
      return res.status(500).json({ error: "Failed to update profile." });
    }

    res.status(200).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    
    // Moderasyon hatasını yakala ve 403 döndür
    if (e instanceof Error && e.message.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        return res.status(403).json({ error: e.message });
    }

    console.error("Error updating profile:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

export const handleDeleteUser: RequestHandler = async (req, res) => {
  const userId = req.userId; // Kendi hesabını silen kullanıcı
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { error } = await supabaseAdmin.auth.admin.deleteUser(userId);

    if (error) {
      console.error("Supabase delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user account." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Error deleting user:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// Yeni admin fonksiyonu: Herhangi bir kullanıcının hesabını sil
export const handleAdminDeleteUser: RequestHandler = async (req, res) => {
  const adminUserId = req.userId; // İsteği yapan admin kullanıcısı
  const targetUserId = req.params.id; // Silinecek kullanıcının ID'si

  if (!adminUserId) return res.status(401).json({ error: "Admin User ID missing." });
  if (!targetUserId) return res.status(400).json({ error: "Target User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requesterIsAdmin = await isRequesterAdmin(adminUserId);

    if (!requesterIsAdmin) {
      return res.status(403).json({ error: "Forbidden: Admin privileges required." });
    }

    // Adminin kendi hesabını bu rota üzerinden silmesini engelle (isteğe bağlı)
    if (adminUserId === targetUserId) {
      return res.status(403).json({ error: "Admins cannot delete their own account via this route." });
    }

    const { error } = await supabaseAdmin.auth.admin.deleteUser(targetUserId);

    if (error) {
      console.error("Supabase admin delete user error:", error);
      return res.status(500).json({ error: "Failed to delete user account." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Error deleting user by admin:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};