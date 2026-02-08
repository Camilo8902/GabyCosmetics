-- ==========================================
-- E-Commerce Marketplace Schema
-- Supabase PostgreSQL
-- Fase 1: Sistema de Empresas
-- ==========================================

-- Configuración de extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================
-- 1. TABLA DE EMPRESAS
-- ==========================================
CREATE TABLE IF NOT EXISTS companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Información básica
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    
    -- Imágenes y branding
    logo_url TEXT,
    cover_image_url TEXT,
    
    -- Descripción
    description TEXT,
    short_description VARCHAR(500),
    
    -- Suscripción
    plan VARCHAR(50) DEFAULT 'basic',
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended', 'active')),
    
    -- Información fiscal
    tax_id VARCHAR(100),
    business_type VARCHAR(100),
    fiscal_address JSONB,
    
    -- Contacto y ubicación
    headquarters_address JSONB,
    
    -- Web y redes sociales
    website_url TEXT,
    social_links JSONB DEFAULT '{
        "facebook": null,
        "instagram": null,
        "twitter": null,
        "tiktok": null,
        "youtube": null
    }',
    
    -- Configuración
    settings JSONB DEFAULT '{
        "timezone": "America/Havana",
        "currency": "USD",
        "language": "es",
        "auto_fulfill_orders": false,
        "low_stock_threshold": 10,
        "email_notifications": true,
        "order_notifications": true,
        "low_stock_alerts": true
    }',
    
    -- Metadatos adicionales
    metadata JSONB DEFAULT '{}',
    
    -- Fechas
    approved_at TIMESTAMP WITH TIME ZONE,
    approved_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para empresas
CREATE INDEX IF NOT EXISTS idx_companies_slug ON companies(slug);
CREATE INDEX IF NOT EXISTS idx_companies_status ON companies(status);
CREATE INDEX IF NOT EXISTS idx_companies_plan ON companies(plan);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_company_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_timestamp
    BEFORE UPDATE ON companies
    FOR EACH ROW
    EXECUTE FUNCTION update_company_timestamp();

-- ==========================================
-- 2. TABLA DE USUARIOS POR EMPRESA
-- ==========================================
CREATE TABLE IF NOT EXISTS company_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    
    -- Rol y permisos
    role VARCHAR(100) NOT NULL DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    
    -- Estado
    status VARCHAR(50) DEFAULT 'invited' CHECK (status IN ('invited', 'active', 'inactive', 'removed')),
    
    -- Fechas
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    hired_at TIMESTAMP WITH TIME ZONE,
    removed_at TIMESTAMP WITH TIME ZONE,
    invited_by UUID REFERENCES auth.users(id),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    --约束
    UNIQUE(company_id, user_id)
);

-- Índices para company_users
CREATE INDEX IF NOT EXISTS idx_company_users_company ON company_users(company_id);
CREATE INDEX IF NOT EXISTS idx_company_users_user ON company_users(user_id);
CREATE INDEX IF NOT EXISTS idx_company_users_status ON company_users(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_company_user_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_company_user_timestamp
    BEFORE UPDATE ON company_users
    FOR EACH ROW
    EXECUTE FUNCTION update_company_user_timestamp();

-- ==========================================
-- 3. TABLA DE SUSCRIPCIONES
-- ==========================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL UNIQUE,
    
    -- Plan
    plan VARCHAR(50) NOT NULL DEFAULT 'basic' CHECK (plan IN ('basic', 'premium', 'enterprise')),
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'paused', 'incomplete')),
    
    -- Stripe
    stripe_customer_id VARCHAR(255),
    stripe_subscription_id VARCHAR(255),
    stripe_price_id VARCHAR(255),
    
    -- Período
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    trial_end TIMESTAMP WITH TIME ZONE,
    
    -- Cancelación
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP WITH TIME ZONE,
    
    -- Límites del plan
    limits JSONB DEFAULT '{
        "products": 100,
        "users": 1,
        "storage_gb": 5,
        "orders_per_month": 500
    }',
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para suscripciones
CREATE INDEX IF NOT EXISTS idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe ON subscriptions(stripe_customer_id);

-- ==========================================
-- 4. INVITACIONES A EMPRESAS
-- ==========================================
CREATE TABLE IF NOT EXISTS company_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE NOT NULL,
    invited_email VARCHAR(255) NOT NULL,
    invited_by UUID REFERENCES auth.users(id),
    
    -- Rol propuesto
    role VARCHAR(100) DEFAULT 'viewer',
    permissions JSONB DEFAULT '[]',
    
    -- Token de invitación
    invitation_token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'canceled')),
    
    -- Mensaje personalizado
    personal_message TEXT,
    
    -- Fechas
    accepted_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices para invitaciones
CREATE INDEX IF NOT EXISTS idx_company_invitations_company ON company_invitations(company_id);
CREATE INDEX IF NOT EXISTS idx_company_invitations_email ON company_invitations(invited_email);
CREATE INDEX IF NOT EXISTS idx_company_invitations_token ON company_invitations(invitation_token);
CREATE INDEX IF NOT EXISTS idx_company_invitations_expires ON company_invitations(expires_at);

-- ==========================================
-- 5. PLANES DE PRECIOS (Referencia)
-- ==========================================
CREATE TABLE IF NOT EXISTS subscription_plans (
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
INSERT INTO subscription_plans (id, name, description, price_monthly, price_yearly, features, limits) VALUES
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

-- ==========================================
-- 6. ROLES PERMITIDOS (Referencia)
-- ==========================================
CREATE TABLE IF NOT EXISTS company_roles (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    permissions JSONB NOT NULL,
    is_system BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insertar roles por defecto
INSERT INTO company_roles (id, name, description, permissions, is_system) VALUES
('owner', 'Propietario', 'Dueño de la empresa con todos los permisos',
 '[
    "products:read", "products:write", "products:delete",
    "orders:read", "orders:write", "orders:process",
    "inventory:read", "inventory:write",
    "customers:read", "customers:write",
    "analytics:read",
    "settings:read", "settings:write",
    "users:read", "users:write", "users:invite",
    "billing:read", "billing:write",
    "reports:read", "reports:export"
 ]'::jsonb, TRUE),
('admin', 'Administrador', 'Administrador general de la empresa',
 '[
    "products:read", "products:write", "products:delete",
    "orders:read", "orders:write", "orders:process",
    "inventory:read", "inventory:write",
    "customers:read", "customers:write",
    "analytics:read",
    "settings:read", "settings:write",
    "users:read", "users:write", "users:invite",
    "billing:read",
    "reports:read", "reports:export"
 ]'::jsonb, TRUE),
('product_manager', 'Gestor de Productos', 'Gestiona el catálogo de productos',
 '["products:read", "products:write", "inventory:read", "analytics:read", "reports:read"]'::jsonb, TRUE),
('inventory_manager', 'Gestor de Inventario', 'Gestiona el inventario',
 '["products:read", "inventory:read", "inventory:write", "orders:read"]'::jsonb, TRUE),
('support', 'Soporte', 'Atención al cliente',
 '["orders:read", "orders:write", "customers:read", "customers:write", "inventory:read"]'::jsonb, TRUE),
('marketing', 'Marketing', 'Equipo de marketing',
 '["products:read", "orders:read", "analytics:read", "customers:read", "reports:read", "reports:export"]'::jsonb, TRUE),
('sales', 'Ventas', 'Equipo de ventas',
 '["products:read", "orders:read", "orders:write", "customers:read", "customers:write", "analytics:read"]'::jsonb, TRUE),
('viewer', 'Visualizador', 'Solo lectura',
 '["products:read", "orders:read", "inventory:read", "analytics:read"]'::jsonb, TRUE);

-- ==========================================
-- 7. MEJORAS DE TABLA products (existente)
-- ==========================================
-- Añadir campos de empresa a productos si no existen
ALTER TABLE IF EXISTS products ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;
ALTER TABLE products ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'inactive', 'archived'));
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- ==========================================
-- 8. POLÍTICAS DE SEGURIDAD (RLS)
-- ==========================================

-- Habilitar RLS
ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE company_roles ENABLE ROW LEVEL SECURITY;

-- Policies para companies
CREATE POLICY "Usuarios pueden ver empresas activas" ON companies
    FOR SELECT USING (status = 'active' OR 
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = companies.id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
        ));

CREATE POLICY "Usuarios autenticados pueden crear empresas" ON companies
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Miembros de empresa pueden actualizar" ON companies
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = companies.id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

-- Policies para company_users
CREATE POLICY "Miembros pueden ver otros miembros" ON company_users
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
        )
    );

CREATE POLICY "Miembros pueden ver su propio registro" ON company_users
    FOR SELECT USING (user_id = auth.uid());

CREATE POLICY "Admin pueden crear miembros" ON company_users
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

CREATE POLICY "Admin pueden actualizar miembros" ON company_users
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_users.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

-- Policies para subscriptions
CREATE POLICY "Miembros pueden ver suscripción" ON subscriptions
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = subscriptions.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
        )
    );

-- Policies para company_invitations
CREATE POLICY "Admin pueden ver invitaciones" ON company_invitations
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_invitations.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

CREATE POLICY "Cualquiera con token puede ver invitación" ON company_invitations
    FOR SELECT USING (invitation_token IS NOT NULL);

CREATE POLICY "Admin pueden crear invitaciones" ON company_invitations
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM company_users cu
            WHERE cu.company_id = company_invitations.company_id
            AND cu.user_id = auth.uid()
            AND cu.status = 'active'
            AND (cu.role = 'owner' OR cu.role = 'admin')
        )
    );

-- ==========================================
-- 9. FUNCIONES ÚTILES
-- ==========================================

-- Generar slug único
CREATE OR REPLACE FUNCTION generate_company_slug(name VARCHAR)
RETURNS VARCHAR AS $$
DECLARE
    base_slug VARCHAR;
    new_slug VARCHAR;
    counter INTEGER := 1;
BEGIN
    -- Convertir a slug
    base_slug := lower(regex_replace(name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    
    new_slug := base_slug;
    
    -- Verificar unicidad
    WHILE EXISTS (SELECT 1 FROM companies WHERE slug = new_slug) LOOP
        new_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN new_slug;
END;
$$ LANGUAGE plpgsql;

-- Obtener usuario actual de empresa
CREATE OR REPLACE FUNCTION get_current_company_user(company_uuid UUID)
RETURNS TABLE (
    user_id UUID,
    role VARCHAR,
    permissions JSONB,
    status VARCHAR
) AS $$
    SELECT 
        cu.user_id,
        cu.role,
        cu.permissions,
        cu.status
    FROM company_users cu
    WHERE cu.company_id = company_uuid
    AND cu.user_id = auth.uid()
    AND cu.status = 'active';
$$ LANGUAGE sql SECURITY DEFINER;

-- Verificar permiso de usuario
CREATE OR REPLACE FUNCTION check_company_permission(
    company_uuid UUID,
    required_permission VARCHAR
)
RETURNS BOOLEAN AS $$
    SELECT EXISTS (
        SELECT 1 FROM company_users cu
        WHERE cu.company_id = company_uuid
        AND cu.user_id = auth.uid()
        AND cu.status = 'active'
        AND (
            cu.role IN ('owner', 'admin')
            OR (cu.permissions::jsonb ? required_permission)
        )
    );
$$ LANGUAGE sql SECURITY DEFINER;

-- ==========================================
-- 10. VISTAS ÚTILES
-- ==========================================

-- Vista de empresas con estadísticas
CREATE OR REPLACE VIEW company_overview AS
SELECT 
    c.id,
    c.name,
    c.slug,
    c.email,
    c.plan,
    c.status,
    c.created_at,
    c.logo_url,
    s.status as subscription_status,
    s.current_period_end,
    (
        SELECT COUNT(*) FROM company_users cu 
        WHERE cu.company_id = c.id AND cu.status = 'active'
    ) as total_members,
    (
        SELECT COUNT(*) FROM products p 
        WHERE p.company_id = c.id
    ) as total_products
FROM companies c
LEFT JOIN subscriptions s ON s.company_id = c.id;

-- Vista de miembros de empresa
CREATE OR REPLACE VIEW company_members_overview AS
SELECT 
    cu.id,
    cu.company_id,
    cu.user_id,
    cu.role,
    cu.status,
    cu.hired_at,
    au.email,
    au.raw_user_meta_data->>'full_name' as full_name,
    au.avatar_url
FROM company_users cu
JOIN auth.users au ON au.id = cu.user_id;

-- ==========================================
-- ACTUALIZAR TABLA products EXISTENTE
-- ==========================================
-- El siguiente SQL debe ejecutarse en la base de datos existente
-- para añadir las columnas necesarias si no existen

/*
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id) ON DELETE SET NULL;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'draft' 
CHECK (status IN ('draft', 'active', 'inactive', 'archived'));

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;

ALTER TABLE products 
ADD COLUMN IF NOT EXISTS is_digital BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_products_company ON products(company_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);
*/
