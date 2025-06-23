/*
  # Esquema completo do FoodDash SaaS

  1. Tabelas principais
    - `users` - Usuários do sistema (restaurantes, fornecedores, candidatos, admin)
    - `restaurants` - Dados dos restaurantes
    - `suppliers` - Dados dos fornecedores
    - `candidates` - Dados dos candidatos
    - `job_postings` - Vagas publicadas pelos restaurantes
    - `applications` - Candidaturas às vagas
    - `sales` - Dados de vendas dos restaurantes
    - `expenses` - Despesas dos restaurantes
    - `benchmarking` - Dados de benchmarking por região/categoria
    - `sales_channels` - Canais de venda dos restaurantes
    - `payment_methods` - Formas de pagamento dos restaurantes

  2. Segurança
    - RLS habilitado em todas as tabelas
    - Políticas específicas por tipo de usuário
*/

-- Extensões necessárias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Tabela de usuários (integrada com Supabase Auth)
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT auth.uid(),
  email text UNIQUE NOT NULL,
  tipo_usuario text NOT NULL CHECK (tipo_usuario IN ('restaurante', 'fornecedor', 'candidato', 'admin')),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de restaurantes
CREATE TABLE IF NOT EXISTS restaurants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nome text NOT NULL,
  cnpj text,
  cidade text NOT NULL,
  estado text NOT NULL,
  endereco text,
  telefone text,
  categoria_culinaria text NOT NULL,
  logo_url text,
  descricao text,
  horario_funcionamento jsonb,
  capacidade_pessoas integer,
  area_m2 numeric,
  completude_perfil integer DEFAULT 0,
  aceita_contato_fornecedores boolean DEFAULT true,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de canais de venda
CREATE TABLE IF NOT EXISTS sales_channels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  taxa_percentual numeric(5,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de formas de pagamento
CREATE TABLE IF NOT EXISTS payment_methods (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  nome text NOT NULL,
  taxa_percentual numeric(5,2) DEFAULT 0,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Tabela de fornecedores
CREATE TABLE IF NOT EXISTS suppliers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nome_empresa text NOT NULL,
  cnpj text,
  cidade text NOT NULL,
  estado text NOT NULL,
  endereco text,
  telefone text NOT NULL,
  email text NOT NULL,
  categoria_produto text NOT NULL,
  produtos jsonb,
  certificacoes jsonb,
  areas_entrega jsonb,
  pedido_minimo numeric(10,2),
  prazos_pagamento jsonb,
  logo_url text,
  descricao text,
  avaliacao_media numeric(3,2) DEFAULT 0,
  total_avaliacoes integer DEFAULT 0,
  verificado boolean DEFAULT false,
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de candidatos
CREATE TABLE IF NOT EXISTS candidates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  nome_completo text NOT NULL,
  cpf text,
  telefone text NOT NULL,
  cidade text NOT NULL,
  estado text NOT NULL,
  data_nascimento date,
  experiencia_anos integer,
  areas_interesse jsonb,
  experiencia_anterior text,
  curriculo_url text,
  disponibilidade text CHECK (disponibilidade IN ('imediata', '15dias', '30dias')),
  salario_pretendido numeric(10,2),
  ativo boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de vagas
CREATE TABLE IF NOT EXISTS job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  titulo text NOT NULL,
  cargo text NOT NULL,
  descricao text NOT NULL,
  requisitos jsonb,
  beneficios jsonb,
  cidade text NOT NULL,
  estado text NOT NULL,
  horario_escala text,
  salario_min numeric(10,2),
  salario_max numeric(10,2),
  tipo_contrato text CHECK (tipo_contrato IN ('clt', 'pj', 'temporario', 'estagio')),
  contato_preferencial text CHECK (contato_preferencial IN ('whatsapp', 'email', 'ambos')),
  contato_whatsapp text,
  contato_email text,
  ativa boolean DEFAULT true,
  expira_em timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de candidaturas
CREATE TABLE IF NOT EXISTS applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  candidate_id uuid REFERENCES candidates(id) ON DELETE CASCADE,
  job_posting_id uuid REFERENCES job_postings(id) ON DELETE CASCADE,
  status text DEFAULT 'pendente' CHECK (status IN ('pendente', 'visualizada', 'aceita', 'rejeitada')),
  observacoes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(candidate_id, job_posting_id)
);

-- Tabela de vendas
CREATE TABLE IF NOT EXISTS sales (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  data date NOT NULL,
  canal text NOT NULL,
  forma_pagamento text NOT NULL,
  valor_bruto numeric(10,2) NOT NULL,
  valor_liquido numeric(10,2),
  numero_pedidos integer DEFAULT 1,
  ticket_medio numeric(10,2),
  taxa_canal numeric(5,2),
  taxa_pagamento numeric(5,2),
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de despesas
CREATE TABLE IF NOT EXISTS expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  data date NOT NULL,
  nome text NOT NULL,
  categoria text NOT NULL,
  subcategoria text,
  tipo text NOT NULL CHECK (tipo IN ('fixa', 'variavel', 'marketing', 'taxa_automatica')),
  valor numeric(10,2) NOT NULL,
  forma_pagamento text,
  canal text,
  recorrente boolean DEFAULT false,
  origem_automatica boolean DEFAULT false,
  observacoes text,
  created_at timestamptz DEFAULT now()
);

-- Tabela de benchmarking
CREATE TABLE IF NOT EXISTS benchmarking (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cidade text NOT NULL,
  estado text NOT NULL,
  categoria_culinaria text NOT NULL,
  ticket_medio numeric(10,2) NOT NULL,
  margem_media numeric(5,2) NOT NULL,
  cmv_medio numeric(5,2) NOT NULL,
  gasto_fixo_medio numeric(5,2) NOT NULL,
  ponto_equilibrio_medio numeric(10,2) NOT NULL,
  taxa_media_venda numeric(5,2) NOT NULL,
  gasto_marketing_medio numeric(5,2) NOT NULL,
  total_restaurantes integer NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(cidade, estado, categoria_culinaria)
);

-- Habilitar RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales_channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_methods ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE benchmarking ENABLE ROW LEVEL SECURITY;

-- Políticas para users
CREATE POLICY "Users can read own data" ON users
  FOR SELECT TO authenticated
  USING (auth.uid() = id);

CREATE POLICY "Users can update own data" ON users
  FOR UPDATE TO authenticated
  USING (auth.uid() = id);

-- Políticas para restaurants
CREATE POLICY "Restaurants can read own data" ON restaurants
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurants can update own data" ON restaurants
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Restaurants can insert own data" ON restaurants
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Admin can read all restaurants" ON restaurants
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Políticas para sales_channels
CREATE POLICY "Restaurants can manage own sales channels" ON sales_channels
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = sales_channels.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Políticas para payment_methods
CREATE POLICY "Restaurants can manage own payment methods" ON payment_methods
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = payment_methods.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Políticas para suppliers
CREATE POLICY "Suppliers can read own data" ON suppliers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Suppliers can update own data" ON suppliers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Suppliers can insert own data" ON suppliers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Everyone can read active suppliers" ON suppliers
  FOR SELECT TO authenticated
  USING (ativo = true);

-- Políticas para candidates
CREATE POLICY "Candidates can read own data" ON candidates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Candidates can update own data" ON candidates
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Candidates can insert own data" ON candidates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Políticas para job_postings
CREATE POLICY "Restaurants can manage own job postings" ON job_postings
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = job_postings.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE POLICY "Everyone can read active job postings" ON job_postings
  FOR SELECT TO authenticated
  USING (ativa = true);

-- Políticas para applications
CREATE POLICY "Candidates can manage own applications" ON applications
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM candidates 
      WHERE candidates.id = applications.candidate_id 
      AND candidates.user_id = auth.uid()
    )
  );

CREATE POLICY "Restaurants can read applications for their jobs" ON applications
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM job_postings jp
      JOIN restaurants r ON r.id = jp.restaurant_id
      WHERE jp.id = applications.job_posting_id 
      AND r.user_id = auth.uid()
    )
  );

-- Políticas para sales
CREATE POLICY "Restaurants can manage own sales" ON sales
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = sales.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Políticas para expenses
CREATE POLICY "Restaurants can manage own expenses" ON expenses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants 
      WHERE restaurants.id = expenses.restaurant_id 
      AND restaurants.user_id = auth.uid()
    )
  );

-- Políticas para benchmarking
CREATE POLICY "Everyone can read benchmarking data" ON benchmarking
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Admin can manage benchmarking data" ON benchmarking
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM users 
      WHERE users.id = auth.uid() 
      AND users.tipo_usuario = 'admin'
    )
  );

-- Funções para atualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_restaurants_updated_at BEFORE UPDATE ON restaurants
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_candidates_updated_at BEFORE UPDATE ON candidates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON job_postings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_applications_updated_at BEFORE UPDATE ON applications
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_benchmarking_updated_at BEFORE UPDATE ON benchmarking
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Inserir dados de benchmarking iniciais
INSERT INTO benchmarking (cidade, estado, categoria_culinaria, ticket_medio, margem_media, cmv_medio, gasto_fixo_medio, ponto_equilibrio_medio, taxa_media_venda, gasto_marketing_medio, total_restaurantes) VALUES
('Belo Horizonte', 'MG', 'Japonesa', 34.60, 16.2, 31, 29, 10900, 14.9, 4, 829),
('São Paulo', 'SP', 'Italiana', 42.80, 18.5, 28, 32, 15200, 16.2, 5.5, 1247),
('Rio de Janeiro', 'RJ', 'Brasileira', 38.90, 15.8, 33, 28, 12500, 15.1, 4.2, 956),
('Curitiba', 'PR', 'Fast Food', 28.50, 22.1, 35, 25, 8900, 18.5, 6.8, 634),
('Porto Alegre', 'RS', 'Churrascaria', 65.20, 19.3, 29, 31, 18700, 12.8, 3.9, 423);