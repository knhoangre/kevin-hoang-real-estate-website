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
      handyman_allowed_emails: {
        Row: {
          created_at: string
          email: string
        }
        Insert: {
          created_at?: string
          email: string
        }
        Update: {
          created_at?: string
          email?: string
        }
        Relationships: []
      }
      handyman_clients: {
        Row: {
          address_line1: string
          address_line2: string
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          name: string
          notes: string
          owner_email: string
          phone: string
          server_updated_at: string
          updated_at: string
        }
        Insert: {
          address_line1?: string
          address_line2?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id: string
          name?: string
          notes?: string
          owner_email: string
          phone?: string
          server_updated_at?: string
          updated_at?: string
        }
        Update: {
          address_line1?: string
          address_line2?: string
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          name?: string
          notes?: string
          owner_email?: string
          phone?: string
          server_updated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_contractors: {
        Row: {
          created_at: string
          deleted_at: string | null
          email: string
          id: string
          is_default: boolean
          name: string
          owner_email: string
          phone: string
          server_updated_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id: string
          is_default?: boolean
          name?: string
          owner_email: string
          phone?: string
          server_updated_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          email?: string
          id?: string
          is_default?: boolean
          name?: string
          owner_email?: string
          phone?: string
          server_updated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_counters: {
        Row: {
          kind: string
          next_seq: number
          owner_email: string
          server_updated_at: string
          updated_at: string
          year: number
        }
        Insert: {
          kind: string
          next_seq?: number
          owner_email: string
          server_updated_at?: string
          updated_at?: string
          year: number
        }
        Update: {
          kind?: string
          next_seq?: number
          owner_email?: string
          server_updated_at?: string
          updated_at?: string
          year?: number
        }
        Relationships: []
      }
      handyman_estimates: {
        Row: {
          business: Json
          client: Json
          client_id: string
          contractor_id: string | null
          converted_invoice_id: string | null
          created_at: string
          deleted_at: string | null
          discount_cents: number
          id: string
          issue_date: string
          job_id: string | null
          line_items: Json
          number: string
          owner_email: string
          server_updated_at: string
          status: string
          tax_label: string
          tax_rate_pct: number
          terms: string
          updated_at: string
          valid_until: string | null
          work_summary: string
        }
        Insert: {
          business?: Json
          client?: Json
          client_id: string
          contractor_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_cents?: number
          id: string
          issue_date: string
          job_id?: string | null
          line_items?: Json
          number?: string
          owner_email: string
          server_updated_at?: string
          status?: string
          tax_label?: string
          tax_rate_pct?: number
          terms?: string
          updated_at?: string
          valid_until?: string | null
          work_summary?: string
        }
        Update: {
          business?: Json
          client?: Json
          client_id?: string
          contractor_id?: string | null
          converted_invoice_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_cents?: number
          id?: string
          issue_date?: string
          job_id?: string | null
          line_items?: Json
          number?: string
          owner_email?: string
          server_updated_at?: string
          status?: string
          tax_label?: string
          tax_rate_pct?: number
          terms?: string
          updated_at?: string
          valid_until?: string | null
          work_summary?: string
        }
        Relationships: []
      }
      handyman_expenses: {
        Row: {
          attach_to_invoice: boolean
          billable: boolean
          category: string
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          job_id: string | null
          markup_pct: number
          notes: string
          owner_email: string
          payment_method: string
          rebilled_invoice_id: string | null
          server_updated_at: string
          storage_path: string | null
          tax_cents: number
          total_cents: number
          updated_at: string
          vendor: string
        }
        Insert: {
          attach_to_invoice?: boolean
          billable?: boolean
          category?: string
          created_at?: string
          date: string
          deleted_at?: string | null
          id: string
          job_id?: string | null
          markup_pct?: number
          notes?: string
          owner_email: string
          payment_method?: string
          rebilled_invoice_id?: string | null
          server_updated_at?: string
          storage_path?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          vendor?: string
        }
        Update: {
          attach_to_invoice?: boolean
          billable?: boolean
          category?: string
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          job_id?: string | null
          markup_pct?: number
          notes?: string
          owner_email?: string
          payment_method?: string
          rebilled_invoice_id?: string | null
          server_updated_at?: string
          storage_path?: string | null
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          vendor?: string
        }
        Relationships: []
      }
      handyman_files: {
        Row: {
          created_at: string
          deleted_at: string | null
          file_name: string
          format: string
          id: string
          kind: string
          number: string
          owner_email: string
          ref_id: string
          server_updated_at: string
          size_bytes: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          format?: string
          id: string
          kind: string
          number?: string
          owner_email: string
          ref_id: string
          server_updated_at?: string
          size_bytes?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          deleted_at?: string | null
          file_name?: string
          format?: string
          id?: string
          kind?: string
          number?: string
          owner_email?: string
          ref_id?: string
          server_updated_at?: string
          size_bytes?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_invoices: {
        Row: {
          business: Json
          client: Json
          client_id: string
          contractor_id: string | null
          created_at: string
          deleted_at: string | null
          discount_cents: number
          due_date: string | null
          estimate_id: string | null
          id: string
          issue_date: string
          job_id: string | null
          line_items: Json
          number: string | null
          owner_email: string
          server_updated_at: string
          status: string
          tax_label: string
          tax_rate_pct: number
          terms: string
          updated_at: string
          work_period_note: string
          work_summary: string
        }
        Insert: {
          business?: Json
          client?: Json
          client_id: string
          contractor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_cents?: number
          due_date?: string | null
          estimate_id?: string | null
          id: string
          issue_date: string
          job_id?: string | null
          line_items?: Json
          number?: string | null
          owner_email: string
          server_updated_at?: string
          status?: string
          tax_label?: string
          tax_rate_pct?: number
          terms?: string
          updated_at?: string
          work_period_note?: string
          work_summary?: string
        }
        Update: {
          business?: Json
          client?: Json
          client_id?: string
          contractor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          discount_cents?: number
          due_date?: string | null
          estimate_id?: string | null
          id?: string
          issue_date?: string
          job_id?: string | null
          line_items?: Json
          number?: string | null
          owner_email?: string
          server_updated_at?: string
          status?: string
          tax_label?: string
          tax_rate_pct?: number
          terms?: string
          updated_at?: string
          work_period_note?: string
          work_summary?: string
        }
        Relationships: []
      }
      handyman_jobs: {
        Row: {
          client_id: string
          completed_on: string | null
          contractor_id: string | null
          created_at: string
          deleted_at: string | null
          description: string
          hours_logged: number
          id: string
          notes: string
          number: string
          owner_email: string
          property_id: string | null
          scheduled_for: string | null
          server_updated_at: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          client_id: string
          completed_on?: string | null
          contractor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          hours_logged?: number
          id: string
          notes?: string
          number?: string
          owner_email: string
          property_id?: string | null
          scheduled_for?: string | null
          server_updated_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          completed_on?: string | null
          contractor_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string
          hours_logged?: number
          id?: string
          notes?: string
          number?: string
          owner_email?: string
          property_id?: string | null
          scheduled_for?: string | null
          server_updated_at?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_mileage: {
        Row: {
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          job_id: string | null
          miles: number
          owner_email: string
          purpose: string
          rate_per_mile_cents: number
          server_updated_at: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          date: string
          deleted_at?: string | null
          id: string
          job_id?: string | null
          miles?: number
          owner_email: string
          purpose?: string
          rate_per_mile_cents?: number
          server_updated_at?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          job_id?: string | null
          miles?: number
          owner_email?: string
          purpose?: string
          rate_per_mile_cents?: number
          server_updated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_payments: {
        Row: {
          amount_cents: number
          created_at: string
          date: string
          deleted_at: string | null
          id: string
          invoice_id: string
          is_deposit: boolean
          method: string
          note: string
          owner_email: string
          receipt_number: string | null
          reference: string
          server_updated_at: string
          updated_at: string
        }
        Insert: {
          amount_cents?: number
          created_at?: string
          date: string
          deleted_at?: string | null
          id: string
          invoice_id: string
          is_deposit?: boolean
          method?: string
          note?: string
          owner_email: string
          receipt_number?: string | null
          reference?: string
          server_updated_at?: string
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          date?: string
          deleted_at?: string | null
          id?: string
          invoice_id?: string
          is_deposit?: boolean
          method?: string
          note?: string
          owner_email?: string
          receipt_number?: string | null
          reference?: string
          server_updated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_photos: {
        Row: {
          caption: string
          created_at: string
          deleted_at: string | null
          id: string
          job_id: string
          owner_email: string
          phase: string
          server_updated_at: string
          storage_path: string
          taken_at: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          id: string
          job_id: string
          owner_email: string
          phase?: string
          server_updated_at?: string
          storage_path: string
          taken_at?: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          job_id?: string
          owner_email?: string
          phase?: string
          server_updated_at?: string
          storage_path?: string
          taken_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_properties: {
        Row: {
          access_notes: string
          address_line1: string
          address_line2: string
          client_id: string
          created_at: string
          deleted_at: string | null
          id: string
          label: string
          owner_email: string
          server_updated_at: string
          updated_at: string
        }
        Insert: {
          access_notes?: string
          address_line1?: string
          address_line2?: string
          client_id: string
          created_at?: string
          deleted_at?: string | null
          id: string
          label?: string
          owner_email: string
          server_updated_at?: string
          updated_at?: string
        }
        Update: {
          access_notes?: string
          address_line1?: string
          address_line2?: string
          client_id?: string
          created_at?: string
          deleted_at?: string | null
          id?: string
          label?: string
          owner_email?: string
          server_updated_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      handyman_settings: {
        Row: {
          accent_color: string
          address_line1: string
          address_line2: string
          business_name: string
          change_order_text: string
          created_at: string
          default_hourly_rate_cents: number
          default_markup_pct: number
          default_term_days: number
          default_terms: string
          deleted_at: string | null
          email: string
          estimate_terms: string
          footer_note: string
          id: string
          last_backup_at: string | null
          logo_path: string | null
          mileage_rate_cents: number
          owner_email: string
          payment_instructions: string
          phone: string
          server_updated_at: string
          tagline: string
          tax_label: string
          tax_labor_by_default: boolean
          tax_materials_by_default: boolean
          tax_rate_pct: number
          updated_at: string
          warranty_text: string
        }
        Insert: {
          accent_color?: string
          address_line1?: string
          address_line2?: string
          business_name?: string
          change_order_text?: string
          created_at?: string
          default_hourly_rate_cents?: number
          default_markup_pct?: number
          default_term_days?: number
          default_terms?: string
          deleted_at?: string | null
          email?: string
          estimate_terms?: string
          footer_note?: string
          id: string
          last_backup_at?: string | null
          logo_path?: string | null
          mileage_rate_cents?: number
          owner_email: string
          payment_instructions?: string
          phone?: string
          server_updated_at?: string
          tagline?: string
          tax_label?: string
          tax_labor_by_default?: boolean
          tax_materials_by_default?: boolean
          tax_rate_pct?: number
          updated_at?: string
          warranty_text?: string
        }
        Update: {
          accent_color?: string
          address_line1?: string
          address_line2?: string
          business_name?: string
          change_order_text?: string
          created_at?: string
          default_hourly_rate_cents?: number
          default_markup_pct?: number
          default_term_days?: number
          default_terms?: string
          deleted_at?: string | null
          email?: string
          estimate_terms?: string
          footer_note?: string
          id?: string
          last_backup_at?: string | null
          logo_path?: string | null
          mileage_rate_cents?: number
          owner_email?: string
          payment_instructions?: string
          phone?: string
          server_updated_at?: string
          tagline?: string
          tax_label?: string
          tax_labor_by_default?: boolean
          tax_materials_by_default?: boolean
          tax_rate_pct?: number
          updated_at?: string
          warranty_text?: string
        }
        Relationships: []
      }
      idx_geocodes: {
        Row: {
          address_key: string
          geocoded_at: string
          lat: number | null
          lon: number | null
          precision: string
        }
        Insert: {
          address_key: string
          geocoded_at?: string
          lat?: number | null
          lon?: number | null
          precision?: string
        }
        Update: {
          address_key?: string
          geocoded_at?: string
          lat?: number | null
          lon?: number | null
          precision?: string
        }
        Relationships: []
      }
      idx_listings: {
        Row: {
          acres: number | null
          address: string | null
          adult_community: boolean | null
          appliances: string | null
          basement: boolean | null
          basement_feature: string | null
          bedrooms: number | null
          color: string | null
          construction: string | null
          cooling: string | null
          date_available: string | null
          electric_feature: string | null
          energy_features: string | null
          exterior: string | null
          exterior_features: string | null
          feed: string
          first_seen_at: string
          flooring: string | null
          full_baths: number | null
          garage_parking: string | null
          garage_spaces: number | null
          half_baths: number | null
          heating: string | null
          hoa: boolean | null
          hoa_fee: number | null
          hot_water: string | null
          interior_features: string | null
          laundry_features: string | null
          list_agent_id: string | null
          list_office_id: string | null
          list_price: number | null
          living_area: number | null
          lot_description: string | null
          lot_size: number | null
          mls_number: string
          neighborhood: string | null
          num_units: number | null
          parking_feature: string | null
          parking_spaces: number | null
          pets_allowed: string | null
          photo_count: number | null
          pool_description: string | null
          previous_list_price: number | null
          price_change_at: string | null
          price_cut: boolean
          prop_subtype: string | null
          prop_type: string | null
          remarks: string | null
          road_type: string | null
          roof_material: string | null
          sale_price: number | null
          settled_date: string | null
          sewer: string | null
          sqft_above_grade: number | null
          sqft_below_grade: number | null
          state: string | null
          status: string | null
          street_name: string | null
          street_no: string | null
          style: string | null
          synced_at: string
          tax_year: number | null
          taxes: number | null
          total_rooms: number | null
          town: string | null
          town_num: string | null
          unit_level: number | null
          unit_no: string | null
          unit_placement: string | null
          water: string | null
          waterfront: boolean | null
          waterfront_desc: string | null
          waterview_features: string | null
          year_built: number | null
          year_built_descrp: string | null
          zip: string | null
        }
        Insert: {
          acres?: number | null
          address?: string | null
          adult_community?: boolean | null
          appliances?: string | null
          basement?: boolean | null
          basement_feature?: string | null
          bedrooms?: number | null
          color?: string | null
          construction?: string | null
          cooling?: string | null
          date_available?: string | null
          electric_feature?: string | null
          energy_features?: string | null
          exterior?: string | null
          exterior_features?: string | null
          feed?: string
          first_seen_at?: string
          flooring?: string | null
          full_baths?: number | null
          garage_parking?: string | null
          garage_spaces?: number | null
          half_baths?: number | null
          heating?: string | null
          hoa?: boolean | null
          hoa_fee?: number | null
          hot_water?: string | null
          interior_features?: string | null
          laundry_features?: string | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          living_area?: number | null
          lot_description?: string | null
          lot_size?: number | null
          mls_number: string
          neighborhood?: string | null
          num_units?: number | null
          parking_feature?: string | null
          parking_spaces?: number | null
          pets_allowed?: string | null
          photo_count?: number | null
          pool_description?: string | null
          previous_list_price?: number | null
          price_change_at?: string | null
          price_cut?: boolean
          prop_subtype?: string | null
          prop_type?: string | null
          remarks?: string | null
          road_type?: string | null
          roof_material?: string | null
          sale_price?: number | null
          settled_date?: string | null
          sewer?: string | null
          sqft_above_grade?: number | null
          sqft_below_grade?: number | null
          state?: string | null
          status?: string | null
          street_name?: string | null
          street_no?: string | null
          style?: string | null
          synced_at?: string
          tax_year?: number | null
          taxes?: number | null
          total_rooms?: number | null
          town?: string | null
          town_num?: string | null
          unit_level?: number | null
          unit_no?: string | null
          unit_placement?: string | null
          water?: string | null
          waterfront?: boolean | null
          waterfront_desc?: string | null
          waterview_features?: string | null
          year_built?: number | null
          year_built_descrp?: string | null
          zip?: string | null
        }
        Update: {
          acres?: number | null
          address?: string | null
          adult_community?: boolean | null
          appliances?: string | null
          basement?: boolean | null
          basement_feature?: string | null
          bedrooms?: number | null
          color?: string | null
          construction?: string | null
          cooling?: string | null
          date_available?: string | null
          electric_feature?: string | null
          energy_features?: string | null
          exterior?: string | null
          exterior_features?: string | null
          feed?: string
          first_seen_at?: string
          flooring?: string | null
          full_baths?: number | null
          garage_parking?: string | null
          garage_spaces?: number | null
          half_baths?: number | null
          heating?: string | null
          hoa?: boolean | null
          hoa_fee?: number | null
          hot_water?: string | null
          interior_features?: string | null
          laundry_features?: string | null
          list_agent_id?: string | null
          list_office_id?: string | null
          list_price?: number | null
          living_area?: number | null
          lot_description?: string | null
          lot_size?: number | null
          mls_number?: string
          neighborhood?: string | null
          num_units?: number | null
          parking_feature?: string | null
          parking_spaces?: number | null
          pets_allowed?: string | null
          photo_count?: number | null
          pool_description?: string | null
          previous_list_price?: number | null
          price_change_at?: string | null
          price_cut?: boolean
          prop_subtype?: string | null
          prop_type?: string | null
          remarks?: string | null
          road_type?: string | null
          roof_material?: string | null
          sale_price?: number | null
          settled_date?: string | null
          sewer?: string | null
          sqft_above_grade?: number | null
          sqft_below_grade?: number | null
          state?: string | null
          status?: string | null
          street_name?: string | null
          street_no?: string | null
          style?: string | null
          synced_at?: string
          tax_year?: number | null
          taxes?: number | null
          total_rooms?: number | null
          town?: string | null
          town_num?: string | null
          unit_level?: number | null
          unit_no?: string | null
          unit_placement?: string | null
          water?: string | null
          waterfront?: boolean | null
          waterfront_desc?: string | null
          waterview_features?: string | null
          year_built?: number | null
          year_built_descrp?: string | null
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
      idx_price_history: {
        Row: {
          id: number
          list_price: number | null
          mls_number: string
          previous_list_price: number | null
          recorded_at: string
        }
        Insert: {
          id?: number
          list_price?: number | null
          mls_number: string
          previous_list_price?: number | null
          recorded_at?: string
        }
        Update: {
          id?: number
          list_price?: number | null
          mls_number?: string
          previous_list_price?: number | null
          recorded_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "idx_price_history_mls_number_fkey"
            columns: ["mls_number"]
            isOneToOne: false
            referencedRelation: "idx_listings"
            referencedColumns: ["mls_number"]
          },
        ]
      }
      idx_sold_archive: {
        Row: {
          acres: number | null
          address: string | null
          address_key: string | null
          basement: boolean | null
          bedrooms: number | null
          first_archived_at: string
          full_baths: number | null
          garage_spaces: number | null
          half_baths: number | null
          hoa: boolean | null
          hoa_fee: number | null
          last_seen_at: string
          list_price: number | null
          living_area: number | null
          lot_size: number | null
          mls_number: string
          neighborhood: string | null
          parking_spaces: number | null
          photo_count: number | null
          prop_subtype: string | null
          prop_type: string | null
          sale_price: number | null
          settled_date: string | null
          sqft_above_grade: number | null
          sqft_below_grade: number | null
          state: string | null
          status: string | null
          street_name: string | null
          street_no: string | null
          style: string | null
          tax_year: number | null
          taxes: number | null
          total_rooms: number | null
          town: string | null
          town_num: string | null
          unit_no: string | null
          waterfront: boolean | null
          year_built: number | null
          zip: string | null
        }
        Insert: {
          acres?: number | null
          address?: string | null
          address_key?: string | null
          basement?: boolean | null
          bedrooms?: number | null
          first_archived_at?: string
          full_baths?: number | null
          garage_spaces?: number | null
          half_baths?: number | null
          hoa?: boolean | null
          hoa_fee?: number | null
          last_seen_at?: string
          list_price?: number | null
          living_area?: number | null
          lot_size?: number | null
          mls_number: string
          neighborhood?: string | null
          parking_spaces?: number | null
          photo_count?: number | null
          prop_subtype?: string | null
          prop_type?: string | null
          sale_price?: number | null
          settled_date?: string | null
          sqft_above_grade?: number | null
          sqft_below_grade?: number | null
          state?: string | null
          status?: string | null
          street_name?: string | null
          street_no?: string | null
          style?: string | null
          tax_year?: number | null
          taxes?: number | null
          total_rooms?: number | null
          town?: string | null
          town_num?: string | null
          unit_no?: string | null
          waterfront?: boolean | null
          year_built?: number | null
          zip?: string | null
        }
        Update: {
          acres?: number | null
          address?: string | null
          address_key?: string | null
          basement?: boolean | null
          bedrooms?: number | null
          first_archived_at?: string
          full_baths?: number | null
          garage_spaces?: number | null
          half_baths?: number | null
          hoa?: boolean | null
          hoa_fee?: number | null
          last_seen_at?: string
          list_price?: number | null
          living_area?: number | null
          lot_size?: number | null
          mls_number?: string
          neighborhood?: string | null
          parking_spaces?: number | null
          photo_count?: number | null
          prop_subtype?: string | null
          prop_type?: string | null
          sale_price?: number | null
          settled_date?: string | null
          sqft_above_grade?: number | null
          sqft_below_grade?: number | null
          state?: string | null
          status?: string | null
          street_name?: string | null
          street_no?: string | null
          style?: string | null
          tax_year?: number | null
          taxes?: number | null
          total_rooms?: number | null
          town?: string | null
          town_num?: string | null
          unit_no?: string | null
          waterfront?: boolean | null
          year_built?: number | null
          zip?: string | null
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
      listing_favorites: {
        Row: {
          address: string | null
          bedrooms: number | null
          created_at: string
          full_baths: number | null
          half_baths: number | null
          list_price: number | null
          living_area: number | null
          mls_number: string
          photo_count: number | null
          prop_type: string | null
          state: string | null
          town: string | null
          user_id: string
          zip: string | null
        }
        Insert: {
          address?: string | null
          bedrooms?: number | null
          created_at?: string
          full_baths?: number | null
          half_baths?: number | null
          list_price?: number | null
          living_area?: number | null
          mls_number: string
          photo_count?: number | null
          prop_type?: string | null
          state?: string | null
          town?: string | null
          user_id?: string
          zip?: string | null
        }
        Update: {
          address?: string | null
          bedrooms?: number | null
          created_at?: string
          full_baths?: number | null
          half_baths?: number | null
          list_price?: number | null
          living_area?: number | null
          mls_number?: string
          photo_count?: number | null
          prop_type?: string | null
          state?: string | null
          town?: string | null
          user_id?: string
          zip?: string | null
        }
        Relationships: []
      }
      listing_views: {
        Row: {
          address: string | null
          bedrooms: number | null
          first_viewed_at: string
          last_viewed_at: string
          list_price: number | null
          mls_number: string
          photo_count: number | null
          prop_type: string | null
          state: string | null
          town: string | null
          user_id: string
          view_count: number
          zip: string | null
        }
        Insert: {
          address?: string | null
          bedrooms?: number | null
          first_viewed_at?: string
          last_viewed_at?: string
          list_price?: number | null
          mls_number: string
          photo_count?: number | null
          prop_type?: string | null
          state?: string | null
          town?: string | null
          user_id: string
          view_count?: number
          zip?: string | null
        }
        Update: {
          address?: string | null
          bedrooms?: number | null
          first_viewed_at?: string
          last_viewed_at?: string
          list_price?: number | null
          mls_number?: string
          photo_count?: number | null
          prop_type?: string | null
          state?: string | null
          town?: string | null
          user_id?: string
          view_count?: number
          zip?: string | null
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
          mls_number: string | null
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
          mls_number?: string | null
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
          mls_number?: string | null
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
      profiles: {
        Row: {
          created_at: string
          email: string
          email_verified: boolean | null
          first_name: string
          id: string
          last_name: string
          phone_number: string
          phone_verified: boolean | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          email_verified?: boolean | null
          first_name: string
          id: string
          last_name: string
          phone_number: string
          phone_verified?: boolean | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          email_verified?: boolean | null
          first_name?: string
          id?: string
          last_name?: string
          phone_number?: string
          phone_verified?: boolean | null
          updated_at?: string
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
      rental_application_documents: {
        Row: {
          admin_note: string | null
          application_id: string
          created_at: string
          file_name: string
          id: string
          kind: string
          label: string | null
          mime_type: string
          needs_replacement: boolean
          size_bytes: number
          storage_path: string
          uploaded_by: string
        }
        Insert: {
          admin_note?: string | null
          application_id: string
          created_at?: string
          file_name: string
          id?: string
          kind: string
          label?: string | null
          mime_type: string
          needs_replacement?: boolean
          size_bytes: number
          storage_path: string
          uploaded_by?: string
        }
        Update: {
          admin_note?: string | null
          application_id?: string
          created_at?: string
          file_name?: string
          id?: string
          kind?: string
          label?: string | null
          mime_type?: string
          needs_replacement?: boolean
          size_bytes?: number
          storage_path?: string
          uploaded_by?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_application_documents_application_id_fkey"
            columns: ["application_id"]
            isOneToOne: false
            referencedRelation: "rental_applications"
            referencedColumns: ["id"]
          },
        ]
      }
      rental_application_invites: {
        Row: {
          created_at: string
          created_by: string | null
          expires_at: string | null
          id: string
          invitee_email: string | null
          label: string | null
          monthly_rent: number | null
          property_address: string | null
          property_state: string | null
          property_town: string | null
          property_zip: string | null
          revoked_at: string | null
          sent_at: string | null
          token: string
          unit: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          label?: string | null
          monthly_rent?: number | null
          property_address?: string | null
          property_state?: string | null
          property_town?: string | null
          property_zip?: string | null
          revoked_at?: string | null
          sent_at?: string | null
          token?: string
          unit?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          id?: string
          invitee_email?: string | null
          label?: string | null
          monthly_rent?: number | null
          property_address?: string | null
          property_state?: string | null
          property_town?: string | null
          property_zip?: string | null
          revoked_at?: string | null
          sent_at?: string | null
          token?: string
          unit?: string | null
        }
        Relationships: []
      }
      rental_applications: {
        Row: {
          admin_notified_at: string | null
          applicant_email: string | null
          applicant_first_name: string | null
          applicant_last_name: string | null
          applicant_phone: string | null
          applicant_user_id: string
          certified_at: string | null
          created_at: string
          credit_auth_at: string | null
          data: Json
          id: string
          invite_id: string | null
          status: string
          submitted_at: string | null
          updated_at: string
        }
        Insert: {
          admin_notified_at?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_phone?: string | null
          applicant_user_id?: string
          certified_at?: string | null
          created_at?: string
          credit_auth_at?: string | null
          data?: Json
          id?: string
          invite_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Update: {
          admin_notified_at?: string | null
          applicant_email?: string | null
          applicant_first_name?: string | null
          applicant_last_name?: string | null
          applicant_phone?: string | null
          applicant_user_id?: string
          certified_at?: string | null
          created_at?: string
          credit_auth_at?: string | null
          data?: Json
          id?: string
          invite_id?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "rental_applications_invite_id_fkey"
            columns: ["invite_id"]
            isOneToOne: false
            referencedRelation: "rental_application_invites"
            referencedColumns: ["id"]
          },
        ]
      }
      showing_tour_stops: {
        Row: {
          address: string
          created_at: string
          id: string
          kind: string
          list_price: number | null
          mls_number: string | null
          note: string | null
          starts_at: string
          state: string | null
          tour_id: string
          town: string | null
          zip: string | null
        }
        Insert: {
          address: string
          created_at?: string
          id?: string
          kind?: string
          list_price?: number | null
          mls_number?: string | null
          note?: string | null
          starts_at: string
          state?: string | null
          tour_id: string
          town?: string | null
          zip?: string | null
        }
        Update: {
          address?: string
          created_at?: string
          id?: string
          kind?: string
          list_price?: number | null
          mls_number?: string | null
          note?: string | null
          starts_at?: string
          state?: string | null
          tour_id?: string
          town?: string | null
          zip?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "showing_tour_stops_tour_id_fkey"
            columns: ["tour_id"]
            isOneToOne: false
            referencedRelation: "showing_tours"
            referencedColumns: ["id"]
          },
        ]
      }
      showing_tours: {
        Row: {
          client_email: string | null
          client_name: string
          client_phone: string | null
          created_at: string
          id: string
          note: string | null
          sent_at: string | null
          tour_date: string
          updated_at: string
        }
        Insert: {
          client_email?: string | null
          client_name: string
          client_phone?: string | null
          created_at?: string
          id?: string
          note?: string | null
          sent_at?: string | null
          tour_date: string
          updated_at?: string
        }
        Update: {
          client_email?: string | null
          client_name?: string
          client_phone?: string | null
          created_at?: string
          id?: string
          note?: string | null
          sent_at?: string | null
          tour_date?: string
          updated_at?: string
        }
        Relationships: []
      }
      videos: {
        Row: {
          body: string | null
          created_at: string
          description: string
          featured: boolean
          id: number
          instagram_id: string
          is_published: boolean
          kind: string
          posted_date: string
          poster_url: string | null
          slug: string
          title: string
          town: string | null
          updated_at: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          description: string
          featured?: boolean
          id?: number
          instagram_id: string
          is_published?: boolean
          kind?: string
          posted_date: string
          poster_url?: string | null
          slug: string
          title: string
          town?: string | null
          updated_at?: string
        }
        Update: {
          body?: string | null
          created_at?: string
          description?: string
          featured?: boolean
          id?: number
          instagram_id?: string
          is_published?: boolean
          kind?: string
          posted_date?: string
          poster_url?: string | null
          slug?: string
          title?: string
          town?: string | null
          updated_at?: string
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
      idx_comp_pool: {
        Row: {
          acres: number | null
          address: string | null
          basement: boolean | null
          bedrooms: number | null
          full_baths: number | null
          garage_spaces: number | null
          geocode_precision: string | null
          half_baths: number | null
          lat: number | null
          list_price: number | null
          living_area: number | null
          lon: number | null
          lot_size: number | null
          mls_number: string | null
          photo_count: number | null
          prop_subtype: string | null
          prop_type: string | null
          sale_price: number | null
          settled_date: string | null
          state: string | null
          street_name: string | null
          style: string | null
          town: string | null
          year_built: number | null
          zip: string | null
        }
        Relationships: []
      }
      idx_town_counts: {
        Row: {
          listings: number | null
          town: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      admin_client_activity: {
        Args: never
        Returns: {
          email: string
          full_name: string
          last_active: string
          saved_count: number
          user_id: string
          viewed_count: number
        }[]
      }
      crm_upsert_contact: {
        Args: {
          p_birthday?: string
          p_email?: string
          p_first: string
          p_last: string
          p_match_email?: string
          p_match_phone?: string
          p_phone?: string
          p_prefer_new?: boolean
          p_source?: string
          p_tag?: string
          p_tag_color?: string
        }
        Returns: number
      }
      handyman_is_owner: { Args: never; Returns: boolean }
      handyman_next_document_number: {
        Args: { p_kind: string }
        Returns: string
      }
      handyman_prepare_table: {
        Args: { table_name: string }
        Returns: undefined
      }
      idx_address_key: {
        Args: {
          p_address: string
          p_state: string
          p_town: string
          p_zip: string
        }
        Returns: string
      }
      idx_archive_sold:
        | { Args: never; Returns: number }
        | { Args: { p_mls: string[] }; Returns: number }
      idx_comparable_sales: {
        Args: {
          p_exclude_mls?: string
          p_lat?: number
          p_limit?: number
          p_lon?: number
          p_max_sqft?: number
          p_min_sqft?: number
          p_months?: number
          p_prop_type: string
          p_radius_km?: number
          p_state?: string
          p_town: string
        }
        Returns: {
          acres: number
          address: string
          basement: boolean
          bedrooms: number
          distance_km: number
          full_baths: number
          garage_spaces: number
          geocode_precision: string
          half_baths: number
          lat: number
          list_price: number
          living_area: number
          lon: number
          lot_size: number
          mls_number: string
          photo_count: number
          prop_subtype: string
          prop_type: string
          sale_price: number
          settled_date: string
          street_name: string
          style: string
          town: string
          year_built: number
          zip: string
        }[]
      }
      idx_distance_km: {
        Args: { lat1: number; lat2: number; lon1: number; lon2: number }
        Returns: number
      }
      idx_refresh_comp_pool: { Args: never; Returns: undefined }
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
      record_listing_view: { Args: { p_mls: string }; Returns: undefined }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
