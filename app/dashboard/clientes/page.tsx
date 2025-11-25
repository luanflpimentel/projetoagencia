// app/dashboard/clientes/page.tsx - CORRIGIDO COM SINCRONIZAÇÃO AUTOMÁTICA
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClienteCard } from '@/components/clientes/cliente-card';
import { Plus, Search, Loader2, RefreshCw } from 'lucide-react';
import type { VwClienteLista, StatusConexao } from '@/lib/types';

export default function ClientesPage() {
  const router = useRouter();
  
  const [clientes, setClientes] = useState<VwClienteLista[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<VwClienteLista[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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
      console.log('🔄 [FRONTEND] Buscando clientes...');
      const response = await fetch('/api/clientes');

      if (!response.ok) {
        throw new Error('Erro ao buscar clientes');
      }

      const data = await response.json();
      console.log('📦 [FRONTEND] Clientes recebidos:', {
        quantidade: data?.length || 0,
        dados: data
      });

      // Verificar se é um array
      if (!Array.isArray(data)) {
        console.error('❌ [FRONTEND] Resposta não é um array:', data);
        setClientes([]);
        setFilteredClientes([]);
        return;
      }

      setClientes(data);
      setFilteredClientes(data);

      // 🔄 SINCRONIZAR STATUS REAL DA UAZAPI
      // Executar em background sem bloquear a UI
      syncClientesStatus(data);
    } catch (error) {
      console.error('❌ [FRONTEND] Erro:', error);
    } finally {
      setLoading(false);
    }
  };

  // 🔄 Função para sincronizar status real de todos os clientes
  const syncClientesStatus = async (clientesList: VwClienteLista[]) => {
    console.log('🔄 Sincronizando status de', clientesList.length, 'clientes...');
    
    setSyncing(true);
    
    // Verificar status de cada cliente em paralelo
    const promises = clientesList.map(async (cliente) => {
      try {
        const response = await fetch(
          `/api/uazapi/instances/${cliente.nome_instancia}/status`
        );
        
        if (response.ok) {
          const statusData = await response.json();
          const statusReal = (statusData.connected ? 'conectado' : 'desconectado') as StatusConexao;
          
          console.log(`✅ [${cliente.nome_instancia}] Status sincronizado:`, {
            bancoBefore: cliente.status_conexao,
            uazapiAtual: statusReal,
            mudou: cliente.status_conexao !== statusReal
          });
          
          return {
            ...cliente,
            status_conexao: statusReal
          };
        }
        return cliente;
      } catch (error) {
        console.warn(`⚠️ [${cliente.nome_instancia}] Erro ao verificar status:`, error);
        return cliente;
      }
    });

    try {
      const updatedClientes = await Promise.all(promises);
      
      // Verificar se houve mudanças
      const mudancas = updatedClientes.filter((updated, index) => 
        updated.status_conexao !== clientesList[index].status_conexao
      );

      if (mudancas.length > 0) {
        console.log(`📝 ${mudancas.length} cliente(s) tiveram status atualizado`);
        mudancas.forEach(c => {
          console.log(`  - ${c.nome_instancia}: agora ${c.status_conexao}`);
        });
      }
      
      // Atualizar estado com status real
      setClientes(updatedClientes);
      setFilteredClientes(prev => {
        // Manter filtro atual mas atualizar dados
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          return updatedClientes.filter(c => 
            c.nome_cliente.toLowerCase().includes(term) ||
            c.nome_instancia.toLowerCase().includes(term) ||
            c.nome_escritorio.toLowerCase().includes(term)
          );
        }
        return updatedClientes;
      });

      console.log('✅ Sincronização completa!');
    } catch (error) {
      console.error('❌ Erro na sincronização:', error);
    } finally {
      setSyncing(false);
    }
  };

  // 🔄 Função para forçar sincronização manual
  const handleManualSync = async () => {
    console.log('🔄 Sincronização manual iniciada');
    await syncClientesStatus(clientes);
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

      // Atualizar lista
      await fetchClientes();
    } catch (error) {
      console.error('Erro:', error);
      alert('Erro ao desativar cliente');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground">
            Gerencie os escritórios conectados
            {syncing && (
              <span className="ml-2 text-blue-600 text-sm">
                🔄 Sincronizando status...
              </span>
            )}
          </p>
        </div>
        <div className="flex gap-2">
          {/* Botão Atualizar Status */}
          <Button 
            variant="outline" 
            onClick={handleManualSync}
            disabled={syncing}
            title="Atualizar status de todos os clientes"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
            {syncing ? 'Atualizando...' : 'Atualizar Status'}
          </Button>
          
          {/* Botão Novo Cliente */}
          <Button onClick={() => router.push('/dashboard/clientes/novo')}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Cliente
          </Button>
        </div>
      </div>

      {/* Busca */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por nome, instância ou escritório..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold">{clientes.length}</div>
          <div className="text-sm text-muted-foreground">Total de Clientes</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-green-600">
            {clientes.filter(c => c.status_conexao === 'conectado').length}
          </div>
          <div className="text-sm text-muted-foreground">Conectados</div>
        </div>
        <div className="bg-card border rounded-lg p-4">
          <div className="text-2xl font-bold text-red-600">
            {clientes.filter(c => c.status_conexao === 'desconectado').length}
          </div>
          <div className="text-sm text-muted-foreground">Desconectados</div>
        </div>
      </div>

      {/* Lista de clientes */}
      {filteredClientes.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground mb-4">
            {searchTerm 
              ? 'Nenhum cliente encontrado com esse termo' 
              : 'Nenhum cliente cadastrado ainda'}
          </p>
          {!searchTerm && (
            <Button onClick={() => router.push('/dashboard/clientes/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Criar Primeiro Cliente
            </Button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredClientes.map(cliente => (
            <ClienteCard
              key={cliente.id}
              cliente={cliente}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}