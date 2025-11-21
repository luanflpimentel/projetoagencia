// components/whatsapp/qrcode-modal.tsx - Modal QR Code REFATORADO E OTIMIZADO

'use client';

import React, { useEffect, useCallback } from 'react';
import { X, RefreshCw, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { useInstanceConnection } from './hooks/useInstanceConnection';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  onConnected?: () => void;
}

export function QRCodeModal({ 
  isOpen, 
  onClose, 
  instanceName,
  onConnected 
}: QRCodeModalProps) {
  
  const {
    state,
    qrCode,
    countdown,
    error,
    isConnected,
    profileName,
    phoneNumber,
    startConnection,
    resetConnection,
  } = useInstanceConnection({
    instanceName,
    onConnected: (name, phone) => {
      console.log('🎉 [MODAL] Callback onConnected:', { name, phone });
      
      // Aguardar 2 segundos antes de fechar
      setTimeout(() => {
        if (onConnected) {
          onConnected();
        }
        onClose();
        resetConnection();
      }, 2000);
    },
    onError: (errorMsg) => {
      console.error('❌ [MODAL] Callback onError:', errorMsg);
    }
  });

  // ✅ OTIMIZADO: Memorizar handler de fechar
  const handleClose = useCallback(() => {
    onClose();
    resetConnection();
  }, [onClose, resetConnection]);

  // ✅ OTIMIZADO: Iniciar conexão ao abrir modal (sem função intermediária)
  useEffect(() => {
    if (isOpen && state === 'idle') {
      console.log('🚀 [MODAL] Modal aberto, iniciando conexão...');
      startConnection();
    }
  }, [isOpen, state, startConnection]);

  // ✅ OTIMIZADO: Fechar com ESC usando handler memorizado
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && state !== 'connected' && state !== 'connecting') {
        handleClose();
      }
    };
    
    if (isOpen) {
      window.addEventListener('keydown', handleEsc);
      return () => window.removeEventListener('keydown', handleEsc);
    }
  }, [isOpen, state, handleClose]);

  if (!isOpen) return null;

  // Formatar countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-xl font-semibold text-gray-900">
            {state === 'generating' && 'Gerando QR Code'}
            {state === 'waiting' && 'Conectar WhatsApp'}
            {state === 'connecting' && 'Conectando...'}
            {state === 'connected' && 'Conectado!'}
            {state === 'timeout' && 'QR Code Expirado'}
            {state === 'error' && 'Erro na Conexão'}
          </h2>
          
          {/* Botão fechar (apenas se não estiver conectando/conectado) */}
          {state !== 'connecting' && state !== 'connected' && (
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              aria-label="Fechar modal"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-6">
          
          {/* ESTADO: Generating */}
          {state === 'generating' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <Loader2 className="w-12 h-12 animate-spin text-blue-600" />
              <p className="text-gray-600">Preparando QR Code...</p>
            </div>
          )}

          {/* ESTADO: Waiting (Aguardando scan) */}
          {state === 'waiting' && qrCode && (
            <div className="space-y-6">
              {/* QR Code */}
              <div className="flex justify-center bg-white p-4 rounded-lg border-2 border-gray-200">
                <img
                  src={qrCode}
                  alt="QR Code WhatsApp"
                  className="w-64 h-64"
                  loading="eager"
                />
              </div>

              {/* Instruções */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Smartphone className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
                  <div className="space-y-2 text-sm text-gray-700">
                    <p className="font-medium text-blue-900">Como conectar:</p>
                    <ol className="space-y-1 list-decimal list-inside">
                      <li>Abra o WhatsApp no seu celular</li>
                      <li>Toque em <strong>Menu (⋮)</strong> ou <strong>Configurações</strong></li>
                      <li>Toque em <strong>Aparelhos conectados</strong></li>
                      <li>Toque em <strong>Conectar um aparelho</strong></li>
                      <li>Aponte seu celular para esta tela</li>
                    </ol>
                  </div>
                </div>
              </div>

              {/* Countdown */}
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">
                  Expira em: <strong className="text-blue-600 font-mono text-lg">{formatCountdown(countdown)}</strong>
                </span>
                
                {countdown < 30 && (
                  <span className="text-orange-600 text-xs animate-pulse">
                    ⚠️ Tempo acabando
                  </span>
                )}
              </div>
            </div>
          )}

          {/* ESTADO: Connecting (Conectando após scan) */}
          {state === 'connecting' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <Loader2 className="w-16 h-16 animate-spin text-green-600" />
                <CheckCircle className="w-8 h-8 text-green-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
              </div>
              <div className="text-center space-y-2">
                <p className="text-lg font-medium text-gray-900">Conectando...</p>
                <p className="text-sm text-gray-600">Autenticando com WhatsApp</p>
                <p className="text-xs text-gray-500">Isso pode levar até 30 segundos</p>
              </div>
              
              {/* Barra de progresso animada */}
              <div className="w-full max-w-xs bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="bg-green-600 h-full rounded-full animate-pulse" style={{width: '70%'}}></div>
              </div>
            </div>
          )}

          {/* ESTADO: Connected (Sucesso!) */}
          {state === 'connected' && (
            <div className="flex flex-col items-center justify-center py-8 space-y-4">
              <div className="relative">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-10 h-10 text-green-600" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <div className="w-4 h-4 bg-green-500 rounded-full animate-ping"></div>
                  <div className="w-4 h-4 bg-green-500 rounded-full absolute top-0"></div>
                </div>
              </div>
              
              <div className="text-center space-y-2">
                <p className="text-xl font-bold text-green-600">WhatsApp Conectado!</p>
                {profileName && (
                  <p className="text-gray-600">
                    Bem-vindo, <strong>{profileName}</strong>
                  </p>
                )}
                {phoneNumber && (
                  <p className="text-sm text-gray-500 font-mono">{phoneNumber}</p>
                )}
                <p className="text-xs text-gray-400 mt-4">Fechando automaticamente...</p>
              </div>
            </div>
          )}

          {/* ESTADO: Timeout */}
          {state === 'timeout' && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="w-16 h-16 text-orange-500" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-gray-900">QR Code Expirado</p>
                  <p className="text-sm text-gray-600">
                    O QR Code expirou após 2 minutos
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => {
                  resetConnection();
                  startConnection();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                Tentar Novamente
              </button>
            </div>
          )}

          {/* ESTADO: Error */}
          {state === 'error' && error && (
            <div className="space-y-4">
              <div className="flex flex-col items-center justify-center py-8 space-y-4">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <div className="text-center space-y-2">
                  <p className="text-lg font-medium text-gray-900">Erro na Conexão</p>
                  <p className="text-sm text-gray-600">{error.message}</p>
                  {error.type && (
                    <p className="text-xs text-gray-400">Tipo: {error.type}</p>
                  )}
                </div>
              </div>
              
              <div className="flex gap-2">
                <button
                  onClick={handleClose}
                  className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Fechar
                </button>
                <button
                  onClick={() => {
                    resetConnection();
                    startConnection();
                  }}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <RefreshCw className="w-4 h-4" />
                  Tentar Novamente
                </button>
              </div>
            </div>
          )}

        </div>

        {/* Footer com informações de debug (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-6 py-3 bg-gray-50 border-t text-xs text-gray-500 font-mono">
            Estado: {state} | Countdown: {countdown}s | Conectado: {isConnected ? 'Sim' : 'Não'}
          </div>
        )}
      </div>
    </div>
  );
}