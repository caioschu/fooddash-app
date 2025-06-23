/*
  # Sistema de Gestão de Acessos

  1. New Tables
    - `user_accesses`
      - `id` (uuid, primary key)
      - `restaurant_id` (uuid, foreign key)
      - `created_by` (uuid, foreign key to users)
      - `name` (text)
      - `email` (text, unique)
      - `password_hash` (text)
      - `permissions` (jsonb)
      - `active` (boolean)
      - `last_login` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `user_accesses` table
    - Add policies for restaurant owners to manage their access accounts
*/

CREATE TABLE IF NOT EXISTS user_accesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  created_by uuid REFERENCES users(id) ON DELETE CASCADE,
  name text NOT NULL,
  email text UNIQUE NOT NULL,
  password_hash text NOT NULL,
  permissions jsonb DEFAULT '{}',
  active boolean DEFAULT true,
  last_login timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE user_accesses ENABLE ROW LEVEL SECURITY;

-- Trigger para atualizar updated_at
CREATE OR REPLACE FUNCTION update_user_accesses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_accesses_updated_at
  BEFORE UPDATE ON user_accesses
  FOR EACH ROW
  EXECUTE FUNCTION update_user_accesses_updated_at();

-- Políticas de segurança
CREATE POLICY "Restaurant owners can manage their access accounts"
  ON user_accesses
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = user_accesses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Função para autenticar usuários de acesso
CREATE OR REPLACE FUNCTION authenticate_access_user(
  user_email text,
  user_password text
)
RETURNS TABLE(
  access_id uuid,
  restaurant_id uuid,
  name text,
  email text,
  permissions jsonb,
  restaurant_name text
) AS $$
DECLARE
  access_record user_accesses%ROWTYPE;
  restaurant_record restaurants%ROWTYPE;
BEGIN
  -- Buscar usuário de acesso ativo
  SELECT * INTO access_record
  FROM user_accesses
  WHERE user_accesses.email = user_email
    AND user_accesses.active = true;

  -- Verificar se usuário existe
  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Verificar senha (em produção, usar hash adequado)
  IF access_record.password_hash != crypt(user_password, access_record.password_hash) THEN
    RETURN;
  END IF;

  -- Buscar dados do restaurante
  SELECT * INTO restaurant_record
  FROM restaurants
  WHERE restaurants.id = access_record.restaurant_id;

  -- Atualizar último login
  UPDATE user_accesses 
  SET last_login = now()
  WHERE user_accesses.id = access_record.id;

  -- Retornar dados
  RETURN QUERY SELECT
    access_record.id,
    access_record.restaurant_id,
    access_record.name,
    access_record.email,
    access_record.permissions,
    restaurant_record.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;