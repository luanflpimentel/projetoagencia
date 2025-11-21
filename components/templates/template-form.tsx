'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Save } from 'lucide-react';
import Link from 'next/link';
import type { Template } from '@/lib/types';

interface TemplateFormProps {
  template?: Template;
  isEdit?: boolean;
}

export default function TemplateForm({ template, isEdit = false }: TemplateFormProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    nome_template: template?.nome_template || '',
    area_atuacao: template?.area_atuacao || '',
    descricao: template?.descricao || '',
    keywords: template?.keywords || '',
    pitch_inicial: template?.pitch_inicial || '',
    perguntas_qualificacao: template?.perguntas_qualificacao || '',
    validacao_proposta: template?.validacao_proposta || '',
    mensagem_desqualificacao: template?.mensagem_desqualificacao || '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const url = isEdit 
        ? `/api/templates/${template?.id}`
        : '/api/templates';
      
      const method = isEdit ? 'PATCH' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        alert(isEdit ? 'Template atualizado com sucesso!' : 'Template criado com sucesso!');
        router.push('/dashboard/templates');
        router.refresh();
      } else {
        alert('Erro ao salvar template');
      }
    } catch (error) {
      console.error('Erro ao salvar template:', error);
      alert('Erro ao salvar template');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-4xl">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/templates"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft size={20} />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">
            {isEdit ? 'Editar Template' : 'Novo Template'}
          </h1>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed font-medium"
        >
          <Save size={20} />
          {loading ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      {/* Form */}
      <div className="bg-white rounded-lg shadow p-6 space-y-6">
        {/* Informações Básicas */}
        <div>
          <h2 className="text-lg font-semibold text-gray-800 mb-4">
            Informações Básicas
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome do Template *
              </label>
              <input
                type="text"
                required
                value={formData.nome_template}
                onChange={(e) => setFormData({ ...formData, nome_template: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Rescisão Indireta"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Área de Atuação *
              </label>
              <input
                type="text"
                required
                value={formData.area_atuacao}
                onChange={(e) => setFormData({ ...formData, area_atuacao: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Ex: Direito do Trabalho"
              />
            </div>
          </div>
          <div className="mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Descrição (opcional)
            </label>
            <textarea
              value={formData.descricao}
              onChange={(e) => setFormData({ ...formData, descricao: e.target.value })}
              rows={2}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Breve descrição do template"
            />
          </div>
        </div>

        {/* Keywords */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keywords * <span className="text-gray-500 text-xs">(uma por linha)</span>
          </label>
          <textarea
            required
            value={formData.keywords}
            onChange={(e) => setFormData({ ...formData, keywords: e.target.value })}
            rows={4}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="rescisão&#10;demissão indireta&#10;sair da empresa"
          />
          <p className="text-xs text-gray-500 mt-1">
            Palavras-chave que a IA usa para detectar esta tese
          </p>
        </div>

        {/* Pitch Inicial */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Pitch Inicial *
          </label>
          <textarea
            required
            value={formData.pitch_inicial}
            onChange={(e) => setFormData({ ...formData, pitch_inicial: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Mensagem inicial que a IA usa quando detecta esta tese"
          />
        </div>

        {/* Perguntas de Qualificação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Perguntas de Qualificação * <span className="text-gray-500 text-xs">(uma por linha)</span>
          </label>
          <textarea
            required
            value={formData.perguntas_qualificacao}
            onChange={(e) => setFormData({ ...formData, perguntas_qualificacao: e.target.value })}
            rows={6}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
            placeholder="1. Você ainda está trabalhando?&#10;2. O que aconteceu?&#10;3. Tem provas?"
          />
          <p className="text-xs text-gray-500 mt-1">
            Perguntas que a IA fará para qualificar o lead
          </p>
        </div>

        {/* Mensagem de Validação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem de Validação * <span className="text-gray-500 text-xs">(quando qualificado)</span>
          </label>
          <textarea
            required
            value={formData.validacao_proposta}
            onChange={(e) => setFormData({ ...formData, validacao_proposta: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="✅ Você tem direito! Vamos agendar uma consulta gratuita..."
          />
        </div>

        {/* Mensagem de Desqualificação */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Mensagem de Desqualificação (opcional)
          </label>
          <textarea
            value={formData.mensagem_desqualificacao}
            onChange={(e) => setFormData({ ...formData, mensagem_desqualificacao: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Com as informações que você passou, não identificamos elementos suficientes..."
          />
        </div>
      </div>
    </form>
  );
}