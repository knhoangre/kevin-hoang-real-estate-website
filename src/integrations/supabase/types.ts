export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      contact_emails: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      contact_first_names: {
        Row: {
          created_at: string
          first_name: string
          id: string
        }
        Insert: {
          created_at?: string
          first_name: string
          id?: string
        }
        Update: {
          created_at?: string
          first_name?: string
          id?: string
        }
        Relationships: []
      }
      contact_last_names: {
        Row: {
          created_at: string
          id: string
          last_name: string
        }
        Insert: {
          created_at?: string
          id?: string
          last_name: string
        }
        Update: {
          created_at?: string
          id?: string
          last_name?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email_id: string
          first_name_id: string
          id: string
          last_name_id: string
          message: string
          phone_id: string
        }
        Insert: {
          created_at?: string
          email_id: string
          first_name_id: string
          id?: string
          last_name_id: string
          message: string
          phone_id: string
        }
        Update: {
          created_at?: string
          email_id?: string
          first_name_id?: string
          id?: string
          last_name_id?: string
          message?: string
          phone_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "contact_messages_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "contact_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_first_name_id_fkey"
            columns: ["first_name_id"]
            isOneToOne: false
            referencedRelation: "contact_first_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_last_name_id_fkey"
            columns: ["last_name_id"]
            isOneToOne: false
            referencedRelation: "contact_last_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_messages_phone_id_fkey"
            columns: ["phone_id"]
            isOneToOne: false
            referencedRelation: "contact_phones"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phones: {
        Row: {
          created_at: string
          id: string
          phone: string
        }
        Insert: {
          created_at?: string
          id?: string
          phone: string
        }
        Update: {
          created_at?: string
          id?: string
          phone?: string
        }
        Relationships: []
      }
      deals: {
        Row: {
          id: number
          user_id: string
          contact_id: string | null
          title: string
          value: number | null
          house_price: number | null
          commission: number | null
          stage: 'lead' | 'qualification' | 'proposal' | 'closed-won' | 'closed-lost'
          probability: number
          expected_close_date: string | null
          notes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          contact_id?: string | null
          title: string
          value?: number | null
          house_price?: number | null
          commission?: number | null
          stage?: 'lead' | 'qualification' | 'proposal' | 'closed-won' | 'closed-lost'
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          contact_id?: string | null
          title?: string
          value?: number | null
          house_price?: number | null
          commission?: number | null
          stage?: 'lead' | 'qualification' | 'proposal' | 'closed-won' | 'closed-lost'
          probability?: number
          expected_close_date?: string | null
          notes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "deals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      activities: {
        Row: {
          id: number
          user_id: string
          contact_id: string | null
          deal_id: number | null
          type: 'note' | 'email' | 'call' | 'meeting' | 'task'
          title: string
          description: string | null
          due_date: string | null
          completed_at: string | null
          metadata: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: number
          user_id: string
          contact_id?: string | null
          deal_id?: number | null
          type: 'note' | 'email' | 'call' | 'meeting' | 'task'
          title: string
          description?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: number
          user_id?: string
          contact_id?: string | null
          deal_id?: number | null
          type?: 'note' | 'email' | 'call' | 'meeting' | 'task'
          title?: string
          description?: string | null
          due_date?: string | null
          completed_at?: string | null
          metadata?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      unified_contacts: {
        Row: {
          contact_id: string
          first_name: string | null
          last_name: string | null
          email: string | null
          phone: string | null
          last_contact_at: string | null
          sources: string | null
          message_count: number
          open_house_count: number
        }
        Relationships: []
      }
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

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
