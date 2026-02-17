import { supabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (type && ['idea', 'decision', 'insight', 'question'].includes(type)) {
      query = query.eq('type', type);
    }

    const { data: memories, error } = await query;

    if (error) {
      console.error('Erro ao buscar memórias:', error);
      throw error;
    }

    return NextResponse.json({
      success: true,
      memories: memories || [],
      count: memories?.length || 0
    });

  } catch (error) {
    console.error('Erro ao buscar memórias:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao buscar memórias' },
      { status: 500 }
    );
  }
}