-- ==========================================
-- GABY COSMETICS - MARKETPLACE PAYMENTS SCHEMA
-- VERSIÓN ULTRA SEGURA - Verifica todo antes de crear
-- ==========================================

-- ==========================================
-- 1. TABLA DE CUENTAS STRIPE CONNECT
-- ==========================================

-- Crear tabla solo si no existe
CREATE TABLE IF NOT EXISTS stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    account_type VARCHAR(50) DEFAULT 'express',
    onboarding_complete BOOLEAN DEFAULT FALSE,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    requirements JSONB DEFAULT '{}',
    pending_requirements JSONB DEFAULT '[]',
    business_profile JSONB DEFAULT '{}',
    external_accounts JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_started_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX IF NOT EXISTS idx_stripe_accounts_company ON stripe_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);

-- ==========================================
-- 2. TABLA DE TASAS DE COMISIÓN
-- ==========================================

CREATE TABLE IF NOT EXISTS commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    percentage DECIMAL(5,4) NOT NULL,
    fixed_fee DECIMAL(10,2) DEFAULT 0.00,
    min_fee DECIMAL(10,2) DEFAULT 0.00,
    max_fee DECIMAL(10,2) DEFAULT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_commission_rates_plan ON commission_rates(plan_name);

INSERT INTO commission_rates (plan_name, percentage, fixed_fee, description) VALUES
('basic', 0.2000, 0.30, 'Plan Básico: 20% + $0.30'),
('premium', 0.1200, 0.25, 'Plan Premium: 12% + $0.25'),
('enterprise', 0.0700, 0.20, 'Plan Enterprise: 7% + $0.20')
ON CONFLICT (plan_name) DO UPDATE SET
    percentage = EXCLUDED.percentage,
    fixed_fee = EXCLUDED.fixed_fee,
    description = EXCLUDED.description;

-- ==========================================
-- 3. AGREGAR COLUMNAS A ORDERS
-- ==========================================

ALTER TABLE orders ADD COLUMN IF NOT EXISTS platform_fee DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS vendor_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS company_id UUID REFERENCES companies(id);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_transfer_id VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS transfer_group VARCHAR(255);
ALTER TABLE orders ADD COLUMN IF NOT EXISTS is_multi_vendor BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_transfer_status ON orders(transfer_status);

-- ==========================================
-- 4. AGREGAR COLUMNAS A ORDER_ITEMS
-- ==========================================

ALTER TABLE order_items ADD COLUMN IF NOT EXISTS commission_rate DECIMAL(5,4) DEFAULT 0;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS commission_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS vendor_amount DECIMAL(10,2) DEFAULT 0.00;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS product_sku VARCHAR(100);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_name VARCHAR(255);
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS variant_id UUID;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'pending';
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- ==========================================
-- 5. TABLA DE TRANSFERENCIAS (Solo si no existe)
-- ==========================================

-- Verificar si la tabla existe antes de crearla
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'payment_transfers') THEN
        CREATE TABLE payment_transfers (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES orders(id) NOT NULL,
            company_id UUID REFERENCES companies(id) NOT NULL,
            stripe_transfer_id VARCHAR(255) UNIQUE,
            stripe_payment_intent_id VARCHAR(255),
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            commission_amount DECIMAL(10,2) DEFAULT 0.00,
            platform_fee_amount DECIMAL(10,2) DEFAULT 0.00,
            status VARCHAR(50) DEFAULT 'pending',
            failure_code VARCHAR(100),
            failure_message TEXT,
            metadata JSONB DEFAULT '{}',
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_payment_transfers_order ON payment_transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_company ON payment_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_status ON payment_transfers(status);

-- ==========================================
-- 6. TABLA DE REEMBOLSOS (Solo si no existe)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'refunds') THEN
        CREATE TABLE refunds (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            order_id UUID REFERENCES orders(id) NOT NULL,
            company_id UUID REFERENCES companies(id),
            user_id UUID REFERENCES auth.users(id),
            stripe_refund_id VARCHAR(255) UNIQUE,
            stripe_charge_id VARCHAR(255),
            amount DECIMAL(10,2) NOT NULL,
            currency VARCHAR(3) DEFAULT 'USD',
            refund_type VARCHAR(50) NOT NULL,
            reason VARCHAR(100),
            reason_description TEXT,
            status VARCHAR(50) DEFAULT 'pending',
            failure_code VARCHAR(100),
            failure_message TEXT,
            refund_commission BOOLEAN DEFAULT TRUE,
            commission_refunded DECIMAL(10,2) DEFAULT 0.00,
            metadata JSONB DEFAULT '{}',
            processed_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_company ON refunds(company_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- ==========================================
-- 7. TABLA DE NOTIFICACIONES (Solo si no existe)
-- ==========================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'notifications') THEN
        CREATE TABLE notifications (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
            order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
            user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
            type VARCHAR(50) NOT NULL,
            title VARCHAR(255) NOT NULL,
            message TEXT NOT NULL,
            data JSONB DEFAULT '{}',
            read BOOLEAN DEFAULT FALSE,
            read_at TIMESTAMP WITH TIME ZONE,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);

-- ==========================================
-- 8. FUNCIONES
-- ==========================================

CREATE OR REPLACE FUNCTION get_company_commission_rate(p_company_id UUID)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    v_plan VARCHAR(50);
    v_percentage DECIMAL(5,4);
BEGIN
    SELECT s.plan INTO v_plan FROM subscriptions s WHERE s.company_id = p_company_id AND s.status = 'active' LIMIT 1;
    IF v_plan IS NULL THEN SELECT c.plan INTO v_plan FROM companies c WHERE c.id = p_company_id; END IF;
    IF v_plan IS NULL THEN v_plan := 'basic'; END IF;
    SELECT cr.percentage INTO v_percentage FROM commission_rates cr WHERE cr.plan_name = v_plan AND cr.is_active = TRUE;
    IF v_percentage IS NULL THEN v_percentage := 0.20; END IF;
    RETURN v_percentage;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_commission(p_company_id UUID, p_amount DECIMAL(10,2))
RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_plan VARCHAR(50);
    v_pct DECIMAL(5,4);
    v_fixed DECIMAL(10,2);
    v_commission DECIMAL(10,2);
BEGIN
    SELECT s.plan INTO v_plan FROM subscriptions s WHERE s.company_id = p_company_id AND s.status = 'active' LIMIT 1;
    IF v_plan IS NULL THEN SELECT c.plan INTO v_plan FROM companies c WHERE c.id = p_company_id; END IF;
    IF v_plan IS NULL THEN v_plan := 'basic'; END IF;
    SELECT cr.percentage, cr.fixed_fee INTO v_pct, v_fixed FROM commission_rates cr WHERE cr.plan_name = v_plan AND cr.is_active = TRUE;
    IF v_pct IS NULL THEN v_pct := 0.20; v_fixed := 0.30; END IF;
    v_commission := (p_amount * v_pct) + COALESCE(v_fixed, 0);
    IF v_commission > p_amount THEN v_commission := p_amount; END IF;
    RETURN v_commission;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION calculate_vendor_amount(p_company_id UUID, p_amount DECIMAL(10,2))
RETURNS DECIMAL(10,2) AS $$
BEGIN
    RETURN p_amount - calculate_commission(p_company_id, p_amount);
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION company_can_receive_payments(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_status VARCHAR(50);
    v_onboarding BOOLEAN;
    v_charges BOOLEAN;
BEGIN
    SELECT status INTO v_status FROM companies WHERE id = p_company_id;
    IF v_status IS NULL OR v_status NOT IN ('approved', 'active') THEN RETURN FALSE; END IF;
    SELECT onboarding_complete, charges_enabled INTO v_onboarding, v_charges FROM stripe_accounts WHERE company_id = p_company_id;
    IF v_onboarding IS NULL OR v_onboarding = FALSE OR v_charges = FALSE THEN RETURN FALSE; END IF;
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 9. VISTAS
-- ==========================================

CREATE OR REPLACE VIEW company_sales_summary AS
SELECT 
    c.id as company_id,
    c.company_name,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_sales,
    COALESCE(SUM(o.platform_fee), 0) as total_commissions,
    COALESCE(SUM(o.vendor_amount), 0) as total_earnings
FROM companies c
LEFT JOIN orders o ON o.company_id = c.id AND o.status = 'paid'
GROUP BY c.id, c.company_name;

CREATE OR REPLACE VIEW pending_transfers AS
SELECT pt.*, c.company_name, o.total as order_total
FROM payment_transfers pt
JOIN companies c ON c.id = pt.company_id
JOIN orders o ON o.id = pt.order_id
WHERE pt.status = 'pending'
ORDER BY pt.created_at ASC;
