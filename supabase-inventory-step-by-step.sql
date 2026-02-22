-- ==========================================
-- STEP-BY-STEP INVENTORY MIGRATION
-- Run these commands one by one in Supabase SQL Editor
-- ==========================================

-- STEP 1: Create product_variants table
CREATE TABLE IF NOT EXISTS public.product_variants (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    product_id uuid NOT NULL,
    sku character varying NOT NULL,
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

-- Add primary key constraint
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pk_product_variants' 
        AND table_name = 'product_variants'
    ) THEN
        ALTER TABLE public.product_variants 
        ADD CONSTRAINT pk_product_variants PRIMARY KEY (id);
    END IF;
END $$;

-- Create unique constraint on sku
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_product_variants_sku' 
        AND table_name = 'product_variants'
    ) THEN
        ALTER TABLE public.product_variants 
        ADD CONSTRAINT uq_product_variants_sku UNIQUE (sku);
    END IF;
END $$;

-- Add index
CREATE INDEX IF NOT EXISTS idx_product_variants_product_id 
ON public.product_variants(product_id);

-- ==========================================
-- STEP 2: Create variant_inventory table (without FK first)
-- ==========================================
CREATE TABLE IF NOT EXISTS public.variant_inventory (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL,
    quantity integer NOT NULL DEFAULT 0,
    reserved_quantity integer NOT NULL DEFAULT 0,
    low_stock_threshold integer NOT NULL DEFAULT 10,
    track_inventory boolean DEFAULT true NOT NULL,
    allow_backorder boolean DEFAULT false NOT NULL,
    location character varying(100),
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Add primary key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pk_variant_inventory' 
        AND table_name = 'variant_inventory'
    ) THEN
        ALTER TABLE public.variant_inventory 
        ADD CONSTRAINT pk_variant_inventory PRIMARY KEY (id);
    END IF;
END $$;

-- Add unique constraint on variant_id
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'uq_variant_inventory_variant' 
        AND table_name = 'variant_inventory'
    ) THEN
        ALTER TABLE public.variant_inventory 
        ADD CONSTRAINT uq_variant_inventory_variant UNIQUE (variant_id);
    END IF;
END $$;

-- ==========================================
-- STEP 3: Create low_stock_alerts table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.low_stock_alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL,
    product_id uuid NOT NULL,
    current_stock integer NOT NULL,
    low_stock_threshold integer NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    is_resolved boolean DEFAULT false NOT NULL,
    resolved_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT now()
);

-- Add primary key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pk_low_stock_alerts' 
        AND table_name = 'low_stock_alerts'
    ) THEN
        ALTER TABLE public.low_stock_alerts 
        ADD CONSTRAINT pk_low_stock_alerts PRIMARY KEY (id);
    END IF;
END $$;

-- ==========================================
-- STEP 4: Create inventory_movements table
-- ==========================================
CREATE TABLE IF NOT EXISTS public.inventory_movements (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    variant_id uuid NOT NULL,
    movement_type character varying(50) NOT NULL,
    quantity_change integer NOT NULL,
    previous_quantity integer NOT NULL,
    new_quantity integer NOT NULL,
    reason text,
    reference_id character varying(255),
    created_by uuid,
    created_at timestamp with time zone DEFAULT now()
);

-- Add primary key
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'pk_inventory_movements' 
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements 
        ADD CONSTRAINT pk_inventory_movements PRIMARY KEY (id);
    END IF;
END $$;

-- ==========================================
-- STEP 5: Add Foreign Keys (after tables exist)
-- ==========================================

-- FK: variant_inventory -> product_variants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_variant_inventory_variant' 
        AND table_name = 'variant_inventory'
    ) THEN
        ALTER TABLE public.variant_inventory 
        ADD CONSTRAINT fk_variant_inventory_variant 
        FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: low_stock_alerts -> product_variants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_alerts_variant' 
        AND table_name = 'low_stock_alerts'
    ) THEN
        ALTER TABLE public.low_stock_alerts 
        ADD CONSTRAINT fk_alerts_variant 
        FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: low_stock_alerts -> products
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_alerts_product' 
        AND table_name = 'low_stock_alerts'
    ) THEN
        ALTER TABLE public.low_stock_alerts 
        ADD CONSTRAINT fk_alerts_product 
        FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
    END IF;
END $$;

-- FK: inventory_movements -> product_variants
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'fk_movements_variant' 
        AND table_name = 'inventory_movements'
    ) THEN
        ALTER TABLE public.inventory_movements 
        ADD CONSTRAINT fk_movements_variant 
        FOREIGN KEY (variant_id) REFERENCES public.product_variants(id) ON DELETE CASCADE;
    END IF;
END $$;

-- ==========================================
-- STEP 6: Create indexes
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_variant_inventory_quantity 
ON public.variant_inventory(quantity);

CREATE INDEX IF NOT EXISTS idx_low_stock_alerts_unread 
ON public.low_stock_alerts(is_read, is_resolved) 
WHERE is_read = false AND is_resolved = false;

CREATE INDEX IF NOT EXISTS idx_inventory_movements_variant 
ON public.inventory_movements(variant_id);

-- ==========================================
-- STEP 7: Enable RLS
-- ==========================================
ALTER TABLE public.product_variants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.variant_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.low_stock_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_movements ENABLE ROW LEVEL SECURITY;

SELECT 'Migration completed successfully!' AS status;
