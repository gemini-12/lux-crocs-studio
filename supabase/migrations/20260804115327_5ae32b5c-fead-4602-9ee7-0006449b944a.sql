CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price text NOT NULL DEFAULT '',
  category text NOT NULL DEFAULT 'Classic Clog',
  color_name text NOT NULL DEFAULT '',
  eyebrow text NOT NULL DEFAULT '',
  release_label text NOT NULL DEFAULT '',
  alt_text text NOT NULL DEFAULT '',
  sizes text[] NOT NULL DEFAULT ARRAY['38','39','40','41','42','43','44'],
  colors jsonb NOT NULL DEFAULT '[]'::jsonb,
  hero_image text NOT NULL DEFAULT '',
  gallery_images text[] NOT NULL DEFAULT '{}',
  accent text NOT NULL DEFAULT 'oklch(0.75 0.03 250)',
  glow text NOT NULL DEFAULT 'oklch(0.85 0.02 240 / 0.22)',
  bg_from text NOT NULL DEFAULT 'oklch(0.19 0.01 250)',
  bg_to text NOT NULL DEFAULT 'oklch(0.08 0.005 250)',
  ink text NOT NULL DEFAULT 'oklch(0.97 0.002 250)',
  display_order integer NOT NULL DEFAULT 0,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.products TO anon;
GRANT SELECT ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active products are publicly viewable"
ON public.products FOR SELECT
TO anon, authenticated
USING (is_active = true);

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER products_set_updated_at
BEFORE UPDATE ON public.products
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE INDEX products_display_order_idx ON public.products (display_order);

INSERT INTO public.products (slug, name, description, price, color_name, eyebrow, release_label, alt_text, hero_image, colors, accent, glow, bg_from, bg_to, ink, display_order) VALUES
('lightning','Cars Classic Clog','Racing lacquer, hand-applied decals and a silhouette built for speed on any surface.','€240','Racing Red','Collection 01','Limited Release — 500 pairs','Red Cars Classic Clog collectible Crocs with racing decals','/__l5e/assets-v1/a7fa6c3c-e6d7-43a8-83bf-85c45970f8b3/21326256_53153321_1000-removebg-preview.png','[{"name":"Racing Red","hex":"#c62828"}]'::jsonb,'oklch(0.62 0.23 27)','oklch(0.62 0.23 27 / 0.38)','oklch(0.17 0.05 25)','oklch(0.09 0.02 20)','oklch(0.98 0.01 30)',1),
('citrus','SpongeBob SquarePants Classic Clog','High-voltage yellow over a tangerine midsole. Loud, precise, unmistakable.','€230','High-Voltage Yellow','Collection 02','Limited Release — 400 pairs','Yellow SpongeBob SquarePants Classic Clog collectible Crocs with orange sole','/__l5e/assets-v1/c31d98d0-6faf-42dd-bca6-58c1d013ea9e/crocs_classic_clog_spongebob_schwammkopf-removebg-preview.png','[{"name":"High-Voltage Yellow","hex":"#f2c200"}]'::jsonb,'oklch(0.85 0.18 100)','oklch(0.88 0.17 100 / 0.3)','oklch(0.22 0.05 95)','oklch(0.1 0.02 90)','oklch(0.99 0.02 100)',2),
('phantom','Batman Classic Clog','Monolithic black-on-black. Matte body, gloss chassis, near-invisible detailing.','€310','Phantom Black','Collection 03','Limited Release — 150 pairs','All black Batman Classic Clog collectible Crocs','/__l5e/assets-v1/1468bd5b-80c6-49b4-aabc-7ed738bd907b/31818538_62158415_1000-removebg-preview.png','[{"name":"Phantom Black","hex":"#1a1a1a"}]'::jsonb,'oklch(0.75 0.03 250)','oklch(0.85 0.02 240 / 0.22)','oklch(0.19 0.01 250)','oklch(0.08 0.005 250)','oklch(0.97 0.002 250)',3),
('rust','Rose Blush Classic Clog','Weathered copper patina with sculpted chrome hardware. An object with mileage.','€255','Rose Blush','Collection 04','Limited Release — 220 pairs','Rose Blush Classic Clog collectible Crocs with sculpted detailing','/__l5e/assets-v1/9cf30b17-c11f-4d95-a33c-94c9b8aca5f7/CRO209376-0DA_1200x-removebg-preview.png','[{"name":"Rose Blush","hex":"#a4643c"}]'::jsonb,'oklch(0.68 0.15 55)','oklch(0.7 0.14 60 / 0.32)','oklch(0.21 0.04 60)','oklch(0.1 0.02 50)','oklch(0.98 0.01 70)',4),
('blossom','Patrick Star Classic Clog','Soft pastel resin cut with acid citrus blocks. Playful proportion, couture finish.','€265','Pastel Pink','Collection 05','Limited Release — 300 pairs','Pink Patrick Star Classic Clog collectible Crocs with lilac and yellow sole','/__l5e/assets-v1/02ef6bc1-bf81-4ed5-abf6-0ab66bf5f9fe/23930324_54101768_1000-removebg-preview.png','[{"name":"Pastel Pink","hex":"#f2a0c0"}]'::jsonb,'oklch(0.78 0.15 5)','oklch(0.8 0.14 350 / 0.35)','oklch(0.23 0.06 340)','oklch(0.11 0.03 330)','oklch(0.98 0.01 340)',5);