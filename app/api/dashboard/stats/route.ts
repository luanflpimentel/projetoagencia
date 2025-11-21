import { NextResponse } from 'next/server';
import { dashboardQueries } from '@/lib/supabase-queries';

export async function GET() {
  try {
    const { data, error } = await dashboardQueries.stats();

    if (error) {
      console.error('Erro ao buscar stats:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar estatísticas' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || {
      total_clientes: 0,
      total_templates: 0,
      clientes_conectados: 0,
      atendimentos_hoje: 0,
    });
  } catch (error) {
    console.error('Erro no endpoint stats:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}