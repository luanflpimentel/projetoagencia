-- Migration: Adicionar campos para controle da IA e grupo de avisos

-- Adicionar campo para controlar se IA está ativa
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS ia_ativa BOOLEAN DEFAULT true;

-- Adicionar campo para armazenar ID do grupo de avisos (criado na primeira conexão)
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS grupo_avisos_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN clientes.ia_ativa IS 'Indica se a IA está ativa para responder mensagens (pode ser pausada sem desconectar WhatsApp)';
COMMENT ON COLUMN clientes.grupo_avisos_id IS 'ID do grupo de avisos criado automaticamente na primeira conexão (formato: 120363XXXXX@g.us)';

-- Índice para consultas rápidas de clientes com IA ativa
CREATE INDEX IF NOT EXISTS idx_clientes_ia_ativa ON clientes(ia_ativa) WHERE ia_ativa = true;
