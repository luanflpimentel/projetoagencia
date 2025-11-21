import { NextResponse } from 'next/server';
import { templatesQueries } from '@/lib/supabase-queries';

// GET - Listar todos os templates
export async function GET() {
  try {
    const { data, error } = await templatesQueries.listar();

    if (error) {
      console.error('Erro ao buscar templates:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar templates' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error('Erro no endpoint templates:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo template
export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { data, error } = await templatesQueries.criar(body);

    if (error) {
      console.error('Erro ao criar template:', error);
      return NextResponse.json(
        { error: 'Erro ao criar template' },
        { status: 500 }
      );
    }

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Erro no endpoint criar template:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}