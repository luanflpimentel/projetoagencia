// app/api/clientes/[id]/gerar-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { promptQueries, clientesQueries } from '@/lib/supabase-queries';

// POST - Gerar prompt do cliente
export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const clienteId = params.id;

    const body = await request.json();
    const { nome_escritorio, nome_agente } = body;

    // Validação básica
    if (!nome_escritorio || !nome_agente) {
      return NextResponse.json(
        { error: 'nome_escritorio e nome_agente são obrigatórios' },
        { status: 400 }
      );
    }

    // Gerar prompt usando a function do Supabase
    const { data: promptGerado, error: erroGerar } = await promptQueries.gerar(
      clienteId,
      nome_escritorio,
      nome_agente
    );

    if (erroGerar) {
      console.error('Erro ao gerar prompt:', erroGerar);
      return NextResponse.json(
        { error: 'Erro ao gerar prompt' },
        { status: 500 }
      );
    }

    // Atualizar o cliente com o novo prompt
    const { error: erroAtualizar } = await clientesQueries.atualizarPrompt(
      clienteId,
      promptGerado,
      false // prompt_editado_manualmente = false (foi gerado automaticamente)
    );

    if (erroAtualizar) {
      console.error('Erro ao salvar prompt:', erroAtualizar);
      return NextResponse.json(
        { error: 'Erro ao salvar prompt' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      prompt: promptGerado,
      message: 'Prompt gerado com sucesso'
    });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}