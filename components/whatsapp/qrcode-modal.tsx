// components/whatsapp/qrcode-modal.tsx - Modal QR Code com Dialog Shadcn

'use client';

import React, { useEffect, useCallback } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, Loader2, Smartphone } from 'lucide-react';
import { useInstanceConnection } from './hooks/useInstanceConnection';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface QRCodeModalProps {
  isOpen: boolean;
  onClose: () => void;
  instanceName: string;
  onConnected?: () => void;
}

const QRCodeModalComponent = ({
  isOpen,
  onClose,
  instanceName,
  onConnected
}: QRCodeModalProps) => {

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

  // Handler de fechar
  const handleClose = useCallback(() => {
    // Só permite fechar se não estiver connecting ou connected
    if (state !== 'connecting' && state !== 'connected') {
      onClose();
      resetConnection();
    }
  }, [state, onClose, resetConnection]);

  // Iniciar conexão ao abrir modal
  const hasStartedRef = React.useRef(false);

  useEffect(() => {
    if (isOpen && state === 'idle' && !hasStartedRef.current) {
      console.log('🚀 [MODAL] Modal aberto, iniciando conexão...');
      hasStartedRef.current = true;
      startConnection();
    }

    // Reset quando fechar
    if (!isOpen) {
      hasStartedRef.current = false;
    }
  }, [isOpen, state, startConnection]);

  // Fechar com ESC
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

  // Formatar countdown
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Título do modal baseado no estado
  const getTitle = () => {
    switch (state) {
      case 'generating':
        return 'Gerando QR Code';
      case 'waiting':
        return 'Conectar WhatsApp';
      case 'connecting':
        return 'Conectando...';
      case 'connected':
        return 'Conectado!';
      case 'timeout':
        return 'QR Code Expirado';
      case 'error':
        return 'Erro na Conexão';
      default:
        return 'WhatsApp';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={state !== 'connecting' && state !== 'connected'}
      >
        <DialogHeader>
          <DialogTitle className="text-xl">{getTitle()}</DialogTitle>
          <DialogDescription className={state === 'waiting' ? '' : 'sr-only'}>
            {state === 'waiting'
              ? 'Escaneie o QR Code com seu WhatsApp para conectar'
              : getTitle()
            }
          </DialogDescription>
        </DialogHeader>

        <div className="py-4">

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

              <Button
                onClick={() => {
                  resetConnection();
                  startConnection();
                }}
                className="w-full"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Tentar Novamente
              </Button>
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
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Fechar
                </Button>
                <Button
                  onClick={() => {
                    resetConnection();
                    startConnection();
                  }}
                  className="flex-1"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Tentar Novamente
                </Button>
              </div>
            </div>
          )}

        </div>

        {/* Footer com informações de debug (apenas em desenvolvimento) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="px-6 py-3 bg-gray-50 border-t rounded-b-lg text-xs text-gray-500 font-mono -mx-6 -mb-6">
            Estado: {state} | Countdown: {countdown}s | Conectado: {isConnected ? 'Sim' : 'Não'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// Exportar componente memoizado para evitar re-renderizações desnecessárias
export const QRCodeModal = React.memo(QRCodeModalComponent);
