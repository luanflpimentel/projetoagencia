// app/api/clientes/sync-all-status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL;
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN;
const DEBUG = process.env.NODE_ENV === 'development';

export async function POST(request: NextRequest) {
  const debugLogs: string[] = [];

  const log = (message: string) => {
    if (DEBUG) debugLogs.push(message);
  };

  try {
    log(`🚀 Sincronização iniciada em ${new Date().toISOString()}`);

    // Buscar todos os clientes usando supabaseAdmin (bypassa RLS)
    const { data: clientes, error: fetchError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_instancia, instance_token, status_conexao, ativo');

    if (fetchError) {
      console.error('Erro ao buscar clientes:', fetchError);
      return NextResponse.json(
        { error: 'Erro ao buscar clientes', debug: DEBUG ? debugLogs : [] },
        { status: 500 }
      );
    }

    log(`✅ ${clientes?.length || 0} cliente(s) encontrado(s)`);

    if (!clientes || clientes.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'Nenhum cliente encontrado',
        updated: 0,
        timestamp: new Date().toISOString(),
        debug: DEBUG ? debugLogs : [],
      });
    }

    let updatedCount = 0;
    const results = [];

    // Verificar status de cada cliente na UAZAPI
    for (const cliente of clientes) {
      log(`🔍 Processando: ${cliente.nome_instancia}`);

      try {
        // Se não tem token, não pode verificar status
        if (!cliente.instance_token) {
          results.push({
            id: cliente.id,
            nome_instancia: cliente.nome_instancia,
            success: false,
            error: 'Token não encontrado',
          });
          continue;
        }

        // Buscar status na UAZAPI
        const response = await fetch(`${UAZAPI_BASE_URL}/instance/status`, {
          method: 'GET',
          headers: {
            'token': cliente.instance_token,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });

        log(`Status HTTP: ${response.status}`);

        if (!response.ok) {
          console.error(`Erro ao verificar ${cliente.nome_instancia}:`, response.statusText);
          results.push({
            id: cliente.id,
            nome_instancia: cliente.nome_instancia,
            success: false,
            error: `Falha na API: ${response.status}`,
          });
          continue;
        }

        const data = await response.json();

        // Mapear o status da UAZAPI para o formato do banco
        let novoStatus: 'conectado' | 'desconectado' | 'connecting';

        // ✅ CORREÇÃO: Extrair JID corretamente
        const jid = data.jid || data.status?.jid || data.instance?.jid;
        const hasValidJid = jid && typeof jid === 'string' && jid !== 'null' && jid.length > 0;

        // ✅ CORREÇÃO: Só considerar conectado se tiver JID válido
        const isConnected =
          hasValidJid && (
            data.connected === true ||
            data.loggedIn === true ||
            data.instance?.status === 'connected' ||
            data.instance?.loggedIn === true ||
            data.status?.connected === true ||
            data.state === 'connected'
          );

        const isConnecting =
          data.state === 'qrReadWait' ||
          data.state === 'connecting' ||
          data.instance?.status === 'qrReadWait' ||
          data.instance?.status === 'connecting';

        if (isConnected) {
          novoStatus = 'conectado';
        } else if (isConnecting) {
          novoStatus = 'connecting';
        } else {
          novoStatus = 'desconectado';
        }

        log(`${cliente.nome_instancia}: ${cliente.status_conexao} → ${novoStatus}`);

        // Atualizar apenas se o status mudou
        if (novoStatus !== cliente.status_conexao) {
          const { error: updateError } = await supabaseAdmin
            .from('clientes')
            .update({
              status_conexao: novoStatus,
              ultima_conexao: new Date().toISOString(),
            })
            .eq('id', cliente.id);

          if (updateError) {
            console.error(`Erro ao atualizar ${cliente.id}:`, updateError);
            results.push({
              id: cliente.id,
              nome_instancia: cliente.nome_instancia,
              success: false,
              error: 'Erro ao atualizar banco',
            });
          } else {
            updatedCount++;
            results.push({
              id: cliente.id,
              nome_instancia: cliente.nome_instancia,
              success: true,
              status_anterior: cliente.status_conexao,
              status_novo: novoStatus,
            });
          }
        } else {
          results.push({
            id: cliente.id,
            nome_instancia: cliente.nome_instancia,
            success: true,
            status: novoStatus,
            unchanged: true,
          });
        }
      } catch (error: any) {
        console.error(`Erro ao processar ${cliente.nome_instancia}:`, error);
        results.push({
          id: cliente.id,
          nome_instancia: cliente.nome_instancia,
          success: false,
          error: `Exceção: ${error.message}`,
        });
      }
    }

    log(`Sincronização concluída: ${updatedCount}/${clientes.length} atualizados`);

    return NextResponse.json({
      success: true,
      message: `Sincronização concluída. ${updatedCount} cliente(s) atualizado(s).`,
      total: clientes.length,
      updated: updatedCount,
      timestamp: new Date().toISOString(),
      debug: DEBUG ? debugLogs : [],
      results,
    });
  } catch (error: any) {
    console.error('Erro ao sincronizar status:', error);
    return NextResponse.json(
      {
        error: 'Erro ao sincronizar status',
        details: error.message,
        debug: DEBUG ? debugLogs : [],
      },
      { status: 500 }
    );
  }
}
