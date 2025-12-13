// app/api/uazapi/instances/[name]/reset-status/route.ts
// API para resetar status quando o modal é fechado sem conectar

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';

// Admin client para bypass de RLS
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: instanceName } = await params;

    console.log('🔄 [RESET STATUS] Resetando status para:', instanceName);

    // Buscar cliente usando admin client
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, status_conexao')
      .eq('nome_instancia', instanceName)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ [RESET STATUS] Cliente não encontrado:', clienteError);
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Só resetar se estiver em 'connecting' (não mexer em 'conectado')
    if (cliente.status_conexao === 'connecting') {
      console.log('✅ [RESET STATUS] Resetando status de connecting → desconectado');

      await supabaseAdmin
        .from('clientes')
        .update({
          status_conexao: 'desconectado',
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', cliente.id);
    } else {
      console.log('⏭️ [RESET STATUS] Status já está como:', cliente.status_conexao);
    }

    return NextResponse.json({
      success: true,
      message: 'Status resetado com sucesso',
    });

  } catch (error: any) {
    console.error('❌ [RESET STATUS] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao resetar status', message: error.message },
      { status: 500 }
    );
  }
}
