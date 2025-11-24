-- ============================================
-- MIGRAÇÃO COMPLETA: Roles + Policies
-- Tudo em um único script na ordem correta
-- ============================================

-- EXECUTAR NO SUPABASE SQL EDITOR

-- ============================================
-- ETAPA 1: DROPAR TODAS AS POLICIES ANTIGAS
-- ============================================

-- Tabela: clientes
DROP POLICY IF EXISTS "usuarios_podem_ver_proprios_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_veem_proprios_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_inserem_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_atualizam_clientes" ON clientes;
DROP POLICY IF EXISTS "usuarios_deletam_clientes" ON clientes;
DROP POLICY IF EXISTS "clientes_select" ON clientes;
DROP POLICY IF EXISTS "clientes_insert" ON clientes;
DROP POLICY IF EXISTS "clientes_update" ON clientes;
DROP POLICY IF EXISTS "clientes_delete" ON clientes;
DROP POLICY IF EXISTS "policy_select_clientes" ON clientes;

-- Tabela: usuarios
DROP POLICY IF EXISTS "usuarios_gerenciados_por_agencia" ON usuarios;
DROP POLICY IF EXISTS "usuarios_select" ON usuarios;
DROP POLICY IF EXISTS "usuarios_insert" ON usuarios;
DROP POLICY IF EXISTS "usuarios_update" ON usuarios;
DROP POLICY IF EXISTS "usuarios_delete" ON usuarios;

-- Tabela: templates (se existir)
DROP POLICY IF EXISTS "templates_select" ON templates;
DROP POLICY IF EXISTS "templates_insert" ON templates;
DROP POLICY IF EXISTS "templates_update" ON templates;
DROP POLICY IF EXISTS "templates_delete" ON templates;

-- Tabela: logs_sistema (se existir)
DROP POLICY IF EXISTS "logs_select" ON logs_sistema;
DROP POLICY IF EXISTS "logs_insert" ON logs_sistema;

RAISE NOTICE '✅ Policies antigas removidas';

-- ============================================
-- ETAPA 2: MIGRAR TIPO ENUM
-- ============================================

-- Converter role para TEXT
ALTER TABLE usuarios 
ALTER COLUMN role TYPE text;

RAISE NOTICE '✅ Coluna role convertida para TEXT';

-- Atualizar valores
UPDATE usuarios 
SET role = CASE 
  WHEN role = 'super_admin' THEN 'agencia'
  WHEN role = 'admin_cliente' THEN 'cliente'
  WHEN role = 'usuario_cliente' THEN 'cliente'
  ELSE 'cliente'
END;

RAISE NOTICE '✅ Valores atualizados';

-- Verificar resultado
DO $$
DECLARE
  agencia_count INTEGER;
  cliente_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO agencia_count FROM usuarios WHERE role = 'agencia';
  SELECT COUNT(*) INTO cliente_count FROM usuarios WHERE role = 'cliente';
  
  RAISE NOTICE '  → % usuários com role agencia', agencia_count;
  RAISE NOTICE '  → % usuários com role cliente', cliente_count;
END $$;

-- Dropar tipo ENUM antigo
DROP TYPE IF EXISTS user_role CASCADE;

-- Criar novo tipo ENUM
CREATE TYPE user_role AS ENUM ('agencia', 'cliente');

RAISE NOTICE '✅ Novo ENUM criado (agencia, cliente)';

-- Converter coluna para novo ENUM
ALTER TABLE usuarios 
ALTER COLUMN role TYPE user_role USING role::user_role;

-- Garantir NOT NULL
ALTER TABLE usuarios 
ALTER COLUMN role SET NOT NULL;

-- Adicionar comentário
COMMENT ON COLUMN usuarios.role IS 
'Tipo de acesso: agencia (total) ou cliente (limitado)';

RAISE NOTICE '✅ Coluna role convertida para novo ENUM';

-- ============================================
-- ETAPA 3: RECRIAR POLICIES COM NOVO ENUM
-- ============================================

-- TABELA: clientes
-- SELECT: Agência vê todos, cliente vê só o seu
CREATE POLICY "clientes_select"
ON clientes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR usuario_id = auth.uid()
);

-- INSERT: Apenas agência
CREATE POLICY "clientes_insert"
ON clientes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

-- UPDATE: Agência atualiza tudo, cliente só o seu
CREATE POLICY "clientes_update"
ON clientes FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR usuario_id = auth.uid()
);

-- DELETE: Apenas agência
CREATE POLICY "clientes_delete"
ON clientes FOR DELETE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

RAISE NOTICE '✅ Policies de clientes criadas (4)';

-- TABELA: usuarios
-- SELECT: Agência vê todos, usuário vê apenas si mesmo
CREATE POLICY "usuarios_select"
ON usuarios FOR SELECT
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR id = auth.uid()
);

-- INSERT: Apenas agência
CREATE POLICY "usuarios_insert"
ON usuarios FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

-- UPDATE: Apenas agência
CREATE POLICY "usuarios_update"
ON usuarios FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

-- DELETE: Apenas agência
CREATE POLICY "usuarios_delete"
ON usuarios FOR DELETE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

RAISE NOTICE '✅ Policies de usuarios criadas (4)';

-- TABELA: templates (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'templates') THEN
    EXECUTE 'CREATE POLICY "templates_select" ON templates FOR SELECT 
             USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = ''agencia''))';
    
    EXECUTE 'CREATE POLICY "templates_insert" ON templates FOR INSERT 
             WITH CHECK (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = ''agencia''))';
    
    EXECUTE 'CREATE POLICY "templates_update" ON templates FOR UPDATE 
             USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = ''agencia''))';
    
    EXECUTE 'CREATE POLICY "templates_delete" ON templates FOR DELETE 
             USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = ''agencia''))';
    
    RAISE NOTICE '✅ Policies de templates criadas (4)';
  ELSE
    RAISE NOTICE '⚠️  Tabela templates não existe (ignorada)';
  END IF;
END $$;

-- TABELA: logs_sistema (se existir)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'logs_sistema') THEN
    EXECUTE 'CREATE POLICY "logs_select" ON logs_sistema FOR SELECT 
             USING (EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = ''agencia''))';
    
    EXECUTE 'CREATE POLICY "logs_insert" ON logs_sistema FOR INSERT 
             WITH CHECK (auth.uid() IS NOT NULL)';
    
    RAISE NOTICE '✅ Policies de logs_sistema criadas (2)';
  ELSE
    RAISE NOTICE '⚠️  Tabela logs_sistema não existe (ignorada)';
  END IF;
END $$;

-- ============================================
-- ETAPA 4: VERIFICAÇÃO FINAL
-- ============================================

-- Verificar ENUM
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Verificar usuários migrados
SELECT 
  role, 
  COUNT(*) as total,
  STRING_AGG(email, ', ') as emails
FROM usuarios
GROUP BY role
ORDER BY role;

-- Verificar policies criadas
SELECT 
  tablename,
  COUNT(*) as total_policies
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema')
GROUP BY tablename
ORDER BY tablename;

-- ============================================
-- RESUMO
-- ============================================

DO $$
DECLARE
  total_agencia INTEGER;
  total_cliente INTEGER;
  total_policies INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_agencia FROM usuarios WHERE role = 'agencia';
  SELECT COUNT(*) INTO total_cliente FROM usuarios WHERE role = 'cliente';
  SELECT COUNT(*) INTO total_policies FROM pg_policies 
    WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema');
  
  RAISE NOTICE '';
  RAISE NOTICE '╔════════════════════════════════════════╗';
  RAISE NOTICE '║  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!   ║';
  RAISE NOTICE '╚════════════════════════════════════════╝';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO:';
  RAISE NOTICE '  → % usuários tipo AGÊNCIA', total_agencia;
  RAISE NOTICE '  → % usuários tipo CLIENTE', total_cliente;
  RAISE NOTICE '  → % policies RLS criadas', total_policies;
  RAISE NOTICE '';
  RAISE NOTICE '🎯 PRÓXIMOS PASSOS:';
  RAISE NOTICE '  1. Atualizar código TypeScript (lib/types.ts)';
  RAISE NOTICE '  2. Atualizar validações nas APIs';
  RAISE NOTICE '  3. Atualizar formulários';
  RAISE NOTICE '  4. Testar login como agência e cliente';
  RAISE NOTICE '';
END $$;
