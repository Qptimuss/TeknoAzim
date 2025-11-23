import { supabase } from "@/integrations/supabase/client";
import { BlogPostWithAuthor, CommentWithAuthor, Profile } from "@shared/api";

// Type for creating a new blog post
type NewBlogPost = {
  title: string;
  content: string;
  imageUrl?: string;
  userId: string; // Kept for client-side logic if needed, but server ignores it for security
};

// Type for creating a new comment
type NewComment = {
  content: string;
  postId: string;
  userId: string; // Kept for client-side logic if needed, but server ignores it for security
};

// Helper function to fetch with Authorization header
const fetchWithAuth = async (url: string, options: RequestInit = {}) => {
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    throw new Error("Authentication required.");
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${session.access_token}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(errorData.error || response.statusText);
  }

  // Handle 204 No Content response
  if (response.status === 204) {
    return null;
  }

  return response.json();
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
  // Using a subfolder in the existing blog_images bucket
  const filePath = `avatars/${userId}/${fileName}`;

  // Upload the file, overwriting any existing file with the same name
  const { error: uploadError } = await supabase.storage
    .from('blog_images')
    .upload(filePath, file, { upsert: true });

  if (uploadError) {
    console.error('Error uploading avatar:', uploadError);
    throw uploadError;
  }

  // Get the public URL for the uploaded file
  const { data: { publicUrl } } = supabase.storage
    .from('blog_images')
    .getPublicUrl(filePath);
    
  // Append a timestamp as a query parameter to bust browser cache
  return `${publicUrl}?t=${new Date().getTime()}`;
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
      profiles ( id, name, avatar_url, description, selected_title )
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
      profiles ( id, name, avatar_url, description, selected_title )
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
            profiles ( id, name, avatar_url, description, selected_title )
        `)
        .eq('post_id', postId)
        .eq('is_moderated', true) // Only show moderated (safe) comments
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching comments:', error);
        return [];
    }
    return data as any;
};

// Add a new blog post (UPDATED to use Express API)
export const addBlogPost = async (postData: NewBlogPost) => {
  const data = await fetchWithAuth('/api/blog/post', {
    method: 'POST',
    body: JSON.stringify({
      title: postData.title,
      content: postData.content,
      imageUrl: postData.imageUrl,
    }),
  });
  return data;
};

// Update a blog post (UPDATED to use Express API)
export const updateBlogPost = async (postId: string, updateData: { title: string, content: string, imageUrl: string | null | undefined }) => {
  const data = await fetchWithAuth(`/api/blog/post/${postId}`, {
    method: 'PUT',
    body: JSON.stringify(updateData),
  });
  return data;
};

// Delete a blog post and its associated image (UPDATED to use Express API)
export const deleteBlogPost = async (postId: string, imageUrl?: string | null) => {
  // 1. Delete the image from storage if it exists (Client-side storage deletion remains)
  if (imageUrl) {
    try {
      const url = new URL(imageUrl);
      // Path is everything after the bucket name
      const imagePath = url.pathname.split('/blog_images/')[1];
      if (imagePath) {
        const { error: storageError } = await supabase.storage
          .from('blog_images')
          .remove([imagePath]);
        if (storageError) {
          // Log the error but don't block post deletion
          console.error("Error deleting blog image from storage:", storageError);
        }
      }
    } catch (e) {
      console.error("Could not parse image URL to delete from storage:", e);
    }
  }

  // 2. Delete the blog post via server API
  await fetchWithAuth(`/api/blog/post/${postId}`, {
    method: 'DELETE',
  });
};

// Add a new comment (UPDATED to use Express API for moderation)
export const addComment = async (commentData: NewComment) => {
    // Server handles user_id and moderation
    const data = await fetchWithAuth('/api/blog/comment', {
        method: 'POST',
        body: JSON.stringify({
            content: commentData.content,
            postId: commentData.postId,
        }),
    });
    return data;
};

// Delete a comment (UPDATED to use Express API)
export const deleteComment = async (commentId: string) => {
  await fetchWithAuth(`/api/blog/comment/${commentId}`, {
    method: 'DELETE',
  });
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

// Upsert a vote (like/dislike) (UPDATED to use Express API)
export const castVote = async (postId: string, userId: string, voteType: 'like' | 'dislike' | null) => {
    // Server handles user_id and upsert logic
    const apiVoteType = voteType === 'like' ? 'like' : voteType === 'dislike' ? 'dislike' : 'null';
    
    await fetchWithAuth('/api/blog/vote', {
        method: 'POST',
        body: JSON.stringify({
            postId,
            voteType: apiVoteType,
        }),
    });
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
      profiles ( id, name, avatar_url, description, selected_title )
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
    .select('id, name, avatar_url, description, level, exp, badges, selected_title, selected_frame')
    .eq('id', userId)
    .single();

  if (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
  return data;
};