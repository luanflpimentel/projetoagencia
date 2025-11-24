// hooks/useAuthWithPermissions.ts - VERSÃO SIMPLIFICADA
'use client';

import { useEffect, useState, useRef } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import type { Usuario, PermissoesUsuario } from '@/lib/types';

export function useAuthWithPermissions() {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Ref para evitar múltiplas chamadas simultâneas
  const loadingRef = useRef(false);

  useEffect(() => {
    console.log('🔵 [AUTH HOOK] Inicializando...');
    loadUsuario();

    // Listener para mudança de auth (apenas login/logout, sem auto-refresh)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log('🔐 [AUTH HOOK] Auth state changed:', event);
        
        if (event === 'SIGNED_IN' && session) {
          console.log('✅ [AUTH HOOK] Usuário fez login');
          await loadUsuario();
        } else if (event === 'SIGNED_OUT') {
          console.log('🚪 [AUTH HOOK] Usuário fez logout');
          setUser(null);
          setUsuario(null);
          setPermissoes(null);
        }
      }
    );

    return () => {
      console.log('🔵 [AUTH HOOK] Cleanup');
      subscription.unsubscribe();
    };
  }, []);

  async function loadUsuario() {
    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) {
      console.log('⏸️ [AUTH HOOK] Já está carregando, ignorando chamada duplicada');
      return;
    }

    try {
      loadingRef.current = true;
      setLoading(true);
      setError(null);

      console.log('🔵 [AUTH HOOK] Carregando dados do usuário...');

      const supabase = createClient();
      
      // Usar getUser() ao invés de getSession() (mais seguro)
      const { data: { user: authUser }, error: sessionError } = await supabase.auth.getUser();
      
      if (sessionError) {
        console.error('❌ [AUTH HOOK] Erro ao buscar usuário:', sessionError);
        throw sessionError;
      }
      
      if (!authUser) {
        console.log('⚠️ [AUTH HOOK] Nenhum usuário autenticado');
        setUser(null);
        setUsuario(null);
        setPermissoes(null);
        return;
      }

      setUser(authUser);
      console.log('✅ [AUTH HOOK] Auth user carregado:', authUser.id);

      // Query com TODOS os campos do tipo Usuario
      const { data: userData, error: userError } = await supabase
        .from('usuarios')
        .select(`
          id,
          email,
          nome_completo,
          role,
          cliente_id,
          avatar_url,
          telefone,
          ativo,
          email_verificado,
          primeiro_acesso,
          ultimo_login,
          criado_em,
          criado_por,
          atualizado_em,
          atualizado_por
        `)
        .eq('id', authUser.id)
        .eq('ativo', true)
        .single();

      if (userError) {
        console.warn('⚠️ [AUTH HOOK] Usuário não encontrado na tabela usuarios:', userError);
        setError('Usuário não configurado no sistema');
        return;
      }

      // Type assertion segura
      const usuarioData: Usuario = {
        id: userData.id,
        email: userData.email,
        nome_completo: userData.nome_completo,
        role: userData.role,
        cliente_id: userData.cliente_id,
        avatar_url: userData.avatar_url || undefined,
        telefone: userData.telefone || undefined,
        ativo: userData.ativo,
        email_verificado: userData.email_verificado,
        primeiro_acesso: userData.primeiro_acesso,
        ultimo_login: userData.ultimo_login || undefined,
        criado_em: userData.criado_em,
        criado_por: userData.criado_por || undefined,
        atualizado_em: userData.atualizado_em,
        atualizado_por: userData.atualizado_por || undefined,
      };

      setUsuario(usuarioData);
      setPermissoes(calcularPermissoes(usuarioData));
      console.log('✅ [AUTH HOOK] Usuário e permissões carregados:', usuarioData.email);

      // Atualizar último login (sem await para não bloquear)
      supabase
        .from('usuarios')
        .update({ 
          ultimo_login: new Date().toISOString(),
          atualizado_por: authUser.id 
        })
        .eq('id', authUser.id)
        .then(({ error }: { error: any }) => {
          if (error) {
            console.warn('⚠️ [AUTH HOOK] Erro ao atualizar último login:', error);
          }
        });

    } catch (err) {
      console.error('❌ [AUTH HOOK] Erro ao carregar usuário:', err);
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
      loadingRef.current = false;
      console.log('✅ [AUTH HOOK] Carregamento finalizado');
    }
  }

  function calcularPermissoes(user: Usuario): PermissoesUsuario {
    const isAgencia = user.role === 'agencia';
    const isCliente = user.role === 'cliente';

    return {
      // Usuários
      pode_ver_usuarios: isAgencia,
      pode_criar_usuarios: isAgencia,
      pode_editar_usuarios: isAgencia,
      pode_deletar_usuarios: isAgencia,
      
      // Clientes
      pode_ver_todos_clientes: isAgencia,
      pode_criar_clientes: isAgencia,
      pode_editar_clientes: isAgencia,
      pode_deletar_clientes: isAgencia,
      
      // Logs
      pode_ver_todos_logs: isAgencia,
      
      // Roles
      is_agencia: isAgencia,
      is_cliente: isCliente,
    };
  }

  function temPermissao(permissao: keyof PermissoesUsuario): boolean {
    if (!permissoes) return false;
    return permissoes[permissao];
  }

  function podeAcessarCliente(clienteId: string): boolean {
    if (!usuario) return false;
    if (usuario.role === 'agencia') return true;
    return usuario.cliente_id === clienteId;
  }

  async function logout() {
    const supabase = createClient();
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Erro ao fazer logout:', error);
      throw error;
    }
    setUser(null);
    setUsuario(null);
    setPermissoes(null);
  }

  return {
    user,
    usuario,
    permissoes,
    loading,
    error,
    isAuthenticated: !!usuario,
    temPermissao,
    podeAcessarCliente,
    logout,
    recarregar: loadUsuario,
  };
}

// Hook para proteger rotas que requerem permissão específica
export function useRequirePermission(permissaoNecessaria?: keyof PermissoesUsuario) {
  const { usuario, permissoes, loading, temPermissao } = useAuthWithPermissions();

  useEffect(() => {
    if (loading) return;

    if (!usuario) {
      window.location.href = '/login';
      return;
    }

    if (permissaoNecessaria && !temPermissao(permissaoNecessaria)) {
      window.location.href = '/dashboard';
      return;
    }
  }, [usuario, permissoes, loading, permissaoNecessaria]);

  return { usuario, permissoes, loading };
}

// Hook para gerenciar primeiro acesso do usuário
export function usePrimeiroAcesso() {
  const { usuario, recarregar } = useAuthWithPermissions();
  const [mostrarModal, setMostrarModal] = useState(false);

  useEffect(() => {
    if (usuario?.primeiro_acesso) {
      setMostrarModal(true);
    }
  }, [usuario]);

  async function concluirPrimeiroAcesso() {
    if (!usuario) return;

    const supabase = createClient();
    const { error } = await supabase
      .from('usuarios')
      .update({ 
        primeiro_acesso: false,
        atualizado_por: usuario.id,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', usuario.id);

    if (error) {
      console.error('Erro ao atualizar primeiro acesso:', error);
      throw error;
    }

    setMostrarModal(false);
    await recarregar();
  }

  return {
    isPrimeiroAcesso: usuario?.primeiro_acesso || false,
    mostrarModal,
    concluirPrimeiroAcesso,
    fecharModal: () => setMostrarModal(false),
  };
}
