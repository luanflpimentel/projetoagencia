// app/api/uazapi/instances/[name]/get-qrcode/route.ts
// API para BUSCAR QR Code existente SEM resetar a instância

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { uazapiService } from '@/lib/services/uazapi.service';

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

    // Buscar cliente
    const supabase = await createClient();
    const { data: cliente, error: clienteError } = await supabase
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
        { error: 'Token não encontrado' },
        { status: 404 }
      );
    }

    console.log(`📱 [GET QRCODE] Buscando QR Code existente para: ${instanceName}`);

    // ✅ IMPORTANTE: Apenas buscar o QR Code existente, SEM resetar
    const qrData = await uazapiService.getQRCode(instanceToken);

    console.log('📦 [GET QRCODE] Resposta da UAZAPI:');
    console.log(JSON.stringify(qrData, null, 2));

    // Extrair QR Code
    const qrcode = qrData.instance?.qrcode || qrData.qrcode;
    const pairingCode = qrData.instance?.paircode || qrData.pairingCode;

    console.log('🔍 [GET QRCODE] QR Code extraído:', qrcode ? 'SIM (✅)' : 'NÃO (❌)');

    // Se não tiver QR Code, retornar null (não é erro)
    if (!qrcode && !pairingCode) {
      console.log('⚠️ [GET QRCODE] QR Code não disponível no momento');
      return NextResponse.json({
        success: false,
        qrcode: null,
        message: 'QR Code não disponível. Clique em "Conectar WhatsApp" para gerar um novo.',
      });
    }

    return NextResponse.json({
      success: true,
      qrcode: qrcode,
      pairingCode: pairingCode,
      instanceName: instanceName,
    });

  } catch (error: any) {
    console.error('❌ [GET QRCODE] Erro:', error.message);

    return NextResponse.json(
      { error: error.message || 'Erro ao buscar QR Code' },
      { status: 500 }
    );
  }
}
