import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";

// Type for creating a new blog post
type NewBlogPost = {
  title: string;
  content: string;
  imageUrl?: string;
  userId: string;
};

// Type for creating a new comment
type NewComment = {
  content: string;
  postId: string;
  userId: string;
};

// Upload a blog image to Supabase Storage
export const uploadBlogImage = async (file: File, userId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog_images')
    .upload(filePath, file);

  if (uploadError) {
    console.error('Error uploading image:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog_images')
    .getPublicUrl(filePath);
    
  return publicUrl;
};


// Fetch all blog posts with their authors
export const getBlogPosts = async (): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      profiles ( id, name, avatar_url, description )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching blog posts:", error);
    return [];
  }
  return data as any; // Cast because Supabase type gen is not available
};

// Fetch a single blog post by ID
export const getBlogPostById = async (id: string): Promise<BlogPostWithAuthor | null> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      profiles ( id, name, avatar_url, description )
    `)
    .eq("id", id)
    .single();

  if (error) {
    console.error("Error fetching blog post:", error);
    return null;
  }
  return data as any;
};

// Fetch comments for a specific post
export const getCommentsForPost = async (postId: string): Promise<CommentWithAuthor[]> => {
    const { data, error } = await supabase
        .from('comments')
        .select(`
            id,
            content,
            created_at,
            user_id,
            profiles ( id, name, avatar_url, description )
        `)
        .eq('post_id', postId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
    return data as any;
};

// Add a new blog post
export const addBlogPost = async (postData: NewBlogPost) => {
  const { data, error } = await supabase
    .from("blog_posts")
    .insert({
      title: postData.title,
      content: postData.content,
      image_url: postData.imageUrl,
      user_id: postData.userId,
    })
    .select()
    .single();

  if (error) {
    console.error("Error adding blog post:", error);
    throw error;
  }
  return data;
};

// Add a new comment
export const addComment = async (commentData: NewComment) => {
    const { data, error } = await supabase
        .from('comments')
        .insert({
            content: commentData.content,
            post_id: commentData.postId,
            user_id: commentData.userId,
        });

    if (error) {
        console.error('Error adding comment:', error);
        throw error;
    }
    return data;
};

// Delete a comment
export const deleteComment = async (commentId: string) => {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId);

  if (error) {
    console.error('Error deleting comment:', error);
    throw error;
  }
};

// Fetch vote counts for a post
export const getVoteCounts = async (postId: string) => {
    const { data, error } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId);

    if (error) {
        console.error('Error fetching votes:', error);
        return { likes: 0, dislikes: 0 };
    }

    const likes = data.filter(v => v.vote_type === 1).length;
    const dislikes = data.filter(v => v.vote_type === -1).length;

    return { likes, dislikes };
};

// Get the current user's vote for a post
export const getUserVote = async (postId: string, userId: string) => {
    if (!userId) return null;
    const { data, error } = await supabase
        .from('post_votes')
        .select('vote_type')
        .eq('post_id', postId)
        .eq('user_id', userId)
        .single();

    if (error || !data) {
        return null;
    }
    return data.vote_type === 1 ? 'liked' : 'disliked';
};

// Upsert a vote (like/dislike)
export const castVote = async (postId: string, userId: string, voteType: 'like' | 'dislike' | null) => {
    if (voteType === null) {
        // Remove vote
        const { error } = await supabase
            .from('post_votes')
            .delete()
            .eq('post_id', postId)
            .eq('user_id', userId);
        if (error) throw error;
    } else {
        // Add or update vote
        const { error } = await supabase
            .from('post_votes')
            .upsert({
                post_id: postId,
                user_id: userId,
                vote_type: voteType === 'like' ? 1 : -1,
            }, { onConflict: 'user_id, post_id' });
        if (error) throw error;
    }
};

export const getPostsByUserId = async (userId: string): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`
      id,
      title,
      content,
      image_url,
      created_at,
      profiles ( id, name, avatar_url, description )
    `)
    .eq('user_id', userId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching user posts:", error);
    return [];
  }
  return data as any;
};

// Fetch a single profile by ID
export const getProfileById = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select('id, name, avatar_url, description, level, exp, badges')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};