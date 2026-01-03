// components/whatsapp/connection-actions.tsx - CORRIGIDO
'use client';

import { useState, useCallback } from 'react';
import { Wifi, WifiOff, Loader2, AlertTriangle } from 'lucide-react';
import { QRCodeModal } from './qrcode-modal';
import { useToast } from '@/components/ui/toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
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
  const [isDisconnectModalOpen, setIsDisconnectModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Handler para conectar COM VERIFICAÇÃO
  const handleConnect = useCallback(async () => {
    // ⚠️ VERIFICAÇÃO CRÍTICA 1: Já conectado?
    if (isConnected || statusConexao === 'conectado') {
      toast.warning('WhatsApp já está conectado! Use o botão "Desconectar" primeiro.');
      return;
    }

    // ⚠️ VERIFICAÇÃO CRÍTICA 2: Conectando?
    if (statusConexao === 'connecting') {
      toast.info('Já existe uma conexão em andamento. Aguarde a conclusão...');
      return;
    }

    setIsModalOpen(true);
  }, [isConnected, statusConexao, toast]);

  // Handler para abrir modal de confirmação de desconexão
  const handleDisconnectClick = useCallback(() => {
    setIsDisconnectModalOpen(true);
  }, []);

  // Handler para confirmar desconexão
  const handleConfirmDisconnect = useCallback(async () => {
    setIsDisconnectModalOpen(false);
    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/uazapi/instances/${instanceName}/logout`,
        { method: 'DELETE' }
      );

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Erro ao desconectar');
      }

      // Atualizar lista
      if (onStatusChange) {
        onStatusChange();
      }

      toast.success('WhatsApp desconectado com sucesso!');
    } catch (error: any) {
      console.error('Erro ao desconectar:', error);
      toast.error(`Erro ao desconectar: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }, [instanceName, onStatusChange, toast]);

  // Callback quando conectar
  const handleConnected = useCallback(() => {
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

  return (
    <>
      <div className="flex gap-2">
        
        {/* ✅ BOTÃO DESCONECTAR (quando conectado) */}
        {shouldShowDisconnect && (
          <button
            onClick={handleDisconnectClick}
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
      </div>

      {/* Modal QR Code */}
      {isModalOpen && (
        <QRCodeModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          instanceName={instanceName}
          onConnected={handleConnected}
        />
      )}

      {/* Modal de Confirmação de Desconexão */}
      <Dialog open={isDisconnectModalOpen} onOpenChange={setIsDisconnectModalOpen}>
        <DialogContent>
          <DialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <DialogTitle className="text-xl">Desconectar WhatsApp?</DialogTitle>
            </div>
            <DialogDescription className="text-base pt-2">
              A instância <span className="font-semibold text-foreground">{instanceName}</span> será desconectada completamente.
              <br />
              <br />
              Você precisará escanear um novo QR Code para reconectar.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              variant="outline"
              onClick={() => setIsDisconnectModalOpen(false)}
              disabled={isLoading}
            >
              Cancelar
            </Button>
            <Button
              variant="destructive"
              onClick={handleConfirmDisconnect}
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Desconectando...
                </>
              ) : (
                <>
                  <WifiOff className="w-4 h-4" />
                  Sim, Desconectar
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}