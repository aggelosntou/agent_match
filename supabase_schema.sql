-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- ── Profiles ──────────────────────────────────────────────────────────────────
-- Extends Supabase Auth users with app-specific profile data
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  location text not null,
  skill_level text not null check (skill_level in ('beginner', 'intermediate', 'advanced')),
  interests text[] not null default '{}',
  availability text[] not null default '{}',
  avatar_url text,
  bio text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Connect Requests ──────────────────────────────────────────────────────────
create table if not exists connect_requests (
  id uuid primary key default uuid_generate_v4(),
  from_user_id uuid not null references profiles(id) on delete cascade,
  to_user_id uuid not null references profiles(id) on delete cascade,
  activity text,
  message text,
  status text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at timestamptz not null default now(),
  unique(from_user_id, to_user_id)
);

-- ── Messages ──────────────────────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default uuid_generate_v4(),
  request_id uuid not null references connect_requests(id) on delete cascade,
  sender_id uuid not null references profiles(id) on delete cascade,
  content text not null,
  created_at timestamptz not null default now()
);

-- ── Storage bucket for avatars ────────────────────────────────────────────────
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table profiles enable row level security;
alter table connect_requests enable row level security;
alter table messages enable row level security;

-- Profiles: anyone can read, only owner can write
create policy "Profiles are publicly readable"
  on profiles for select using (true);

create policy "Users can insert their own profile"
  on profiles for insert with check (auth.uid() = id);

create policy "Users can update their own profile"
  on profiles for update using (auth.uid() = id);

-- Connect requests: involved users can read
create policy "Users can see their own connect requests"
  on connect_requests for select
  using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can send connect requests"
  on connect_requests for insert
  with check (auth.uid() = from_user_id);

create policy "Recipients can update request status"
  on connect_requests for update
  using (auth.uid() = to_user_id);

-- Messages: only participants in the request can read/write
create policy "Participants can read messages"
  on messages for select
  using (
    exists (
      select 1 from connect_requests cr
      where cr.id = request_id
      and (cr.from_user_id = auth.uid() or cr.to_user_id = auth.uid())
    )
  );

create policy "Participants can send messages"
  on messages for insert
  with check (
    auth.uid() = sender_id and
    exists (
      select 1 from connect_requests cr
      where cr.id = request_id
      and cr.status = 'accepted'
      and (cr.from_user_id = auth.uid() or cr.to_user_id = auth.uid())
    )
  );

-- Storage: anyone can read avatars, authenticated users can upload their own
create policy "Avatar images are publicly accessible"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "Users can upload their own avatar"
  on storage.objects for insert
  with check (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

create policy "Users can update their own avatar"
  on storage.objects for update
  using (bucket_id = 'avatars' and auth.uid()::text = (storage.foldername(name))[1]);

-- ── Auto-update updated_at ────────────────────────────────────────────────────
create or replace function update_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger profiles_updated_at
  before update on profiles
  for each row execute function update_updated_at();
