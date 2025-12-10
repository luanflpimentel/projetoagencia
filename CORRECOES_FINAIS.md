# Correções Finais - Loading Infinito

## Problemas Identificados

### 1. ✅ Página de Usuários - Chamadas Duplicadas ao Auth
**Arquivo:** `app/dashboard/usuarios/page.tsx`

**Problema:** A página estava chamando `supabase.auth.getUser()` diretamente, duplicando a chamada que o `useAuthWithPermissions` já faz.

**Correção Aplicada:**
- Removida chamada duplicada de `supabase.auth.getUser()`
- Usando `usuario` do `useAuthWithPermissions` diretamente
- Removidos imports não utilizados (`useRouter`, `createClient`)

### 2. ✅ Página de Clientes - Faltando ProtegerRota
**Arquivo:** `app/dashboard/clientes/page.tsx`

**Problema:** A página não usava `ProtegerRota`, então o `usuario` podia ser `null` durante o loading, fazendo com que a barra de busca e botão "Novo Cliente" não aparecessem (pois dependem de `usuario?.role === 'agencia'`).

**Correção Aplicada:**
- Adicionado `ProtegerRota` wrapper
- Criado componente interno `ClientesPageContent`
- Agora garante que o usuário está carregado antes de renderizar

### 3. ✅ Hook useAuthWithPermissions - Evento TOKEN_REFRESHED
**Arquivo:** `hooks/useAuthWithPermissions.ts`

**Problema:** Supabase dispara `TOKEN_REFRESHED` ao voltar para a aba, causando reload do usuário.

**Correção Aplicada:**
- Ignorando evento `TOKEN_REFRESHED` no `onAuthStateChange`
- Mantém apenas `SIGNED_IN` e `SIGNED_OUT`

### 4. ✅ Dashboard Page - Verificação de Loading
**Arquivo:** `app/dashboard/page.tsx`

**Problema:** Handler de `visibilitychange` verificava `!loading` antes de atualizar dados, criando condição de corrida.

**Correção Aplicada:**
- Removida verificação de `!loading`
- Atualiza dados sempre que a página fica ativa

## Estrutura Correta das Páginas

### Template Correto para Páginas do Dashboard:

```typescript
// app/dashboard/[pagina]/page.tsx
'use client';

import ProtegerRota from '@/components/auth/ProtegerRota';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';

export default function MinhaPage() {
  return (
    <ProtegerRota somenteAgencia> {/* ou sem somenteAgencia */}
      <MinhaPageContent />
    </ProtegerRota>
  );
}

function MinhaPageContent() {
  const { usuario } = useAuthWithPermissions(); // ✅ Usar o hook aqui

  // ❌ NÃO chamar supabase.auth.getUser() novamente!
  // ❌ NÃO buscar usuario do banco novamente!

  // O usuario já está disponível via hook
  console.log('Usuário logado:', usuario);

  return (
    <div>
      {/* Conteúdo da página */}
    </div>
  );
}
```

## Páginas Corrigidas

✅ `app/dashboard/page.tsx` - Dashboard principal
✅ `app/dashboard/usuarios/page.tsx` - Gestão de usuários
✅ `app/dashboard/clientes/page.tsx` - Gestão de clientes
✅ `hooks/useAuthWithPermissions.ts` - Hook centralizado de auth

## Teste Completo

Para verificar se tudo está funcionando:

### 1. Teste de Troca de Abas
```
1. Acesse qualquer página do dashboard
2. Minimize ou troque para outra aba por 10+ segundos
3. Volte para a aba do sistema
4. ✅ Deve carregar normalmente (não ficar em loading infinito)
```

### 2. Teste da Página de Clientes
```
1. Acesse /dashboard/clientes
2. ✅ Deve aparecer a barra de pesquisa
3. ✅ Deve aparecer o botão "Novo Cliente"
4. ✅ Deve mostrar os cards dos clientes
```

### 3. Teste da Página de Usuários
```
1. Acesse /dashboard/usuarios
2. Troque de aba por 10 segundos
3. Volte
4. ✅ Deve carregar a lista de usuários normalmente
```

### 4. Verificar Console
```
⏸️ [AUTH] loadUsuario já está em execução, ignorando
```

**Se essa mensagem aparecer MÚLTIPLAS VEZES seguidas:**
- Significa que há múltiplas tentativas de carregar o usuário
- Provavelmente há alguma página fazendo chamada duplicada

**Se aparecer OCASIONALMENTE:**
- Normal! É a proteção funcionando
- Evita múltiplas chamadas simultâneas

## Logs de Debug Ativos

Os seguintes logs estão ativos para monitoramento:

```
⏸️ [AUTH] loadUsuario já está em execução, ignorando
🔍 Buscando cliente com ID: ...
✅ Cliente encontrado: ...
🔍 Buscando convite com token: ...
🔐 Criando usuário no Supabase Auth: ...
🔄 Gerando prompt para cliente: ...
✅ Prompt gerado com sucesso
💾 Salvando prompt no banco de dados...
✅ Prompt salvo com sucesso!
```

## Problemas Conhecidos Restantes

### Se a página de Usuários ainda travar:

**Possíveis causas:**
1. Algum componente filho está chamando `useAuthWithPermissions` múltiplas vezes
2. Algum `useEffect` sem array de dependências correto
3. Algum componente está fazendo re-render infinito

**Como debugar:**
1. Abra o React DevTools
2. Ative o "Highlight updates when components render"
3. Veja qual componente está renderizando infinitamente
4. Verifique os `useEffect` desse componente

### Se a barra de pesquisa não aparecer:

**Verifique:**
1. O usuário está logado? (`console.log(usuario)`)
2. O `usuario.role` é 'agencia'? (linha 215 do page.tsx)
3. O `ProtegerRota` está envolvendo o componente?

## Próximos Passos (se necessário)

Se os problemas persistirem:

1. **Adicionar mais logs** no `useAuthWithPermissions`:
   ```typescript
   console.log('[AUTH] Estado atual:', { loading, usuario: !!usuario });
   ```

2. **Verificar re-renders** com React DevTools Profiler

3. **Verificar memória** - pode ser memory leak causando slowdown

4. **Verificar network** - requisições duplicadas na aba Network do DevTools

## Comandos Úteis para Debug

### Ver requisições duplicadas:
```
Chrome DevTools > Network > Filter: /api/
```

### Ver componentes renderizando:
```
React DevTools > Profiler > Record
```

### Ver estado do hook:
```javascript
// Adicionar no componente:
console.log('Auth state:', useAuthWithPermissions());
```

## Resumo das Correções

| Arquivo | Problema | Solução |
|---------|----------|---------|
| `useAuthWithPermissions.ts` | TOKEN_REFRESHED causando reload | Ignorar evento |
| `dashboard/page.tsx` | Verificação de loading no handler | Remover verificação |
| `usuarios/page.tsx` | Chamada duplicada de getUser | Usar hook diretamente |
| `clientes/page.tsx` | Sem ProtegerRota | Adicionar wrapper |
| `gerar-prompt/route.ts` | RLS bloqueando update | Usar supabaseAdmin |

Todas as correções focam em **centralizar o auth no hook** e **evitar chamadas duplicadas**.
