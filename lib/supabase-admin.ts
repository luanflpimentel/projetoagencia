// lib/supabase-admin.ts
// Cliente Supabase com SERVICE ROLE KEY para operações administrativas
// BYPASSA RLS - use apenas quando necessário e com validação de permissões!

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

// Durante build time, as variáveis podem não estar disponíveis
// Apenas em runtime (quando realmente usar) vamos validar
if (!supabaseUrl && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ NEXT_PUBLIC_SUPABASE_URL não está definida (pode ser normal durante build)');
}

if (!supabaseServiceRoleKey && typeof window === 'undefined' && process.env.NODE_ENV !== 'production') {
  console.warn('⚠️ SUPABASE_SERVICE_ROLE_KEY não está definida (pode ser normal durante build)');
}

// Criar cliente apenas se temos as credenciais
// Se não tiver, vai falhar apenas quando tentar usar (runtime)
// ⚠️ Cliente ADMIN - BYPASSA RLS!
export const supabaseAdmin = supabaseUrl && supabaseServiceRoleKey 
  ? createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  : null as any; // Durante build pode ser null, mas em runtime sempre existirá

/**
 * Verifica se um usuário tem role 'agencia'
 * Use esta função ANTES de usar supabaseAdmin
 */
export async function verificarPermissaoAgencia(userId: string): Promise<boolean> {
  if (!supabaseAdmin) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não está configurada no ambiente');
  }
  
  try {
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('[ADMIN] Erro ao verificar permissão:', error);
      return false;
    }

    return data?.role === 'agencia';
  } catch (error) {
    console.error('[ADMIN] Erro ao verificar permissão:', error);
    return false;
  }
}

/**
 * Busca todos os usuários (apenas para agência)
 * VALIDA permissão antes de executar
 */
export async function buscarTodosUsuarios(userId: string) {
  const isAgencia = await verificarPermissaoAgencia(userId);
  
  if (!isAgencia) {
    throw new Error('Sem permissão para buscar todos os usuários');
  }

  const { data, error } = await supabaseAdmin
    .from('usuarios')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Busca todos os clientes (apenas para agência)
 * VALIDA permissão antes de executar
 */
export async function buscarTodosClientes(userId: string) {
  const isAgencia = await verificarPermissaoAgencia(userId);
  
  if (!isAgencia) {
    throw new Error('Sem permissão para buscar todos os clientes');
  }

  const { data, error } = await supabaseAdmin
    .from('clientes')
    .select('*')
    .order('criado_em', { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * Cria usuário usando Admin API (não faz login automático)
 * VALIDA permissão antes de executar
 */
export async function criarUsuarioAdmin(
  userId: string,
  userData: {
    email: string;
    password: string;
    nome_completo: string;
    role: 'agencia' | 'cliente';
    cliente_id?: string | null;
    telefone?: string | null;
  }
) {
  const isAgencia = await verificarPermissaoAgencia(userId);
  
  if (!isAgencia) {
    throw new Error('Sem permissão para criar usuários');
  }

  // Criar no Auth
  const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
    email: userData.email,
    password: userData.password,
    email_confirm: true,
    user_metadata: {
      nome_completo: userData.nome_completo
    }
  });

  if (authError) throw authError;
  if (!authData.user) throw new Error('Usuário não foi criado no Auth');

  // Inserir na tabela usuarios
  const { data: usuarioData, error: dbError } = await supabaseAdmin
    .from('usuarios')
    .insert({
      id: authData.user.id,
      email: userData.email,
      nome_completo: userData.nome_completo,
      role: userData.role,
      cliente_id: userData.cliente_id || null,
      telefone: userData.telefone || null,
      ativo: true,
      email_verificado: true,
      primeiro_acesso: true,
      criado_por: userId,
      criado_em: new Date().toISOString(),
      atualizado_em: new Date().toISOString()
    })
    .select()
    .single();

  if (dbError) {
    // Rollback: deletar do Auth se inserção falhou
    await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
    throw dbError;
  }

  return usuarioData;
}
