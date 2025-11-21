// components/clientes/template-selector.tsx
'use client';

import { useEffect, useState } from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, FileText } from 'lucide-react';
import type { Template } from '@/lib/types';

interface TemplateSelectorProps {
  clienteId: string;
  selectedIds: string[];
  onChange: (selectedIds: string[]) => void;
}

export function TemplateSelector({ clienteId, selectedIds, onChange }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/templates');
      
      if (!response.ok) {
        throw new Error('Erro ao buscar templates');
      }

      const data = await response.json();
      setTemplates(data);
    } catch (error) {
      console.error('Erro ao buscar templates:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = (templateId: string) => {
    if (selectedIds.includes(templateId)) {
      // Remover
      onChange(selectedIds.filter(id => id !== templateId));
    } else {
      // Adicionar
      onChange([...selectedIds, templateId]);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (templates.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        <FileText className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>Nenhum template disponível</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {templates.map((template) => {
        const isSelected = selectedIds.includes(template.id);
        
        return (
          <div
            key={template.id}
            className={`
              flex items-start gap-3 p-4 rounded-lg border-2 transition-all cursor-pointer
              ${isSelected 
                ? 'border-primary bg-primary/5' 
                : 'border-border hover:border-primary/50 hover:bg-accent/50'
              }
            `}
            onClick={() => handleToggle(template.id)}
          >
            <Checkbox
              id={template.id}
              checked={isSelected}
              onCheckedChange={() => handleToggle(template.id)}
              className="mt-1"
            />
            
            <div className="flex-1">
              <Label
                htmlFor={template.id}
                className="font-semibold cursor-pointer"
              >
                {template.nome_template}
              </Label>
              
              <div className="flex items-center gap-2 mt-1">
                <Badge variant="secondary" className="text-xs">
                  {template.area_atuacao}
                </Badge>
                {template.versao && (
                  <span className="text-xs text-muted-foreground">
                    {template.versao}
                  </span>
                )}
              </div>
              
              {template.descricao && (
                <p className="text-sm text-muted-foreground mt-2">
                  {template.descricao}
                </p>
              )}
            </div>
          </div>
        );
      })}
      
      {selectedIds.length > 0 && (
        <div className="pt-2 text-sm text-muted-foreground">
          ✅ {selectedIds.length} template{selectedIds.length !== 1 ? 's' : ''} selecionado{selectedIds.length !== 1 ? 's' : ''}
        </div>
      )}
    </div>
  );
}