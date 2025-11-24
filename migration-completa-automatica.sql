-- ============================================
-- MIGRAÇÃO COMPLETA COM DROP AUTOMÁTICO
-- ============================================

DO $$
DECLARE
  policy_record RECORD;
BEGIN
  -- ETAPA 1: Dropar TODAS as policies das tabelas relevantes
  RAISE NOTICE 'Dropando todas as policies antigas...';
  
  FOR policy_record IN 
    SELECT schemaname, tablename, policyname
    FROM pg_policies
    WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema')
  LOOP
    EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', 
      policy_record.policyname, 
      policy_record.schemaname, 
      policy_record.tablename
    );
    RAISE NOTICE '  Dropada: %.%', policy_record.tablename, policy_record.policyname;
  END LOOP;
  
  RAISE NOTICE '✅ Todas as policies antigas foram removidas';
  
  -- ETAPA 2: Migrar ENUM
  RAISE NOTICE 'Convertendo role para TEXT...';
  ALTER TABLE usuarios ALTER COLUMN role TYPE text;
  
  RAISE NOTICE 'Atualizando valores...';
  UPDATE usuarios 
  SET role = CASE 
    WHEN role = 'super_admin' THEN 'agencia'
    WHEN role = 'admin_cliente' THEN 'cliente'
    WHEN role = 'usuario_cliente' THEN 'cliente'
    ELSE 'cliente'
  END;
  
  RAISE NOTICE 'Dropando ENUM antigo...';
  DROP TYPE IF EXISTS user_role CASCADE;
  
  RAISE NOTICE 'Criando novo ENUM...';
  CREATE TYPE user_role AS ENUM ('agencia', 'cliente');
  
  RAISE NOTICE 'Convertendo role para novo ENUM...';
  ALTER TABLE usuarios ALTER COLUMN role TYPE user_role USING role::user_role;
  ALTER TABLE usuarios ALTER COLUMN role SET NOT NULL;
  
  COMMENT ON COLUMN usuarios.role IS 
    'Tipo de acesso: agencia (total) ou cliente (limitado)';
  
  RAISE NOTICE '✅ Migração de ENUM concluída';
END $$;

-- ============================================
-- ETAPA 3: RECRIAR POLICIES
-- ============================================

-- TABELA: clientes
CREATE POLICY "clientes_select"
ON clientes FOR SELECT
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR usuario_id = auth.uid()
);

CREATE POLICY "clientes_insert"
ON clientes FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

CREATE POLICY "clientes_update"
ON clientes FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR usuario_id = auth.uid()
);

CREATE POLICY "clientes_delete"
ON clientes FOR DELETE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

-- TABELA: usuarios
CREATE POLICY "usuarios_select"
ON usuarios FOR SELECT
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
  OR id = auth.uid()
);

CREATE POLICY "usuarios_insert"
ON usuarios FOR INSERT
WITH CHECK (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

CREATE POLICY "usuarios_update"
ON usuarios FOR UPDATE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

CREATE POLICY "usuarios_delete"
ON usuarios FOR DELETE
USING (
  EXISTS (SELECT 1 FROM usuarios WHERE id = auth.uid() AND role = 'agencia')
);

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
    
    RAISE NOTICE '✅ Policies de templates criadas';
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
    
    RAISE NOTICE '✅ Policies de logs_sistema criadas';
  END IF;
END $$;

-- ============================================
-- VERIFICAÇÃO FINAL
-- ============================================

-- Ver ENUM criado
SELECT 'ENUM user_role:' as info, enumlabel as valores
FROM pg_enum e
JOIN pg_type t ON e.enumtypid = t.oid
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;

-- Ver usuários migrados
SELECT 'Usuários por role:' as info, role, COUNT(*) as total
FROM usuarios
GROUP BY role
ORDER BY role;

-- Ver policies criadas
SELECT 'Policies criadas:' as info, tablename, COUNT(*) as total
FROM pg_policies 
WHERE tablename IN ('clientes', 'usuarios', 'templates', 'logs_sistema')
GROUP BY tablename
ORDER BY tablename;

-- Resumo final
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
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '  ✅ MIGRAÇÃO CONCLUÍDA COM SUCESSO!';
  RAISE NOTICE '════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 RESUMO:';
  RAISE NOTICE '  → % usuários AGÊNCIA', total_agencia;
  RAISE NOTICE '  → % usuários CLIENTE', total_cliente;
  RAISE NOTICE '  → % policies RLS criadas', total_policies;
  RAISE NOTICE '';
END $$;
