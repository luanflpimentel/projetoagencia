// components/whatsapp/connection-actions.tsx - CORRIGIDO
'use client';

import React, { useState, useCallback } from 'react';
import { Wifi, WifiOff, Settings, Loader2 } from 'lucide-react';
import { QRCodeModal } from './qrcode-modal';
import type { StatusConexao } from '@/lib/types';

interface ConnectionActionsProps {
  instanceName: string;
  statusConexao?: StatusConexao;
  isConnected: boolean;
  onStatusChange?: () => void;
}

export function ConnectionActions({
  instanceName,
  statusConexao = 'desconectado',
  isConnected,
  onStatusChange,
}: ConnectionActionsProps) {
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  console.log('🔌 [ACTIONS] Renderizando com:', {
    instanceName,
    statusConexao,
    isConnected,
  });

  // Handler para conectar COM VERIFICAÇÃO
  const handleConnect = useCallback(async () => {
    console.log('🔌 [ACTIONS] handleConnect chamado');
    console.log('🔌 [ACTIONS] isConnected:', isConnected);
    console.log('🔌 [ACTIONS] statusConexao:', statusConexao);

    // ⚠️ VERIFICAÇÃO CRÍTICA 1: Já conectado?
    if (isConnected || statusConexao === 'conectado') {
      console.warn('⚠️ [ACTIONS] WhatsApp JÁ ESTÁ CONECTADO!');
      alert('⚠️ WhatsApp já está conectado!\n\nUse o botão "Desconectar" primeiro.');
      return;
    }

    // ⚠️ VERIFICAÇÃO CRÍTICA 2: Conectando?
    if (statusConexao === 'connecting') {
      console.warn('⚠️ [ACTIONS] Conexão já em andamento!');
      alert('⏳ Já existe uma conexão em andamento.\n\nAguarde a conclusão...');
      return;
    }

    console.log('✅ [ACTIONS] Validações passaram. Abrindo modal...');
    setIsModalOpen(true);
  }, [isConnected, statusConexao]);

  // Handler para desconectar
  const handleDisconnect = useCallback(async () => {
    console.log('🔌 [ACTIONS] handleDisconnect chamado');

    const confirmDisconnect = window.confirm(
      'Deseja realmente desconectar o WhatsApp?\n\n' +
      'A instância será desconectada e você precisará escanear um novo QR Code para reconectar.'
    );

    if (!confirmDisconnect) {
      console.log('❌ [ACTIONS] Desconexão cancelada pelo usuário');
      return;
    }

    setIsLoading(true);
    console.log('🔌 [ACTIONS] Iniciando desconexão...');

    try {
      const response = await fetch(
        `/api/uazapi/instances/${instanceName}/logout`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao desconectar');
      }

      const data = await response.json();
      console.log('✅ [ACTIONS] Desconectado com sucesso:', data);

      // Atualizar lista
      if (onStatusChange) {
        onStatusChange();
      }

      alert('✅ WhatsApp desconectado com sucesso!');
    } catch (error: any) {
      console.error('❌ [ACTIONS] Erro ao desconectar:', error);
      alert(`❌ Erro ao desconectar:\n\n${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [instanceName, onStatusChange]);

  // Callback quando conectar
  const handleConnected = useCallback(() => {
    console.log('🎉 [ACTIONS] Conexão estabelecida!');
    setIsModalOpen(false);
    
    // Atualizar lista
    if (onStatusChange) {
      onStatusChange();
    }
  }, [onStatusChange]);

  // 🎯 LÓGICA CRÍTICA: Decidir qual botão mostrar
  const shouldShowDisconnect = isConnected || statusConexao === 'conectado';
  const shouldShowConnect = !shouldShowDisconnect && statusConexao !== 'connecting';
  const isConnecting = statusConexao === 'connecting';

  console.log('🎯 [ACTIONS] Decisão de botão:', {
    shouldShowDisconnect,
    shouldShowConnect,
    isConnecting,
  });

  return (
    <>
      <div className="flex gap-2">
        
        {/* ✅ BOTÃO DESCONECTAR (quando conectado) */}
        {shouldShowDisconnect && (
          <button
            onClick={handleDisconnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            title="Desconectar WhatsApp"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Desconectando...
              </>
            ) : (
              <>
                <WifiOff className="w-4 h-4" />
                Desconectar
              </>
            )}
          </button>
        )}

        {/* ⏳ BOTÃO CONECTANDO (estado intermediário) */}
        {isConnecting && (
          <button
            disabled
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500 text-white rounded-lg cursor-not-allowed font-medium"
            title="Conectando..."
          >
            <Loader2 className="w-4 h-4 animate-spin" />
            Conectando...
          </button>
        )}

        {/* ✅ BOTÃO CONECTAR (quando desconectado) */}
        {shouldShowConnect && (
          <button
            onClick={handleConnect}
            disabled={isLoading}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
            title="Conectar WhatsApp"
          >
            <Wifi className="w-4 h-4" />
            Conectar WhatsApp
          </button>
        )}

        {/* Botão Configurar (sempre visível) */}
        <button
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
          onClick={() => {
            console.log('⚙️ [ACTIONS] Configurar clicado');
            alert('⚙️ Configurações em breve!');
          }}
          title="Configurar instância"
        >
          <Settings className="w-4 h-4" />
          Configurar
        </button>
      </div>

      {/* Modal QR Code */}
      {isModalOpen && (
        <QRCodeModal
          isOpen={isModalOpen}
          onClose={() => {
            console.log('🚪 [ACTIONS] Fechando modal');
            setIsModalOpen(false);
          }}
          instanceName={instanceName}
          onConnected={handleConnected}
        />
      )}
    </>
  );
}