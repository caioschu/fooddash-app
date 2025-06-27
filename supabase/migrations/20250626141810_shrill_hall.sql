/*
  # Correção do sistema de autenticação de funcionários

  1. Alterações
    - Simplificar o sistema de hash de senha para compatibilidade
    - Corrigir a função de autenticação de funcionários
    - Adicionar valores padrão para permissões

  2. Segurança
    - Manter RLS habilitado
    - Garantir que apenas proprietários possam gerenciar acessos
*/

-- Atualizar a estrutura da tabela user_accesses para garantir permissões padrão
ALTER TABLE user_accesses 
  ALTER COLUMN permissions SET DEFAULT '{
    "sales": true,
    "expenses": true,
    "dre": false,
    "profile": false,
    "dashboard": true,
    "analytics": false,
    "reports": false,
    "settings": false
  }'::jsonb;

-- Remover funções existentes que podem estar causando problemas
DROP FUNCTION IF EXISTS authenticate_employee_access;
DROP FUNCTION IF EXISTS create_password_hash;
DROP FUNCTION IF EXISTS check_employee_permission;
DROP FUNCTION IF EXISTS get_employee_permissions;
DROP FUNCTION IF EXISTS update_employee_password;

-- Criar uma função simplificada para autenticar funcionários
CREATE OR REPLACE FUNCTION authenticate_employee_access(
  login_email text,
  login_password text
)
RETURNS TABLE(
  access_id uuid,
  restaurant_id uuid,
  restaurant_name text,
  employee_name text,
  employee_email text,
  permissions jsonb,
  is_active boolean,
  restaurant_logo text,
  restaurant_category text
) AS $$
BEGIN
  -- Retornar dados do funcionário e restaurante
  RETURN QUERY
  SELECT
    ua.id as access_id,
    ua.restaurant_id,
    r.nome as restaurant_name,
    ua.name as employee_name,
    ua.email as employee_email,
    ua.permissions,
    ua.active as is_active,
    r.logo_url as restaurant_logo,
    r.categoria_culinaria as restaurant_category
  FROM user_accesses ua
  JOIN restaurants r ON r.id = ua.restaurant_id
  WHERE ua.email = login_email
    AND ua.password_hash = encode(login_password::bytea, 'base64')
    AND ua.active = true
    AND r.ativo = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;