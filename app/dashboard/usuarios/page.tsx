// app/dashboard/usuarios/page.tsx - VERSÃO COM SERVER ACTION
'use client';

import FormEditarUsuario from '@/components/usuarios/FormEditarUsuario';
import FormNovoUsuario from '@/components/usuarios/FormNovoUsuario';
import ModalConfirmacao from '@/components/ui/modal-confirmacao';
import { useToast } from '@/components/ui/toast';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useEffect, useState } from 'react';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';
import type { Usuario } from '@/lib/types';
import { toggleUsuarioAtivo } from '@/app/actions/usuarios'; // ← NOVA IMPORT
import ProtegerRota from '@/components/auth/ProtegerRota';
import { Users, UserCheck, UserX, Shield } from 'lucide-react';

export default function UsuariosPage() {
  return (
    <ProtegerRota somenteAgencia>
      <UsuariosPageContent />
    </ProtegerRota>
  );
}

function UsuariosPageContent() {
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<Usuario | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [filteredUsuarios, setFilteredUsuarios] = useState<Usuario[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [modalConfirmacao, setModalConfirmacao] = useState<{
    isOpen: boolean;
    usuario: Usuario | null;
    novoStatus: boolean;
  }>({
    isOpen: false,
    usuario: null,
    novoStatus: false
  });
  
  const { success, error: errorToast, warning } = useToast();
  const { permissoes, usuario: usuarioAuth } = useAuthWithPermissions();

  // Definir usuário logado quando o auth carregar
  useEffect(() => {
    if (usuarioAuth) {
      setUsuarioLogado(usuarioAuth);
    }
  }, [usuarioAuth]);

  useEffect(() => {
    loadUsuarios();
  }, []);

  // Filtrar usuários baseado no termo de busca
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredUsuarios(usuarios);
      return;
    }

    const term = searchTerm.toLowerCase();
    const filtered = usuarios.filter(usuario =>
      usuario.email.toLowerCase().includes(term) ||
      (usuario.nome_completo?.toLowerCase().includes(term)) ||
      (usuario.role?.toLowerCase().includes(term))
    );

    setFilteredUsuarios(filtered);
  }, [searchTerm, usuarios]);

  async function loadUsuarios() {
    try {
      setLoading(true);
      setError(null);

      // Chamar API que verifica permissões e retorna usuários apropriados
      const response = await fetch('/api/usuarios/listar');
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao buscar usuários');
      }

      const data = await response.json();
      const usuariosData = (data || []).map((u: any) => ({
        ...u,
        avatar_url: undefined,
        telefone: undefined,
        criado_por: undefined,
        atualizado_por: undefined,
      })) as Usuario[];

      setUsuarios(usuariosData);

    } catch (err: any) {
      console.error('❌ [LOAD] Erro:', err);
      setError(err.message || 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  }

  function abrirModalToggleAtivo(usuario: Usuario, novoStatus: boolean) {
    if (usuario.id === usuarioLogado?.id) {
      warning('Você não pode desativar sua própria conta!');
      return;
    }

    if (!usuarioLogado?.id) {
      errorToast('Usuário logado não identificado. Faça login novamente.');
      return;
    }

    setModalConfirmacao({
      isOpen: true,
      usuario,
      novoStatus
    });
  }

  // ✅ VERSÃO COM SERVER ACTION - ULTRA SIMPLES!
  async function confirmarToggleAtivo() {
    const { usuario, novoStatus } = modalConfirmacao;
    
    if (!usuario || !usuarioLogado?.id) return;

    const acao = novoStatus ? 'ativar' : 'desativar';
    console.log('[CLIENT] Chamando server action...');

    try {
      setProcessando(true);

      // ✅ Chama função do SERVIDOR
      const result = await toggleUsuarioAtivo(
        usuario.id,
        novoStatus,
        usuarioLogado.id
      );

      if (!result.success) {
        throw new Error(result.error || 'Erro desconhecido');
      }

      console.log('[CLIENT] Sucesso!');

      // Atualizar estado local
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(u => 
          u.id === usuario.id 
            ? { ...u, ativo: novoStatus }
            : u
        )
      );

      success(`Usuário ${acao}do com sucesso!`);
      setModalConfirmacao({ isOpen: false, usuario: null, novoStatus: false });

      // Recarregar lista para garantir
      setTimeout(() => loadUsuarios(), 500);

    } catch (err: any) {
      console.error('[CLIENT] Erro:', err);
      errorToast(`Erro ao ${acao} usuário: ${err.message}`);
      loadUsuarios();
    } finally {
      setProcessando(false);
    }
  }

  // ... resto do código igual (renderização, etc)
  
  if (loading && usuarios.length === 0) {
    return (
      <div className="space-y-8 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
          <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
        </div>
        <div className="grid gap-6 grid-cols-1 md:grid-cols-4">
          {[1, 2, 3, 4].map(i => (
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

  if (error) {
    return (
      <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-6">
        <h2 className="text-xl font-bold text-destructive mb-2">Erro ao carregar usuários</h2>
        <p className="text-destructive/90 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              loadUsuarios();
            }}
            className="px-4 py-2 bg-destructive text-destructive-foreground rounded-lg hover:bg-destructive/90"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-secondary/80"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  const { usuario: usuarioModal, novoStatus } = modalConfirmacao;
  const acao = novoStatus ? 'ativar' : 'desativar';

  return (
    <>
      {usuarioModal && (
        <ModalConfirmacao
          isOpen={modalConfirmacao.isOpen}
          onClose={() => setModalConfirmacao({ isOpen: false, usuario: null, novoStatus: false })}
          onConfirm={confirmarToggleAtivo}
          title={`${novoStatus ? 'Ativar' : 'Desativar'} Usuário`}
          message={`Tem certeza que deseja ${acao} o usuário "${usuarioModal.nome_completo || usuarioModal.email}"?\n\n${novoStatus ? '✅ O usuário poderá fazer login novamente.' : '⚠️ O usuário não poderá mais fazer login.'}`}
          confirmText={novoStatus ? 'Sim, Ativar' : 'Sim, Desativar'}
          cancelText="Cancelar"
          type={novoStatus ? 'success' : 'danger'}
          isLoading={processando}
        />
      )}

      <div className="space-y-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Gestão de Usuários</h1>
            <p className="text-muted-foreground mt-1">Gerencie os usuários do sistema</p>
          </div>
          {permissoes?.pode_criar_usuarios && (
            <button
              onClick={() => setMostrarFormNovo(true)}
              disabled={processando}
              className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-all shadow-sm flex items-center gap-2 disabled:opacity-50 font-medium"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Novo Usuário</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="hover-lift">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total de Usuários</CardTitle>
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                <Users className="h-5 w-5 text-blue-600" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">{usuarios.length}</div>
              <p className="text-xs text-muted-foreground mt-2">Usuários cadastrados</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-success">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Ativos</CardTitle>
              <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                <UserCheck className="h-5 w-5 text-success" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {usuarios.filter(u => u.ativo).length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Com acesso ao sistema</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-destructive">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Inativos</CardTitle>
              <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                <UserX className="h-5 w-5 text-destructive" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {usuarios.filter(u => !u.ativo).length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Sem acesso ao sistema</p>
            </CardContent>
          </Card>

          <Card className="hover-lift border-l-4 border-l-accent">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Super Admins</CardTitle>
              <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                <Shield className="h-5 w-5 text-accent" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-foreground">
                {usuarios.filter(u => u.role === 'agencia').length}
              </div>
              <p className="text-xs text-muted-foreground mt-2">Com permissões completas</p>
            </CardContent>
          </Card>
        </div>

        {/* Campo de Busca */}
        <div className="relative">
          <svg className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            placeholder="Buscar por nome, email ou role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full px-4 py-3 border border-input rounded-lg focus:ring-2 focus:ring-ring focus:border-ring bg-card text-foreground shadow-sm transition-all"
          />
        </div>

        <Card>
          <CardHeader className="border-b border-border">
            <CardTitle className="text-lg">
              Usuários Cadastrados ({filteredUsuarios.length})
              {searchTerm && (
                <span className="text-sm text-muted-foreground ml-2 font-normal">
                  • {filteredUsuarios.length} de {usuarios.length} resultados
                </span>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            {filteredUsuarios.length === 0 ? (
              <div className="text-center py-16">
                <Users className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                <p className="text-muted-foreground text-lg">
                  {searchTerm
                    ? 'Nenhum usuário encontrado com esse termo'
                    : 'Nenhum usuário cadastrado ainda'}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredUsuarios.map(usuario => {
                const isUsuarioLogado = usuario.id === usuarioLogado?.id;
                const podeAlterar = permissoes?.pode_editar_usuarios && !isUsuarioLogado;

                return (
                  <div
                    key={usuario.id}
                    className={`border rounded-lg p-4 transition-all hover-lift ${
                      usuario.ativo
                        ? 'border-border hover:border-accent/50 bg-card'
                        : 'border-border bg-muted/50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="text-lg font-semibold text-foreground">
                            {usuario.nome_completo || 'Sem nome'}
                          </h3>

                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                            usuario.ativo ? 'bg-success/10 text-success' : 'bg-destructive/10 text-destructive'
                          }`}>
                            {usuario.ativo ? 'Ativo' : 'Inativo'}
                          </span>

                          {isUsuarioLogado && (
                            <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
                              Você
                            </span>
                          )}
                        </div>

                        <p className="text-sm text-muted-foreground">{usuario.email}</p>
                      </div>

                      <div className="flex items-center gap-2">
                        {permissoes?.pode_editar_usuarios && (
                          <button
                            onClick={() => setUsuarioParaEditar(usuario)}
                            disabled={processando}
                            className="px-4 py-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 text-sm font-medium transition-all disabled:opacity-50"
                          >
                            Editar
                          </button>
                        )}

                        {podeAlterar && (
                          <button
                            onClick={() => abrirModalToggleAtivo(usuario, !usuario.ativo)}
                            disabled={processando}
                            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all disabled:opacity-50 ${
                              usuario.ativo
                                ? 'bg-warning/10 text-warning hover:bg-warning/20'
                                : 'bg-success/10 text-success hover:bg-success/20'
                            }`}
                          >
                            {usuario.ativo ? 'Desativar' : 'Ativar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
              </div>
            )}
          </CardContent>
        </Card>

        {mostrarFormNovo && (
          <FormNovoUsuario
            onClose={() => setMostrarFormNovo(false)}
            onSuccess={() => {
              setMostrarFormNovo(false);
              loadUsuarios();
              success('Usuário criado com sucesso!');
            }}
          />
        )}

        {usuarioParaEditar && (
          <FormEditarUsuario
            usuario={usuarioParaEditar}
            onClose={() => setUsuarioParaEditar(null)}
            onSuccess={() => {
              setUsuarioParaEditar(null);
              loadUsuarios();
              success('Usuário atualizado com sucesso!');
            }}
          />
        )}
      </div>
    </>
  );
}
