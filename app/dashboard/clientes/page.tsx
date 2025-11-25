// app/dashboard/clientes/page.tsx - CORRIGIDO COM SINCRONIZAÇÃO AUTOMÁTICA
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ClienteCard } from '@/components/clientes/cliente-card';
import { Plus, Search, Loader2, Users, CheckCircle, XCircle } from 'lucide-react';
import type { VwClienteLista } from '@/lib/types';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';

export default function ClientesPage() {
  const router = useRouter();
  const { usuario } = useAuthWithPermissions();

  const [clientes, setClientes] = useState<VwClienteLista[]>([]);
  const [filteredClientes, setFilteredClientes] = useState<VwClienteLista[]>([]);
  const [loading, setLoading] = useState(true);
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
          </p>
        </div>
        <div className="flex gap-2">
          {/* 🔒 Botão Novo Cliente - Apenas para agência */}
          {usuario?.role === 'agencia' && (
            <Button onClick={() => router.push('/dashboard/clientes/novo')}>
              <Plus className="h-4 w-4 mr-2" />
              Novo Cliente
            </Button>
          )}
        </div>
      </div>

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
              className="pl-10"
            />
          </div>

          {/* Stats rápidos */}
          <div className="grid gap-4 grid-cols-1 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                <Users className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{clientes.length}</div>
                <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Conectados</CardTitle>
                <CheckCircle className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clientes.filter(c => c.status_conexao === 'conectado').length}
                </div>
                <p className="text-xs text-muted-foreground">Ativos no momento</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
                <XCircle className="h-4 w-4 text-red-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {clientes.filter(c => c.status_conexao === 'desconectado').length}
                </div>
                <p className="text-xs text-muted-foreground">Inativos</p>
              </CardContent>
            </Card>
          </div>
        </>
      )}

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
              onDelete={usuario?.role === 'agencia' ? handleDelete : undefined}
              userRole={usuario?.role}
            />
          ))}
        </div>
      )}
    </div>
  );
}