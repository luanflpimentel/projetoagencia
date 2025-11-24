-- ============================================
-- ATUALIZAR RLS POLICIES - Sistema Simplificado
-- Agencia (vê tudo) vs Cliente (vê só o seu)
-- ============================================

-- EXECUTAR NO SUPABASE SQL EDITOR
-- APÓS executar migration-simplificar-roles.sql

-- ============================================
-- TABELA: clientes
-- ============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "usuarios_podem_ver_proprios_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_veem_proprios_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_inserem_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_atualizam_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_deletam_clientes" ON clientes;
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;

-- 1. SELECT - Agência vê todos, cliente vê apenas o seu
CREATE POLICY "clientes_select"
ON clientes FOR SELECT
USING (
  -- Agência vê todos os clientes
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
  OR
  -- Cliente vê apenas clientes onde ele é o usuario_id
  usuario_id = auth.uid()
);

-- 2. INSERT - Apenas agência pode criar novos clientes
CREATE POLICY "clientes_insert"
ON clientes FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- 3. UPDATE - Agência atualiza tudo, cliente pode atualizar apenas o seu
CREATE POLICY "clientes_update"
ON clientes FOR UPDATE
USING (
  -- Agência atualiza qualquer cliente
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
  OR
  -- Cliente atualiza apenas seu próprio cliente
  usuario_id = auth.uid()
);

-- 4. DELETE - Apenas agência pode deletar clientes
CREATE POLICY "clientes_delete"
ON clientes FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- ============================================
-- TABELA: usuarios
-- ============================================

-- Remover policies antigas
DROP POLICY IF EXISTS "usuarios_gerenciados_por_agencia" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;

-- 1. SELECT - Agência vê todos, cliente vê apenas si mesmo
CREATE POLICY "usuarios_select"
ON usuarios FOR SELECT
USING (
  -- Agência vê todos os usuários
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
  OR
  -- Usuário vê apenas seu próprio registro
  id = auth.uid()
);

-- 2. INSERT - Apenas agência pode criar usuários
CREATE POLICY "usuarios_insert"
ON usuarios FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- 3. UPDATE - Apenas agência pode atualizar usuários
CREATE POLICY "usuarios_update"
ON usuarios FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- 4. DELETE - Apenas agência pode deletar usuários
CREATE POLICY "usuarios_delete"
ON usuarios FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- ============================================
-- TABELA: templates (se necessário)
-- ============================================

-- Remover policies antigas de templates
DROP POLICY IF EXISTS "templates_select" ON templates;
DROP POLICY IF EXISTS "templates_insert" ON templates;
DROP POLICY IF EXISTS "templates_update" ON templates;
DROP POLICY IF EXISTS "templates_delete" ON templates;

-- Apenas agência gerencia templates
CREATE POLICY "templates_select"
ON templates FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

CREATE POLICY "templates_insert"
ON templates FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

CREATE POLICY "templates_update"
ON templates FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

CREATE POLICY "templates_delete"
ON templates FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- ============================================
-- TABELA: logs_sistema (se necessário)
-- ============================================

-- Remover policies antigas de logs
DROP POLICY IF EXISTS "logs_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_insert" ON logs_sistema;

-- Apenas agência vê logs
CREATE POLICY "logs_select"
ON logs_sistema FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM usuarios 
    WHERE id = auth.uid() 
    AND role = 'agencia'
  )
);

-- Qualquer usuário autenticado pode criar logs (para auditoria)
CREATE POLICY "logs_insert"
ON logs_sistema FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Listar todas as policies criadas
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd,
  qual AS using_expression,
  with_check AS with_check_expression
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema')
ORDER BY tablename, cmd, policyname;

-- Contar policies por tabela
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema')
GROUP BY tablename
ORDER BY tablename;

-- ✅ RLS POLICIES ATUALIZADAS COM SUCESSO
-- 
-- RESUMO:
-- - clientes: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - usuarios: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - templates: 4 policies (SELECT, INSERT, UPDATE, DELETE)
-- - logs_sistema: 2 policies (SELECT, INSERT)
--
-- PRÓXIMOS PASSOS:
-- 1. Testar login como usuário 'agencia' - deve ver tudo
-- 2. Testar login como usuário 'cliente' - deve ver apenas seus dados
-- 3. Atualizar código TypeScript para usar novos roles
