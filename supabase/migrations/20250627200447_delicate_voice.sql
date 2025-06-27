CREATE TABLE IF NOT EXISTS valuations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id uuid REFERENCES restaurants(id) ON DELETE CASCADE,
  valuation_data jsonb NOT NULL,
  result jsonb NOT NULL,
  notes text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE valuations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Restaurants can manage own valuations"
  ON valuations
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = valuations.restaurant_id
      AND restaurants.user_id = auth.uid()
    )
  );

CREATE TRIGGER update_valuations_updated_at
  BEFORE UPDATE ON valuations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();