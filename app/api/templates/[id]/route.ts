import { NextResponse } from 'next/server';
import { templatesQueries } from '@/lib/supabase-queries';

// GET - Buscar template por ID
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params; // ← FIX: await aqui
    
    const { data, error } = await templatesQueries.buscarPorId(params.id);

    if (error) {
      console.error('Erro ao buscar template:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar template' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Template não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no endpoint buscar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar template
export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params; // ← FIX: await aqui
    const body = await request.json();

    const { data, error } = await templatesQueries.atualizar(params.id, body);

    if (error) {
      console.error('Erro ao atualizar template:', error);
      return NextResponse.json(
        { error: 'Erro ao atualizar template' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no endpoint atualizar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar template (soft delete)
export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params; // ← FIX: await aqui
    
    const { data, error } = await templatesQueries.desativar(params.id);

    if (error) {
      console.error('Erro ao desativar template:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar template' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no endpoint desativar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}