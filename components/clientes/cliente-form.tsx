// components/clientes/cliente-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, AlertCircle } from 'lucide-react';
import type { Cliente } from '@/lib/types';

interface ClienteFormProps {
  cliente?: Cliente; // Se existir, é edição
  onSuccess?: () => void;
}

export function ClienteForm({ cliente, onSuccess }: ClienteFormProps) {
  const router = useRouter();
  const isEdit = !!cliente;

  // Form state
  const [formData, setFormData] = useState({
    nome_cliente: cliente?.nome_cliente || '',
    nome_instancia: cliente?.nome_instancia || '',
    numero_whatsapp: cliente?.numero_whatsapp || '',
    email: cliente?.email || '',
    nome_escritorio: cliente?.nome_escritorio || '',
    nome_agente: cliente?.nome_agente || 'Julia',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Normalizar nome_instancia em tempo real
  const handleNomeInstanciaChange = (value: string) => {
    const normalizado = value
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
    
    setFormData(prev => ({ ...prev, nome_instancia: normalizado }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Validação básica
      if (!formData.nome_cliente || !formData.nome_instancia || !formData.nome_escritorio) {
        throw new Error('Preencha todos os campos obrigatórios');
      }

      // Validar formato nome_instancia
      if (!/^[a-z0-9-]+$/.test(formData.nome_instancia)) {
        throw new Error('Nome da instância inválido. Use apenas letras minúsculas, números e hífens.');
      }

      const url = isEdit 
        ? `/api/clientes/${cliente.id}`
        : '/api/clientes';

      const method = isEdit ? 'PATCH' : 'POST';

      // ✅ CORREÇÃO: Separar body para CREATE e UPDATE
      const body = isEdit
        ? formData // PATCH: apenas campos do cliente
        : { ...formData, template_ids: [] }; // POST: inclui template_ids vazio

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao salvar cliente');
      }

      // Sucesso!
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/dashboard/clientes');
      }
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar cliente');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>{isEdit ? 'Editar Cliente' : 'Novo Cliente'}</CardTitle>
        <CardDescription>
          {isEdit 
            ? 'Atualize as informações do cliente' 
            : 'Preencha os dados do novo cliente'}
        </CardDescription>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Erro */}
          {error && (
            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
              <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Nome do Cliente */}
          <div className="space-y-2">
            <Label htmlFor="nome_cliente">
              Nome do Cliente <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_cliente"
              value={formData.nome_cliente}
              onChange={(e) => setFormData({ ...formData, nome_cliente: e.target.value })}
              placeholder="Ex: Advocacia Silva & Associados"
              required
            />
          </div>

          {/* Nome da Instância */}
          <div className="space-y-2">
            <Label htmlFor="nome_instancia">
              Nome da Instância (Único) <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_instancia"
              value={formData.nome_instancia}
              onChange={(e) => handleNomeInstanciaChange(e.target.value)}
              placeholder="Ex: silva-associados"
              disabled={isEdit} // Não pode editar em modo edição
              required
              className={isEdit ? 'bg-muted' : ''}
            />
            <p className="text-xs text-muted-foreground">
              {isEdit 
                ? '⚠️ Nome da instância não pode ser alterado após criação' 
                : 'Apenas letras minúsculas, números e hífens. Será usado pelo N8N.'}
            </p>
          </div>

          {/* Nome do Escritório */}
          <div className="space-y-2">
            <Label htmlFor="nome_escritorio">
              Nome do Escritório <span className="text-destructive">*</span>
            </Label>
            <Input
              id="nome_escritorio"
              value={formData.nome_escritorio}
              onChange={(e) => setFormData({ ...formData, nome_escritorio: e.target.value })}
              placeholder="Ex: Silva & Associados Advocacia"
              required
            />
            <p className="text-xs text-muted-foreground">
              Será usado no prompt do assistente
            </p>
          </div>

          {/* Nome do Agente */}
          <div className="space-y-2">
            <Label htmlFor="nome_agente">Nome do Agente (Assistente)</Label>
            <Input
              id="nome_agente"
              value={formData.nome_agente}
              onChange={(e) => setFormData({ ...formData, nome_agente: e.target.value })}
              placeholder="Ex: Julia, Maria, Ana"
            />
            <p className="text-xs text-muted-foreground">
              Nome do assistente virtual (padrão: Julia)
            </p>
          </div>

          {/* WhatsApp */}
          <div className="space-y-2">
            <Label htmlFor="numero_whatsapp">Número WhatsApp</Label>
            <Input
              id="numero_whatsapp"
              value={formData.numero_whatsapp}
              onChange={(e) => setFormData({ ...formData, numero_whatsapp: e.target.value })}
              placeholder="Ex: 5511999999999"
            />
            <p className="text-xs text-muted-foreground">
              Formato: código do país + DDD + número
            </p>
          </div>

          {/* Email */}
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: contato@escritorio.com.br"
            />
          </div>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button
              type="submit"
              disabled={loading}
              className="flex-1"
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEdit ? 'Salvar Alterações' : 'Criar Cliente'}
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              disabled={loading}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}