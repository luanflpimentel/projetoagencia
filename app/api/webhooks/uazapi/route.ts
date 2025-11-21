// app/api/webhooks/uazapi/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { logsQueries } from '@/lib/supabase-queries';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Log do webhook recebido (útil para debug)
    console.log('Webhook UAZAPI recebido:', {
      event: body.event,
      instanceName: body.instanceName,
      timestamp: new Date().toISOString(),
    });

    // Validar assinatura do webhook (opcional mas recomendado)
    const signature = request.headers.get('x-webhook-signature');
    const expectedSecret = process.env.WEBHOOK_SECRET;

    // Se você configurou validação de assinatura na UAZAPI, descomente:
    // if (signature !== expectedSecret) {
    //   return NextResponse.json(
    //     { error: 'Invalid signature' },
    //     { status: 401 }
    //   );
    // }

    // Processar evento
    const { event, instanceName, data } = body;

    if (!instanceName) {
      return NextResponse.json(
        { error: 'instanceName não fornecido' },
        { status: 400 }
      );
    }

    // Buscar cliente
    const { data: cliente } = await supabase
      .from('clientes')
      .select('id, nome_cliente')
      .eq('nome_instancia', instanceName)
      .single();

    if (!cliente) {
      console.warn(`Cliente não encontrado para instância: ${instanceName}`);
      return NextResponse.json({ received: true });
    }

    // Processar eventos diferentes
    switch (event) {
      case 'connection.update':
        await handleConnectionUpdate(cliente.id, instanceName, data);
        break;

      case 'qr.updated':
        await handleQrUpdated(cliente.id, instanceName, data);
        break;

      case 'messages.upsert':
        await handleNewMessage(cliente.id, instanceName, data);
        break;

      default:
        console.log('Evento desconhecido:', event);
    }

    return NextResponse.json({ 
      received: true,
      event: event,
      instanceName: instanceName,
    });
  } catch (error: any) {
    console.error('Erro ao processar webhook:', error);
    return NextResponse.json(
      { error: 'Erro ao processar webhook' },
      { status: 500 }
    );
  }
}

/**
 * Atualizar status de conexão
 */
async function handleConnectionUpdate(
  clienteId: string,
  instanceName: string,
  data: any
) {
  const statusMap: Record<string, string> = {
    'open': 'conectado',
    'connected': 'conectado',
    'close': 'desconectado',
    'disconnected': 'desconectado',
    'connecting': 'connecting',
  };

  const status = statusMap[data.state] || statusMap[data.status] || 'desconectado';

  const updateData: any = {
    status_conexao: status,
    atualizado_em: new Date().toISOString(),
  };

  if (status === 'conectado') {
    updateData.ultima_conexao = new Date().toISOString();
  } else if (status === 'desconectado') {
    updateData.ultima_desconexao = new Date().toISOString();
  }

  await supabase
    .from('clientes')
    .update(updateData)
    .eq('id', clienteId);

  // Log
  await logsQueries.criar({
    cliente_id: clienteId,
    tipo_evento: status === 'conectado' ? 'conexao' : 'desconexao',
    descricao: `Status alterado para ${status} via webhook`,
  });

  console.log(`[${instanceName}] Status atualizado: ${status}`);
}

/**
 * QR Code foi atualizado
 */
async function handleQrUpdated(
  clienteId: string,
  instanceName: string,
  data: any
) {
  console.log(`[${instanceName}] Novo QR Code gerado`);

  // Opcional: Salvar QR Code no banco para cache
  // Mas normalmente não é necessário pois o QR expira rápido
}

/**
 * Nova mensagem recebida
 */
async function handleNewMessage(
  clienteId: string,
  instanceName: string,
  data: any
) {
  // Aqui você pode:
  // 1. Salvar mensagem no banco
  // 2. Chamar N8N para processar
  // 3. Enviar para fila de processamento

  console.log(`[${instanceName}] Nova mensagem:`, {
    from: data.key?.remoteJid,
    fromMe: data.key?.fromMe,
    messageType: Object.keys(data.message || {})[0],
  });

  // Exemplo: Log no sistema
  await logsQueries.criar({
    cliente_id: clienteId,
    tipo_evento: 'mensagem_recebida',
    descricao: `Mensagem recebida de ${data.key?.remoteJid}`,
  });

  // TODO: Integrar com seu fluxo N8N aqui
  // Por exemplo: fazer POST para webhook do N8N com os dados da mensagem
}