-- ============================================
-- MIGRAÇÃO: Simplificar sistema de roles
-- De 3 roles (super_admin, admin_cliente, usuario_cliente)
-- Para 2 roles (agencia, cliente)
-- ============================================

-- EXECUTAR NO SUPABASE SQL EDITOR

-- PASSO 1: Converter coluna de ENUM para TEXT temporariamente
ALTER TABLE usuarios 
ALTER COLUMN role TYPE text;

-- PASSO 2: Atualizar valores
UPDATE usuarios 
SET role = CASE 
  WHEN role = 'super_admin' THEN 'agencia'
  WHEN role = 'admin_cliente' THEN 'cliente'
  WHEN role = 'usuario_cliente' THEN 'cliente'
  ELSE 'cliente'
END;

-- PASSO 3: Verificar resultado
SELECT 
  role, 
  COUNT(*) as total,
  STRING_AGG(email, ', ') as usuarios
FROM usuarios
GROUP BY role
ORDER BY role;
-- Deve mostrar apenas: 'agencia' e 'cliente'

-- PASSO 4: Dropar tipo ENUM antigo (se existir)
DROP TYPE IF EXISTS user_role CASCADE;

-- PASSO 5: Criar novo tipo ENUM
CREATE TYPE user_role AS ENUM ('agencia', 'cliente');

-- PASSO 6: Converter coluna de TEXT para novo ENUM
ALTER TABLE usuarios 
ALTER COLUMN role TYPE user_role USING role::user_role;

-- PASSO 7: Adicionar constraint NOT NULL (se não existir)
ALTER TABLE usuarios 
ALTER COLUMN role SET NOT NULL;

-- PASSO 8: Adicionar comentário explicativo
COMMENT ON COLUMN usuarios.role IS 
'Tipo de acesso ao sistema:
- agencia: acesso completo (vê e gerencia tudo)
- cliente: acesso limitado (vê apenas seu próprio WhatsApp)';

-- PASSO 9: Verificação final
SELECT 
  t.typname AS enum_name,
  e.enumlabel AS enum_value
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid  
WHERE t.typname = 'user_role'
ORDER BY e.enumsortorder;
-- Deve mostrar: agencia, cliente

-- ✅ MIGRAÇÃO CONCLUÍDA
-- Resultado esperado:
-- - Todos os super_admin viraram agencia
-- - Todos os admin_cliente e usuario_cliente viraram cliente
-- - Tipo ENUM atualizado com apenas 2 valores
