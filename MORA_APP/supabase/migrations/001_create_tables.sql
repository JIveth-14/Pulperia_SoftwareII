-- TAREA 5: Schema de BD + Migraciones
-- Crear todas las tablas para Mora App

-- Extensión para UUID
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- 1. TABLA: users (profiles)
-- ============================================
CREATE TABLE public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT CHECK (role IN ('admin', 'cobrador', 'cliente')) DEFAULT 'cliente',
  avatar_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.users IS 'Perfiles de usuarios (Admin, Cobrador, Cliente)';
COMMENT ON COLUMN public.users.role IS 'Rol del usuario: admin (gerente), cobrador, cliente (deudor)';

-- ============================================
-- 2. TABLA: customers (deudores)
-- ============================================
CREATE TABLE public.customers (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT UNIQUE,
  phone TEXT NOT NULL,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  id_type VARCHAR(20),
  id_number VARCHAR(50) UNIQUE,
  total_debt DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('active', 'inactive', 'paid')) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.customers IS 'Clientes/deudores de Mora App';
COMMENT ON COLUMN public.customers.total_debt IS 'Suma de todas las deudas pendientes';

-- ============================================
-- 3. TABLA: credits
-- ============================================
CREATE TABLE public.credits (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  customer_id BIGINT NOT NULL REFERENCES public.customers(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  amount DECIMAL(10,2) NOT NULL,
  interest_rate DECIMAL(5,2) DEFAULT 0,
  remaining_balance DECIMAL(10,2),
  total_paid DECIMAL(10,2) DEFAULT 0,
  status VARCHAR(20) CHECK (status IN ('active', 'pending', 'completed', 'defaulted')) DEFAULT 'active',
  due_date DATE,
  start_date DATE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.credits IS 'Créditos otorgados a clientes';
COMMENT ON COLUMN public.credits.remaining_balance IS 'Saldo pendiente = amount + interest - total_paid';

-- ============================================
-- 4. TABLA: payments
-- ============================================
CREATE TABLE public.payments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  credit_id BIGINT NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_method VARCHAR(50) CHECK (payment_method IN ('cash', 'transfer', 'card', 'check')),
  payment_date DATE DEFAULT NOW(),
  recorded_by UUID NOT NULL REFERENCES public.users(id) ON DELETE RESTRICT,
  receipt_number VARCHAR(100),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.payments IS 'Pagos registrados para cada crédito';

-- ============================================
-- 5. TABLA: assignments (cobrador asignado)
-- ============================================
CREATE TABLE public.assignments (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  credit_id BIGINT NOT NULL REFERENCES public.credits(id) ON DELETE CASCADE,
  cobrador_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  assigned_date DATE DEFAULT NOW(),
  status VARCHAR(20) CHECK (status IN ('active', 'completed', 'failed')) DEFAULT 'active',
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.assignments IS 'Asignación de créditos a cobradores';

-- ============================================
-- 6. TABLA: audit_log
-- ============================================
CREATE TABLE public.audit_log (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID REFERENCES public.users(id),
  action TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  old_values JSONB,
  new_values JSONB,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE public.audit_log IS 'Log de auditoría de cambios en BD';

-- ============================================
-- ÍNDICES
-- ============================================

CREATE INDEX idx_users_email ON public.users(email);
CREATE INDEX idx_users_role ON public.users(role);

CREATE INDEX idx_customers_user_id ON public.customers(user_id);
CREATE INDEX idx_customers_phone ON public.customers(phone);
CREATE INDEX idx_customers_email ON public.customers(email);
CREATE INDEX idx_customers_id_number ON public.customers(id_number);
CREATE INDEX idx_customers_status ON public.customers(status);

CREATE INDEX idx_credits_customer_id ON public.credits(customer_id);
CREATE INDEX idx_credits_created_by ON public.credits(created_by);
CREATE INDEX idx_credits_status ON public.credits(status);
CREATE INDEX idx_credits_due_date ON public.credits(due_date);
CREATE INDEX idx_credits_created_at ON public.credits(created_at);

CREATE INDEX idx_payments_credit_id ON public.payments(credit_id);
CREATE INDEX idx_payments_recorded_by ON public.payments(recorded_by);
CREATE INDEX idx_payments_payment_date ON public.payments(payment_date);
CREATE INDEX idx_payments_created_at ON public.payments(created_at);

CREATE INDEX idx_assignments_credit_id ON public.assignments(credit_id);
CREATE INDEX idx_assignments_cobrador_id ON public.assignments(cobrador_id);
CREATE INDEX idx_assignments_status ON public.assignments(status);

CREATE INDEX idx_audit_log_user_id ON public.audit_log(user_id);
CREATE INDEX idx_audit_log_table_name ON public.audit_log(table_name);
CREATE INDEX idx_audit_log_created_at ON public.audit_log(created_at);

-- ============================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_log ENABLE ROW LEVEL SECURITY;

-- Policies para USERS
CREATE POLICY "Users see own profile"
  ON public.users FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "Admins see all users"
  ON public.users FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para CUSTOMERS
CREATE POLICY "Clientes ven su propio perfil"
  ON public.customers FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Cobradores ven clientes asignados"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE assignments.credit_id IN (
        SELECT id FROM public.credits WHERE customer_id = customers.id
      )
      AND assignments.cobrador_id = auth.uid()
    )
  );

CREATE POLICY "Admins ven todos los clientes"
  ON public.customers FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para CREDITS
CREATE POLICY "Clientes ven sus créditos"
  ON public.credits FOR SELECT
  USING (
    customer_id IN (
      SELECT id FROM public.customers WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Cobradores ven créditos asignados"
  ON public.credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE credit_id = credits.id
      AND cobrador_id = auth.uid()
    )
  );

CREATE POLICY "Admins ven todos los créditos"
  ON public.credits FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Solo admins crean créditos"
  ON public.credits FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Policies para PAYMENTS
CREATE POLICY "Cobradores registran pagos de sus créditos"
  ON public.payments FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assignments
      WHERE credit_id = payments.credit_id
      AND cobrador_id = auth.uid()
    )
  );

-- ============================================
-- FUNCIONES Y TRIGGERS
-- ============================================

-- Actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_customers_updated_at
  BEFORE UPDATE ON public.customers
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_credits_updated_at
  BEFORE UPDATE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Función: Actualizar remaining_balance en credits
CREATE OR REPLACE FUNCTION update_credit_balance()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.credits
  SET remaining_balance = (amount + (amount * interest_rate / 100)) - total_paid
  WHERE id = NEW.credit_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_balance_after_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_credit_balance();

-- Función: Audit log para cambios
CREATE OR REPLACE FUNCTION audit_log_changes()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.audit_log (user_id, action, table_name, record_id, old_values, new_values)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME,
    NEW.id::TEXT,
    row_to_json(OLD),
    row_to_json(NEW)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_credits_changes
  AFTER INSERT OR UPDATE OR DELETE ON public.credits
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

CREATE TRIGGER audit_payments_changes
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_changes();

-- ============================================
-- DATOS INICIALES (Opcionales)
-- ============================================

-- Crear usuario admin de prueba (requiere hacer en UI de Supabase)
-- INSERT INTO public.users (id, email, full_name, role)
-- VALUES (uuid_generate_v4(), 'admin@mora.app', 'Admin', 'admin');
