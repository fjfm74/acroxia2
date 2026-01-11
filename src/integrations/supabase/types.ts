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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      analysis_results: {
        Row: {
          contract_id: string
          created_at: string
          full_report: Json | null
          id: string
          illegal_clauses: number | null
          summary: string | null
          suspicious_clauses: number | null
          total_clauses: number | null
          valid_clauses: number | null
        }
        Insert: {
          contract_id: string
          created_at?: string
          full_report?: Json | null
          id?: string
          illegal_clauses?: number | null
          summary?: string | null
          suspicious_clauses?: number | null
          total_clauses?: number | null
          valid_clauses?: number | null
        }
        Update: {
          contract_id?: string
          created_at?: string
          full_report?: Json | null
          id?: string
          illegal_clauses?: number | null
          summary?: string | null
          suspicious_clauses?: number | null
          total_clauses?: number | null
          valid_clauses?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "analysis_results_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      authors: {
        Row: {
          avatar_url: string | null
          bio: string
          created_at: string
          credentials: string[] | null
          id: string
          linkedin_url: string | null
          name: string
          role: string
          slug: string
          twitter_url: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          bio: string
          created_at?: string
          credentials?: string[] | null
          id?: string
          linkedin_url?: string | null
          name: string
          role: string
          slug: string
          twitter_url?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          bio?: string
          created_at?: string
          credentials?: string[] | null
          id?: string
          linkedin_url?: string | null
          name?: string
          role?: string
          slug?: string
          twitter_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          blog_author_id: string | null
          category: string
          content: string
          created_at: string
          excerpt: string
          id: string
          image: string | null
          keywords: string[] | null
          meta_description: string | null
          published_at: string | null
          read_time: string
          slug: string
          status: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          blog_author_id?: string | null
          category: string
          content: string
          created_at?: string
          excerpt: string
          id?: string
          image?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          published_at?: string | null
          read_time?: string
          slug: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          blog_author_id?: string | null
          category?: string
          content?: string
          created_at?: string
          excerpt?: string
          id?: string
          image?: string | null
          keywords?: string[] | null
          meta_description?: string | null
          published_at?: string | null
          read_time?: string
          slug?: string
          status?: Database["public"]["Enums"]["blog_post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "blog_posts_blog_author_id_fkey"
            columns: ["blog_author_id"]
            isOneToOne: false
            referencedRelation: "authors"
            referencedColumns: ["id"]
          },
        ]
      }
      consent_logs: {
        Row: {
          accepted: boolean
          consent_type: string
          created_at: string
          document_version: string | null
          id: string
          ip_address: string | null
          metadata: Json | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted?: boolean
          consent_type: string
          created_at?: string
          document_version?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted?: boolean
          consent_type?: string
          created_at?: string
          document_version?: string | null
          id?: string
          ip_address?: string | null
          metadata?: Json | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          created_at: string
          file_name: string
          file_path: string
          file_size: number | null
          id: string
          status: Database["public"]["Enums"]["contract_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          file_name: string
          file_path: string
          file_size?: number | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          id?: string
          status?: Database["public"]["Enums"]["contract_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      legal_chunks: {
        Row: {
          affected_municipalities: string[] | null
          affected_provinces: string[] | null
          applies_when: Json | null
          article_reference: string | null
          chunk_index: number
          content: string
          created_at: string
          document_id: string
          id: string
          key_entities: string[] | null
          metadata: Json | null
          search_vector: unknown
          section_title: string | null
          semantic_category: string | null
          territorial_scope: string | null
        }
        Insert: {
          affected_municipalities?: string[] | null
          affected_provinces?: string[] | null
          applies_when?: Json | null
          article_reference?: string | null
          chunk_index: number
          content: string
          created_at?: string
          document_id: string
          id?: string
          key_entities?: string[] | null
          metadata?: Json | null
          search_vector?: unknown
          section_title?: string | null
          semantic_category?: string | null
          territorial_scope?: string | null
        }
        Update: {
          affected_municipalities?: string[] | null
          affected_provinces?: string[] | null
          applies_when?: Json | null
          article_reference?: string | null
          chunk_index?: number
          content?: string
          created_at?: string
          document_id?: string
          id?: string
          key_entities?: string[] | null
          metadata?: Json | null
          search_vector?: unknown
          section_title?: string | null
          semantic_category?: string | null
          territorial_scope?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "legal_chunks_document_id_fkey"
            columns: ["document_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_documents: {
        Row: {
          ai_summary: string | null
          created_at: string
          description: string | null
          effective_date: string | null
          expiration_date: string | null
          file_path: string | null
          id: string
          is_active: boolean
          jurisdiction: Database["public"]["Enums"]["legal_jurisdiction"] | null
          keywords: string[] | null
          source: string | null
          superseded_by_id: string | null
          supersedes_ids: string[] | null
          territorial_entity: string | null
          title: string
          type: Database["public"]["Enums"]["legal_doc_type"]
          updated_at: string
        }
        Insert: {
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?:
            | Database["public"]["Enums"]["legal_jurisdiction"]
            | null
          keywords?: string[] | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_ids?: string[] | null
          territorial_entity?: string | null
          title: string
          type: Database["public"]["Enums"]["legal_doc_type"]
          updated_at?: string
        }
        Update: {
          ai_summary?: string | null
          created_at?: string
          description?: string | null
          effective_date?: string | null
          expiration_date?: string | null
          file_path?: string | null
          id?: string
          is_active?: boolean
          jurisdiction?:
            | Database["public"]["Enums"]["legal_jurisdiction"]
            | null
          keywords?: string[] | null
          source?: string | null
          superseded_by_id?: string | null
          supersedes_ids?: string[] | null
          territorial_entity?: string | null
          title?: string
          type?: Database["public"]["Enums"]["legal_doc_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_documents_superseded_by_id_fkey"
            columns: ["superseded_by_id"]
            isOneToOne: false
            referencedRelation: "legal_documents"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          cookies_consent: Json | null
          created_at: string
          credits: number
          email: string
          first_name: string | null
          full_name: string | null
          id: string
          last_name: string | null
          phone: string | null
          privacy_accepted_at: string | null
          terms_accepted_at: string | null
          updated_at: string
        }
        Insert: {
          cookies_consent?: Json | null
          created_at?: string
          credits?: number
          email: string
          first_name?: string | null
          full_name?: string | null
          id: string
          last_name?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Update: {
          cookies_consent?: Json | null
          created_at?: string
          credits?: number
          email?: string
          first_name?: string | null
          full_name?: string | null
          id?: string
          last_name?: string | null
          phone?: string | null
          privacy_accepted_at?: string | null
          terms_accepted_at?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      rate_limits: {
        Row: {
          created_at: string
          endpoint: string
          id: string
          ip_address: string
        }
        Insert: {
          created_at?: string
          endpoint: string
          id?: string
          ip_address: string
        }
        Update: {
          created_at?: string
          endpoint?: string
          id?: string
          ip_address?: string
        }
        Relationships: []
      }
      scheduled_posts: {
        Row: {
          approval_token: string
          approved_at: string | null
          blog_post_id: string
          created_at: string
          email_sent_at: string | null
          id: string
          rejected_at: string | null
          scheduled_publish_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          approval_token?: string
          approved_at?: string | null
          blog_post_id: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          rejected_at?: string | null
          scheduled_publish_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          approval_token?: string
          approved_at?: string | null
          blog_post_id?: string
          created_at?: string
          email_sent_at?: string | null
          id?: string
          rejected_at?: string | null
          scheduled_publish_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scheduled_posts_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      site_config: {
        Row: {
          id: string
          key: string
          updated_at: string
          value: Json
        }
        Insert: {
          id?: string
          key: string
          updated_at?: string
          value: Json
        }
        Update: {
          id?: string
          key?: string
          updated_at?: string
          value?: Json
        }
        Relationships: []
      }
      social_posts: {
        Row: {
          author_id: string | null
          caption: string | null
          content_type: Database["public"]["Enums"]["social_content_type"]
          created_at: string
          hashtags: string[] | null
          id: string
          image_urls: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_for: string | null
          slides: Json | null
          source_blog_id: string | null
          status: Database["public"]["Enums"]["social_post_status"]
          title: string
          updated_at: string
        }
        Insert: {
          author_id?: string | null
          caption?: string | null
          content_type: Database["public"]["Enums"]["social_content_type"]
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          platform: Database["public"]["Enums"]["social_platform"]
          scheduled_for?: string | null
          slides?: Json | null
          source_blog_id?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          title: string
          updated_at?: string
        }
        Update: {
          author_id?: string | null
          caption?: string | null
          content_type?: Database["public"]["Enums"]["social_content_type"]
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_urls?: string[] | null
          platform?: Database["public"]["Enums"]["social_platform"]
          scheduled_for?: string | null
          slides?: Json | null
          source_blog_id?: string | null
          status?: Database["public"]["Enums"]["social_post_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "social_posts_source_blog_id_fkey"
            columns: ["source_blog_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          id: string
          plan_type: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          id?: string
          plan_type?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      cleanup_old_rate_limits: { Args: never; Returns: undefined }
      decrement_credit: { Args: { user_id: string }; Returns: undefined }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { check_user_id: string }; Returns: boolean }
      search_legal_chunks:
        | {
            Args: { match_count?: number; search_query: string }
            Returns: {
              article_reference: string
              content: string
              document_id: string
              document_title: string
              document_type: Database["public"]["Enums"]["legal_doc_type"]
              id: string
              rank: number
              section_title: string
            }[]
          }
        | {
            Args: {
              match_count?: number
              search_query: string
              territorial_filter?: string
            }
            Returns: {
              article_reference: string
              content: string
              document_id: string
              document_title: string
              document_type: Database["public"]["Enums"]["legal_doc_type"]
              id: string
              jurisdiction: Database["public"]["Enums"]["legal_jurisdiction"]
              rank: number
              section_title: string
              territorial_entity: string
            }[]
          }
      search_legal_chunks_by_location: {
        Args: {
          match_count?: number
          municipality_name?: string
          province_name?: string
          search_query: string
        }
        Returns: {
          affected_municipalities: string[]
          affected_provinces: string[]
          article_reference: string
          content: string
          document_id: string
          document_title: string
          document_type: Database["public"]["Enums"]["legal_doc_type"]
          id: string
          jurisdiction: Database["public"]["Enums"]["legal_jurisdiction"]
          rank: number
          section_title: string
          territorial_entity: string
          territorial_scope: string
        }[]
      }
      search_legal_chunks_semantic: {
        Args: {
          key_entity?: string
          match_count?: number
          municipality_name?: string
          province_name?: string
          search_query: string
          semantic_categories?: string[]
        }
        Returns: {
          affected_municipalities: string[]
          affected_provinces: string[]
          applies_when: Json
          article_reference: string
          content: string
          document_id: string
          document_title: string
          document_type: Database["public"]["Enums"]["legal_doc_type"]
          id: string
          jurisdiction: Database["public"]["Enums"]["legal_jurisdiction"]
          key_entities: string[]
          rank: number
          section_title: string
          semantic_category: string
          territorial_entity: string
          territorial_scope: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "user"
      blog_post_status: "draft" | "published"
      contract_status: "pending" | "processing" | "completed" | "failed"
      legal_doc_type:
        | "ley"
        | "boe"
        | "jurisprudencia"
        | "guia"
        | "decreto"
        | "real_decreto"
        | "orden_ministerial"
        | "sentencia"
        | "otro"
      legal_jurisdiction:
        | "jurisprudencia"
        | "estatal"
        | "autonomica"
        | "provincial"
        | "local"
      social_content_type:
        | "post"
        | "carousel"
        | "story"
        | "reel_script"
        | "thread"
      social_platform:
        | "instagram"
        | "tiktok"
        | "facebook"
        | "linkedin"
        | "twitter"
      social_post_status: "draft" | "ready" | "published"
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
      app_role: ["admin", "user"],
      blog_post_status: ["draft", "published"],
      contract_status: ["pending", "processing", "completed", "failed"],
      legal_doc_type: [
        "ley",
        "boe",
        "jurisprudencia",
        "guia",
        "decreto",
        "real_decreto",
        "orden_ministerial",
        "sentencia",
        "otro",
      ],
      legal_jurisdiction: [
        "jurisprudencia",
        "estatal",
        "autonomica",
        "provincial",
        "local",
      ],
      social_content_type: [
        "post",
        "carousel",
        "story",
        "reel_script",
        "thread",
      ],
      social_platform: [
        "instagram",
        "tiktok",
        "facebook",
        "linkedin",
        "twitter",
      ],
      social_post_status: ["draft", "ready", "published"],
    },
  },
} as const
