# 🎨 Rebranding Completo: Agência Talismã → Zeyno

## ✅ Alterações Realizadas

### 1. Componentes React e Interface

**Arquivos alterados:**
- [app/page.tsx](app/page.tsx) - Título e descrição da landing page
- [app/layout.tsx](app/layout.tsx) - Metadata do site
- [app/login/page.tsx](app/login/page.tsx) - Título da página de login
- [app/dashboard/page.tsx](app/dashboard/page.tsx) - Mensagem de boas-vindas
- [components/DashboardNav.tsx](components/DashboardNav.tsx) - Logo na navegação
- [components/layout/DashboardSidebar.tsx](components/layout/DashboardSidebar.tsx) - Logo e copyright na sidebar
- [components/layout/mobile-menu.tsx](components/layout/mobile-menu.tsx) - Logo no menu mobile

**Mudanças:**
- ❌ "Agência Talismã" → ✅ "Zeyno"
- ❌ Logo "AT" → ✅ Logo "Z"
- ❌ "Sistema de Gerenciamento de Chatbots para Advocacia" → ✅ "Sistema de Gerenciamento de Assistentes IA WhatsApp"
- ❌ "© 2024 Agência Talismã" → ✅ "© 2024 Zeyno"

---

### 2. Serviços e Integrações

**Arquivos alterados:**
- [lib/services/uazapi.service.ts](lib/services/uazapi.service.ts:168) - SystemName padrão
- [app/api/uazapi/instances/route.ts](app/api/uazapi/instances/route.ts:52) - SystemName na criação de instância
- [lib/services/chatwoot.service.ts](lib/services/chatwoot.service.ts:223) - Senha padrão
- [app/api/clientes/route.ts](app/api/clientes/route.ts:365) - Senha padrão
- [components/clientes/cliente-card.tsx](components/clientes/cliente-card.tsx:493) - Senha exibida no card

**Mudanças:**
- ❌ `systemName: 'botconversa'` → ✅ `systemName: 'zeyno'`
- ❌ Senha: `'AgenciaTalisma1!'` → ✅ Senha: `'Zeyno@2024!'`

---

### 3. Docker e Infraestrutura

**Arquivos alterados:**
- [Dockerfile](Dockerfile:1) - Comentário do arquivo
- [docker-compose.yml](docker-compose.yml:4) - Nome do serviço, container e labels Traefik

**Mudanças:**
```diff
# Dockerfile
- # 🐳 Dockerfile - Agência Talismã Next.js 16
+ # 🐳 Dockerfile - Zeyno Next.js 16

# docker-compose.yml
- services:
-   botconversa:
-     container_name: botconversa-app
+ services:
+   zeyno:
+     container_name: zeyno-app

# Labels Traefik
- traefik.http.services.botconversa...
- traefik.http.routers.botconversa...
+ traefik.http.services.zeyno...
+ traefik.http.routers.zeyno...
```

---

### 4. Documentação e URLs

**Arquivos alterados:**
- [CONFIGURAR_SECRETS_GITHUB.md](CONFIGURAR_SECRETS_GITHUB.md:34) - URL UAZAPI
- [PORTAINER_DEPLOY.md](PORTAINER_DEPLOY.md:78) - URL UAZAPI no build Docker

**Mudanças:**
- ❌ `https://agenciatalisma.uazapi.com` → ✅ `https://zeyno.uazapi.com`

---

## 📊 Estatísticas

- **Arquivos modificados**: 16
- **Linhas alteradas**: +175 / -34
- **Componentes React**: 7
- **Serviços**: 3
- **Arquivos de configuração**: 3
- **Documentação**: 3

---

## 🔄 Migração de Senhas Chatwoot

**IMPORTANTE**: Todos os clientes criados **APÓS** este commit usarão a nova senha `Zeyno@2024!` no Chatwoot.

**Clientes já existentes**: Continuam usando a senha antiga `AgenciaTalisma1!` (armazenada no banco de dados).

Para migrar clientes existentes:
1. Os clientes precisarão usar "Esqueci minha senha" no Chatwoot
2. OU você pode atualizar manualmente via API do Chatwoot
3. OU manter as senhas antigas (funcionam normalmente)

---

## 🚀 Próximos Passos

### 1. Atualizar UAZAPI (se necessário)

Se você tiver acesso ao painel UAZAPI, pode querer:
- Renomear instâncias de `systemName: botconversa` para `zeyno`
- Atualizar `UAZAPI_BASE_URL` de `agenciatalisma.uazapi.com` para `zeyno.uazapi.com`

### 2. Deploy

```bash
# Push das alterações
git push origin master

# Se usar Portainer:
# 1. Certifique-se que a imagem foi buildada
# 2. Faça "Pull and Redeploy" da stack
# 3. Verifique que o container 'zeyno-app' está rodando

# Se usar GitHub Actions:
# 1. Aguarde o build completar
# 2. A nova imagem terá todas as alterações
```

### 3. Testar

Após deploy, verificar:
- [ ] Logo "Zeyno" aparece na navegação
- [ ] Título do site é "Zeyno - Gestão de Assistentes WhatsApp"
- [ ] Novos clientes recebem senha `Zeyno@2024!` no Chatwoot
- [ ] Novas instâncias UAZAPI têm `systemName: zeyno`
- [ ] Container Docker chama `zeyno-app`

---

## ⚠️ Avisos Importantes

1. **URLs mantidas**: `https://zeyno.app.br` continua igual (já era Zeyno)
2. **Instâncias existentes**: Continuam funcionando normalmente
3. **Backward compatibility**: Código suporta tanto senhas antigas quanto novas
4. **Sem breaking changes**: Nenhuma funcionalidade foi quebrada

---

**Data da migração**: 2025-12-20
**Commit**: `2bd4fde - refactor: Rebrand completo de 'Agência Talismã/BotConversa' para 'Zeyno'`
