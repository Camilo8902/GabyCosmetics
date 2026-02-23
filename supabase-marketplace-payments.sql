-- ==========================================
-- GABY COSMETICS - MARKETPLACE PAYMENTS SCHEMA
-- Sistema de Pagos Seguro con Stripe Connect
-- ==========================================
-- Fecha: Febrero 2026
-- Descripción: Tablas y funciones para soportar
-- pagos multi-vendedor con comisiones automáticas
-- ==========================================

-- ==========================================
-- 1. TABLA DE CUENTAS STRIPE CONNECT
-- ==========================================
-- Almacena la conexión entre empresas y sus cuentas Stripe

CREATE TABLE IF NOT EXISTS stripe_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE UNIQUE NOT NULL,
    
    -- Información de Stripe
    stripe_account_id VARCHAR(255) UNIQUE NOT NULL,
    account_type VARCHAR(50) DEFAULT 'express' CHECK (account_type IN ('express', 'custom', 'standard')),
    
    -- Estado de la cuenta
    onboarding_complete BOOLEAN DEFAULT FALSE,
    charges_enabled BOOLEAN DEFAULT FALSE,
    payouts_enabled BOOLEAN DEFAULT FALSE,
    
    -- Requisitos pendientes de Stripe
    requirements JSONB DEFAULT '{}',
    pending_requirements JSONB DEFAULT '[]',
    
    -- Información de la cuenta
    business_profile JSONB DEFAULT '{}',
    external_accounts JSONB DEFAULT '{}',
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    onboarding_started_at TIMESTAMP WITH TIME ZONE,
    onboarding_completed_at TIMESTAMP WITH TIME ZONE
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_company ON stripe_accounts(company_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_stripe_id ON stripe_accounts(stripe_account_id);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_charges ON stripe_accounts(charges_enabled);
CREATE INDEX IF NOT EXISTS idx_stripe_accounts_payouts ON stripe_accounts(payouts_enabled);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_stripe_account_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_stripe_account_timestamp ON stripe_accounts;
CREATE TRIGGER trigger_update_stripe_account_timestamp
    BEFORE UPDATE ON stripe_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_stripe_account_timestamp();

-- ==========================================
-- 2. TABLA DE TASAS DE COMISIÓN
-- ==========================================
-- Define las comisiones por plan de suscripción

CREATE TABLE IF NOT EXISTS commission_rates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Plan asociado
    plan_name VARCHAR(50) NOT NULL UNIQUE,
    
    -- Estructura de comisión
    percentage DECIMAL(5,4) NOT NULL,        -- Ej: 0.2000 = 20%
    fixed_fee DECIMAL(10,2) DEFAULT 0.00,    -- Tarifa fija por transacción
    min_fee DECIMAL(10,2) DEFAULT 0.00,      -- Comisión mínima
    max_fee DECIMAL(10,2) DEFAULT NULL,      -- Comisión máxima (NULL = sin límite)
    
    -- Configuración adicional
    is_active BOOLEAN DEFAULT TRUE,
    description TEXT,
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_commission_rates_plan ON commission_rates(plan_name);
CREATE INDEX IF NOT EXISTS idx_commission_rates_active ON commission_rates(is_active);

-- Insertar tasas por defecto (aprobadas por el usuario)
INSERT INTO commission_rates (plan_name, percentage, fixed_fee, description) VALUES
('basic', 0.2000, 0.30, 'Plan Básico: 20% + $0.30 por transacción'),
('premium', 0.1200, 0.25, 'Plan Premium: 12% + $0.25 por transacción'),
('enterprise', 0.0700, 0.20, 'Plan Enterprise: 7% + $0.20 por transacción')
ON CONFLICT (plan_name) DO UPDATE SET
    percentage = EXCLUDED.percentage,
    fixed_fee = EXCLUDED.fixed_fee,
    description = EXCLUDED.description,
    updated_at = NOW();

-- ==========================================
-- 3. MODIFICACIONES A TABLA ORDERS
-- ==========================================
-- Agregar columnas para soporte multi-vendedor

-- Agregar columnas si no existen
DO $$
BEGIN
    -- company_id: Empresa vendedora principal (para órdenes de un solo vendedor)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'company_id') THEN
        ALTER TABLE orders ADD COLUMN company_id UUID REFERENCES companies(id);
    END IF;
    
    -- platform_fee: Comisión de la plataforma
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'platform_fee') THEN
        ALTER TABLE orders ADD COLUMN platform_fee DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- vendor_amount: Monto que recibe el vendedor
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'vendor_amount') THEN
        ALTER TABLE orders ADD COLUMN vendor_amount DECIMAL(10,2) DEFAULT 0.00;
    END IF;
    
    -- stripe_transfer_id: ID de transferencia de Stripe
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'stripe_transfer_id') THEN
        ALTER TABLE orders ADD COLUMN stripe_transfer_id VARCHAR(255);
    END IF;
    
    -- transfer_status: Estado de la transferencia
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transfer_status') THEN
        ALTER TABLE orders ADD COLUMN transfer_status VARCHAR(50) DEFAULT 'pending' CHECK (transfer_status IN ('pending', 'processing', 'completed', 'failed', 'canceled'));
    END IF;
    
    -- transfer_group: Grupo para transferencias múltiples
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'transfer_group') THEN
        ALTER TABLE orders ADD COLUMN transfer_group VARCHAR(255);
    END IF;
    
    -- is_multi_vendor: Indica si la orden tiene múltiples vendedores
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orders' AND column_name = 'is_multi_vendor') THEN
        ALTER TABLE orders ADD COLUMN is_multi_vendor BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- Crear índices para las nuevas columnas
CREATE INDEX IF NOT EXISTS idx_orders_company ON orders(company_id);
CREATE INDEX IF NOT EXISTS idx_orders_transfer_status ON orders(transfer_status);
CREATE INDEX IF NOT EXISTS idx_orders_transfer_group ON orders(transfer_group);

-- ==========================================
-- 4. TABLA DE ITEMS DE ORDEN (DETALLADA)
-- ==========================================
-- Para soportar múltiples vendedores en una orden

CREATE TABLE IF NOT EXISTS order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
    product_id UUID REFERENCES products(id) NOT NULL,
    company_id UUID REFERENCES companies(id) NOT NULL,
    
    -- Detalles del producto al momento de la compra
    product_name VARCHAR(500) NOT NULL,
    product_image TEXT,
    product_sku VARCHAR(100),
    variant_name VARCHAR(255),
    variant_id UUID,
    
    -- Cantidades y precios
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    
    -- Comisión y distribución
    commission_rate DECIMAL(5,4) NOT NULL DEFAULT 0,
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    vendor_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Estado del item
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'canceled', 'refunded')),
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product ON order_items(product_id);
CREATE INDEX IF NOT EXISTS idx_order_items_company ON order_items(company_id);
CREATE INDEX IF NOT EXISTS idx_order_items_status ON order_items(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_order_item_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_item_timestamp ON order_items;
CREATE TRIGGER trigger_update_order_item_timestamp
    BEFORE UPDATE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION update_order_item_timestamp();

-- ==========================================
-- 5. TABLA DE TRANSFERENCIAS
-- ==========================================
-- Registro de todas las transferencias a vendedores

CREATE TABLE IF NOT EXISTS payment_transfers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    order_id UUID REFERENCES orders(id) NOT NULL,
    order_item_id UUID REFERENCES order_items(id),
    company_id UUID REFERENCES companies(id) NOT NULL,
    
    -- Información de Stripe
    stripe_transfer_id VARCHAR(255) UNIQUE,
    stripe_payment_intent_id VARCHAR(255),
    
    -- Montos
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    commission_amount DECIMAL(10,2) DEFAULT 0.00,
    platform_fee_amount DECIMAL(10,2) DEFAULT 0.00,
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed', 'canceled', 'reversed')),
    failure_code VARCHAR(100),
    failure_message TEXT,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    
    -- Fechas
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_payment_transfers_order ON payment_transfers(order_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_company ON payment_transfers(company_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_stripe ON payment_transfers(stripe_transfer_id);
CREATE INDEX IF NOT EXISTS idx_payment_transfers_status ON payment_transfers(status);

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_payment_transfer_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payment_transfer_timestamp ON payment_transfers;
CREATE TRIGGER trigger_update_payment_transfer_timestamp
    BEFORE UPDATE ON payment_transfers
    FOR EACH ROW
    EXECUTE FUNCTION update_payment_transfer_timestamp();

-- ==========================================
-- 6. TABLA DE REEMBOLSOS
-- ==========================================

CREATE TABLE IF NOT EXISTS refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    order_id UUID REFERENCES orders(id) NOT NULL,
    order_item_id UUID REFERENCES order_items(id),
    company_id UUID REFERENCES companies(id),
    user_id UUID REFERENCES auth.users(id),
    
    -- Información de Stripe
    stripe_refund_id VARCHAR(255) UNIQUE,
    stripe_charge_id VARCHAR(255),
    
    -- Montos
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    
    -- Tipo de reembolso
    refund_type VARCHAR(50) NOT NULL CHECK (refund_type IN ('full', 'partial')),
    reason VARCHAR(100) CHECK (reason IN ('requested_by_customer', 'duplicate', 'fraudulent', 'product_not_received', 'product_defective', 'other')),
    reason_description TEXT,
    
    -- Estado
    status VARCHAR(50) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'succeeded', 'failed', 'canceled')),
    failure_code VARCHAR(100),
    failure_message TEXT,
    
    -- Reembolso de comisión
    refund_commission BOOLEAN DEFAULT TRUE,
    commission_refunded DECIMAL(10,2) DEFAULT 0.00,
    
    -- Metadatos
    metadata JSONB DEFAULT '{}',
    
    -- Fechas
    processed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_refunds_order ON refunds(order_id);
CREATE INDEX IF NOT EXISTS idx_refunds_company ON refunds(company_id);
CREATE INDEX IF NOT EXISTS idx_refunds_user ON refunds(user_id);
CREATE INDEX IF NOT EXISTS idx_refunds_stripe ON refunds(stripe_refund_id);
CREATE INDEX IF NOT EXISTS idx_refunds_status ON refunds(status);

-- ==========================================
-- 7. FUNCIONES DE CÁLCULO DE COMISIÓN
-- ==========================================

-- Función para obtener la tasa de comisión de una empresa
CREATE OR REPLACE FUNCTION get_company_commission_rate(p_company_id UUID)
RETURNS DECIMAL(5,4) AS $$
DECLARE
    v_plan VARCHAR(50);
    v_rate commission_rates%ROWTYPE;
BEGIN
    -- Obtener plan de la empresa desde subscriptions
    SELECT s.plan INTO v_plan
    FROM subscriptions s
    WHERE s.company_id = p_company_id AND s.status = 'active'
    LIMIT 1;
    
    -- Si no tiene suscripción, usar plan 'basic' por defecto
    IF v_plan IS NULL THEN
        -- Intentar obtener el plan desde la tabla companies
        SELECT c.plan INTO v_plan
        FROM companies c
        WHERE c.id = p_company_id;
        
        IF v_plan IS NULL THEN
            v_plan := 'basic';
        END IF;
    END IF;
    
    -- Obtener la tasa de comisión
    SELECT * INTO v_rate
    FROM commission_rates
    WHERE plan_name = v_plan AND is_active = TRUE;
    
    -- Si no encuentra tasa, usar basic
    IF v_rate.percentage IS NULL THEN
        SELECT * INTO v_rate
        FROM commission_rates
        WHERE plan_name = 'basic' AND is_active = TRUE;
    END IF;
    
    RETURN v_rate.percentage;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para calcular la comisión de un monto
CREATE OR REPLACE FUNCTION calculate_commission(
    p_company_id UUID,
    p_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_plan VARCHAR(50);
    v_rate commission_rates%ROWTYPE;
    v_commission DECIMAL(10,2);
BEGIN
    -- Obtener plan de la empresa
    SELECT s.plan INTO v_plan
    FROM subscriptions s
    WHERE s.company_id = p_company_id AND s.status = 'active'
    LIMIT 1;
    
    -- Si no tiene suscripción, verificar en companies
    IF v_plan IS NULL THEN
        SELECT c.plan INTO v_plan
        FROM companies c
        WHERE c.id = p_company_id;
    END IF;
    
    -- Default a basic
    IF v_plan IS NULL THEN
        v_plan := 'basic';
    END IF;
    
    -- Obtener tasa de comisión
    SELECT * INTO v_rate
    FROM commission_rates
    WHERE plan_name = v_plan AND is_active = TRUE;
    
    -- Si no encuentra, usar basic
    IF v_rate.percentage IS NULL THEN
        SELECT * INTO v_rate
        FROM commission_rates
        WHERE plan_name = 'basic' AND is_active = TRUE;
    END IF;
    
    -- Calcular comisión: (monto * porcentaje) + tarifa fija
    v_commission := (p_amount * v_rate.percentage) + v_rate.fixed_fee;
    
    -- Aplicar límite mínimo
    IF v_rate.min_fee IS NOT NULL AND v_commission < v_rate.min_fee THEN
        v_commission := v_rate.min_fee;
    END IF;
    
    -- Aplicar límite máximo
    IF v_rate.max_fee IS NOT NULL AND v_commission > v_rate.max_fee THEN
        v_commission := v_rate.max_fee;
    END IF;
    
    -- La comisión no puede ser mayor que el monto
    IF v_commission > p_amount THEN
        v_commission := p_amount;
    END IF;
    
    RETURN v_commission;
END;
$$ LANGUAGE plpgsql STABLE;

-- Función para calcular el monto para el vendedor
CREATE OR REPLACE FUNCTION calculate_vendor_amount(
    p_company_id UUID,
    p_amount DECIMAL(10,2)
) RETURNS DECIMAL(10,2) AS $$
DECLARE
    v_commission DECIMAL(10,2);
BEGIN
    v_commission := calculate_commission(p_company_id, p_amount);
    RETURN p_amount - v_commission;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 8. FUNCIONES DE VALIDACIÓN
-- ==========================================

-- Función para verificar si una empresa puede recibir pagos
CREATE OR REPLACE FUNCTION company_can_receive_payments(p_company_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_stripe_account stripe_accounts%ROWTYPE;
    v_company companies%ROWTYPE;
BEGIN
    -- Verificar que la empresa existe y está activa
    SELECT * INTO v_company
    FROM companies
    WHERE id = p_company_id;
    
    IF v_company.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que la empresa está aprobada/activa
    IF v_company.status NOT IN ('approved', 'active') THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que tiene cuenta Stripe Connect
    SELECT * INTO v_stripe_account
    FROM stripe_accounts
    WHERE company_id = p_company_id;
    
    IF v_stripe_account.id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que el onboarding está completo
    IF v_stripe_account.onboarding_complete = FALSE THEN
        RETURN FALSE;
    END IF;
    
    -- Verificar que puede recibir cargos
    IF v_stripe_account.charges_enabled = FALSE THEN
        RETURN FALSE;
    END IF;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql STABLE;

-- ==========================================
-- 9. POLÍTICAS RLS (Row Level Security)
-- ==========================================

-- Habilitar RLS en nuevas tablas
ALTER TABLE stripe_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE commission_rates ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_transfers ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;

-- Políticas para stripe_accounts
CREATE POLICY "Admins can view all stripe accounts"
    ON stripe_accounts FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Companies can view own stripe account"
    ON stripe_accounts FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Service role can manage stripe accounts"
    ON stripe_accounts FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Políticas para commission_rates (solo lectura para todos los autenticados)
CREATE POLICY "Authenticated users can view commission rates"
    ON commission_rates FOR SELECT
    TO authenticated
    USING (is_active = TRUE);

CREATE POLICY "Service role can manage commission rates"
    ON commission_rates FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Políticas para order_items
CREATE POLICY "Users can view own order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );

CREATE POLICY "Companies can view own order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all order items"
    ON order_items FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage order items"
    ON order_items FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Políticas para payment_transfers
CREATE POLICY "Companies can view own transfers"
    ON payment_transfers FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all transfers"
    ON payment_transfers FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage transfers"
    ON payment_transfers FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- Políticas para refunds
CREATE POLICY "Users can view own refunds"
    ON refunds FOR SELECT
    TO authenticated
    USING (
        user_id = auth.uid() OR
        order_id IN (SELECT id FROM orders WHERE user_id = auth.uid())
    );

CREATE POLICY "Companies can view own refunds"
    ON refunds FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Admins can view all refunds"
    ON refunds FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage refunds"
    ON refunds FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- 10. VISTAS ÚTILES
-- ==========================================

-- Vista de resumen de ventas por empresa
CREATE OR REPLACE VIEW company_sales_summary AS
SELECT 
    c.id as company_id,
    c.company_name,
    COUNT(DISTINCT o.id) as total_orders,
    COALESCE(SUM(o.total), 0) as total_sales,
    COALESCE(SUM(o.platform_fee), 0) as total_commissions,
    COALESCE(SUM(o.vendor_amount), 0) as total_earnings,
    COUNT(DISTINCT oi.id) as total_items_sold
FROM companies c
LEFT JOIN orders o ON o.company_id = c.id AND o.status = 'paid'
LEFT JOIN order_items oi ON oi.company_id = c.id
GROUP BY c.id, c.company_name;

-- Vista de transferencias pendientes
CREATE OR REPLACE VIEW pending_transfers AS
SELECT 
    pt.*,
    c.company_name,
    o.id as order_id,
    o.total as order_total
FROM payment_transfers pt
JOIN companies c ON c.id = pt.company_id
JOIN orders o ON o.id = pt.order_id
WHERE pt.status = 'pending'
ORDER BY pt.created_at ASC;

-- ==========================================
-- 11. TRIGGERS ADICIONALES
-- ==========================================

-- Trigger para crear order_items desde el JSON de items en orders
CREATE OR REPLACE FUNCTION create_order_items_from_json()
RETURNS TRIGGER AS $$
DECLARE
    item JSONB;
    v_company_id UUID;
    v_commission DECIMAL(10,2);
    v_vendor_amount DECIMAL(10,2);
BEGIN
    -- Solo procesar si hay items en el JSON
    IF NEW.items IS NOT NULL AND jsonb_array_length(NEW.items) > 0 THEN
        -- Eliminar items anteriores si es una actualización
        IF TG_OP = 'UPDATE' THEN
            DELETE FROM order_items WHERE order_id = NEW.id;
        END IF;
        
        -- Crear order_items
        FOR item IN SELECT * FROM jsonb_array_elements(NEW.items)
        LOOP
            -- Obtener company_id del producto
            SELECT company_id INTO v_company_id
            FROM products
            WHERE id = (item->>'id')::UUID;
            
            -- Si no hay company_id, usar el de la orden
            IF v_company_id IS NULL THEN
                v_company_id := NEW.company_id;
            END IF;
            
            -- Calcular comisión y monto del vendedor
            IF v_company_id IS NOT NULL THEN
                v_commission := calculate_commission(v_company_id, (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER);
                v_vendor_amount := (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER - v_commission;
            ELSE
                v_commission := 0;
                v_vendor_amount := (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER;
            END IF;
            
            -- Insertar order_item
            INSERT INTO order_items (
                order_id,
                product_id,
                company_id,
                product_name,
                product_image,
                product_sku,
                quantity,
                unit_price,
                total_price,
                commission_rate,
                commission_amount,
                vendor_amount
            ) VALUES (
                NEW.id,
                (item->>'id')::UUID,
                v_company_id,
                item->>'name',
                item->>'image',
                item->>'sku',
                (item->>'quantity')::INTEGER,
                (item->>'price')::DECIMAL,
                (item->>'price')::DECIMAL * (item->>'quantity')::INTEGER,
                CASE WHEN v_company_id IS NOT NULL THEN get_company_commission_rate(v_company_id) ELSE 0 END,
                v_commission,
                v_vendor_amount
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_create_order_items ON orders;
CREATE TRIGGER trigger_create_order_items
    AFTER INSERT OR UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION create_order_items_from_json();

-- ==========================================
-- 12. TABLA DE NOTIFICACIONES
-- ==========================================

CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Relaciones
    company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Tipo y contenido
    type VARCHAR(50) NOT NULL CHECK (type IN ('new_sale', 'payment_received', 'transfer_completed', 'refund_requested', 'system')),
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    
    -- Datos adicionales
    data JSONB DEFAULT '{}',
    
    -- Estado
    read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMP WITH TIME ZONE,
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_notifications_company ON notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

-- Políticas RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Companies can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        company_id IN (
            SELECT company_id FROM company_users WHERE user_id = auth.uid()
        )
    );

CREATE POLICY "Users can view own notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (user_id = auth.uid());

CREATE POLICY "Admins can view all notifications"
    ON notifications FOR SELECT
    TO authenticated
    USING (
        EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
    );

CREATE POLICY "Service role can manage notifications"
    ON notifications FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- ==========================================
-- FIN DE LA MIGRACIÓN
-- ==========================================

-- Comentar la migración
COMMENT ON TABLE stripe_accounts IS 'Almacena las cuentas Stripe Connect de las empresas vendedoras';
COMMENT ON TABLE commission_rates IS 'Define las tasas de comisión por plan de suscripción';
COMMENT ON TABLE order_items IS 'Items individuales de cada orden, soporta múltiples vendedores';
COMMENT ON TABLE payment_transfers IS 'Registro de transferencias a cuentas de vendedores';
COMMENT ON TABLE refunds IS 'Registro de reembolsos procesados';
COMMENT ON TABLE notifications IS 'Notificaciones para empresas y usuarios';

COMMENT ON FUNCTION calculate_commission IS 'Calcula la comisión para una empresa y monto dados';
COMMENT ON FUNCTION calculate_vendor_amount IS 'Calcula el monto que recibe el vendedor después de comisión';
COMMENT ON FUNCTION company_can_receive_payments IS 'Verifica si una empresa puede recibir pagos';