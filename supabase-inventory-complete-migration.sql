-- ==========================================
-- COMPLETE INVENTORY & VARIANTS MIGRATION
-- Creates product_variants and variant_inventory tables
-- ==========================================

-- Step 1: Create product_variants table (if not exists)
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    sku character varying NOT NULL UNIQUE,
    name character varying NOT NULL,
    name_en character varying DEFAULT ''::character varying,
    price numeric(12,2) NOT NULL DEFAULT 0,
    compare_at_price numeric(12,2),
    cost_price numeric(12,2),
    barcode character varying,
    weight numeric(10,3),
    is_active boolean DEFAULT true NOT NULL,
    sort_order integer DEFAULT 0,
    attributes jsonb DEFAULT '{}'::jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index for product_variants
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id ON public.product_variants(product_id);
CREATE INDEX IF NOT EXISTS idx_product_variants_sku ON public.product_variants(sku);
CREATE INDEX IF NOT EXISTS idx_product_variants_active ON public.product_variants(is_active);

-- Step 2: Create variant_inventory table
CREATE TABLE IF NOT EXISTS public.variant_inventory (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    quantity integer NOT NULL DEFAULT 0,
    reserved_quantity integer NOT NULL DEFAULT 0,
    low_stock_threshold integer NOT NULL DEFAULT 10,
    track_inventory boolean DEFAULT true NOT NULL,
    allow_backorder boolean DEFAULT false NOT NULL,
    location character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Index for variant_inventory
CREATE INDEX IF NOT EXISTS idx_variant_inventory_variant_id ON public.variant_inventory(variant_id);
CREATE INDEX IF NOT EXISTS idx_variant_inventory_quantity ON public.variant_inventory(quantity);

-- Step 3: Create low_stock_alerts table
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    current_stock integer NOT NULL,
    low_stock_threshold integer NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Index for low_stock_alerts
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_unread ON public.low_stock_alerts(is_read, is_resolved) WHERE is_read = false AND is_resolved = false;
CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_variant ON public.low_stock_alerts(variant_id);

-- Step 4: Create inventory_movements table
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL REFERENCES public.product_variants(id) ON DELETE CASCADE,
    movement_type character varying(50) NOT NULL,
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    reason text,
    reference_id character varying(255),
    created_by uuid REFERENCES auth.users(id),
    created_at timestamp with time zone DEFAULT now()
);

-- Index for inventory_movements
CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant ON public.inventory_movements(variant_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON public.inventory_movements(created_at);

-- Step 5: Create trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger to variant_inventory
DROP TRIGGER IF EXISTS update_variant_inventory_updated_at ON public.variant_inventory;
CREATE TRIGGER update_variant_inventory_updated_at
    BEFORE UPDATE ON public.variant_inventory
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Step 6: Create function to check low stock and create alerts
CREATE OR REPLACE FUNCTION check_low_stock_after_update()
RETURNS TRIGGER AS $$
DECLARE
    alert_count integer;
BEGIN
    -- Check if stock is now low or out of stock
    IF NEW.quantity <= NEW.low_stock_threshold THEN
        -- Check if there's already an unread alert
        SELECT COUNT(*) INTO alert_count
        FROM public.low_stock_alerts
        WHERE variant_id = NEW.variant_id
          AND is_read = false
          AND is_resolved = false;

        IF alert_count = 0 THEN
            INSERT INTO public.low_stock_alerts (variant_id, product_id, current_stock, low_stock_threshold)
            VALUES (
                NEW.variant_id,
                (SELECT product_id FROM public.product_variants WHERE id = NEW.variant_id),
                NEW.quantity,
                NEW.low_stock_threshold
            );
        END IF;
    END IF;

    -- If stock was resolved (increased above threshold), mark alert as resolved
    IF NEW.quantity > NEW.low_stock_threshold THEN
        UPDATE public.low_stock_alerts
        SET is_resolved = true, resolved_at = NOW()
        WHERE variant_id = NEW.variant_id
          AND is_resolved = false;
    END IF;

    RETURN NEW;
END;
$$ language 'plpgsql';

-- Attach trigger for auto low stock checking
DROP TRIGGER IF EXISTS check_low_stock_trigger ON public.variant_inventory;
CREATE TRIGGER check_low_stock_trigger
    AFTER UPDATE ON public.variant_inventory
    FOR EACH ROW
    EXECUTE FUNCTION check_low_stock_after_update();

-- Step 7: Enable RLS on all new tables
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

-- Step 8: Create RLS policies
-- Admins can view all
CREATE POLICY "Admins can view all variants" ON public.product_variants
    FOR SELECT USING (true);
    
CREATE POLICY "Admins can view all inventory" ON public.variant_inventory
    FOR SELECT USING (true);

CREATE POLICY "Admins can view all alerts" ON public.low_stock_alerts
    FOR SELECT USING (true);

CREATE POLICY "Admins can view all movements" ON public.inventory_movements
    FOR SELECT USING (true);

-- Success message
SELECT 'Migration completed successfully!' AS status, 
       'Tables created: product_variants, variant_inventory, low_stock_alerts, inventory_movements' AS details;
