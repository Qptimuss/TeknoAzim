import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";
import { fetchWithAuth } from "./api-utils";

// --- Blog Posts ---
export const getBlogPosts = async (): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, profiles(*)")
    .order("created_at", { ascending: false });
  
  if (error) {
    console.error("Error fetching blog posts:", error);
    return []; 
  }
  return data as BlogPostWithAuthor[];
};

export const getBlogPostById = async (id: string): Promise<BlogPostWithAuthor | null> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, profiles(*)")
    .eq("id", id)
    .single();
  if (error) {
    console.error("Error fetching post by ID:", error);
    return null;
  }
  return data as BlogPostWithAuthor;
};

export const getPostsByUserId = async (userId: string): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select("*, profiles(*)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return data as BlogPostWithAuthor[];
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
      if (path) await supabase.storage.from('images').remove([path]);
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

// --- Comments ---
export const getCommentsForPost = async (postId: string): Promise<CommentWithAuthor[]> => {
  const { data, error } = await supabase
    .from("comments")
    .select("*, profiles(*)")
    .eq("post_id", postId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return data as CommentWithAuthor[];
};

export const addComment = async (comment: { postId: string; content: string }) => {
  const { data: { session }, error: sessionError } = await supabase.auth.getSession();
  
  if (sessionError) throw new Error(`Supabase session hatası: ${sessionError.message}`);
  if (!session) throw new Error("Kullanıcı kimliği doğrulanmadı. Lütfen tekrar giriş yapın.");

  const response = await fetch('/api/blog/comment', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ postId: comment.postId, content: comment.content }),
  });

  if (!response.ok) {
    let errorMessage = `Sunucu Hatası: ${response.status}`;
    try {
      const errorData = await response.json();
      if (errorData && typeof errorData.error === 'string') errorMessage = errorData.error;
      else if (errorData && errorData.details && Array.isArray(errorData.details)) {
        errorMessage = `Invalid input data. Details: ${errorData.details.map((d: any) => `${d.path.join('.')} - ${d.message}`).join(', ')}`;
      }
    } catch {}
    throw new Error(errorMessage);
  }

  if (response.status === 204) return null;
  return response.json();
};

export const deleteComment = async (commentId: string) => {
  return fetchWithAuth(`/api/blog/comment/${commentId}`, { method: 'DELETE' });
};

// --- Votes ---
export const getVoteCounts = async (postId: string): Promise<{ likes: number; dislikes: number }> => {
  const { data, error } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId);
  if (error) throw new Error(error.message);

  const likes = data.filter(v => v.vote_type === 1).length;
  const dislikes = data.filter(v => v.vote_type === -1).length;
  return { likes, dislikes };
};

export const getUserVote = async (postId: string, userId: string): Promise<'liked' | 'disliked' | null> => {
  const { data, error } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', userId).single();
  if (error || !data) return null;
  return data.vote_type === 1 ? 'liked' : 'disliked';
};

export const castVote = async (postId: string, userId: string, voteType: 'like' | 'dislike' | null) => {
  return fetchWithAuth('/api/blog/vote', { method: 'POST', body: JSON.stringify({ postId, voteType: voteType ?? 'null' }) });
};

// --- Profiles ---
export const getProfileById = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select("*").eq("id", userId).single();
  if (error) {
    console.error("Error fetching profile by ID:", error);
    return null;
  }
  return data as Profile;
};

export const updateProfile = async (updateData: Partial<Pick<Profile, 'name' | 'description' | 'avatar_url'>>) => {
  return fetchWithAuth('/api/profile', { method: 'PUT', body: JSON.stringify(updateData) });
};

export const uploadAvatar = async (file: File, userId: string): Promise<string> => {
  const fileExt = file.name.split('.').pop();
  const filePath = `avatars/${userId}.${fileExt}`;
  const { error } = await supabase.storage.from('images').upload(filePath, file, { cacheControl: '3600', upsert: true });
  if (error) throw new Error(`Avatar yüklenemedi: ${error.message}`);
  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return `${data.publicUrl}?t=${new Date().getTime()}`;
};

export const deleteAvatar = async (avatarUrl: string): Promise<void> => {
  try {
    const url = new URL(avatarUrl);
    const path = url.pathname.split('/images/')[1];
    if (!path) return;
    const { error } = await supabase.storage.from('images').remove([path]);
    if (error) throw new Error('Avatar could not be deleted.');
  } catch (e) {
    console.error("Error processing avatar URL for deletion:", e);
  }
};
