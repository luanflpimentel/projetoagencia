// ============================================
// SUPABASE QUERIES - BotConversa
// Queries prontas para usar no Next.js
// ============================================

import { createClient } from '@/lib/supabase-browser';
import type {
  Cliente,
  Template,
  ClienteTemplate,
  Atendimento,
  LogSistema,
  VwClienteLista,
  VwDashboardStats,
  VwTemplateComUso,
  VwClienteComTemplates,
  ClienteFormData,
  TemplateFormData,
} from '@/lib/types';

// Helper para obter cliente Supabase (lazy loading)
const getSupabase = () => {
  // Durante o build, retorna null
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return null;
  }
  return createClient();
};

// ===== CLIENTES =====

export const clientesQueries = {
  // Listar todos os clientes ativos
  listar: async () => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('vw_clientes_lista')
      .select('*')
      .eq('ativo', true)
      .order('nome_cliente', { ascending: true });
    
    return { data, error };
  },

  // Buscar cliente por ID
  buscarPorId: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Buscar cliente por nome da instância (para N8N)
  buscarPorInstancia: async (nomeInstancia: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .select('prompt_sistema')
      .eq('nome_instancia', nomeInstancia)
      .eq('ativo', true)
      .single();
    
    return { data, error };
  },

  // Buscar cliente com seus templates
  buscarComTemplates: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('vw_clientes_com_templates')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Criar novo cliente
  criar: async (dados: ClienteFormData) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    // 1. Criar cliente
    const { data: cliente, error: erroCliente } = await supabase
      .from('clientes')
      .insert({
        nome_cliente: dados.nome_cliente,
        nome_instancia: dados.nome_instancia,
        numero_whatsapp: dados.numero_whatsapp,
        email: dados.email,
        nome_escritorio: dados.nome_escritorio,
        nome_agente: dados.nome_agente || 'Julia',
        prompt_sistema: '', // Será gerado depois
      })
      .select()
      .single();

    if (erroCliente || !cliente) {
      return { data: null, error: erroCliente };
    }

    // 2. Associar templates
    if (dados.template_ids.length > 0) {
      const templateAssociations = dados.template_ids.map(templateId => ({
        cliente_id: cliente.id,
        template_id: templateId,
      }));

      const { error: erroTemplates } = await supabase
        .from('clientes_templates')
        .insert(templateAssociations);

      if (erroTemplates) {
        return { data: null, error: erroTemplates };
      }
    }

    // 3. Criar log
    await logsQueries.criar({
      cliente_id: cliente.id,
      tipo_evento: 'cliente_criado',
      descricao: `Cliente ${dados.nome_cliente} criado`,
    });

    return { data: cliente, error: null };
  },

  // Atualizar cliente
  atualizar: async (id: string, dados: Partial<Cliente>) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .update(dados)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Atualizar prompt do cliente
  atualizarPrompt: async (id: string, prompt: string, editadoManualmente: boolean = false) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .update({
        prompt_sistema: prompt,
        prompt_editado_manualmente: editadoManualmente,
        ultima_regeneracao: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Atualizar status de conexão
  atualizarStatusConexao: async (
    id: string, 
    status: 'desconectado' | 'connecting' | 'conectado'
  ) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const updates: any = { status_conexao: status };
    
    if (status === 'conectado') {
      updates.ultima_conexao = new Date().toISOString();
    } else if (status === 'desconectado') {
      updates.ultima_desconexao = new Date().toISOString();
    }

    const { data, error } = await supabase
      .from('clientes')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    // Log de conexão
    if (!error) {
      await logsQueries.criar({
        cliente_id: id,
        tipo_evento: 'conexao',
        descricao: `Status alterado para ${status}`,
      });
    }
    
    return { data, error };
  },

  // Soft delete (desativar)
  desativar: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Buscar clientes conectados
  listarConectados: async () => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes')
      .select('*')
      .eq('status_conexao', 'conectado')
      .eq('ativo', true)
      .order('nome_cliente');
    
    return { data, error };
  },
};

// ===== TEMPLATES =====

export const templatesQueries = {
  // Listar todos os templates ativos
  listar: async () => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('ativo', true)
      .order('nome_template');
    
    return { data, error };
  },

  // Buscar template por ID
  buscarPorId: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Criar novo template
  criar: async (dados: TemplateFormData) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .insert(dados)
      .select()
      .single();
    
    return { data, error };
  },

  // Atualizar template
  atualizar: async (id: string, dados: Partial<Template>) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .update(dados)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Duplicar template
  duplicar: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    // Buscar template original
    const { data: original, error: erroOriginal } = await templatesQueries.buscarPorId(id);
    
    if (erroOriginal || !original) {
      return { data: null, error: erroOriginal };
    }

    // Criar cópia
    const { data, error } = await supabase
      .from('templates')
      .insert({
        nome_template: `${original.nome_template} (Cópia)`,
        area_atuacao: original.area_atuacao,
        descricao: original.descricao,
        keywords: original.keywords,
        pitch_inicial: original.pitch_inicial,
        perguntas_qualificacao: original.perguntas_qualificacao,
        validacao_proposta: original.validacao_proposta,
        mensagem_desqualificacao: original.mensagem_desqualificacao,
      })
      .select()
      .single();
    
    return { data, error };
  },

  // Soft delete (desativar)
  desativar: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .update({ ativo: false })
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Buscar templates de um cliente
  buscarPorCliente: async (clienteId: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .select('*, clientes_templates!inner(cliente_id)')
      .eq('clientes_templates.cliente_id', clienteId)
      .eq('ativo', true);
    
    return { data, error };
  },
};

// ===== CLIENTES_TEMPLATES (Associação) =====

export const clientesTemplatesQueries = {
  // Adicionar template ao cliente
  adicionar: async (clienteId: string, templateId: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes_templates')
      .insert({ cliente_id: clienteId, template_id: templateId })
      .select()
      .single();
    
    return { data, error };
  },

  // Remover template do cliente
  remover: async (clienteId: string, templateId: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('clientes_templates')
      .delete()
      .eq('cliente_id', clienteId)
      .eq('template_id', templateId);
    
    return { data, error };
  },

  // Atualizar templates do cliente (remove todos e adiciona novos)
  atualizar: async (clienteId: string, templateIds: string[]) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    // 1. Remover todos os existentes
    await supabase
      .from('clientes_templates')
      .delete()
      .eq('cliente_id', clienteId);

    // 2. Adicionar novos
    if (templateIds.length === 0) {
      return { data: [], error: null };
    }

    const associations = templateIds.map(templateId => ({
      cliente_id: clienteId,
      template_id: templateId,
    }));

    const { data, error } = await supabase
      .from('clientes_templates')
      .insert(associations)
      .select();
    
    return { data, error };
  },
};

// ===== ATENDIMENTOS =====

export const atendimentosQueries = {
  // Listar atendimentos
  listar: async (filtros?: { clienteId?: string; status?: string; limit?: number }) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    let query = supabase
      .from('vw_atendimentos_recentes')
      .select('*');

    if (filtros?.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId);
    }

    if (filtros?.status) {
      query = query.eq('status_atendimento', filtros.status);
    }

    if (filtros?.limit) {
      query = query.limit(filtros.limit);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Buscar por ID
  buscarPorId: async (id: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('atendimentos')
      .select('*')
      .eq('id', id)
      .single();
    
    return { data, error };
  },

  // Criar atendimento
  criar: async (dados: Partial<Atendimento>) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('atendimentos')
      .insert(dados)
      .select()
      .single();

    // Log
    if (!error && data) {
      await logsQueries.criar({
        cliente_id: data.cliente_id || null,
        tipo_evento: 'atendimento_iniciado',
        descricao: `Atendimento iniciado com ${dados.telefone_lead}`,
      });
    }
    
    return { data, error };
  },

  // Atualizar atendimento
  atualizar: async (id: string, dados: Partial<Atendimento>) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('atendimentos')
      .update(dados)
      .eq('id', id)
      .select()
      .single();
    
    return { data, error };
  },

  // Finalizar atendimento
  finalizar: async (id: string, status: 'qualificado' | 'desqualificado' | 'encerrado') => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('atendimentos')
      .update({
        status_atendimento: status,
        finalizado_em: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    // Log
    if (!error && data) {
      await logsQueries.criar({
        cliente_id: data.cliente_id || null,
        tipo_evento: 'atendimento_finalizado',
        descricao: `Atendimento finalizado com status: ${status}`,
      });
    }
    
    return { data, error };
  },

  // Contar atendimentos hoje
  contarHoje: async () => {
    const supabase = getSupabase();
    if (!supabase) return { count: 0, error: new Error('Supabase not configured') };
    
    const hoje = new Date().toISOString().split('T')[0];
    
    const { count, error } = await supabase
      .from('atendimentos')
      .select('*', { count: 'exact', head: true })
      .gte('iniciado_em', `${hoje}T00:00:00`)
      .lte('iniciado_em', `${hoje}T23:59:59`);
    
    return { count: count || 0, error };
  },
};

// ===== LOGS =====

export const logsQueries = {
  // Listar logs
  listar: async (filtros?: { clienteId?: string; tipoEvento?: string; limit?: number }) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    let query = supabase
      .from('logs_sistema')
      .select('*')
      .order('criado_em', { ascending: false });

    if (filtros?.clienteId) {
      query = query.eq('cliente_id', filtros.clienteId);
    }

    if (filtros?.tipoEvento) {
      query = query.eq('tipo_evento', filtros.tipoEvento);
    }

    if (filtros?.limit) {
      query = query.limit(filtros.limit);
    }

    const { data, error } = await query;
    return { data, error };
  },

  // Criar log
  criar: async (dados: Omit<LogSistema, 'id' | 'criado_em'>) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('logs_sistema')
      .insert(dados)
      .select()
      .single();
    
    return { data, error };
  },

  // Últimas atividades (para dashboard)
  ultimasAtividades: async (limit: number = 5) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('logs_sistema')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit);
    
    return { data, error };
  },
};

// ===== DASHBOARD =====

export const dashboardQueries = {
  // Buscar estatísticas gerais
  stats: async () => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('vw_dashboard_stats')
      .select('*')
      .single();
    
    return { data, error };
  },

  // Top templates mais usados
  topTemplates: async (limit: number = 5) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .from('templates')
      .select('*')
      .eq('ativo', true)
      .order('nome_template')
      .limit(limit);
    
    return { data, error };
  },
};

// ===== GERAÇÃO DE PROMPT =====

export const promptQueries = {
  // Gerar prompt compilado usando a function do banco
  gerar: async (clienteId: string, nomeEscritorio: string, nomeAgente: string) => {
    const supabase = getSupabase();
    if (!supabase) return { data: null, error: new Error('Supabase not configured') };
    
    const { data, error } = await supabase
      .rpc('gerar_prompt_cliente', {
        p_cliente_id: clienteId,
        p_nome_escritorio: nomeEscritorio,
        p_nome_agente: nomeAgente,
      });
    
    return { data, error };
  },
};
