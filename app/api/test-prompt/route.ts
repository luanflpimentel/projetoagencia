// app/api/test-prompt/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';

// Forçar rota dinâmica (não gerar no build)
export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: NextRequest) {
  try {
    const { clienteId, mensagem } = await request.json();

    // Validações
    if (!clienteId || !mensagem) {
      return NextResponse.json(
        { error: 'clienteId e mensagem são obrigatórios' },
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

    // Buscar cliente no banco usando supabaseAdmin (bypassa RLS)
    const { data: cliente, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', clienteId)
      .single();

    if (error || !cliente) {
      console.error('❌ Cliente não encontrado:', { clienteId, error });
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    console.log('🔄 Enviando mensagem para N8N webhook...');

    // Chamar webhook do N8N
    const webhookUrl = 'https://webhook.zeyno.dev.br/webhook/testador';

    const webhookPayload = {
      message: mensagem,
      systemPrompt: cliente.prompt_sistema,
      clientId: clienteId,
      clientName: cliente.nome_cliente,
      agentName: cliente.nome_agente,
      instanceName: cliente.nome_instancia,
    };

    console.log('📤 Payload enviado:', webhookPayload);

    const startTime = Date.now();

    try {
      const webhookResponse = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(webhookPayload),
        signal: AbortSignal.timeout(30000), // 30 segundos timeout
      });

      const endTime = Date.now();
      const responseTime = endTime - startTime;

      if (!webhookResponse.ok) {
        const errorText = await webhookResponse.text();
        console.error('❌ Erro no webhook N8N:', {
          status: webhookResponse.status,
          statusText: webhookResponse.statusText,
          error: errorText,
        });

        return NextResponse.json(
          { error: `Erro no webhook: ${webhookResponse.status} - ${errorText}` },
          { status: 500 }
        );
      }

      const webhookData = await webhookResponse.json();
      console.log('✅ Resposta do N8N recebida:', webhookData);

      const resposta = webhookData.output || webhookData.response || 'Sem resposta';

      return NextResponse.json({
        success: true,
        resposta,
        metadata: {
          modelo: 'n8n-webhook',
          tempo_ms: responseTime,
          clienteNome: cliente.nome_cliente,
          agenteNome: cliente.nome_agente,
        },
      });

    } catch (fetchError: any) {
      const endTime = Date.now();
      const responseTime = endTime - startTime;

      console.error('❌ Erro ao chamar webhook N8N:', {
        error: fetchError.message,
        tempo_ms: responseTime,
      });

      // Verificar se foi timeout
      if (fetchError.name === 'AbortError' || fetchError.name === 'TimeoutError') {
        return NextResponse.json(
          { error: 'Timeout: O webhook demorou mais de 30 segundos para responder' },
          { status: 504 }
        );
      }

      return NextResponse.json(
        { error: `Erro ao conectar com webhook: ${fetchError.message}` },
        { status: 500 }
      );
    }

  } catch (error: any) {
    console.error('❌ Erro ao processar teste:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao processar teste' },
      { status: 500 }
    );
  }
}