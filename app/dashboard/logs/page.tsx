// app/dashboard/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner, EmptyState } from '@/components/ui/loading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Download, Search, FileText, Activity } from 'lucide-react';
import ProtegerRota from '@/components/auth/ProtegerRota';

interface Log {
  id: string;
  tipo_evento: string;
  descricao: string;
  metadata: any;
  criado_em: string;
  clientes: {
    nome_cliente: string;
  }[] | null;  // ← CORRIGIDO: array
}

type FilterType = 'todos' | 'conexao' | 'desconexao' | 'prompt_atualizado' | 'cliente_criado' | 'cliente_editado' | 'erro';

export default function LogsPage() {
  return (
    <ProtegerRota somenteAgencia>
      <LogsPageContent />
    </ProtegerRota>
  );
}

function LogsPageContent() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterType>('todos');
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadLogs();
  }, [filter, currentPage]);

  async function loadLogs() {
    try {
      setLoading(true);

      let query = supabase
        .from('logs_sistema')
        .select(`
          id,
          tipo_evento,
          descricao,
          metadata,
          criado_em,
          clientes (nome_cliente)
        `, { count: 'exact' })
        .order('criado_em', { ascending: false });

      if (filter !== 'todos') {
        query = query.eq('tipo_evento', filter);
      }

      const from = (currentPage - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;
      query = query.range(from, to);

      const { data, error, count } = await query;

      if (error) throw error;

      setLogs(data as Log[] || []);
      setTotalPages(Math.ceil((count || 0) / itemsPerPage));
    } catch (error) {
      console.error('Erro ao carregar logs:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredLogs = logs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    const clienteNome = log.clientes?.[0]?.nome_cliente || '';  // ← CORRIGIDO: [0]
    return (
      log.descricao?.toLowerCase().includes(searchLower) ||
      clienteNome.toLowerCase().includes(searchLower) ||
      log.tipo_evento?.toLowerCase().includes(searchLower)
    );
  });

  async function exportToCSV() {
    try {
      const { data, error } = await supabase
        .from('logs_sistema')
        .select(`
          tipo_evento,
          descricao,
          criado_em,
          clientes (nome_cliente)
        `)
        .order('criado_em', { ascending: false });

      if (error) throw error;

      const headers = ['Data/Hora', 'Tipo', 'Cliente', 'Descrição'];
      const rows = (data as Log[] || []).map(log => [
        new Date(log.criado_em).toLocaleString('pt-BR'),
        log.tipo_evento,
        log.clientes?.[0]?.nome_cliente || 'Sistema',  // ← CORRIGIDO: [0]
        log.descricao || '',
      ]);

      const csvContent = [
        headers.join(','),
        ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
      ].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `logs-${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
    } catch (error) {
      console.error('Erro ao exportar logs:', error);
    }
  }

  const tipoIcons: Record<string, string> = {
    conexao: '🟢',
    desconexao: '🔴',
    prompt_atualizado: '✏️',
    cliente_criado: '➕',
    cliente_editado: '📝',
    erro: '❌',
  };

  const tipoBadges: Record<string, string> = {
    conexao: 'bg-green-100 text-green-800',
    desconexao: 'bg-red-100 text-red-800',
    prompt_atualizado: 'bg-blue-100 text-blue-800',
    cliente_criado: 'bg-purple-100 text-purple-800',
    cliente_editado: 'bg-yellow-100 text-yellow-800',
    erro: 'bg-red-100 text-red-800',
  };

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Logs do Sistema</h1>
          <p className="text-muted-foreground mt-1">Histórico completo de atividades</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 font-medium"
        >
          <Download className="h-5 w-5" />
          Exportar CSV
        </button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Buscar
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Buscar por descrição, cliente..."
                  className="pl-10 w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground shadow-sm transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Filtrar por tipo
              </label>
              <select
                value={filter}
                onChange={(e) => {
                  setFilter(e.target.value as FilterType);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2.5 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground shadow-sm transition-all"
              >
                <option value="todos">Todos os tipos</option>
                <option value="conexao">Conexões</option>
                <option value="desconexao">Desconexões</option>
                <option value="prompt_atualizado">Prompts Atualizados</option>
                <option value="cliente_criado">Clientes Criados</option>
                <option value="cliente_editado">Clientes Editados</option>
                <option value="erro">Erros</option>
              </select>
            </div>
          </div>
        </CardContent>
      </Card>

      {loading ? (
        <Card>
          <CardContent className="py-16 flex justify-center">
            <Spinner size="lg" />
          </CardContent>
        </Card>
      ) : filteredLogs.length === 0 ? (
        <Card>
          <CardContent className="py-16">
            <div className="text-center">
              <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-semibold text-foreground mb-2">Nenhum log encontrado</h3>
              <p className="text-muted-foreground">
                {searchTerm ? "Tente alterar os filtros de busca" : "Ainda não há logs registrados no sistema"}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-border">
              <thead className="bg-muted/50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="bg-card divide-y divide-border">
                {filteredLogs.map((log) => {
                  const dataFormatada = new Date(log.criado_em).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const getBadgeVariant = (tipo: string) => {
                    if (tipo === 'conexao') return 'success';
                    if (tipo === 'desconexao') return 'destructive';
                    if (tipo === 'prompt_atualizado') return 'info';
                    if (tipo === 'cliente_criado') return 'default';
                    if (tipo === 'cliente_editado') return 'warning';
                    if (tipo === 'erro') return 'destructive';
                    return 'secondary';
                  };

                  return (
                    <tr key={log.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-mono">
                        {dataFormatada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge variant={getBadgeVariant(log.tipo_evento)}>
                          {log.tipo_evento.replace(/_/g, ' ')}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground font-medium">
                        {log.clientes?.[0]?.nome_cliente || 'Sistema'}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {log.descricao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-muted/30 px-6 py-4 flex items-center justify-between border-t border-border">
              <div className="text-sm text-foreground">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-border bg-card rounded-lg text-sm font-medium text-foreground hover:bg-accent/5 hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-border bg-card rounded-lg text-sm font-medium text-foreground hover:bg-accent/5 hover:border-accent transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}