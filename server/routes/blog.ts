import { RequestHandler } from "express";
import { getSupabaseAdmin } from "../lib/supabase-admin";
import { z } from "zod";
import { Database } from "../lib/database.types";
import { parseBody } from "../lib/body-parser";
import { SERVER_EXP_ACTIONS, BADGE_REWARD_GEMS } from "../lib/gamification-constants";

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
    // Eğer Edge Function çağrısı başarısız olursa, sunucu hatası fırlat.
    throw new Error(`Moderasyon servisi hatası: ${error.message}`);
  }

  // The Edge Function returns { isModerated: boolean, ... }
  // Eğer Edge Function'dan 500 hatası gelirse, data null olabilir.
  if (!data || data.error) {
      console.error("Moderation function returned an error:", data?.error);
      throw new Error(`Moderasyon servisi iç hatası: ${data?.error || 'Bilinmeyen hata'}`);
  }
  
  return data as { isModerated: boolean };
}

// Helper function to award a badge if the user doesn't have it
async function awardBadgeIfMissing(userId: string, badgeName: string, supabaseAdmin: any): Promise<boolean> {
    const { data: profileData, error: fetchError } = await supabaseAdmin.from('profiles').select('badges, exp, gems').eq('id', userId).single();
    
    if (fetchError || !profileData) {
        console.error(`Could not fetch profile for user ${userId} to award badge ${badgeName}.`, fetchError);
        return false;
    }

    if (profileData && !profileData.badges.includes(badgeName)) {
        const newBadges = [...profileData.badges, badgeName];
        const newExp = profileData.exp + SERVER_EXP_ACTIONS.EARN_BADGE;
        const newGems = profileData.gems + BADGE_REWARD_GEMS;
        
        const { error: updateError } = await supabaseAdmin.from('profiles').update({ badges: newBadges, exp: newExp, gems: newGems }).eq('id', userId);
        if (updateError) {
            console.error(`Failed to award badge ${badgeName} to user ${userId}.`, updateError);
            return false;
        }
        return true;
    }
    return false;
}

// Helper function to check and award badges based on like counts
async function checkAndAwardLikeBadges(postId: string, supabaseAdmin: any) {
    try {
        // 1. Get total like count
        const { count: likeCount, error: countError } = await supabaseAdmin
            .from('post_votes')
            .select('*', { count: 'exact', head: true })
            .eq('post_id', postId)
            .eq('vote_type', 1);

        if (countError) throw countError;

        // 2. Get post author
        const { data: post, error: postError } = await supabaseAdmin
            .from('blog_posts')
            .select('user_id')
            .eq('id', postId)
            .single();

        if (postError || !post) throw postError || new Error("Post not found");

        const postAuthorId = post.user_id;

        // 3. Check for badge milestones
        if (likeCount === 2) {
            await awardBadgeIfMissing(postAuthorId, "Beğeni Başlangıcı", supabaseAdmin);
        } else if (likeCount === 5) {
            await awardBadgeIfMissing(postAuthorId, "Beğeni Mıknatısı", supabaseAdmin);
        } else if (likeCount === 10) {
            await awardBadgeIfMissing(postAuthorId, "Popüler Yazar", supabaseAdmin);
        }
    } catch (error) {
        console.error(`Error checking for like badges on post ${postId}:`, error);
        // We don't re-throw, as this is a non-critical side effect. The main vote operation succeeded.
    }
}


// --- Handlers ---

// POST /api/blog/post
export const handleCreatePost: RequestHandler = async (req, res) => {
  const userId = req.userId;
  if (!userId) return res.status(401).json({ error: "User ID missing." });

  try {
    const bodyData = parseBody(req);
    const validatedData = newPostSchema.parse(bodyData);
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
    const bodyData = parseBody(req);
    const validatedData = updatePostSchema.parse(bodyData);
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
    const bodyData = parseBody(req);
    const validatedData = newCommentSchema.parse(bodyData);
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
    };

    // Server-side insertion, enforcing user_id from JWT
    const { data: newComment, error } = await (supabaseAdmin
      .from('comments') as any)
      .insert(insertPayload)
      .select()
      .single();

    if (error) {
      console.error("Supabase insert error:", error);
      return res.status(500).json({ error: "Failed to add comment." });
    }

    // --- Badge Logic ---
    // Check if it's the first comment on the post. The DB trigger will have already run.
    const { count: commentCount } = await supabaseAdmin
      .from('comments')
      .select('*', { count: 'exact', head: true })
      .eq('post_id', validatedData.postId);

    if (commentCount === 1) {
      await awardBadgeIfMissing(userId, "İlk Yorumcu", supabaseAdmin);
    }

    // Check for "Hızlı Parmaklar" badge
    const { count: firstCommenterCount } = await supabaseAdmin
      .from('first_commenters')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);

    if (firstCommenterCount === 3) {
      await awardBadgeIfMissing(userId, "Hızlı Parmaklar", supabaseAdmin);
    }

    // Fetch the final state of the profile and return it
    const { data: finalProfile } = await supabaseAdmin.from('profiles').select('*').eq('id', userId).single();

    res.status(201).json({ comment: newComment, profile: finalProfile });

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
    const bodyData = parseBody(req);
    const validatedData = castVoteSchema.parse(bodyData);
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

      // If it was a 'like', check for badges
      if (voteType === 'like') {
        await checkAndAwardLikeBadges(postId, supabaseAdmin);
      }
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