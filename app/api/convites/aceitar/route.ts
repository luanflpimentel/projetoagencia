// app/api/convites/aceitar/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { token, senha } = body;

    // Validação
    if (!token || !senha) {
      return NextResponse.json(
        { error: 'Token e senha são obrigatórios' },
        { status: 400 }
      );
    }

    if (senha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    // Buscar convite
    console.log('🔍 Buscando convite com token:', token);

    const { data: convite, error: conviteError } = await supabaseAdmin
      .from('convites')
      .select('*')
      .eq('token', token)
      .eq('usado', false)
      .single();

    if (conviteError || !convite) {
      console.error('❌ Erro ao buscar convite:', conviteError);
      return NextResponse.json(
        { error: 'Convite inválido ou já utilizado' },
        { status: 404 }
      );
    }

    console.log('✅ Convite encontrado:', {
      email: convite.email,
      role: convite.role,
      expira_em: convite.expira_em
    });

    // Verificar se expirou
    if (new Date(convite.expira_em) < new Date()) {
      console.log('⏰ Convite expirado');
      return NextResponse.json(
        { error: 'Convite expirado' },
        { status: 410 }
      );
    }

    // Criar usuário no Supabase Auth
    console.log('🔐 Criando usuário no Supabase Auth:', convite.email);

    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email: convite.email,
      password: senha,
      email_confirm: true, // Confirmar email automaticamente
      user_metadata: {
        nome_completo: convite.nome_completo,
        telefone: convite.telefone
      }
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário no auth:', {
        message: authError.message,
        status: authError.status,
        code: authError.code,
        details: authError
      });

      // Verificar se é erro de email duplicado
      if (authError.message?.includes('already registered') || authError.message?.includes('User already registered')) {
        return NextResponse.json(
          { error: 'Este email já está cadastrado no sistema' },
          { status: 409 }
        );
      }

      // Retornar erro mais detalhado em desenvolvimento
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `Erro ao criar usuário: ${authError.message}`
        : 'Erro ao criar usuário';

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    console.log('✅ Usuário criado no auth:', authData.user.id);

    // Criar registro na tabela usuarios
    console.log('👤 Criando registro na tabela usuarios');

    const { error: usuarioError } = await supabaseAdmin
      .from('usuarios')
      .insert({
        id: authData.user.id,
        email: convite.email,
        nome_completo: convite.nome_completo,
        telefone: convite.telefone,
        role: convite.role,
        cliente_id: convite.cliente_id,
        ativo: true,
        email_verificado: true,
        primeiro_acesso: true
      });

    if (usuarioError) {
      console.error('❌ Erro ao criar registro de usuário:', {
        message: usuarioError.message,
        details: usuarioError.details,
        hint: usuarioError.hint,
        code: usuarioError.code
      });

      // Tentar deletar o usuário do auth se falhar (rollback)
      console.log('🔄 Fazendo rollback - deletando usuário do auth');
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);

      // Retornar erro mais detalhado em desenvolvimento
      const errorMessage = process.env.NODE_ENV === 'development'
        ? `Erro ao criar registro de usuário: ${usuarioError.message}`
        : 'Erro ao criar registro de usuário';

      return NextResponse.json(
        { error: errorMessage },
        { status: 500 }
      );
    }

    console.log('✅ Registro de usuário criado com sucesso');

    // Marcar convite como usado
    await supabaseAdmin
      .from('convites')
      .update({
        usado: true,
        usado_em: new Date().toISOString()
      })
      .eq('id', convite.id);

    // Log do sistema
    await supabaseAdmin.from('logs_sistema').insert({
      tipo_evento: 'convite_aceito',
      descricao: `Convite aceito por ${convite.email}`,
      usuario_id: authData.user.id,
      metadata: {
        email: convite.email,
        role: convite.role,
        cliente_id: convite.cliente_id
      }
    });

    console.log(`✅ Convite aceito: ${convite.email}`);

    return NextResponse.json({
      success: true,
      message: 'Conta criada com sucesso! Você já pode fazer login.',
      user: {
        id: authData.user.id,
        email: authData.user.email
      }
    });

  } catch (error) {
    console.error('Erro ao aceitar convite:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
