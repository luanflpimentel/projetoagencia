// app/api/clientes/[id]/chatwoot-retry/route.ts
// Endpoint para retentar provisionamento do Chatwoot em caso de erro

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { chatwootService } from '@/lib/services/chatwoot.service';
import { logsQueries } from '@/lib/queries/logs';

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

    console.log(`🔄 [CHATWOOT-RETRY] Retentativa para cliente: ${clienteId}`);

    // Buscar cliente
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

    // Validar se tem email
    if (!cliente.email) {
      return NextResponse.json(
        { error: 'Email não cadastrado para este cliente' },
        { status: 400 }
      );
    }

    console.log('🚀 [CHATWOOT-RETRY] Iniciando retentativa de provisionamento...');

    try {
      // Atualizar status para 'pending'
      await supabaseAdmin
        .from('clientes')
        .update({
          chatwoot_status: 'pending',
          chatwoot_error_message: null,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', cliente.id);

      // Executar provisionamento completo
      const provisionResult = await chatwootService.provisionComplete(
        cliente.nome_escritorio,
        cliente.email
      );

      if (provisionResult.success) {
        // ✅ Sucesso: Salvar dados no banco
        await supabaseAdmin
          .from('clientes')
          .update({
            chatwoot_account_id: provisionResult.account_id,
            chatwoot_user_id: provisionResult.user_id,
            chatwoot_user_email: provisionResult.user_email,
            chatwoot_user_access_token: provisionResult.user_access_token,
            chatwoot_inbox_id: provisionResult.inbox_id,
            chatwoot_channel_id: provisionResult.channel_id,
            chatwoot_status: 'active',
            chatwoot_provisioned_at: new Date().toISOString(),
            chatwoot_error_message: null,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', cliente.id);

        // Log de sucesso
        await logsQueries.criar({
          cliente_id: cliente.id,
          tipo_evento: 'chatwoot_provisionado',
          descricao: `Chatwoot provisionado com sucesso (retry) para ${cliente.nome_cliente}`,
          detalhes: {
            account_id: provisionResult.account_id,
            inbox_id: provisionResult.inbox_id,
            retry: true,
          },
        });

        console.log('✅ [CHATWOOT-RETRY] Provisionamento concluído com sucesso!');

        return NextResponse.json({
          success: true,
          message: 'Chatwoot provisionado com sucesso!',
          data: {
            account_id: provisionResult.account_id,
            inbox_id: provisionResult.inbox_id,
            user_email: provisionResult.user_email,
          },
        });

      } else {
        // ❌ Erro: Salvar mensagem de erro
        await supabaseAdmin
          .from('clientes')
          .update({
            chatwoot_status: 'error',
            chatwoot_error_message: `${provisionResult.step}: ${provisionResult.error}`,
            atualizado_em: new Date().toISOString(),
          })
          .eq('id', cliente.id);

        // Log de erro
        await logsQueries.criar({
          cliente_id: cliente.id,
          tipo_evento: 'chatwoot_erro',
          descricao: `Erro ao provisionar Chatwoot (retry): ${provisionResult.step}`,
          detalhes: {
            step: provisionResult.step,
            error: provisionResult.error,
            retry: true,
          },
        });

        console.error('❌ [CHATWOOT-RETRY] Falha no provisionamento:', provisionResult);

        return NextResponse.json(
          {
            success: false,
            error: 'Erro ao provisionar Chatwoot',
            message: `${provisionResult.step}: ${provisionResult.error}`,
          },
          { status: 500 }
        );
      }
    } catch (error: any) {
      console.error('❌ [CHATWOOT-RETRY] Erro inesperado:', error);

      // Salvar erro no banco
      await supabaseAdmin
        .from('clientes')
        .update({
          chatwoot_status: 'error',
          chatwoot_error_message: `Erro inesperado: ${error.message}`,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', cliente.id);

      return NextResponse.json(
        {
          success: false,
          error: 'Erro inesperado ao provisionar Chatwoot',
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
