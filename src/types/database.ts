export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      patrols: {
        Row: {
          id: string;
          name: string;
          color: string;
          current_level: number;
          created_at: string;
        };
        Insert: {
          id: string;
          name: string;
          color: string;
          current_level?: number;
        };
        Update: {
          name?: string;
          color?: string;
          current_level?: number;
        };
      };
      members: {
        Row: {
          id: string;
          patrol_id: string;
          name: string;
          tasks_stopien: number;
          tasks_funkcja: number;
          created_at: string;
        };
        Insert: {
          id: string;
          patrol_id: string;
          name: string;
          tasks_stopien?: number;
          tasks_funkcja?: number;
        };
        Update: {
          name?: string;
          tasks_stopien?: number;
          tasks_funkcja?: number;
        };
      };
      tasks: {
        Row: {
          id: number;
          patrol_id: string;
          task_key: string;
          current: number;
        };
        Insert: {
          patrol_id: string;
          task_key: string;
          current?: number;
        };
        Update: {
          current?: number;
        };
      };
      patrol_auth: {
        Row: {
          patrol_id: string;
          password: string;
        };
        Insert: {
          patrol_id: string;
          password: string;
        };
        Update: {
          password?: string;
        };
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
}
