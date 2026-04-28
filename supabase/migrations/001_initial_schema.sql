-- ═══════════════════════════════════════
--  LoteCUU — Schema inicial
-- ═══════════════════════════════════════

-- ── Sellers ──────────────────────────────
create table if not exists sellers (
  id                uuid primary key default gen_random_uuid(),
  name              text not null,
  business_name     text,
  slug              text unique not null,
  whatsapp          text not null,
  phone             text,
  logo_url          text,
  profile_photo_url text,
  description       text,
  address           text,
  google_maps_url   text,
  active            boolean not null default true,
  created_at        timestamptz not null default now()
);

-- ── Vehicles ─────────────────────────────
create table if not exists vehicles (
  id            uuid primary key default gen_random_uuid(),
  seller_id     uuid not null references sellers(id) on delete cascade,
  slug          text unique not null,
  title         text not null,
  brand         text,
  model         text,
  version       text,
  year          integer,
  price         numeric,
  mileage       integer,
  transmission  text,
  fuel          text,
  body_type     text,
  color         text,
  condition     text,
  legal_status  text,
  plates_state  text,
  debt_status   text,
  negotiable    boolean,
  accepts_trade boolean,
  financing     boolean,
  description   text,
  status        text not null default 'draft'
                  check (status in ('published','hidden','draft','sold','reserved')),
  featured      boolean not null default false,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

-- Auto-update updated_at
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vehicles_updated_at
  before update on vehicles
  for each row execute function update_updated_at();

-- ── Vehicle Photos ────────────────────────
create table if not exists vehicle_photos (
  id            uuid primary key default gen_random_uuid(),
  vehicle_id    uuid not null references vehicles(id) on delete cascade,
  url           text not null,
  storage_path  text not null,
  sort_order    integer not null default 0,
  is_cover      boolean not null default false,
  alt_text      text,
  created_at    timestamptz not null default now()
);

-- ── Vehicle Events ────────────────────────
create table if not exists vehicle_events (
  id          uuid primary key default gen_random_uuid(),
  vehicle_id  uuid not null references vehicles(id) on delete cascade,
  seller_id   uuid references sellers(id),
  event_type  text not null
                check (event_type in ('view','whatsapp_click','share_click')),
  created_at  timestamptz not null default now()
);

-- ── Indexes ───────────────────────────────
create index if not exists idx_vehicles_status    on vehicles(status);
create index if not exists idx_vehicles_seller_id on vehicles(seller_id);
create index if not exists idx_vehicles_featured  on vehicles(featured);
create index if not exists idx_photos_vehicle_id  on vehicle_photos(vehicle_id, sort_order);
create index if not exists idx_events_vehicle_id  on vehicle_events(vehicle_id);
create index if not exists idx_events_created_at  on vehicle_events(created_at);

-- ════════════════════════════════════════
--  Row Level Security
-- ════════════════════════════════════════

alter table sellers       enable row level security;
alter table vehicles      enable row level security;
alter table vehicle_photos enable row level security;
alter table vehicle_events enable row level security;

-- ── Sellers: lectura pública de activos ──
create policy "sellers_public_read" on sellers
  for select using (active = true);

create policy "sellers_admin_all" on sellers
  for all using (auth.role() = 'authenticated');

-- ── Vehicles: lectura pública de publicados ──
create policy "vehicles_public_read" on vehicles
  for select using (status = 'published');

create policy "vehicles_admin_all" on vehicles
  for all using (auth.role() = 'authenticated');

-- ── Photos: lectura pública ──
create policy "photos_public_read" on vehicle_photos
  for select using (true);

create policy "photos_admin_all" on vehicle_photos
  for all using (auth.role() = 'authenticated');

-- ── Events: insert anónimo, lectura solo admin ──
create policy "events_public_insert" on vehicle_events
  for insert with check (true);

create policy "events_admin_read" on vehicle_events
  for select using (auth.role() = 'authenticated');

-- ════════════════════════════════════════
--  Storage buckets (ejecutar como admin)
-- ════════════════════════════════════════

-- insert into storage.buckets (id, name, public)
--   values ('vehicle-photos', 'vehicle-photos', true)
--   on conflict do nothing;
--
-- insert into storage.buckets (id, name, public)
--   values ('seller-assets', 'seller-assets', true)
--   on conflict do nothing;
