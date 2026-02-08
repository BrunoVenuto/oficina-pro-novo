/*
  # Workshop Management System Schema

  ## Overview
  Complete database schema for a mobile-first workshop management system focused on service orders, vehicle checklists, photos, and client communication.

  ## New Tables

  ### 1. clientes (Clients)
  - `id` (uuid, primary key)
  - `nome` (text) - Client name
  - `telefone` (text) - Phone number for WhatsApp
  - `email` (text, optional)
  - `cpf_cnpj` (text, optional)
  - `endereco` (text, optional)
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `user_id` (uuid) - Links to auth.users

  ### 2. veiculos (Vehicles)
  - `id` (uuid, primary key)
  - `cliente_id` (uuid, foreign key)
  - `placa` (text, unique) - License plate
  - `marca` (text) - Brand
  - `modelo` (text) - Model
  - `ano` (integer) - Year
  - `cor` (text) - Color
  - `created_at` (timestamptz)
  - `user_id` (uuid)

  ### 3. ordens_servico (Service Orders)
  - `id` (uuid, primary key)
  - `numero` (integer, auto-increment, unique) - OS number
  - `cliente_id` (uuid, foreign key)
  - `veiculo_id` (uuid, foreign key)
  - `status` (text) - aberta, em_andamento, aguardando_peca, concluida, entregue
  - `problema_relatado` (text) - Reported problem
  - `km` (integer) - Odometer reading
  - `combustivel` (integer) - Fuel level (0-100)
  - `valor_total` (decimal) - Total value
  - `previsao_entrega` (timestamptz) - Estimated delivery
  - `data_entrada` (timestamptz) - Entry date
  - `data_conclusao` (timestamptz, optional) - Completion date
  - `created_at` (timestamptz)
  - `updated_at` (timestamptz)
  - `user_id` (uuid)

  ### 4. os_checklist (Service Order Checklist)
  - `id` (uuid, primary key)
  - `os_id` (uuid, foreign key)
  - `item` (text) - Checklist item name
  - `checked` (boolean) - Item status
  - `ordem` (integer) - Display order
  - `created_at` (timestamptz)

  ### 5. os_itens (Service Order Items - Services and Parts)
  - `id` (uuid, primary key)
  - `os_id` (uuid, foreign key)
  - `tipo` (text) - servico or peca
  - `descricao` (text) - Description
  - `quantidade` (decimal) - Quantity
  - `valor_unitario` (decimal) - Unit price
  - `valor_total` (decimal) - Total price
  - `created_at` (timestamptz)

  ### 6. os_fotos (Service Order Photos)
  - `id` (uuid, primary key)
  - `os_id` (uuid, foreign key)
  - `tipo` (text) - antes, durante, depois
  - `url` (text) - Photo URL
  - `created_at` (timestamptz)

  ### 7. os_timeline (Service Order Timeline)
  - `id` (uuid, primary key)
  - `os_id` (uuid, foreign key)
  - `evento` (text) - Event description
  - `created_at` (timestamptz)
  - `user_id` (uuid)

  ## Security
  - RLS enabled on all tables
  - Policies restrict access to authenticated users' own data
  - Users can only see and modify their own workshop data
*/

-- Create tables

CREATE TABLE IF NOT EXISTS clientes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  nome text NOT NULL,
  telefone text NOT NULL,
  email text,
  cpf_cnpj text,
  endereco text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS veiculos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE CASCADE,
  placa text NOT NULL,
  marca text NOT NULL,
  modelo text NOT NULL,
  ano integer,
  cor text,
  created_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  UNIQUE(placa, user_id)
);

CREATE TABLE IF NOT EXISTS ordens_servico (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  numero serial UNIQUE,
  cliente_id uuid NOT NULL REFERENCES clientes(id) ON DELETE RESTRICT,
  veiculo_id uuid NOT NULL REFERENCES veiculos(id) ON DELETE RESTRICT,
  status text NOT NULL DEFAULT 'aberta' CHECK (status IN ('aberta', 'em_andamento', 'aguardando_peca', 'concluida', 'entregue')),
  problema_relatado text NOT NULL,
  km integer DEFAULT 0,
  combustivel integer DEFAULT 50 CHECK (combustivel >= 0 AND combustivel <= 100),
  valor_total decimal(10,2) DEFAULT 0,
  previsao_entrega timestamptz,
  data_entrada timestamptz DEFAULT now(),
  data_conclusao timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS os_checklist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  item text NOT NULL,
  checked boolean DEFAULT false,
  ordem integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_itens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('servico', 'peca')),
  descricao text NOT NULL,
  quantidade decimal(10,2) DEFAULT 1,
  valor_unitario decimal(10,2) DEFAULT 0,
  valor_total decimal(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_fotos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  tipo text NOT NULL CHECK (tipo IN ('antes', 'durante', 'depois')),
  url text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE IF NOT EXISTS os_timeline (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  os_id uuid NOT NULL REFERENCES ordens_servico(id) ON DELETE CASCADE,
  evento text NOT NULL,
  created_at timestamptz DEFAULT now(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for better performance

CREATE INDEX IF NOT EXISTS idx_veiculos_cliente ON veiculos(cliente_id);
CREATE INDEX IF NOT EXISTS idx_veiculos_placa ON veiculos(placa);
CREATE INDEX IF NOT EXISTS idx_os_cliente ON ordens_servico(cliente_id);
CREATE INDEX IF NOT EXISTS idx_os_veiculo ON ordens_servico(veiculo_id);
CREATE INDEX IF NOT EXISTS idx_os_status ON ordens_servico(status);
CREATE INDEX IF NOT EXISTS idx_os_numero ON ordens_servico(numero);
CREATE INDEX IF NOT EXISTS idx_os_checklist_os ON os_checklist(os_id);
CREATE INDEX IF NOT EXISTS idx_os_itens_os ON os_itens(os_id);
CREATE INDEX IF NOT EXISTS idx_os_fotos_os ON os_fotos(os_id);
CREATE INDEX IF NOT EXISTS idx_os_timeline_os ON os_timeline(os_id);

-- Enable Row Level Security

ALTER TABLE clientes ENABLE ROW LEVEL SECURITY;
ALTER TABLE veiculos ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordens_servico ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_checklist ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_itens ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_fotos ENABLE ROW LEVEL SECURITY;
ALTER TABLE os_timeline ENABLE ROW LEVEL SECURITY;

-- RLS Policies for clientes

CREATE POLICY "Users can view own clients"
  ON clientes FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own clients"
  ON clientes FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own clients"
  ON clientes FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own clients"
  ON clientes FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for veiculos

CREATE POLICY "Users can view own vehicles"
  ON veiculos FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own vehicles"
  ON veiculos FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own vehicles"
  ON veiculos FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own vehicles"
  ON veiculos FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for ordens_servico

CREATE POLICY "Users can view own service orders"
  ON ordens_servico FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own service orders"
  ON ordens_servico FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own service orders"
  ON ordens_servico FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own service orders"
  ON ordens_servico FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for os_checklist

CREATE POLICY "Users can view checklist of own service orders"
  ON os_checklist FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_checklist.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert checklist for own service orders"
  ON os_checklist FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_checklist.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can update checklist of own service orders"
  ON os_checklist FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_checklist.os_id 
    AND ordens_servico.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_checklist.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete checklist of own service orders"
  ON os_checklist FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_checklist.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

-- RLS Policies for os_itens

CREATE POLICY "Users can view items of own service orders"
  ON os_itens FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_itens.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert items for own service orders"
  ON os_itens FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_itens.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can update items of own service orders"
  ON os_itens FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_itens.os_id 
    AND ordens_servico.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_itens.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete items of own service orders"
  ON os_itens FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_itens.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

-- RLS Policies for os_fotos

CREATE POLICY "Users can view photos of own service orders"
  ON os_fotos FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_fotos.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert photos for own service orders"
  ON os_fotos FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_fotos.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can update photos of own service orders"
  ON os_fotos FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_fotos.os_id 
    AND ordens_servico.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_fotos.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete photos of own service orders"
  ON os_fotos FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_fotos.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

-- RLS Policies for os_timeline

CREATE POLICY "Users can view timeline of own service orders"
  ON os_timeline FOR SELECT
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_timeline.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can insert timeline for own service orders"
  ON os_timeline FOR INSERT
  TO authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_timeline.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can update timeline of own service orders"
  ON os_timeline FOR UPDATE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_timeline.os_id 
    AND ordens_servico.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_timeline.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));

CREATE POLICY "Users can delete timeline of own service orders"
  ON os_timeline FOR DELETE
  TO authenticated
  USING (EXISTS (
    SELECT 1 FROM ordens_servico 
    WHERE ordens_servico.id = os_timeline.os_id 
    AND ordens_servico.user_id = auth.uid()
  ));