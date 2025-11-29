export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string | null;
          avatar_url: string | null;
          description: string | null;
          level: number;
          exp: number;
          badges: string[];
          selected_title: string | null;
          owned_frames: string[] | null;
          selected_frame: string | null;
          gems: number;
          last_daily_reward_claimed_at: string | null;
        };
        Insert: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          description?: string | null;
          level?: number;
          exp?: number;
          badges?: string[];
          selected_title?: string | null;
          owned_frames?: string[] | null;
          selected_frame?: string | null;
          gems?: number;
          last_daily_reward_claimed_at?: string | null;
        };
        Update: {
          id?: string;
          name?: string | null;
          avatar_url?: string | null;
          description?: string | null;
          level?: number;
          exp?: number;
          badges?: string[];
          selected_title?: string | null;
          owned_frames?: string[] | null;
          selected_frame?: string | null;
          gems?: number;
          last_daily_reward_claimed_at?: string | null;
        };
      };
      blog_posts: {
        Row: {
          id: string;
          title: string;
          content: string;
          image_url: string | null;
          created_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          image_url?: string | null;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          image_url?: string | null;
          created_at?: string;
          user_id?: string;
        };
      };
      comments: {
        Row: {
          id: string;
          content: string;
          created_at: string;
          post_id: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          content: string;
          created_at?: string;
          post_id: string;
          user_id: string;
        };
        Update: {
          id?: string;
          content?: string;
          created_at?: string;
          post_id?: string;
          user_id?: string;
        };
      };
      post_votes: {
        Row: {
          post_id: string;
          user_id: string;
          vote_type: number; // 1 for like, -1 for dislike
          created_at: string;
        };
        Insert: {
          post_id: string;
          user_id: string;
          vote_type: number;
          created_at?: string;
        };
        Update: {
          post_id?: string;
          user_id?: string;
          vote_type?: number;
          created_at?: string;
        };
      };
      announcements: { // Admin duyuruları tablosu
        Row: {
          id: string;
          title: string;
          content: string;
          created_at: string;
          user_id: string; // Admin ID
        };
        Insert: {
          id?: string;
          title: string;
          content: string;
          created_at?: string;
          user_id: string;
        };
        Update: {
          id?: string;
          title?: string;
          content?: string;
          created_at?: string;
          user_id?: string;
        };
      };
      first_commenters: { // İlk yorum yapan kullanıcılar
        Row: {
          id: number;
          user_id: string;
          post_id: string;
          created_at: string;
        };
        Insert: {
          id?: number;
          user_id: string;
          post_id: string;
          created_at?: string;
        };
        Update: {
          id?: number;
          user_id?: string;
          post_id?: string;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
    CompositeTypes: {};
  };
}
