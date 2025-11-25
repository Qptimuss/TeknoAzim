import { fetchWithAuth } from './auth';
import { Profile, Post, Comment } from '@shared/api';
import { getSupabase } from './supabase';

// Type for updating profile data
type UpdateProfileData = {
  name?: string;
  description?: string | null;
  avatar_url?: string | null;
};

// Type for creating a new post
type CreatePostData = {
  title: string;
  content: string;
  image_url?: string;
};

// Type for casting a vote
type CastVoteData = {
  post_id: string;
  vote_type: 'up' | 'down';
};

/**
 * Fetches the current user's profile.
 * @returns The user profile object.
 */
export const getProfile = async (): Promise<Profile> => {
  return fetchWithAuth('/api/profile');
};

/**
 * Updates the current user's profile.
 * @param profileData The data to update.
 * @returns The updated profile object.
 */
export const updateProfile = async (profileData: UpdateProfileData): Promise<Profile> => {
  return fetchWithAuth('/api/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  });
};

/**
 * Uploads a new avatar image to Supabase Storage.
 * @param file The image file to upload.
 * @param userId The ID of the user.
 * @returns The public URL of the uploaded image.
 */
export const uploadAvatar = async (file: File, userId: string): Promise<string | null> => {
  const supabase = getSupabase();
  const fileExt = file.name.split('.').pop();
  const fileName = `${userId}-${Math.random()}.${fileExt}`;
  const filePath = `avatars/${fileName}`;

  const { error } = await supabase.storage.from('images').upload(filePath, file);

  if (error) {
    console.error('Error uploading avatar:', error);
    return null;
  }

  const { data } = supabase.storage.from('images').getPublicUrl(filePath);
  return data.publicUrl;
};

/**
 * Creates a new blog post.
 * @param postData The data for the new post.
 * @returns The newly created post object.
 */
export const createPost = async (postData: CreatePostData): Promise<Post> => {
  return fetchWithAuth('/api/blog/post', {
    method: 'POST',
    body: JSON.stringify(postData),
  });
};

/**
 * Casts a vote on a post.
 * @param postId The ID of the post to vote on.
 * @param voteType The type of vote ('up' or 'down').
 * @returns The updated post object with new vote counts.
 */
export const castVote = async (postId: string, voteType: 'up' | 'down'): Promise<Post> => {
  const voteData: CastVoteData = {
    post_id: postId,
    vote_type: voteType,
  };

  const updatedPost = await fetchWithAuth('/api/blog/vote', {
    method: 'POST',
    body: JSON.stringify(voteData),
  });

  return updatedPost;
};