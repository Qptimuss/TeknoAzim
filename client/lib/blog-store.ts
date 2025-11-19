import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";
import { getAuthHeaders } from "./api-utils";

// Type for creating a new blog post
type NewBlogPost = {
  title: string;
  content: string;
  imageUrl?: string;
  userId: string; // This is now only used for image upload path, not DB insertion
};

// Type for updating an existing blog post
type UpdateBlogPost = {
  title: string;
  content: string;
  imageUrl?: string | null;
};

// Type for creating a new comment
type NewComment = {
  content: string;
  postId: string;
  userId: string; // This is now only used for image upload path, not DB insertion
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
      user_id,
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
      user_id,
      profiles(id, name, avatar_url, description)
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

// Add a new blog post (NOW SECURE VIA SERVER)
export const addBlogPost = async (postData: NewBlogPost) => {
  const headers = await getAuthHeaders();
  
  const response = await fetch('/api/blog/post', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      title: postData.title,
      content: postData.content,
      imageUrl: postData.imageUrl,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to add blog post via server.");
  }
  return await response.json();
};

// Update an existing blog post (NOW SECURE VIA SERVER)
export const updateBlogPost = async (postId: string, postData: UpdateBlogPost) => {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/blog/post/${postId}`, {
    method: 'PUT',
    headers,
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to update blog post via server.");
  }
  return await response.json();
};

// Delete a blog post (NOW SECURE VIA SERVER)
export const deleteBlogPost = async (postId: string) => {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/blog/post/${postId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete blog post via server.");
  }
};

// Add a new comment (NOW SECURE VIA SERVER)
export const addComment = async (commentData: NewComment) => {
    const headers = await getAuthHeaders();

    const response = await fetch('/api/blog/comment', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            content: commentData.content,
            postId: commentData.postId,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add comment via server.");
    }
    return await response.json();
};

// Delete a comment (NOW SECURE VIA SERVER)
export const deleteComment = async (commentId: string) => {
  const headers = await getAuthHeaders();

  const response = await fetch(`/api/blog/comment/${commentId}`, {
    method: 'DELETE',
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(errorData.error || "Failed to delete comment via server.");
  }
};

// Fetch vote counts for a post (READ operation, remains client-side)
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

// Get the current user's vote for a post (READ operation, remains client-side)
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

// Upsert a vote (like/dislike) (NOW SECURE VIA SERVER)
export const castVote = async (postId: string, userId: string, voteType: 'like' | 'dislike' | null) => {
    // userId is no longer needed for the API call, but kept in signature for consistency
    const headers = await getAuthHeaders();
    
    const response = await fetch('/api/blog/vote', {
        method: 'POST',
        headers,
        body: JSON.stringify({
            postId,
            voteType: voteType === null ? 'null' : voteType,
        }),
    });

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to cast vote via server.");
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
      user_id,
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

// Fetch a single profile by ID (READ operation, remains client-side)
export const getProfileById = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase
    .from("profiles")
    .select('id, name, avatar_url, description')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};