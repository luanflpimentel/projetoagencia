# 🔧 INSTRUÇÕES - Executar Migration do Chatwoot

## ⚠️ IMPORTANTE: Execute esta migration no Supabase

Você precisa executar o arquivo de migration no Supabase SQL Editor para adicionar os campos do Chatwoot.

### 📝 Passos:

1. Abra o Supabase Dashboard
2. Vá em **SQL Editor**
3. Cole o conteúdo do arquivo: `supabase/migrations/add_chatwoot_fields_to_clientes.sql`
4. Execute a query

### 📄 Arquivo da Migration:

Localização: `supabase/migrations/add_chatwoot_fields_to_clientes.sql`

### ✅ O que a migration faz:

- Cria o ENUM `chatwoot_status_enum` ('pending', 'active', 'error')
- Adiciona 9 colunas à tabela `clientes`:
  - `chatwoot_account_id`
  - `chatwoot_user_id`
  - `chatwoot_user_email`
  - `chatwoot_user_access_token`
  - `chatwoot_inbox_id`
  - `chatwoot_channel_id`
  - `chatwoot_status`
  - `chatwoot_provisioned_at`
  - `chatwoot_error_message`
- Cria índices para otimização
- Adiciona 3 novos tipos de evento ao ENUM `tipo_evento_enum`:
  - `chatwoot_provisionado`
  - `chatwoot_erro`
  - `chatwoot_uazapi_integrado`

### 🐛 Se houver erro 500:

O erro 500 no GET `/api/clientes` geralmente indica que:
1. A migration não foi executada
2. Os campos do Chatwoot não existem na tabela
3. Os tipos de evento não foram adicionados ao ENUM

**Solução**: Execute a migration no Supabase SQL Editor.

### 📊 Como verificar se funcionou:

Depois de executar a migration, volte ao navegador e recarregue a página `/dashboard/clientes`.

Se ainda houver erro, verifique os logs do Supabase ou do Next.js para mais detalhes.
