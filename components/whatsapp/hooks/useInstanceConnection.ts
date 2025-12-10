// components/whatsapp/hooks/useInstanceConnection.ts - MELHORADO

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { ConnectionState, ConnectionError } from '@/lib/types';

const QR_CODE_TIMEOUT = 120; // 2 minutos
const CONNECTION_TIMEOUT = 30; // 30 segundos após scan
const POLLING_INTERVAL = 5000; // 5 segundos

interface UseInstanceConnectionProps {
  instanceName: string;
  onConnected?: (profileName?: string, phoneNumber?: string) => void;
  onError?: (error: string) => void;
}

interface ConnectionStatus {
  state: ConnectionState;
  qrCode: string | null;
  countdown: number;
  error: ConnectionError | null;
  isConnected: boolean;
  profileName: string | null;
  phoneNumber: string | null;
}

export function useInstanceConnection({
  instanceName,
  onConnected,
  onError,
}: UseInstanceConnectionProps) {
  
  const [state, setState] = useState<ConnectionState>('idle');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(QR_CODE_TIMEOUT);
  const [error, setError] = useState<ConnectionError | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [profileName, setProfileName] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState<string | null>(null);

  const pollingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const connectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isPageVisible = useRef<boolean>(true);

  // ✅ NOVO: Verificar se já está conectado ANTES de gerar QR Code
  const checkIfAlreadyConnected = useCallback(async (): Promise<boolean> => {
    try {
      console.log('🔍 [HOOK] Verificando se já está conectado...');
      
      const response = await fetch(
        `/api/uazapi/instances/${instanceName}/status`
      );

      if (!response.ok) {
        return false;
      }

      const data = await response.json();
      const instanceStatus = data.instance?.status;
      const statusConnected = data.status?.connected;

      console.log('📊 [HOOK] Status atual:', {
        instanceStatus,
        statusConnected,
      });

      // Se já está conectado, não gerar QR Code
      if (instanceStatus === 'connected' && statusConnected === true) {
        console.log('✅ [HOOK] WhatsApp JÁ ESTÁ CONECTADO!');
        return true;
      }

      return false;
    } catch (error) {
      console.error('❌ [HOOK] Erro ao verificar status:', error);
      return false;
    }
  }, [instanceName]);

  // Limpar todos os timers
  const clearAllTimers = useCallback(() => {
    if (pollingIntervalRef.current) {
      clearInterval(pollingIntervalRef.current);
      pollingIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
    if (connectionTimeoutRef.current) {
      clearTimeout(connectionTimeoutRef.current);
      connectionTimeoutRef.current = null;
    }
  }, []);

  // Gerar QR Code
  const generateQRCode = useCallback(async () => {
    try {
      setState('generating');
      console.log('📱 [HOOK] Gerando QR Code...');

      const response = await fetch(
        `/api/uazapi/instances/${instanceName}/qrcode`
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao gerar QR Code');
      }

      const data = await response.json();
      console.log('✅ [HOOK] QR Code gerado com sucesso!');

      setQrCode(data.qrcode);
      setState('waiting');
      setCountdown(QR_CODE_TIMEOUT);

      return true;
    } catch (error: any) {
      console.error('❌ [HOOK] Erro ao gerar QR Code:', error.message);
      
      setError({
        type: 'api',
        message: error.message,
      });
      setState('error');
      
      if (onError) {
        onError(error.message);
      }

      return false;
    }
  }, [instanceName, onError]);

  // Verificar status da conexão
  const checkConnectionStatus = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/uazapi/instances/${instanceName}/status`
      );

      if (!response.ok) {
        return null;
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('❌ [HOOK] Erro ao verificar status:', error);
      return null;
    }
  }, [instanceName]);

  // Iniciar processo de conexão
  const startConnection = useCallback(async () => {
    console.log('🚀 [HOOK] Iniciando processo de conexão...');

    // ✅ VERIFICAÇÃO ADICIONADA: Checar se já está conectado
    const alreadyConnected = await checkIfAlreadyConnected();
    
    if (alreadyConnected) {
      setError({
        type: 'verification',
        message: 'WhatsApp já está conectado. Desconecte primeiro.',
      });
      setState('error');
      
      if (onError) {
        onError('WhatsApp já está conectado. Desconecte primeiro.');
      }
      
      return;
    }

    // Se não está conectado, gerar QR Code
    const success = await generateQRCode();
    if (!success) return;

    // Iniciar polling
    pollingIntervalRef.current = setInterval(async () => {
      console.log('🔄 [HOOK] Polling status...');
      
      const statusData = await checkConnectionStatus();
      if (!statusData) return;

      const instanceStatus = statusData.instance?.status;
      const statusConnected = statusData.status?.connected;
      const loggedIn = statusData.status?.loggedIn;
      const jid = statusData.status?.jid;

      console.log('📊 [HOOK] Status:', {
        instanceStatus,
        statusConnected,
        loggedIn,
        jid: jid ? 'presente' : 'null',
      });

      // Detectar que usuário escaneou (JID apareceu)
      if (jid && typeof jid === 'string' && jid.length > 0) {
        console.log('📱 [HOOK] QR Code escaneado! Conectando...');
        setState('connecting');
        clearInterval(countdownIntervalRef.current!);

        // Timeout de segurança (30s)
        connectionTimeoutRef.current = setTimeout(() => {
          console.warn('⏰ [HOOK] Timeout de conexão!');
          setError({
            type: 'timeout',
            message: 'Conexão demorou muito. Tente novamente.',
          });
          setState('error');
          clearAllTimers();
        }, CONNECTION_TIMEOUT * 1000);
      }

      // Verificar conexão completa
      if (
        instanceStatus === 'connected' &&
        statusConnected === true &&
        loggedIn === true &&
        jid &&
        typeof jid === 'string'
      ) {
        console.log('🎉 [HOOK] CONEXÃO ESTABELECIDA!');
        
        setIsConnected(true);
        setProfileName(statusData.instance?.profileName || null);
        setPhoneNumber(statusData.instance?.owner || null);
        setState('connected');
        
        clearAllTimers();

        if (onConnected) {
          onConnected(
            statusData.instance?.profileName,
            statusData.instance?.owner
          );
        }
      }
    }, POLLING_INTERVAL);

    // Countdown do QR Code
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          console.warn('⏰ [HOOK] QR Code expirou!');
          setState('timeout');
          clearAllTimers();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

  }, [
    instanceName,
    generateQRCode,
    checkConnectionStatus,
    checkIfAlreadyConnected,
    clearAllTimers,
    onConnected,
    onError,
  ]);

  // Resetar conexão
  const resetConnection = useCallback(() => {
    console.log('🔄 [HOOK] Resetando conexão...');
    
    clearAllTimers();
    setState('idle');
    setQrCode(null);
    setCountdown(QR_CODE_TIMEOUT);
    setError(null);
    setIsConnected(false);
    setProfileName(null);
    setPhoneNumber(null);
  }, [clearAllTimers]);

  // Detectar visibilidade da página para pausar polling
  useEffect(() => {
    const handleVisibilityChange = () => {
      isPageVisible.current = !document.hidden;

      if (document.hidden) {
        // Página ficou inativa - pausar polling para economizar recursos
        console.log('⏸️ [HOOK] Página inativa - pausando polling');
        if (pollingIntervalRef.current) {
          clearInterval(pollingIntervalRef.current);
          pollingIntervalRef.current = null;
        }
      } else if (state === 'waiting' || state === 'connecting') {
        // Página voltou a ficar ativa - retomar polling
        console.log('▶️ [HOOK] Página ativa - retomando polling');

        pollingIntervalRef.current = setInterval(async () => {
          const statusData = await checkConnectionStatus();
          if (!statusData) return;

          const instanceStatus = statusData.instance?.status;
          const statusConnected = statusData.status?.connected;
          const loggedIn = statusData.status?.loggedIn;
          const jid = statusData.status?.jid;

          if (jid && typeof jid === 'string' && jid.length > 0) {
            setState('connecting');
            if (countdownIntervalRef.current) {
              clearInterval(countdownIntervalRef.current);
            }

            connectionTimeoutRef.current = setTimeout(() => {
              setError({
                type: 'timeout',
                message: 'Conexão demorou muito. Tente novamente.',
              });
              setState('error');
              clearAllTimers();
            }, CONNECTION_TIMEOUT * 1000);
          }

          if (
            instanceStatus === 'connected' &&
            statusConnected === true &&
            loggedIn === true &&
            jid &&
            typeof jid === 'string'
          ) {
            setIsConnected(true);
            setProfileName(statusData.instance?.profileName || null);
            setPhoneNumber(statusData.instance?.owner || null);
            setState('connected');

            clearAllTimers();

            if (onConnected) {
              onConnected(
                statusData.instance?.profileName,
                statusData.instance?.owner
              );
            }
          }
        }, POLLING_INTERVAL);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [state, checkConnectionStatus, clearAllTimers, onConnected]);

  // Cleanup ao desmontar
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, [clearAllTimers]);

  return {
    state,
    qrCode,
    countdown,
    error,
    isConnected,
    profileName,
    phoneNumber,
    startConnection,
    resetConnection,
  };
}