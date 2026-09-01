export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      contact_addresses: {
        Row: {
          address_line1: string | null
          address_line2: string | null
          city: string | null
          contact_id: number | null
          country: string | null
          created_at: string | null
          id: number
          is_primary: boolean | null
          state: string | null
          updated_at: string | null
          zip_code: string | null
        }
        Insert: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_id?: number | null
          country?: string | null
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Update: {
          address_line1?: string | null
          address_line2?: string | null
          city?: string | null
          contact_id?: number | null
          country?: string | null
          created_at?: string | null
          id?: number
          is_primary?: boolean | null
          state?: string | null
          updated_at?: string | null
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_addresses_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_view"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      contact_birthdays: {
        Row: {
          birthday: string | null
          contact_id: number | null
          created_at: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          birthday?: string | null
          contact_id?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          birthday?: string | null
          contact_id?: number | null
          created_at?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_birthdays_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_birthdays_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts_view"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      contact_emails: {
        Row: {
          created_at: string | null
          email: string
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          updated_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          updated_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      contact_first_names: {
        Row: {
          created_at: string | null
          first_name: string
          id: number
          is_active: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          first_name: string
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          first_name?: string
          id?: number
          is_active?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_home_anniversaries: {
        Row: {
          contact_id: number | null
          created_at: string | null
          home_anniversary: string | null
          id: number
          updated_at: string | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          home_anniversary?: string | null
          id?: number
          updated_at?: string | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          home_anniversary?: string | null
          id?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_home_anniversaries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_home_anniversaries_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: true
            referencedRelation: "contacts_view"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      contact_last_names: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          last_name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          last_name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string | null
          email_id: number | null
          first_name_id: number | null
          id: number
          is_active: boolean | null
          is_read: boolean | null
          last_name_id: number | null
          message: string
          phone_id: number | null
          read_at: string | null
          source_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          message: string
          phone_id?: number | null
          read_at?: string | null
          source_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          message?: string
          phone_id?: number | null
          read_at?: string | null
          source_id?: number | null
          updated_at?: string | null
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
          {
            foreignKeyName: "contact_messages_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_phones: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          is_verified: boolean | null
          phone: string
          updated_at: string | null
          verification_sent_at: string | null
          verification_token: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          phone: string
          updated_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          is_verified?: boolean | null
          phone?: string
          updated_at?: string | null
          verification_sent_at?: string | null
          verification_token?: string | null
        }
        Relationships: []
      }
      contact_sources: {
        Row: {
          created_at: string | null
          id: number
          is_active: boolean | null
          source: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          source: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          source?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      contact_tag_assignments: {
        Row: {
          contact_id: number | null
          created_at: string | null
          id: number
          tag_id: number | null
        }
        Insert: {
          contact_id?: number | null
          created_at?: string | null
          id?: number
          tag_id?: number | null
        }
        Update: {
          contact_id?: number | null
          created_at?: string | null
          id?: number
          tag_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_view"
            referencedColumns: ["contact_id"]
          },
          {
            foreignKeyName: "contact_tag_assignments_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "contact_tags"
            referencedColumns: ["id"]
          },
        ]
      }
      contact_tags: {
        Row: {
          color: string | null
          created_at: string | null
          id: number
          tag: string
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          id?: number
          tag: string
        }
        Update: {
          color?: string | null
          created_at?: string | null
          id?: number
          tag?: string
        }
        Relationships: []
      }
      contacts: {
        Row: {
          created_at: string | null
          email_id: number | null
          first_name_id: number | null
          id: number
          is_active: boolean | null
          last_name_id: number | null
          phone_id: number | null
          source_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          source_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          source_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "contacts_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "contact_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_first_name_id_fkey"
            columns: ["first_name_id"]
            isOneToOne: false
            referencedRelation: "contact_first_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_last_name_id_fkey"
            columns: ["last_name_id"]
            isOneToOne: false
            referencedRelation: "contact_last_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_phone_id_fkey"
            columns: ["phone_id"]
            isOneToOne: false
            referencedRelation: "contact_phones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contacts_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          commission: number | null
          contact_id: number | null
          created_at: string | null
          expected_close_date: string | null
          house_price: number | null
          id: number
          notes: string | null
          probability: number | null
          stage: string
          title: string
          updated_at: string | null
          user_id: string | null
          value: number | null
        }
        Insert: {
          commission?: number | null
          contact_id?: number | null
          created_at?: string | null
          expected_close_date?: string | null
          house_price?: number | null
          id?: number
          notes?: string | null
          probability?: number | null
          stage?: string
          title: string
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Update: {
          commission?: number | null
          contact_id?: number | null
          created_at?: string | null
          expected_close_date?: string | null
          house_price?: number | null
          id?: number
          notes?: string | null
          probability?: number | null
          stage?: string
          title?: string
          updated_at?: string | null
          user_id?: string | null
          value?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "deals_contact_id_fkey"
            columns: ["contact_id"]
            isOneToOne: false
            referencedRelation: "contacts_view"
            referencedColumns: ["contact_id"]
          },
        ]
      }
      event_sign_ins: {
        Row: {
          created_at: string | null
          email_id: number | null
          event_name: string
          first_name_id: number | null
          id: number
          is_active: boolean | null
          is_read: boolean | null
          last_name_id: number | null
          phone_id: number | null
          read_at: string | null
          source_id: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email_id?: number | null
          event_name: string
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          read_at?: string | null
          source_id?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email_id?: number | null
          event_name?: string
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          read_at?: string | null
          source_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "event_sign_ins_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "contact_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sign_ins_first_name_id_fkey"
            columns: ["first_name_id"]
            isOneToOne: false
            referencedRelation: "contact_first_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sign_ins_last_name_id_fkey"
            columns: ["last_name_id"]
            isOneToOne: false
            referencedRelation: "contact_last_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sign_ins_phone_id_fkey"
            columns: ["phone_id"]
            isOneToOne: false
            referencedRelation: "contact_phones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "event_sign_ins_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      idx_listings: {
        Row: {
          address: string | null
          bedrooms: number | null
          full_baths: number | null
          half_baths: number | null
          list_agent_id: string | null
          list_office_id: string | null
          list_price: number | null
          living_area: number | null
          mls_number: string
          photo_count: number | null
          prop_type: string | null
          remarks: string | null
          sale_price: number | null
          settled_date: string | null
          state: string | null
          status: string | null
          style: string | null
          synced_at: string
          town: string | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          address?: string | null
          bedrooms?: number | null
          full_baths?: number | null
          half_baths?: number | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          living_area?: number | null
          mls_number: string
          photo_count?: number | null
          prop_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          settled_date?: string | null
          state?: string | null
          status?: string | null
          style?: string | null
          synced_at?: string
          town?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          address?: string | null
          bedrooms?: number | null
          full_baths?: number | null
          half_baths?: number | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          living_area?: number | null
          mls_number?: string
          photo_count?: number | null
          prop_type?: string | null
          remarks?: string | null
          sale_price?: number | null
          settled_date?: string | null
          state?: string | null
          status?: string | null
          style?: string | null
          synced_at?: string
          town?: string | null
          year_built?: number | null
          zip?: string | null
        }
        Relationships: []
      }
      idx_offices: {
        Row: {
          name: string
          office_id: string
          phone: string | null
        }
        Insert: {
          name: string
          office_id: string
          phone?: string | null
        }
        Update: {
          name?: string
          office_id?: string
          phone?: string | null
        }
        Relationships: []
      }
      idx_sync_runs: {
        Row: {
          error: string | null
          finished_at: string | null
          id: number
          ok: boolean
          rows_deleted: number
          rows_upserted: number
          started_at: string
        }
        Insert: {
          error?: string | null
          finished_at?: string | null
          id?: number
          ok?: boolean
          rows_deleted?: number
          rows_upserted?: number
          started_at?: string
        }
        Update: {
          error?: string | null
          finished_at?: string | null
          id?: number
          ok?: boolean
          rows_deleted?: number
          rows_upserted?: number
          started_at?: string
        }
        Relationships: []
      }
      lockboxes: {
        Row: {
          code: string | null
          created_at: string | null
          id: number
          is_active: boolean | null
          location: string
          lockbox_type: string
          notes: string | null
          status: string
          updated_at: string | null
        }
        Insert: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          location: string
          lockbox_type: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Update: {
          code?: string | null
          created_at?: string | null
          id?: number
          is_active?: boolean | null
          location?: string
          lockbox_type?: string
          notes?: string | null
          status?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      open_house_sign_ins: {
        Row: {
          address: string
          created_at: string | null
          email_id: number | null
          first_name_id: number | null
          id: number
          is_active: boolean | null
          is_read: boolean | null
          last_name_id: number | null
          phone_id: number | null
          read_at: string | null
          realtor_company: string | null
          realtor_name: string | null
          source_id: number | null
          updated_at: string | null
          works_with_realtor: boolean | null
        }
        Insert: {
          address: string
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          read_at?: string | null
          realtor_company?: string | null
          realtor_name?: string | null
          source_id?: number | null
          updated_at?: string | null
          works_with_realtor?: boolean | null
        }
        Update: {
          address?: string
          created_at?: string | null
          email_id?: number | null
          first_name_id?: number | null
          id?: number
          is_active?: boolean | null
          is_read?: boolean | null
          last_name_id?: number | null
          phone_id?: number | null
          read_at?: string | null
          realtor_company?: string | null
          realtor_name?: string | null
          source_id?: number | null
          updated_at?: string | null
          works_with_realtor?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "open_house_sign_ins_email_id_fkey"
            columns: ["email_id"]
            isOneToOne: false
            referencedRelation: "contact_emails"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_house_sign_ins_first_name_id_fkey"
            columns: ["first_name_id"]
            isOneToOne: false
            referencedRelation: "contact_first_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_house_sign_ins_last_name_id_fkey"
            columns: ["last_name_id"]
            isOneToOne: false
            referencedRelation: "contact_last_names"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_house_sign_ins_phone_id_fkey"
            columns: ["phone_id"]
            isOneToOne: false
            referencedRelation: "contact_phones"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "open_house_sign_ins_source_id_fkey"
            columns: ["source_id"]
            isOneToOne: false
            referencedRelation: "contact_sources"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_activities: {
        Row: {
          activity_type: string
          amount: number | null
          created_at: string | null
          description: string
          id: number
          metadata: Json | null
          related_id: number | null
          related_table: string | null
          user_id: number | null
        }
        Insert: {
          activity_type: string
          amount?: number | null
          created_at?: string | null
          description: string
          id?: number
          metadata?: Json | null
          related_id?: number | null
          related_table?: string | null
          user_id?: number | null
        }
        Update: {
          activity_type?: string
          amount?: number | null
          created_at?: string | null
          description?: string
          id?: number
          metadata?: Json | null
          related_id?: number | null
          related_table?: string | null
          user_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_activities_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_documents: {
        Row: {
          created_at: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size: number | null
          id: number
          mime_type: string | null
          property_id: number | null
          tenant_id: number | null
          title: string
          updated_at: string | null
          uploaded_by: number | null
        }
        Insert: {
          created_at?: string | null
          document_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: number
          mime_type?: string | null
          property_id?: number | null
          tenant_id?: number | null
          title: string
          updated_at?: string | null
          uploaded_by?: number | null
        }
        Update: {
          created_at?: string | null
          document_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: number
          mime_type?: string | null
          property_id?: number | null
          tenant_id?: number | null
          title?: string
          updated_at?: string | null
          uploaded_by?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_documents_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pm_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_documents_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pm_tenants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "pm_users"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_expenses: {
        Row: {
          amount: number
          category: string
          created_at: string | null
          description: string
          expense_date: string
          id: number
          invoice_number: string | null
          notes: string | null
          payment_method: string | null
          property_id: number | null
          status: string | null
          updated_at: string | null
          vendor: string | null
        }
        Insert: {
          amount: number
          category: string
          created_at?: string | null
          description: string
          expense_date: string
          id?: number
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          property_id?: number | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Update: {
          amount?: number
          category?: string
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: number
          invoice_number?: string | null
          notes?: string | null
          payment_method?: string | null
          property_id?: number | null
          status?: string | null
          updated_at?: string | null
          vendor?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pm_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_maintenance: {
        Row: {
          actual_cost: number | null
          assigned_to: string | null
          completed_date: string | null
          created_at: string | null
          description: string
          estimated_cost: number | null
          id: number
          notes: string | null
          priority: string | null
          property_id: number | null
          reported_date: string
          status: string | null
          tenant_id: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          description: string
          estimated_cost?: number | null
          id?: number
          notes?: string | null
          priority?: string | null
          property_id?: number | null
          reported_date: string
          status?: string | null
          tenant_id?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          actual_cost?: number | null
          assigned_to?: string | null
          completed_date?: string | null
          created_at?: string | null
          description?: string
          estimated_cost?: number | null
          id?: number
          notes?: string | null
          priority?: string | null
          property_id?: number | null
          reported_date?: string
          status?: string | null
          tenant_id?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_maintenance_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pm_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_maintenance_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_owners: {
        Row: {
          address: string | null
          commission_rate: number | null
          created_at: string | null
          email: string
          first_name: string
          id: number
          is_active: boolean | null
          last_name: string
          phone: string | null
          tax_id: string | null
          updated_at: string | null
        }
        Insert: {
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email: string
          first_name: string
          id?: number
          is_active?: boolean | null
          last_name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Update: {
          address?: string | null
          commission_rate?: number | null
          created_at?: string | null
          email?: string
          first_name?: string
          id?: number
          is_active?: boolean | null
          last_name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      pm_payments: {
        Row: {
          amount: number
          created_at: string | null
          due_date: string | null
          id: number
          notes: string | null
          payment_date: string
          payment_method: string | null
          payment_type: string
          property_id: number | null
          reference_number: string | null
          status: string | null
          tenant_id: number | null
          updated_at: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          payment_date: string
          payment_method?: string | null
          payment_type: string
          property_id?: number | null
          reference_number?: string | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          due_date?: string | null
          id?: number
          notes?: string | null
          payment_date?: string
          payment_method?: string | null
          payment_type?: string
          property_id?: number | null
          reference_number?: string | null
          status?: string | null
          tenant_id?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_payments_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pm_properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pm_payments_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "pm_tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_properties: {
        Row: {
          address: string
          amenities: string[] | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          commission_rate: number | null
          created_at: string | null
          description: string | null
          id: number
          monthly_rent: number
          owner_id: number | null
          property_type: string
          square_feet: number | null
          state: string
          status: string | null
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          monthly_rent: number
          owner_id?: number | null
          property_type: string
          square_feet?: number | null
          state: string
          status?: string | null
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          amenities?: string[] | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          commission_rate?: number | null
          created_at?: string | null
          description?: string | null
          id?: number
          monthly_rent?: number
          owner_id?: number | null
          property_type?: string
          square_feet?: number | null
          state?: string
          status?: string | null
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "pm_properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "pm_owners"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_tenants: {
        Row: {
          created_at: string | null
          email: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          first_name: string
          id: number
          last_name: string
          lease_end_date: string | null
          lease_start_date: string | null
          monthly_rent: number
          phone: string | null
          property_id: number | null
          security_deposit: number | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name: string
          id?: number
          last_name: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          monthly_rent: number
          phone?: string | null
          property_id?: number | null
          security_deposit?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          first_name?: string
          id?: number
          last_name?: string
          lease_end_date?: string | null
          lease_start_date?: string | null
          monthly_rent?: number
          phone?: string | null
          property_id?: number | null
          security_deposit?: number | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "pm_tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "pm_properties"
            referencedColumns: ["id"]
          },
        ]
      }
      pm_users: {
        Row: {
          created_at: string | null
          email: string
          first_name: string
          id: number
          is_active: boolean | null
          last_name: string
          password_hash: string
          role: string | null
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          email: string
          first_name: string
          id?: number
          is_active?: boolean | null
          last_name: string
          password_hash: string
          role?: string | null
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          email?: string
          first_name?: string
          id?: number
          is_active?: boolean | null
          last_name?: string
          password_hash?: string
          role?: string | null
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          bedrooms: number | null
          created_at: string | null
          description: string | null
          full_baths: number | null
          half_baths: number | null
          id: number
          image_urls: string[] | null
          is_active: boolean | null
          list_price: number | null
          living_area: number | null
          mlsnum: string
          property_type: string
          represented: string | null
          sale_price: number | null
          sold_date: string | null
          status: string | null
          town: string
          updated_at: string | null
          zip_code: string
        }
        Insert: {
          address: string
          bedrooms?: number | null
          created_at?: string | null
          description?: string | null
          full_baths?: number | null
          half_baths?: number | null
          id?: number
          image_urls?: string[] | null
          is_active?: boolean | null
          list_price?: number | null
          living_area?: number | null
          mlsnum: string
          property_type: string
          represented?: string | null
          sale_price?: number | null
          sold_date?: string | null
          status?: string | null
          town: string
          updated_at?: string | null
          zip_code: string
        }
        Update: {
          address?: string
          bedrooms?: number | null
          created_at?: string | null
          description?: string | null
          full_baths?: number | null
          half_baths?: number | null
          id?: number
          image_urls?: string[] | null
          is_active?: boolean | null
          list_price?: number | null
          living_area?: number | null
          mlsnum?: string
          property_type?: string
          represented?: string | null
          sale_price?: number | null
          sold_date?: string | null
          status?: string | null
          town?: string
          updated_at?: string | null
          zip_code?: string
        }
        Relationships: []
      }
    }
    Views: {
      admin_contact_messages_view: {
        Row: {
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          first_name: string | null
          id: number | null
          is_read: boolean | null
          last_name: string | null
          message: string | null
          phone: string | null
          phone_verified: boolean | null
          read_at: string | null
          updated_at: string | null
        }
        Relationships: []
      }
      contact_messages_view: {
        Row: {
          created_at: string | null
          email: string | null
          first_name: string | null
          id: number | null
          is_read: boolean | null
          last_name: string | null
          message: string | null
          phone: string | null
          read_at: string | null
          source: string | null
        }
        Relationships: []
      }
      contacts_view: {
        Row: {
          addresses: Json | null
          birthday: string | null
          contact_id: number | null
          email: string | null
          first_name: string | null
          home_anniversary: string | null
          last_contact_at: string | null
          last_name: string | null
          message_count: number | null
          open_house_count: number | null
          phone: string | null
          source: string | null
          tags: Json | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      idx_towns_with_listings: {
        Args: never
        Returns: {
          listings: number
          town: string
        }[]
      }
      is_admin:
        | { Args: never; Returns: boolean }
        | { Args: { user_id: string }; Returns: boolean }
      trigger_idx_sync: { Args: { body: Json }; Returns: number }
    }
    Enums: {
      activity_type:
        | "NOTE"
        | "EMAIL"
        | "CALL"
        | "MEETING"
        | "TASK"
        | "DEAL_CREATED"
        | "DEAL_UPDATED"
        | "DEAL_STAGE_CHANGED"
      contact_status: "LEAD" | "QUALIFIED" | "CUSTOMER" | "INACTIVE"
      deal_stage:
        | "LEAD"
        | "QUALIFICATION"
        | "PROPOSAL"
        | "NEGOTIATION"
        | "CLOSED_WON"
        | "CLOSED_LOST"
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      activity_type: [
        "NOTE",
        "EMAIL",
        "CALL",
        "MEETING",
        "TASK",
        "DEAL_CREATED",
        "DEAL_UPDATED",
        "DEAL_STAGE_CHANGED",
      ],
      contact_status: ["LEAD", "QUALIFIED", "CUSTOMER", "INACTIVE"],
      deal_stage: [
        "LEAD",
        "QUALIFICATION",
        "PROPOSAL",
        "NEGOTIATION",
        "CLOSED_WON",
        "CLOSED_LOST",
      ],
    },
  },
} as const
