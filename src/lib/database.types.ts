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
      projects: {
        Row: {
          id: string
          title: string
          link: string
          image: string
          rating: number
          category: string | null
          created_at: string
          user_id: string
        }
        Insert: {
          id?: string
          title: string
          link: string
          image: string
          rating?: number
          category?: string | null
          created_at?: string
          user_id: string
        }
        Update: {
          id?: string
          title?: string
          link?: string
          image?: string
          rating?: number
          category?: string | null
          created_at?: string
          user_id?: string
        }
      }
      profiles: {
        Row: {
          id: string
          name: string
          email: string
          created_at: string
        }
        Insert: {
          id: string
          name: string
          email: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          email?: string
          created_at?: string
        }
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
  }
}