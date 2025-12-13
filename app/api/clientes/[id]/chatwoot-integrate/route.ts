// app/api/clientes/[id]/chatwoot-integrate/route.ts
// FASE 2: Integrar Chatwoot com UAZAPI após conectar WhatsApp

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { uazapiService } from '@/lib/services/uazapi.service';

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL!;

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: clienteId } = await params;

    const supabase = await createClient();

    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log(`🚀 [CHATWOOT-UAZAPI] Integrando cliente: ${clienteId}`);

    // Buscar cliente com dados do Chatwoot
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ Cliente não encontrado:', clienteError);
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Validar se Chatwoot foi provisionado (Account + User)
    if (!cliente.chatwoot_account_id || !cliente.chatwoot_user_access_token) {
      console.log('⏭️ [CHATWOOT-UAZAPI] Chatwoot não foi provisionado, pulando integração');
      return NextResponse.json(
        {
          success: false,
          message: 'Chatwoot não foi provisionado para este cliente',
        },
        { status: 200 } // 200 para não travar o fluxo
      );
    }

    // Validar se tem instance_token
    if (!cliente.instance_token) {
      return NextResponse.json(
        { error: 'Instância não possui token' },
        { status: 400 }
      );
    }

    // FASE 2.1: Criar Inbox se ainda não existir
    let inboxId = cliente.chatwoot_inbox_id;
    let channelId = cliente.chatwoot_channel_id;

    if (!inboxId) {
      console.log('📥 [CHATWOOT-UAZAPI] Criando Inbox do Chatwoot...');

      const { chatwootService } = await import('@/lib/services/chatwoot.service');

      const inboxResult = await chatwootService.createInboxOnWhatsAppConnect(
        cliente.chatwoot_account_id,
        cliente.nome_escritorio,
        cliente.chatwoot_user_access_token
      );

      if (inboxResult.success) {
        inboxId = inboxResult.inbox_id!;
        channelId = inboxResult.channel_id!;

        // Salvar no banco
        await supabaseAdmin
          .from('clientes')
          .update({
            chatwoot_inbox_id: inboxId,
            chatwoot_channel_id: channelId,
            chatwoot_status: 'active', // Agora está ativo com inbox criada
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', clienteId);

        console.log('✅ [CHATWOOT-UAZAPI] Inbox criada:', { inboxId, channelId });
      } else {
        console.error('❌ [CHATWOOT-UAZAPI] Erro ao criar Inbox:', inboxResult.error);
        return NextResponse.json(
          {
            error: 'Erro ao criar Inbox do Chatwoot',
            message: inboxResult.error,
          },
          { status: 500 }
        );
      }
    }

    console.log('📋 Dados para integração:', {
      account_id: cliente.chatwoot_account_id,
      inbox_id: inboxId,
      has_token: !!cliente.chatwoot_user_access_token,
      has_instance_token: !!cliente.instance_token,
    });

    // FASE 2.2: Configurar UAZAPI para enviar mensagens ao Chatwoot
    try {
      await uazapiService.configureChatwoot(
        cliente.instance_token,
        {
          url: CHATWOOT_BASE_URL,
          access_token: cliente.chatwoot_user_access_token,
          account_id: cliente.chatwoot_account_id,
          inbox_id: inboxId,
        }
      );

      console.log('✅ [CHATWOOT-UAZAPI] Integração configurada com sucesso!');

      // Log de sucesso
      const { logsQueries } = await import('@/lib/queries/logs');

      await logsQueries.criar({
        cliente_id: clienteId,
        tipo_evento: 'chatwoot_uazapi_integrado',
        descricao: `Chatwoot integrado à UAZAPI para ${cliente.nome_cliente}`,
        detalhes: {
          account_id: cliente.chatwoot_account_id,
          inbox_id: inboxId,
        },
      });

      return NextResponse.json({
        success: true,
        message: 'Chatwoot integrado à UAZAPI com sucesso!',
        integration: {
          account_id: cliente.chatwoot_account_id,
          inbox_id: inboxId,
          chatwoot_url: CHATWOOT_BASE_URL,
        },
      });

    } catch (error: any) {
      console.error('❌ [CHATWOOT-UAZAPI] Erro ao configurar:', error);

      // Log de erro
      const { logsQueries: logsQueriesError } = await import('@/lib/queries/logs');

      await logsQueriesError.criar({
        cliente_id: clienteId,
        tipo_evento: 'chatwoot_erro',
        descricao: `Erro ao integrar Chatwoot à UAZAPI: ${error.message}`,
        detalhes: {
          error: error.message,
          step: 'uazapi_integration',
        },
      });

      return NextResponse.json(
        {
          error: 'Erro ao integrar Chatwoot à UAZAPI',
          message: error.message,
        },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor', message: error.message },
      { status: 500 }
    );
  }
}
