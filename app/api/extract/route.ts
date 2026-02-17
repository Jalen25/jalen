import { supabase } from '@/lib/supabase';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import Groq from 'groq-sdk';
import OpenAI from 'openai';
import { NextResponse } from 'next/server';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const EXTRACTION_PROMPT = `Você é um assistente que analisa conversas entre humanos e IAs e extrai conhecimento importante.

Analise a conversa abaixo e extraia:

1. IDEIAS: Conceitos novos, propostas, sugestões criativas
2. DECISÕES: Escolhas tomadas, direções definidas
3. INSIGHTS: Aprendizados, realizações, conexões feitas
4. PERGUNTAS EM ABERTO: Questões não respondidas

Para cada item extraído, forneça:
- type: "idea" | "decision" | "insight" | "question"
- content: resumo em 1-3 frases com contexto suficiente
- tags: 2-4 palavras-chave relevantes

Retorne JSON neste formato EXATO:
{
  "extractions": [
    {
      "type": "idea",
      "content": "...",
      "tags": ["tag1", "tag2"]
    }
  ]
}

Extraia apenas o que for genuinamente importante e reutilizável.
Ignore saudações, agradecimentos e conversa casual.
Retorne APENAS o JSON, sem explicações adicionais.`;

// Função para gerar embedding com OpenAI
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

    const body = await req.json();
    const { conversation } = body;

    if (!conversation || conversation.trim().length === 0) {
      return NextResponse.json(
        { error: 'Conversa vazia' },
        { status: 400 }
      );
    }

    // 1. Extrair conhecimento com Groq
    console.log('📊 Extraindo conhecimento...');
    const response = await groq.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: EXTRACTION_PROMPT },
        { role: "user", content: conversation }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" },
    });

    const result = JSON.parse(
      response.choices[0].message.content || '{"extractions":[]}'
    );

    // 2. Salvar conversa
    const { data: conversationData, error: convError } = await supabase
      .from('conversations')
      .insert({
        user_id: user.id,
        raw_text: conversation,
        source: 'manual',
        processed: true
      })
      .select()
      .single();

    if (convError) throw convError;

    // 3. Salvar memórias
    if (result.extractions && result.extractions.length > 0) {
      const memories = result.extractions.map((ext: any) => ({
        conversation_id: conversationData.id,
        user_id: user.id,
        type: ext.type,
        content: ext.content,
        tags: ext.tags || [],
        approved: true
      }));

      const { data: savedMemories, error: memError } = await supabase
        .from('memories')
        .insert(memories)
        .select();

      if (memError) throw memError;

      // 4. Gerar embeddings com OpenAI
      console.log('🧠 Gerando embeddings com OpenAI...');
      
      for (const memory of savedMemories || []) {
        try {
          const textForEmbedding = `${memory.content} ${memory.tags.join(' ')}`;
          const embedding = await generateEmbedding(textForEmbedding);
          
          if (embedding.length > 0) {
            await supabase
              .from('memories')
              .update({ embedding })
              .eq('id', memory.id);
            
            console.log(`✅ Embedding gerado: ${memory.type}`);
          }
        } catch (err) {
          console.error(`❌ Erro ao gerar embedding:`, err);
        }
      }

      console.log(`✅ ${savedMemories?.length} memórias salvas com embeddings`);
    }

    return NextResponse.json({
      success: true,
      data: result,
      saved: true,
      conversation_id: conversationData.id
    });

  } catch (error) {
    console.error('Erro:', error);
    return NextResponse.json(
      { success: false, error: 'Falha ao processar' },
      { status: 500 }
    );
  }
}