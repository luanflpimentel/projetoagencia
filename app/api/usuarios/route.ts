// app/api/usuarios/route.ts - API para criar usuários (NEXT.JS 15+)
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { criarUsuarioAdmin, supabaseAdmin } from '@/lib/supabase-admin';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    
    // 1. Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 2. Verificar permissão do usuário logado
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('role')
      .eq('id', user.id)
      .single();

    if (usuarioError) {
      console.error('Erro ao buscar usuário:', usuarioError);
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }

    // Apenas agencia pode criar usuários
    if (usuario?.role !== 'agencia') {
      return NextResponse.json(
        { error: 'Sem permissão para criar usuários' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 3. Validar dados obrigatórios
    if (!body.email || !body.nome_completo || !body.role || !body.senha) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: email, nome_completo, role, senha' },
        { status: 400 }
      );
    }

    // 4. Validar role
    if (!['agencia', 'cliente'].includes(body.role)) {
      return NextResponse.json(
        { error: 'Role inválida' },
        { status: 400 }
      );
    }

    // 5. Validar cliente_id (obrigatório para cliente)
    if (body.role === 'cliente' && !body.cliente_id) {
      return NextResponse.json(
        { error: 'cliente_id é obrigatório para este tipo de usuário' },
        { status: 400 }
      );
    }

    // 6. Agencia não pode ter cliente_id
    if (body.role === 'agencia' && body.cliente_id) {
      return NextResponse.json(
        { error: 'Agência não pode ter cliente associado' },
        { status: 400 }
      );
    }

    // 7. Validar senha
    if (body.senha.length < 8) {
      return NextResponse.json(
        { error: 'Senha deve ter pelo menos 8 caracteres' },
        { status: 400 }
      );
    }

    console.log('➕ [CRIAR USUÁRIO] Iniciando...', {
      email: body.email,
      role: body.role,
      criadoPor: user.email
    });

    // 8. Usar helper admin que cria usuário sem fazer login automático
    const usuarioData = await criarUsuarioAdmin(user.id, {
      email: body.email,
      password: body.senha,
      nome_completo: body.nome_completo,
      role: body.role,
      cliente_id: body.role === 'agencia' ? null : body.cliente_id,
      telefone: body.telefone || null
    });

    console.log('✅ [CRIAR USUÁRIO] Criado com sucesso:', usuarioData.id);

    // 9. Registrar log
    try {
      await supabaseAdmin.from('logs_sistema').insert({
        cliente_id: body.cliente_id || null,
        tipo_evento: 'usuario_criado',
        descricao: `Usuário ${body.nome_completo} (${body.email}) criado com role ${body.role}`,
        metadata: {
          usuario_id: usuarioData.id,
          role: body.role,
          criado_por: user.id,
          criado_por_email: user.email
        },
        criado_em: new Date().toISOString()
      });
      console.log('✅ [CRIAR USUÁRIO] Log registrado');
    } catch (logError) {
      console.error('⚠️ [CRIAR USUÁRIO] Erro ao registrar log:', logError);
      // Não falhar por causa de log
    }

    console.log('🎉 [CRIAR USUÁRIO] Sucesso total!');

    return NextResponse.json(
      {
        data: usuarioData,
        message: 'Usuário criado com sucesso'
      },
      { status: 201 }
    );

  } catch (error: any) {
    console.error('❌ [CRIAR USUÁRIO] Erro geral:', error);
    
    return NextResponse.json(
      { error: error.message || 'Erro ao criar usuário' },
      { status: 500 }
    );
  }
}
