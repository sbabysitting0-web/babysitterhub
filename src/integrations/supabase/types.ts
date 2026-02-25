export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      babysitter_availability: {
        Row: {
          id: string
          babysitter_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          babysitter_id: string
          day_of_week: number
          start_time: string
          end_time: string
          is_available?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          babysitter_id?: string
          day_of_week?: number
          start_time?: string
          end_time?: string
          is_available?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      babysitter_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          photo_url: string | null
          bio: string | null
          years_experience: number | null
          hourly_rate: number | null
          max_kids: number | null
          languages: string[] | null
          skills: string[] | null
          city: string | null
          location_lat: number | null
          location_lng: number | null
          is_verified: boolean | null
          rating_avg: number | null
          rating_count: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          photo_url?: string | null
          bio?: string | null
          years_experience?: number | null
          hourly_rate?: number | null
          max_kids?: number | null
          languages?: string[] | null
          skills?: string[] | null
          city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          is_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          photo_url?: string | null
          bio?: string | null
          years_experience?: number | null
          hourly_rate?: number | null
          max_kids?: number | null
          languages?: string[] | null
          skills?: string[] | null
          city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          is_verified?: boolean | null
          rating_avg?: number | null
          rating_count?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      bookings: {
        Row: {
          id: string
          parent_id: string
          babysitter_id: string
          start_time: string
          end_time: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          babysitter_id: string
          start_time: string
          end_time: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          babysitter_id?: string
          start_time?: string
          end_time?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      children: {
        Row: {
          id: string
          parent_id: string
          name: string
          age: number | null
          notes: string | null
          special_needs: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          name: string
          age?: number | null
          notes?: string | null
          special_needs?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          name?: string
          age?: number | null
          notes?: string | null
          special_needs?: string | null
          created_at?: string
        }
        Relationships: []
      }
      messages: {
        Row: {
          id: string
          booking_id: string | null
          sender_id: string
          receiver_id: string
          text: string
          is_read: boolean | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id?: string | null
          sender_id: string
          receiver_id: string
          text: string
          is_read?: boolean | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string | null
          sender_id?: string
          receiver_id?: string
          text?: string
          is_read?: boolean | null
          created_at?: string
        }
        Relationships: []
      }
      parent_profiles: {
        Row: {
          id: string
          user_id: string
          name: string
          phone: string | null
          about: string | null
          address: string | null
          city: string | null
          location_lat: number | null
          location_lng: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name?: string
          phone?: string | null
          about?: string | null
          address?: string | null
          city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          phone?: string | null
          about?: string | null
          address?: string | null
          city?: string | null
          location_lat?: number | null
          location_lng?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          id: string
          booking_id: string
          parent_id: string
          babysitter_id: string
          rating: number
          comment: string | null
          created_at: string
        }
        Insert: {
          id?: string
          booking_id: string
          parent_id: string
          babysitter_id: string
          rating: number
          comment?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          booking_id?: string
          parent_id?: string
          babysitter_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          parent_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status: Database["public"]["Enums"]["subscription_status"]
          start_date: string
          end_date: string | null
          last_payment_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          parent_id: string
          plan: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          start_date?: string
          end_date?: string | null
          last_payment_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          parent_id?: string
          plan?: Database["public"]["Enums"]["subscription_plan"]
          status?: Database["public"]["Enums"]["subscription_status"]
          start_date?: string
          end_date?: string | null
          last_payment_id?: string | null
          created_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          role: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          role?: Database["public"]["Enums"]["user_role"]
          created_at?: string
        }
        Relationships: []
      }
      users: {
        Row: {
          id: string
          role: string | null
          created_at: string | null
        }
        Insert: {
          id: string
          role?: string | null
          created_at?: string | null
        }
        Update: {
          id?: string
          role?: string | null
          created_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      ensure_user_record: {
        Args: {
          p_role: string
        }
        Returns: undefined
      }
    }
    Enums: {
      booking_status: "pending" | "confirmed" | "completed" | "cancelled"
      subscription_plan: "basic" | "premium"
      subscription_status: "active" | "expired" | "cancelled"
      user_role: "parent" | "babysitter" | "admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
    DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
    DefaultSchema["Views"])
  ? (DefaultSchema["Tables"] &
    DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R
    }
  ? R
  : never
  : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Insert: infer I
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I
  }
  ? I
  : never
  : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema["Tables"]
  | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
  : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
    Update: infer U
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
  ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U
  }
  ? U
  : never
  : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema["Enums"]
  | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
  ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
  : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema["CompositeTypes"]
  | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
  ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
  : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
  ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
  : never

export const Constants = {
  public: {
    Enums: {
      booking_status: ["pending", "confirmed", "completed", "cancelled"],
      subscription_plan: ["basic", "premium"],
      subscription_status: ["active", "expired", "cancelled"],
      user_role: ["parent", "babysitter", "admin"],
    },
  },
} as const
