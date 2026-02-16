import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Tipos TypeScript para nossas tabelas
export type Memory = {
  id: string;
  conversation_id: string;
  user_id: string;
  type: 'idea' | 'decision' | 'insight' | 'question';
  content: string;
  tags: string[];
  embedding?: number[];
  created_at: string;
  user_note?: string;
  approved: boolean;
};

export type Conversation = {
  id: string;
  user_id: string;
  raw_text: string;
  source?: string;
  created_at: string;
  processed: boolean;
};