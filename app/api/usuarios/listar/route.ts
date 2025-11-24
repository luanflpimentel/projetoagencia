// app/api/usuarios/listar/route.ts
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verificarPermissaoAgencia, supabaseAdmin } from '@/lib/supabase-admin';

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Autenticar
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar se é agência
    const isAgencia = await verificarPermissaoAgencia(user.id);
    
    let data, error;
    
    if (isAgencia) {
      // Agência: buscar TODOS os usuários
      const result = await supabaseAdmin
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
      data = result.data;
      error = result.error;
    } else {
      // Cliente: buscar apenas si mesmo (RLS ativo)
      const result = await supabase
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
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erro ao buscar usuários:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar usuários' },
        { status: 500 }
      );
    }

    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
