import { supabase } from '@/lib/supabase';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

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
    console.log('🔄 Iniciando regeneração de embeddings com OpenAI...');

    // 1. Buscar todas memórias sem embedding
    const { data: memories, error } = await supabase
      .from('memories')
      .select('*')
      .is('embedding', null);

    if (error) {
      throw error;
    }

    if (!memories || memories.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Todas memórias já têm embeddings!',
        updated: 0
      });
    }

    console.log(`📊 Encontrou ${memories.length} memórias sem embedding`);

    let updated = 0;
    let failed = 0;

    // 2. Gerar embedding para cada uma
    for (const memory of memories) {
      try {
        const textForEmbedding = `${memory.content} ${memory.tags.join(' ')}`;
        const embedding = await generateEmbedding(textForEmbedding);

        if (embedding.length > 0) {
          await supabase
            .from('memories')
            .update({ embedding })
            .eq('id', memory.id);

          updated++;
          console.log(`✅ ${updated}/${memories.length} - ${memory.type}`);
        } else {
          failed++;
          console.log(`❌ Falhou: ${memory.id}`);
        }

        // Delay para não sobrecarregar API (rate limit)
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (err) {
        console.error(`❌ Erro em ${memory.id}:`, err);
        failed++;
      }
    }

    console.log(`✅ Regeneração completa! Atualizadas: ${updated}, Falhadas: ${failed}`);

    return NextResponse.json({
      success: true,
      message: `Embeddings gerados com sucesso!`,
      updated,
      failed,
      total: memories.length
    });

  } catch (error) {
    console.error('Erro na regeneração:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao regenerar embeddings' },
      { status: 500 }
    );
  }
}