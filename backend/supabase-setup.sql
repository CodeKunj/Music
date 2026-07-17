-- ================================================================
-- Kunj Rana Music Portfolio — Supabase Setup SQL
-- Run this in: Supabase Dashboard → SQL Editor → New Query
-- ================================================================

-- ── TRACKS ──────────────────────────────────────────────────────
create table if not exists public.tracks (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  artist      text not null default 'Kunj Rana',
  genre       text,
  cover_url   text,
  audio_url   text,
  duration    text,
  description text,
  is_featured boolean not null default false,
  play_count  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- Only one track can be featured at a time
create unique index if not exists tracks_featured_unique
  on public.tracks (is_featured)
  where is_featured = true;

-- ── SERVICES ────────────────────────────────────────────────────
create table if not exists public.services (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  description text,
  icon        text default 'mixing',
  features    jsonb not null default '[]'::jsonb,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now()
);

-- ── TESTIMONIALS ─────────────────────────────────────────────────
create table if not exists public.testimonials (
  id         uuid primary key default gen_random_uuid(),
  name       text not null,
  role       text,
  quote      text,
  avatar_url text,
  rating     integer not null default 5 check (rating between 1 and 5),
  is_active  boolean not null default true,
  created_at timestamptz not null default now()
);

-- ── BEFORE / AFTER PROJECTS ────────────────────────────────────
create table if not exists public.before_after_projects (
  id               uuid primary key default gen_random_uuid(),
  project_name     text not null,
  artist           text,
  before_audio_url text,
  after_audio_url  text,
  created_at       timestamptz not null default now()
);

-- ── CONTACT SUBMISSIONS ─────────────────────────────────────────
create table if not exists public.contact_submissions (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  email        text not null,
  project_type text,
  budget       text,
  message      text,
  is_read      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ── ROW LEVEL SECURITY ──────────────────────────────────────────
-- Enable RLS on all tables
alter table public.tracks                enable row level security;
alter table public.services              enable row level security;
alter table public.testimonials          enable row level security;
alter table public.before_after_projects enable row level security;
alter table public.contact_submissions   enable row level security;

-- Public read access (anon role can SELECT)
create policy "Public read tracks"
  on public.tracks for select using (true);

create policy "Public read services"
  on public.services for select using (true);

create policy "Public read testimonials"
  on public.testimonials for select using (is_active = true);

create policy "Public read before_after"
  on public.before_after_projects for select using (true);

-- Contact submissions: anyone can INSERT, only service_role reads
create policy "Anyone can submit contact"
  on public.contact_submissions for insert with check (true);

-- ── STORAGE BUCKETS ─────────────────────────────────────────────
-- Run these separately in the Supabase Dashboard → Storage
-- OR via the JS SDK in your admin panel setup

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('audio',   'audio',   true, 52428800, array['audio/mpeg','audio/mp3','audio/wav','audio/ogg','audio/flac','audio/aac']),
  ('covers',  'covers',  true, 5242880,  array['image/jpeg','image/jpg','image/png','image/webp']),
  ('avatars', 'avatars', true, 2097152,  array['image/jpeg','image/jpg','image/png','image/webp'])
on conflict (id) do nothing;

-- Public storage policies
create policy "Public audio read"
  on storage.objects for select
  using (bucket_id = 'audio');

create policy "Public covers read"
  on storage.objects for select
  using (bucket_id = 'covers');

create policy "Public avatars read"
  on storage.objects for select
  using (bucket_id = 'avatars');

-- ── SEED DATA — Default Services ────────────────────────────────
insert into public.services (name, description, icon, features, sort_order) values
(
  'Mixing',
  'Professional multi-track mixing that balances every element into a cohesive, powerful sound.',
  'mixing',
  '["Up to 32 tracks","EQ, Compression & FX","2 free revisions","Stereo WAV delivery"]',
  1
),
(
  'Mastering',
  'Industry-standard mastering that makes your music translate perfectly on every platform.',
  'mastering',
  '["Loudness optimization (LUFS)","True peak limiting","Streaming-ready formats","24-bit WAV + MP3"]',
  2
),
(
  'Music Production',
  'Complete beat-to-finished-track production tailored to your genre and artistic identity.',
  'production',
  '["Custom beat production","Genre-specific sound design","Stem files included","Full rights transfer"]',
  3
),
(
  'Podcast Editing',
  'Crisp, professional podcast audio that keeps listeners engaged from start to finish.',
  'podcast',
  '["Noise reduction","Silence trimming & pacing","Intro/outro music","MP3 + WAV delivery"]',
  4
),
(
  'Audio Cleanup',
  'Remove unwanted noise, clicks, hum, and artifacts from any recording.',
  'cleanup',
  '["Click & pop removal","Room noise elimination","De-essing & breath control","48-hr turnaround"]',
  5
)
on conflict do nothing;
