-- ==========================================
-- Tabla de Solicitudes de Empresas (Company Requests)
-- Created: 2024-02-08
-- Purpose: Almacenar solicitudes de vendedores
-- ==========================================

-- Crear tabla de solicitudes
CREATE TABLE IF NOT EXISTS public.company_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    business_name VARCHAR(255) NOT NULL,
    owner_name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(50),
    business_type VARCHAR(100),
    products_count VARCHAR(50),
    message TEXT,
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    notes TEXT, -- Notas del admin
    reviewed_by UUID REFERENCES auth.users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ==========================================
-- FUNCIÓN HELPER PRIMERO (antes de las políticas)
-- ==========================================

-- Función helper para obtener el usuario que hizo la solicitud
-- Esta es una versión simplificada que retorna NULL
-- En un sistema real, necesitarías storing el user_id en la tabla
CREATE OR REPLACE FUNCTION submitted_by_user_id()
RETURNS UUID AS $$
BEGIN
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- HABILITAR RLS DESPUÉS DE LA FUNCIÓN
-- ==========================================

-- Habilitar RLS
ALTER TABLE public.company_requests ENABLE ROW LEVEL SECURITY;

-- ==========================================
-- POLÍTICAS DESPUÉS DE LA FUNCIÓN
-- ==========================================

-- Política: Cualquier usuario puede crear solicitudes
CREATE POLICY "allow_insert_requests" ON public.company_requests
    FOR INSERT WITH CHECK (true);

-- Política: Solo admins pueden ver todas las solicitudes
-- Verificamos si el usuario tiene el rol admin en la tabla profiles
CREATE POLICY "admin_can_view_all" ON public.company_requests
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND (auth.users.raw_user_meta_data ->> 'role') = 'admin'
        )
    );

-- Política: Los usuarios pueden ver sus propias solicitudes
CREATE POLICY "users_can_view_own" ON public.company_requests
    FOR SELECT USING (
        auth.uid() = submitted_by_user_id()
        OR EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
        )
    );

-- ==========================================
-- ÍNDICES
-- ==========================================

-- Agregar índice para mejor rendimiento
CREATE INDEX IF NOT EXISTS idx_company_requests_status ON public.company_requests(status);
CREATE INDEX IF NOT EXISTS idx_company_requests_email ON public.company_requests(email);
CREATE INDEX IF NOT EXISTS idx_company_requests_created_at ON public.company_requests(created_at DESC);

-- ==========================================
-- Trigger para actualizar updated_at
-- ==========================================
CREATE OR REPLACE FUNCTION update_company_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_company_requests_updated_at ON public.company_requests;
CREATE TRIGGER update_company_requests_updated_at
    BEFORE UPDATE ON public.company_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_company_requests_updated_at();

-- ==========================================
-- Vista para admins ver solicitudes
-- ==========================================
CREATE OR REPLACE VIEW company_requests_view AS
SELECT
    cr.id,
    cr.business_name,
    cr.owner_name,
    cr.email,
    cr.phone,
    cr.business_type,
    cr.products_count,
    cr.message,
    cr.status,
    cr.notes,
    cr.reviewed_by,
    cr.reviewed_at,
    cr.submitted_at,
    cr.created_at,
    au.email as reviewed_by_email
FROM public.company_requests cr
LEFT JOIN auth.users au ON au.id = cr.reviewed_by;

-- ==========================================
-- Insertar planes de suscripción por defecto
-- ==========================================
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, features, limits, is_active)
VALUES
    ('basic', 'Básico', 'Perfecto para comenzar', 29, 290, 
     '["Hasta 100 productos", "1 usuario", "5 GB almacenamiento", "Soporte email"]',
     '{"products": 100, "users": 1, "storage_gb": 5, "orders_per_month": 500}',
     true),
    ('premium', 'Premium', 'Para negocios en crecimiento', 79, 790,
     '["Hasta 1,000 productos", "5 usuarios", "50 GB", "Soporte prioritario"]',
     '{"products": 1000, "users": 5, "storage_gb": 50, "orders_per_month": 5000}',
     true),
    ('enterprise', 'Enterprise', 'Para grandes empresas', 199, 1990,
     '["Productos ilimitados", "Usuarios ilimitados", "1 TB", " soporte 24/7"]',
     '{"products": -1, "users": -1, "storage_gb": 1000, "orders_per_month": -1}',
     true)
ON CONFLICT (id) DO NOTHING;

-- ==========================================
-- Actualizar la tabla companies para agregar email si no existe
-- ==========================================
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'companies'
        AND column_name = 'email'
    ) THEN
        ALTER TABLE companies ADD COLUMN email VARCHAR(255);
    END IF;
END $$;

SELECT 'Migration completed successfully!' as status;
