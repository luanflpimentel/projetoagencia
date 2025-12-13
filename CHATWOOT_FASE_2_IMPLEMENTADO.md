# ✅ Chatwoot - FASE 2 Implementada

## 📋 Mudanças Realizadas

### 🔄 Novo Fluxo de Provisionamento

**ANTES** (Criava tudo na criação do cliente):
1. Criar Account
2. Criar User
3. Vincular User ao Account
4. **Criar Inbox do tipo API** ❌ (Não funciona bem)

**AGORA** (Dividido em 2 fases):

#### **FASE 1** - Ao criar cliente com email:
1. ✅ Criar Account no Chatwoot
2. ✅ Criar User no Chatwoot
3. ✅ Vincular User ao Account
4. ✅ Status fica como `pending` (sem Inbox ainda)

#### **FASE 2** - Ao conectar WhatsApp:
1. ✅ Criar Inbox do tipo API no Chatwoot
2. ✅ Integrar UAZAPI com Chatwoot
3. ✅ Status muda para `active` (com Inbox funcionando)

---

## 🎯 Por Que Esta Mudança?

### Problema Original:
- **Inbox do tipo API não sincroniza automaticamente** - Precisa de configuração manual
- **Usuário não consegue logar** - Faltava configuração adicional
- **Inbox criada antes do WhatsApp conectar** - Sem utilidade prática

### Solução Implementada:
- **Inbox criada apenas quando WhatsApp conecta** - Sincronização automática
- **Integração UAZAPI ↔ Chatwoot** - Mensagens chegam automaticamente
- **Badge `pending`** mostra que falta conectar WhatsApp para completar
- **Badge `active`** mostra que tudo está funcionando

---

## 📁 Arquivos Modificados

### 1. [`lib/services/chatwoot.service.ts`](lib/services/chatwoot.service.ts)

**Mudanças**:
- ❌ Removido: `provisionComplete()` (criava tudo)
- ✅ Adicionado: `provisionAccountAndUser()` (só Account + User)
- ✅ Adicionado: `createInboxOnWhatsAppConnect()` (criar Inbox depois)

```typescript
// FASE 1: Provisionar Account + User (SEM Inbox)
async provisionAccountAndUser(nomeEscritorio: string, emailContato: string): Promise<ProvisionResult>

// FASE 2: Criar Inbox ao conectar WhatsApp
async createInboxOnWhatsAppConnect(accountId: number, nomeEscritorio: string, userAccessToken: string)
```

---

### 2. [`app/api/clientes/route.ts`](app/api/clientes/route.ts)

**Mudanças**:
- Chama `provisionAccountAndUser()` em vez de `provisionComplete()`
- Status salvo como `pending` (não `active`)
- `inbox_id` e `channel_id` ficam como `null` (preenchidos depois)

```typescript
// FASE 1: Provisionar Chatwoot (Account + User, SEM Inbox)
const provisionResult = await chatwootService.provisionAccountAndUser(
  dadosCliente.nome_escritorio,
  body.email
);

if (provisionResult.success) {
  await supabaseAdmin.from('clientes').update({
    chatwoot_account_id: provisionResult.account_id,
    chatwoot_user_id: provisionResult.user_id,
    chatwoot_user_email: provisionResult.user_email,
    chatwoot_user_access_token: provisionResult.user_access_token,
    chatwoot_inbox_id: null, // Será preenchido na FASE 2
    chatwoot_channel_id: null,
    chatwoot_status: 'pending', // Pending até criar inbox
    chatwoot_provisioned_at: new Date().toISOString(),
  }).eq('id', cliente.id);
}
```

---

### 3. [`app/api/clientes/[id]/chatwoot-integrate/route.ts`](app/api/clientes/[id]/chatwoot-integrate/route.ts)

**Mudanças**:
- Agora cria a Inbox se não existir
- Salva `inbox_id` e `channel_id` no banco
- Muda status para `active` após criar a Inbox
- Configura UAZAPI para enviar mensagens ao Chatwoot

```typescript
// FASE 2.1: Criar Inbox se ainda não existir
if (!inboxId) {
  const inboxResult = await chatwootService.createInboxOnWhatsAppConnect(
    cliente.chatwoot_account_id,
    cliente.nome_escritorio,
    cliente.chatwoot_user_access_token
  );

  if (inboxResult.success) {
    inboxId = inboxResult.inbox_id!;

    await supabaseAdmin.from('clientes').update({
      chatwoot_inbox_id: inboxId,
      chatwoot_channel_id: inboxResult.channel_id,
      chatwoot_status: 'active', // Agora está ativo!
    }).eq('id', clienteId);
  }
}

// FASE 2.2: Configurar UAZAPI
await uazapiService.configureChatwoot(cliente.instance_token, {
  url: CHATWOOT_BASE_URL,
  access_token: cliente.chatwoot_user_access_token,
  account_id: cliente.chatwoot_account_id,
  inbox_id: inboxId,
});
```

---

### 4. [`components/whatsapp/hooks/useInstanceConnection.ts`](components/whatsapp/hooks/useInstanceConnection.ts)

**Mudanças**:
- Ao conectar WhatsApp, busca `cliente_id` pelo `instanceName`
- Chama `/api/clientes/[id]/chatwoot-integrate` automaticamente
- Logs detalhados para debug

```typescript
// ✅ FASE 2: Integrar Chatwoot com UAZAPI
const clientesResponse = await fetch('/api/clientes');
if (clientesResponse.ok) {
  const clientes = await clientesResponse.json();
  const cliente = clientes.find((c: any) => c.nome_instancia === instanceName);

  if (cliente) {
    const integrateResponse = await fetch(`/api/clientes/${cliente.id}/chatwoot-integrate`, {
      method: 'POST',
    });

    if (integrateResponse.ok) {
      console.log('✅ [HOOK] Chatwoot integrado!');
    }
  }
}
```

---

### 5. [`app/dashboard/clientes/novo/page.tsx`](app/dashboard/clientes/novo/page.tsx)

**Mudanças**:
- Toast atualizado: "Account e User criados! Inbox será criada ao conectar WhatsApp."
- Mensagem de loading atualizada
- Aviso visual que Inbox será criada depois

```tsx
// Toast atualizado
if (data.chatwoot?.provisioned) {
  toast.success('✅ Chatwoot: Account e User criados! Inbox será criada ao conectar WhatsApp.');
}

// Loading message
<ul>
  <li>Criando cliente no banco de dados</li>
  {formData.email && <li>Provisionando Chatwoot (Account e User)</li>}
  <li>Criando instância WhatsApp na UAZAPI</li>
  {formData.email && <li className="text-blue-600">Inbox do Chatwoot será criada ao conectar WhatsApp</li>}
</ul>
```

---

## 🧪 Como Testar

### 1️⃣ **Criar Novo Cliente**

1. Acesse `/dashboard/clientes/novo`
2. Preencha com email válido
3. Aguarde criação
4. Veja toast: "✅ Chatwoot: Account e User criados!"
5. **Badge deve mostrar**: ⏳ `pending` (amarelo)

### 2️⃣ **Conectar WhatsApp**

1. Clique em "Conectar WhatsApp" no card do cliente
2. Escaneie o QR Code
3. Aguarde conexão
4. **Verifique os logs do navegador**:
   ```
   🔗 [HOOK] Buscando cliente para integração Chatwoot...
   🔗 [HOOK] Integrando Chatwoot para cliente: abc-123
   ✅ [HOOK] Chatwoot integrado!
   ```
5. **Badge deve mudar para**: ✅ `active` (verde)
6. **Recarregue a página** para ver o badge atualizado

### 3️⃣ **Verificar no Chatwoot**

1. Acesse o Chatwoot: `https://chat.zeyno.dev.br`
2. Logue com as credenciais:
   - **Email**: `emaildocliente@gmail.com`
   - **Senha**: `AgenciaTalisma1!`
3. Você deve ver:
   - ✅ Account criada
   - ✅ Inbox "WhatsApp - [Nome do Escritório]"
   - ✅ Mensagens sincronizando do WhatsApp

---

## 🎨 Estados do Badge Chatwoot

| Status    | Cor      | Ícone | Significado                                    |
|-----------|----------|-------|------------------------------------------------|
| `pending` | Amarelo  | ⏳    | Account e User criados. Aguardando WhatsApp.   |
| `active`  | Verde    | ✅    | Tudo configurado! Inbox criada e funcionando.  |
| `error`   | Vermelho | ❌    | Erro no provisionamento.                       |

---

## 🔍 Logs Importantes

### FASE 1 (Criação do Cliente)
```
🚀 [CHATWOOT FASE 1] Criando Account e User...
✅ [STEP 1] Account criada: { account_id: 6 }
✅ [STEP 2] User criado: { user_id: 6, email: 'teste@gmail.com' }
✅ [STEP 3] User vinculado ao Account
🎉 Account e User criados com sucesso! Inbox será criada ao conectar WhatsApp.
✅ [CHATWOOT FASE 1] Account e User criados!
```

### FASE 2 (Conexão do WhatsApp)
```
🔗 [HOOK] Buscando cliente para integração Chatwoot...
🔗 [HOOK] Integrando Chatwoot para cliente: abc-123
📥 [CHATWOOT-UAZAPI] Criando Inbox do Chatwoot...
✅ [STEP 4] Inbox criada: { inbox_id: 9, channel_id: 9 }
✅ [CHATWOOT-UAZAPI] Inbox criada: { inboxId: 9, channelId: 9 }
✅ [CHATWOOT-UAZAPI] Integração configurada com sucesso!
✅ [HOOK] Chatwoot integrado!
```

---

## ✅ Checklist de Testes

- [ ] Cliente criado com email → Badge `pending` aparece
- [ ] WhatsApp conectado → Logs mostram criação da Inbox
- [ ] Badge muda para `active` após reload
- [ ] Login no Chatwoot funciona (email do cliente + senha `AgenciaTalisma1!`)
- [ ] Inbox aparece no Chatwoot
- [ ] Mensagens do WhatsApp sincronizam no Chatwoot
- [ ] Botão "Abrir Chatwoot" funciona
- [ ] Credenciais visíveis no modal funcionam

---

## 📚 Documentação Relacionada

- [CONFIGURAR_CHATWOOT.md](CONFIGURAR_CHATWOOT.md) - Como obter o Platform API Token
- [FEATURES_CHATWOOT_ADICIONAIS.md](FEATURES_CHATWOOT_ADICIONAIS.md) - Retry, botão de acesso, toast
- [lib/services/chatwoot.service.ts](lib/services/chatwoot.service.ts) - Código do serviço Chatwoot
