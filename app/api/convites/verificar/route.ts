// app/api/convites/verificar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { error: 'Token não fornecido' },
        { status: 400 }
      );
    }

    // Buscar convite
    const { data: convite, error } = await supabaseAdmin
      .from('convites')
      .select(`
        id,
        email,
        nome_completo,
        role,
        telefone,
        expira_em,
        usado,
        clientes:cliente_id (
          nome_cliente,
          nome_instancia
        )
      `)
      .eq('token', token)
      .single();

    if (error || !convite) {
      return NextResponse.json(
        {
          valid: false,
          error: 'Convite não encontrado'
        },
        { status: 404 }
      );
    }

    // Verificar se já foi usado
    if (convite.usado) {
      return NextResponse.json({
        valid: false,
        error: 'Convite já foi utilizado'
      });
    }

    // Verificar se expirou
    if (new Date(convite.expira_em) < new Date()) {
      return NextResponse.json({
        valid: false,
        error: 'Convite expirado'
      });
    }

    return NextResponse.json({
      valid: true,
      convite: {
        email: convite.email,
        nome_completo: convite.nome_completo,
        role: convite.role,
        telefone: convite.telefone,
        expira_em: convite.expira_em,
        cliente: convite.clientes
      }
    });

  } catch (error) {
    console.error('Erro ao verificar convite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
