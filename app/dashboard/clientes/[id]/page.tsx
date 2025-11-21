// app/dashboard/clientes/[id]/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ClienteForm } from '@/components/clientes/cliente-form';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';
import type { Cliente } from '@/lib/types';
import { use } from 'react';

export default function EditarClientePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  
  // CRÍTICO: No Next.js 15+, params é Promise - usar React.use()
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

  const handleSuccess = () => {
    router.push('/dashboard/clientes');
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
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Editar Cliente</h1>
          <p className="text-muted-foreground">
            {cliente.nome_cliente}
          </p>
        </div>
      </div>

      {/* Formulário */}
      <ClienteForm cliente={cliente} onSuccess={handleSuccess} />

      {/* Info adicional */}
      <div className="bg-muted rounded-lg p-4 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-muted-foreground">ID:</span>
          <span className="font-mono">{cliente.id}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Criado em:</span>
          <span>{new Date(cliente.criado_em).toLocaleString('pt-BR')}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-muted-foreground">Última atualização:</span>
          <span>{new Date(cliente.atualizado_em).toLocaleString('pt-BR')}</span>
        </div>
      </div>
    </div>
  );
}