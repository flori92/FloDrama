// Types pour Supabase Database
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      dramas: {
        Row: {
          id: string
          title: string
          original_title: string | null
          poster: string | null
          backdrop: string | null
          year: number | null
          rating: number | null
          language: string
          description: string | null
          synopsis: string | null
          genres: string[] | null
          tags: string[] | null
          actors: string[] | null
          director: string | null
          episode_count: number | null
          episodes: number | null
          seasons: number | null
          duration: number | null
          status: string | null
          release_date: string | null
          streaming_urls: Json | null
          trailers: Json | null
          images: Json | null
          subtitles: Json | null
          related_content: string[] | null
          user_ratings: Json | null
          popularity_score: number | null
          is_premium: boolean | null
          gallery: string[] | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          episode_count?: number | null
          episodes?: number | null
          seasons?: number | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language?: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          episode_count?: number | null
          episodes?: number | null
          seasons?: number | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      animes: {
        Row: {
          id: string
          title: string
          original_title: string | null
          poster: string | null
          backdrop: string | null
          year: number | null
          rating: number | null
          language: string
          description: string | null
          synopsis: string | null
          genres: string[] | null
          tags: string[] | null
          actors: string[] | null
          director: string | null
          episode_count: number | null
          episodes: number | null
          seasons: number | null
          duration: number | null
          status: string | null
          release_date: string | null
          streaming_urls: Json | null
          trailers: Json | null
          images: Json | null
          subtitles: Json | null
          related_content: string[] | null
          user_ratings: Json | null
          popularity_score: number | null
          is_premium: boolean | null
          gallery: string[] | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          episode_count?: number | null
          episodes?: number | null
          seasons?: number | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language?: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          episode_count?: number | null
          episodes?: number | null
          seasons?: number | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      films: {
        Row: {
          id: string
          title: string
          original_title: string | null
          poster: string | null
          backdrop: string | null
          year: number | null
          rating: number | null
          language: string
          description: string | null
          synopsis: string | null
          genres: string[] | null
          tags: string[] | null
          actors: string[] | null
          director: string | null
          duration: number | null
          status: string | null
          release_date: string | null
          streaming_urls: Json | null
          trailers: Json | null
          images: Json | null
          subtitles: Json | null
          related_content: string[] | null
          user_ratings: Json | null
          popularity_score: number | null
          is_premium: boolean | null
          gallery: string[] | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language?: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      bollywood: {
        Row: {
          id: string
          title: string
          original_title: string | null
          poster: string | null
          backdrop: string | null
          year: number | null
          rating: number | null
          language: string
          description: string | null
          synopsis: string | null
          genres: string[] | null
          tags: string[] | null
          actors: string[] | null
          director: string | null
          duration: number | null
          status: string | null
          release_date: string | null
          streaming_urls: Json | null
          trailers: Json | null
          images: Json | null
          subtitles: Json | null
          related_content: string[] | null
          user_ratings: Json | null
          popularity_score: number | null
          is_premium: boolean | null
          gallery: string[] | null
          source: string | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          original_title?: string | null
          poster?: string | null
          backdrop?: string | null
          year?: number | null
          rating?: number | null
          language?: string
          description?: string | null
          synopsis?: string | null
          genres?: string[] | null
          tags?: string[] | null
          actors?: string[] | null
          director?: string | null
          duration?: number | null
          status?: string | null
          release_date?: string | null
          streaming_urls?: Json | null
          trailers?: Json | null
          images?: Json | null
          subtitles?: Json | null
          related_content?: string[] | null
          user_ratings?: Json | null
          popularity_score?: number | null
          is_premium?: boolean | null
          gallery?: string[] | null
          source?: string | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      carousels: {
        Row: {
          id: string
          title: string
          type: string
          items: Json
          position: number | null
          is_active: boolean | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title: string
          type: string
          items: Json
          position?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string
          type?: string
          items?: Json
          position?: number | null
          is_active?: boolean | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      hero_banners: {
        Row: {
          id: string
          title: string | null
          content_id: string | null
          content_type: string | null
          image: string | null
          description: string | null
          is_active: boolean | null
          start_date: string | null
          end_date: string | null
          position: number | null
          created_at: string | null
          updated_at: string | null
        }
        Insert: {
          id?: string
          title?: string | null
          content_id?: string | null
          content_type?: string | null
          image?: string | null
          description?: string | null
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          position?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Update: {
          id?: string
          title?: string | null
          content_id?: string | null
          content_type?: string | null
          image?: string | null
          description?: string | null
          is_active?: boolean | null
          start_date?: string | null
          end_date?: string | null
          position?: number | null
          created_at?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      scraping_logs: {
        Row: {
          id: string
          source: string
          content_type: string
          items_count: number
          status: string
          error_message: string | null
          duration_seconds: number | null
          started_at: string | null
          finished_at: string | null
          details: Json | null
        }
        Insert: {
          id?: string
          source: string
          content_type: string
          items_count?: number
          status: string
          error_message?: string | null
          duration_seconds?: number | null
          started_at?: string | null
          finished_at?: string | null
          details?: Json | null
        }
        Update: {
          id?: string
          source?: string
          content_type?: string
          items_count?: number
          status?: string
          error_message?: string | null
          duration_seconds?: number | null
          started_at?: string | null
          finished_at?: string | null
          details?: Json | null
        }
        Relationships: []
      }
      health_check: {
        Row: {
          id: string
          status: string
          last_checked: string | null
        }
        Insert: {
          id?: string
          status?: string
          last_checked?: string | null
        }
        Update: {
          id?: string
          status?: string
          last_checked?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
