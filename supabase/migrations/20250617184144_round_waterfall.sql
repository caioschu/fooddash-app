/*
  # Integração com Stripe

  1. Novas tabelas
    - `subscriptions` - Assinaturas dos usuários
    - `payments` - Histórico de pagamentos
    - `stripe_customers` - Dados dos clientes no Stripe

  2. Funcionalidades
    - Controle de assinaturas ativas
    - Histórico de pagamentos
    - Sincronização com webhooks do Stripe
*/

-- Tabela de clientes Stripe
CREATE TABLE IF NOT EXISTS stripe_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_customer_id text UNIQUE NOT NULL,
  email text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de assinaturas
CREATE TABLE IF NOT EXISTS subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  stripe_subscription_id text UNIQUE NOT NULL,
  stripe_customer_id text NOT NULL,
  status text NOT NULL,
  plan_name text NOT NULL,
  plan_price numeric(10,2) NOT NULL,
  plan_interval text NOT NULL,
  current_period_start timestamptz NOT NULL,
  current_period_end timestamptz NOT NULL,
  cancel_at_period_end boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Tabela de pagamentos
CREATE TABLE IF NOT EXISTS payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES users(id) ON DELETE CASCADE,
  subscription_id uuid REFERENCES subscriptions(id) ON DELETE CASCADE,
  stripe_payment_intent_id text UNIQUE NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'brl',
  status text NOT NULL,
  description text,
  created_at timestamptz DEFAULT now()
);

-- Habilitar RLS
ALTER TABLE stripe_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Políticas para stripe_customers
CREATE POLICY "Users can read own stripe customer data" ON stripe_customers
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own stripe customer data" ON stripe_customers
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own stripe customer data" ON stripe_customers
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para subscriptions
CREATE POLICY "Users can read own subscriptions" ON subscriptions
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own subscriptions" ON subscriptions
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update own subscriptions" ON subscriptions
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Políticas para payments
CREATE POLICY "Users can read own payments" ON payments
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own payments" ON payments
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Triggers para updated_at
CREATE TRIGGER update_stripe_customers_updated_at BEFORE UPDATE ON stripe_customers
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Função para buscar assinatura ativa do usuário
CREATE OR REPLACE FUNCTION get_user_active_subscription(user_uuid uuid)
RETURNS TABLE (
  subscription_id uuid,
  stripe_subscription_id text,
  status text,
  plan_name text,
  plan_price numeric,
  plan_interval text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    s.id,
    s.stripe_subscription_id,
    s.status,
    s.plan_name,
    s.plan_price,
    s.plan_interval,
    s.current_period_start,
    s.current_period_end,
    s.cancel_at_period_end
  FROM subscriptions s
  WHERE s.user_id = user_uuid
    AND s.status IN ('active', 'trialing')
    AND s.current_period_end > now()
  ORDER BY s.created_at DESC
  LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Função para verificar se usuário tem assinatura ativa
CREATE OR REPLACE FUNCTION user_has_active_subscription(user_uuid uuid)
RETURNS boolean AS $$
DECLARE
  has_subscription boolean;
BEGIN
  SELECT EXISTS(
    SELECT 1 FROM subscriptions s
    WHERE s.user_id = user_uuid
      AND s.status IN ('active', 'trialing')
      AND s.current_period_end > now()
  ) INTO has_subscription;
  
  RETURN has_subscription;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;