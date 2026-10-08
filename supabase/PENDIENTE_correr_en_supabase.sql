-- ============================================================
-- TODO LO PENDIENTE EN UN SOLO PASO
-- Supabase -> SQL Editor -> pestaña nueva -> pegar todo -> Run
-- Es seguro correrlo aunque alguna parte ya se haya aplicado.
-- ============================================================

-- Correo de contacto del vendedor (de la migración 003)
ALTER TABLE public.sellers ADD COLUMN IF NOT EXISTS email TEXT;

-- Migración 004 · Posturas de foto (frontal, trasera, tablero, etc.)
-- Ejecutar en Supabase → SQL Editor → Nueva pestaña.
-- Nullable: las fotos sin postura siguen funcionando igual.

ALTER TABLE public.vehicle_photos
  ADD COLUMN IF NOT EXISTS angle TEXT;

-- Migración 005 · Números alternos del vendedor y detalles de financiamiento
-- Ejecutar en Supabase → SQL Editor → Nueva pestaña.
-- Todas las columnas son opcionales: el sitio funciona igual sin datos en ellas.

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS whatsapp2 TEXT,
  ADD COLUMN IF NOT EXISTS phone2    TEXT;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS financing_details TEXT;

-- Migración 006 · Límite de destacados, finanzas privadas y documentos por auto
-- Ejecutar en Supabase → SQL Editor → Nueva pestaña. Se puede correr varias veces.

-- ── 1. Límite de autos destacados por vendedor (0 = no puede destacar) ──
ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS max_featured INT NOT NULL DEFAULT 0;

-- ── 2. Candados en el servidor (el admin y el service role no tienen límite) ──
CREATE OR REPLACE FUNCTION public.enforce_seller_limits()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  lim_vehicles INT;
  lim_featured INT;
  used INT;
BEGIN
  IF auth.uid() IS NULL OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  SELECT max_vehicles, max_featured INTO lim_vehicles, lim_featured
  FROM public.sellers WHERE id = NEW.seller_id;

  IF TG_OP = 'INSERT' THEN
    SELECT count(*) INTO used FROM public.vehicles
    WHERE seller_id = NEW.seller_id AND status IN ('published', 'reserved', 'hidden', 'draft');
    IF used >= lim_vehicles THEN
      RAISE EXCEPTION 'Límite de autos de tu plan alcanzado (%).', lim_vehicles;
    END IF;
  END IF;

  IF NEW.featured THEN
    -- Already featured before this edit: nothing new is being claimed
    IF TG_OP = 'UPDATE' THEN
      IF OLD.featured THEN
        RETURN NEW;
      END IF;
    END IF;
    SELECT count(*) INTO used FROM public.vehicles
    WHERE seller_id = NEW.seller_id AND featured AND id <> NEW.id;
    IF used >= lim_featured THEN
      RAISE EXCEPTION 'Límite de autos destacados de tu plan alcanzado (%).', lim_featured;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS vehicles_seller_limits ON public.vehicles;
CREATE TRIGGER vehicles_seller_limits
  BEFORE INSERT OR UPDATE ON public.vehicles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_seller_limits();

-- ── 3. Finanzas privadas por auto (solo dueño y admin) ──
CREATE TABLE IF NOT EXISTS public.vehicle_private (
  vehicle_id     UUID PRIMARY KEY REFERENCES public.vehicles(id) ON DELETE CASCADE,
  purchase_price INT,
  extra_costs    INT,
  sale_price     INT,
  sold_at        DATE,
  notes          TEXT,
  updated_at     TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.vehicle_private ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin" ON public.vehicle_private;
CREATE POLICY "Owner or admin" ON public.vehicle_private FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));

-- ── 4. Documentos por auto (seguro, contrato, factura…) ──
CREATE TABLE IF NOT EXISTS public.vehicle_documents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vehicle_id   UUID NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  name         TEXT NOT NULL,
  storage_path TEXT NOT NULL,
  size_bytes   INT,
  mime_type    TEXT,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS vehicle_documents_vehicle_idx ON public.vehicle_documents(vehicle_id);
ALTER TABLE public.vehicle_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Owner or admin" ON public.vehicle_documents;
CREATE POLICY "Owner or admin" ON public.vehicle_documents FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())))
  WITH CHECK (EXISTS (SELECT 1 FROM public.vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));

-- Bucket PRIVADO (nada es público; se descarga con enlaces temporales)
INSERT INTO storage.buckets (id, name, public)
VALUES ('vehicle-docs', 'vehicle-docs', false)
ON CONFLICT (id) DO UPDATE SET public = false;

-- Ruta de archivos: vehicles/<vehicle_id>/<archivo>
DROP POLICY IF EXISTS "Docs owner or admin read"   ON storage.objects;
DROP POLICY IF EXISTS "Docs owner or admin upload" ON storage.objects;
DROP POLICY IF EXISTS "Docs owner or admin delete" ON storage.objects;
CREATE POLICY "Docs owner or admin read" ON storage.objects FOR SELECT TO authenticated
  USING (bucket_id = 'vehicle-docs' AND EXISTS (SELECT 1 FROM public.vehicles v
    WHERE v.id::text = (storage.foldername(name))[2]
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));
CREATE POLICY "Docs owner or admin upload" ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'vehicle-docs' AND EXISTS (SELECT 1 FROM public.vehicles v
    WHERE v.id::text = (storage.foldername(name))[2]
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));
CREATE POLICY "Docs owner or admin delete" ON storage.objects FOR DELETE TO authenticated
  USING (bucket_id = 'vehicle-docs' AND EXISTS (SELECT 1 FROM public.vehicles v
    WHERE v.id::text = (storage.foldername(name))[2]
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));
