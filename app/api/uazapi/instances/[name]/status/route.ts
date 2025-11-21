// app/api/uazapi/instances/[name]/status/route.ts - VERSÃO CORRIGIDA

import { NextRequest, NextResponse } from 'next/server';
import { uazapiService } from '@/lib/services/uazapi.service';
import { supabase } from '@/lib/supabase';

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

    // Buscar token do banco
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .select('id, instance_token')
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
        { error: 'Token não encontrado' },
        { status: 404 }
      );
    }

    // Buscar status da UAZAPI
    const statusData = await uazapiService.getStatus(instanceToken);

    console.log('📊 Status bruto da UAZAPI:', JSON.stringify(statusData, null, 2));

    // ✨ EXTRAIR STATUS CORRETAMENTE
    const instanceStatus = statusData.instance?.status || 
                          (typeof statusData.status === 'string' ? statusData.status : '') || 
                          'disconnected';
    
    // ✅ LÓGICA CORRIGIDA: Apenas "connected" é verdadeiramente conectado
    let isConnected = false;
    let jid: string | null = null;
    let isLoggedIn = false;

    // Se status é um objeto (estrutura aninhada)
    if (typeof statusData.status === 'object' && statusData.status !== null) {
      // Verificar se explicitamente conectado
      isConnected = statusData.status.connected === true;
      jid = statusData.status.jid || null;
      isLoggedIn = statusData.status.loggedIn === true;
    }
    
    // ✅ CORREÇÃO: Verificar se o status é EXATAMENTE "connected"
    // Estados possíveis: connected, connecting, disconnected, close
    // Apenas "connected" significa verdadeiramente conectado
    isConnected = isConnected || 
                  statusData.connected === true ||
                  (instanceStatus === 'connected' && statusData.instance?.status === 'connected');
    
    jid = jid || statusData.jid || statusData.instance?.owner || null;
    isLoggedIn = isLoggedIn || statusData.loggedIn === true || statusData.instance?.loggedIn === true;

    // ✅ VALIDAÇÃO ADICIONAL: Se status não é "connected", forçar desconectado
    if (instanceStatus !== 'connected') {
      isConnected = false;
      isLoggedIn = false;
    }

    console.log('✅ Status processado:', {
      instanceStatus,
      isConnected,
      jid,
      isLoggedIn
    });

    // Atualizar status no banco se mudou
    const dbStatus = isConnected ? 'conectado' : 'desconectado';
    
    const { data: currentCliente } = await supabase
      .from('clientes')
      .select('status_conexao')
      .eq('id', cliente.id)
      .single();

    if (currentCliente?.status_conexao !== dbStatus) {
      console.log(`📝 Atualizando banco: ${currentCliente?.status_conexao} → ${dbStatus}`);
      
      await supabase
        .from('clientes')
        .update({
          status_conexao: dbStatus,
          ultima_conexao: isConnected ? new Date().toISOString() : undefined,
          ultima_desconexao: !isConnected ? new Date().toISOString() : undefined,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', cliente.id);
    }

    // ✨ RETORNAR EM FORMATO PADRONIZADO
    return NextResponse.json({
      success: true,
      instanceName: instanceName,
      status: instanceStatus, // connecting, connected, disconnected, etc
      connected: isConnected, // true apenas se status === 'connected'
      loggedIn: isLoggedIn,
      jid: jid,
      profileName: statusData.instance?.profileName || '',
      profilePicUrl: statusData.instance?.profilePicUrl || '',
      phone: statusData.instance?.owner || '',
      instance: statusData.instance, // Manter dados completos para referência
    });

  } catch (error: any) {
    console.error('❌ Erro ao verificar status:', error.message);
    
    return NextResponse.json(
      { 
        error: error.message || 'Erro ao verificar status',
        success: false,
        connected: false,
      },
      { status: 500 }
    );
  }
}