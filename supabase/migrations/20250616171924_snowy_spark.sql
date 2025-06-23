/*
  # Sistema de Categorias e Subcategorias de Despesas

  1. Novas tabelas
    - `expense_categories` - Categorias de despesas administráveis
    - `expense_subcategories` - Subcategorias vinculadas às categorias

  2. Funcionalidades
    - Categorias e subcategorias gerenciadas pelo admin
    - Classificação automática de tipo (fixa/variável)
    - Vinculação com despesas existentes
*/

-- Tabela de categorias de despesas
CREATE TABLE IF NOT EXISTS expense_categories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL UNIQUE,
  tipo text NOT NULL CHECK (tipo IN ('fixa', 'variavel', 'marketing')),
  descricao text,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de subcategorias de despesas
CREATE TABLE IF NOT EXISTS expense_subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id uuid REFERENCES expense_categories(id) ON DELETE CASCADE,
  nome text NOT NULL,
  descricao text,
  ativo boolean DEFAULT true,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(category_id, nome)
);

-- Habilitar RLS
ALTER TABLE expense_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE expense_subcategories ENABLE ROW LEVEL SECURITY;

-- Políticas para expense_categories
CREATE POLICY "Everyone can read active categories" ON expense_categories
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admin can manage categories" ON expense_categories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Políticas para expense_subcategories
CREATE POLICY "Everyone can read active subcategories" ON expense_subcategories
  FOR SELECT TO authenticated
  USING (ativo = true);

CREATE POLICY "Admin can manage subcategories" ON expense_subcategories
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Triggers para updated_at
CREATE TRIGGER update_expense_categories_updated_at BEFORE UPDATE ON expense_categories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_expense_subcategories_updated_at BEFORE UPDATE ON expense_subcategories
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir categorias padrão
INSERT INTO expense_categories (nome, tipo, descricao, ordem) VALUES
('Impostos', 'variavel', 'Impostos e tributos sobre vendas', 1),
('CMV – Custo da Mercadoria Vendida', 'variavel', 'Custos diretos dos produtos vendidos', 2),
('Despesas com Vendas', 'variavel', 'Taxas e comissões sobre vendas', 3),
('CMO – Custo de Mão de Obra', 'fixa', 'Custos com pessoal e encargos', 4),
('Marketing', 'marketing', 'Investimentos em marketing e publicidade', 5),
('Ocupação', 'fixa', 'Custos do espaço físico', 6),
('Administrativo', 'fixa', 'Despesas administrativas e burocráticas', 7),
('Equipamentos e Manutenção', 'fixa', 'Equipamentos e manutenções', 8)
ON CONFLICT (nome) DO NOTHING;

-- Inserir subcategorias padrão
INSERT INTO expense_subcategories (category_id, nome, ordem) 
SELECT c.id, sub.nome, sub.ordem
FROM expense_categories c
CROSS JOIN (
  VALUES 
    ('Impostos', 'ISS', 1),
    ('Impostos', 'ICMS', 2),
    ('Impostos', 'PIS/COFINS', 3),
    ('Impostos', 'IRPJ', 4),
    ('Impostos', 'CSLL', 5),
    ('Impostos', 'Simples Nacional', 6),
    ('Impostos', 'Outros Impostos', 7),
    
    ('CMV – Custo da Mercadoria Vendida', 'Carnes', 1),
    ('CMV – Custo da Mercadoria Vendida', 'Aves', 2),
    ('CMV – Custo da Mercadoria Vendida', 'Peixes e Frutos do Mar', 3),
    ('CMV – Custo da Mercadoria Vendida', 'Vegetais e Verduras', 4),
    ('CMV – Custo da Mercadoria Vendida', 'Frutas', 5),
    ('CMV – Custo da Mercadoria Vendida', 'Laticínios', 6),
    ('CMV – Custo da Mercadoria Vendida', 'Bebidas', 7),
    ('CMV – Custo da Mercadoria Vendida', 'Condimentos e Temperos', 8),
    ('CMV – Custo da Mercadoria Vendida', 'Massas', 9),
    ('CMV – Custo da Mercadoria Vendida', 'Grãos e Cereais', 10),
    ('CMV – Custo da Mercadoria Vendida', 'Óleos e Gorduras', 11),
    ('CMV – Custo da Mercadoria Vendida', 'Outros Ingredientes', 12),
    
    ('Despesas com Vendas', 'Taxas de Cartão', 1),
    ('Despesas com Vendas', 'Taxas de Delivery', 2),
    ('Despesas com Vendas', 'Comissões', 3),
    ('Despesas com Vendas', 'Embalagens', 4),
    ('Despesas com Vendas', 'Material de Entrega', 5),
    ('Despesas com Vendas', 'Outras Taxas de Venda', 6),
    
    ('CMO – Custo de Mão de Obra', 'Salários', 1),
    ('CMO – Custo de Mão de Obra', 'Encargos Sociais', 2),
    ('CMO – Custo de Mão de Obra', 'Vale Transporte', 3),
    ('CMO – Custo de Mão de Obra', 'Vale Refeição', 4),
    ('CMO – Custo de Mão de Obra', 'Plano de Saúde', 5),
    ('CMO – Custo de Mão de Obra', 'Seguro de Vida', 6),
    ('CMO – Custo de Mão de Obra', 'Treinamentos', 7),
    ('CMO – Custo de Mão de Obra', 'Uniformes', 8),
    ('CMO – Custo de Mão de Obra', 'Outros Benefícios', 9),
    
    ('Marketing', 'Publicidade Online', 1),
    ('Marketing', 'Redes Sociais', 2),
    ('Marketing', 'Material Gráfico', 3),
    ('Marketing', 'Eventos e Promoções', 4),
    ('Marketing', 'Influenciadores', 5),
    ('Marketing', 'Google Ads', 6),
    ('Marketing', 'Facebook Ads', 7),
    ('Marketing', 'Outros Marketing', 8),
    
    ('Ocupação', 'Aluguel', 1),
    ('Ocupação', 'Condomínio', 2),
    ('Ocupação', 'IPTU', 3),
    ('Ocupação', 'Energia Elétrica', 4),
    ('Ocupação', 'Água e Esgoto', 5),
    ('Ocupação', 'Telefone/Internet', 6),
    ('Ocupação', 'Gás', 7),
    ('Ocupação', 'Segurança', 8),
    ('Ocupação', 'Limpeza', 9),
    ('Ocupação', 'Manutenção Predial', 10),
    ('Ocupação', 'Seguros do Imóvel', 11),
    
    ('Administrativo', 'Material de Escritório', 1),
    ('Administrativo', 'Software/Licenças', 2),
    ('Administrativo', 'Contabilidade', 3),
    ('Administrativo', 'Advocacia', 4),
    ('Administrativo', 'Consultorias', 5),
    ('Administrativo', 'Certificações', 6),
    ('Administrativo', 'Taxas Bancárias', 7),
    ('Administrativo', 'Outros Administrativos', 8),
    
    ('Equipamentos e Manutenção', 'Manutenção de Equipamentos', 1),
    ('Equipamentos e Manutenção', 'Peças e Componentes', 2),
    ('Equipamentos e Manutenção', 'Equipamentos Novos', 3),
    ('Equipamentos e Manutenção', 'Utensílios de Cozinha', 4),
    ('Equipamentos e Manutenção', 'Móveis', 5),
    ('Equipamentos e Manutenção', 'Tecnologia/Informática', 6),
    ('Equipamentos e Manutenção', 'Outros Equipamentos', 7)
) AS sub(categoria_nome, nome, ordem)
WHERE c.nome = sub.categoria_nome
ON CONFLICT (category_id, nome) DO NOTHING;

-- Adicionar campos para controle de pagamento nas despesas
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'data_vencimento'
  ) THEN
    ALTER TABLE expenses ADD COLUMN data_vencimento date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'data_pagamento'
  ) THEN
    ALTER TABLE expenses ADD COLUMN data_pagamento date;
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'expenses' AND column_name = 'pago'
  ) THEN
    ALTER TABLE expenses ADD COLUMN pago boolean DEFAULT false;
  END IF;
END $$;

-- Função para buscar categorias com subcategorias
CREATE OR REPLACE FUNCTION get_expense_categories_with_subcategories()
RETURNS TABLE (
  category_id uuid,
  category_name text,
  category_type text,
  category_description text,
  subcategory_id uuid,
  subcategory_name text,
  subcategory_description text
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id as category_id,
    c.nome as category_name,
    c.tipo as category_type,
    c.descricao as category_description,
    s.id as subcategory_id,
    s.nome as subcategory_name,
    s.descricao as subcategory_description
  FROM expense_categories c
  LEFT JOIN expense_subcategories s ON c.id = s.category_id AND s.ativo = true
  WHERE c.ativo = true
  ORDER BY c.ordem, c.nome, s.ordem, s.nome;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;