// app/api/clientes/[id]/route.ts - NEXT.JS 15+
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verificarPermissaoAgencia, supabaseAdmin } from '@/lib/supabase-admin';

// GET - Buscar cliente por ID
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient(); // ← AWAIT aqui!
    
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    console.log('🔍 Buscando cliente com ID:', id);

    // Verificar role do usuário e cliente_id
    const { data: usuario, error: usuarioError } = await supabase
      .from('usuarios')
      .select('role, cliente_id')
      .eq('id', user.id)
      .single();

    if (usuarioError) {
      console.error('❌ Erro ao buscar usuário:', usuarioError);
      return NextResponse.json(
        { error: 'Erro ao verificar permissões' },
        { status: 500 }
      );
    }

    const isAgencia = await verificarPermissaoAgencia(user.id);

    // Buscar cliente usando supabaseAdmin (bypassa RLS)
    const { data, error } = await supabaseAdmin
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      console.error('❌ Cliente não encontrado:', { id, error });
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Se for cliente, verificar se tem permissão para ver este cliente
    if (!isAgencia && usuario.cliente_id !== id) {
      console.warn(`⚠️ Usuário ${user.email} tentou acessar cliente ${id} sem permissão`);
      return NextResponse.json(
        { error: 'Sem permissão para acessar este cliente' },
        { status: 403 }
      );
    }

    console.log('✅ Cliente encontrado:', data.nome_cliente);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// PATCH - Atualizar cliente
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient(); // ← AWAIT aqui!
    
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar role do usuário
    const isAgencia = await verificarPermissaoAgencia(user.id);

    // Buscar cliente (usando admin se for agência, normal se for cliente)
    let clienteExistente, checkError;
    
    if (isAgencia) {
      const result = await supabaseAdmin
        .from('clientes')
        .select('id, usuario_id, nome_cliente')
        .eq('id', id)
        .single();
      clienteExistente = result.data;
      checkError = result.error;
    } else {
      const result = await supabase
        .from('clientes')
        .select('id, usuario_id, nome_cliente')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single();
      clienteExistente = result.data;
      checkError = result.error;
    }

    if (checkError || !clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    // Cliente pode editar apenas se for dono
    const isOwner = clienteExistente.usuario_id === user.id;
    
    if (!isAgencia && !isOwner) {
      return NextResponse.json(
        { error: 'Sem permissão para editar este cliente' },
        { status: 403 }
      );
    }

    const body = await request.json();

    // 🚫 NUNCA permitir alterar usuario_id
    delete body.usuario_id;

    // Se estiver tentando atualizar nome_instancia, normalizar
    if (body.nome_instancia) {
      body.nome_instancia = body.nome_instancia
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^a-z0-9-]/g, '');

      // Validar formato
      if (!/^[a-z0-9-]+$/.test(body.nome_instancia)) {
        return NextResponse.json(
          { error: 'Nome da instância inválido' },
          { status: 400 }
        );
      }
    }

    // Atualizar (usando admin se for agência, normal se for cliente)
    let data, error;
    
    if (isAgencia) {
      const result = await supabaseAdmin
        .from('clientes')
        .update({
          ...body,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('clientes')
        .update({
          ...body,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erro ao atualizar cliente:', error);

      // Verificar se é erro de duplicação de nome_instancia
      const isDuplicateError = 
        error.message?.includes('duplicate key') || 
        ('code' in error && error.code === '23505');

      if (isDuplicateError) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este nome de instância' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao atualizar cliente' },
        { status: 500 }
      );
    }

    console.log(`✏️ Cliente atualizado: ${clienteExistente.nome_cliente}`);
    return NextResponse.json(data);
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// DELETE - Desativar cliente (soft delete)
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const supabase = await createClient(); // ← AWAIT aqui!
    
    // CRÍTICO: await params no Next.js 15+
    const params = await context.params;
    const id = params.id;

    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // Verificar role
    const isAgencia = await verificarPermissaoAgencia(user.id);

    // Buscar cliente
    let clienteExistente, checkError;
    
    if (isAgencia) {
      const result = await supabaseAdmin
        .from('clientes')
        .select('id, usuario_id, nome_cliente')
        .eq('id', id)
        .single();
      clienteExistente = result.data;
      checkError = result.error;
    } else {
      const result = await supabase
        .from('clientes')
        .select('id, usuario_id, nome_cliente')
        .eq('id', id)
        .eq('usuario_id', user.id)
        .single();
      clienteExistente = result.data;
      checkError = result.error;
    }

    if (checkError || !clienteExistente) {
      return NextResponse.json(
        { error: 'Cliente não encontrado ou sem permissão' },
        { status: 404 }
      );
    }

    const isOwner = clienteExistente.usuario_id === user.id;

    if (!isAgencia && !isOwner) {
      return NextResponse.json(
        { error: 'Sem permissão para deletar este cliente' },
        { status: 403 }
      );
    }

    // 🗑️ Soft delete (usando admin se for agência, normal se for cliente)
    let data, error;
    
    if (isAgencia) {
      const result = await supabaseAdmin
        .from('clientes')
        .update({ 
          ativo: false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    } else {
      const result = await supabase
        .from('clientes')
        .update({ 
          ativo: false,
          atualizado_em: new Date().toISOString(),
        })
        .eq('id', id)
        .select()
        .single();
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erro ao desativar cliente:', error);
      return NextResponse.json(
        { error: 'Erro ao desativar cliente' },
        { status: 500 }
      );
    }

    console.log(`🗑️ Cliente desativado: ${clienteExistente.nome_cliente}`);
    return NextResponse.json({ 
      message: 'Cliente desativado com sucesso', 
      data 
    });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
