/*
  # Correção das categorias e subcategorias de despesas

  1. Categorias
    - Limpar categorias existentes
    - Adicionar categorias corretas com tipos apropriados
    - Configurar subcategorias para cada categoria

  2. Campos adicionais
    - Adicionar campos para controle de pagamento
    - Configurar status de pagamento
*/

-- Limpar categorias e subcategorias existentes
TRUNCATE TABLE expense_subcategories CASCADE;
TRUNCATE TABLE expense_categories CASCADE;

-- Inserir categorias corretas
INSERT INTO expense_categories (nome, tipo, descricao, ordem) VALUES
('Impostos', 'variavel', 'Impostos e tributos sobre vendas', 1),
('CMV – Custo da Mercadoria Vendida', 'variavel', 'Custos diretos dos produtos vendidos', 2),
('Despesas com Vendas', 'variavel', 'Taxas e comissões sobre vendas', 3),
('CMO – Custo de Mão de Obra', 'fixa', 'Custos com pessoal e encargos', 4),
('Marketing', 'marketing', 'Investimentos em marketing e publicidade', 5),
('Ocupação', 'fixa', 'Custos do espaço físico', 6),
('Administrativo', 'fixa', 'Despesas administrativas e burocráticas', 7),
('Equipamentos e Manutenção', 'fixa', 'Equipamentos e manutenções', 8);

-- Inserir subcategorias para cada categoria
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Impostos
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Impostos';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'ISS', 1),
    (cat_id, 'ICMS', 2),
    (cat_id, 'PIS/COFINS', 3),
    (cat_id, 'IRPJ', 4),
    (cat_id, 'CSLL', 5),
    (cat_id, 'Simples Nacional', 6),
    (cat_id, 'Outros Impostos', 7);

  -- CMV
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'CMV – Custo da Mercadoria Vendida';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Carnes', 1),
    (cat_id, 'Aves', 2),
    (cat_id, 'Peixes e Frutos do Mar', 3),
    (cat_id, 'Vegetais e Verduras', 4),
    (cat_id, 'Frutas', 5),
    (cat_id, 'Laticínios', 6),
    (cat_id, 'Bebidas', 7),
    (cat_id, 'Condimentos e Temperos', 8),
    (cat_id, 'Massas', 9),
    (cat_id, 'Grãos e Cereais', 10),
    (cat_id, 'Óleos e Gorduras', 11),
    (cat_id, 'Outros Ingredientes', 12);

  -- Despesas com Vendas
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Despesas com Vendas';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Taxas de Cartão', 1),
    (cat_id, 'Taxas de Delivery', 2),
    (cat_id, 'Comissões', 3),
    (cat_id, 'Embalagens', 4),
    (cat_id, 'Material de Entrega', 5),
    (cat_id, 'Outras Taxas de Venda', 6);

  -- CMO
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'CMO – Custo de Mão de Obra';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Salários', 1),
    (cat_id, 'Encargos Sociais', 2),
    (cat_id, 'Vale Transporte', 3),
    (cat_id, 'Vale Refeição', 4),
    (cat_id, 'Plano de Saúde', 5),
    (cat_id, 'Seguro de Vida', 6),
    (cat_id, 'Treinamentos', 7),
    (cat_id, 'Uniformes', 8),
    (cat_id, 'Outros Benefícios', 9);

  -- Marketing
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Marketing';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Publicidade Online', 1),
    (cat_id, 'Redes Sociais', 2),
    (cat_id, 'Material Gráfico', 3),
    (cat_id, 'Eventos e Promoções', 4),
    (cat_id, 'Influenciadores', 5),
    (cat_id, 'Google Ads', 6),
    (cat_id, 'Facebook Ads', 7),
    (cat_id, 'Outros Marketing', 8);

  -- Ocupação
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Ocupação';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Aluguel', 1),
    (cat_id, 'Condomínio', 2),
    (cat_id, 'IPTU', 3),
    (cat_id, 'Energia Elétrica', 4),
    (cat_id, 'Água e Esgoto', 5),
    (cat_id, 'Telefone/Internet', 6),
    (cat_id, 'Gás', 7),
    (cat_id, 'Segurança', 8),
    (cat_id, 'Limpeza', 9),
    (cat_id, 'Manutenção Predial', 10),
    (cat_id, 'Seguros do Imóvel', 11);

  -- Administrativo
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Administrativo';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Material de Escritório', 1),
    (cat_id, 'Software/Licenças', 2),
    (cat_id, 'Contabilidade', 3),
    (cat_id, 'Advocacia', 4),
    (cat_id, 'Consultorias', 5),
    (cat_id, 'Certificações', 6),
    (cat_id, 'Taxas Bancárias', 7),
    (cat_id, 'Outros Administrativos', 8);

  -- Equipamentos e Manutenção
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Equipamentos e Manutenção';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Manutenção de Equipamentos', 1),
    (cat_id, 'Peças e Componentes', 2),
    (cat_id, 'Equipamentos Novos', 3),
    (cat_id, 'Utensílios de Cozinha', 4),
    (cat_id, 'Móveis', 5),
    (cat_id, 'Tecnologia/Informática', 6),
    (cat_id, 'Outros Equipamentos', 7);
END $$;