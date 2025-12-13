# 🚀 Guia Completo de Deploy para Produção

## 📋 Checklist Pré-Deploy

### ✅ Concluído
- [x] Variáveis de ambiente configuradas em `.env.production`
- [x] Chatwoot FASE 1 e FASE 2 implementados
- [x] Criação automática de grupo implementada
- [x] Toggle de IA implementado
- [x] Correções de RLS aplicadas
- [x] Webhook configurado para respeitar `ia_ativa`

### ⚠️ Pendente (Executar Durante Deploy)
- [ ] Executar migrations no Supabase de produção
- [ ] Configurar variáveis de ambiente na plataforma de deploy
- [ ] Testar fluxo completo em produção

---

## 🗄️ PASSO 1: Executar Migrations no Supabase

### 1.1. Acessar Supabase Dashboard

1. Vá para: https://supabase.com/dashboard/project/mrextxgeuqkxhcqchffk
2. Faça login com suas credenciais
3. Clique em **SQL Editor** no menu lateral

### 1.2. Migration: Chatwoot (se ainda não executada)

**Copie e execute**:

```sql
-- Migration: Adicionar campos do Chatwoot à tabela clientes
-- Arquivo: supabase/migrations/add_chatwoot_fields_to_clientes.sql

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

-- Adicionar comentários para documentação
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
```

**Verificar**: Deve retornar "Success. No rows returned"

### 1.3. Migration: IA e Grupo de Avisos (se ainda não executada)

**Copie e execute**:

```sql
-- Migration: Adicionar campos para controle da IA e grupo de avisos
-- Arquivo: supabase/migrations/add_ia_fields_to_clientes.sql

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
```

**Verificar**: Deve retornar "Success. No rows returned"

### 1.4. Verificar Migrations Executadas

**Execute para confirmar**:

```sql
-- Verificar se as colunas foram criadas
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
    'chatwoot_inbox_id',
    'chatwoot_status',
    'ia_ativa',
    'grupo_avisos_id'
)
ORDER BY column_name;
```

**Resultado esperado**: Deve listar 6 colunas.

---

## ⚙️ PASSO 2: Configurar Variáveis de Ambiente

### 2.1. Vercel (se estiver usando Vercel)

1. Acesse: https://vercel.com/seu-projeto/settings/environment-variables
2. Adicione **TODAS** as variáveis do `.env.production`:

```bash
# SUPABASE
NEXT_PUBLIC_SUPABASE_URL=https://mrextxgeuqkxhcqchffk.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODUwMTUsImV4cCI6MjA3ODM2MTAxNX0.lO8Dfx8mRoXsMezaLT1KMravFjA4agPG860OcX-13Rg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NTAxNSwiZXhwIjoyMDc4MzYxMDE1fQ.ipL3NmKGdQx6vBYdERWyia5UMxw-Ii3Jd01hrLOe9Vk

# UAZAPI
UAZAPI_BASE_URL=https://agenciatalisma.uazapi.com
UAZAPI_ADMIN_TOKEN=Xbxw94F4nXj5qcNSbXq68QcfxGImfFmLgpSAgy3PLp44ldsFdz
WEBHOOK_SECRET=31c2704a2d3a57894b2e129d3e3854ecedfd3fee8b3980eff3e2830b4a1fbbe6

# CHATWOOT
CHATWOOT_BASE_URL=https://chat.zeyno.dev.br
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.zeyno.dev.br
CHATWOOT_PLATFORM_API_TOKEN=Jg85PT3GxtxhW3FCcn4jugCm

# APP CONFIG
NEXT_PUBLIC_APP_URL=https://zeyno.app.br
NODE_ENV=production
NEXT_TELEMETRY_DISABLED=1
```

3. **IMPORTANTE**: Marcar todas como **Production + Preview + Development**
4. Clicar em **Save**

### 2.2. Outras Plataformas

**Railway**:
- Vá em Settings → Variables
- Cole as variáveis acima

**DigitalOcean App Platform**:
- Vá em Settings → App-Level Environment Variables
- Adicione cada variável manualmente

**Docker/Self-hosted**:
- Copie o arquivo `.env.production` para o servidor
- Renomeie para `.env` na pasta do projeto

---

## 🚀 PASSO 3: Deploy

### 3.1. Vercel (Recomendado)

**Opção A - Via Git** (Recomendado):

```bash
# 1. Commit das mudanças
git add .
git commit -m "feat: Adiciona Chatwoot FASE 2, criação automática de grupo e toggle IA"

# 2. Push para branch main
git push origin main
```

O Vercel detectará automaticamente e fará o deploy.

**Opção B - CLI**:

```bash
# 1. Instalar Vercel CLI (se ainda não tiver)
npm i -g vercel

# 2. Deploy
vercel --prod
```

### 3.2. Railway

```bash
# 1. Commit
git add .
git commit -m "feat: Deploy completo com Chatwoot e IA"

# 2. Push
git push origin main
```

Railway fará deploy automaticamente.

### 3.3. Build Manual

```bash
# 1. Build de produção
npm run build

# 2. Iniciar servidor
npm run start
```

---

## ✅ PASSO 4: Testes Pós-Deploy

### 4.1. Teste Básico de Acesso

1. **Acessar aplicação**: https://zeyno.app.br
2. **Fazer login** com suas credenciais
3. **Verificar**: Página carrega sem erros

### 4.2. Teste de Criação de Cliente com Chatwoot

1. **Ir para**: Clientes → Novo Cliente
2. **Preencher**:
   - Nome do Escritório: `Teste Produção`
   - Email: `teste-producao-$(date +%s)@gmail.com` (usar email único)
   - Número WhatsApp: `69992800140`
   - Nome Agente: `Assistente`
3. **Clicar**: Criar Cliente
4. **Verificar**:
   - ✅ Toast de sucesso: "Chatwoot Account e User criados"
   - ✅ Badge amarelo: ⏳ `pending`
   - ✅ Não há erros no console

### 4.3. Teste de Conexão WhatsApp + Grupo + Chatwoot

1. **Clicar**: "Conectar WhatsApp" no card do cliente criado
2. **Escanear**: QR Code com WhatsApp
3. **Aguardar**: Conexão estabelecida (até 30 segundos)
4. **Verificar**:
   - ✅ Badge verde: ✓ `Conectado`
   - ✅ Badge verde Chatwoot: ✓ `Chatwoot` → `active`
   - ✅ Botão azul: 🤖 `IA Ativa`
   - ✅ Grupo criado no WhatsApp: "IA - Teste Produção - AVISOS"

### 4.4. Teste de Toggle da IA

1. **Clicar**: No botão "IA Ativa"
2. **Verificar**: Muda para "IA Pausada" (cinza)
3. **Recarregar página** (F5)
4. **Confirmar**: Continua como "IA Pausada"
5. **Enviar mensagem** no WhatsApp do cliente
6. **Verificar nos logs** (Vercel/Railway):
   ```
   ⏭️ [WEBHOOK] IA pausada para teste-producao, mensagem ignorada
   ```
7. **Clicar novamente**: Volta para "IA Ativa"

### 4.5. Teste de Login no Chatwoot

1. **Acessar**: https://chat.zeyno.dev.br
2. **Fazer login**:
   - Email: `teste-producao-XXXXX@gmail.com` (email do cliente)
   - Senha: `AgenciaTalisma1!`
3. **Verificar**:
   - ✅ Login bem-sucedido
   - ✅ Inbox aparece: "WhatsApp - Teste Produção"
   - ✅ Mensagens do WhatsApp aparecem na Inbox

---

## 🔍 PASSO 5: Monitoramento

### 5.1. Logs em Tempo Real

**Vercel**:
```bash
vercel logs --follow
```

**Railway**:
- Acesse: https://railway.app/project/seu-projeto/deployments
- Clique em "View Logs"

### 5.2. Verificar Erros Comuns

**Se Chatwoot não provisionar**:
```sql
-- Ver erros no Supabase
SELECT
    nome_cliente,
    chatwoot_status,
    chatwoot_error_message
FROM clientes
WHERE chatwoot_status = 'error'
ORDER BY atualizado_em DESC
LIMIT 10;
```

**Se grupo não for criado**:
```sql
-- Ver clientes sem grupo
SELECT
    nome_cliente,
    status_conexao,
    grupo_avisos_id
FROM clientes
WHERE status_conexao = 'conectado'
AND grupo_avisos_id IS NULL
ORDER BY ultima_conexao DESC;
```

### 5.3. Webhook UAZAPI

**Verificar se webhook está ativo**:

1. Vá para: https://agenciatalisma.uazapi.com
2. Configurações → Webhooks
3. Verificar URL: `https://zeyno.app.br/api/webhooks/uazapi`
4. Eventos habilitados:
   - ✅ `messages.upsert`
   - ✅ `connection.update`
   - ✅ `qr.updated`

---

## 🚨 Rollback (Se Necessário)

### Se algo der errado:

**Vercel**:
1. Vá em: https://vercel.com/seu-projeto/deployments
2. Encontre o último deploy funcional
3. Clique nos 3 pontos → "Promote to Production"

**Railway**:
1. Vá em Deployments
2. Clique no deploy anterior que funcionava
3. "Redeploy"

**Git**:
```bash
# Reverter último commit
git revert HEAD
git push origin main
```

---

## 📊 Checklist Final

- [ ] Migrations executadas no Supabase
- [ ] Variáveis de ambiente configuradas
- [ ] Deploy realizado
- [ ] Cliente de teste criado com sucesso
- [ ] WhatsApp conectado e grupo criado
- [ ] Badge Chatwoot mudou para `active`
- [ ] Toggle IA funcionando
- [ ] Login no Chatwoot funciona
- [ ] Mensagens chegam no Chatwoot
- [ ] Webhook respeitando `ia_ativa`

---

## 📞 Suporte

Se encontrar qualquer problema:

1. **Verificar logs** na plataforma de deploy
2. **Verificar migrations** no Supabase
3. **Verificar variáveis** de ambiente
4. **Testar endpoint** manualmente:
   ```bash
   curl https://zeyno.app.br/api/health
   ```

---

**Status**: ✅ Pronto para deploy!

**Última atualização**: 2025-12-13
