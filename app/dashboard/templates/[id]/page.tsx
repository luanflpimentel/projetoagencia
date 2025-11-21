'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import TemplateForm from '@/components/templates/template-form';
import type { Template } from '@/lib/types';

export default function EditarTemplatePage() {
  const params = useParams();
  const [template, setTemplate] = useState<Template | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchTemplate() {
      try {
        const response = await fetch(`/api/templates/${params.id}`);
        const data = await response.json();
        setTemplate(data);
      } catch (error) {
        console.error('Erro ao carregar template:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchTemplate();
  }, [params.id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-500">Carregando template...</p>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-red-500">Template não encontrado</p>
      </div>
    );
  }

  return <TemplateForm template={template} isEdit={true} />;
}