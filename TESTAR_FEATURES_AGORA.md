# ✅ TESTAR FEATURES - Migration Executada

A migration foi executada com sucesso! Agora vamos testar as duas features implementadas.

---

## 🧪 Teste 1: Toggle da IA

### Como Testar:

1. **Recarregue a página de Clientes** (Ctrl+F5 para limpar cache)
2. **Encontre um cliente que está CONECTADO** (badge verde "Conectado")
3. **Verifique se o botão aparece**:
   - Deve aparecer um botão ao lado do badge de status
   - Deve estar escrito **"IA Ativa"** (azul) ou **"IA Pausada"** (cinza)
   - Ícone de robô 🤖

4. **Clique no botão**
5. **Verifique**:
   - ✅ Botão deve mudar de "IA Ativa" → "IA Pausada" (ou vice-versa)
   - ✅ Cor deve mudar de azul → cinza (ou vice-versa)
   - ✅ NÃO deve aparecer erro 500 no console
   - ✅ NÃO deve aparecer alert de erro

6. **Recarregue a página**
7. **Verifique**: Estado deve persistir (se você pausou, continua pausado)

### ❌ Se Der Erro:

**Erro 500 ainda aparece**:
- Abra o DevTools (F12) → Network
- Clique no botão novamente
- Clique na requisição `/api/clientes/.../toggle-ia`
- Envie screenshot do erro

**Botão não aparece**:
- Verifique se o cliente está realmente conectado
- O botão só aparece quando `status_conexao === 'conectado'`

---

## 🧪 Teste 2: Criação Automática de Grupo

### Como Testar:

#### Opção A: Cliente Novo (Recomendado)

1. **Criar novo cliente** na página de Clientes
2. **Clicar em "Conectar WhatsApp"**
3. **Escanear o QR Code**
4. **Aguardar conexão estabelecida**
5. **Abrir WhatsApp no celular**
6. **Verificar**:
   - ✅ Deve aparecer um novo grupo criado
   - ✅ Nome: **"IA - [Nome do Escritório] - AVISOS"**
   - ✅ Grupo vazio (sem participantes)

7. **Abrir DevTools Console (F12)**
8. **Verificar logs**:
   ```
   📱 [HOOK] Verificando se precisa criar grupo de avisos...
   ✅ [HOOK] Grupo criado: IA - [Nome] - AVISOS 120363XXXXX@g.us
   ```

#### Opção B: Cliente Existente (Teste de Não Duplicar)

Se você já testou a criação do grupo:

1. **Desconectar WhatsApp** do cliente
2. **Reconectar WhatsApp** (escanear QR Code novamente)
3. **Verificar Console**:
   ```
   📱 [HOOK] Verificando se precisa criar grupo de avisos...
   ⏭️ [HOOK] Grupo já existe: 120363XXXXX@g.us
   ```
4. **Verificar WhatsApp**: NÃO deve criar grupo duplicado

### ❌ Se Der Erro:

**Grupo não foi criado**:
1. Abra DevTools Console (F12)
2. Procure por logs com `[HOOK]` ou `[CREATE GROUP]`
3. Envie screenshot dos erros

**Grupo foi criado, mas campo não salvou no banco**:
1. Verifique no Supabase SQL Editor:
   ```sql
   SELECT nome_cliente, grupo_avisos_id
   FROM clientes
   WHERE nome_instancia = 'NOME_DA_INSTANCIA';
   ```
2. Deve mostrar o ID do grupo (formato: `120363XXXXX@g.us`)

---

## 📋 Checklist Final

Após testar, confirme:

- [ ] Toggle da IA funciona (muda de Ativo ↔ Pausado)
- [ ] Estado do toggle persiste após recarregar página
- [ ] Grupo é criado na primeira conexão
- [ ] Grupo NÃO é duplicado na segunda conexão
- [ ] Console não mostra erros 500
- [ ] ID do grupo é salvo no banco de dados

---

## 🎉 Se Tudo Funcionou

Parabéns! As duas features estão implementadas e funcionando:

✅ **Feature 1**: Grupo de avisos criado automaticamente
✅ **Feature 2**: Toggle para ativar/desativar IA

### Próximos Passos:

1. **Implementar no Webhook**: Atualizar o webhook para respeitar o campo `ia_ativa`
   - Arquivo: `app/api/webhooks/uazapi/route.ts`
   - Adicionar verificação: se `ia_ativa === false`, não processar com IA

2. **Testar em Produção**: Fazer deploy e testar com clientes reais

---

**Status**: ⏳ Aguardando testes
**Última atualização**: 2025-12-11
