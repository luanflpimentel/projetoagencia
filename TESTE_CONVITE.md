# Teste do Sistema de Convites - Debug

## Status Atual

✅ Migration aplicada com sucesso
✅ Código atualizado com logs detalhados
⏳ Aguardando novo teste

## O que mudou

1. **Logs detalhados adicionados:**
   - 🔍 Busca do convite
   - 🔐 Criação do usuário no Auth
   - 👤 Criação do registro na tabela usuarios
   - ❌ Erros detalhados com código, mensagem e hints

2. **Campos corrigidos:**
   - Removido `criado_em` manual (banco gerencia automaticamente)
   - Adicionados campos: `ativo`, `email_verificado`, `primeiro_acesso`

3. **Tratamento de erros melhorado:**
   - Mensagens detalhadas em desenvolvimento
   - Rollback automático se falhar

## Próximo Teste

1. **Verificar no Supabase Dashboard se o email está registrado no Auth:**
   - Vá em: Authentication > Users
   - Procure por: `luan.1973468250@gmail.com`
   - Se existir, delete antes de testar novamente

2. **Teste novamente o fluxo:**
   - Acesse o link do convite
   - Preencha a senha
   - Clique em "Criar Conta"

3. **Verifique os logs no console do servidor:**
   - Você verá logs detalhados do processo:
     ```
     🔍 Buscando convite com token: ...
     ✅ Convite encontrado: { email, role, expira_em }
     🔐 Criando usuário no Supabase Auth: email
     ✅ Usuário criado no auth: user_id
     👤 Criando registro na tabela usuarios
     ✅ Registro de usuário criado com sucesso
     ✅ Convite aceito: email
     ```

4. **Se der erro, os logs mostrarão exatamente onde:**
   - ❌ Erro ao buscar convite
   - ❌ Erro ao criar usuário no auth
   - ❌ Erro ao criar registro de usuário

## Possíveis Problemas

### 1. Email já cadastrado no Auth
**Erro:** "User already registered"
**Solução:**
- Vá no Supabase Dashboard > Authentication > Users
- Delete o usuário com o email `luan.1973468250@gmail.com`
- Teste novamente

### 2. Erro ao criar registro na tabela usuarios
**Possíveis causas:**
- RLS Policy bloqueando inserção
- Campo obrigatório faltando
- Foreign key inválida (cliente_id)

**Solução:**
- Verifique os logs detalhados
- O erro mostrará exatamente qual campo está com problema

### 3. Convite não encontrado
**Erro:** "Convite inválido ou já utilizado"
**Solução:**
- Verifique se o token na URL está correto
- Verifique se o convite não foi marcado como `usado = true`

## Comandos Úteis

### Ver convites no banco:
```sql
SELECT * FROM convites WHERE email = 'luan.1973468250@gmail.com';
```

### Ver usuários no banco:
```sql
SELECT * FROM usuarios WHERE email = 'luan.1973468250@gmail.com';
```

### Resetar convite (se quiser testar novamente):
```sql
UPDATE convites
SET usado = false, usado_em = NULL
WHERE email = 'luan.1973468250@gmail.com';
```

### Deletar usuário criado (para testar novamente):
```sql
-- Deletar da tabela usuarios
DELETE FROM usuarios WHERE email = 'luan.1973468250@gmail.com';

-- Deletar do Auth (faça pelo Dashboard > Authentication > Users)
```

## Arquivo Atualizado

[app/api/convites/aceitar/route.ts](app/api/convites/aceitar/route.ts)

Agora com logs completos em cada etapa do processo.
