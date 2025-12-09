// app/dashboard/clientes/page.tsx - CORRIGIDO COM SINCRONIZAÇÃO AUTOMÁTICA
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClienteCard } from '@/components/clientes/cliente-card';
import { Plus, Search, Loader2, Users, CheckCircle, XCircle, RefreshCw } from 'lucide-react';
import type { VwClienteLista } from '@/lib/types';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';
import { useToast } from '@/components/ui/toast';

export default function ClientesPage() {
  const router = useRouter();
  const { usuario } = useAuthWithPermissions();
  const toast = useToast();

  const [clientes, setClientes] = useState<VwClienteLista[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<VwClienteLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [lastSync, setLastSync] = useState<string | null>(null);

  // Buscar clientes
  useEffect(() => {
    fetchClientes();
  }, []);

  // Filtrar clientes ao digitar
  useEffect(() => {
    if (!searchTerm) {
      setFilteredClientes(clientes);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = clientes.filter(cliente => 
      cliente.nome_cliente.toLowerCase().includes(term) ||
      cliente.nome_instancia.toLowerCase().includes(term) ||
      cliente.nome_escritorio.toLowerCase().includes(term)
    );

    setFilteredClientes(filtered);
  }, [searchTerm, clientes]);

  const fetchClientes = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/clientes');

      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();

      // Verificar se é um array
      if (!Array.isArray(data)) {
        console.error('Resposta não é um array:', data);
        setClientes([]);
        setFilteredClientes([]);
        return;
      }

      setClientes(data);
      setFilteredClientes(data);
    } catch (error) {
      console.error('Erro ao buscar clientes:', error);
    } finally {
      setLoading(false);
    }
  };


  const handleDelete = async (id: string) => {
    if (!confirm('Deseja realmente desativar este cliente?')) {
      return;
    }

    try {
      const response = await fetch(`/api/clientes/${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Erro ao desativar cliente');
      }

      toast.success('Cliente desativado com sucesso');
      await fetchClientes();
    } catch (error) {
      console.error('Erro:', error);
      toast.error('Erro ao desativar cliente');
    }
  };

  const handleSyncStatus = async () => {
    try {
      setSyncing(true);

      const response = await fetch('/api/clientes/sync-all-status', {
        method: 'POST',
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('❌ Erro na sincronização:', errorData);
        throw new Error(errorData.error || 'Erro ao sincronizar status');
      }

      const result = await response.json();

      // Log resumido
      console.log('✅ Sincronização concluída:', {
        total: result.total,
        atualizados: result.updated,
      });

      // Mostrar alterações no console
      const changed = result.results?.filter((r: any) => !r.unchanged) || [];
      if (changed.length > 0) {
        console.log('📝 Clientes atualizados:', changed.map((r: any) =>
          `${r.nome_instancia}: ${r.status_anterior} → ${r.status_novo}`
        ));
      }

      // Atualizar timestamp da última sincronização
      setLastSync(new Date().toLocaleString('pt-BR'));

      // Recarregar lista de clientes
      await fetchClientes();

      // Contar mudanças
      const changedCount = result.results?.filter((r: any) => !r.unchanged).length || 0;

      if (changedCount > 0) {
        toast.success(`${changedCount} cliente(s) atualizado(s) com sucesso`);
      } else {
        toast.info('Todos os clientes já estão sincronizados');
      }
    } catch (error: any) {
      console.error('💥 Erro ao sincronizar:', error);
      toast.error('Erro ao sincronizar status. Veja o console para detalhes.');
    } finally {
      setSyncing(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie os escritórios conectados</p>
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

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os escritórios conectados ao sistema
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botão Atualizar Dados */}
          <Button
            onClick={handleSyncStatus}
            disabled={syncing}
            variant="outline"
            className="shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Sincronizando...' : 'Atualizar Dados'}
          </Button>

          {/* 🔒 Botão Novo Cliente - Apenas para agência */}
          {usuario?.role === 'agencia' && (
            <Button onClick={() => router.push('/dashboard/clientes/novo')} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>
      </div>

      {/* Timestamp da última sincronização */}
      {lastSync && (
        <div className="text-sm text-muted-foreground flex items-center gap-2">
          <span>Última atualização: {lastSync}</span>
        </div>
      )}

      {/* 🔒 Busca e Stats - Apenas para agência */}
      {usuario?.role === 'agencia' && (
        <>
          {/* Busca */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, instância ou escritório..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-11 shadow-sm"
            />
          </div>

          {/* Stats rápidos */}
          <div className="grid gap-6 grid-cols-1 md:grid-cols-3">
            <Card className="hover-lift">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-foreground">{clientes.length}</div>
                <p className="text-xs text-muted-foreground mt-2">Clientes cadastrados</p>
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
                <div className="text-3xl font-bold text-foreground">
                  {clientes.filter(c => c.status_conexao === 'conectado').length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Ativos no momento</p>
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
                <div className="text-3xl font-bold text-foreground">
                  {clientes.filter(c => c.status_conexao === 'desconectado').length}
                </div>
                <p className="text-xs text-muted-foreground mt-2">Inativos no momento</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {/* Lista de clientes */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-16">
          <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
          <p className="text-muted-foreground mb-6 text-lg">
            {searchTerm
              ? 'Nenhum cliente encontrado com esse termo'
              : 'Nenhum cliente cadastrado ainda'}
          </p>
          {!searchTerm && usuario?.role === 'agencia' && (
            <Button onClick={() => router.push('/dashboard/clientes/novo')} className="shadow-sm">
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredClientes.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onDelete={usuario?.role === 'agencia' ? handleDelete : undefined}
              userRole={usuario?.role}
            />
          ))}
        </div>
      )}
    </div>
  );
}