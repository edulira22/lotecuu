-- Migración 004 · Posturas de foto (frontal, trasera, tablero, etc.)
-- Ejecutar en Supabase → SQL Editor → Nueva pestaña.
-- Nullable: las fotos sin postura siguen funcionando igual.

ALTER TABLE public.vehicle_photos
  ADD COLUMN IF NOT EXISTS angle TEXT;
