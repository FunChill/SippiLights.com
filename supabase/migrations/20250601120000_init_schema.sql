-- Sippi Lights — Phase 3 schema: inventory, bookings, availability blocks
create extension if not exists "pgcrypto";

create table inventory_items (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null check (category in ('letter', 'number', 'uplighting', 'stage')),
  char_value char(1),
  finish text check (finish in ('white', 'black')),
  price numeric,
  qty_owned int not null default 1,
  active bool not null default true
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event_date date not null,
  status text not null default 'inquiry'
    check (status in ('inquiry', 'pending_deposit', 'confirmed', 'completed', 'cancelled')),
  customer_name text not null,
  customer_phone text not null,
  customer_email text not null,
  event_type text,
  indoor_outdoor text,
  venue_address text,
  distance_miles numeric,
  items jsonb not null default '[]'::jsonb,
  word_built text,
  led_color text,
  subtotal numeric,
  deposit_due numeric,
  deposit_paid bool not null default false,
  notes text
);

create table availability_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  reason text
);

create index bookings_event_date_idx on bookings (event_date);
create index bookings_status_idx on bookings (status);
create index availability_blocks_date_idx on availability_blocks (date);
