-- =============================
-- BASE DE DATOS COMPLETA UNIFICADA
-- Sistema de Crédito de Vivienda - Método Francés Vencido Ordinario
-- Nuevo Crédito Mivivienda y Techo Propio
-- =============================
-- Este archivo unifica toda la estructura de la base de datos
-- Puede ejecutarse múltiples veces sin errores (idempotente)
-- Ejecutar en el SQL Editor de Supabase (proyecto nuevo o existente)
-- =============================

-- =============================
-- Extensiones necesarias
-- =============================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================
-- Tablas base
-- =============================

-- Perfiles de usuario (extiende auth.users)
CREATE TABLE IF NOT EXISTS public.users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Clientes
CREATE TABLE IF NOT EXISTS public.clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  dni TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  monthly_income DECIMAL(12,2) NOT NULL,
  occupation TEXT,
  marital_status TEXT,
  address TEXT,
  department TEXT,
  province TEXT,
  district TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, dni)
);

-- Propiedades
CREATE TABLE IF NOT EXISTS public.properties (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  location TEXT NOT NULL,
  price_from DECIMAL(12,2) NOT NULL,
  area_from DECIMAL(8,2) NOT NULL,
  image TEXT,
  description TEXT,
  bedrooms INTEGER,
  bathrooms INTEGER,
  area DECIMAL(8,2),
  price DECIMAL(12,2),
  project_id TEXT,
  status TEXT DEFAULT 'available' CHECK (status IN ('available', 'sold', 'reserved')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Simulaciones (resultados resumen)
CREATE TABLE IF NOT EXISTS public.simulations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  client_id UUID REFERENCES public.clients(id) ON DELETE SET NULL,
  property_id UUID REFERENCES public.properties(id) ON DELETE SET NULL,
  -- Relación con Entidad Financiera
  entity_id UUID REFERENCES public.financial_entities(id) ON DELETE SET NULL,
  -- Estado de la Simulación
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
  -- Configuración del préstamo
  property_price DECIMAL(12,2) NOT NULL,
  down_payment DECIMAL(5,2) NOT NULL,
  loan_amount DECIMAL(12,2) NOT NULL,
  term_years INTEGER NOT NULL,
  currency TEXT NOT NULL CHECK (currency IN ('PEN','USD')),
  rate_type TEXT NOT NULL CHECK (rate_type IN ('effective','nominal')),
  interest_rate DECIMAL(5,2) NOT NULL,
  capitalization TEXT CHECK (capitalization IN ('monthly','bimonthly','quarterly','semiannual','annual')),
  grace_applies BOOLEAN DEFAULT FALSE,
  grace_type TEXT CHECK (grace_type IN ('total','partial')),
  grace_months INTEGER,
  bonus_applies BOOLEAN DEFAULT FALSE,
  bonus_type TEXT CHECK (bonus_type IN ('bbp', 'bfh', NULL)),
  bonus_amount DECIMAL(12,2),
  bfh_modalidad TEXT CHECK (bfh_modalidad IN ('compra', 'construccion', 'mejoramiento', NULL)),
  is_sustainable_housing BOOLEAN DEFAULT FALSE, -- Vivienda Sostenible (aumenta bonos BBP)
  -- Costos y tasa de descuento
  discount_rate_annual DECIMAL(6,4),
  extra_monthly_costs DECIMAL(12,2),
  -- Seguros Específicos
  insurance_life_rate DECIMAL(6,4), -- Tasa de seguro de desgravamen (mensual)
  insurance_life_amount DECIMAL(12,2), -- Monto mensual de seguro de desgravamen
  insurance_property_rate DECIMAL(6,4), -- Tasa de seguro de inmueble (anual)
  insurance_property_amount DECIMAL(12,2), -- Monto mensual de seguro de inmueble
  commission_evaluation DECIMAL(12,2), -- Comisión de evaluación (única)
  commission_disbursement DECIMAL(12,2), -- Comisión de desembolso (única)
  administrative_fees DECIMAL(12,2), -- Gastos administrativos mensuales
  -- Resultados principales
  monthly_payment DECIMAL(12,2) NOT NULL,
  tcea DECIMAL(6,4) NOT NULL,
  trea DECIMAL(6,4) NOT NULL,
  total_amount DECIMAL(12,2) NOT NULL,
  total_interest DECIMAL(12,2) NOT NULL,
  van DECIMAL(12,2) NOT NULL,
  tir DECIMAL(6,4) NOT NULL,
  duration DECIMAL(8,4) NOT NULL,
  modified_duration DECIMAL(8,4) NOT NULL,
  convexity DECIMAL(10,4) NOT NULL,
  amortization_table JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Filas de amortización (cronograma mes a mes)
CREATE TABLE IF NOT EXISTS public.amortization_rows (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  period INTEGER NOT NULL,
  date DATE,
  initial_balance DECIMAL(12,2) NOT NULL,
  interest DECIMAL(12,2) NOT NULL,
  payment DECIMAL(12,2) NOT NULL,
  amortization DECIMAL(12,2) NOT NULL,
  final_balance DECIMAL(12,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(simulation_id, period)
);

-- Cargos / Costos adicionales
CREATE TABLE IF NOT EXISTS public.charges (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  simulation_id UUID REFERENCES public.simulations(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  charge_type TEXT NOT NULL CHECK (charge_type IN ('monthly','upfront')),
  periodicity TEXT CHECK (periodicity IN ('monthly','annual','one_time')),
  amount DECIMAL(12,2) NOT NULL,
  start_month INTEGER,
  end_month INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Entidades financieras (bancos, cajas, etc.)
CREATE TABLE IF NOT EXISTS public.financial_entities (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name TEXT,
  country TEXT DEFAULT 'PE',
  active BOOLEAN DEFAULT TRUE,
  -- Parámetros generales
  allowed_rate_types TEXT[] DEFAULT ARRAY['effective','nominal'],
  allowed_capitalizations TEXT[] DEFAULT ARRAY['monthly','bimonthly','quarterly','semiannual','annual'],
  min_down_payment DECIMAL(5,2),
  min_term_years INTEGER,
  max_term_years INTEGER,
  grace_allowed BOOLEAN DEFAULT TRUE,
  grace_max_months INTEGER,
  base_interest_rate DECIMAL(5,2),
  -- Valores por defecto de seguros y comisiones
  default_insurance_life_rate DECIMAL(6,4), -- Tasa mensual de seguro de desgravamen por defecto
  default_insurance_property_rate DECIMAL(6,4), -- Tasa anual de seguro de inmueble por defecto
  default_commission_evaluation DECIMAL(12,2), -- Comisión de evaluación por defecto
  default_commission_disbursement DECIMAL(12,2), -- Comisión de desembolso por defecto
  default_administrative_fees DECIMAL(12,2), -- Gastos administrativos mensuales por defecto
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Configuración del sistema (una o pocas filas)
CREATE TABLE IF NOT EXISTS public.system_config (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  default_currency TEXT CHECK (default_currency IN ('PEN','USD')),
  default_interest_rate DECIMAL(5,2),
  default_term_years INTEGER,
  default_down_payment DECIMAL(5,2),
  enable_grace_period BOOLEAN,
  enable_state_bonus BOOLEAN,
  default_discount_rate_annual DECIMAL(6,4),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Bitácora de operaciones
CREATE TABLE IF NOT EXISTS public.operations_log (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  action TEXT NOT NULL, -- p.ej. 'CREATE','UPDATE','DELETE','SIMULATE'
  entity TEXT NOT NULL, -- p.ej. 'client','property','simulation','charge'
  entity_id UUID,
  details JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================
-- Índices
-- =============================
CREATE INDEX IF NOT EXISTS idx_clients_user_id ON public.clients(user_id);
CREATE INDEX IF NOT EXISTS idx_clients_dni ON public.clients(user_id, dni);
CREATE INDEX IF NOT EXISTS idx_clients_email ON public.clients(email);

CREATE INDEX IF NOT EXISTS idx_properties_user_id ON public.properties(user_id);
CREATE INDEX IF NOT EXISTS idx_properties_status ON public.properties(status);

CREATE INDEX IF NOT EXISTS idx_simulations_user_id ON public.simulations(user_id);
CREATE INDEX IF NOT EXISTS idx_simulations_client_id ON public.simulations(client_id);
CREATE INDEX IF NOT EXISTS idx_simulations_property_id ON public.simulations(property_id);
CREATE INDEX IF NOT EXISTS idx_simulations_created_at ON public.simulations(created_at);
CREATE INDEX IF NOT EXISTS idx_simulations_entity_id ON public.simulations(entity_id);
CREATE INDEX IF NOT EXISTS idx_simulations_status ON public.simulations(status);

CREATE INDEX IF NOT EXISTS idx_amortization_rows_simulation_id ON public.amortization_rows(simulation_id);
CREATE INDEX IF NOT EXISTS idx_charges_simulation_id ON public.charges(simulation_id);

CREATE INDEX IF NOT EXISTS idx_operations_log_user_id ON public.operations_log(user_id);

-- =============================
-- Row Level Security (RLS)
-- =============================
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.simulations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.amortization_rows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.charges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.financial_entities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.operations_log ENABLE ROW LEVEL SECURITY;

-- Helper: verificar si el usuario es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================
-- Políticas RLS (con manejo seguro de duplicados)
-- =============================

-- Políticas users
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own profile" ON public.users;
  CREATE POLICY "Users can view their own profile" ON public.users
    FOR SELECT USING (auth.uid() = id OR is_admin());

  DROP POLICY IF EXISTS "Users can insert their own profile" ON public.users;
  CREATE POLICY "Users can insert their own profile" ON public.users
    FOR INSERT WITH CHECK (auth.uid() = id OR is_admin());

  DROP POLICY IF EXISTS "Users can update their own profile" ON public.users;
  CREATE POLICY "Users can update their own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id OR is_admin());

  DROP POLICY IF EXISTS "Admins can delete any user" ON public.users;
  CREATE POLICY "Admins can delete any user" ON public.users
    FOR DELETE USING (is_admin());
END $$;

-- Políticas clients
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own clients" ON public.clients;
  CREATE POLICY "Users can view their own clients" ON public.clients
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

  DROP POLICY IF EXISTS "Users can insert their own clients" ON public.clients;
  CREATE POLICY "Users can insert their own clients" ON public.clients
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own clients" ON public.clients;
  CREATE POLICY "Users can update their own clients" ON public.clients
    FOR UPDATE USING (auth.uid() = user_id OR is_admin());

  DROP POLICY IF EXISTS "Users can delete their own clients" ON public.clients;
  CREATE POLICY "Users can delete their own clients" ON public.clients
    FOR DELETE USING (auth.uid() = user_id OR is_admin());
END $$;

-- Políticas properties
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view all properties" ON public.properties;
  CREATE POLICY "Users can view all properties" ON public.properties
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Users can insert their own properties" ON public.properties;
  CREATE POLICY "Users can insert their own properties" ON public.properties
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own properties" ON public.properties;
  CREATE POLICY "Users can update their own properties" ON public.properties
    FOR UPDATE USING (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can delete their own properties" ON public.properties;
  CREATE POLICY "Users can delete their own properties" ON public.properties
    FOR DELETE USING (auth.uid() = user_id);
END $$;

-- Políticas simulations
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view their own simulations" ON public.simulations;
  CREATE POLICY "Users can view their own simulations" ON public.simulations
    FOR SELECT USING (auth.uid() = user_id OR is_admin());

  DROP POLICY IF EXISTS "Users can insert their own simulations" ON public.simulations;
  CREATE POLICY "Users can insert their own simulations" ON public.simulations
    FOR INSERT WITH CHECK (auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can update their own simulations" ON public.simulations;
  CREATE POLICY "Users can update their own simulations" ON public.simulations
    FOR UPDATE USING (auth.uid() = user_id OR is_admin());

  DROP POLICY IF EXISTS "Users can delete their own simulations" ON public.simulations;
  CREATE POLICY "Users can delete their own simulations" ON public.simulations
    FOR DELETE USING (auth.uid() = user_id OR is_admin());
END $$;

-- Políticas amortization_rows
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view amortization rows of their simulations" ON public.amortization_rows;
  CREATE POLICY "Users can view amortization rows of their simulations" ON public.amortization_rows
    FOR SELECT USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can manage amortization rows of their simulations" ON public.amortization_rows;
  CREATE POLICY "Users can manage amortization rows of their simulations" ON public.amortization_rows
    FOR INSERT WITH CHECK (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can update amortization rows of their simulations" ON public.amortization_rows;
  CREATE POLICY "Users can update amortization rows of their simulations" ON public.amortization_rows
    FOR UPDATE USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can delete amortization rows of their simulations" ON public.amortization_rows;
  CREATE POLICY "Users can delete amortization rows of their simulations" ON public.amortization_rows
    FOR DELETE USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );
END $$;

-- Políticas charges
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view charges of their simulations" ON public.charges;
  CREATE POLICY "Users can view charges of their simulations" ON public.charges
    FOR SELECT USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can manage charges of their simulations" ON public.charges;
  CREATE POLICY "Users can manage charges of their simulations" ON public.charges
    FOR INSERT WITH CHECK (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can update charges of their simulations" ON public.charges;
  CREATE POLICY "Users can update charges of their simulations" ON public.charges
    FOR UPDATE USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );

  DROP POLICY IF EXISTS "Users can delete charges of their simulations" ON public.charges;
  CREATE POLICY "Users can delete charges of their simulations" ON public.charges
    FOR DELETE USING (
      is_admin() OR
      auth.uid() = (
        SELECT s.user_id FROM public.simulations s WHERE s.id = simulation_id
      )
    );
END $$;

-- Políticas financial_entities
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view financial entities" ON public.financial_entities;
  CREATE POLICY "Anyone can view financial entities" ON public.financial_entities
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Admins manage financial entities" ON public.financial_entities;
  CREATE POLICY "Admins manage financial entities" ON public.financial_entities
    FOR INSERT WITH CHECK (is_admin());

  DROP POLICY IF EXISTS "Admins update financial entities" ON public.financial_entities;
  CREATE POLICY "Admins update financial entities" ON public.financial_entities
    FOR UPDATE USING (is_admin());

  DROP POLICY IF EXISTS "Admins delete financial entities" ON public.financial_entities;
  CREATE POLICY "Admins delete financial entities" ON public.financial_entities
    FOR DELETE USING (is_admin());
END $$;

-- Políticas system_config
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Anyone can view system config" ON public.system_config;
  CREATE POLICY "Anyone can view system config" ON public.system_config
    FOR SELECT USING (true);

  DROP POLICY IF EXISTS "Admins manage system config" ON public.system_config;
  CREATE POLICY "Admins manage system config" ON public.system_config
    FOR INSERT WITH CHECK (is_admin());

  DROP POLICY IF EXISTS "Admins update system config" ON public.system_config;
  CREATE POLICY "Admins update system config" ON public.system_config
    FOR UPDATE USING (is_admin());

  DROP POLICY IF EXISTS "Admins delete system config" ON public.system_config;
  CREATE POLICY "Admins delete system config" ON public.system_config
    FOR DELETE USING (is_admin());
END $$;

-- Políticas operations_log
DO $$ 
BEGIN
  DROP POLICY IF EXISTS "Users can view own operations" ON public.operations_log;
  CREATE POLICY "Users can view own operations" ON public.operations_log
    FOR SELECT USING (is_admin() OR auth.uid() = user_id);

  DROP POLICY IF EXISTS "Users can insert operations" ON public.operations_log;
  CREATE POLICY "Users can insert operations" ON public.operations_log
    FOR INSERT WITH CHECK (auth.uid() = user_id OR is_admin());
END $$;

-- =============================
-- Triggers y funciones
-- =============================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers updated_at
DROP TRIGGER IF EXISTS update_users_updated_at ON public.users;
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_clients_updated_at ON public.clients;
CREATE TRIGGER update_clients_updated_at
  BEFORE UPDATE ON public.clients
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_properties_updated_at ON public.properties;
CREATE TRIGGER update_properties_updated_at
  BEFORE UPDATE ON public.properties
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_simulations_updated_at ON public.simulations;
CREATE TRIGGER update_simulations_updated_at
  BEFORE UPDATE ON public.simulations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_amortization_rows_updated_at ON public.amortization_rows;
CREATE TRIGGER update_amortization_rows_updated_at
  BEFORE UPDATE ON public.amortization_rows
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_charges_updated_at ON public.charges;
CREATE TRIGGER update_charges_updated_at
  BEFORE UPDATE ON public.charges
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_financial_entities_updated_at ON public.financial_entities;
CREATE TRIGGER update_financial_entities_updated_at
  BEFORE UPDATE ON public.financial_entities
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_system_config_updated_at ON public.system_config;
CREATE TRIGGER update_system_config_updated_at
  BEFORE UPDATE ON public.system_config
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Crear perfil automático cuando se crea usuario en auth.users
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NULL),
    'user'
  ) ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Función para calcular capacidad de pago
CREATE OR REPLACE FUNCTION public.calculate_payment_capacity(
  monthly_income DECIMAL,
  existing_debts DECIMAL DEFAULT 0,
  max_debt_ratio DECIMAL DEFAULT 40.0
)
RETURNS DECIMAL AS $$
BEGIN
  -- Capacidad = (Ingreso mensual - Deudas existentes) * (Ratio máximo / 100)
  RETURN (monthly_income - existing_debts) * (max_debt_ratio / 100.0);
END;
$$ LANGUAGE plpgsql;

-- =============================
-- Comentarios
-- =============================
COMMENT ON TABLE public.clients IS 'Clientes del sistema (propietario: usuario).';
COMMENT ON TABLE public.properties IS 'Propiedades disponibles para crédito vivienda.';
COMMENT ON TABLE public.simulations IS 'Resultados de simulaciones de crédito (resumen).';
COMMENT ON COLUMN public.simulations.entity_id IS 'Entidad financiera asociada a esta simulación';
COMMENT ON COLUMN public.simulations.status IS 'Estado de la simulación: draft (borrador), pending (pendiente), approved (aprobada), rejected (rechazada), active (activa), completed (completada), cancelled (cancelada)';
COMMENT ON COLUMN public.simulations.insurance_life_rate IS 'Tasa mensual de seguro de desgravamen (ej: 0.0015 = 0.15%)';
COMMENT ON COLUMN public.simulations.insurance_life_amount IS 'Monto mensual calculado de seguro de desgravamen';
COMMENT ON COLUMN public.simulations.insurance_property_rate IS 'Tasa anual de seguro de inmueble (ej: 0.0025 = 0.25%)';
COMMENT ON COLUMN public.simulations.insurance_property_amount IS 'Monto mensual calculado de seguro de inmueble';
COMMENT ON COLUMN public.simulations.commission_evaluation IS 'Comisión de evaluación crediticia (pago único)';
COMMENT ON COLUMN public.simulations.commission_disbursement IS 'Comisión de desembolso (pago único)';
COMMENT ON COLUMN public.simulations.administrative_fees IS 'Gastos administrativos mensuales (portes, etc.)';
COMMENT ON COLUMN public.simulations.discount_rate_annual IS 'Tasa de descuento anual para cálculos de VAN y otros indicadores financieros';
COMMENT ON COLUMN public.simulations.extra_monthly_costs IS 'Costos mensuales adicionales del cliente (no incluye seguros ni comisiones)';
COMMENT ON TABLE public.amortization_rows IS 'Cronograma de pagos mensual por simulación.';
COMMENT ON TABLE public.charges IS 'Cargos y costos adicionales vinculados a una simulación.';
COMMENT ON TABLE public.financial_entities IS 'Entidades financieras con parámetros aplicables.';
COMMENT ON COLUMN public.financial_entities.default_insurance_life_rate IS 'Tasa mensual de seguro de desgravamen por defecto para esta entidad';
COMMENT ON COLUMN public.financial_entities.default_insurance_property_rate IS 'Tasa anual de seguro de inmueble por defecto para esta entidad';
COMMENT ON COLUMN public.financial_entities.default_commission_evaluation IS 'Comisión de evaluación por defecto para esta entidad';
COMMENT ON COLUMN public.financial_entities.default_commission_disbursement IS 'Comisión de desembolso por defecto para esta entidad';
COMMENT ON COLUMN public.financial_entities.default_administrative_fees IS 'Gastos administrativos mensuales por defecto para esta entidad';
COMMENT ON COLUMN public.simulations.bonus_type IS 'Tipo de bono aplicado: bbp (Bono del Buen Pagador) o bfh (Bono Familiar Habitacional)';
COMMENT ON COLUMN public.simulations.bfh_modalidad IS 'Modalidad del Bono Familiar Habitacional: compra, construccion o mejoramiento';
COMMENT ON COLUMN public.simulations.is_sustainable_housing IS 'Indica si es Vivienda Sostenible (aumenta los bonos BBP según normas del Nuevo Crédito Mivivienda)';
COMMENT ON TABLE public.system_config IS 'Parámetros globales del sistema.';
COMMENT ON TABLE public.operations_log IS 'Bitácora de operaciones del sistema.';
COMMENT ON FUNCTION public.calculate_payment_capacity IS 'Calcula la capacidad de pago mensual basada en ingresos y ratio de deuda máximo';

-- =============================
-- FIN DE LA BASE DE DATOS
-- =============================
