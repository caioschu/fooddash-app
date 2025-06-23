-- Limpar e recriar sistema de categorias de despesas
TRUNCATE TABLE expense_subcategories CASCADE;
TRUNCATE TABLE expense_categories CASCADE;

-- Inserir categorias corretas conforme especificado
INSERT INTO expense_categories (nome, tipo, descricao, ordem) VALUES
('Impostos', 'variavel', 'Impostos obrigatórias sobre faturamento', 1),
('CMV', 'variavel', 'Tudo que entra direto na produção ou entrega do produto', 2),
('Despesas com Vendas', 'variavel', 'Tudo que está ligado à operação de venda', 3),
('CMO', 'fixa', 'Todas as despesas com folha e encargos', 4),
('Marketing', 'fixa', 'Investimentos em marketing e publicidade', 5),
('Ocupação', 'fixa', 'Custos do espaço físico e operação', 6);

-- Inserir subcategorias conforme especificado
DO $$
DECLARE
  cat_id uuid;
BEGIN
  -- Impostos
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Impostos';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'SIMPLES', 1),
    (cat_id, 'PIS', 2),
    (cat_id, 'COFINS', 3),
    (cat_id, 'ISS', 4),
    (cat_id, 'ICMS', 5),
    (cat_id, 'Outros Impostos', 6);

  -- CMV
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'CMV';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Matéria-prima', 1),
    (cat_id, 'Bebidas', 2),
    (cat_id, 'Embalagens', 3),
    (cat_id, 'Frete de compra', 4),
    (cat_id, 'Outras Despesas de CMV', 5);

  -- Despesas com Vendas
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Despesas com Vendas';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Taxa de cartão débito', 1),
    (cat_id, 'Taxa de cartão crédito', 2),
    (cat_id, 'Taxa Sodexo', 3),
    (cat_id, 'Taxa Alelo', 4),
    (cat_id, 'Taxa Ticket', 5),
    (cat_id, 'Taxa Pagamento Online Ifood', 6),
    (cat_id, 'Taxa Pagamento Online App Proprio', 7),
    (cat_id, 'Taxa Comissão Ifood', 8),
    (cat_id, 'Taxa Comissão App Proprio', 9),
    (cat_id, 'Motoboy', 10),
    (cat_id, 'Aluguel de POS (máquina de cartão)', 11),
    (cat_id, 'Outras Despesas de Vendas', 12);

  -- CMO
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'CMO';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Salários', 1),
    (cat_id, 'Férias', 2),
    (cat_id, 'Extras (Domingo, Feriado, Folga, Produção)', 3),
    (cat_id, '13º salário', 4),
    (cat_id, 'Comissão / Bonificação', 5),
    (cat_id, 'Rescisão', 6),
    (cat_id, 'INSS', 7),
    (cat_id, 'FGTS', 8),
    (cat_id, 'IRRF sobre salários', 9),
    (cat_id, 'Ajuda de custo', 10),
    (cat_id, 'Alimentação (vale-refeição, cesta)', 11),
    (cat_id, 'Vale transporte', 12),
    (cat_id, 'Plano de saúde', 13),
    (cat_id, 'Exame admissional / demissional', 14),
    (cat_id, 'Contribuição sindical', 15),
    (cat_id, 'Uniforme / crachá', 16),
    (cat_id, 'Pró-labore', 17),
    (cat_id, 'Outras despesas de CMO', 18);

  -- Marketing
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Marketing';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Agência', 1),
    (cat_id, 'Anuncios', 2),
    (cat_id, 'Material', 3),
    (cat_id, 'Ferramentas/Sistemas', 4),
    (cat_id, 'Outras Despesas de Marketing', 5);

  -- Ocupação
  SELECT id INTO cat_id FROM expense_categories WHERE nome = 'Ocupação';
  INSERT INTO expense_subcategories (category_id, nome, ordem) VALUES
    (cat_id, 'Aluguel', 1),
    (cat_id, 'Água', 2),
    (cat_id, 'Energia elétrica', 3),
    (cat_id, 'Telefone / internet', 4),
    (cat_id, 'Conservadora / faxina', 5),
    (cat_id, 'Monitoramento (câmeras, alarmes)', 6),
    (cat_id, 'Seguro (empresa, equipamentos)', 7),
    (cat_id, 'Material de escritório', 8),
    (cat_id, 'Material de limpeza / cozinha', 9),
    (cat_id, 'Contabilidade', 10),
    (cat_id, 'Manutenção ou serviços terceirizados', 11),
    (cat_id, 'Despesas bancárias', 12),
    (cat_id, 'Sistemas (ERP, PDV, etc.)', 13),
    (cat_id, 'Despesas jurídicas', 14),
    (cat_id, 'Outras Despesas Fixas', 15);
END $$;