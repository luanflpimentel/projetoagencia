// app/api/clientes/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { clientesQueries } from '@/lib/supabase-queries';

// GET - Listar todos os clientes ativos
export async function GET() {
  try {
    const { data, error } = await clientesQueries.listar();

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
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

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validação básica
    if (!body.nome_cliente || !body.nome_instancia || !body.nome_escritorio) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome_cliente, nome_instancia, nome_escritorio' },
        { status: 400 }
      );
    }

    // Normalizar nome_instancia (lowercase, sem espaços)
    const nomeInstanciaNormalizado = body.nome_instancia
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Validar se nome_instancia é válido
    if (!/^[a-z0-9-]+$/.test(nomeInstanciaNormalizado)) {
      return NextResponse.json(
        { error: 'Nome da instância inválido. Use apenas letras minúsculas, números e hífens.' },
        { status: 400 }
      );
    }

    const dadosCliente = {
      nome_cliente: body.nome_cliente,
      nome_instancia: nomeInstanciaNormalizado,
      numero_whatsapp: body.numero_whatsapp || null,
      email: body.email || null,
      nome_escritorio: body.nome_escritorio,
      nome_agente: body.nome_agente || 'Julia',
      template_ids: body.template_ids || [],
    };

    const { data, error } = await clientesQueries.criar(dadosCliente);

    if (error) {
      console.error('Erro ao criar cliente:', error);
      
      // Verificar se é erro de duplicação
      if (error.message?.includes('duplicate key') || error.code === '23505') {
        return NextResponse.json(
          { error: 'Já existe um cliente com este nome de instância' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao criar cliente' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}