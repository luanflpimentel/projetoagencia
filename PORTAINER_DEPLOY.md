# 🐳 Deploy no Portainer - Guia Rápido

## ✅ Problema do Link de Convite Resolvido

O link estava aparecendo como `https://0.0.0.0:3000/...` porque o código não estava usando a variável `NEXT_PUBLIC_APP_URL`.

**Correção aplicada**: Agora o código usa `NEXT_PUBLIC_APP_URL` em produção.

---

## 📋 Variáveis de Ambiente Necessárias no Portainer

Você já tem **5 variáveis**. Precisa adicionar mais **5**:

### ✅ Já Adicionadas (conforme screenshot)
1. `NEXT_PUBLIC_SUPABASE_ANON_KEY`
2. `NEXT_PUBLIC_SUPABASE_URL`
3. `NODE_ENV`
4. `SUPABASE_SERVICE_ROLE_KEY`
5. `UAZAPI_ADMIN_TOKEN`
6. `UAZAPI_BASE_URL`

### ❌ Faltam Adicionar (IMPORTANTE!)
7. **WEBHOOK_SECRET**
   - `31c2704a2d3a57894b2e129d3e3854ecedfd3fee8b3980eff3e2830b4a1fbbe6`

8. **CHATWOOT_BASE_URL**
   - `https://chat.zeyno.dev.br`

9. **NEXT_PUBLIC_CHATWOOT_BASE_URL**
   - `https://chat.zeyno.dev.br`

10. **CHATWOOT_PLATFORM_API_TOKEN**
   - `Jg85PT3GxtxhW3FCcn4jugCm`

11. **NEXT_PUBLIC_APP_URL** ⭐ **CRÍTICO** (corrige o link de convite)
   - `https://zeyno.app.br`

---

## 🚀 Passo a Passo no Portainer

### 1. Adicionar as Variáveis Faltantes

1. Acesse sua Stack no Portainer
2. Role até **"Environment variables"**
3. Clique em **"+ Add an environment variable"**
4. Adicione cada uma das 5 variáveis acima:
   - **name**: Nome da variável (ex: `WEBHOOK_SECRET`)
   - **value**: Valor correspondente

### 2. Fazer Pull da Nova Imagem

Como você commitou o código corrigido, precisa fazer um novo build da imagem Docker.

#### Opção A: GitHub Actions Build (se configurou os secrets)
```bash
# No seu terminal local
git push origin master

# Aguarde o build em: https://github.com/LuanRamalho/projetoagencia/actions
# Depois, no Portainer:
# 1. Vá na Stack
# 2. Clique em "Pull and Redeploy"
```

#### Opção B: Build Local + Push Manual
```bash
# No seu terminal local
docker build -t ghcr.io/luanramalho/projetoagencia:latest \
  --build-arg NEXT_PUBLIC_SUPABASE_URL=https://mrextxgeuqkxhcqchffk.supabase.co \
  --build-arg NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjI3ODUwMTUsImV4cCI6MjA3ODM2MTAxNX0.lO8Dfx8mRoXsMezaLT1KMravFjA4agPG860OcX-13Rg \
  --build-arg NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.zeyno.dev.br \
  --build-arg NEXT_PUBLIC_APP_URL=https://zeyno.app.br \
  --build-arg SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1yZXh0eGdldXFreGhjcWNoZmZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2Mjc4NTAxNSwiZXhwIjoyMDc4MzYxMDE1fQ.ipL3NmKGdQx6vBYdERWyia5UMxw-Ii3Jd01hrLOe9Vk \
  --build-arg CHATWOOT_BASE_URL=https://chat.zeyno.dev.br \
  --build-arg CHATWOOT_PLATFORM_API_TOKEN=Jg85PT3GxtxhW3FCcn4jugCm \
  --build-arg UAZAPI_BASE_URL=https://zeyno.uazapi.com \
  --build-arg UAZAPI_ADMIN_TOKEN=Xbxw94F4nXj5qcNSbXq68QcfxGImfFmLgpSAgy3PLp44ldsFdz \
  --build-arg WEBHOOK_SECRET=31c2704a2d3a57894b2e129d3e3854ecedfd3fee8b3980eff3e2830b4a1fbbe6 \
  .

docker push ghcr.io/luanramalho/projetoagencia:latest

# Depois, no Portainer:
# 1. Vá na Stack
# 2. Clique em "Pull and Redeploy"
```

### 3. Redeploy da Stack

1. No Portainer, vá na sua Stack
2. Clique em **"Update the stack"**
3. Role até o final
4. Marque: **"Re-pull image and redeploy"** (se disponível)
5. Clique em **"Update"**

---

## ✅ Verificar se Funcionou

Depois do redeploy:

1. **Criar novo cliente** com email válido
2. **Verificar o link de convite**:
   - ✅ Deve aparecer: `https://zeyno.app.br/aceitar-convite?token=...`
   - ❌ NÃO deve aparecer: `https://0.0.0.0:3000/...`

---

## 🔍 Verificar Variáveis no Container

Para confirmar que as variáveis foram carregadas:

1. No Portainer, vá em **Containers**
2. Clique no container da aplicação
3. Vá em **"Console"** → **"Connect"**
4. Execute:
   ```bash
   echo $NEXT_PUBLIC_APP_URL
   # Deve retornar: https://zeyno.app.br

   echo $CHATWOOT_BASE_URL
   # Deve retornar: https://chat.zeyno.dev.br
   ```

---

## 📊 Checklist Final

- [ ] Adicionar 5 variáveis faltantes no Portainer
- [ ] Fazer push do código para GitHub (`git push origin master`)
- [ ] Aguardar build completar (se usar GitHub Actions)
- [ ] Fazer redeploy da stack no Portainer
- [ ] Criar cliente de teste
- [ ] Verificar link de convite correto (`https://zeyno.app.br/...`)
- [ ] Executar migrations no Supabase (ver [CHECKLIST_DEPLOY.md](CHECKLIST_DEPLOY.md))

---

**Última atualização**: 2025-12-13
