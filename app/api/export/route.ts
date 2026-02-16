import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const DEFAULT_USER = 'default-user';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get('format') || 'json';

    // Buscar todas memórias
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .eq('user_id', DEFAULT_USER)
      .order('created_at', { ascending: false });

    if (error) throw error;

    if (format === 'csv') {
      // Gerar CSV
      const headers = ['Tipo', 'Conteúdo', 'Tags', 'Data'];
      const rows = memories?.map(m => [
        m.type,
        `"${m.content.replace(/"/g, '""')}"`,
        m.tags.join(';'),
        new Date(m.created_at).toLocaleString('pt-BR')
      ]);

      const csv = [
        headers.join(','),
        ...(rows?.map(r => r.join(',')) || [])
      ].join('\n');

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="jalen-memorias.csv"'
        }
      });
    }

    // JSON (padrão)
    return new NextResponse(JSON.stringify(memories, null, 2), {
      headers: {
        'Content-Type': 'application/json',
        'Content-Disposition': 'attachment; filename="jalen-memorias.json"'
      }
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao exportar' },
      { status: 500 }
    );
  }
}