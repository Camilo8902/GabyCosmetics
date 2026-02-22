-- ==========================================
-- INVENTORY MANAGEMENT TABLES
-- For variant-level inventory tracking
-- ==========================================

-- Variant Inventory Table
CREATE TABLE IF NOT EXISTS variant_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INTEGER DEFAULT 0 NOT NULL,
    reserved_quantity INTEGER DEFAULT 0 NOT NULL,
    low_stock_threshold INTEGER DEFAULT 10 NOT NULL,
    track_inventory BOOLEAN DEFAULT true NOT NULL,
    allow_backorder BOOLEAN DEFAULT false NOT NULL,
    location VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(variant_id)
);

-- Index for faster queries
CREATE INDEX IF NOT EXISTS idx_variant_inventory_variant_id ON variant_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_quantity ON variant_inventory(quantity);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_low_stock ON variant_inventory(low_stock_threshold) WHERE quantity <= low_stock_threshold;

-- Low Stock Alerts Table
CREATE TABLE IF NOT EXISTS low_stock_alerts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    low_stock_threshold INTEGER NOT NULL,
    is_read BOOLEAN DEFAULT false NOT NULL,
    is_resolved BOOLEAN DEFAULT false NOT NULL,
    resolved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_unread ON low_stock_alerts(is_read, is_resolved) WHERE is_read = false AND is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant ON low_stock_alerts(variant_id);

-- Inventory Movement History Table
CREATE TABLE IF NOT EXISTS inventory_movements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    movement_type VARCHAR(50) NOT NULL, -- 'purchase', 'sale', 'adjustment', 'return', 'damage'
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reason TEXT,
    reference_id VARCHAR(255), -- Order ID, adjustment ID, etc.
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(created_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_variant_inventory_updated_at ON variant_inventory;
CREATE TRIGGER update_variant_inventory_updated_at
    BEFORE UPDATE ON variant_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to check low stock and create alerts
CREATE OR REPLACE FUNCTION check_low_stock_after_update()
RETURNS TRIGGER AS $$
DECLARE
    alert_count INTEGER;
BEGIN
    -- Check if stock is now low or out of stock
    IF NEW.quantity <= NEW.low_stock_threshold THEN
        -- Check if there's already an unread alert
        SELECT COUNT(*) INTO alert_count
        FROM low_stock_alerts
        WHERE variant_id = NEW.variant_id
          AND is_read = false
          AND is_resolved = false;

        IF alert_count = 0 THEN
            INSERT INTO low_stock_alerts (variant_id, product_id, current_stock, low_stock_threshold)
            VALUES (
                NEW.variant_id,
                (SELECT product_id FROM product_variants WHERE id = NEW.variant_id),
                NEW.quantity,
                NEW.low_stock_threshold
            );
        END IF;
    END IF;

    -- If stock was resolved (increased above threshold), mark alert as resolved
    IF NEW.quantity > NEW.low_stock_threshold THEN
        UPDATE low_stock_alerts
        SET is_resolved = true, resolved_at = NOW()
        WHERE variant_id = NEW.variant_id
          AND is_resolved = false;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for auto low stock checking
DROP TRIGGER IF EXISTS check_low_stock_trigger ON variant_inventory;
CREATE TRIGGER check_low_stock_trigger
    AFTER UPDATE ON variant_inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_after_update();

-- Function to record inventory movement
CREATE OR REPLACE FUNCTION record_inventory_movement(
    p_variant_id UUID,
    p_movement_type VARCHAR(50),
    p_quantity_change INTEGER,
    p_reason TEXT DEFAULT NULL,
    p_reference_id VARCHAR(255) DEFAULT NULL,
    p_user_id UUID DEFAULT NULL
)
RETURNS void AS $$
DECLARE
    v_current_quantity INTEGER;
    v_new_quantity INTEGER;
BEGIN
    -- Get current quantity
    SELECT quantity INTO v_current_quantity
    FROM variant_inventory
    WHERE variant_id = p_variant_id;

    IF v_current_quantity IS NULL THEN
        v_current_quantity := 0;
    END IF;

    -- Calculate new quantity
    v_new_quantity := v_current_quantity + p_quantity_change;

    -- Prevent negative inventory
    IF v_new_quantity < 0 THEN
        RAISE EXCEPTION 'No hay suficiente stock para realizar esta operación';
    END IF;

    -- Update inventory
    INSERT INTO variant_inventory (variant_id, quantity, low_stock_threshold, track_inventory, allow_backorder)
    VALUES (p_variant_id, v_new_quantity, 10, true, false)
    ON CONFLICT (variant_id) DO UPDATE
    SET quantity = v_new_quantity, updated_at = NOW();

    -- Record movement
    INSERT INTO inventory_movements (variant_id, movement_type, quantity_change, previous_quantity, new_quantity, reason, reference_id, created_by)
    VALUES (p_variant_id, p_movement_type, p_quantity_change, v_current_quantity, v_new_quantity, p_reason, p_reference_id, p_user_id);
END;
$$ language 'plpgsql';

-- RLS Policies for Inventory Tables
ALTER TABLE variant_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;

-- Admin can see all inventory
CREATE POLICY "Admins can view all inventory" ON variant_inventory
    FOR SELECT USING (true);

CREATE POLICY "Admins can view all alerts" ON low_stock_alerts
    FOR SELECT USING (true);

CREATE POLICY "Admins can view all movements" ON inventory_movements
    FOR SELECT USING (true);

-- Company users can view their own inventory
CREATE POLICY "Companies can view their inventory" ON variant_inventory
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM product_variants pv
            WHERE pv.id = variant_inventory.variant_id
              AND pv.product_id IN (
                SELECT id FROM products WHERE company_id IN (
                  SELECT company_id FROM company_users WHERE user_id = auth.uid()
                )
              )
        )
    );

COMMENT ON TABLE variant_inventory IS 'Stores inventory levels for each product variant';
COMMENT ON TABLE low_stock_alerts IS 'Stores alerts for products with low stock';
COMMENT ON TABLE inventory_movements IS 'Tracks all inventory movements for auditing';
