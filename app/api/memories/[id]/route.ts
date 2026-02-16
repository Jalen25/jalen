import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase';

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ← AWAIT AQUI!
    const supabase = createClient();
    
    const { data: memory, error } = await supabase
      .from('memories')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;

    return NextResponse.json({ success: true, memory });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Memory not found' },
      { status: 404 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params; // ← AWAIT AQUI!
    const supabase = createClient();
    
    const { error } = await supabase
      .from('memories')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: 'Failed to delete memory' },
      { status: 500 }
    );
  }
}