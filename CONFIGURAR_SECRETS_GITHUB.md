# 🔐 Configurar Secrets no GitHub

## ⚠️ AÇÃO OBRIGATÓRIA ANTES DO PRÓXIMO PUSH

Para o build do Docker funcionar, você precisa adicionar as variáveis de ambiente como **Secrets** no repositório GitHub.

## 📍 Como Adicionar Secrets

### 1. Acessar Configurações do Repositório

1. Vá para: https://github.com/LuanRamalho/projetoagencia
2. Clique em **Settings** (aba no topo)
3. No menu lateral esquerdo, clique em **Secrets and variables** → **Actions**
4. Clique no botão verde **New repository secret**

### 2. Adicionar Cada Secret

Adicione **um por vez** os seguintes secrets (copie os valores do `.env.production`):

#### Secret 1: NEXT_PUBLIC_SUPABASE_URL
- **Name**: `NEXT_PUBLIC_SUPABASE_URL`
- **Value**: `https://mrextxgeuqkxhcqchffk.supabase.co`

#### Secret 2: NEXT_PUBLIC_SUPABASE_ANON_KEY
- **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODUwMTUsImV4cCI6MjA3ODM2MTAxNX0.lO8Dfx8mRoXsMezaLT1KMravFjA4agPG860OcX-13Rg`

#### Secret 3: SUPABASE_SERVICE_ROLE_KEY
- **Name**: `SUPABASE_SERVICE_ROLE_KEY`
- **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NTAxNSwiZXhwIjoyMDc4MzYxMDE1fQ.ipL3NmKGdQx6vBYdERWyia5UMxw-Ii3Jd01hrLOe9Vk`

#### Secret 4: UAZAPI_BASE_URL
- **Name**: `UAZAPI_BASE_URL`
- **Value**: `https://zeyno.uazapi.com`

#### Secret 5: UAZAPI_ADMIN_TOKEN
- **Name**: `UAZAPI_ADMIN_TOKEN`
- **Value**: `Xbxw94F4nXj5qcNSbXq68QcfxGImfFmLgpSAgy3PLp44ldsFdz`

#### Secret 6: WEBHOOK_SECRET
- **Name**: `WEBHOOK_SECRET`
- **Value**: `31c2704a2d3a57894b2e129d3e3854ecedfd3fee8b3980eff3e2830b4a1fbbe6`

#### Secret 7: CHATWOOT_BASE_URL
- **Name**: `CHATWOOT_BASE_URL`
- **Value**: `https://chat.zeyno.dev.br`

#### Secret 8: NEXT_PUBLIC_CHATWOOT_BASE_URL
- **Name**: `NEXT_PUBLIC_CHATWOOT_BASE_URL`
- **Value**: `https://chat.zeyno.dev.br`

#### Secret 9: CHATWOOT_PLATFORM_API_TOKEN
- **Name**: `CHATWOOT_PLATFORM_API_TOKEN`
- **Value**: `Jg85PT3GxtxhW3FCcn4jugCm`

#### Secret 10: NEXT_PUBLIC_APP_URL
- **Name**: `NEXT_PUBLIC_APP_URL`
- **Value**: `https://zeyno.app.br`

## ✅ Verificar Secrets Adicionados

Após adicionar todos, você deve ver 10 secrets listados em:
https://github.com/LuanRamalho/projetoagencia/settings/secrets/actions

## 🚀 Próximo Passo

Depois de adicionar todos os secrets:

```bash
git add .
git commit -m "fix: Adiciona variáveis de ambiente ao Docker build"
git push origin master
```

O GitHub Actions agora terá acesso às variáveis durante o build do Docker e o erro será resolvido.

---

**IMPORTANTE**: Nunca compartilhe esses valores publicamente. Eles já estão como secrets no GitHub e não serão expostos nos logs.
