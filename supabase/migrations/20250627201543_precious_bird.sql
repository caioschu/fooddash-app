/*
  # Sistema de Gerenciamento de Múltiplos Restaurantes

  1. Novas Tabelas
    - `restaurant_groups` - Grupos/redes de restaurantes
    - `restaurant_memberships` - Associação entre restaurantes e grupos

  2. Funcionalidades
    - Permitir que um usuário tenha múltiplos restaurantes
    - Agrupar restaurantes em redes para análise consolidada
    - Controlar permissões de acesso por restaurante
    - Suportar cobrança adicional por unidade

  3. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas para controle de acesso
*/

-- Tabela de grupos/redes de restaurantes
CREATE TABLE IF NOT EXISTS restaurant_groups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  logo_url text,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de associação entre restaurantes e grupos
CREATE TABLE IF NOT EXISTS restaurant_memberships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  group_id uuid REFERENCES restaurant_groups(id) ON DELETE CASCADE,
  is_primary boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(restaurant_id, group_id)
);

-- Adicionar campo para indicar se o restaurante é matriz ou filial
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS is_matriz boolean DEFAULT true;
ALTER TABLE restaurants ADD COLUMN IF NOT EXISTS matriz_id uuid REFERENCES restaurants(id) NULL;

-- Habilitar RLS
ALTER TABLE restaurant_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurant_memberships ENABLE ROW LEVEL SECURITY;

-- Políticas para restaurant_groups
CREATE POLICY "Users can read own restaurant groups"
  ON restaurant_groups
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own restaurant groups"
  ON restaurant_groups
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own restaurant groups"
  ON restaurant_groups
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can delete own restaurant groups"
  ON restaurant_groups
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

-- Políticas para restaurant_memberships
CREATE POLICY "Users can manage restaurant memberships"
  ON restaurant_memberships
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurant_groups
      WHERE restaurant_groups.id = restaurant_memberships.group_id
      AND restaurant_groups.user_id = auth.uid()
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_restaurant_groups_updated_at
  BEFORE UPDATE ON restaurant_groups
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurant_memberships_updated_at
  BEFORE UPDATE ON restaurant_memberships
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Função para obter todos os restaurantes de um usuário
CREATE OR REPLACE FUNCTION get_user_restaurants(user_uuid uuid)
RETURNS TABLE (
  id uuid,
  nome text,
  cidade text,
  estado text,
  categoria_culinaria text,
  logo_url text,
  is_matriz boolean,
  matriz_id uuid,
  group_id uuid,
  group_name text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    r.id,
    r.nome,
    r.cidade,
    r.estado,
    r.categoria_culinaria,
    r.logo_url,
    r.is_matriz,
    r.matriz_id,
    rg.id as group_id,
    rg.nome as group_name
  FROM restaurants r
  LEFT JOIN restaurant_memberships rm ON r.id = rm.restaurant_id
  LEFT JOIN restaurant_groups rg ON rm.group_id = rg.id
  WHERE r.user_id = user_uuid
  ORDER BY r.is_matriz DESC, r.nome ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para obter dados consolidados de uma rede
CREATE OR REPLACE FUNCTION get_restaurant_group_data(group_uuid uuid)
RETURNS TABLE (
  total_restaurants integer,
  total_revenue numeric,
  total_expenses numeric,
  total_profit numeric,
  average_ticket numeric,
  total_orders integer
) AS $$
DECLARE
  start_date date;
  end_date date;
BEGIN
  -- Definir período (últimos 30 dias)
  start_date := current_date - interval '30 days';
  end_date := current_date;
  
  RETURN QUERY
  WITH group_restaurants AS (
    SELECT r.id
    FROM restaurants r
    JOIN restaurant_memberships rm ON r.id = rm.restaurant_id
    WHERE rm.group_id = group_uuid
  ),
  sales_data AS (
    SELECT 
      SUM(s.valor_bruto) as revenue,
      SUM(s.numero_pedidos) as orders
    FROM sales s
    WHERE s.restaurant_id IN (SELECT id FROM group_restaurants)
    AND s.data BETWEEN start_date AND end_date
  ),
  expenses_data AS (
    SELECT 
      SUM(e.valor) as expenses
    FROM expenses e
    WHERE e.restaurant_id IN (SELECT id FROM group_restaurants)
    AND e.data BETWEEN start_date AND end_date
  )
  SELECT
    (SELECT COUNT(*) FROM group_restaurants),
    COALESCE((SELECT revenue FROM sales_data), 0),
    COALESCE((SELECT expenses FROM expenses_data), 0),
    COALESCE((SELECT revenue FROM sales_data), 0) - COALESCE((SELECT expenses FROM expenses_data), 0),
    CASE 
      WHEN COALESCE((SELECT orders FROM sales_data), 0) > 0 
      THEN COALESCE((SELECT revenue FROM sales_data), 0) / COALESCE((SELECT orders FROM sales_data), 1)
      ELSE 0
    END,
    COALESCE((SELECT orders FROM sales_data), 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;