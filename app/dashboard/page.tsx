// app/dashboard/page.tsx - VERSÃO CORRIGIDA
'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Users, CheckCircle, XCircle, Plus, FileText, Activity, RefreshCw } from 'lucide-react';
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
        <div>
          <h1>Dashboard</h1>
          <p className="text-muted-foreground">Visão geral do sistema</p>
        </div>
        <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="animate-pulse">
              <CardHeader>
                <div className="h-4 bg-muted rounded w-1/2 mb-2"></div>
              </CardHeader>
              <CardContent>
                <div className="h-8 bg-muted rounded w-1/4"></div>
              </CardContent>
            </Card>
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
        <h1>Dashboard</h1>
        <p className="text-muted-foreground">
          Bem-vindo ao sistema Agência Talismã
        </p>
      </div>

      {/* Alertas */}
      {alertasDesconectados.length > 0 && (
        <Card className="border-l-4 border-l-yellow-500 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <svg className="h-5 w-5 text-yellow-500 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <div>
                <h3 className="text-sm font-medium">
                  Atenção: {alertasDesconectados.length} cliente(s) desconectado(s) há mais de 24h
                </h3>
                <ul className="mt-2 text-sm space-y-1 list-disc list-inside">
                  {alertasDesconectados.map(cliente => (
                    <li key={cliente.id}>{cliente.nome_cliente}</li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-1">
              <Link href="/dashboard/clientes" className="text-primary hover:underline">
                Ver todos →
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conectados</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesConectados}</div>
            <p className="text-xs text-muted-foreground">{percentualConectados}% do total</p>
            <div className="mt-3 bg-muted rounded-full h-2">
              <div
                className="bg-green-600 rounded-full h-2 transition-all"
                style={{ width: `${percentualConectados}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
            <XCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.clientesDesconectados}</div>
            <p className="text-xs text-muted-foreground">{100 - percentualConectados}% do total</p>
            <div className="mt-3 bg-muted rounded-full h-2">
              <div
                className="bg-red-600 rounded-full h-2 transition-all"
                style={{ width: `${100 - percentualConectados}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 grid-cols-1 lg:grid-cols-2">
        {/* Últimas Atividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimas Atividades</CardTitle>
              <Link href="/dashboard/logs" className="text-sm text-primary hover:underline">
                Ver todos →
              </Link>
            </div>
            <CardDescription>Últimas atividades no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.ultimasAtividades.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">Nenhuma atividade recente</p>
            ) : (
              <div className="space-y-3">
                {stats.ultimasAtividades.map((atividade) => {
                  const dataFormatada = new Date(atividade.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const getColor = () => {
                    if (atividade.tipo === 'conexao') return 'bg-green-500';
                    if (atividade.tipo === 'desconexao') return 'bg-red-500';
                    if (atividade.tipo.includes('atualizado')) return 'bg-blue-500';
                    if (atividade.tipo.includes('criado')) return 'bg-purple-500';
                    return 'bg-muted';
                  };

                  return (
                    <div key={atividade.id} className="flex items-center space-x-4">
                      <div className={`w-2 h-2 ${getColor()} rounded-full`}></div>
                      <div className="flex-1">
                        <p className="text-sm">{atividade.clienteNome}</p>
                        <p className="text-sm text-muted-foreground">{atividade.descricao}</p>
                        <p className="text-xs text-muted-foreground">{dataFormatada}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Ações Rápidas</CardTitle>
            <CardDescription>Tarefas e atalhos comuns</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Link
                href="/dashboard/clientes/novo"
                className="w-full p-3 text-left rounded-lg bg-blue-50 hover:bg-blue-100 transition-colors flex items-center space-x-3"
              >
                <Plus className="h-4 w-4 text-blue-600" />
                <span>Adicionar Novo Cliente</span>
              </Link>

              <Link
                href="/dashboard/templates"
                className="w-full p-3 text-left rounded-lg bg-purple-50 hover:bg-purple-100 transition-colors flex items-center space-x-3"
              >
                <FileText className="h-4 w-4 text-purple-600" />
                <span>Gerenciar Templates</span>
              </Link>

              <Link
                href="/dashboard/logs"
                className="w-full p-3 text-left rounded-lg bg-green-50 hover:bg-green-100 transition-colors flex items-center space-x-3"
              >
                <Activity className="h-4 w-4 text-green-600" />
                <span>Ver Logs do Sistema</span>
              </Link>

              <button
                onClick={loadDashboardData}
                className="w-full p-3 text-left rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors flex items-center space-x-3"
              >
                <RefreshCw className="h-4 w-4 text-gray-600" />
                <span>Atualizar Dashboard</span>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}