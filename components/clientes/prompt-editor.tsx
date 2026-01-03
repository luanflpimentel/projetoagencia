// components/clientes/prompt-editor.tsx
'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { TemplateSelector } from './template-selector';
import { Loader2, RefreshCw, Save, AlertCircle, Check } from 'lucide-react';
import type { Cliente } from '@/lib/types';

interface PromptEditorProps {
  cliente: Cliente;
  onSave?: () => void;
}

export function PromptEditor({ cliente, onSave }: PromptEditorProps) {
  const [nomeEscritorio, setNomeEscritorio] = useState(cliente.nome_escritorio);
  const [nomeAgente, setNomeAgente] = useState(cliente.nome_agente);
  const [selectedTemplates, setSelectedTemplates] = useState<string[]>([]);
  const [prompt, setPrompt] = useState(cliente.prompt_sistema || '');
  const [promptEditado, setPromptEditado] = useState(cliente.prompt_editado_manualmente);
  
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // ✅ CORREÇÃO: Usar useEffect ao invés de useState
  useEffect(() => {
    fetchClienteTemplates();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const fetchClienteTemplates = async () => {
    try {
      const response = await fetch(`/api/clientes/${cliente.id}/templates`);
      if (response.ok) {
        const data = await response.json();
        const ids = data.map((t: any) => t.id);
        setSelectedTemplates(ids);
      }
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    }
  };

  const handleGerarPrompt = async () => {
    if (!nomeEscritorio || !nomeAgente) {
      setError('Preencha o nome do escritório e do agente');
      return;
    }

    if (selectedTemplates.length === 0) {
      setError('Selecione pelo menos um template');
      return;
    }

    // Se prompt foi editado manualmente, confirmar
    if (promptEditado) {
      const confirmar = confirm(
        '⚠️ O prompt foi editado manualmente.\n\n' +
        'Ao regenerar, todas as alterações manuais serão perdidas.\n\n' +
        'Deseja continuar?'
      );
      
      if (!confirmar) return;
    }

    try {
      setGenerating(true);
      setError(null);

      // 1. Atualizar templates do cliente
      await fetch(`/api/clientes/${cliente.id}/templates`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template_ids: selectedTemplates }),
      });

      // 2. Gerar prompt
      const response = await fetch(`/api/clientes/${cliente.id}/gerar-prompt`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_escritorio: nomeEscritorio,
          nome_agente: nomeAgente,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao gerar prompt');
      }

      setPrompt(data.prompt);
      setPromptEditado(false);
      setSuccess(true);
      
      setTimeout(() => setSuccess(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Erro ao gerar prompt');
    } finally {
      setGenerating(false);
    }
  };

  const handleSalvar = async () => {
    if (!prompt.trim()) {
      setError('O prompt não pode estar vazio');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`/api/clientes/${cliente.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome_escritorio: nomeEscritorio,
          nome_agente: nomeAgente,
          prompt_sistema: prompt,
          prompt_editado_manualmente: promptEditado,
        }),
      });

      if (!response.ok) {
        throw new Error('Erro ao salvar');
      }

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);

      if (onSave) onSave();
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar prompt');
    } finally {
      setLoading(false);
    }
  };

  const handlePromptChange = (value: string) => {
    setPrompt(value);
    // Marcar como editado manualmente se o usuário digitar
    if (!promptEditado) {
      setPromptEditado(true);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
      {/* COLUNA ESQUERDA - 40% */}
      <div className="lg:col-span-2 space-y-6">
        {/* Erro geral */}
        {error && (
          <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-lg flex items-start gap-2">
            <AlertCircle className="h-5 w-5 mt-0.5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Sucesso */}
        {success && (
          <div className="bg-green-50 dark:bg-green-950 text-green-700 dark:text-green-300 px-4 py-3 rounded-lg flex items-center gap-2">
            <Check className="h-5 w-5" />
            <span className="text-sm">Salvo com sucesso!</span>
          </div>
        )}

        {/* Inputs */}
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nome_escritorio">Nome do Escritório *</Label>
            <Input
              id="nome_escritorio"
              value={nomeEscritorio}
              onChange={(e) => setNomeEscritorio(e.target.value)}
              placeholder="Ex: Silva & Associados Advocacia"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="nome_agente">Nome do Agente (Assistente) *</Label>
            <Input
              id="nome_agente"
              value={nomeAgente}
              onChange={(e) => setNomeAgente(e.target.value)}
              placeholder="Ex: Julia, Maria, Ana"
            />
          </div>
        </div>

        {/* Seletor de Templates */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Selecionar Templates</Label>
            {selectedTemplates.length > 0 && (
              <Badge variant="secondary" className="bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border border-blue-200 dark:border-blue-700">
                {selectedTemplates.length} selecionado{selectedTemplates.length !== 1 ? 's' : ''}
              </Badge>
            )}
          </div>

          <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg p-4 max-h-[400px] overflow-y-auto bg-white dark:bg-gray-900">
            <TemplateSelector
              clienteId={cliente.id}
              selectedIds={selectedTemplates}
              onChange={setSelectedTemplates}
            />
          </div>
        </div>

        {/* Botão Gerar Prompt */}
        <Button
          onClick={handleGerarPrompt}
          disabled={generating || selectedTemplates.length === 0}
          className="w-full"
          size="lg"
          variant="default"
        >
          {generating ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Gerando Prompt...
            </>
          ) : (
            <>
              <RefreshCw className="mr-2 h-4 w-4" />
              Gerar Prompt
            </>
          )}
        </Button>

        {promptEditado && (
          <div className="bg-amber-50 dark:bg-amber-950 border border-amber-200 dark:border-amber-800 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5" />
              <div className="text-xs text-amber-800 dark:text-amber-200">
                <strong>Editado Manualmente</strong>
                <p className="mt-1">
                  Ao regenerar o prompt, suas alterações manuais serão perdidas.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* COLUNA DIREITA - 60% */}
      <div className="lg:col-span-3 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <Label className="text-base font-semibold text-gray-900 dark:text-gray-100">Prompt Final</Label>
            <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">
              Você pode editar o prompt manualmente se necessário
            </p>
          </div>

          {promptEditado && (
            <Badge variant="outline" className="bg-amber-100 dark:bg-amber-900 text-amber-800 dark:text-amber-200 border-amber-300 dark:border-amber-700">
              ✏️ Editado
            </Badge>
          )}
        </div>

        <Textarea
          value={prompt}
          onChange={(e) => handlePromptChange(e.target.value)}
          placeholder="Selecione templates e clique em 'Gerar Prompt' para criar o prompt automaticamente..."
          className="min-h-[500px] font-mono text-sm bg-white dark:bg-gray-900 border-2 border-gray-200 dark:border-gray-700 text-gray-900 dark:text-gray-100"
        />

        <Button
          onClick={handleSalvar}
          disabled={loading || !prompt.trim()}
          size="lg"
          className="w-full"
          variant="default"
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Salvando...
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              Salvar Prompt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}