// app/dashboard/clientes/[id]/configurar/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PromptEditor } from '@/components/clientes/prompt-editor';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2, Settings } from 'lucide-react';
import type { Cliente } from '@/lib/types';
import { use } from 'react';

export default function ConfigurarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  
  // CRÍTICO: await params no Next.js 15+
  const { id } = use(params);
  
  const [cliente, setCliente] = useState<Cliente | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCliente();
  }, [id]);

  const fetchCliente = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/clientes/${id}`);
      
      if (!response.ok) {
        throw new Error('Cliente não encontrado');
      }

      const data = await response.json();
      setCliente(data);
    } catch (err: any) {
      setError(err.message || 'Erro ao carregar cliente');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSuccess = () => {
    // Recarregar dados do cliente
    fetchCliente();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !cliente) {
    return (
      <div className="space-y-6 max-w-3xl mx-auto">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.back()}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="text-3xl font-bold">Erro ao Carregar Cliente</h1>
        </div>
        
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg">
          {error || 'Cliente não encontrado'}
        </div>
        
        <Button onClick={() => router.push('/dashboard/clientes')}>
          Voltar para Lista
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Settings className="h-8 w-8 text-primary" />
            <div>
              <h1 className="text-3xl font-bold">Configurar Assistente</h1>
              <p className="text-muted-foreground">
                {cliente.nome_cliente}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Info do Cliente */}
      <div className="bg-muted rounded-lg p-4 flex items-center justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Instância:</span>
            <span className="font-mono text-sm">{cliente.nome_instancia}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Escritório:</span>
            <span className="text-sm">{cliente.nome_escritorio}</span>
          </div>
        </div>
        
        {cliente.prompt_editado_manualmente && (
          <div className="bg-amber-100 dark:bg-amber-900 px-3 py-1 rounded-md">
            <span className="text-xs text-amber-800 dark:text-amber-200">
              ✏️ Prompt editado manualmente
            </span>
          </div>
        )}
      </div>

      {/* Dica */}
      <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
          💡 Como funciona
        </h3>
        <ol className="text-sm text-blue-800 dark:text-blue-200 space-y-1 list-decimal list-inside">
          <li>Preencha o nome do escritório e do agente</li>
          <li>Selecione os templates (teses jurídicas) que deseja atender</li>
          <li>Clique em "Gerar Prompt" para criar o prompt automaticamente</li>
          <li>Revise e edite o prompt se necessário</li>
          <li>Clique em "Salvar Prompt" para finalizar</li>
        </ol>
      </div>

      {/* Editor de Prompt */}
      <PromptEditor cliente={cliente} onSave={handleSaveSuccess} />

      {/* Footer Info */}
      <div className="bg-muted rounded-lg p-4 text-sm space-y-2">
        <div className="flex justify-between">
          <span className="text-muted-foreground">Última atualização:</span>
          <span>{new Date(cliente.atualizado_em).toLocaleString('pt-BR')}</span>
        </div>
        {cliente.ultima_regeneracao && (
          <div className="flex justify-between">
            <span className="text-muted-foreground">Última regeneração:</span>
            <span>{new Date(cliente.ultima_regeneracao).toLocaleString('pt-BR')}</span>
          </div>
        )}
      </div>
    </div>
  );
}