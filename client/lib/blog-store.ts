import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";
import { fetchWithAuth } from "./api-utils";

// --- Blog Post Functions ---

const SUPABASE_URL = "https://bhfshljiqbdxgbpgmllp.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJoZnNobGppcWJkeGdicGdtbGxwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQxNjUyMDQsImV4cCI6MjA3OTc0MTIwNH0.V_g-uODQnktATni-fa_raP8G5rz7e6qO7oMUodhd3aA";

const restHeaders = {
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
};

const handleRestError = async (response: Response, context: string) => {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ message: 'Bilinmeyen bir ağ hatası oluştu.' }));
    console.error(`Error fetching ${context} via REST:`, errorData);
    throw new Error(errorData.message || `Failed to fetch ${context}`);
  }
};

export const getBlogPosts = async (): Promise<BlogPostWithAuthor[]> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=*,profiles(*)&order=created_at.desc`, { headers: restHeaders });
    await handleRestError(response, 'blog posts');
    return await response.json() as BlogPostWithAuthor[];
  } catch (error) {
    console.error("Caught an exception in getBlogPosts:", error);
    return [];
  }
};

export const getBlogPostById = async (id: string): Promise<BlogPostWithAuthor | null> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/blog_posts?select=*,profiles(*)&id=eq.${id}`, { 
      headers: { ...restHeaders, 'Accept': 'application/vnd.pgrst.object+json' }
    });
    if (response.status === 406) return null; // Not found when requesting single object
    await handleRestError(response, 'post by ID');
    return await response.json() as BlogPostWithAuthor;
  } catch (error) {
    console.error("Caught an exception in getBlogPostById:", error);
    return null;
  }
};

export const getPostsByUserId = async (userId: string): Promise<BlogPostWithAuthor[]> => {
  try {
    const response = await fetch(`/api/user/posts/${userId}`);
    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Kullanıcının gönderileri getirilemedi' }));
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }
    return await response.json() as BlogPostWithAuthor[];
  } catch (error) {
    console.error("Caught an exception in getPostsByUserId:", error);
    return [];
  }
};

export const addBlogPost = async (post: { title: string; content: string; userId: string; imageUrl?: string }) => {
  return fetchWithAuth('/api/blog/post', {
    method: 'POST',
    body: JSON.stringify({
      title: post.title,
      content: post.content,
      imageUrl: post.imageUrl,
    }),
  });
};

export const updateBlogPost = async (postId: string, updateData: { title: string; content: string; imageUrl?: string | null }) => {
  return fetchWithAuth(`/api/blog/post/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

export const deleteBlogPost = async (postId: string, imageUrl?: string | null) => {
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      const path = url.pathname.split('/images/')[1];
      if (path) {
        await supabase.storage.from('images').remove([path]);
      }
    } catch (e) {
      console.error("Could not parse or delete image from storage:", e);
    }
  }
  return fetchWithAuth(`/api/blog/post/${postId}`, { method: 'DELETE' });
};

export const uploadBlogImage = async (file: File, userId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Date.now()}.${fileExt}`;
  const filePath = `blog-images/${fileName}`;

  const { error } = await supabase.storage.from('images').upload(filePath, file);
  if (error) {
    console.error('Error uploading blog image:', error);
    return null;
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

// --- Comment Functions ---

export const getCommentsForPost = async (postId: string): Promise<CommentWithAuthor[]> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/comments?select=*,profiles(*)&post_id=eq.${postId}&order=created_at.asc`, { headers: restHeaders });
    await handleRestError(response, 'comments for post');
    return await response.json() as CommentWithAuthor[];
  } catch (error) {
    console.error("Caught an exception in getCommentsForPost:", error);
    return [];
  }
};

export const addComment = async (comment: { postId: string; content: string }): Promise<{ comment: CommentWithAuthor, profile: Profile }> => {
  return fetchWithAuth('/api/blog/comment', {
    method: 'POST',
    body: JSON.stringify(comment),
  });
};

export const deleteComment = async (commentId: string) => {
  return fetchWithAuth(`/api/blog/comment/${commentId}`, { method: 'DELETE' });
};

// --- Vote Functions ---

export const getVoteCounts = async (postId: string): Promise<{ likes: number; dislikes: number }> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/post_votes?select=vote_type&post_id=eq.${postId}`, { headers: restHeaders });
    await handleRestError(response, 'vote counts');
    const data = await response.json();
    const likes = data.filter((v: { vote_type: number }) => v.vote_type === 1).length;
    const dislikes = data.filter((v: { vote_type: number }) => v.vote_type === -1).length;
    return { likes, dislikes };
  } catch (error) {
    console.error("Caught an exception in getVoteCounts:", error);
    return { likes: 0, dislikes: 0 };
  }
};

export const getUserVote = async (postId: string, userId: string): Promise<'liked' | 'disliked' | null> => {
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/post_votes?select=vote_type&post_id=eq.${postId}&user_id=eq.${userId}`, {
      headers: { ...restHeaders, 'Accept': 'application/vnd.pgrst.object+json' }
    });
    if (response.status === 406) return null;
    await handleRestError(response, 'user vote');
    const data = await response.json();
    return data.vote_type === 1 ? 'liked' : 'disliked';
  } catch (error) {
    console.error("Caught an exception in getUserVote:", error);
    return null;
  }
};

export const castVote = async (postId: string, userId: string, voteType: 'like' | 'dislike' | null) => {
  return fetchWithAuth('/api/blog/vote', {
    method: 'POST',
    body: JSON.stringify({
      postId,
      voteType: voteType === null ? 'null' : voteType,
    }),
  });
};

// --- Profile Functions ---

export const updateProfile = async (updateData: Partial<Pick<Profile, 'name' | 'description' | 'avatar_url'>>) => {
  return fetchWithAuth('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
};

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${fileExt}`;

  const { error } = await supabase.storage.from('images').upload(filePath, file, {
    cacheControl: '3600',
    upsert: true,
  });

  if (error) {
    console.error('Supabase Storage Error:', error);
    throw new Error(`Avatar yüklenemedi: ${error.message}`);
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return `${data.publicUrl}?t=${new Date().getTime()}`;
};

export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    const url = new URL(avatarUrl);
    const path = url.pathname.split('/images/')[1];
    if (!path) {
      console.error("Could not determine file path from URL.");
      return;
    }
    const { error } = await supabase.storage.from('images').remove([path]);
    if (error) {
      console.error('Error deleting avatar:', error);
      throw new Error('Avatar could not be deleted.');
    }
  } catch (e) {
    console.error("Error processing avatar URL for deletion:", e);
  }
};