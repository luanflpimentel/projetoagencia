// app/api/clientes/diagnostic/route.ts
// Endpoint de diagnóstico para verificar o schema da tabela clientes

import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    // Tentar buscar um cliente com apenas colunas básicas
    const { data: clienteBasico, error: basicError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_cliente, nome_instancia')
      .limit(1)
      .single();

    // Tentar buscar com colunas do Chatwoot
    const { data: clienteChatwoot, error: chatwootError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_cliente, chatwoot_status, chatwoot_account_id')
      .limit(1)
      .single();

    // Tentar buscar tudo
    const { data: clienteCompleto, error: completoError } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .limit(1)
      .single();

    // Tentar buscar todos os clientes (como faz o GET /api/clientes)
    const { data: todosClientes, error: todosError } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .order('criado_em', { ascending: false });

    return NextResponse.json({
      success: true,
      diagnostics: {
        basicQuery: {
          success: !basicError,
          data: clienteBasico || null,
          error: basicError?.message || null,
        },
        chatwootQuery: {
          success: !chatwootError,
          data: clienteChatwoot || null,
          error: chatwootError?.message || null,
        },
        fullQuerySingle: {
          success: !completoError,
          data: clienteCompleto || null,
          error: completoError?.message || null,
        },
        fullQueryAll: {
          success: !todosError,
          count: todosClientes?.length || 0,
          error: todosError?.message || null,
          sample: todosClientes?.[0] || null,
        },
      },
    });
  } catch (error: any) {
    console.error('Erro no diagnóstico:', error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
