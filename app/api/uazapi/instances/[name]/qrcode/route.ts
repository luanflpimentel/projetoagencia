// app/api/uazapi/instances/[name]/qrcode/route.ts - VERSÃO FINAL COMPLETA
import { NextRequest, NextResponse } from 'next/server';
import { uazapiService } from '@/lib/services/uazapi.service';
import { createClient } from '@/lib/supabase-server';
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

    // Criar cliente autenticado
    const supabase = await createClient();

    // Buscar cliente e token
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, nome_cliente, instance_token')
      .eq('nome_instancia', instanceName)
      .single();

    if (clienteError || !cliente) {
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

      // Se travado em connecting, resetar
      if (actualStatus === 'connecting' || actualStatus === 'qrReadWait') {
        console.log('🔄 Instância travada, resetando...');
        
        try {
          await uazapiService.logout(instanceToken);
          console.log('✅ Instância resetada');
          await new Promise(resolve => setTimeout(resolve, 2000));
        } catch (logoutError: any) {
          console.log('⚠️ Erro ao resetar:', logoutError.message);
        }
      }
    } catch (statusError: any) {
      console.log('⚠️ Erro ao verificar status:', statusError.message);
    }

    // Gerar QR Code
    const qrData = await uazapiService.getQRCode(instanceToken);

    console.log('📦 Resposta completa do QR Code:');
    console.log(JSON.stringify(qrData, null, 2));

    // ✨ EXTRAIR QR CODE DA ESTRUTURA CORRETA
    const qrcode = qrData.instance?.qrcode || qrData.qrcode;
    const pairingCode = qrData.instance?.paircode || qrData.pairingCode;

    console.log('🔍 QR Code extraído:', qrcode ? 'SIM (✅)' : 'NÃO (❌)');

    // Verificar se tem QR Code
    if (!qrcode && !pairingCode) {
      console.log('❌ Sem QR Code na resposta');
      
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

    // Atualizar status
    await supabase
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
