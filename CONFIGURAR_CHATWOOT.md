# 🔧 Como Configurar o Chatwoot

## 📋 Passo a Passo para Obter o Platform API Token

### 1️⃣ **Acessar o Painel Super Admin do Chatwoot**

Acesse: `https://chat.zeyno.dev.br/super_admin`

**Credenciais**: Use as credenciais de super administrador do seu Chatwoot.

---

### 2️⃣ **Ir em "Platform"**

No menu lateral do Super Admin, clique em **"Platform"**.

---

### 3️⃣ **Criar ou Copiar um Platform App**

1. Se já existir um **Platform App**, copie o **Access Token**
2. Se não existir, clique em **"New Platform App"** e crie um novo:
   - **Name**: "Agência Talismã API" (ou qualquer nome)
   - **Description**: "API para criação automática de accounts"
   - Clique em **"Create"**

---

### 4️⃣ **Copiar o Access Token**

Após criar ou abrir o Platform App existente, você verá o **Access Token**.

**Exemplo**:
```
ptok_abcd1234efgh5678ijkl9012mnop3456
```

Copie este token.

---

### 5️⃣ **Adicionar ao `.env.local`**

Abra o arquivo `.env.local` e substitua `COLOQUE_SEU_TOKEN_AQUI` pelo token que você copiou:

```env
CHATWOOT_PLATFORM_API_TOKEN=ptok_abcd1234efgh5678ijkl9012mnop3456
```

---

### 6️⃣ **Reiniciar o Servidor Next.js**

**IMPORTANTE**: Sempre que alterar variáveis de ambiente, você precisa reiniciar o servidor.

1. Pare o servidor (Ctrl+C no terminal)
2. Inicie novamente:
   ```bash
   npm run dev
   ```

---

## ✅ Como Testar se Funcionou

Após reiniciar o servidor:

1. Acesse: `http://localhost:3000/dashboard/clientes/novo`
2. Preencha o formulário **incluindo um email válido**
3. Clique em **"Criar Cliente"**
4. Aguarde o provisionamento
5. Se tudo estiver correto, você verá:
   - ✅ Toast verde: "🎉 Chatwoot provisionado com sucesso!"
   - ✅ Badge verde "✓ Chatwoot" no card do cliente
   - ✅ Cliente criado com account, user e inbox no Chatwoot

---

## 🐛 Problemas Comuns

### Erro: "CHATWOOT_BASE_URL and CHATWOOT_PLATFORM_API_TOKEN must be set"

**Causa**: Variáveis de ambiente não configuradas ou servidor não foi reiniciado.

**Solução**:
1. Verifique se `.env.local` tem as variáveis
2. Reinicie o servidor (`Ctrl+C` e `npm run dev`)

---

### Erro 401 no Chatwoot

**Causa**: Token inválido ou expirado.

**Solução**:
1. Volte ao Super Admin
2. Gere um novo token
3. Atualize `.env.local`
4. Reinicie o servidor

---

### Erro: "create_account failed"

**Causa**: Permissões insuficientes ou Chatwoot fora do ar.

**Solução**:
1. Verifique se o Chatwoot está acessível: `https://chat.zeyno.dev.br`
2. Verifique se o token tem permissão de **Platform API**
3. Verifique logs do Chatwoot no servidor

---

## 📚 Variáveis de Ambiente Completas

```env
# Chatwoot
CHATWOOT_BASE_URL=https://chat.zeyno.dev.br
NEXT_PUBLIC_CHATWOOT_BASE_URL=https://chat.zeyno.dev.br
CHATWOOT_PLATFORM_API_TOKEN=ptok_SEU_TOKEN_AQUI
```

- **CHATWOOT_BASE_URL**: URL base do Chatwoot (sem barra final)
- **NEXT_PUBLIC_CHATWOOT_BASE_URL**: Mesma URL, mas acessível no frontend (para botão "Abrir Chatwoot")
- **CHATWOOT_PLATFORM_API_TOKEN**: Token da Platform API (começa com `ptok_`)

---

## 🔍 Como Verificar no Chatwoot

Após criar um cliente com email, você pode verificar no Chatwoot:

1. Acesse o Super Admin: `https://chat.zeyno.dev.br/super_admin`
2. Vá em **"Accounts"**
3. Você verá uma nova account com o nome do escritório
4. Dentro da account:
   - **Users**: Verá o usuário criado (email do cliente)
   - **Inboxes**: Verá a inbox "WhatsApp - [Nome do Escritório]"

---

## 📞 Suporte

Se continuar com problemas, verifique:
- Logs do servidor Next.js
- Logs do servidor Chatwoot
- Network tab do navegador (requisições para `/api/clientes`)
