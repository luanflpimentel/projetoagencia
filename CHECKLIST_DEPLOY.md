# ✅ Checklist Rápido de Deploy

## 🎯 Ações Necessárias (em ordem)

### 1. Executar Migrations no Supabase ⚠️ **OBRIGATÓRIO**

- [ ] Acessar: https://supabase.com/dashboard/project/mrextxgeuqkxhcqchffk/sql
- [ ] Abrir arquivo: `EXECUTAR_MIGRATIONS_PRODUCAO.sql`
- [ ] Copiar TODO o conteúdo
- [ ] Colar no SQL Editor do Supabase
- [ ] Clicar em **RUN** (ou Ctrl+Enter)
- [ ] **Verificar**: Deve retornar "Success. No rows returned"
- [ ] Executar query de verificação (última query do arquivo)
- [ ] **Confirmar**: Deve listar 11 colunas

### 2. Configurar Variáveis de Ambiente na Plataforma

**Se usar Vercel**:
- [ ] Acessar: https://vercel.com/seu-projeto/settings/environment-variables
- [ ] Copiar TODAS as variáveis do arquivo `.env.production`
- [ ] Colar no Vercel (marcar Production + Preview)
- [ ] Salvar

**Se usar Railway/DigitalOcean/Outra**:
- [ ] Acessar painel de variáveis de ambiente
- [ ] Adicionar todas as variáveis do `.env.production`
- [ ] Salvar

**Variáveis OBRIGATÓRIAS**:
```
✅ NEXT_PUBLIC_SUPABASE_URL
✅ NEXT_PUBLIC_SUPABASE_ANON_KEY
✅ SUPABASE_SERVICE_ROLE_KEY
✅ UAZAPI_BASE_URL
✅ UAZAPI_ADMIN_TOKEN
✅ WEBHOOK_SECRET
✅ CHATWOOT_BASE_URL
✅ NEXT_PUBLIC_CHATWOOT_BASE_URL
✅ CHATWOOT_PLATFORM_API_TOKEN
✅ NEXT_PUBLIC_APP_URL
```

### 3. Fazer Deploy

**Opção A - Git Push** (Recomendado):
```bash
git add .
git commit -m "feat: Deploy com Chatwoot FASE 2 e toggle IA"
git push origin main
```

**Opção B - Vercel CLI**:
```bash
vercel --prod
```

**Opção C - Railway**:
```bash
git push railway main
```

### 4. Aguardar Build Completar

- [ ] Aguardar build terminar (3-5 minutos)
- [ ] Verificar se não há erros no console de deploy
- [ ] Confirmar URL de produção: https://zeyno.app.br

### 5. Testar em Produção

**Teste 1 - Acesso básico**:
- [ ] Acessar https://zeyno.app.br
- [ ] Fazer login
- [ ] Verificar se carrega sem erros

**Teste 2 - Criar cliente com Chatwoot**:
- [ ] Ir em Clientes → Novo Cliente
- [ ] Preencher com email válido
- [ ] Criar cliente
- [ ] **Verificar**: Badge ⏳ `pending` aparece
- [ ] **Verificar**: Toast de sucesso do Chatwoot

**Teste 3 - Conectar WhatsApp**:
- [ ] Clicar "Conectar WhatsApp"
- [ ] Escanear QR Code
- [ ] **Verificar**: Badge ✓ `Conectado` (verde)
- [ ] **Verificar**: Badge Chatwoot ✓ `active` (verde)
- [ ] **Verificar**: Botão 🤖 `IA Ativa` aparece
- [ ] **Verificar**: Grupo "IA - [Nome] - AVISOS" foi criado no WhatsApp

**Teste 4 - Toggle IA**:
- [ ] Clicar em "IA Ativa"
- [ ] **Verificar**: Muda para "IA Pausada"
- [ ] Recarregar página (F5)
- [ ] **Verificar**: Continua como "IA Pausada"

**Teste 5 - Chatwoot**:
- [ ] Acessar https://chat.zeyno.dev.br
- [ ] Login: email do cliente / senha: `AgenciaTalisma1!`
- [ ] **Verificar**: Inbox aparece
- [ ] Enviar mensagem no WhatsApp
- [ ] **Verificar**: Mensagem aparece no Chatwoot

---

## ❌ Se algo der errado

**Erro na migration**:
- Copie o erro completo
- Verifique se alguma coluna já existe
- Execute novamente (tem `IF NOT EXISTS`)

**Erro no deploy**:
- Verifique variáveis de ambiente
- Veja logs da plataforma
- Verifique se `.env.production` tem todas as variáveis

**Chatwoot não funciona**:
- Verifique variável `CHATWOOT_PLATFORM_API_TOKEN`
- Teste manualmente: https://chat.zeyno.dev.br
- Veja logs no Vercel/Railway

**Grupo não é criado**:
- Verifique se migration da IA foi executada
- Campo `grupo_avisos_id` deve existir na tabela

---

## 📞 Comandos Úteis

**Ver logs em tempo real (Vercel)**:
```bash
vercel logs --follow
```

**Build local de teste**:
```bash
npm run build
```

**Testar em modo produção local**:
```bash
npm run build
npm run start
```

---

## 🎉 Deploy Concluído!

Quando todos os checkboxes estiverem marcados, seu deploy está completo e funcionando! 🚀

**Última atualização**: 2025-12-13
