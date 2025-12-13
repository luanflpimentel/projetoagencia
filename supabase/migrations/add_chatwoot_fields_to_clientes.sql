-- Migration: Adicionar campos de integração com Chatwoot
-- Data: 2025-12-12
-- Descrição: Campos para armazenar dados de provisionamento do Chatwoot

-- Criar tipo ENUM para status do Chatwoot
DO $$ BEGIN
  CREATE TYPE chatwoot_status_enum AS ENUM ('pending', 'active', 'error');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Adicionar colunas à tabela clientes
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS chatwoot_account_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_user_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_user_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS chatwoot_user_access_token TEXT,
ADD COLUMN IF NOT EXISTS chatwoot_inbox_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_channel_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_status chatwoot_status_enum,
ADD COLUMN IF NOT EXISTS chatwoot_provisioned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chatwoot_error_message TEXT;

-- Comentários descritivos
COMMENT ON COLUMN clientes.chatwoot_account_id IS 'ID da account criada no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_user_id IS 'ID do usuário administrador criado no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_user_email IS 'Email do usuário Chatwoot (mesmo que email_contato)';
COMMENT ON COLUMN clientes.chatwoot_user_access_token IS 'Token de acesso do usuário Chatwoot para chamadas API';
COMMENT ON COLUMN clientes.chatwoot_inbox_id IS 'ID da inbox (caixa de entrada) criada no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_channel_id IS 'ID do canal API associado à inbox';
COMMENT ON COLUMN clientes.chatwoot_status IS 'Status do provisionamento Chatwoot: pending, active ou error';
COMMENT ON COLUMN clientes.chatwoot_provisioned_at IS 'Data e hora em que o Chatwoot foi provisionado com sucesso';
COMMENT ON COLUMN clientes.chatwoot_error_message IS 'Mensagem de erro do último provisionamento (se houver)';

-- Índices para otimização de consultas
CREATE INDEX IF NOT EXISTS idx_clientes_chatwoot_status ON clientes(chatwoot_status) WHERE chatwoot_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_chatwoot_account_id ON clientes(chatwoot_account_id) WHERE chatwoot_account_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_chatwoot_inbox_id ON clientes(chatwoot_inbox_id) WHERE chatwoot_inbox_id IS NOT NULL;

-- Adicionar ao tipo de evento de logs
DO $$
BEGIN
  -- Verificar se o tipo existe antes de tentar alterá-lo
  IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_evento_enum') THEN
    ALTER TYPE tipo_evento_enum ADD VALUE IF NOT EXISTS 'chatwoot_provisionado';
    ALTER TYPE tipo_evento_enum ADD VALUE IF NOT EXISTS 'chatwoot_erro';
    ALTER TYPE tipo_evento_enum ADD VALUE IF NOT EXISTS 'chatwoot_uazapi_integrado';
  END IF;
END $$;
