// app/dashboard/configuracoes/page.tsx - Backup e Export
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/loading';

export default function ConfiguracoesPage() {
  const [exporting, setExporting] = useState(false);
  const toast = useToast();

  // Exportar Clientes
  async function exportClientes() {
    try {
      setExporting(true);

      const { data, error } = await supabase
        .from('clientes')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const headers = [
        'ID',
        'Nome Cliente',
        'Nome Instância',
        'WhatsApp',
        'Email',
        'Escritório',
        'Agente',
        'Status',
        'Token',
        'Prompt',
        'Criado Em',
      ];

      const rows = data?.map(cliente => [
        cliente.id,
        cliente.nome_cliente,
        cliente.nome_instancia,
        cliente.numero_whatsapp || '',
        cliente.email || '',
        cliente.nome_escritorio,
        cliente.nome_agente,
        cliente.status_conexao,
        cliente.instance_token || '',
        cliente.prompt_sistema,
        new Date(cliente.criado_em).toLocaleString('pt-BR'),
      ]) || [];

      downloadCSV(headers, rows, 'clientes');
      toast.success('Clientes exportados!', 'Arquivo baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar clientes:', error);
      toast.error('Erro ao exportar', error.message);
    } finally {
      setExporting(false);
    }
  }

  // Exportar Templates
  async function exportTemplates() {
    try {
      setExporting(true);

      const { data, error } = await supabase
        .from('templates')
        .select('*')
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const headers = [
        'ID',
        'Nome',
        'Área',
        'Descrição',
        'Keywords',
        'Pitch Inicial',
        'Perguntas',
        'Validação',
        'Versão',
        'Criado Em',
      ];

      const rows = data?.map(template => [
        template.id,
        template.nome_template,
        template.area_atuacao,
        template.descricao || '',
        template.keywords,
        template.pitch_inicial,
        template.perguntas_qualificacao,
        template.validacao_proposta,
        template.versao,
        new Date(template.criado_em).toLocaleString('pt-BR'),
      ]) || [];

      downloadCSV(headers, rows, 'templates');
      toast.success('Templates exportados!', 'Arquivo baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar templates:', error);
      toast.error('Erro ao exportar', error.message);
    } finally {
      setExporting(false);
    }
  }

  // Exportar Logs
  async function exportLogs() {
    try {
      setExporting(true);

      const { data, error } = await supabase
        .from('logs_sistema')
        .select(`
          *,
          clientes (nome_cliente)
        `)
        .order('criado_em', { ascending: false })
        .limit(1000); // Últimos 1000 logs

      if (error) throw error;

      const headers = ['Data/Hora', 'Tipo', 'Cliente', 'Descrição', 'Metadata'];

      const rows = data?.map(log => [
        new Date(log.criado_em).toLocaleString('pt-BR'),
        log.tipo_evento,
        log.clientes?.nome_cliente || 'Sistema',
        log.descricao || '',
        JSON.stringify(log.metadata || {}),
      ]) || [];

      downloadCSV(headers, rows, 'logs');
      toast.success('Logs exportados!', 'Últimos 1000 logs baixados');
    } catch (error: any) {
      console.error('Erro ao exportar logs:', error);
      toast.error('Erro ao exportar', error.message);
    } finally {
      setExporting(false);
    }
  }

  // Backup Completo
  async function backupCompleto() {
    try {
      setExporting(true);

      // Buscar todos os dados
      const [clientes, templates, logs] = await Promise.all([
        supabase.from('clientes').select('*'),
        supabase.from('templates').select('*'),
        supabase.from('logs_sistema').select('*, clientes (nome_cliente)').limit(1000),
      ]);

      const backup = {
        metadata: {
          data_backup: new Date().toISOString(),
          versao: '1.0',
        },
        clientes: clientes.data || [],
        templates: templates.data || [],
        logs: logs.data || [],
      };

      // Download JSON
      const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `backup-completo-${new Date().toISOString().split('T')[0]}.json`;
      link.click();

      toast.success('Backup completo criado!', 'Arquivo JSON baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao criar backup:', error);
      toast.error('Erro ao criar backup', error.message);
    } finally {
      setExporting(false);
    }
  }

  // Função auxiliar para download CSV
  function downloadCSV(headers: string[], rows: any[][], filename: string) {
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    ].join('\n');

    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  const cards = [
    {
      title: 'Exportar Clientes',
      description: 'Baixar lista completa de clientes em CSV',
      icon: '👥',
      action: exportClientes,
      color: 'blue',
    },
    {
      title: 'Exportar Templates',
      description: 'Baixar templates de prompts em CSV',
      icon: '📄',
      action: exportTemplates,
      color: 'purple',
    },
    {
      title: 'Exportar Logs',
      description: 'Baixar últimos 1000 logs do sistema',
      icon: '📋',
      action: exportLogs,
      color: 'green',
    },
    {
      title: 'Backup Completo',
      description: 'Backup de todos os dados em JSON',
      icon: '💾',
      action: backupCompleto,
      color: 'red',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Configurações e Backup</h1>
        <p className="text-gray-600 mt-1">Exportar e fazer backup dos seus dados</p>
      </div>

      {/* Cards de Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => (
          <div key={card.title} className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
            <div className="flex items-start gap-4">
              <div className={`text-4xl`}>
                {card.icon}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {card.title}
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  {card.description}
                </p>
                <button
                  onClick={card.action}
                  disabled={exporting}
                  className={`
                    px-4 py-2 rounded-lg font-medium text-white
                    bg-${card.color}-600 hover:bg-${card.color}-700
                    disabled:opacity-50 disabled:cursor-not-allowed
                    transition-colors flex items-center gap-2
                  `}
                >
                  {exporting ? (
                    <>
                      <Spinner size="sm" />
                      Exportando...
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Exportar
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Informações */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <svg className="w-6 h-6 text-blue-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <h4 className="font-medium text-blue-900 mb-2">Sobre os backups</h4>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Arquivos CSV podem ser abertos no Excel ou Google Sheets</li>
              <li>• Backup JSON contém todos os dados em formato estruturado</li>
              <li>• Recomendamos fazer backups semanalmente</li>
              <li>• Os arquivos são gerados e baixados diretamente no seu computador</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}