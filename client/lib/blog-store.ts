import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";
import { apiFetch } from "./api-client";

// Type for creating a new blog post for the API
type NewApiBlogPost = {
  title: string;
  content: string;
  imageUrl?: string;
};

// Type for creating a new comment for the API
type NewApiComment = {
  content: string;
  postId: string;
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

// Upload an avatar image to Supabase Storage
export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  const fileExt = file.name.split('.').pop();
  const fileName = `avatar.${fileExt}`;
  const filePath = `avatars/${userId}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('blog_images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  const { data: { publicUrl } } = supabase.storage
    .from('blog_images')
    .getPublicUrl(filePath);
    
  return `${publicUrl}?t=${new Date().getTime()}`;
};

// --- READ OPERATIONS (Still direct to Supabase) ---

export const getBlogPosts = async (): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`id, title, content, image_url, created_at, user_id, profiles ( id, name, avatar_url, description, selected_title )`)
    .order("created_at", { ascending: false });
  if (error) { console.error("Error fetching blog posts:", error); return []; }
  return data as any;
};

export const getBlogPostById = async (id: string): Promise<BlogPostWithAuthor | null> => {
  const { data, error } = await supabase
    .from("blog_posts")
    .select(`id, title, content, image_url, created_at, user_id, profiles ( id, name, avatar_url, description, selected_title )`)
    .eq("id", id)
    .single();
  if (error) { console.error("Error fetching blog post:", error); return null; }
  return data as any;
};

export const getCommentsForPost = async (postId: string): Promise<CommentWithAuthor[]> => {
  const { data, error } = await supabase
    .from('comments')
    .select(`id, content, created_at, user_id, profiles ( id, name, avatar_url, description, selected_title )`)
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) { console.error('Error fetching comments:', error); return []; }
  return data as any;
};

export const getVoteCounts = async (postId: string) => {
  const { data, error } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId);
  if (error) { console.error('Error fetching votes:', error); return { likes: 0, dislikes: 0 }; }
  const likes = data.filter(v => v.vote_type === 1).length;
  const dislikes = data.filter(v => v.vote_type === -1).length;
  return { likes, dislikes };
};

export const getUserVote = async (postId: string, userId: string) => {
  if (!userId) return null;
  const { data, error } = await supabase.from('post_votes').select('vote_type').eq('post_id', postId).eq('user_id', userId).single();
  if (error || !data) return null;
  return data.vote_type === 1 ? 'liked' : 'disliked';
};

export const getPostsByUserId = async (userId: string): Promise<BlogPostWithAuthor[]> => {
  const { data, error } = await supabase.from("blog_posts").select(`id, title, content, image_url, created_at, user_id, profiles ( id, name, avatar_url, description, selected_title )`).eq('user_id', userId).order("created_at", { ascending: false });
  if (error) { console.error("Error fetching user posts:", error); return []; }
  return data as any;
};

export const getProfileById = async (userId: string): Promise<Profile | null> => {
  const { data, error } = await supabase.from("profiles").select('id, name, avatar_url, description, level, exp, badges, selected_title, selected_frame').eq('id', userId).single();
  if (error) { console.error("Error fetching profile:", error); return null; }
  return data;
};

// --- WRITE OPERATIONS (Use secure API endpoints) ---

export const addBlogPost = async (postData: NewApiBlogPost) => {
  return await apiFetch('/blog/post', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

export const updateBlogPost = async (postId: string, postData: { title: string; content: string; imageUrl?: string | null; }) => {
  return await apiFetch(`/blog/post/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(postData),
  });
};

export const deleteBlogPost = async (postId: string) => {
  return await apiFetch(`/blog/post/${postId}`, {
    method: 'DELETE',
  });
};

export const addComment = async (commentData: NewApiComment) => {
  return await apiFetch('/blog/comment', {
    method: 'POST',
    body: JSON.stringify(commentData),
  });
};

export const deleteComment = async (commentId: string) => {
  return await apiFetch(`/blog/comment/${commentId}`, {
    method: 'DELETE',
  });
};

export const castVote = async (postId: string, voteType: 'like' | 'dislike' | null) => {
  return await apiFetch('/blog/vote', {
    method: 'POST',
    body: JSON.stringify({ postId, voteType: voteType === null ? 'null' : voteType }),
  });
};