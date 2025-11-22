// app/dashboard/logs/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Spinner, EmptyState } from '@/components/ui/loading';

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
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Logs do Sistema</h1>
          <p className="text-gray-600 mt-1">Histórico completo de atividades</p>
        </div>
        <button
          onClick={exportToCSV}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Exportar CSV
        </button>
      </div>

      <div className="bg-white rounded-lg shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por descrição, cliente..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Filtrar por tipo
            </label>
            <select
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as FilterType);
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
      </div>

      {loading ? (
        <div className="bg-white rounded-lg shadow p-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : filteredLogs.length === 0 ? (
        <div className="bg-white rounded-lg shadow">
          <EmptyState
            icon={
              <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            }
            title="Nenhum log encontrado"
            description={searchTerm ? "Tente alterar os filtros de busca" : "Ainda não há logs registrados no sistema"}
          />
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Data/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tipo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Descrição
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => {
                  const dataFormatada = new Date(log.criado_em).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    year: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  return (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {dataFormatada}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${tipoBadges[log.tipo_evento] || 'bg-gray-100 text-gray-800'}`}>
                          <span className="mr-1">{tipoIcons[log.tipo_evento] || '📋'}</span>
                          {log.tipo_evento.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {log.clientes?.[0]?.nome_cliente || 'Sistema'}  {/* ← CORRIGIDO: [0] */}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        {log.descricao}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-4 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Página <span className="font-medium">{currentPage}</span> de{' '}
                <span className="font-medium">{totalPages}</span>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Anterior
                </button>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Próxima
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}