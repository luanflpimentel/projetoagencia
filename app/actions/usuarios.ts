// app/actions/usuarios.ts - SERVER ACTION COM VALIDAÇÃO DE PERMISSÕES
'use server'

import { createClient } from '@/lib/supabase-server'
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
    
    // 2. Buscar dados do usuário logado (SEM acionar recursão)
    const { data: usuarioLogado, error: usuarioLogadoError } = await supabase
      .from('usuarios')
      .select('id, role, cliente_id')
      .eq('id', user.id)
      .single();
    
    if (usuarioLogadoError || !usuarioLogado) {
      console.error('[SERVER] Erro ao buscar usuário logado:', usuarioLogadoError);
      return {
        success: false,
        error: 'Usuário não encontrado'
      };
    }
    
    console.log('[SERVER] Usuário logado:', usuarioLogado.role);
    
    // 3. Buscar dados do usuário a ser modificado
    const { data: usuarioAlvo, error: usuarioAlvoError } = await supabase
      .from('usuarios')
      .select('id, role, cliente_id')
      .eq('id', usuarioId)
      .single();
    
    if (usuarioAlvoError || !usuarioAlvo) {
      console.error('[SERVER] Erro ao buscar usuário alvo:', usuarioAlvoError);
      return {
        success: false,
        error: 'Usuário alvo não encontrado'
      };
    }
    
    // 4. Validar permissões
    const isSuperAdmin = usuarioLogado.role === 'super_admin';
    const isAdminCliente = usuarioLogado.role === 'admin_cliente';
    const mesmoCliente = usuarioLogado.cliente_id === usuarioAlvo.cliente_id;
    
    // Super admin pode tudo
    if (!isSuperAdmin) {
      // Admin cliente só pode modificar usuários do mesmo cliente
      if (!isAdminCliente || !mesmoCliente) {
        console.error('[SERVER] Sem permissão. Role:', usuarioLogado.role, 'Cliente:', mesmoCliente);
        return {
          success: false,
          error: 'Você não tem permissão para modificar este usuário'
        };
      }
    }
    
    // 5. Fazer update
    const { data, error } = await supabase
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