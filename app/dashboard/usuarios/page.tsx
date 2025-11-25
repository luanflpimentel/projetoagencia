// app/dashboard/usuarios/page.tsx - VERSÃO COM SERVER ACTION
'use client';

import FormEditarUsuario from '@/components/usuarios/FormEditarUsuario';
import FormNovoUsuario from '@/components/usuarios/FormNovoUsuario';
import ModalConfirmacao from '@/components/ui/modal-confirmacao';
import { useToast } from '@/components/ui/toast';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';
import type { Usuario } from '@/lib/types';
import { createClient } from '@/lib/supabase-browser';
import { toggleUsuarioAtivo } from '@/app/actions/usuarios'; // ← NOVA IMPORT
import ProtegerRota from '@/components/auth/ProtegerRota';

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
  const { permissoes } = useAuthWithPermissions();
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    loadUsuarios();
  }, []);

  async function loadUsuarios() {
    try {
      setLoading(true);
      setError(null);

      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError || !user) {
        router.push('/login');
        return;
      }

      const { data: usuarioLogadoData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      if (usuarioLogadoData) {
        setUsuarioLogado(usuarioLogadoData as Usuario);
      }

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
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-6">
        <h2 className="text-xl font-bold text-red-800 mb-2">Erro ao carregar usuários</h2>
        <p className="text-red-700 mb-4">{error}</p>
        <div className="flex gap-2">
          <button
            onClick={() => {
              setError(null);
              loadUsuarios();
            }}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
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

      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
            <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
          </div>
          {permissoes?.pode_criar_usuarios && (
            <button 
              onClick={() => setMostrarFormNovo(true)}
              disabled={processando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Novo Usuário</span>
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-gray-900">{usuarios.length}</div>
            <div className="text-sm text-gray-600">Total de Usuários</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-green-600">
              {usuarios.filter(u => u.ativo).length}
            </div>
            <div className="text-sm text-gray-600">Ativos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-red-600">
              {usuarios.filter(u => !u.ativo).length}
            </div>
            <div className="text-sm text-gray-600">Inativos</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6">
            <div className="text-3xl font-bold text-purple-600">
              {usuarios.filter(u => u.role === 'agencia').length}
            </div>
            <div className="text-sm text-gray-600">Super Admins</div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Usuários Cadastrados ({usuarios.length})
            </h2>
          </div>
          <div className="p-6">
            <div className="space-y-4">
              {usuarios.map(usuario => {
                const isUsuarioLogado = usuario.id === usuarioLogado?.id;
                const podeAlterar = permissoes?.pode_editar_usuarios && !isUsuarioLogado;

                return (
                  <div
                    key={usuario.id}
                    className={`border rounded-lg p-4 transition-all ${
                      usuario.ativo 
                        ? 'border-gray-200 hover:border-blue-300' 
                        : 'border-gray-300 bg-gray-50'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {usuario.nome_completo || 'Sem nome'}
                          </h3>
                          
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            usuario.ativo ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {usuario.ativo ? '✅ Ativo' : '⏸️ Inativo'}
                          </span>

                          {isUsuarioLogado && (
                            <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700">
                              ⭐ Você
                            </span>
                          )}
                        </div>
                        
                        <p className="text-sm text-gray-600">{usuario.email}</p>
                      </div>

                      <div className="flex items-center space-x-2">
                        {permissoes?.pode_editar_usuarios && (
                          <button
                            onClick={() => setUsuarioParaEditar(usuario)}
                            disabled={processando}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 text-sm font-medium disabled:opacity-50"
                          >
                            ✏️ Editar
                          </button>
                        )}

                        {podeAlterar && (
                          <button
                            onClick={() => abrirModalToggleAtivo(usuario, !usuario.ativo)}
                            disabled={processando}
                            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors disabled:opacity-50 ${
                              usuario.ativo 
                                ? 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                                : 'bg-green-100 text-green-700 hover:bg-green-200'
                            }`}
                          >
                            {usuario.ativo ? '⏸️ Desativar' : '✅ Ativar'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

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
