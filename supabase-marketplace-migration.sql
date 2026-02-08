-- ==========================================
-- E-Commerce Marketplace Migration
-- Adding marketplace columns to existing tables
-- ==========================================

-- 1. AÑADIR COLUMNAS A companies
-- ==========================================
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS email VARCHAR(255) UNIQUE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS plan VARCHAR(50) DEFAULT 'basic' CHECK (plan IS NULL OR plan IN ('basic', 'premium', 'enterprise'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending' CHECK (status IS NULL OR status IN ('pending', 'approved', 'rejected', 'suspended', 'active'));
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS tax_id VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS business_type VARCHAR(100);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS fiscal_address JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS headquarters_address JSONB;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS cover_image_url TEXT;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS short_description VARCHAR(500);
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS social_links JSONB DEFAULT '{"facebook": null, "instagram": null, "twitter": null, "tiktok": null, "youtube": null}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS settings JSONB DEFAULT '{"timezone": "America/Havana", "currency": "USD", "language": "es", "auto_fulfill_orders": false, "low_stock_threshold": 10, "email_notifications": true, "order_notifications": true, "low_stock_alerts": true}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS approved_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS approved_by UUID REFERENCES auth.users(id);

-- 2. CREAR TABLA company_users
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role VARCHAR(100) NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive', 'removed')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hired_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_users_company ON public.company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user ON public.company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON public.company_users(status);

-- 3. CREAR TABLA subscriptions
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete')),
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    limits JSONB DEFAULT '{"products": 100, "users": 1, "storage_gb": 5, "orders_per_month": 500}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON public.subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON public.subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON public.subscriptions(stripe_customer_id);

-- 4. CREAR TABLA company_invitations
-- ==========================================
CREATE TABLE IF NOT EXISTS public.company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES public.companies(id) ON DELETE CASCADE NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    role VARCHAR(100) DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
    personal_message TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_company_invitations_company ON public.company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON public.company_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON public.company_invitations(invitation_token);

-- 5. CREAR TABLA subscription_plans
-- ==========================================
CREATE TABLE IF NOT EXISTS public.subscription_plans (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price_monthly DECIMAL(10, 2) NOT NULL,
    price_yearly DECIMAL(10, 2) NOT NULL,
    features JSONB NOT NULL,
    limits JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar planes por defecto
INSERT INTO public.subscription_plans (id, name, description, price_monthly, price_yearly, features, limits) VALUES
('basic', 'Básico', 'Perfecto para comenzar a vender', 29.00, 290.00,
 '[
    "Hasta 100 productos",
    "1 usuario administrador",
    "5 GB almacenamiento",
    "Soporte por email",
    "Reportes básicos",
    "Integración con Stripe"
 ]'::jsonb,
 '{"products": 100, "users": 1, "storage_gb": 5, "orders_per_month": 500}'::jsonb
),
('premium', 'Premium', 'Para empresas en crecimiento', 79.00, 790.00,
 '[
    "Hasta 1,000 productos",
    "5 usuarios",
    "50 GB almacenamiento",
    "Soporte prioritario",
    "Reportes avanzados",
    "API access",
    "White-label",
    "Análisis de ventas"
 ]'::jsonb,
 '{"products": 1000, "users": 5, "storage_gb": 50, "orders_per_month": 5000}'::jsonb
),
('enterprise', 'Enterprise', 'Para grandes empresas', 199.00, 1990.00,
 '[
    "Productos ilimitados",
    "Usuarios ilimitados",
    "1 TB almacenamiento",
    "Soporte 24/7",
    "Reportes personalizados",
    "API access completo",
    "White-label completo",
    "Análisis avanzado",
    "Account manager dedicado",
    "SLA garantizado"
 ]'::jsonb,
 '{"products": -1, "users": -1, "storage_gb": 1000, "orders_per_month": -1}'::jsonb
) ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    price_monthly = EXCLUDED.price_monthly,
    price_yearly = EXCLUDED.price_yearly,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits;

-- 6. ACTUALIZAR products PARA companies
-- ==========================================
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IS NULL OR status IN ('draft', 'active', 'inactive', 'archived'));

CREATE INDEX IF NOT EXISTS idx_products_company ON public.products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON public.products(status);

-- 7. HABILITAR RLS
-- ==========================================
ALTER TABLE public.company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscription_plans ENABLE ROW LEVEL SECURITY;

-- Policies para company_users
CREATE POLICY "Miembros pueden ver otros miembros" ON public.company_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
        )
    );

CREATE POLICY "Miembros pueden ver su propio registro" ON public.company_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin pueden crear miembros" ON public.company_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

CREATE POLICY "Admin pueden actualizar miembros" ON public.company_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

-- Policies para subscriptions
CREATE POLICY "Miembros pueden ver suscripción" ON public.subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.subscriptions.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
        )
    );

-- Policies para company_invitations
CREATE POLICY "Admin pueden ver invitaciones" ON public.company_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.company_invitations.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

CREATE POLICY "Cualquiera con token puede ver invitación" ON public.company_invitations
    FOR SELECT USING (invitation_token IS NOT NULL);

CREATE POLICY "Admin pueden crear invitaciones" ON public.company_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.company_users cu
            WHERE cu.company_id = public.company_invitations.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

-- 8. CREAR FUNCIONES ÚTILES
-- ==========================================

-- Generar slug único
CREATE OR REPLACE FUNCTION generate_company_slug(name_input VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    new_slug VARCHAR;
    counter INTEGER := 1;
BEGIN
    base_slug := lower(regex_replace(name_input, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    new_slug := base_slug;
    
    WHILE EXISTS (SELECT 1 FROM public.companies WHERE slug = new_slug) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Verificar permiso de usuario
CREATE OR REPLACE FUNCTION check_company_permission(
    company_uuid UUID,
    required_permission VARCHAR
)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.company_users cu
        WHERE cu.company_id = company_uuid
        AND cu.user_id = auth.uid()
        AND cu.status = 'active'
        AND (
            cu.role IN ('owner', 'admin')
            OR (cu.permissions::jsonb ? required_permission)
        )
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- Obtener empresa del usuario actual
CREATE OR REPLACE FUNCTION get_user_company()
RETURNS TABLE (
    company_id UUID,
    company_name VARCHAR,
    role VARCHAR,
    permissions JSONB,
    status VARCHAR
) AS $$
    SELECT 
        cu.company_id,
        c.company_name,
        cu.role,
        cu.permissions,
        cu.status
    FROM public.company_users cu
    JOIN public.companies c ON c.id = cu.company_id
    WHERE cu.user_id = auth.uid()
    AND cu.status = 'active';
$$ LANGUAGE sql SECURITY DEFINER;

-- 9. CREAR VISTAS
-- ==========================================

-- Vista de empresas del usuario
CREATE OR REPLACE VIEW user_companies AS
SELECT 
    c.id,
    c.company_name,
    c.slug,
    c.email,
    c.logo_url,
    c.plan,
    c.status,
    cu.role,
    cu.permissions,
    s.status as subscription_status,
    s.current_period_end,
    cu.hired_at
FROM public.companies c
JOIN public.company_users cu ON cu.company_id = c.id
LEFT JOIN public.subscriptions s ON s.company_id = c.id
WHERE cu.user_id = auth.uid()
AND cu.status = 'active';

-- Vista de miembros de empresa
CREATE OR REPLACE VIEW company_members AS
SELECT 
    cu.id,
    cu.company_id,
    cu.user_id,
    cu.role,
    cu.status,
    cu.hired_at,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name
FROM public.company_users cu
JOIN auth.users au ON au.id = cu.user_id;

-- 10. ACTUALIZAR products PARA STATUS
-- ==========================================
-- Si products ya tiene status, actualizar constraint
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'products' 
        AND column_name = 'status'
        AND column_default IS NULL
    ) THEN
        ALTER TABLE public.products 
        ALTER COLUMN status SET DEFAULT 'draft',
        ALTER COLUMN status TYPE VARCHAR(50),
        ADD CONSTRAINT products_status_check CHECK (status IN ('draft', 'active', 'inactive', 'archived'));
    END IF;
END $$;
