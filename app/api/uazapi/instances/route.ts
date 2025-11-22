// app/api/uazapi/instances/route.ts - VERSÃO FINAL COM instance_token
import { NextRequest, NextResponse } from 'next/server';
import { uazapiService } from '@/lib/services/uazapi.service';
import { getSupabase } from '@/lib/supabase';
import { logsQueries } from '@/lib/supabase-queries';

// POST - Criar instância
export async function POST(request: NextRequest) {
  try {
    const { clienteId, nomeInstancia } = await request.json();

    // Validar
    if (!clienteId || !nomeInstancia) {
      return NextResponse.json(
        { error: 'clienteId e nomeInstancia são obrigatórios' },
        { status: 400 }
      );
    }

    // Validar formato do nome da instância
    if (!/^[a-z0-9-]+$/.test(nomeInstancia)) {
      return NextResponse.json(
        { 
          error: 'nomeInstancia deve conter apenas letras minúsculas, números e hífen' 
        },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Verificar se instância já existe no banco
    const { data: clienteExistente } = await supabase
      .from('clientes')
      .select('id')
      .eq('nome_instancia', nomeInstancia)
      .neq('id', clienteId)
      .single();

    if (clienteExistente) {
      return NextResponse.json(
        { error: 'Esta instância já está sendo usada por outro cliente' },
        { status: 409 }
      );
    }

    console.log('🔄 Criando instância na UAZAPI:', nomeInstancia);

    // Criar na UAZAPI
    const instanceData = await uazapiService.createInstance({
      name: nomeInstancia,
      systemName: 'botconversa',
    });

    console.log('✅ Instância criada na UAZAPI:', instanceData);

    // Extrair token da resposta (pode estar em 2 lugares)
    const instanceToken = instanceData.token || instanceData.instance?.token;
    
    if (!instanceToken) {
      throw new Error('Token da instância não foi retornado pela UAZAPI');
    }

    console.log('🔑 Token da instância:', instanceToken);

    // Atualizar cliente no banco com o token
    const { error: updateError } = await supabase
      .from('clientes')
      .update({
        status_conexao: 'desconectado',
        instance_token: instanceToken,
        atualizado_em: new Date().toISOString(),
      })
      .eq('id', clienteId);

    if (updateError) {
      console.error('❌ Erro ao atualizar cliente:', updateError);
      throw new Error(`Erro ao salvar token no banco: ${updateError.message}`);
    }

    console.log('✅ Token salvo no banco com sucesso!');

    // Log
    await logsQueries.criar({
      cliente_id: clienteId,
      tipo_evento: 'instancia_criada',
      descricao: `Instância ${nomeInstancia} criada na UAZAPI com token ${instanceToken.substring(0, 8)}...`,
    });

    return NextResponse.json({
      success: true,
      instanceName: nomeInstancia,
      token: instanceToken,
      status: 'status' in instanceData ? instanceData.status : instanceData.instance?.status || 'unknown',
    });
  } catch (error: any) {
    console.error('❌ Erro ao criar instância:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao criar instância na UAZAPI' },
      { status: 500 }
    );
  }
}

// GET - Listar instâncias
export async function GET() {
  try {
    const instances = await uazapiService.listInstances();
    
    return NextResponse.json({
      success: true,
      instances: instances,
      count: instances.length,
    });
  } catch (error: any) {
    console.error('Erro ao listar instâncias:', error);
    return NextResponse.json(
      { error: error.message || 'Erro ao listar instâncias' },
      { status: 500 }
    );
  }
}