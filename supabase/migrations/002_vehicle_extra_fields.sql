-- ═══════════════════════════════════════
--  LoteCUU — Campos adicionales de vehículo
-- ═══════════════════════════════════════

ALTER TABLE vehicles
  ADD COLUMN IF NOT EXISTS has_debt       boolean,
  ADD COLUMN IF NOT EXISTS single_owner   boolean,
  ADD COLUMN IF NOT EXISTS origin         text CHECK (origin IN ('nacional', 'importado')),
  ADD COLUMN IF NOT EXISTS doors          integer,
  ADD COLUMN IF NOT EXISTS cylinders      integer,
  ADD COLUMN IF NOT EXISTS drive_type     text;  -- '4x2', '4x4', etc.
