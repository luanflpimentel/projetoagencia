# Setup do Sistema de Convites

## Passo 1: Aplicar Migration no Supabase

1. Acesse o Supabase Dashboard: https://mrextxgeuqkxhcqchffk.supabase.co/
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase/migrations/create_convites_table_fixed.sql`
5. Cole no editor SQL
6. Clique em **RUN** para executar

## Passo 2: Verificar a Tabela

Após executar, verifique se a tabela foi criada:

```sql
SELECT * FROM convites LIMIT 1;
```

Você deve ver a estrutura da tabela sem erros.

## Passo 3: Testar o Fluxo Completo

1. **Criar Cliente:**
   - Acesse: http://localhost:3000/dashboard/clientes/novo
   - Preencha o formulário incluindo o **email do cliente**
   - Clique em "Cadastrar Cliente"

2. **Modal de Convite:**
   - Após criar o cliente, um modal aparecerá automaticamente
   - O modal mostra o link de convite
   - Opções: Copiar link, Enviar por Email, Enviar por WhatsApp

3. **Aceitar Convite:**
   - Abra o link do convite (em outra aba/navegador)
   - URL será algo como: `http://localhost:3000/aceitar-convite?token=UUID`
   - Preencha a senha (mínimo 8 caracteres)
   - Confirme a senha
   - Clique em "Criar Conta"

4. **Login do Cliente:**
   - Após criar a conta, você será redirecionado para `/login`
   - Faça login com o email e senha criados
   - Cliente verá apenas seu próprio WhatsApp e poderá escanear o QR Code

## Estrutura da Tabela Convites

```
- id: UUID (gerado automaticamente)
- email: Email do convite
- nome_completo: Nome do cliente
- role: 'cliente' ou 'agencia'
- cliente_id: Relacionamento com a tabela clientes
- telefone: Telefone (opcional)
- token: Token único UUID para o link
- expira_em: Data de expiração (7 dias por padrão)
- usado: Boolean indicando se foi usado
- usado_em: Data/hora que foi usado
- criado_por: ID do usuário que criou o convite
- criado_em: Data de criação
- atualizado_em: Data de atualização
```

## Políticas RLS Aplicadas

1. **Agência pode ver todos os convites** (SELECT para role='agencia')
2. **Agência pode criar convites** (INSERT para role='agencia')
3. **Qualquer pessoa pode ler convite pelo token** (SELECT para anon - necessário para aceitar)
4. **Convite pode ser marcado como usado** (UPDATE para anon quando usado=false)

## Arquivos do Sistema

### API Routes:
- `app/api/clientes/route.ts` - Modificado para gerar convite automaticamente
- `app/api/convites/verificar/route.ts` - Verifica validade do convite
- `app/api/convites/aceitar/route.ts` - Aceita convite e cria usuário

### Pages:
- `app/aceitar-convite/page.tsx` - Página de aceitar convite
- `app/dashboard/clientes/novo/page.tsx` - Modificado para mostrar modal

### Components:
- `components/clientes/ConviteModal.tsx` - Modal com link de convite

## Fluxo Técnico

1. **Criação de Cliente:**
   ```
   POST /api/clientes
   ↓
   Cria cliente no banco
   ↓
   Gera token UUID
   ↓
   Insere convite na tabela
   ↓
   Retorna convite com link
   ↓
   Frontend mostra ConviteModal
   ```

2. **Aceitar Convite:**
   ```
   GET /api/convites/verificar?token=UUID
   ↓
   Verifica se token existe, não foi usado e não expirou
   ↓
   Retorna dados do convite
   ↓
   POST /api/convites/aceitar { token, senha }
   ↓
   Cria usuário no Supabase Auth
   ↓
   Cria registro na tabela usuarios
   ↓
   Marca convite como usado
   ↓
   Redireciona para /login
   ```

## Próximos Passos Após Setup

Após aplicar a migration, o sistema estará completo e funcional. Você poderá:

- ✅ Criar clientes com email
- ✅ Gerar convites automaticamente
- ✅ Enviar links por email/WhatsApp
- ✅ Clientes aceitarem convites e criarem senhas
- ✅ Clientes fazerem login e escanearem QR Code

## Troubleshooting

**Se o convite não aparecer:**
- Verifique se o email foi preenchido no formulário de criar cliente
- Verifique se a tabela `convites` foi criada corretamente
- Veja o console do navegador para erros

**Se der erro ao aceitar:**
- Verifique se o token está correto na URL
- Verifique se o convite não expirou (7 dias)
- Verifique se o convite não foi usado anteriormente

**Se der erro de email duplicado:**
- O email já está cadastrado no sistema
- Use outro email ou delete o usuário existente
