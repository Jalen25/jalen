import { supabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Função para gerar embedding da query
async function generateEmbedding(text: string): Promise<number[]> {
  try {
    const response = await openai.embeddings.create({
      model: "text-embedding-3-small",
      input: text,
    });
    return response.data[0].embedding;
  } catch (error) {
    console.error('Erro ao gerar embedding:', error);
    return [];
  }
}

export async function POST(req: Request) {
  try {
    // Pegar usuário logado
    const cookieStore = await cookies();
    const supabaseServer = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabaseServer.auth.getUser();
    
    if (!user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const { query, type, limit = 20 } = await req.json();

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query vazia' },
        { status: 400 }
      );
    }

    console.log('🔍 Buscando por:', query);

    // 1. Gerar embedding da busca
    const queryEmbedding = await generateEmbedding(query);

    if (queryEmbedding.length === 0) {
      return await textSearch(query, type, limit, user.id);
    }

    // 2. Busca vetorial usando PostgreSQL + pgvector
    let rpcQuery = supabase.rpc('match_memories', {
      query_embedding: queryEmbedding,
      match_threshold: 0.3,
      match_count: limit,
      filter_user_id: user.id
    });

    const { data: memories, error } = await rpcQuery;

    if (error) {
      console.error('Erro na busca vetorial:', error);
      return await textSearch(query, type, limit, user.id);
    }

    // 3. Filtrar por tipo se necessário
    let results = memories || [];
    
    if (type && ['idea', 'decision', 'insight', 'question'].includes(type)) {
      results = results.filter((m: any) => m.type === type);
    }

    console.log(`✅ Encontrou ${results.length} resultados`);

    return NextResponse.json({
      success: true,
      results,
      count: results.length,
      method: 'semantic'
    });

  } catch (error) {
    console.error('Erro na busca:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar memórias' },
      { status: 500 }
    );
  }
}

// Função de fallback: busca textual
async function textSearch(query: string, type: string | undefined, limit: number, userId: string) {
  console.log('⚠️ Usando busca textual (fallback)');
  
  let searchQuery = supabase
    .from('memories')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  searchQuery = searchQuery.or(
    `content.ilike.%${query}%,tags.cs.{${query}}`
  );

  if (type && ['idea', 'decision', 'insight', 'question'].includes(type)) {
    searchQuery = searchQuery.eq('type', type);
  }

  const { data: memories, error } = await searchQuery;

  if (error) {
    throw error;
  }

  const results = memories?.map(memory => ({
    ...memory,
    similarity: 0.5
  })) || [];

  return NextResponse.json({
    success: true,
    results,
    count: results.length,
    method: 'text'
  });
}