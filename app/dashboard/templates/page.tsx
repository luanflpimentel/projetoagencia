'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import TemplateCard from '@/components/templates/template-card';
import { Plus, Search, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
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
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">Gerencie os templates de prompts do sistema</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="skeleton">
              <CardHeader>
                <div className="h-6 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-muted rounded w-1/2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-20 bg-muted rounded mb-4"></div>
                <div className="h-10 bg-muted rounded"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Templates</h1>
          <p className="text-muted-foreground mt-1">Gerencie os templates de prompts do sistema</p>
        </div>
        <Link
          href="/dashboard/templates/novo"
          className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium"
        >
          <Plus className="h-5 w-5" />
          Novo Template
        </Link>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <input
          type="text"
          placeholder="Buscar templates por nome ou área de atuação..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-10 pr-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground shadow-sm transition-all"
        />
      </div>

      {/* Grid de Templates */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-16">
          <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-6 text-lg">
            {searchTerm ? 'Nenhum template encontrado com esse termo' : 'Nenhum template cadastrado ainda'}
          </p>
          {!searchTerm && (
            <Link
              href="/dashboard/templates/novo"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm font-medium"
            >
              <Plus className="h-5 w-5" />
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