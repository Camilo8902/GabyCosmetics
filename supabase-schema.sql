-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.addresses (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  full_name character varying NOT NULL,
  phone character varying NOT NULL,
  address_line1 character varying NOT NULL,
  address_line2 character varying,
  city character varying NOT NULL,
  state character varying NOT NULL,
  postal_code character varying NOT NULL,
  country character varying NOT NULL DEFAULT 'México'::character varying,
  is_default boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT addresses_pkey PRIMARY KEY (id),
  CONSTRAINT addresses_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.cart_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid,
  session_id character varying,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT cart_items_pkey PRIMARY KEY (id),
  CONSTRAINT cart_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT cart_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  name character varying NOT NULL,
  name_en character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text,
  description_en text,
  image_url text,
  parent_id uuid,
  order_index integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id),
  CONSTRAINT categories_parent_id_fkey FOREIGN KEY (parent_id) REFERENCES public.categories(id)
);
CREATE TABLE public.category_attributes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  category_id uuid NOT NULL,
  name character varying NOT NULL,
  name_en character varying NOT NULL,
  type character varying NOT NULL CHECK (type::text = ANY (ARRAY['text'::character varying, 'number'::character varying, 'select'::character varying, 'multiselect'::character varying, 'boolean'::character varying]::text[])),
  options jsonb,
  is_required boolean DEFAULT false,
  is_filterable boolean DEFAULT true,
  order_index integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT category_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT category_attributes_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.companies (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  company_name character varying NOT NULL,
  logo_url text,
  description text,
  website character varying,
  phone character varying,
  address text,
  is_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  slug character varying UNIQUE,
  email character varying UNIQUE,
  plan character varying DEFAULT 'basic'::character varying CHECK (plan IS NULL OR (plan::text = ANY (ARRAY['basic'::character varying, 'premium'::character varying, 'enterprise'::character varying]::text[]))),
  status character varying DEFAULT 'pending'::character varying CHECK (status IS NULL OR (status::text = ANY (ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'suspended'::character varying, 'active'::character varying]::text[]))),
  tax_id character varying,
  business_type character varying,
  fiscal_address jsonb,
  headquarters_address jsonb,
  cover_image_url text,
  short_description character varying,
  social_links jsonb DEFAULT '{"tiktok": null, "twitter": null, "youtube": null, "facebook": null, "instagram": null}'::jsonb,
  settings jsonb DEFAULT '{"currency": "USD", "language": "es", "timezone": "America/Havana", "low_stock_alerts": true, "auto_fulfill_orders": false, "email_notifications": true, "low_stock_threshold": 10, "order_notifications": true}'::jsonb,
  metadata jsonb DEFAULT '{}'::jsonb,
  approved_at timestamp with time zone,
  approved_by uuid,
  CONSTRAINT companies_pkey PRIMARY KEY (id),
  CONSTRAINT companies_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT companies_approved_by_fkey FOREIGN KEY (approved_by) REFERENCES auth.users(id)
);
CREATE TABLE public.company_invitations (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  invited_email character varying NOT NULL,
  invited_by uuid,
  role character varying DEFAULT 'viewer'::character varying,
  permissions jsonb DEFAULT '[]'::jsonb,
  invitation_token character varying NOT NULL UNIQUE,
  expires_at timestamp with time zone NOT NULL,
  status character varying DEFAULT 'pending'::character varying CHECK (status::text = ANY (ARRAY['pending'::character varying, 'accepted'::character varying, 'expired'::character varying, 'canceled'::character varying]::text[])),
  personal_message text,
  accepted_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_invitations_pkey PRIMARY KEY (id),
  CONSTRAINT company_invitations_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_invitations_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.company_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  business_name character varying NOT NULL,
  owner_name character varying NOT NULL,
  email character varying NOT NULL,
  phone character varying,
  business_type character varying,
  products_count character varying,
  message text,
  status character varying DEFAULT 'pending'::character varying,
  notes text,
  reviewed_by uuid,
  reviewed_at timestamp with time zone,
  submitted_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_requests_pkey PRIMARY KEY (id),
  CONSTRAINT company_requests_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES auth.users(id)
);
CREATE TABLE public.company_users (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL,
  user_id uuid NOT NULL,
  role character varying NOT NULL DEFAULT 'viewer'::character varying,
  permissions jsonb DEFAULT '[]'::jsonb,
  status character varying DEFAULT 'invited'::character varying CHECK (status::text = ANY (ARRAY['invited'::character varying, 'active'::character varying, 'inactive'::character varying, 'removed'::character varying]::text[])),
  invited_at timestamp with time zone DEFAULT now(),
  hired_at timestamp with time zone,
  removed_at timestamp with time zone,
  invited_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT company_users_pkey PRIMARY KEY (id),
  CONSTRAINT company_users_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id),
  CONSTRAINT company_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT company_users_invited_by_fkey FOREIGN KEY (invited_by) REFERENCES auth.users(id)
);
CREATE TABLE public.coupons (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  code character varying NOT NULL UNIQUE,
  description text,
  discount_type character varying NOT NULL CHECK (discount_type::text = ANY (ARRAY['percentage'::character varying, 'fixed'::character varying]::text[])),
  discount_value numeric NOT NULL CHECK (discount_value > 0::numeric),
  min_purchase numeric,
  max_uses integer,
  current_uses integer DEFAULT 0,
  starts_at timestamp with time zone,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT coupons_pkey PRIMARY KEY (id)
);
CREATE TABLE public.inventory (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL UNIQUE,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  low_stock_threshold integer DEFAULT 10,
  track_inventory boolean DEFAULT true,
  allow_backorder boolean DEFAULT false,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_pkey PRIMARY KEY (id),
  CONSTRAINT inventory_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.inventory_movements (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL,
  movement_type character varying NOT NULL,
  quantity_change integer NOT NULL,
  previous_quantity integer NOT NULL,
  new_quantity integer NOT NULL,
  reason text,
  reference_id character varying,
  created_by uuid,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT inventory_movements_pkey PRIMARY KEY (id),
  CONSTRAINT fk_movements_variant FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.low_stock_alerts (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL,
  product_id uuid NOT NULL,
  current_stock integer NOT NULL,
  low_stock_threshold integer NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  is_resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT low_stock_alerts_pkey PRIMARY KEY (id),
  CONSTRAINT fk_alerts_variant FOREIGN KEY (variant_id) REFERENCES public.product_variants(id),
  CONSTRAINT fk_alerts_product FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.newsletter_subscribers (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  email character varying NOT NULL UNIQUE,
  is_active boolean DEFAULT true,
  subscribed_at timestamp with time zone DEFAULT now(),
  CONSTRAINT newsletter_subscribers_pkey PRIMARY KEY (id)
);
CREATE TABLE public.order_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  order_id uuid NOT NULL,
  product_id uuid,
  company_id uuid,
  quantity integer NOT NULL CHECK (quantity > 0),
  unit_price numeric NOT NULL,
  total_price numeric NOT NULL,
  product_name character varying NOT NULL,
  product_image text,
  CONSTRAINT order_items_pkey PRIMARY KEY (id),
  CONSTRAINT order_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT order_items_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.orders (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  email character varying NOT NULL,
  total numeric NOT NULL,
  status character varying NOT NULL DEFAULT 'pending'::character varying,
  payment_intent_id character varying UNIQUE,
  shipping_name character varying NOT NULL,
  shipping_email character varying NOT NULL,
  shipping_phone character varying,
  shipping_address character varying NOT NULL,
  shipping_city character varying NOT NULL,
  shipping_zip character varying,
  shipping_country character varying NOT NULL,
  items jsonb NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  paid_at timestamp with time zone,
  CONSTRAINT orders_pkey PRIMARY KEY (id),
  CONSTRAINT orders_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.product_attributes (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  category_attribute_id uuid NOT NULL,
  value text NOT NULL,
  CONSTRAINT product_attributes_pkey PRIMARY KEY (id),
  CONSTRAINT product_attributes_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_attributes_category_attribute_id_fkey FOREIGN KEY (category_attribute_id) REFERENCES public.category_attributes(id)
);
CREATE TABLE public.product_categories (
  product_id uuid NOT NULL,
  category_id uuid NOT NULL,
  CONSTRAINT product_categories_pkey PRIMARY KEY (product_id, category_id),
  CONSTRAINT product_categories_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT product_categories_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  url text NOT NULL,
  alt_text character varying,
  order_index integer DEFAULT 0,
  is_primary boolean DEFAULT false,
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.product_variants (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL,
  sku character varying NOT NULL UNIQUE,
  name character varying NOT NULL,
  name_en character varying DEFAULT ''::character varying,
  price numeric NOT NULL DEFAULT 0,
  compare_at_price numeric,
  cost_price numeric,
  barcode character varying,
  weight numeric,
  is_active boolean NOT NULL DEFAULT true,
  sort_order integer DEFAULT 0,
  attributes jsonb DEFAULT '{}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_variants_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  company_id uuid,
  name character varying NOT NULL,
  name_en character varying NOT NULL,
  slug character varying NOT NULL UNIQUE,
  description text NOT NULL,
  description_en text NOT NULL,
  short_description text,
  short_description_en text,
  price numeric NOT NULL CHECK (price >= 0::numeric),
  compare_at_price numeric CHECK (compare_at_price >= 0::numeric),
  cost_price numeric CHECK (cost_price >= 0::numeric),
  sku character varying,
  barcode character varying,
  weight numeric,
  is_active boolean DEFAULT true,
  is_featured boolean DEFAULT false,
  is_visible boolean DEFAULT true,
  sales_count integer DEFAULT 0,
  view_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  status character varying DEFAULT 'draft'::character varying CHECK (status IS NULL OR (status::text = ANY (ARRAY['draft'::character varying, 'active'::character varying, 'inactive'::character varying, 'archived'::character varying]::text[]))),
  image_url text,
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  product_id uuid NOT NULL,
  user_id uuid NOT NULL,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title character varying,
  comment text,
  is_verified_purchase boolean DEFAULT false,
  is_approved boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.site_settings (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  key character varying NOT NULL UNIQUE,
  value text NOT NULL,
  type character varying NOT NULL DEFAULT 'string'::character varying CHECK (type::text = ANY (ARRAY['string'::character varying, 'number'::character varying, 'boolean'::character varying, 'json'::character varying]::text[])),
  description text,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT site_settings_pkey PRIMARY KEY (id)
);
CREATE TABLE public.static_content (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  hero jsonb,
  promise jsonb,
  testimonials jsonb,
  footer jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT static_content_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscription_plans (
  id character varying NOT NULL,
  name character varying NOT NULL,
  description text,
  price_monthly numeric NOT NULL,
  price_yearly numeric NOT NULL,
  features jsonb NOT NULL,
  limits jsonb NOT NULL,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscription_plans_pkey PRIMARY KEY (id)
);
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL UNIQUE,
  plan character varying NOT NULL DEFAULT 'basic'::character varying CHECK (plan::text = ANY (ARRAY['basic'::character varying, 'premium'::character varying, 'enterprise'::character varying]::text[])),
  status character varying DEFAULT 'active'::character varying CHECK (status::text = ANY (ARRAY['active'::character varying, 'canceled'::character varying, 'past_due'::character varying, 'trialing'::character varying, 'paused'::character varying, 'incomplete'::character varying]::text[])),
  stripe_customer_id character varying,
  stripe_subscription_id character varying,
  stripe_price_id character varying,
  current_period_start timestamp with time zone,
  current_period_end timestamp with time zone,
  trial_end timestamp with time zone,
  cancel_at_period_end boolean DEFAULT false,
  canceled_at timestamp with time zone,
  limits jsonb DEFAULT '{"users": 1, "products": 100, "storage_gb": 5, "orders_per_month": 500}'::jsonb,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT subscriptions_pkey PRIMARY KEY (id),
  CONSTRAINT subscriptions_company_id_fkey FOREIGN KEY (company_id) REFERENCES public.companies(id)
);
CREATE TABLE public.users (
  id uuid NOT NULL,
  email character varying NOT NULL UNIQUE,
  full_name character varying NOT NULL,
  avatar_url text,
  role character varying NOT NULL DEFAULT 'customer'::character varying CHECK (role::text = ANY (ARRAY['admin'::character varying, 'company'::character varying, 'consultant'::character varying, 'customer'::character varying]::text[])),
  phone character varying,
  email_verified boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.variant_inventory (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  variant_id uuid NOT NULL UNIQUE,
  quantity integer NOT NULL DEFAULT 0,
  reserved_quantity integer NOT NULL DEFAULT 0,
  low_stock_threshold integer NOT NULL DEFAULT 10,
  track_inventory boolean NOT NULL DEFAULT true,
  allow_backorder boolean NOT NULL DEFAULT false,
  location character varying,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT variant_inventory_pkey PRIMARY KEY (id),
  CONSTRAINT fk_variant_inventory_variant FOREIGN KEY (variant_id) REFERENCES public.product_variants(id)
);
CREATE TABLE public.wishlist_items (
  id uuid NOT NULL DEFAULT uuid_generate_v4(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT wishlist_items_pkey PRIMARY KEY (id),
  CONSTRAINT wishlist_items_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT wishlist_items_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);