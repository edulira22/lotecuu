-- Migración 005 · Números alternos del vendedor y detalles de financiamiento
-- Ejecutar en Supabase → SQL Editor → Nueva pestaña.
-- Todas las columnas son opcionales: el sitio funciona igual sin datos en ellas.

ALTER TABLE public.sellers
  ADD COLUMN IF NOT EXISTS whatsapp2 TEXT,
  ADD COLUMN IF NOT EXISTS phone2    TEXT;

ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS financing_details TEXT;
