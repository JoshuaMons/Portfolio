-- Fontys Business & AI Portfolio Dashboard
-- Supabase SQL schema + RLS policies

create extension if not exists pgcrypto;

-- Shared updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- Profile (admin info)
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  full_name text,
  headline text,
  bio text not null default '',
  avatar_url text,
  contact_email text,
  website_url text,
  github_url text,
  linkedin_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_profiles_updated_at on public.profiles;
create trigger set_profiles_updated_at
before update on public.profiles
for each row execute function public.set_updated_at();

alter table public.profiles enable row level security;

drop policy if exists "profiles_public_read" on public.profiles;
create policy "profiles_public_read"
on public.profiles
for select
using (true);

drop policy if exists "profiles_owner_write" on public.profiles;
create policy "profiles_owner_write"
on public.profiles
for all
using (auth.uid() = id)
with check (auth.uid() = id);

-- Automatic audit log (admin-only)
create table if not exists public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  action text not null,
  entity text not null,
  entity_id uuid,
  summary text not null default '',
  created_at timestamptz not null default now()
);

alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_owner_read" on public.audit_logs;
create policy "audit_logs_owner_read"
on public.audit_logs
for select
using (auth.uid() = owner_id);

drop policy if exists "audit_logs_owner_write" on public.audit_logs;
create policy "audit_logs_owner_write"
on public.audit_logs
for insert
with check (auth.uid() = owner_id);

drop policy if exists "audit_logs_owner_delete" on public.audit_logs;
create policy "audit_logs_owner_delete"
on public.audit_logs
for delete
using (auth.uid() = owner_id);

-- Teacher assignments (teacher-only UI, stored in DB)
create table if not exists public.teacher_assignments (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  url text,
  tags text[] not null default '{}',
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_teacher_assignments_updated_at on public.teacher_assignments;
create trigger set_teacher_assignments_updated_at
before update on public.teacher_assignments
for each row execute function public.set_updated_at();

alter table public.teacher_assignments enable row level security;

-- Only admin/owner can read/write; teacher view will fetch via server route guarded by middleware.
drop policy if exists "teacher_assignments_owner_read" on public.teacher_assignments;
create policy "teacher_assignments_owner_read"
on public.teacher_assignments
for select
using (auth.uid() = owner_id);

drop policy if exists "teacher_assignments_owner_write" on public.teacher_assignments;
create policy "teacher_assignments_owner_write"
on public.teacher_assignments
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Projects
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  slug text not null unique,
  description text not null default '',
  url text,
  tags text[] not null default '{}',
  thumbnail_url text,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_projects_updated_at on public.projects;
create trigger set_projects_updated_at
before update on public.projects
for each row execute function public.set_updated_at();

alter table public.projects enable row level security;

drop policy if exists "projects_public_read_published" on public.projects;
create policy "projects_public_read_published"
on public.projects
for select
using (status = 'published' or auth.uid() = owner_id);

drop policy if exists "projects_owner_write" on public.projects;
create policy "projects_owner_write"
on public.projects
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Blog posts (logboek)
create table if not exists public.posts (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  slug text not null unique,
  content text not null default '',
  status text not null default 'draft' check (status in ('draft', 'published')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_posts_updated_at on public.posts;
create trigger set_posts_updated_at
before update on public.posts
for each row execute function public.set_updated_at();

alter table public.posts enable row level security;

drop policy if exists "posts_public_read_published" on public.posts;
create policy "posts_public_read_published"
on public.posts
for select
using (status = 'published' or auth.uid() = owner_id);

drop policy if exists "posts_owner_write" on public.posts;
create policy "posts_owner_write"
on public.posts
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

-- Timeline items
create table if not exists public.timeline_items (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid(),
  title text not null,
  period text not null,
  description text not null default '',
  order_index int not null default 0,
  status text not null default 'draft' check (status in ('draft', 'published')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_timeline_items_updated_at on public.timeline_items;
create trigger set_timeline_items_updated_at
before update on public.timeline_items
for each row execute function public.set_updated_at();

alter table public.timeline_items enable row level security;

drop policy if exists "timeline_public_read_published" on public.timeline_items;
create policy "timeline_public_read_published"
on public.timeline_items
for select
using (status = 'published' or auth.uid() = owner_id);

drop policy if exists "timeline_owner_write" on public.timeline_items;
create policy "timeline_owner_write"
on public.timeline_items
for all
using (auth.uid() = owner_id)
with check (auth.uid() = owner_id);

