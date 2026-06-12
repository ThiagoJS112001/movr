// Auto-generated Supabase database types for Movr.
// Reflects the schema defined in supabase/schema.sql.

export type Json = string | number | boolean | null | { [key: string]: Json } | Json[];

export interface Database {
  __InternalSupabase: {
    PostgrestVersion: '12';
  };
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          name: string;
          email: string;
          role: 'personal' | 'aluno' | 'academia';
          avatar_url: string | null;
          personal_id: string | null;
          is_blocked: boolean;
          connection_status: 'pending' | 'confirmed' | null;
          birth_date: string | null;
          bio: string | null;
          address: string | null;
          city: string | null;
          state: string | null;
          phone: string | null;
          has_personal: boolean;
          has_nutrition: boolean;
          amenities: string[];
          photos: string[];
          opening_hours: Json | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'is_blocked' | 'has_personal' | 'has_nutrition' | 'amenities' | 'photos'> & {
          is_blocked?: boolean;
          has_personal?: boolean;
          has_nutrition?: boolean;
          amenities?: string[];
          photos?: string[];
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
      };

      exercises: {
        Row: {
          id: string;
          name: string;
          muscle_group: string;
          description: string | null;
          image_url: string | null;
          video_url: string | null;
          personal_id: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['exercises']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['exercises']['Insert']>;
      };

      workouts: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          personal_id: string;
          status: 'ativo' | 'rascunho';
          level: 'iniciante' | 'intermediario' | 'avancado' | null;
          duration_minutes: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workouts']['Row'], 'id' | 'created_at' | 'status'> & { id?: string; status?: 'ativo' | 'rascunho'; created_at?: string };
        Update: Partial<Database['public']['Tables']['workouts']['Insert']>;
      };

      workout_exercises: {
        Row: {
          id: string;
          workout_id: string;
          exercise_id: string | null;
          exercise_name: string;
          sets: number;
          reps: string;
          weight: string | null;
          rest_seconds: number;
          notes: string | null;
          image_url: string | null;
          video_url: string | null;
          order_index: number;
        };
        Insert: Omit<Database['public']['Tables']['workout_exercises']['Row'], 'id' | 'rest_seconds' | 'order_index'> & { id?: string; rest_seconds?: number; order_index?: number };
        Update: Partial<Database['public']['Tables']['workout_exercises']['Insert']>;
      };

      workout_assignments: {
        Row: {
          id: string;
          workout_id: string;
          workout_name: string;
          student_id: string;
          personal_id: string;
          assigned_at: string;
          scheduled_days: string[];
        };
        Insert: Omit<Database['public']['Tables']['workout_assignments']['Row'], 'id' | 'assigned_at' | 'scheduled_days'> & { id?: string; assigned_at?: string; scheduled_days?: string[] };
        Update: Partial<Database['public']['Tables']['workout_assignments']['Insert']>;
      };

      workout_logs: {
        Row: {
          id: string;
          assignment_id: string | null;
          workout_id: string | null;
          workout_name: string;
          student_id: string;
          completed_at: string;
          completed_exercises: string[];
          exercise_weights: Json;
          duration_minutes: number | null;
          notes: string | null;
        };
        Insert: Omit<Database['public']['Tables']['workout_logs']['Row'], 'id' | 'completed_at' | 'completed_exercises' | 'exercise_weights'> & { id?: string; completed_at?: string; completed_exercises?: string[]; exercise_weights?: Json };
        Update: Partial<Database['public']['Tables']['workout_logs']['Insert']>;
      };

      diets: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          goal: string | null;
          status: 'ativa' | 'pausada';
          personal_id: string;
          target_calories: number | null;
          target_protein: number | null;
          target_carbs: number | null;
          target_fat: number | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['diets']['Row'], 'id' | 'created_at' | 'status'> & { id?: string; status?: 'ativa' | 'pausada'; created_at?: string };
        Update: Partial<Database['public']['Tables']['diets']['Insert']>;
      };

      meals: {
        Row: {
          id: string;
          diet_id: string;
          name: string;
          time: string;
          notes: string | null;
          order_index: number;
        };
        Insert: Omit<Database['public']['Tables']['meals']['Row'], 'id' | 'order_index'> & { id?: string; order_index?: number };
        Update: Partial<Database['public']['Tables']['meals']['Insert']>;
      };

      food_items: {
        Row: {
          id: string;
          meal_id: string;
          name: string;
          quantity: string;
          calories: number | null;
          protein: number | null;
          carbs: number | null;
          fat: number | null;
        };
        Insert: Omit<Database['public']['Tables']['food_items']['Row'], 'id'> & { id?: string };
        Update: Partial<Database['public']['Tables']['food_items']['Insert']>;
      };

      diet_assignments: {
        Row: {
          id: string;
          diet_id: string;
          diet_name: string;
          student_id: string;
          personal_id: string;
          assigned_at: string;
        };
        Insert: Omit<Database['public']['Tables']['diet_assignments']['Row'], 'id' | 'assigned_at'> & { id?: string; assigned_at?: string };
        Update: Partial<Database['public']['Tables']['diet_assignments']['Insert']>;
      };

      weekly_plans: {
        Row: {
          id: string;
          student_id: string;
          personal_id: string;
          days: Json;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_plans']['Row'], 'id' | 'updated_at'> & { id?: string; updated_at?: string };
        Update: Partial<Database['public']['Tables']['weekly_plans']['Insert']>;
      };

      weekly_plan_archives: {
        Row: {
          id: string;
          student_id: string;
          personal_id: string;
          days: Json;
          archived_at: string;
        };
        Insert: Omit<Database['public']['Tables']['weekly_plan_archives']['Row'], 'id' | 'archived_at'> & { id?: string; archived_at?: string };
        Update: Partial<Database['public']['Tables']['weekly_plan_archives']['Insert']>;
      };

      workout_sessions: {
        Row: {
          id: string;
          student_id: string;
          day_of_week: string;
          label: string;
          completed_exercise_ids: string[];
          duration_minutes: number;
          completed_at: string;
        };
        Insert: Omit<Database['public']['Tables']['workout_sessions']['Row'], 'id' | 'completed_at' | 'duration_minutes' | 'completed_exercise_ids'> & { id?: string; completed_at?: string; duration_minutes?: number; completed_exercise_ids?: string[] };
        Update: Partial<Database['public']['Tables']['workout_sessions']['Insert']>;
      };

      messages: {
        Row: {
          id: string;
          from_id: string;
          to_id: string;
          content: string;
          sent_at: string;
          read: boolean;
        };
        Insert: Omit<Database['public']['Tables']['messages']['Row'], 'id' | 'sent_at' | 'read'> & { id?: string; sent_at?: string; read?: boolean };
        Update: Partial<Database['public']['Tables']['messages']['Insert']>;
      };

      friend_requests: {
        Row: {
          id: string;
          from_id: string;
          to_id: string;
          status: 'pending' | 'accepted' | 'rejected';
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['friend_requests']['Row'], 'id' | 'created_at' | 'status'> & { id?: string; status?: 'pending' | 'accepted' | 'rejected'; created_at?: string };
        Update: Partial<Database['public']['Tables']['friend_requests']['Insert']>;
      };

      student_groups: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['student_groups']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['student_groups']['Insert']>;
      };

      group_members: {
        Row: {
          group_id: string;
          student_id: string;
        };
        Insert: Database['public']['Tables']['group_members']['Row'];
        Update: Partial<Database['public']['Tables']['group_members']['Row']>;
      };

      group_messages: {
        Row: {
          id: string;
          group_id: string;
          from_id: string;
          from_name: string;
          content: string;
          type: 'text' | 'image' | 'offer';
          image_url: string | null;
          offer_gym_id: string | null;
          offer_gym_name: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['group_messages']['Row'], 'id' | 'created_at' | 'type'> & { id?: string; type?: 'text' | 'image' | 'offer'; created_at?: string };
        Update: Partial<Database['public']['Tables']['group_messages']['Insert']>;
      };

      assessments: {
        Row: {
          id: string;
          student_id: string;
          personal_id: string;
          date: string;
          weight: number | null;
          body_fat: number | null;
          muscle_mass: number | null;
          lean_mass: number | null;
          chest: number | null;
          waist: number | null;
          hip: number | null;
          thigh: number | null;
          arm: number | null;
          calf: number | null;
          abdomen: number | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['assessments']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['assessments']['Insert']>;
      };

      gym_ratings: {
        Row: {
          id: string;
          gym_id: string;
          user_id: string;
          rating: number;
          comment: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gym_ratings']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['gym_ratings']['Insert']>;
      };

      gym_groups: {
        Row: {
          id: string;
          gym_id: string;
          name: string;
          description: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gym_groups']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['gym_groups']['Insert']>;
      };

      gym_group_members: {
        Row: {
          group_id: string;
          student_id: string;
          joined_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gym_group_members']['Row'], 'joined_at'> & { joined_at?: string };
        Update: Partial<Database['public']['Tables']['gym_group_members']['Insert']>;
      };

      gym_group_messages: {
        Row: {
          id: string;
          group_id: string;
          gym_id: string;
          gym_name: string;
          content: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['gym_group_messages']['Row'], 'id' | 'created_at'> & { id?: string; created_at?: string };
        Update: Partial<Database['public']['Tables']['gym_group_messages']['Insert']>;
      };

      student_payments: {
        Row: {
          id: string;
          personal_id: string;
          student_id: string;
          amount: number;
          description: string;
          due_date: string;
          paid_at: string | null;
          status: string;
          payment_method: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['student_payments']['Row'], 'id' | 'created_at' | 'status' | 'paid_at'> & { id?: string; created_at?: string; status?: string; paid_at?: string | null };
        Update: Partial<Database['public']['Tables']['student_payments']['Insert']>;
      };

      training_sessions: {
        Row: {
          id: string;
          personal_id: string;
          student_id: string;
          title: string;
          date: string;
          start_time: string;
          end_time: string;
          status: string;
          notes: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['training_sessions']['Row'], 'id' | 'created_at' | 'status'> & { id?: string; created_at?: string; status?: string };
        Update: Partial<Database['public']['Tables']['training_sessions']['Insert']>;
      };

      student_anamneses: {
        Row: {
          id: string;
          personal_id: string;
          student_id: string;
          objective: string | null;
          activity_level: string | null;
          has_health_issues: boolean;
          health_issues: string | null;
          medications: string | null;
          injuries: string | null;
          sleep_hours: number | null;
          stress_level: number | null;
          water_intake_liters: number | null;
          previous_training: string | null;
          training_years: number | null;
          preferred_days: string[];
          preferred_time: string | null;
          observations: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['student_anamneses']['Row'], 'id' | 'created_at' | 'updated_at' | 'has_health_issues' | 'preferred_days'> & { id?: string; created_at?: string; updated_at?: string; has_health_issues?: boolean; preferred_days?: string[] };
        Update: Partial<Database['public']['Tables']['student_anamneses']['Insert']>;
      };
    };

    Views: Record<string, never>;
    Functions: {
      my_role: { Args: Record<string, never>; Returns: string };
      my_personal_id: { Args: Record<string, never>; Returns: string };
      find_aluno_by_email: {
        Args: { search_email: string };
        Returns: {
          id: string;
          name: string;
          avatar_url: string | null;
          already_linked: boolean;
        }[];
      };
    };
    Enums: Record<string, never>;
  };
}