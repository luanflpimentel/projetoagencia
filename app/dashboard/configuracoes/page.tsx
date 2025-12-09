// app/dashboard/configuracoes/page.tsx - Backup e Export
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from '@/components/ui/toast';
import { Spinner } from '@/components/ui/loading';
import { Card } from '@/components/ui/card';
import { Download, Users, FileText, Activity, Database, Info } from 'lucide-react';

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
      toast.success('Clientes exportados! Arquivo baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar clientes:', error);
      toast.error(`Erro ao exportar: ${error.message}`);
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
      toast.success('Templates exportados! Arquivo baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao exportar templates:', error);
      toast.error(`Erro ao exportar: ${error.message}`);
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
      toast.success('Logs exportados! Últimos 1000 logs baixados');
    } catch (error: any) {
      console.error('Erro ao exportar logs:', error);
      toast.error(`Erro ao exportar: ${error.message}`);
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

      toast.success('Backup completo criado! Arquivo JSON baixado com sucesso');
    } catch (error: any) {
      console.error('Erro ao criar backup:', error);
      toast.error(`Erro ao criar backup: ${error.message}`);
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
      icon: Users,
      action: exportClientes,
      bgColor: 'bg-blue-100',
      iconColor: 'text-blue-600',
      buttonColor: 'bg-blue-600 hover:bg-blue-700',
    },
    {
      title: 'Exportar Templates',
      description: 'Baixar templates de prompts em CSV',
      icon: FileText,
      action: exportTemplates,
      bgColor: 'bg-purple-100',
      iconColor: 'text-purple-600',
      buttonColor: 'bg-purple-600 hover:bg-purple-700',
    },
    {
      title: 'Exportar Logs',
      description: 'Baixar últimos 1000 logs do sistema',
      icon: Activity,
      action: exportLogs,
      bgColor: 'bg-green-100',
      iconColor: 'text-green-600',
      buttonColor: 'bg-green-600 hover:bg-green-700',
    },
    {
      title: 'Backup Completo',
      description: 'Backup de todos os dados em JSON',
      icon: Database,
      action: backupCompleto,
      bgColor: 'bg-red-100',
      iconColor: 'text-red-600',
      buttonColor: 'bg-red-600 hover:bg-red-700',
    },
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Configurações e Backup</h1>
        <p className="text-muted-foreground mt-1">Exportar e fazer backup dos seus dados</p>
      </div>

      {/* Cards de Export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {cards.map((card) => {
          const IconComponent = card.icon;
          return (
            <Card key={card.title} className="p-6 hover-lift transition-all">
              <div className="flex items-start gap-4">
                <div className={`w-12 h-12 rounded-lg ${card.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <IconComponent className={`h-6 w-6 ${card.iconColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-foreground mb-2">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm mb-4">
                    {card.description}
                  </p>
                  <button
                    onClick={card.action}
                    disabled={exporting}
                    className={`
                      px-4 py-2 rounded-lg font-medium text-white shadow-sm
                      ${card.buttonColor}
                      disabled:opacity-50 disabled:cursor-not-allowed
                      transition-all flex items-center gap-2
                    `}
                  >
                    {exporting ? (
                      <>
                        <Spinner size="sm" />
                        Exportando...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Exportar
                      </>
                    )}
                  </button>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {/* Informações */}
      <Card className="p-6 bg-info/5 border-info/20">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
            <Info className="h-5 w-5 text-info" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-foreground mb-3">Sobre os backups</h4>
            <ul className="text-sm text-muted-foreground space-y-2">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 flex-shrink-0"></span>
                <span>Arquivos CSV podem ser abertos no Excel ou Google Sheets</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 flex-shrink-0"></span>
                <span>Backup JSON contém todos os dados em formato estruturado</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 flex-shrink-0"></span>
                <span>Recomendamos fazer backups semanalmente</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-info mt-1.5 flex-shrink-0"></span>
                <span>Os arquivos são gerados e baixados diretamente no seu computador</span>
              </li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}