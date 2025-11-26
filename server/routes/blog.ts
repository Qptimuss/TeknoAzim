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

// Helper function to call the Edge Function for moderation
async function moderateContent(content: string): Promise<{ isModerated: boolean }> {
  const supabaseAdmin = getSupabaseAdmin();
  
  // Invoke the Edge Function
  const { data, error } = await supabaseAdmin.functions.invoke('moderate-comment', {
    body: { content },
  });

  if (error) {
    console.error("Error invoking moderation function:", error);
    // If the moderation service fails, we default to allowing the content (isModerated: true)
    return { isModerated: true }; 
  }

  // The Edge Function returns { isModerated: boolean, ... }
  return data as { isModerated: boolean };
}

// --- Handlers ---

// POST /api/blog/post
export const handleCreatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = newPostSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // --- Moderation Step for Title and Content ---
    const { isModerated: titleModerated } = await moderateContent(validatedData.title);
    if (!titleModerated) {
      return res.status(403).json({ error: "Blog başlığı uygunsuz içerik barındırdığı için reddedildi." });
    }
    
    const { isModerated: contentModerated } = await moderateContent(validatedData.content);
    if (!contentModerated) {
      return res.status(403).json({ error: "Blog içeriği uygunsuz içerik barındırdığı için reddedildi." });
    }

    const insertPayload: Database['public']['Tables']['blog_posts']['Insert'] = {
        title: validatedData.title,
        content: validatedData.content,
        image_url: validatedData.imageUrl,
        user_id: userId, // Enforce user ID from JWT, not client input
    };

    // Server-side insertion, ensuring user_id is set by the authenticated user
    const { data, error } = await (supabaseAdmin
      .from("blog_posts") as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to create blog post." });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error creating post:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// PUT /api/blog/post/:id
export const handleUpdatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = updatePostSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // --- Moderation Step for Title and Content ---
    const { isModerated: titleModerated } = await moderateContent(validatedData.title);
    if (!titleModerated) {
      return res.status(403).json({ error: "Blog başlığı uygunsuz içerik barındırdığı için reddedildi." });
    }
    
    const { isModerated: contentModerated } = await moderateContent(validatedData.content);
    if (!contentModerated) {
      return res.status(403).json({ error: "Blog içeriği uygunsuz içerik barındırdığı için reddedildi." });
    }

    // 1. Check ownership (using RLS bypass capability of supabaseAdmin)
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    // Tip ataması yapıldı
    type PostOwner = Pick<Database['public']['Tables']['blog_posts']['Row'], 'user_id'>;
    const postOwner = existingPost as PostOwner | null;

    if (fetchError || !postOwner) {
      return res.status(404).json({ error: "Blog post not found." });
    }

    if (postOwner.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this post." });
    }

    const updatePayload: Database['public']['Tables']['blog_posts']['Update'] = {
        title: validatedData.title,
        content: validatedData.content,
        image_url: validatedData.imageUrl,
    };

    // 2. Perform update
    const { data, error } = await (supabaseAdmin
      .from("blog_posts") as any)
      .update(updatePayload)
      .eq('id', postId)
      .select()
      .single();

    if (error) {
      console.error("Supabase update error:", error);
      return res.status(500).json({ error: "Failed to update blog post." });
    }

    res.status(200).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error updating post:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// DELETE /api/blog/post/:id
export const handleDeletePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const postId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Check ownership
    const { data: existingPost, error: fetchError } = await supabaseAdmin
      .from("blog_posts")
      .select("user_id")
      .eq("id", postId)
      .single();

    // Tip ataması yapıldı
    type PostOwner = Pick<Database['public']['Tables']['blog_posts']['Row'], 'user_id'>;
    const postOwner = existingPost as PostOwner | null;

    if (fetchError || !postOwner) {
      return res.status(404).json({ error: "Blog post not found." });
    }

    if (postOwner.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this post." });
    }

    // 2. Perform deletion
    const { error } = await supabaseAdmin
      .from('blog_posts')
      .delete()
      .eq('id', postId);

    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete blog post." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Error deleting post:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/blog/comment
export const handleAddComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = newCommentSchema.parse(req.body);
    const supabaseAdmin = getSupabaseAdmin();

    // --- Moderation Step ---
    const { isModerated } = await moderateContent(validatedData.content);
    
    if (!isModerated) {
      // If the comment is toxic, reject it immediately.
      return res.status(403).json({ error: "Yorumunuz, yapay zeka tarafından uygunsuz içerik barındırdığı için reddedildi." });
    }

    const insertPayload: Database['public']['Tables']['comments']['Insert'] = {
        content: validatedData.content,
        post_id: validatedData.postId,
        user_id: userId,
        // is_moderated alanı comments tablosunda yok, bu yüzden kaldırıldı.
    };

    // Server-side insertion, enforcing user_id from JWT
    const { data, error } = await (supabaseAdmin
      .from('comments') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to add comment." });
    }

    res.status(201).json(data);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error adding comment:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// DELETE /api/blog/comment/:id
export const handleDeleteComment: RequestHandler = async (req, res) => {
  const userId = req.userId;
  const commentId = req.params.id;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const supabaseAdmin = getSupabaseAdmin();
    // 1. Check ownership
    const { data: existingComment, error: fetchError } = await supabaseAdmin
      .from("comments")
      .select("user_id")
      .eq("id", commentId)
      .single();

    // Tip ataması yapıldı
    type CommentOwner = Pick<Database['public']['Tables']['comments']['Row'], 'user_id'>;
    const commentOwner = existingComment as CommentOwner | null;

    if (fetchError || !commentOwner) {
      return res.status(404).json({ error: "Comment not found." });
    }

    if (commentOwner.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden: You do not own this comment." });
    }

    // 2. Perform deletion
    const { error } = await supabaseAdmin
      .from('comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      console.error("Supabase delete error:", error);
      return res.status(500).json({ error: "Failed to delete comment." });
    }

    res.status(204).send();
  } catch (e) {
    console.error("Error deleting comment:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};

// POST /api/blog/vote
export const handleCastVote: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const validatedData = castVoteSchema.parse(req.body);
    const { postId, voteType } = validatedData;
    const supabaseAdmin = getSupabaseAdmin();

    if (voteType === 'null') {
      // Remove vote
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

      // Add or update vote
      const { error } = await (supabaseAdmin
        .from('post_votes') as any)
        .upsert(upsertPayload, { onConflict: 'user_id, post_id' });
      if (error) throw error;
    }

    res.status(204).send();
  } catch (e) {
    if (e instanceof z.ZodError) {
      return res.status(400).json({ error: "Invalid input data.", details: e.errors });
    }
    console.error("Error casting vote:", e);
    res.status(500).json({ error: "Internal server error." });
  }
};