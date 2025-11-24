// app/api/clientes/route.ts - NEXT.JS 15+
import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase-server';
import { verificarPermissaoAgencia, supabaseAdmin } from '@/lib/supabase-admin';

// GET - Listar clientes (com filtro por usuario_id)
export async function GET() {
  try {
    const supabase = await createClient(); // ← AWAIT aqui!
    
    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    // 🔍 Verificar role do usuário
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

    const isAgencia = await verificarPermissaoAgencia(user.id);

    let data, error;

    if (isAgencia) {
      // 👑 AGÊNCIA: usar supabaseAdmin (bypassa RLS)
      console.log(`👑 [AGÊNCIA] ${user.email} - Usando admin client`);
      const result = await supabaseAdmin
        .from('clientes')
        .select('*')
        .order('criado_em', { ascending: false });
      data = result.data;
      error = result.error;
    } else {
      // 🔒 CLIENTE: usar supabase normal (RLS ativo)
      console.log(`🔒 [CLIENTE] ${user.email} - Filtrando por usuario_id`);
      const result = await supabase
        .from('clientes')
        .select('*')
        .eq('usuario_id', user.id)
        .order('criado_em', { ascending: false });
      data = result.data;
      error = result.error;
    }

    if (error) {
      console.error('Erro ao listar clientes:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar clientes' },
        { status: 500 }
      );
    }

    console.log(`✅ Retornando ${data?.length || 0} cliente(s)`);
    return NextResponse.json(data || []);
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

// POST - Criar novo cliente
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient(); // ← AWAIT aqui!
    
    // 🔐 Autenticar usuário
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Não autenticado' },
        { status: 401 }
      );
    }

    const body = await request.json();

    // Validação básica
    if (!body.nome_cliente || !body.nome_instancia || !body.nome_escritorio) {
      return NextResponse.json(
        { error: 'Campos obrigatórios: nome_cliente, nome_instancia, nome_escritorio' },
        { status: 400 }
      );
    }

    // Normalizar nome_instancia (lowercase, sem espaços)
    const nomeInstanciaNormalizado = body.nome_instancia
      .toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');

    // Validar se nome_instancia é válido
    if (!/^[a-z0-9-]+$/.test(nomeInstanciaNormalizado)) {
      return NextResponse.json(
        { error: 'Nome da instância inválido. Use apenas letras minúsculas, números e hífens.' },
        { status: 400 }
      );
    }

    // 🔒 FORÇAR usuario_id = usuário logado
    const dadosCliente = {
      nome_cliente: body.nome_cliente,
      nome_instancia: nomeInstanciaNormalizado,
      numero_whatsapp: body.numero_whatsapp || null,
      email: body.email || null,
      nome_escritorio: body.nome_escritorio,
      nome_agente: body.nome_agente || 'Julia',
      prompt_sistema: body.prompt_sistema || 'Você é um assistente prestativo.',
      usuario_id: user.id, // ⚠️ SEMPRE usuário logado
    };

    console.log(`➕ [CRIAR] ${user.email} criando: ${dadosCliente.nome_cliente}`);

    // Inserir cliente
    const { data: cliente, error: clienteError } = await supabase
      .from('clientes')
      .insert(dadosCliente)
      .select()
      .single();

    if (clienteError) {
      console.error('Erro ao criar cliente:', clienteError);
      
      // Verificar se é erro de duplicação
      const isDuplicateError = 
        clienteError.message?.includes('duplicate key') || 
        ('code' in clienteError && clienteError.code === '23505');

      if (isDuplicateError) {
        return NextResponse.json(
          { error: 'Já existe um cliente com este nome de instância' },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: 'Erro ao criar cliente' },
        { status: 500 }
      );
    }

    // Se tiver template_ids, associar templates
    if (body.template_ids && Array.isArray(body.template_ids) && body.template_ids.length > 0) {
      const templateAssociations = body.template_ids.map((templateId: string) => ({
        cliente_id: cliente.id,
        template_id: templateId,
      }));

      const { error: templateError } = await supabase
        .from('clientes_templates')
        .insert(templateAssociations);

      if (templateError) {
        console.error('Erro ao associar templates:', templateError);
        // Não falhar a criação do cliente por causa disso
      }
    }

    console.log(`✅ Cliente criado: ${cliente.id}`);
    return NextResponse.json(cliente, { status: 201 });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
