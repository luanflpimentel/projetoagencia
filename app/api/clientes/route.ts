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

    // 🔍 Verificar role do usuário e cliente_id
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

    console.log('📋 Dados do usuário:', {
      id: user.id,
      email: user.email,
      role: usuario?.role,
      cliente_id: usuario?.cliente_id
    });

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
      console.log(`✅ [AGÊNCIA] Retornados ${data?.length || 0} clientes`);
    } else {
      // 🔒 CLIENTE: filtrar pelo cliente_id do usuário
      console.log(`🔒 [CLIENTE] ${user.email} - Filtrando por cliente_id: ${usuario.cliente_id}`);

      if (!usuario.cliente_id) {
        console.warn('⚠️ Usuário tipo cliente sem cliente_id associado');
        return NextResponse.json([]);
      }

      // Usar supabaseAdmin para bypass RLS e garantir que encontre o cliente
      const result = await supabaseAdmin
        .from('clientes')
        .select('*')
        .eq('id', usuario.cliente_id)
        .order('criado_em', { ascending: false });

      data = result.data;
      error = result.error;

      console.log('🔍 Resultado da query:', {
        encontrado: data?.length || 0,
        dados: data,
        erro: error
      });
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

    // 🔗 Gerar link de convite se email fornecido
    let convite = null;
    if (body.email && body.gerar_convite !== false) {
      try {
        console.log(`🔗 Gerando link de convite para: ${body.email}`);

        // Gerar token único de convite
        const token = crypto.randomUUID();
        const expiraEm = new Date();
        expiraEm.setDate(expiraEm.getDate() + 7); // Expira em 7 dias

        // Salvar convite no banco usando supabaseAdmin
        const { data: conviteData, error: conviteError } = await supabaseAdmin
          .from('convites')
          .insert({
            email: body.email,
            nome_completo: body.nome_cliente,
            role: 'cliente',
            cliente_id: cliente.id,
            telefone: body.numero_whatsapp || null,
            token,
            expira_em: expiraEm.toISOString(),
            criado_por: user.id
          })
          .select()
          .single();

        if (conviteError) {
          console.error('Erro ao criar convite:', conviteError);
        } else {
          const linkConvite = `${request.nextUrl.origin}/aceitar-convite?token=${token}`;
          convite = {
            email: body.email,
            token,
            link: linkConvite,
            expira_em: expiraEm.toISOString()
          };
          console.log(`✅ Convite gerado: ${linkConvite}`);
        }
      } catch (error) {
        console.error('Erro ao gerar convite:', error);
        // Não falhar a criação do cliente por causa disso
      }
    }

    console.log(`✅ Cliente criado: ${cliente.id}`);
    return NextResponse.json({
      cliente,
      convite
    }, { status: 201 });
    
  } catch (error) {
    console.error('Erro no servidor:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}
