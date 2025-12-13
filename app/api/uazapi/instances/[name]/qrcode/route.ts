// app/api/uazapi/instances/[name]/qrcode/route.ts - VERSÃO FINAL COMPLETA
import { NextRequest, NextResponse } from 'next/server';
import { uazapiService } from '@/lib/services/uazapi.service';
import { createClient } from '@/lib/supabase-server';
import { supabaseAdmin } from '@/lib/supabase-admin';
import { logsQueries } from '@/lib/supabase-queries';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ name: string }> }
) {
  try {
    const params = await context.params;
    const instanceName = params.name;

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

    // Buscar cliente usando supabaseAdmin (bypassa RLS)
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_cliente, instance_token')
      .eq('nome_instancia', instanceName)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ Cliente não encontrado:', { instanceName, error: clienteError });
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    const instanceToken = cliente.instance_token;

    if (!instanceToken) {
      return NextResponse.json(
        { error: 'Token não encontrado. Recrie o cliente.' },
        { status: 404 }
      );
    }

    console.log(`🔄 Gerando QR Code para: ${instanceName}`);
    console.log(`🔑 Token: ${instanceToken.substring(0, 8)}...`);

    // ✨ VERIFICAR STATUS PRIMEIRO
    try {
      const statusData = await uazapiService.getStatus(instanceToken);

      console.log('📊 Status completo da UAZAPI:');
      console.log(JSON.stringify(statusData, null, 2));

      // Extrair status corretamente
      const actualStatus = statusData.instance?.status || statusData.status;
      console.log(`✅ Status extraído: "${actualStatus}"`);

      // ✅ RESET: Se travado OU desconectado, sempre resetar antes de gerar QR
      if (actualStatus === 'connecting' || actualStatus === 'qrReadWait' || actualStatus === 'disconnected') {
        console.log('🔄 Instância precisa ser resetada, forçando logout...');

        try {
          await uazapiService.logout(instanceToken);
          console.log('✅ Logout executado com sucesso');
          await new Promise(resolve => setTimeout(resolve, 3000)); // ✅ Aumentado para 3s
        } catch (logoutError: any) {
          console.log('⚠️ Erro ao fazer logout (ignorando):', logoutError.message);
          // Ignorar erro de logout e tentar gerar QR mesmo assim
        }
      }
    } catch (statusError: any) {
      console.log('⚠️ Erro ao verificar status:', statusError.message);
    }

    // Gerar QR Code (primeira tentativa)
    let qrData = await uazapiService.getQRCode(instanceToken);

    console.log('📦 Resposta completa do QR Code (1ª tentativa):');
    console.log(JSON.stringify(qrData, null, 2));

    // ✨ EXTRAIR QR CODE DA ESTRUTURA CORRETA
    let qrcode = qrData.instance?.qrcode || qrData.qrcode;
    let pairingCode = qrData.instance?.paircode || qrData.pairingCode;

    console.log('🔍 QR Code extraído (1ª tentativa):', qrcode ? 'SIM (✅)' : 'NÃO (❌)');

    // ✅ SEGUNDA TENTATIVA: Se não gerou QR, aguardar e tentar novamente
    if (!qrcode && !pairingCode) {
      console.log('⚠️ Primeira tentativa sem QR Code, aguardando 2s e tentando novamente...');

      await new Promise(resolve => setTimeout(resolve, 2000));

      // Segunda tentativa
      qrData = await uazapiService.getQRCode(instanceToken);

      console.log('📦 Resposta completa do QR Code (2ª tentativa):');
      console.log(JSON.stringify(qrData, null, 2));

      qrcode = qrData.instance?.qrcode || qrData.qrcode;
      pairingCode = qrData.instance?.paircode || qrData.pairingCode;

      console.log('🔍 QR Code extraído (2ª tentativa):', qrcode ? 'SIM (✅)' : 'NÃO (❌)');
    }

    // Verificar se tem QR Code após tentativas
    if (!qrcode && !pairingCode) {
      console.log('❌ Sem QR Code mesmo após 2 tentativas');

      if (qrData.connected) {
        return NextResponse.json(
          { error: 'WhatsApp já está conectado. Desconecte primeiro.' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Aguarde alguns segundos e tente novamente' },
        { status: 409 }
      );
    }

    console.log('✅ QR Code gerado com sucesso!');

    // Atualizar status usando admin client
    await supabaseAdmin
      .from('clientes')
      .update({
        status_conexao: 'connecting',
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', cliente.id);

    // Log
    await logsQueries.criar({
      cliente_id: cliente.id,
      tipo_evento: 'qrcode_gerado',
      descricao: 'QR Code gerado para conexão',
    });

    return NextResponse.json({
      success: true,
      qrcode: qrcode,
      pairingCode: pairingCode,
      instanceName: instanceName,
    });

  } catch (error: any) {
    console.error('❌ Erro ao gerar QR Code:', error.message);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao gerar QR Code' },
      { status: 500 }
    );
  }
}
