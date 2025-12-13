// components/clientes/cliente-card.tsx
'use client';

import { useState, useEffect } from 'react';
import { ConnectionActions } from '@/components/whatsapp/connection-actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { Building2, Phone, User, Settings, Edit, Trash2, TestTube, Bot, BotOff, Loader2, QrCode, Copy, ExternalLink, Check, RefreshCw, MessagesSquare } from 'lucide-react';
import Link from 'next/link';
import type { VwClienteLista } from '@/lib/types';


interface ClienteCardProps {
  cliente: VwClienteLista;
  onDelete?: (id: string) => void;
  userRole?: 'agencia' | 'cliente';
}

export function ClienteCard({ cliente, onDelete, userRole = 'cliente' }: ClienteCardProps) {
  const toast = useToast();
  const [iaAtiva, setIaAtiva] = useState(cliente.ia_ativa ?? true);
  const [isTogglingIA, setIsTogglingIA] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [showChatwootModal, setShowChatwootModal] = useState(false);
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [isRetryingChatwoot, setIsRetryingChatwoot] = useState(false);

  // Cores do badge de status
  const statusConfig = {
    conectado: {
      variant: 'default' as const,
      label: 'Conectado',
      color: 'bg-green-500',
    },
    connecting: {
      variant: 'secondary' as const,
      label: 'Conectando...',
      color: 'bg-yellow-500',
    },
    desconectado: {
      variant: 'destructive' as const,
      label: 'Desconectado',
      color: 'bg-red-500',
    },
  };

  const status = statusConfig[cliente.status_conexao] || statusConfig.desconectado;

  // ✅ NOVO: Buscar QR Code quando status for 'connecting'
  useEffect(() => {
    const fetchQRCode = async () => {
      if (cliente.status_conexao === 'connecting') {
        setLoadingQR(true);
        try {
          // ✅ CORRIGIDO: Usar endpoint GET que não reseta a instância
          const response = await fetch(`/api/uazapi/instances/${cliente.nome_instancia}/get-qrcode`);

          if (response.ok) {
            const data = await response.json();
            if (data.success && data.qrcode) {
              setQrCode(data.qrcode);
            } else {
              console.log('⚠️ QR Code não disponível:', data.message);
              setQrCode(null);
            }
          } else {
            console.error('Erro ao buscar QR Code:', response.statusText);
            setQrCode(null);
          }
        } catch (error) {
          console.error('Erro ao buscar QR Code:', error);
          setQrCode(null);
        } finally {
          setLoadingQR(false);
        }
      } else {
        // Limpar QR Code se não estiver mais em connecting
        setQrCode(null);
      }
    };

    fetchQRCode();

    // ✅ NOVO: Polling a cada 10 segundos para atualizar o QR Code
    let intervalId: NodeJS.Timeout | null = null;

    if (cliente.status_conexao === 'connecting') {
      intervalId = setInterval(fetchQRCode, 10000); // Atualiza a cada 10s
    }

    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [cliente.status_conexao, cliente.nome_instancia]);

  // Handler para toggle da IA
  const handleToggleIA = async () => {
    if (isTogglingIA) return;

    const novoEstado = !iaAtiva;
    setIsTogglingIA(true);

    try {
      const response = await fetch(`/api/clientes/${cliente.id}/toggle-ia`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ia_ativa: novoEstado }),
      });

      if (!response.ok) {
        throw new Error('Erro ao alterar status da IA');
      }

      const data = await response.json();
      setIaAtiva(data.ia_ativa);
    } catch (error) {
      console.error('Erro ao toggle IA:', error);
      alert('Erro ao alterar status da IA');
    } finally {
      setIsTogglingIA(false);
    }
  };

  // Handler para copiar texto
  const handleCopy = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedField(field);
      setTimeout(() => setCopiedField(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
    }
  };

  // Handler para retry do Chatwoot
  const handleRetryChatwoot = async () => {
    if (isRetryingChatwoot) return;

    setIsRetryingChatwoot(true);

    try {
      const response = await fetch(`/api/clientes/${cliente.id}/chatwoot-retry`, {
        method: 'POST',
      });

      const data = await response.json();

      if (response.ok && data.success) {
        toast.success('Chatwoot provisionado com sucesso!');
        // Recarregar página após 1 segundo para atualizar os dados
        setTimeout(() => window.location.reload(), 1000);
      } else {
        toast.error(`Erro ao provisionar Chatwoot: ${data.message || 'Erro desconhecido'}`);
      }
    } catch (error) {
      console.error('Erro ao tentar provisionar Chatwoot:', error);
      toast.error('Erro ao tentar provisionar Chatwoot');
    } finally {
      setIsRetryingChatwoot(false);
    }
  };

  // Handler para abrir Chatwoot
  const handleOpenChatwoot = () => {
    const chatwootUrl = process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.zeyno.dev.br';
    window.open(`${chatwootUrl}/app/login`, '_blank');
  };

  return (
    <Card className="hover-lift transition-all">
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2 text-foreground">{cliente.nome_cliente}</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="font-mono bg-muted text-muted-foreground px-2.5 py-1 rounded text-xs font-medium">
                {cliente.nome_instancia}
              </span>
              {cliente.prompt_editado_manualmente && (
                <Badge variant="info" className="text-xs">
                  Editado
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            {/* Status de Conexão */}
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
              <Badge variant={status.variant} className="text-xs font-medium">{status.label}</Badge>
            </div>

            {/* Toggle IA - Só mostra se estiver conectado */}
            {cliente.status_conexao === 'conectado' && (
              <button
                onClick={handleToggleIA}
                disabled={isTogglingIA}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                  iaAtiva
                    ? 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={iaAtiva ? 'IA Ativa - Clique para pausar' : 'IA Pausada - Clique para ativar'}
              >
                {iaAtiva ? (
                  <>
                    <Bot className="h-3.5 w-3.5" />
                    <span>IA Ativa</span>
                  </>
                ) : (
                  <>
                    <BotOff className="h-3.5 w-3.5" />
                    <span>IA Pausada</span>
                  </>
                )}
              </button>
            )}

            {/* Status do Chatwoot - Só mostra quando active ou error */}
            {(cliente.chatwoot_status === 'active' || cliente.chatwoot_status === 'error') && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => cliente.chatwoot_status === 'active' && setShowChatwootModal(true)}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-all ${
                    cliente.chatwoot_status === 'active'
                      ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 cursor-pointer'
                      : 'bg-red-100 text-red-700 cursor-default'
                  }`}
                  title={
                    cliente.chatwoot_status === 'active'
                      ? 'Chatwoot Ativo - Clique para ver credenciais'
                      : `Erro no Chatwoot: ${cliente.chatwoot_error_message || 'Desconhecido'}`
                  }
                  disabled={cliente.chatwoot_status !== 'active'}
                >
                  {cliente.chatwoot_status === 'active' && (
                    <>
                      <span>✓ Chatwoot</span>
                    </>
                  )}
                  {cliente.chatwoot_status === 'error' && (
                    <>
                      <span>✗ Chatwoot</span>
                    </>
                  )}
                </button>

                {/* Botão de Retry quando tiver erro */}
                {cliente.chatwoot_status === 'error' && (
                  <button
                    onClick={handleRetryChatwoot}
                    disabled={isRetryingChatwoot}
                    className="p-1.5 rounded-full bg-red-100 text-red-700 hover:bg-red-200 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Tentar provisionar novamente"
                  >
                    {isRetryingChatwoot ? (
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <RefreshCw className="h-3.5 w-3.5" />
                    )}
                  </button>
                )}

                {/* Botão de acesso direto ao Chatwoot quando ativo */}
                {cliente.chatwoot_status === 'active' && (
                  <button
                    onClick={handleOpenChatwoot}
                    className="p-1.5 rounded-full bg-emerald-100 text-emerald-700 hover:bg-emerald-200 transition-all"
                    title="Abrir painel do Chatwoot"
                  >
                    <MessagesSquare className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Escritório */}
        <div className="flex items-center gap-2.5 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
            <Building2 className="h-4 w-4 text-blue-600" />
          </div>
          <span className="font-medium text-foreground">{cliente.nome_escritorio}</span>
        </div>

        {/* Agente */}
        <div className="flex items-center gap-2.5 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
          <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
            <User className="h-4 w-4 text-purple-600" />
          </div>
          <span className="text-muted-foreground">Agente: <span className="text-foreground font-medium">{cliente.nome_agente}</span></span>
        </div>

        {/* WhatsApp */}
        {cliente.numero_whatsapp && (
          <div className="flex items-center gap-2.5 text-sm p-2 rounded-md hover:bg-muted/50 transition-colors">
            <div className="w-8 h-8 rounded-lg bg-green-100 flex items-center justify-center flex-shrink-0">
              <Phone className="h-4 w-4 text-green-600" />
            </div>
            <span className="font-mono text-foreground">{cliente.numero_whatsapp}</span>
          </div>
        )}

        {/* Última conexão */}
        {cliente.ultima_conexao && (
          <div className="text-xs text-muted-foreground pt-2 border-t border-border">
            Última conexão: {new Date(cliente.ultima_conexao).toLocaleString('pt-BR')}
          </div>
        )}
      </CardContent>

      {/* ✅ NOVO: QR Code visível quando status é 'connecting' */}
      {cliente.status_conexao === 'connecting' && (
        <div className="px-6 pb-6">
          <div className="border-2 border-yellow-200 bg-yellow-50 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <QrCode className="h-5 w-5 text-yellow-700" />
              <h3 className="font-semibold text-yellow-900">Escaneie o QR Code para conectar</h3>
            </div>

            {loadingQR ? (
              <div className="flex flex-col items-center justify-center py-8 space-y-3">
                <Loader2 className="w-10 h-10 animate-spin text-yellow-600" />
                <p className="text-sm text-yellow-700">Buscando QR Code...</p>
              </div>
            ) : qrCode ? (
              <div className="flex flex-col items-center space-y-3">
                <div className="bg-white p-3 rounded-lg border-2 border-yellow-300">
                  <img
                    src={qrCode}
                    alt="QR Code WhatsApp"
                    className="w-48 h-48"
                    loading="eager"
                  />
                </div>
                <p className="text-xs text-yellow-700 text-center max-w-xs">
                  Abra o WhatsApp no celular → Menu → Aparelhos conectados → Conectar um aparelho
                </p>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-6 space-y-2">
                <p className="text-sm text-yellow-700 text-center">
                  QR Code não disponível no momento.
                </p>
                <p className="text-xs text-yellow-600">
                  Tente clicar em "Conectar WhatsApp" novamente.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      <CardFooter className="flex flex-wrap gap-2">
        {/* ✅ Testar - Visível para todos */}
        <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] hover:bg-accent/5 hover:border-accent transition-all">
          <Link href={`/dashboard/clientes/${cliente.id}/teste-prompt`}>
            <TestTube className="h-4 w-4 mr-2" />
            Testar
          </Link>
        </Button>

        {/* ✅ Editar - Visível para todos */}
        <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] hover:bg-accent/5 hover:border-accent transition-all">
          <Link href={`/dashboard/clientes/${cliente.id}`}>
            <Edit className="h-4 w-4 mr-2" />
            Editar
          </Link>
        </Button>

        {/* 🔒 Configurar - Apenas para agência */}
        {userRole === 'agencia' && (
          <Button variant="outline" size="sm" asChild className="flex-1 min-w-[120px] hover:bg-accent/5 hover:border-accent transition-all">
            <Link href={`/dashboard/clientes/${cliente.id}/configurar`}>
              <Settings className="h-4 w-4 mr-2" />
              Configurar
            </Link>
          </Button>
        )}

        {/* 🔒 Excluir - Apenas para agência */}
        {userRole === 'agencia' && onDelete && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onDelete(cliente.id)}
            className="text-destructive hover:bg-destructive/10 hover:text-destructive"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}

        {/* ✅ Botões de conexão WhatsApp - Visível para todos */}
        <div className="w-full mt-2">
          <ConnectionActions
            instanceName={cliente.nome_instancia}
            statusConexao={cliente.status_conexao}
            isConnected={cliente.status_conexao === 'conectado'}
            onStatusChange={() => window.location.reload()}
          />
        </div>
      </CardFooter>

      {/* Modal de Credenciais do Chatwoot */}
      <Dialog open={showChatwootModal} onOpenChange={setShowChatwootModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl flex items-center gap-2">
              🔐 Acesso ao Chatwoot
            </DialogTitle>
            <DialogDescription>
              Credenciais para acessar o painel do Chatwoot
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                URL de Acesso
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.zeyno.dev.br'}
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.zeyno.dev.br', 'url')}
                >
                  {copiedField === 'url' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Email
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value={cliente.chatwoot_user_email || cliente.email || ''}
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy(cliente.chatwoot_user_email || cliente.email || '', 'email')}
                >
                  {copiedField === 'email' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Senha */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-muted-foreground">
                Senha
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="AgenciaTalisma1!"
                  className="flex-1 px-3 py-2 text-sm border rounded-md bg-muted font-mono"
                />
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleCopy('AgenciaTalisma1!', 'password')}
                >
                  {copiedField === 'password' ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            {/* Aviso */}
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <p className="text-xs text-yellow-800">
                ⚠️ <strong>Recomendado:</strong> Troque a senha no primeiro acesso por segurança.
              </p>
            </div>

            {/* Botão de acesso */}
            <Button
              className="w-full"
              onClick={() => {
                window.open(`${process.env.NEXT_PUBLIC_CHATWOOT_BASE_URL || 'https://chat.zeyno.dev.br'}/app/login`, '_blank');
              }}
            >
              <ExternalLink className="h-4 w-4 mr-2" />
              Abrir Chatwoot
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
}