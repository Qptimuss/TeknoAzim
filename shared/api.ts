export interface DemoResponse {
  message: string;
}

// This will represent the data coming from the `profiles` table
export interface Profile {
  id: string;
  name: string | null;
  avatar_url: string | null;
  description: string | null;
  level: number;
  exp: number;
  badges: string[];
}

// This will represent a row in the `comments` table, joined with the author's profile
export interface CommentWithAuthor {
  id: string;
  content: string;
  created_at: string;
  user_id: string; // Added for ownership check
  profiles: Profile | null; // The author of the comment
}

// This will represent a row in the `blog_posts` table, joined with the author's profile
export interface BlogPostWithAuthor {
  id: string;
  title: string;
  content: string;
  image_url?: string | null;
  created_at: string;
  profiles: Profile | null; // The author of the blog post
}