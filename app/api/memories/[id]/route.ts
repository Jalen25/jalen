import { supabase } from '@/lib/supabase';
import { NextResponse } from 'next/server';

const DEFAULT_USER = 'default-user';

// GET - Buscar uma memória específica
export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { data: memory, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Memória não encontrada' },
      { status: 404 }
    );
  }
}

// PATCH - Atualizar memória
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { content, tags, type } = body;

    const updates: any = {};
    if (content) updates.content = content;
    if (tags) updates.tags = tags;
    if (type) updates.type = type;

    const { data: memory, error } = await supabase
      .from('memories')
      .update(updates)
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER)
      .select()
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao atualizar' },
      { status: 500 }
    );
  }
}

// DELETE - Deletar memória
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', params.id)
      .eq('user_id', DEFAULT_USER);

    if (error) throw error;

    return NextResponse.json({ 
      success: true, 
      message: 'Memória deletada' 
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Falha ao deletar' },
      { status: 500 }
    );
  }
}