import { createClient as createSupabaseClient } from '@supabase/supabase-js'
import { createBrowserClient, createServerClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Cliente para uso no navegador (componentes 'use client')
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}

// Instância direta (compatibilidade)
export const supabase = createSupabaseClient(supabaseUrl, supabaseAnonKey)

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