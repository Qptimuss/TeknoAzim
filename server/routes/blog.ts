import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";

// --- Schemas for validation ---
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
  voteType: z.enum(['like', 'dislike', 'null']),
});

// --- Helper function for moderation ---
async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();

  const { data, error } = await supabaseAdmin.functions.invoke('moderate-comment', {
    body: { content },
  });

  if (error) {
    console.error("Moderasyon servisi çağrısında hata:", error);
    throw new Error(`Moderasyon servisi hatası: ${error.message}`);
  }

  if (!data || data.error) {
    console.error("Moderasyon fonksiyonu hata döndürdü:", data?.error);
    throw new Error(`Moderasyon servisi iç hatası: ${data?.error || 'Bilinmeyen hata'}`);
  }

  return data as { isModerated: boolean };
}

// --- Handlers ---

// POST /api/blog/post
export const handleCreatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const validatedData = newPostSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // Moderasyon: başlık ve içerik
    const { isModerated: titleModerated } = await moderateContent(validatedData.title);
    if (!titleModerated) return res.status(403).json({ error: "Blog başlığı uygunsuz içerik barındırıyor." });

    const { isModerated: contentModerated } = await moderateContent(validatedData.content);
    if (!contentModerated) return res.status(403).json({ error: "Blog içeriği uygunsuz içerik barındırıyor." });

    const insertPayload: Database['public']['Tables']['blog_posts']['Insert'] = {
      title: validatedData.title,
      content: validatedData.content,
      image_url: validatedData.imageUrl,
      user_id: userId,
    };

    const { data, error } = await (supabaseAdmin.from('blog_posts') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert hatası:", error);
      return res.status(500).json({ error: "Blog gönderisi oluşturulamadı." });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    console.error("Blog oluşturma hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// PUT /api/blog/post/:id
export const handleUpdatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const validatedData = updatePostSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // Moderasyon
    const { isModerated: titleModerated } = await moderateContent(validatedData.title);
    if (!titleModerated) return res.status(403).json({ error: "Blog başlığı uygunsuz içerik barındırıyor." });

    const { isModerated: contentModerated } = await moderateContent(validatedData.content);
    if (!contentModerated) return res.status(403).json({ error: "Blog içeriği uygunsuz içerik barındırıyor." });

    // Sahiplik kontrolü
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    type PostOwner = Pick<Database['public']['Tables']['blog_posts']['Row'], 'user_id'>;
    const postOwner = existingPost as PostOwner | null;

    if (fetchError || !postOwner) return res.status(404).json({ error: "Blog gönderisi bulunamadı." });
    if (postOwner.user_id !== userId) return res.status(403).json({ error: "Bu gönderiyi düzenleme yetkiniz yok." });

    const updatePayload: Database['public']['Tables']['blog_posts']['Update'] = {
      title: validatedData.title,
      content: validatedData.content,
      image_url: validatedData.imageUrl,
    };

    const { data, error } = await (supabaseAdmin.from('blog_posts') as any)
      .update(updatePayload)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update hatası:", error);
      return res.status(500).json({ error: "Blog gönderisi güncellenemedi." });
    }

    res.status(200).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    console.error("Blog güncelleme hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE /api/blog/post/:id
export const handleDeletePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    type PostOwner = Pick<Database['public']['Tables']['blog_posts']['Row'], 'user_id'>;
    const postOwner = existingPost as PostOwner | null;

    if (fetchError || !postOwner) return res.status(404).json({ error: "Blog gönderisi bulunamadı." });
    if (postOwner.user_id !== userId) return res.status(403).json({ error: "Bu gönderiyi silme yetkiniz yok." });

    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error("Supabase delete hatası:", error);
      return res.status(500).json({ error: "Blog gönderisi silinemedi." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Blog silme hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// POST /api/blog/comment
export const handleAddComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const validatedData = newCommentSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    const { isModerated } = await moderateContent(validatedData.content);
    if (!isModerated) return res.status(403).json({ error: "Yorumunuz uygunsuz içerik barındırıyor." });

    const insertPayload: Database['public']['Tables']['comments']['Insert'] = {
      content: validatedData.content,
      post_id: validatedData.postId,
      user_id: userId,
    };

    const { data, error } = await (supabaseAdmin.from('comments') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase comment insert hatası:", error);
      return res.status(500).json({ error: "Yorum eklenemedi." });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    console.error("Yorum ekleme hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// DELETE /api/blog/comment/:id
export const handleDeleteComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const commentId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const supabaseAdmin = getSupabaseAdmin();

    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    type CommentOwner = Pick<Database['public']['Tables']['comments']['Row'], 'user_id'>;
    const commentOwner = existingComment as CommentOwner | null;

    if (fetchError || !commentOwner) return res.status(404).json({ error: "Yorum bulunamadı." });
    if (commentOwner.user_id !== userId) return res.status(403).json({ error: "Bu yorumu silme yetkiniz yok." });

    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error("Supabase comment delete hatası:", error);
      return res.status(500).json({ error: "Yorum silinemedi." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Yorum silme hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};

// POST /api/blog/vote
export const handleCastVote: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID eksik." });

  try {
    const validatedData = castVoteSchema.parse(req.body);
    const { postId, voteType } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();

    if (voteType === 'null') {
      const { error } = await supabaseAdmin
        .from('post_votes')
        .delete()
        .eq('post_id', postId)
        .eq('user_id', userId);
      if (error) throw error;
    } else {
      const upsertPayload: Database['public']['Tables']['post_votes']['Insert'] = {
        post_id: postId,
        user_id: userId,
        vote_type: voteType === 'like' ? 1 : -1,
      };

      const { error } = await (supabaseAdmin.from('post_votes') as any)
        .upsert(upsertPayload, { onConflict: 'user_id, post_id' });
      if (error) throw error;
    }

    res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError) return res.status(400).json({ error: "Geçersiz veri.", details: e.errors });
    console.error("Oy verme hatası:", e);
    res.status(500).json({ error: "Sunucu hatası." });
  }
};
