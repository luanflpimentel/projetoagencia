// components/clientes/ConviteModal.tsx
'use client';

import { useState } from 'react';
import { X, Copy, CheckCircle, Mail, MessageCircle } from 'lucide-react';

interface ConviteModalProps {
  isOpen: boolean;
  onClose: () => void;
  convite: {
    email: string;
    link: string;
    token: string;
    expira_em: string;
  };
  nomeCliente: string;
}

export function ConviteModal({ isOpen, onClose, convite, nomeCliente }: ConviteModalProps) {
  const [copiado, setCopiado] = useState(false);

  if (!isOpen) return null;

  const copiarLink = async () => {
    await navigator.clipboard.writeText(convite.link);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  const dataExpiracao = new Date(convite.expira_em).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });

  const mensagemWhatsApp = encodeURIComponent(
    `Olá! 👋\n\n` +
    `Seu acesso ao sistema WhatsApp foi configurado!\n\n` +
    `Para começar a usar, clique no link abaixo e crie sua senha:\n` +
    `${convite.link}\n\n` +
    `⚠️ Este link expira em: ${dataExpiracao}\n\n` +
    `Depois de criar sua conta, você poderá escanear o QR Code e começar a usar seu WhatsApp imediatamente.`
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="bg-card rounded-lg shadow-2xl max-w-2xl w-full border-2 border-border">
        {/* Header */}
        <div className="px-6 py-4 border-b-2 border-border flex items-center justify-between bg-success/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-success/10 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-success" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Cliente Criado com Sucesso!</h2>
              <p className="text-sm text-muted-foreground">Convite gerado para {nomeCliente}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors p-1 hover:bg-muted rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Informações do Convite */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Email do cliente:</span>
              <span className="font-medium text-foreground">{convite.email}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Validade do link:</span>
              <span className="font-medium text-foreground">{dataExpiracao}</span>
            </div>
          </div>

          {/* Link de Convite */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-2">
              Link de Convite
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={convite.link}
                readOnly
                className="flex-1 border-2 border-input rounded-lg px-4 py-2.5 bg-muted text-foreground font-mono text-sm"
              />
              <button
                onClick={copiarLink}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
              >
                {copiado ? (
                  <>
                    <CheckCircle className="w-4 h-4" />
                    Copiado!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copiar
                  </>
                )}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Este link permite que o cliente crie sua própria senha de acesso
            </p>
          </div>

          {/* Ações Rápidas */}
          <div>
            <label className="block text-sm font-semibold text-foreground mb-3">
              Enviar Convite
            </label>
            <div className="grid grid-cols-2 gap-3">
              <a
                href={`mailto:${convite.email}?subject=Convite para acessar o sistema&body=${encodeURIComponent(`Olá ${nomeCliente}!\n\nSeu acesso ao sistema foi configurado. Clique no link abaixo para criar sua senha:\n\n${convite.link}\n\nEste link expira em: ${dataExpiracao}`)}`}
                className="flex items-center justify-center gap-2 px-4 py-3 border-2 border-input text-foreground rounded-lg hover:bg-muted transition-colors font-medium"
              >
                <Mail className="w-4 h-4" />
                Enviar por Email
              </a>
              <a
                href={`https://wa.me/?text=${mensagemWhatsApp}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 px-4 py-3 bg-success text-white rounded-lg hover:bg-success/90 transition-colors font-medium"
              >
                <MessageCircle className="w-4 h-4" />
                Enviar por WhatsApp
              </a>
            </div>
          </div>

          {/* Aviso */}
          <div className="bg-warning/10 border-l-4 border-warning rounded-lg p-4">
            <p className="text-sm text-foreground">
              <strong>Importante:</strong> Certifique-se de enviar este link para o cliente.
              Ele precisará acessar o link para criar sua senha e poder escanear o QR Code do WhatsApp.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t-2 border-border bg-muted/30 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-semibold"
          >
            Entendi
          </button>
        </div>
      </div>
    </div>
  );
}
