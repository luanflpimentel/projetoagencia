// lib/queries/logs.ts
// Queries para logs_sistema - SERVER SIDE

import { supabaseAdmin } from '@/lib/supabase-admin';
import type { TipoEvento } from '@/lib/types';

interface LogInput {
  cliente_id: string;
  tipo_evento: TipoEvento;
  descricao: string;
  detalhes?: Record<string, any>;
}

export const logsQueries = {
  // Listar logs
  listar: async (filtros?: { clienteId?: string; tipoEvento?: string; limit?: number }) => {
    let query = supabaseAdmin
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
  criar: async (dados: LogInput) => {
    // Mapear 'detalhes' para 'metadata' conforme o schema do banco
    const logData = {
      cliente_id: dados.cliente_id,
      tipo_evento: dados.tipo_evento,
      descricao: dados.descricao,
      metadata: dados.detalhes || {},
    };

    const { data, error } = await supabaseAdmin
      .from('logs_sistema')
      .insert(logData)
      .select()
      .single();

    return { data, error };
  },

  // Últimas atividades (para dashboard)
  ultimasAtividades: async (limit: number = 5) => {
    const { data, error } = await supabaseAdmin
      .from('logs_sistema')
      .select('*')
      .order('criado_em', { ascending: false })
      .limit(limit);

    return { data, error };
  },
};
