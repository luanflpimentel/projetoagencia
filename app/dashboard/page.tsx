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

    // Detectar visibilidade da página
    const handleVisibilityChange = () => {
      if (!document.hidden && !loading) {
        // Página ficou ativa - atualizar dados
        loadDashboardData();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
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
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Visão geral do sistema</p>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
          {[1, 2, 3].map(i => (
            <Card key={i} className="skeleton">
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
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Bem-vindo ao sistema Agência Talismã
        </p>
      </div>

      {/* Alertas */}
      {alertasDesconectados.length > 0 && (
        <Card className="border-l-4 border-l-warning bg-yellow-50 dark:bg-yellow-950/20">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-warning/10 flex items-center justify-center flex-shrink-0">
                <svg className="h-5 w-5 text-warning" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-foreground mb-2">
                  Atenção: {alertasDesconectados.length} cliente(s) desconectado(s) há mais de 24h
                </h3>
                <ul className="text-sm space-y-1.5">
                  {alertasDesconectados.map(cliente => (
                    <li key={cliente.id} className="flex items-center gap-2 text-muted-foreground">
                      <span className="w-1.5 h-1.5 rounded-full bg-warning"></span>
                      {cliente.nome_cliente}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Cards de Estatísticas */}
      <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
        <Card className="hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.totalClientes}</div>
            <p className="text-xs text-muted-foreground mt-2">
              <Link href="/dashboard/clientes" className="text-accent hover:text-accent-hover font-medium inline-flex items-center gap-1 transition-colors">
                Ver todos
                <span>→</span>
              </Link>
            </p>
          </CardContent>
        </Card>

        <Card className="hover-lift border-l-4 border-l-success">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Conectados</CardTitle>
            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="h-5 w-5 text-success" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.clientesConectados}</div>
            <p className="text-xs text-muted-foreground mb-3">{percentualConectados}% do total</p>
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-success rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${percentualConectados}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="hover-lift border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Desconectados</CardTitle>
            <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
              <XCircle className="h-5 w-5 text-destructive" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{stats.clientesDesconectados}</div>
            <p className="text-xs text-muted-foreground mb-3">{100 - percentualConectados}% do total</p>
            <div className="bg-muted rounded-full h-2 overflow-hidden">
              <div
                className="bg-destructive rounded-full h-2 transition-all duration-500 ease-out"
                style={{ width: `${100 - percentualConectados}%` }}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-2">
        {/* Últimas Atividades */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Últimas Atividades</CardTitle>
              <Link href="/dashboard/logs" className="text-sm text-accent hover:text-accent-hover font-medium inline-flex items-center gap-1 transition-colors">
                Ver todos
                <span>→</span>
              </Link>
            </div>
            <CardDescription>Atividades recentes no sistema</CardDescription>
          </CardHeader>
          <CardContent>
            {stats.ultimasAtividades.length === 0 ? (
              <div className="text-center py-12">
                <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-3 opacity-50" />
                <p className="text-muted-foreground text-sm">Nenhuma atividade recente</p>
              </div>
            ) : (
              <div className="space-y-4">
                {stats.ultimasAtividades.map((atividade) => {
                  const dataFormatada = new Date(atividade.timestamp).toLocaleString('pt-BR', {
                    day: '2-digit',
                    month: '2-digit',
                    hour: '2-digit',
                    minute: '2-digit',
                  });

                  const getColor = () => {
                    if (atividade.tipo === 'conexao') return 'bg-success';
                    if (atividade.tipo === 'desconexao') return 'bg-destructive';
                    if (atividade.tipo.includes('atualizado')) return 'bg-accent';
                    if (atividade.tipo.includes('criado')) return 'bg-purple-500';
                    return 'bg-muted-foreground';
                  };

                  return (
                    <div key={atividade.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors">
                      <div className={`w-2 h-2 ${getColor()} rounded-full mt-2 flex-shrink-0`}></div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{atividade.clienteNome}</p>
                        <p className="text-sm text-muted-foreground mt-0.5">{atividade.descricao}</p>
                        <p className="text-xs text-muted-foreground mt-1">{dataFormatada}</p>
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
            <div className="space-y-3">
              <Link
                href="/dashboard/clientes/novo"
                className="group w-full p-4 text-left rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-accent transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center group-hover:bg-blue-200 transition-colors">
                  <Plus className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Adicionar Novo Cliente</p>
                  <p className="text-xs text-muted-foreground">Cadastrar um novo cliente no sistema</p>
                </div>
              </Link>

              <Link
                href="/dashboard/templates"
                className="group w-full p-4 text-left rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-accent transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center group-hover:bg-purple-200 transition-colors">
                  <FileText className="h-5 w-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Gerenciar Templates</p>
                  <p className="text-xs text-muted-foreground">Criar e editar templates de prompts</p>
                </div>
              </Link>

              <Link
                href="/dashboard/logs"
                className="group w-full p-4 text-left rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-accent transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center group-hover:bg-green-200 transition-colors">
                  <Activity className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Ver Logs do Sistema</p>
                  <p className="text-xs text-muted-foreground">Acompanhar atividades e eventos</p>
                </div>
              </Link>

              <button
                onClick={loadDashboardData}
                className="group w-full p-4 text-left rounded-lg border border-border bg-card hover:bg-accent/5 hover:border-accent transition-all flex items-center gap-3"
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center group-hover:bg-gray-200 transition-colors">
                  <RefreshCw className="h-5 w-5 text-gray-600" />
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">Atualizar Dashboard</p>
                  <p className="text-xs text-muted-foreground">Recarregar dados do dashboard</p>
                </div>
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}