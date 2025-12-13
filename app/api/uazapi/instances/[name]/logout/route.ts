// app/api/uazapi/instances/[name]/logout/route.ts - Desconectar instância

import { NextRequest, NextResponse } from 'next/server';
import { uazapiService } from '@/lib/services/uazapi.service';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logsQueries } from '@/lib/supabase-queries';

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const params = await context.params;
    const instanceName = params.name;

    console.log('🔴 [LOGOUT] Iniciando desconexão:', instanceName);

    if (!instanceName) {
      return NextResponse.json(
        { error: 'Nome da instância não fornecido' },
        { status: 400 }
      );
    }

    // Verificar autenticação
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Buscar cliente e token usando supabaseAdmin (bypassa RLS)
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_cliente, instance_token')
      .eq('nome_instancia', instanceName)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ [LOGOUT] Cliente não encontrado:', clienteError);
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const instanceToken = cliente.instance_token;

    if (!instanceToken) {
      console.error('❌ [LOGOUT] Token não encontrado');
      return NextResponse.json(
        { error: 'Token não encontrado' },
        { status: 404 }
      );
    }

    console.log('🔑 [LOGOUT] Token encontrado:', instanceToken.substring(0, 8) + '...');

    // Desconectar via UAZAPI
    try {
      await uazapiService.logout(instanceToken);
      console.log('✅ [LOGOUT] Desconectado na UAZAPI');
    } catch (apiError: any) {
      console.error('⚠️ [LOGOUT] Erro na API (continuando):', apiError.message);
      // Continuar mesmo com erro na API (pode já estar desconectado)
    }

    // Atualizar status no banco usando admin client
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        status_conexao: 'desconectado',
        ultima_desconexao: new Date().toISOString(),
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cliente.id);

    if (updateError) {
      console.error('⚠️ [LOGOUT] Erro ao atualizar banco:', updateError);
    } else {
      console.log('✅ [LOGOUT] Status atualizado no banco');
    }

    // Registrar log
    try {
      await logsQueries.criar({
        cliente_id: cliente.id,
        tipo_evento: 'desconexao',
        descricao: `WhatsApp desconectado: ${cliente.nome_cliente}`,
      });
      console.log('✅ [LOGOUT] Log registrado');
    } catch (logError) {
      console.error('⚠️ [LOGOUT] Erro ao registrar log:', logError);
    }

    console.log('🎉 [LOGOUT] Desconexão completa!');

    return NextResponse.json({
      success: true,
      message: 'WhatsApp desconectado com sucesso',
      instanceName: instanceName,
    });

  } catch (error: any) {
    console.error('❌ [LOGOUT] Erro geral:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao desconectar WhatsApp' },
      { status: 500 }
    );
  }
}
