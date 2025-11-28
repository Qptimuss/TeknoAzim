import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";
import { parseBody } from "../lib/body-parser";
import { SERVER_EXP_ACTIONS, BADGE_REWARD_GEMS } from "../lib/gamification-constants";

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

// ------------------- MODERATION -------------------

async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.functions.invoke("moderate-comment", {
    body: { content },
  });

  if (error) {
    console.error("Moderasyon servisi hatası:", error);
    throw new Error(`Moderasyon servisi hatası: ${error.message}`);
  }

  if (!data || data.error) {
    console.error("Moderasyon fonksiyonu hata döndürdü:", data?.error);
    throw new Error(`Moderasyon iç hatası: ${data?.error || "Bilinmeyen hata"}`);
  }

  return data as { isModerated: boolean };
}

// ------------------- BADGE SYSTEM -------------------

async function awardBadgeIfMissing(userId: string, badgeName: string, supabaseAdmin: any): Promise<boolean> {
  const { data: profile, error } = await supabaseAdmin
    .from("profiles")
    .select("badges, exp, gems")
    .eq("id", userId)
    .single();

  if (error || !profile) {
    console.error("Profil bulunamadı:", error);
    return false;
  }

  if (!profile.badges.includes(badgeName)) {
    const updatedBadges = [...profile.badges, badgeName];

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        badges: updatedBadges,
        exp: profile.exp + SERVER_EXP_ACTIONS.EARN_BADGE,
        gems: profile.gems + BADGE_REWARD_GEMS,
      })
      .eq("id", userId);

    if (updateError) {
      console.error("Badge verilemedi:", updateError);
      return false;
    }

    return true;
  }

  return false;
}

// ------------------- CONTROLLERS -------------------

// CREATE POST
export const handleCreatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validated = newPostSchema.parse(bodyData);
    const supabaseAdmin = getSupabaseAdmin();

    // moderation
    const { isModerated: titleModerated } = await moderateContent(validated.title);
    if (!titleModerated)
      return res.status(403).json({ error: "Başlık uygunsuz içerik içeriyor." });

    const { isModerated: contentModerated } = await moderateContent(validated.content);
    if (!contentModerated)
      return res.status(403).json({ error: "İçerik uygunsuz içerik içeriyor." });

    const payload: Database["public"]["Tables"]["blog_posts"]["Insert"] = {
      title: validated.title,
      content: validated.content,
      image_url: validated.imageUrl,
      user_id: userId,
    };

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
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

    if (existing.user_id !== userId)
      return res.status(403).json({ error: "Yetkisiz." });

    const payload: Database["public"]["Tables"]["blog_posts"]["Update"] = {
      title: validated.title,
      content: validated.content,
      image_url: validated.imageUrl,
    };

    const { data, error } = await supabaseAdmin
      .from("blog_posts")
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

    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE POST
export const handleDeletePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existing, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    if (fetchError || !existing)
      return res.status(404).json({ error: "Post bulunamadı." });

    if (existing.user_id !== userId)
      return res.status(403).json({ error: "Yetkisiz." });

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

    const { isModerated } = await moderateContent(validated.content);
    if (!isModerated)
      return res.status(403).json({ error: "Yorum uygunsuz içerik içeriyor." });

    const payload: Database["public"]["Tables"]["comments"]["Insert"] = {
      content: validated.content,
      post_id: validated.postId,
      user_id: userId,
    };

    const { data, error } = await supabaseAdmin
      .from("comments")
      .insert(payload)
      .select()
      .single();

    if (error)
      return res.status(500).json({ error: "Yorum eklenemedi." });

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError)
      return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });

    console.error(e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE COMMENT
export const handleDeleteComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const commentId = req.params.id;

  if (!userId) return res.status(401).json({ error: "Unauthorized." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existing, error } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    if (error || !existing)
      return res.status(404).json({ error: "Yorum bulunamadı." });

    if (existing.user_id !== userId)
      return res.status(403).json({ error: "Yetkisiz." });

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

      await supabaseAdmin
        .from("post_votes")
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
