import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";
import { parseBody } from "../lib/body-parser";
import { isRequesterAdmin } from "../lib/auth-helpers"; // Yeni import

// ------------------- VALIDATION SCHEMAS -------------------

const newPostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
});

const updatePostSchema = z.object({
  title: z.string().min(1),
  content: z.string().min(1),
  imageUrl: z.string().url().optional().nullable(),
});

const newCommentSchema = z.object({
  postId: z.string().uuid(),
  content: z.string().min(1),
});

const castVoteSchema = z.object({
  postId: z.string().uuid(),
  voteType: z.enum(["like", "dislike", "null"]),
});

// --- Local Types for Casting ---
type PostOwner = { user_id: string };
type CommentOwner = { user_id: string };

// ------------------- MODERATION -------------------

async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.functions.invoke("moderate-comment", {
    body: { content },
  });

  if (error) {
    console.error("Moderasyon servisi çağrılırken hata:", error);
    throw new Error(`Moderasyon servisi hatası: ${error.message}`);
  }

  // Edge Function'dan gelen yanıtın yapısını kontrol et
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

// ------------------- POST HANDLERS -------------------

// CREATE POST
export const handleCreatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validated = newPostSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();

    // moderation
    await moderateContent(validated.title); // Hata fırlatırsa aşağı inmez
    await moderateContent(validated.content); // Hata fırlatırsa aşağı inmez

    const payload: Database["public"]["Tables"]["blog_posts"]["Insert"] = {
      title: validated.title,
      content: validated.content,
      image_url: validated.imageUrl,
      user_id: userId,
    };

    const { data, error } = await (supabaseAdmin
      .from("blog_posts") as any) // Fix 3
      .insert(payload)
      .select()
      .single();

    if (error) {
      console.error("Insert hatası:", error);
      return res.status(500).json({ error: "Post oluşturulamadı." });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError)
      return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    
    // Moderasyon hatasını yakala ve 403 döndür
    if (e instanceof Error && e.message.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        return res.status(403).json({ error: e.message });
    }

    console.error("Hata:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// UPDATE POST
export const handleUpdatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const bodyData = parseBody(req);
    const validated = updatePostSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();

    // Ownership control
    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existing)
      return res.status(404).json({ error: "Post bulunamadı." });

    if ((existing as PostOwner).user_id !== userId) // Fix 4
      return res.status(403).json({ error: "Yetkisiz." });

    // Moderation for updates
    if (validated.title) await moderateContent(validated.title);
    if (validated.content) await moderateContent(validated.content);

    const payload: Database["public"]["Tables"]["blog_posts"]["Update"] = {
      title: validated.title,
      content: validated.content,
      image_url: validated.imageUrl,
    };

    const { data, error } = await (supabaseAdmin
      .from("blog_posts") as any) // Fix 5
      .update(payload)
      .eq("id", postId)
      .select()
      .single();

    if (error)
      return res.status(500).json({ error: "Post güncellenemedi." });

    res.status(200).json(data);
  } catch (e) {
    if (e instanceof z.ZodError)
      return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    
    // Moderasyon hatasını yakala ve 403 döndür
    if (e instanceof Error && e.message.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        return res.status(403).json({ error: e.message });
    }

    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE POST
export const handleDeletePost: RequestHandler = async (req, res) => {
  const userId = req.userId; // İsteği yapan kullanıcı
  const postId = req.params.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requesterIsAdmin = await isRequesterAdmin(userId); // Admin kontrolü

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existing)
      return res.status(404).json({ error: "Post bulunamadı." });

    // Eğer istek yapan admin değilse VE postun sahibi değilse, yetkisiz hatası ver
    if (!requesterIsAdmin && (existing as PostOwner).user_id !== userId)
      return res.status(403).json({ error: "Forbidden: You can only delete your own posts." });

    await supabaseAdmin.from("blog_posts").delete().eq("id", postId);

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// ADD COMMENT
export const handleAddComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const bodyData = parseBody(req);
    const validated = newCommentSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();

    // Moderation
    await moderateContent(validated.content); // Hata fırlatırsa aşağı inmez

    const payload: Database["public"]["Tables"]["comments"]["Insert"] = {
      content: validated.content,
      post_id: validated.postId,
      user_id: userId,
    };

    const { data, error } = await (supabaseAdmin
      .from("comments") as any) // Fix 7
      .insert(payload)
      .select()
      .single();

    if (error)
      return res.status(500).json({ error: "Yorum eklenemedi." });

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError)
      return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    
    // Moderasyon hatasını yakala ve 403 döndür
    if (e instanceof Error && e.message.includes("uygunsuz içerik barındırdığı için reddedildi")) {
        return res.status(403).json({ error: e.message });
    }

    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE COMMENT
export const handleDeleteComment: RequestHandler = async (req, res) => {
  const userId = req.userId; // İsteği yapan kullanıcı
  const commentId = req.params.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    const requesterIsAdmin = await isRequesterAdmin(userId); // Admin kontrolü

    const { data: existing, error } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (error || !existing)
      return res.status(404).json({ error: "Yorum bulunamadı." });

    // Eğer istek yapan admin değilse VE yorumun sahibi değilse, yetkisiz hatası ver
    if (!requesterIsAdmin && (existing as CommentOwner).user_id !== userId)
      return res.status(403).json({ error: "Forbidden: You can only delete your own comments." });

    await supabaseAdmin.from("comments").delete().eq("id", commentId);

    res.status(204).send();
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// VOTE
export const handleCastVote: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const bodyData = parseBody(req);
    const validated = castVoteSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();

    if (validated.voteType === "null") {
      await supabaseAdmin
        .from("post_votes")
        .delete()
        .eq("post_id", validated.postId)
        .eq("user_id", userId);
    } else {
      const payload: Database["public"]["Tables"]["post_votes"]["Insert"] = {
        post_id: validated.postId,
        user_id: userId,
        vote_type: validated.voteType === "like" ? 1 : -1,
      };

      await (supabaseAdmin
        .from("post_votes") as any) // Fix 9
        .upsert(payload, { onConflict: "user_id, post_id" });
    }

    res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError)
      return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });

    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};