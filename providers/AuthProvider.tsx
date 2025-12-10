// providers/AuthProvider.tsx
'use client';

import { createContext, useContext, useEffect, useState, useRef, ReactNode } from 'react';
import { createClient } from '@/lib/supabase-browser';
import type { User } from '@supabase/supabase-js';
import type { Usuario, PermissoesUsuario } from '@/lib/types';

interface AuthContextType {
  user: User | null;
  usuario: Usuario | null;
  permissoes: PermissoesUsuario | null;
  loading: boolean;
  error: string | null;
  isAuthenticated: boolean;
  temPermissao: (permissao: keyof PermissoesUsuario) => boolean;
  podeAcessarCliente: (clienteId: string) => boolean;
  logout: () => Promise<void>;
  recarregar: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [permissoes, setPermissoes] = useState<PermissoesUsuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Ref para evitar múltiplas chamadas simultâneas
  const loadingRef = useRef(false);
  // Ref para verificar se componente está montado
  const isMountedRef = useRef(true);
  // Ref para rastrear se usuário está carregado (mais confiável que state no callback)
  const usuarioLoadedRef = useRef(false);

  useEffect(() => {
    isMountedRef.current = true;
    loadUsuario();

    // Listener para mudança de auth (apenas login/logout, sem auto-refresh)
    const supabase = createClient();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        // Ignorar eventos de TOKEN_REFRESHED e INITIAL_SESSION
        if (event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') {
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          // Só recarregar se ainda não temos um usuário carregado
          // Usa ref ao invés de state pois o state pode estar desatualizado no callback
          if (!usuarioLoadedRef.current) {
            await loadUsuario();
          }
        } else if (event === 'SIGNED_OUT') {
          usuarioLoadedRef.current = false;
          if (isMountedRef.current) {
            setUser(null);
            setUsuario(null);
            setPermissoes(null);
          }
        }
      }
    );

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
      // Reset loading ref on unmount (para suportar React Strict Mode)
      loadingRef.current = false;
    };
  }, []);

  async function loadUsuario() {
    // Evitar múltiplas chamadas simultâneas
    if (loadingRef.current) {
      return;
    }

    loadingRef.current = true;
    setLoading(true);
    setError(null);

    try {
      const supabase = createClient();

      // Usar getUser() com timeout para evitar travar
      const getUserPromise = supabase.auth.getUser();
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout ao buscar usuário')), 10000)
      );

      const { data: { user: authUser }, error: sessionError } = await Promise.race([
        getUserPromise,
        timeoutPromise
      ]) as Awaited<ReturnType<typeof supabase.auth.getUser>>;

      if (sessionError) {
        throw sessionError;
      }

      if (!authUser) {
        usuarioLoadedRef.current = false;
        if (isMountedRef.current) {
          setUser(null);
          setUsuario(null);
          setPermissoes(null);
          setLoading(false);
        }
        loadingRef.current = false;
        return;
      }

      if (!isMountedRef.current) return;
      setUser(authUser);

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
        usuarioLoadedRef.current = false;
        if (isMountedRef.current) {
          setError('Usuário não configurado no sistema');
          setLoading(false);
        }
        loadingRef.current = false;
        return;
      }

      if (!isMountedRef.current) return;

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

      if (isMountedRef.current) {
        setUsuario(usuarioData);
        setPermissoes(calcularPermissoes(usuarioData));
        usuarioLoadedRef.current = true;  // Marcar que usuário foi carregado
      }

      // Atualizar último login (sem await para não bloquear)
      supabase
        .from('usuarios')
        .update({
          ultimo_login: new Date().toISOString(),
          atualizado_por: authUser.id
        })
        .eq('id', authUser.id)
        .then(() => {
          // Silenciosamente atualiza
        });

    } catch (err) {
      console.error('Erro ao carregar usuário:', err);
      if (isMountedRef.current) {
        setError(err instanceof Error ? err.message : 'Erro desconhecido');
      }
    } finally {
      if (isMountedRef.current) {
        setLoading(false);
      }
      loadingRef.current = false;
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

  const value: AuthContextType = {
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
