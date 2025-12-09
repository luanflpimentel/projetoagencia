// components/clientes/cliente-card.tsx
'use client';

import { ConnectionActions } from '@/components/whatsapp/connection-actions';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Building2, Phone, Mail, User, Settings, Edit, Trash2, TestTube } from 'lucide-react';
import Link from 'next/link';
import type { VwClienteLista } from '@/lib/types';


interface ClienteCardProps {
  cliente: VwClienteLista;
  onDelete?: (id: string) => void;
  userRole?: 'agencia' | 'cliente';
}

export function ClienteCard({ cliente, onDelete, userRole = 'cliente' }: ClienteCardProps) {
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
          <div className="flex flex-col items-end gap-1.5">
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${status.color} animate-pulse`} />
              <Badge variant={status.variant} className="text-xs font-medium">{status.label}</Badge>
            </div>
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
    </Card>
  );
}