// app/api/clientes/[id]/toggle-ia/route.ts
// API para ativar/desativar IA do cliente

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clienteId } = await params;
    const { ia_ativa } = await request.json();

    if (typeof ia_ativa !== 'boolean') {
      return NextResponse.json(
        { error: 'Campo ia_ativa deve ser boolean' },
        { status: 400 }
      );
    }

    console.log(`🤖 [TOGGLE IA] Cliente ${clienteId}: ${ia_ativa ? 'ATIVANDO' : 'DESATIVANDO'} IA`);

    const supabase = await createClient();

    // Atualizar status da IA
    const { data: cliente, error: updateError } = await supabase
      .from('clientes')
      .update({
        ia_ativa,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', clienteId)
      .select('nome_cliente, ia_ativa')
      .single();

    if (updateError) {
      console.error('❌ [TOGGLE IA] Erro ao atualizar:', updateError);
      return NextResponse.json(
        { error: 'Erro ao atualizar status da IA' },
        { status: 500 }
      );
    }

    // Registrar log
    await supabase.from('logs_sistema').insert({
      tipo_evento: 'ia_ativada_desativada',
      descricao: `IA ${ia_ativa ? 'ativada' : 'desativada'} para ${cliente.nome_cliente}`,
      cliente_id: clienteId,
      detalhes: { ia_ativa },
    });

    console.log(`✅ [TOGGLE IA] IA ${ia_ativa ? 'ativada' : 'desativada'} com sucesso`);

    return NextResponse.json({
      success: true,
      ia_ativa: cliente.ia_ativa,
      message: `IA ${ia_ativa ? 'ativada' : 'desativada'} com sucesso`
    });

  } catch (error: any) {
    console.error('❌ [TOGGLE IA] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao alterar status da IA', message: error.message },
      { status: 500 }
    );
  }
}
