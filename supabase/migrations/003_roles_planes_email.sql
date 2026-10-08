-- Migración 003 · Roles, planes, gestión de pagos y correo de vendedor
-- (Ya aplicada en producción — se guarda aquí como historial.)

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS auth_user_id   UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS plan           TEXT NOT NULL DEFAULT 'basico'
    CHECK (plan IN ('basico', 'pro', 'premium')),
  ADD COLUMN IF NOT EXISTS max_vehicles   INT NOT NULL DEFAULT 5,
  ADD COLUMN IF NOT EXISTS payment_status TEXT NOT NULL DEFAULT 'al_corriente'
    CHECK (payment_status IN ('al_corriente', 'atrasado', 'suspendido')),
  ADD COLUMN IF NOT EXISTS payment_notes  TEXT,
  ADD COLUMN IF NOT EXISTS plan_expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email          TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS sellers_auth_user_uniq
  ON public.sellers(auth_user_id)
  WHERE auth_user_id IS NOT NULL;

CREATE OR REPLACE FUNCTION public.my_seller_id()
RETURNS UUID LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT id FROM public.sellers WHERE auth_user_id = auth.uid() LIMIT 1;
$$;

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT auth.uid() IS NOT NULL
    AND NOT EXISTS (SELECT 1 FROM public.sellers WHERE auth_user_id = auth.uid());
$$;

ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read" ON public.vehicles;
DROP POLICY IF EXISTS "Auth manage" ON public.vehicles;
CREATE POLICY "Public read" ON public.vehicles FOR SELECT
  USING (status IN ('published','reserved','sold')
      OR seller_id = public.my_seller_id()
      OR public.is_admin());
CREATE POLICY "Auth manage" ON public.vehicles FOR ALL TO authenticated
  USING      (seller_id = public.my_seller_id() OR public.is_admin())
  WITH CHECK (seller_id = public.my_seller_id() OR public.is_admin());

ALTER TABLE public.sellers ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read active" ON public.sellers;
DROP POLICY IF EXISTS "Auth manage sellers" ON public.sellers;
CREATE POLICY "Public read active" ON public.sellers FOR SELECT
  USING (active = true OR id = public.my_seller_id() OR public.is_admin());
CREATE POLICY "Auth manage sellers" ON public.sellers FOR ALL TO authenticated
  USING      (id = public.my_seller_id() OR public.is_admin())
  WITH CHECK (id = public.my_seller_id() OR public.is_admin());

ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read photos" ON public.vehicle_photos;
DROP POLICY IF EXISTS "Auth manage photos" ON public.vehicle_photos;
CREATE POLICY "Public read photos" ON public.vehicle_photos FOR SELECT USING (true);
CREATE POLICY "Auth manage photos" ON public.vehicle_photos FOR ALL TO authenticated
  USING (EXISTS(SELECT 1 FROM vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())))
  WITH CHECK (EXISTS(SELECT 1 FROM vehicles v WHERE v.id = vehicle_id
    AND (v.seller_id = public.my_seller_id() OR public.is_admin())));
