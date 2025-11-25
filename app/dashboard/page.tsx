// app/dashboard/page.tsx - VERSÃO CORRIGIDA
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ProtegerRota from '@/components/auth/ProtegerRota';

interface DashboardStats {
  totalClientes: number;
  clientesConectados: number;
  clientesDesconectados: number;
  ultimasAtividades: Array<{
    id: string;
    tipo: string;
    descricao: string;
    clienteNome: string;
    timestamp: string;
  }>;
}

export default function DashboardPage() {
  return (
    <ProtegerRota somenteAgencia>
      <DashboardPageContent />
    </ProtegerRota>
  );
}

function DashboardPageContent() {
  const [stats, setStats] = useState<DashboardStats>({
    totalClientes: 0,
    clientesConectados: 0,
    clientesDesconectados: 0,
    ultimasAtividades: [],
  });
  const [loading, setLoading] = useState(true);
  const [alertasDesconectados, setAlertasDesconectados] = useState<any[]>([]);

  useEffect(() => {
    loadDashboardData();
  }, []);

  async function loadDashboardData() {
    try {
      setLoading(true);

      // Buscar estatísticas de clientes
      const { data: clientes, error: clientesError } = await supabase
        .from('clientes')
        .select('id, nome_cliente, status_conexao, ultima_conexao')
        .eq('ativo', true);

      if (clientesError) throw clientesError;

      const totalClientes = clientes?.length || 0;
      const clientesConectados = clientes?.filter(c => c.status_conexao === 'conectado').length || 0;
      const clientesDesconectados = totalClientes - clientesConectados;

      // ✅ CORRIGIDO: Especificar relacionamento explícito
      const { data: logs, error: logsError } = await supabase
        .from('logs_sistema')
        .select(`
          *,
          clientes!cliente_id(*)
        `)
        .order('criado_em', { ascending: false })
        .limit(5);

      if (logsError) throw logsError;

      // Processar logs com tratamento robusto de tipos
      const ultimasAtividades = (logs || []).map(log => {
        // Extrair nome do cliente de forma type-safe
        let clienteNome = 'Sistema';
        
        if (log.clientes) {
          // Se for array, pega o primeiro item
          if (Array.isArray(log.clientes) && log.clientes.length > 0) {
            const primeiroCliente = log.clientes[0] as { nome_cliente?: string };
            clienteNome = primeiroCliente.nome_cliente || 'Sistema';
          } 
          // Se for objeto único
          else if (!Array.isArray(log.clientes) && typeof log.clientes === 'object') {
            const clienteObj = log.clientes as { nome_cliente?: string };
            clienteNome = clienteObj.nome_cliente || 'Sistema';
          }
        }

        return {
          id: log.id as string,
          tipo: log.tipo_evento as string,
          descricao: (log.descricao as string) || '',
          clienteNome,
          timestamp: log.criado_em as string,
        };
      });

      // Identificar clientes desconectados há mais de 24h
      const agora = new Date();
      const umDiaAtras = new Date(agora.getTime() - 24 * 60 * 60 * 1000);
      
      const alertas = clientes?.filter(c => {
        if (c.status_conexao === 'desconectado' && c.ultima_conexao) {
          const ultimaConexao = new Date(c.ultima_conexao);
          return ultimaConexao < umDiaAtras;
        }
        return false;
      }) || [];

      setStats({
        totalClientes,
        clientesConectados,
        clientesDesconectados,
        ultimasAtividades,
      });

      setAlertasDesconectados(alertas);
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-white rounded-lg shadow p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
              <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const percentualConectados = stats.totalClientes > 0
    ? Math.round((stats.clientesConectados / stats.totalClientes) * 100)
    : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">Visão geral do sistema Agência Talismã</p>
      </div>

      {/* Alertas */}
      {alertasDesconectados.length > 0 && (
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-yellow-800">
                Atenção: {alertasDesconectados.length} cliente(s) desconectado(s) há mais de 24h
              </h3>
              <div className="mt-2 text-sm text-yellow-700">
                <ul className="list-disc list-inside space-y-1">
                  {alertasDesconectados.map(cliente => (
                    <li key={cliente.id}>{cliente.nome_cliente}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Total de Clientes */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total de Clientes</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">{stats.totalClientes}</p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <Link href="/dashboard/clientes" className="text-sm text-blue-600 hover:text-blue-700 mt-4 inline-block">
            Ver todos →
          </Link>
        </div>

        {/* Clientes Conectados */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conectados</p>
              <p className="text-3xl font-bold text-green-600 mt-2">{stats.clientesConectados}</p>
              <p className="text-sm text-gray-500 mt-1">{percentualConectados}% do total</p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-600 rounded-full h-2 transition-all"
                style={{ width: `${percentualConectados}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Clientes Desconectados */}
        <div className="bg-white rounded-lg shadow p-6 hover:shadow-lg transition-shadow">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Desconectados</p>
              <p className="text-3xl font-bold text-red-600 mt-2">{stats.clientesDesconectados}</p>
              <p className="text-sm text-gray-500 mt-1">{100 - percentualConectados}% do total</p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="mt-4">
            <div className="bg-gray-200 rounded-full h-2">
              <div 
                className="bg-red-600 rounded-full h-2 transition-all"
                style={{ width: `${100 - percentualConectados}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Últimas Atividades */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Últimas Atividades</h2>
            <Link href="/dashboard/logs" className="text-sm text-blue-600 hover:text-blue-700">
              Ver todos →
            </Link>
          </div>
        </div>
        <div className="p-6">
          {stats.ultimasAtividades.length === 0 ? (
            <p className="text-gray-500 text-center py-8">Nenhuma atividade recente</p>
          ) : (
            <div className="space-y-4">
              {stats.ultimasAtividades.map((atividade) => {
                const dataFormatada = new Date(atividade.timestamp).toLocaleString('pt-BR', {
                  day: '2-digit',
                  month: '2-digit',
                  hour: '2-digit',
                  minute: '2-digit',
                });

                const tipoIcon = atividade.tipo === 'conexao' ? '🟢' :
                               atividade.tipo === 'desconexao' ? '🔴' :
                               atividade.tipo === 'prompt_atualizado' ? '✏️' :
                               atividade.tipo === 'cliente_criado' ? '➕' :
                               atividade.tipo === 'cliente_editado' ? '📝' : '📋';

                return (
                  <div key={atividade.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors">
                    <span className="text-2xl">{tipoIcon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900">
                        {atividade.clienteNome}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {atividade.descricao}
                      </p>
                      <p className="text-xs text-gray-400 mt-1">
                        {dataFormatada}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Link
            href="/dashboard/clientes/novo"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Novo Cliente</span>
            </div>
          </Link>

          <Link
            href="/dashboard/templates"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Templates</span>
            </div>
          </Link>

          <Link
            href="/dashboard/logs"
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Ver Logs</span>
            </div>
          </Link>

          <button
            onClick={loadDashboardData}
            className="flex items-center justify-center p-4 border-2 border-dashed border-gray-300 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors"
          >
            <div className="text-center">
              <svg className="mx-auto h-8 w-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span className="mt-2 block text-sm font-medium text-gray-900">Atualizar</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}