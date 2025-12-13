// app/api/uazapi/instances/[name]/create-group/route.ts
// API para criar grupo de avisos automaticamente

import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { uazapiService } from '@/lib/services/uazapi.service';

// Admin client para bypass de RLS
const supabaseAdmin = createSupabaseAdmin(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ name: string }> }
) {
  try {
    const { name: instanceName } = await params;

    console.log('📱 [CREATE GROUP] Iniciando criação de grupo para:', instanceName);

    // Buscar cliente e token usando admin client
    const { data: cliente, error: clienteError } = await supabaseAdmin
      .from('clientes')
      .select('id, nome_escritorio, instance_token, grupo_avisos_id')
      .eq('nome_instancia', instanceName)
      .single();

    if (clienteError || !cliente) {
      console.error('❌ [CREATE GROUP] Cliente não encontrado:', clienteError);
      return NextResponse.json(
        { error: 'Cliente não encontrado' },
        { status: 404 }
      );
    }

    // Verificar se grupo já foi criado
    if (cliente.grupo_avisos_id) {
      console.log('⏭️ [CREATE GROUP] Grupo já existe:', cliente.grupo_avisos_id);
      return NextResponse.json({
        success: true,
        message: 'Grupo já foi criado anteriormente',
        groupId: cliente.grupo_avisos_id,
        alreadyExists: true
      });
    }

    if (!cliente.instance_token) {
      console.error('❌ [CREATE GROUP] Token não encontrado');
      return NextResponse.json(
        { error: 'Token da instância não encontrado' },
        { status: 400 }
      );
    }

    // Nome do grupo
    const groupName = `IA - ${cliente.nome_escritorio} - AVISOS`;
    console.log('📝 [CREATE GROUP] Nome do grupo:', groupName);

    // Criar grupo via UAZAPI usando o serviço
    const participants = ['5569992800140']; // ✅ Telefone obrigatório pela API UAZAPI

    console.log('🔄 [CREATE GROUP] Chamando UAZAPI Service...');

    const result = await uazapiService.createGroup(
      cliente.instance_token,
      groupName,
      participants
    );

    console.log('✅ [CREATE GROUP] Grupo criado:', result);

    // Extrair ID do grupo da resposta
    // Formato da UAZAPI: { group: { JID: "120363XXXXX@g.us" } }
    const groupId = result.group?.JID || result.groupId || result.id || result.group?.id;

    if (!groupId) {
      console.error('❌ [CREATE GROUP] ID do grupo não encontrado na resposta:', result);
      return NextResponse.json(
        { error: 'ID do grupo não retornado pela API' },
        { status: 500 }
      );
    }

    // Salvar ID do grupo no banco usando admin client
    const { error: updateError } = await supabaseAdmin
      .from('clientes')
      .update({
        grupo_avisos_id: groupId,
        atualizado_em: new Date().toISOString()
      })
      .eq('id', cliente.id);

    if (updateError) {
      console.error('❌ [CREATE GROUP] Erro ao salvar grupo no banco:', updateError);
      // Não falhar a requisição, pois o grupo foi criado
    }

    // Registrar log usando admin client
    await supabaseAdmin.from('logs_sistema').insert({
      tipo_evento: 'grupo_avisos_criado',
      descricao: `Grupo de avisos criado: ${groupName}`,
      cliente_id: cliente.id,
      detalhes: { groupId, groupName },
    });

    return NextResponse.json({
      success: true,
      groupId,
      groupName,
      message: 'Grupo de avisos criado com sucesso'
    });

  } catch (error: any) {
    console.error('❌ [CREATE GROUP] Erro inesperado:', error);
    return NextResponse.json(
      { error: 'Erro ao criar grupo', message: error.message },
      { status: 500 }
    );
  }
}
