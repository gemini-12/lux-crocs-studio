ALTER TABLE public.products ADD COLUMN IF NOT EXISTS brand text NOT NULL DEFAULT 'crocs';
UPDATE public.products SET brand = 'crocs' WHERE brand IS NULL OR brand = '';
CREATE INDEX IF NOT EXISTS products_brand_order_idx ON public.products (brand, display_order);