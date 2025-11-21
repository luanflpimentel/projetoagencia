// app/api/clientes/[id]/templates/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientesTemplatesQueries, templatesQueries } from '@/lib/supabase-queries';

// GET - Buscar templates do cliente
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const clienteId = params.id;

    const { data, error } = await templatesQueries.buscarPorCliente(clienteId);

    if (error) {
      console.error('Erro ao buscar templates do cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PUT - Atualizar templates do cliente (substitui todos)
export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const clienteId = params.id;

    const body = await request.json();
    const { template_ids } = body;

    if (!Array.isArray(template_ids)) {
      return NextResponse.json(
        { error: 'template_ids deve ser um array' },
        { status: 400 }
      );
    }

    const { data, error } = await clientesTemplatesQueries.atualizar(
      clienteId,
      template_ids
    );

    if (error) {
      console.error('Erro ao atualizar templates:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Templates atualizados com sucesso',
      data 
    });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}