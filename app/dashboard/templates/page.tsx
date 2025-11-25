'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '@/components/templates/template-card';
import { Plus, Search } from 'lucide-react';
import Link from 'next/link';
import ProtegerRota from '@/components/auth/ProtegerRota';

interface Template {
  id: string;
  nome_template: string;
  area_atuacao: string;
  keywords: string;
  total_clientes_usando: number;
  versao: string;
}

export default function TemplatesPage() {
  return (
    <ProtegerRota somenteAgencia>
      <TemplatesPageContent />
    </ProtegerRota>
  );
}

function TemplatesPageContent() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const router = useRouter();

  useEffect(() => {
    fetchTemplates();
  }, []);

  async function fetchTemplates() {
    try {
      const response = await fetch('/api/templates');
      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao carregar templates:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate(id: string) {
    if (!confirm('Deseja duplicar este template?')) return;

    try {
      const response = await fetch(`/api/templates/${id}/duplicate`, {
        method: 'POST',
      });

      if (response.ok) {
        fetchTemplates();
        alert('Template duplicado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao duplicar template:', error);
      alert('Erro ao duplicar template');
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Deseja desativar este template? Esta ação não pode ser desfeita.')) return;

    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        fetchTemplates();
        alert('Template desativado com sucesso!');
      }
    } catch (error) {
      console.error('Erro ao desativar template:', error);
      alert('Erro ao desativar template');
    }
  }

  const filteredTemplates = templates.filter(template =>
    template.nome_template.toLowerCase().includes(searchTerm.toLowerCase()) ||
    template.area_atuacao.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-foreground mb-6">Templates</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card rounded-lg shadow p-6 animate-pulse border border-border">
              <div className="h-6 bg-muted rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-muted rounded w-1/2 mb-4"></div>
              <div className="h-20 bg-muted rounded mb-4"></div>
              <div className="h-10 bg-muted rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Templates
        </h1>
        <Link
          href="/dashboard/templates/novo"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
        >
          <Plus size={20} />
          Novo Template
        </Link>
      </div>

      {/* Search */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            placeholder="Buscar templates..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground"
          />
        </div>
      </div>

      {/* Grid de Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="bg-card rounded-lg shadow p-12 text-center border border-border">
          <p className="text-muted-foreground mb-4">
            {searchTerm ? 'Nenhum template encontrado' : 'Nenhum template cadastrado ainda'}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/templates/novo"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
            >
              <Plus size={20} />
              Criar Primeiro Template
            </Link>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <TemplateCard
              key={template.id}
              {...template}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}