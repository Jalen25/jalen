import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const DEFAULT_USER = 'default-user';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const limit = parseInt(searchParams.get('limit') || '50');

    let query = supabase
      .from('memories')
      .select('*')
      .eq('user_id', DEFAULT_USER)
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