// Generated from the Supabase schema (supabase-streak-tracker). Regenerate after schema changes.
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.18";
  };
  public: {
    Tables: {
      checkins: {
        Row: {
          created_at: string;
          day: string;
          drank: boolean;
          id: number;
          nutted: boolean;
          points: number;
          ran: boolean;
          screenshot_path: string | null;
          smoked: boolean;
          streak: number;
          user_id: string;
        };
        Insert: never;
        Update: never;
        Relationships: [
          {
            foreignKeyName: "checkins_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          id: string;
          onboarded: boolean;
          username: string;
        };
        Insert: never;
        Update: never;
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      app_status: { Args: never; Returns: Json };
      claim_username: { Args: { p_username: string }; Returns: Json };
      complete_onboarding: { Args: never; Returns: undefined };
      get_leaderboard: {
        Args: { p_limit?: number };
        Returns: {
          current_streak: number;
          days_logged: number;
          no_nut_days: number;
          points: number;
          rank: number;
          runs: number;
          username: string;
        }[];
      };
      get_my_summary: { Args: never; Returns: Json };
      get_public_profile: { Args: { p_username: string }; Returns: Json };
      get_run_feed: {
        Args: { p_before?: string; p_limit?: number };
        Returns: {
          created_at: string;
          day: string;
          id: number;
          screenshot_path: string;
          username: string;
        }[];
      };
      is_username_available: { Args: { p_username: string }; Returns: boolean };
      submit_checkin: {
        Args: {
          p_drank: boolean;
          p_nutted: boolean;
          p_ran: boolean;
          p_screenshot_path?: string;
          p_smoked: boolean;
        };
        Returns: Json;
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
