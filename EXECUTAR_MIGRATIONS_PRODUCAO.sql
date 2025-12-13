-- ============================================
-- MIGRATIONS PARA PRODUÇÃO
-- Execute este arquivo completo no SQL Editor do Supabase
-- URL: https://supabase.com/dashboard/project/mrextxgeuqkxhcqchffk/sql
-- ============================================

-- ============================================
-- MIGRATION 1: Chatwoot
-- ============================================

-- Adicionar colunas do Chatwoot
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS chatwoot_account_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_user_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_user_email TEXT,
ADD COLUMN IF NOT EXISTS chatwoot_user_access_token TEXT,
ADD COLUMN IF NOT EXISTS chatwoot_inbox_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_channel_id INTEGER,
ADD COLUMN IF NOT EXISTS chatwoot_status TEXT CHECK (chatwoot_status IN ('pending', 'active', 'error')),
ADD COLUMN IF NOT EXISTS chatwoot_provisioned_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS chatwoot_error_message TEXT;

-- Comentários para documentação
COMMENT ON COLUMN clientes.chatwoot_account_id IS 'ID da Account criada no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_user_id IS 'ID do User criado no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_user_email IS 'Email do usuário no Chatwoot (mesma do cliente)';
COMMENT ON COLUMN clientes.chatwoot_user_access_token IS 'Token de acesso do usuário para API do Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_inbox_id IS 'ID da Inbox (caixa de entrada) criada no Chatwoot';
COMMENT ON COLUMN clientes.chatwoot_channel_id IS 'ID do Channel vinculado à Inbox';
COMMENT ON COLUMN clientes.chatwoot_status IS 'Status do provisionamento: pending (aguardando WhatsApp), active (funcionando), error (falha)';
COMMENT ON COLUMN clientes.chatwoot_provisioned_at IS 'Data/hora em que o Chatwoot foi provisionado';
COMMENT ON COLUMN clientes.chatwoot_error_message IS 'Mensagem de erro caso provisionamento falhe';

-- Índices para otimizar consultas
CREATE INDEX IF NOT EXISTS idx_clientes_chatwoot_status ON clientes(chatwoot_status) WHERE chatwoot_status IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_clientes_chatwoot_account ON clientes(chatwoot_account_id) WHERE chatwoot_account_id IS NOT NULL;

-- ============================================
-- MIGRATION 2: IA e Grupo de Avisos
-- ============================================

-- Adicionar campo para controlar se IA está ativa
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS ia_ativa BOOLEAN DEFAULT true;

-- Adicionar campo para armazenar ID do grupo de avisos
ALTER TABLE clientes
ADD COLUMN IF NOT EXISTS grupo_avisos_id TEXT;

-- Comentários para documentação
COMMENT ON COLUMN clientes.ia_ativa IS 'Indica se a IA está ativa para responder mensagens (pode ser pausada sem desconectar WhatsApp)';
COMMENT ON COLUMN clientes.grupo_avisos_id IS 'ID do grupo de avisos criado automaticamente na primeira conexão (formato: 120363XXXXX@g.us)';

-- Índice para consultas rápidas
CREATE INDEX IF NOT EXISTS idx_clientes_ia_ativa ON clientes(ia_ativa) WHERE ia_ativa = true;

-- ============================================
-- VERIFICAÇÃO: Confirmar colunas criadas
-- ============================================

-- Execute esta query para confirmar que tudo foi criado
SELECT
    column_name,
    data_type,
    column_default,
    is_nullable
FROM information_schema.columns
WHERE table_name = 'clientes'
AND column_name IN (
    'chatwoot_account_id',
    'chatwoot_user_id',
    'chatwoot_user_email',
    'chatwoot_user_access_token',
    'chatwoot_inbox_id',
    'chatwoot_channel_id',
    'chatwoot_status',
    'chatwoot_provisioned_at',
    'chatwoot_error_message',
    'ia_ativa',
    'grupo_avisos_id'
)
ORDER BY column_name;

-- ============================================
-- RESULTADO ESPERADO:
-- Deve listar 11 colunas
-- ============================================
