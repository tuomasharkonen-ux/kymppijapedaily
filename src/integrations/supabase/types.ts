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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      badges: {
        Row: {
          created_at: string | null
          description: string
          id: string
          name: string
          prize_credits: number | null
          rarity: string
          trigger_type: string
          trigger_value: string | null
        }
        Insert: {
          created_at?: string | null
          description: string
          id: string
          name: string
          prize_credits?: number | null
          rarity?: string
          trigger_type: string
          trigger_value?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          name?: string
          prize_credits?: number | null
          rarity?: string
          trigger_type?: string
          trigger_value?: string | null
        }
        Relationships: []
      }
      bets: {
        Row: {
          bet_type: string
          created_at: string
          game_date: string
          id: string
          lucky_number: number | null
          lukitut: boolean
          max_throws: number
          odds: number
          payout: number
          settled_at: string | null
          stake: number
          status: string
          tier: string | null
          user_id: string
        }
        Insert: {
          bet_type: string
          created_at?: string
          game_date: string
          id?: string
          lucky_number?: number | null
          lukitut?: boolean
          max_throws: number
          odds: number
          payout?: number
          settled_at?: string | null
          stake: number
          status?: string
          tier?: string | null
          user_id: string
        }
        Update: {
          bet_type?: string
          created_at?: string
          game_date?: string
          id?: string
          lucky_number?: number | null
          lukitut?: boolean
          max_throws?: number
          odds?: number
          payout?: number
          settled_at?: string | null
          stake?: number
          status?: string
          tier?: string | null
          user_id?: string
        }
        Relationships: []
      }
      credit_ledger: {
        Row: {
          created_at: string
          delta: number
          id: number
          reason: string
          ref: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          id?: number
          reason: string
          ref?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          id?: number
          reason?: string
          ref?: string | null
          user_id?: string
        }
        Relationships: []
      }
      game_records: {
        Row: {
          created_at: string
          id: string
          played_date: string
          throw_log: Json | null
          throws_count: number
          unlocked_any: boolean
          user_id: string | null
          winning_number: number
        }
        Insert: {
          created_at?: string
          id?: string
          played_date?: string
          throw_log?: Json | null
          throws_count: number
          unlocked_any?: boolean
          user_id?: string | null
          winning_number: number
        }
        Update: {
          created_at?: string
          id?: string
          played_date?: string
          throw_log?: Json | null
          throws_count?: number
          unlocked_any?: boolean
          user_id?: string | null
          winning_number?: number
        }
        Relationships: []
      }
      game_throws: {
        Row: {
          created_at: string
          dice_values: number[]
          id: string
          locked_indices: number[]
          played_date: string
          throw_number: number
          user_id: string
        }
        Insert: {
          created_at?: string
          dice_values: number[]
          id?: string
          locked_indices?: number[]
          played_date?: string
          throw_number: number
          user_id: string
        }
        Update: {
          created_at?: string
          dice_values?: number[]
          id?: string
          locked_indices?: number[]
          played_date?: string
          throw_number?: number
          user_id?: string
        }
        Relationships: []
      }
      jackpot: {
        Row: {
          balance: number
          id: number
          updated_at: string
        }
        Insert: {
          balance?: number
          id?: number
          updated_at?: string
        }
        Update: {
          balance?: number
          id?: number
          updated_at?: string
        }
        Relationships: []
      }
      jackpot_wins: {
        Row: {
          amount: number
          created_at: string
          game_date: string
          id: string
          throws_count: number
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          game_date: string
          id?: string
          throws_count: number
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          game_date?: string
          id?: string
          throws_count?: number
          user_id?: string
        }
        Relationships: []
      }
      pot_entries: {
        Row: {
          created_at: string
          game_date: string
          payout: number
          reveal_seen_at: string | null
          throws_count: number | null
          user_id: string
        }
        Insert: {
          created_at?: string
          game_date: string
          payout?: number
          reveal_seen_at?: string | null
          throws_count?: number | null
          user_id: string
        }
        Update: {
          created_at?: string
          game_date?: string
          payout?: number
          reveal_seen_at?: string | null
          throws_count?: number | null
          user_id?: string
        }
        Relationships: []
      }
      pots: {
        Row: {
          buy_in: number
          created_at: string
          game_date: string
          jackpot_cut: number
          prize_per_winner: number
          settled_at: string | null
          status: string
          total: number
          winner_ids: string[]
          winning_throws: number | null
        }
        Insert: {
          buy_in?: number
          created_at?: string
          game_date: string
          jackpot_cut?: number
          prize_per_winner?: number
          settled_at?: string | null
          status?: string
          total?: number
          winner_ids?: string[]
          winning_throws?: number | null
        }
        Update: {
          buy_in?: number
          created_at?: string
          game_date?: string
          jackpot_cut?: number
          prize_per_winner?: number
          settled_at?: string | null
          status?: string
          total?: number
          winner_ids?: string[]
          winning_throws?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          is_test_user: boolean
          updated_at: string | null
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string | null
          is_test_user?: boolean
          updated_at?: string | null
          user_id: string
          username: string
        }
        Update: {
          created_at?: string | null
          is_test_user?: boolean
          updated_at?: string | null
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      user_badges: {
        Row: {
          badge_id: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_id: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_id?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_badges_badge_id_fkey"
            columns: ["badge_id"]
            isOneToOne: false
            referencedRelation: "badges"
            referencedColumns: ["id"]
          },
        ]
      }
      user_credits: {
        Row: {
          balance: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          balance?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          balance?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_purchases: {
        Row: {
          id: string
          item_id: string
          purchased_at: string
          user_id: string
        }
        Insert: {
          id?: string
          item_id: string
          purchased_at?: string
          user_id: string
        }
        Update: {
          id?: string
          item_id?: string
          purchased_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_settings: {
        Row: {
          active_action: string[] | null
          active_background: string | null
          active_skin: string | null
          active_throw_animation: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          active_action?: string[] | null
          active_background?: string | null
          active_skin?: string | null
          active_throw_animation?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          active_action?: string[] | null
          active_background?: string | null
          active_skin?: string | null
          active_throw_animation?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      claim_jackpot: {
        Args: { p_game_date: string; p_throws: number; p_user_id: string }
        Returns: number
      }
      decrement_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: number
      }
      get_leaderboard: {
        Args: { p_limit?: number; p_sort_by?: string }
        Returns: {
          avg_throws: number
          best_throws: number
          current_streak: number
          games_played: number
          rank: number
          user_id: string
          username: string
        }[]
      }
      get_player_rankings: {
        Args: { p_user_id: string }
        Returns: {
          rank_by_average: number
          rank_by_best: number
          total_players: number
        }[]
      }
      helsinki_today: { Args: never; Returns: string }
      increment_user_credits: {
        Args: { p_amount: number; p_user_id: string }
        Returns: undefined
      }
      mark_pot_reveal_seen: {
        Args: { p_game_date: string }
        Returns: undefined
      }
      place_daily_bets: {
        Args: {
          p_bets: Json
          p_buy_in: number
          p_game_date: string
          p_join_pot: boolean
          p_user_id: string
        }
        Returns: number
      }
      settle_due_pots: { Args: never; Returns: number }
      settle_user_bets: {
        Args: { p_game_date: string; p_results: Json; p_user_id: string }
        Returns: number
      }
      vedot_apply_credit: {
        Args: { p_delta: number; p_reason: string; p_ref: string; p_user_id: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
