// app/dashboard/usuarios/page.tsx - VERSÃO DEFINITIVA (sem refreshSession)
'use client';

import FormEditarUsuario from '@/components/usuarios/FormEditarUsuario';
import FormNovoUsuario from '@/components/usuarios/FormNovoUsuario';
import { useEffect, useState, useRef } from 'react';
import { createClient, createFreshClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';
import type { Usuario } from '@/lib/types';

export default function UsuariosPage() {
  const [mostrarFormNovo, setMostrarFormNovo] = useState(false);
  const [usuarioParaEditar, setUsuarioParaEditar] = useState<Usuario | null>(null);
  const [usuarioLogado, setUsuarioLogado] = useState<Usuario | null>(null);
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [processando, setProcessando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Filtros
  const [filtroStatus, setFiltroStatus] = useState<'todos' | 'ativo' | 'inativo'>('todos');
  
  const { permissoes } = useAuthWithPermissions();
  const router = useRouter();
  const supabase = createClient();
  
  // Ref para evitar múltiplas chamadas simultâneas
  const loadingRef = useRef(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // ============= CARREGAR DADOS INICIAIS =============
  useEffect(() => {
    loadUsuarios();
    
    // Cleanup: garantir que loading sempre é resetado
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      loadingRef.current = false;
    };
  }, []);

  async function loadUsuarios() {
    const startTime = Date.now();
    console.log('🔵 [LOAD] Início da função loadUsuarios');

    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log('⏸️ [LOAD] Já está carregando, ignorando chamada duplicada');
      return;
    }

    // ✅ Timeout de segurança (10 segundos)
    timeoutRef.current = setTimeout(() => {
      console.error('⏰ [LOAD] TIMEOUT! Forçando unlock após 10 segundos');
      loadingRef.current = false;
      setLoading(false);
      setError('Timeout ao carregar usuários. Tente novamente.');
    }, 10000);

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🔵 [LOAD] Iniciando carregamento de usuários...');

      // Verificar autenticação (método seguro)
      console.log('🔵 [LOAD] Verificando autenticação...');
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      console.log('🔵 [LOAD] Resposta de auth.getUser():', { user: user?.id, error: authError });

      if (authError) {
        console.error('❌ [LOAD] Erro de autenticação:', authError);
        throw new Error(`Auth error: ${authError.message}`);
      }

      if (!user) {
        console.error('❌ [LOAD] Nenhum usuário autenticado');
        router.push('/login');
        return;
      }

      console.log('✅ [LOAD] Usuário autenticado:', user.id);

      // Buscar dados do usuário logado
      console.log('🔵 [LOAD] Buscando dados do usuário logado...');
      const { data: usuarioLogadoData, error: usuarioError } = await supabase
        .from('usuarios')
        .select('*')
        .eq('id', user.id)
        .single();

      console.log('🔵 [LOAD] Resposta usuário logado:', { 
        data: usuarioLogadoData?.email, 
        error: usuarioError 
      });

      if (usuarioError) {
        console.error('❌ [LOAD] Erro ao buscar usuário logado:', usuarioError);
      } else if (usuarioLogadoData) {
        setUsuarioLogado(usuarioLogadoData as Usuario);
        console.log('✅ [LOAD] Usuário logado carregado:', usuarioLogadoData.email);
      }

      // Buscar usuários
      console.log('🔵 [LOAD] Buscando lista de usuários...');
      const { data, error: queryError } = await supabase
        .from('usuarios')
        .select(`
          id,
          email,
          nome_completo,
          role,
          cliente_id,
          ativo,
          email_verificado,
          primeiro_acesso,
          ultimo_login,
          criado_em,
          atualizado_em
        `)
        .order('criado_em', { ascending: false });

      console.log('🔵 [LOAD] Resposta lista usuários:', { 
        count: data?.length, 
        error: queryError 
      });

      if (queryError) {
        console.error('❌ [LOAD] Erro ao buscar usuários:', queryError);
        throw queryError;
      }

      // Type assertion segura
      const usuariosData = (data || []).map(u => ({
        ...u,
        avatar_url: undefined,
        telefone: undefined,
        criado_por: undefined,
        atualizado_por: undefined,
      })) as Usuario[];

      setUsuarios(usuariosData);
      
      const endTime = Date.now();
      const duration = endTime - startTime;
      console.log(`✅ [LOAD] ${usuariosData.length} usuários carregados com sucesso em ${duration}ms`);

    } catch (err: any) {
      console.error('❌ [LOAD] Erro ao carregar usuários:', err);
      console.error('❌ [LOAD] Stack trace:', err.stack);
      setError(err.message || 'Erro desconhecido');
    } finally {
      // Limpar timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      
      loadingRef.current = false;
      setLoading(false);
      console.log('✅ [LOAD] Carregamento finalizado (finally block)');
    }
  }

  // ============= TOGGLE ATIVAR/DESATIVAR =============
  async function toggleAtivo(usuario: Usuario, novoStatus: boolean) {
    const timestampInicio = Date.now();
    console.log('🔄 [TOGGLE] toggleAtivo chamado:', {
      usuario: usuario.email,
      usuarioId: usuario.id,
      statusAtual: usuario.ativo,
      novoStatus,
      usuarioLogadoId: usuarioLogado?.id,
      timestamp: new Date().toISOString()
    });

    // Validação: não pode desativar a si mesmo
    if (usuario.id === usuarioLogado?.id) {
      console.warn('⚠️ [TOGGLE] Tentou desativar a si mesmo');
      alert('❌ Você não pode desativar sua própria conta!');
      return;
    }

    // Validação: precisa ter usuário logado
    if (!usuarioLogado?.id) {
      console.error('❌ [TOGGLE] Usuário logado não identificado');
      alert('❌ Erro: Usuário logado não identificado. Faça login novamente.');
      return;
    }

    const acao = novoStatus ? 'ativar' : 'desativar';
    const confirmacao = confirm(
      `Tem certeza que deseja ${acao} o usuário "${usuario.nome_completo || usuario.email}"?\n\n` +
      `${novoStatus ? '✅ O usuário poderá fazer login novamente.' : '⚠️ O usuário não poderá mais fazer login.'}`
    );

    if (!confirmacao) {
      console.log('❌ [TOGGLE] Usuário cancelou a ação');
      return;
    }

    try {
      setProcessando(true);
      console.log('⏳ [TOGGLE] Processando alteração de status...');

      // ✅ NOVO: Criar client completamente fresh e verificar sessão (SEM refreshSession)
      console.log('🔄 [TOGGLE] Criando fresh client e verificando sessão...');
      const freshClient = createFreshClient();
      
      // Verificar sessão (RÁPIDO - não faz refresh)
      const { data: { session }, error: sessionError } = await freshClient.auth.getSession();
      
      if (sessionError || !session) {
        console.error('❌ [TOGGLE] Sessão inválida:', sessionError);
        alert('🔐 Sua sessão expirou. Por favor, recarregue a página e faça login novamente.');
        router.push('/login');
        return;
      }
      
      console.log('✅ [TOGGLE] Sessão válida obtida');

      // ✅ DADOS COMPLETOS COM atualizado_por
      const updateData = {
        ativo: novoStatus,
        atualizado_em: new Date().toISOString(),
        atualizado_por: usuarioLogado.id
      };

      console.log('📤 [TOGGLE] Dados do update:', JSON.stringify(updateData, null, 2));
      console.log('📤 [TOGGLE] ID do usuário a ser atualizado:', usuario.id);

      // ✅ Timeout AGRESSIVO de 3 segundos
      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        console.error('⏰ [TOGGLE] TIMEOUT após 3 segundos');
        controller.abort();
      }, 3000);

      console.log('📡 [TOGGLE] Enviando requisição para Supabase...');
      
      const { data, error } = await freshClient
        .from('usuarios')
        .update(updateData)
        .eq('id', usuario.id)
        .select();

      clearTimeout(timeoutId);
      
      const timestampFim = Date.now();
      const duracao = timestampFim - timestampInicio;
      console.log(`⏱️ [TOGGLE] Requisição completada em ${duracao}ms`);

      if (error) {
        console.error('❌ [TOGGLE] Erro retornado pelo Supabase:', JSON.stringify(error, null, 2));
        throw error;
      }

      console.log('✅ [TOGGLE] Update bem-sucedido! Data:', JSON.stringify(data, null, 2));
      
      // ✅ Atualizar estado local imediatamente (otimista)
      setUsuarios(prevUsuarios => 
        prevUsuarios.map(u => 
          u.id === usuario.id 
            ? { ...u, ativo: novoStatus, atualizado_em: updateData.atualizado_em, atualizado_por: updateData.atualizado_por }
            : u
        )
      );
      
      console.log('✅ [TOGGLE] Estado local atualizado');
      alert(`✅ Usuário ${novoStatus ? 'ativado' : 'desativado'} com sucesso!`);
      
      // ✅ Recarregar em background
      setTimeout(() => {
        console.log('🔄 [TOGGLE] Recarregando dados em background...');
        loadUsuarios();
      }, 500);
      
    } catch (err: any) {
      console.error('💥 [TOGGLE] ERRO CAPTURADO:', err);
      console.error('💥 [TOGGLE] Error name:', err.name);
      console.error('💥 [TOGGLE] Error message:', err.message);
      
      if (err.name === 'AbortError') {
        alert('⏰ Operação demorou muito (timeout de 3s).\n\nPossíveis causas:\n- Sessão expirada\n- Conexão lenta\n\nSolução: Recarregue a página (F5)');
        // Forçar reload após timeout
        setTimeout(() => window.location.reload(), 2000);
      } else {
        alert(`❌ Erro ao ${acao} usuário: ${err.message}\n\nRecarregue a página (F5) e tente novamente.`);
      }
      
      // Recarregar em caso de erro
      loadUsuarios();
    } finally {
      setProcessando(false);
      console.log('✅ [TOGGLE] Processamento finalizado');
    }
  }

  // ============= FILTRAR USUÁRIOS =============
  const usuariosFiltrados = usuarios.filter(usuario => {
    if (filtroStatus === 'ativo' && !usuario.ativo) return false;
    if (filtroStatus === 'inativo' && usuario.ativo) return false;
    return true;
  });

  if (loading && usuarios.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando usuários...</p>
          <p className="mt-2 text-xs text-gray-400">Se demorar muito, recarregue a página (F5)</p>
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
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Tentar Novamente
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Recarregar Página
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestão de Usuários</h1>
          <p className="text-gray-600 mt-1">Gerencie os usuários do sistema</p>
        </div>
        {permissoes?.pode_criar_usuarios && (
          <button 
            onClick={() => setMostrarFormNovo(true)}
            disabled={processando}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      {/* Estatísticas */}
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
            {usuarios.filter(u => u.role === 'super_admin').length}
          </div>
          <div className="text-sm text-gray-600">Super Admins</div>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="font-semibold mb-3 text-gray-900">🔍 Filtros</h3>
        <div className="flex gap-3 flex-wrap">
          <select 
            value={filtroStatus}
            onChange={(e) => setFiltroStatus(e.target.value as any)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
          >
            <option value="todos">📋 Todos os Status</option>
            <option value="ativo">✅ Apenas Ativos</option>
            <option value="inativo">⏸️ Apenas Inativos</option>
          </select>
          
          {filtroStatus !== 'todos' && (
            <button
              onClick={() => setFiltroStatus('todos')}
              className="px-3 py-2 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            >
              ❌ Limpar Filtros
            </button>
          )}

          {/* Botão de Refresh Manual */}
          <button
            onClick={() => {
              console.log('🔄 [MANUAL] Refresh manual acionado');
              loadUsuarios();
            }}
            disabled={loading || processando}
            className="px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            title="Recarregar lista"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Atualizar
          </button>
        </div>
      </div>

      {/* Lista de Usuários */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Usuários Cadastrados ({usuariosFiltrados.length} {filtroStatus !== 'todos' ? `de ${usuarios.length}` : ''})
          </h2>
        </div>
        <div className="p-6">
          {usuariosFiltrados.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-2">
                {filtroStatus === 'todos' 
                  ? 'Nenhum usuário encontrado' 
                  : `Nenhum usuário ${filtroStatus} encontrado`}
              </p>
              {filtroStatus !== 'todos' && (
                <button
                  onClick={() => setFiltroStatus('todos')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                >
                  Ver todos os usuários
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {usuariosFiltrados.map(usuario => {
                const isUsuarioLogado = usuario.id === usuarioLogado?.id;
                const podeAlterar = permissoes?.pode_editar_usuarios && !isUsuarioLogado;

                return (
                  <div
                    key={usuario.id}
                    className={`border rounded-lg p-4 transition-all ${
                      usuario.ativo 
                        ? 'border-gray-200 hover:border-blue-300' 
                        : 'border-gray-300 bg-gray-50 hover:border-gray-400'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1 flex-wrap gap-y-1">
                          <h3 className="text-lg font-semibold text-gray-900">
                            {usuario.nome_completo || 'Sem nome'}
                          </h3>
                          
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${
                              usuario.role === 'super_admin' ? 'bg-purple-100 text-purple-700' :
                              usuario.role === 'admin_cliente' ? 'bg-blue-100 text-blue-700' :
                              'bg-gray-100 text-gray-700'
                            }`}
                          >
                            {usuario.role === 'super_admin' ? '👑 Super Admin' :
                             usuario.role === 'admin_cliente' ? '🔑 Admin Cliente' :
                             '👤 Usuário'}
                          </span>
                          
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
                        
                        <div className="flex items-center space-x-4 mt-2 text-xs text-gray-500">
                          <span>Criado: {new Date(usuario.criado_em).toLocaleDateString('pt-BR')}</span>
                          {usuario.ultimo_login && (
                            <span>Último login: {new Date(usuario.ultimo_login).toLocaleDateString('pt-BR')}</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center space-x-2 flex-wrap gap-y-2">
                        {permissoes?.pode_editar_usuarios && (
                          <button
                            onClick={() => setUsuarioParaEditar(usuario)}
                            disabled={processando}
                            className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors text-sm font-medium disabled:opacity-50"
                          >
                            ✏️ Editar
                          </button>
                        )}

                        {podeAlterar && (
                          <button
                            onClick={() => toggleAtivo(usuario, !usuario.ativo)}
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
          )}
        </div>
      </div>

      {mostrarFormNovo && (
        <FormNovoUsuario
          onClose={() => setMostrarFormNovo(false)}
          onSuccess={() => {
            setMostrarFormNovo(false);
            loadUsuarios();
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
            alert('✅ Usuário atualizado com sucesso!');
          }}
        />
      )}
    </div>
  );
}