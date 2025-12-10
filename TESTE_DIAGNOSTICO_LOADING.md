# Teste de Diagnóstico - Loading Infinito

## 🎯 Objetivo
Capturar logs detalhados para identificar por que a página trava em "Carregando..." ao trocar de abas.

## 📝 Instruções para o Teste

### Passo 1: Preparar o Console
1. Abra o DevTools (F12)
2. Vá para a aba "Console"
3. **IMPORTANTE**: Clique com botão direito no console e marque:
   - ✅ "Preserve log" (para manter os logs ao navegar)
4. Limpe o console (botão de lixeira ou Ctrl+L)

### Passo 2: Recarregar a Página
1. Recarregue a página (F5 ou Ctrl+R)
2. Aguarde a página carregar completamente
3. Verifique se você vê os logs:
   ```
   🏁 [AUTH PROVIDER] useEffect montou
   🔄 [AUTH PROVIDER] Iniciando loadUsuario...
   🔍 [AUTH PROVIDER] Chamando supabase.auth.getUser()...
   📦 [AUTH PROVIDER] Resposta recebida
   ✅ [AUTH PROVIDER] Usuário carregado com sucesso
   🏁 [AUTH PROVIDER] Finalizando loadUsuario - setLoading(false)
   🛡️ [PROTEGER ROTA] Estado mudou
   ✅ [PROTEGER ROTA] Permissão OK - renderizando conteúdo
   ```

### Passo 3: Teste de Troca de Aba
1. **NÃO LIMPE O CONSOLE**
2. Troque para outra aba do navegador
3. Aguarde **10 segundos**
4. Volte para a aba do sistema
5. Observe o comportamento:
   - A página ficou travada em "Carregando..."?
   - O conteúdo sumiu?

### Passo 4: Capturar os Logs
1. **Aguarde mais 10 segundos** (para ver se há novos logs)
2. Clique com botão direito no console
3. Selecione "Save as..."
4. OU simplesmente:
   - Selecione TODOS os logs (Ctrl+A)
   - Copie (Ctrl+C)
   - Cole em um arquivo de texto ou me envie direto

## 🔍 O que estamos procurando nos logs:

### Logs Esperados ao Trocar de Aba:
```
👁️ [AUTH PROVIDER] Visibilidade mudou: OCULTA
```

### Logs Esperados ao Voltar para a Aba:
```
👁️ [AUTH PROVIDER] Visibilidade mudou: VISÍVEL
🔔 [AUTH PROVIDER] Auth event: TOKEN_REFRESHED
⏭️ [AUTH PROVIDER] Ignorando TOKEN_REFRESHED
```

### Logs que Indicam Problema:
- 🚨 `🔄 [AUTH PROVIDER] Iniciando loadUsuario...` após voltar = Nova chamada indevida
- 🚨 `⏸️ [AUTH PROVIDER] loadUsuario já está em execução` = Chamada travada
- 🚨 `🔄 [PROTEGER ROTA] Renderizando loader...` sem parar = Loading infinito
- 🚨 `🛡️ [PROTEGER ROTA] Estado mudou: { loading: true }` sem voltar a false

## 📊 Informações Adicionais que Ajudam

Ao me enviar os logs, também inclua:
1. **Qual página estava aberta?** (Dashboard, Clientes, Usuários)
2. **Quanto tempo ficou na outra aba?** (segundos)
3. **O que aconteceu visualmente?**
   - Ficou em "Carregando..." para sempre?
   - O conteúdo sumiu?
   - Algum erro apareceu?
4. **Screenshot da tela travada** (se possível)

## ⚡ Teste Extra (Opcional)

Se quiser fazer um segundo teste:
1. Limpe o console
2. Recarregue a página
3. Aguarde carregar
4. **Minimize a janela inteira do navegador** (ao invés de trocar de aba)
5. Aguarde 10 segundos
6. Restaure a janela
7. Veja se o comportamento é o mesmo

---

**Pronto para começar!** Faça o teste e me envie os logs completos. 🚀
