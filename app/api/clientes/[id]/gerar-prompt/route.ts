// app/api/clientes/[id]/gerar-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promptQueries } from '@/lib/supabase-queries';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Verificar se estamos em build time (variáveis não disponíveis)
const isBuildTime = !process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// POST - Gerar prompt do cliente
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  // Durante o build, retornar uma resposta vazia para evitar erros
  if (isBuildTime) {
    return NextResponse.json(
      { error: 'Endpoint não disponível durante o build' },
      { status: 503 }
    );
  }

  try {
    const params = await context.params;
    const clienteId = params.id;

    console.log('🔄 Gerando prompt para cliente:', clienteId);

    const body = await request.json();
    const { nome_escritorio, nome_agente } = body;

    console.log('📝 Dados recebidos:', { nome_escritorio, nome_agente });

    // Validação básica
    if (!nome_escritorio || !nome_agente) {
      console.error('❌ Validação falhou: campos obrigatórios ausentes');
      return NextResponse.json(
        { error: 'nome_escritorio e nome_agente são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar prompt usando a function do Supabase
    console.log('🚀 Chamando promptQueries.gerar...');
    const { data: promptGerado, error: erroGerar } = await promptQueries.gerar(
      clienteId,
      nome_escritorio,
      nome_agente
    );

    if (erroGerar) {
      console.error('❌ Erro ao gerar prompt:', {
        message: erroGerar.message,
        details: erroGerar.details,
        hint: erroGerar.hint,
        code: erroGerar.code
      });
      return NextResponse.json(
        { error: `Erro ao gerar prompt: ${erroGerar.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Prompt gerado com sucesso');

    // Atualizar o cliente com o novo prompt usando supabaseAdmin (bypassa RLS)
    console.log('💾 Salvando prompt no banco de dados...');
    const { error: erroAtualizar } = await supabaseAdmin
      .from('clientes')
      .update({
        prompt_sistema: promptGerado,
        prompt_editado_manualmente: false,
        ultima_regeneracao: new Date().toISOString(),
      })
      .eq('id', clienteId);

    if (erroAtualizar) {
      console.error('❌ Erro ao salvar prompt:', {
        message: erroAtualizar.message,
        details: erroAtualizar.details,
        hint: erroAtualizar.hint,
        code: erroAtualizar.code
      });
      return NextResponse.json(
        { error: `Erro ao salvar prompt: ${erroAtualizar.message}` },
        { status: 500 }
      );
    }

    console.log('✅ Prompt salvo com sucesso!');

    return NextResponse.json({
      success: true,
      prompt: promptGerado,
      message: 'Prompt gerado com sucesso'
    });
  } catch (error) {
    console.error('❌ Erro no servidor:', error);
    return NextResponse.json(
      { error: `Erro interno do servidor: ${error instanceof Error ? error.message : 'Erro desconhecido'}` },
      { status: 500 }
    );
  }
}