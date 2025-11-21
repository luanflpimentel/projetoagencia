// lib/services/connection-verifier.ts - Verificador robusto de conexão

import { UazapiStatusResponse, VerificationResult, ConnectionCriteria } from '@/lib/types';

/**
 * Verifica se a conexão é REAL baseado em 4 critérios obrigatórios
 * 
 * CRITÉRIOS (todos devem ser TRUE):
 * 1. instance.status === "connected"
 * 2. status.connected === true
 * 3. status.loggedIn === true
 * 4. status.jid válido (string não vazia)
 * 
 * @param statusData - Resposta da API /instance/status
 * @returns Resultado da verificação com detalhes
 */
export function verifyRealConnection(statusData: UazapiStatusResponse): VerificationResult {
  console.log('🔍 [VERIFICADOR] Iniciando verificação de conexão...');
  console.log('📦 [VERIFICADOR] Dados recebidos:', JSON.stringify(statusData, null, 2));

  // Critério 1: Status da instância
  const instanceStatusConnected = statusData.instance?.status === 'connected';
  console.log(`✓ [VERIFICADOR] Critério 1 - instance.status === "connected": ${instanceStatusConnected}`);

  // Critério 2: Status.connected
  const statusConnected = statusData.status?.connected === true;
  console.log(`✓ [VERIFICADOR] Critério 2 - status.connected === true: ${statusConnected}`);

  // Critério 3: Status.loggedIn
  const loggedIn = statusData.status?.loggedIn === true;
  console.log(`✓ [VERIFICADOR] Critério 3 - status.loggedIn === true: ${loggedIn}`);

  // Critério 4: JID válido
  const jid = statusData.status?.jid;
  const hasValidJid = 
    jid !== null && 
    jid !== undefined &&
    typeof jid === 'string' && 
    jid.length > 0 &&
    jid.includes('@');
  
  console.log(`✓ [VERIFICADOR] Critério 4 - JID válido: ${hasValidJid}`);
  console.log(`  └─ JID recebido: ${JSON.stringify(jid)}`);

  // Construir objeto de critérios
  const criteria: ConnectionCriteria = {
    instanceStatusConnected,
    statusConnected,
    loggedIn,
    hasValidJid
  };

  // TODOS devem ser verdadeiros
  const isConnected = 
    instanceStatusConnected && 
    statusConnected && 
    loggedIn && 
    hasValidJid;

  console.log('📊 [VERIFICADOR] Resumo dos critérios:', criteria);
  console.log(`🎯 [VERIFICADOR] Resultado final: ${isConnected ? '✅ CONECTADO' : '❌ NÃO CONECTADO'}`);

  // ✅ CORREÇÃO: Usar ?? undefined em vez de || null
  const profileName = statusData.instance?.profileName ?? undefined;
  const phoneNumber = statusData.instance?.owner ?? undefined;

  if (isConnected) {
    console.log('🎉 [VERIFICADOR] Conexão VERIFICADA com sucesso!');
    console.log(`👤 [VERIFICADOR] Perfil: ${profileName}`);
    console.log(`📱 [VERIFICADOR] Telefone: ${phoneNumber}`);
  } else {
    console.warn('⚠️ [VERIFICADOR] Conexão NÃO verificada');
    const falhasCount = Object.values(criteria).filter(v => !v).length;
    console.warn(`❌ [VERIFICADOR] ${falhasCount} de 4 critérios falharam`);
  }

  return {
    isConnected,
    criteria,
    profileName,
    phoneNumber
  };
}

/**
 * Verifica se o JID foi detectado (usuário escaneou QR)
 * Isso indica transição de "waiting" para "connecting"
 */
export function hasJidDetected(statusData: UazapiStatusResponse): boolean {
  const jid = statusData.status?.jid;
  const detected = jid !== null && jid !== undefined && jid !== '';
  
  if (detected) {
    console.log('📱 [VERIFICADOR] JID DETECTADO - Usuário escaneou QR Code!');
    console.log(`  └─ JID: ${jid}`);
  }
  
  return detected;
}

/**
 * Extrai informações de perfil da resposta
 */
export function extractProfileInfo(statusData: UazapiStatusResponse) {
  return {
    profileName: statusData.instance?.profileName ?? undefined,
    profilePicUrl: statusData.instance?.profilePicUrl ?? undefined,
    phoneNumber: statusData.instance?.owner ?? undefined,
    isBusiness: statusData.instance?.isBusiness ?? false,
    platform: statusData.instance?.plataform ?? 'unknown'
  };
}