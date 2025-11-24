// app/actions/usuarios.ts - SERVER ACTION COM VALIDAÇÃO DE PERMISSÕES
'use server'

import { createClient } from '@/lib/supabase-server'
import { verificarPermissaoAgencia, supabaseAdmin } from '@/lib/supabase-admin'
import { revalidatePath } from 'next/cache'

export async function toggleUsuarioAtivo(
  usuarioId: string,
  novoStatus: boolean,
  usuarioLogadoId: string
) {
  try {
    console.log('[SERVER] Toggle usuário:', usuarioId, 'para', novoStatus);
    
    // Criar cliente do servidor (sempre fresco!)
    const supabase = await createClient();
    
    // 1. Verificar sessão
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      console.error('[SERVER] Erro de autenticação:', authError);
      return { 
        success: false, 
        error: 'Não autenticado' 
      };
    }
    
    // 2. Verificar se é agência (apenas agência pode modificar usuários)
    const isAgencia = await verificarPermissaoAgencia(user.id);
    
    if (!isAgencia) {
      console.error('[SERVER] Sem permissão para modificar usuários');
      return {
        success: false,
        error: 'Você não tem permissão para modificar usuários'
      };
    }
    
    console.log('[SERVER] Usuário é agência, prosseguindo...');
    
    // 3. Fazer update usando supabaseAdmin (bypassa RLS)
    const { data, error } = await supabaseAdmin
      .from('usuarios')
      .update({
        ativo: novoStatus,
        atualizado_em: new Date().toISOString(),
        atualizado_por: usuarioLogadoId
      })
      .eq('id', usuarioId)
      .select()
      .single();
    
    if (error) {
      console.error('[SERVER] Erro ao atualizar:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }
    
    console.log('[SERVER] Sucesso!');
    
    // Revalidar cache do Next.js
    revalidatePath('/dashboard/usuarios');
    
    return { 
      success: true, 
      data 
    };
    
  } catch (error: any) {
    console.error('[SERVER] Erro geral:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}
