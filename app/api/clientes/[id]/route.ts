// app/api/clientes/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientesQueries } from '@/lib/supabase-queries';

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    const { data, error } = await clientesQueries.buscarPorId(id);

    if (error) {
      console.error('Erro ao buscar cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar cliente' },
        { status: 500 }
      );
    }

    if (!data) {
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar cliente
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    const body = await request.json();

    // Se estiver tentando atualizar nome_instancia, normalizar
    if (body.nome_instancia) {
      body.nome_instancia = body.nome_instancia
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Validar formato
      if (!/^[a-z0-9-]+$/.test(body.nome_instancia)) {
        return NextResponse.json(
          { error: 'Nome da instância inválido' },
          { status: 400 }
        );
      }
    }

    const { data, error } = await clientesQueries.atualizar(id, body);

    if (error) {
      console.error('Erro ao atualizar cliente:', error);

      // Verificar se é erro de duplicação de nome_instancia
      const isDuplicateError = 
        error.message?.includes('duplicate key') || 
        ('code' in error && error.code === '23505');

      if (isDuplicateError) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este nome de instância' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao atualizar cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    const { data, error } = await clientesQueries.desativar(id);

    if (error) {
      console.error('Erro ao desativar cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: 'Cliente desativado com sucesso', data },
      { status: 200 }
    );
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}