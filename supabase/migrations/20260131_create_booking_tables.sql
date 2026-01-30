-- Booking / Scheduling System Tables
-- booking_pages, team_availability, availability_overrides, appointments, booking_reminders

-- 1. Booking Pages
create table if not exists public.booking_pages (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  name text not null,
  slug text not null,
  description text,
  duration_minutes integer not null default 30,
  buffer_before integer not null default 0,
  buffer_after integer not null default 0,
  form_id uuid references public.forms(id) on delete set null,
  assigned_member_id uuid references public.profiles(id) on delete set null,
  location_type text not null default 'video' check (location_type in ('video', 'phone', 'in_person', 'custom')),
  location_details text,
  min_notice_hours integer not null default 1,
  max_advance_days integer not null default 60,
  color text default '#84cc16',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, slug)
);

-- 2. Team Availability (weekly schedule)
create table if not exists public.team_availability (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0=Sun, 6=Sat
  start_time time not null default '09:00',
  end_time time not null default '17:00',
  timezone text not null default 'America/New_York',
  is_available boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(tenant_id, member_id, day_of_week)
);

-- 3. Availability Overrides (specific dates)
create table if not exists public.availability_overrides (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  member_id uuid not null references public.profiles(id) on delete cascade,
  override_date date not null,
  is_blocked boolean not null default true,
  start_time time,
  end_time time,
  reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 4. Appointments
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_page_id uuid not null references public.booking_pages(id) on delete cascade,
  assigned_member_id uuid references public.profiles(id) on delete set null,
  client_name text not null,
  client_email text not null,
  client_phone text,
  start_time timestamptz not null,
  end_time timestamptz not null,
  status text not null default 'confirmed' check (status in ('confirmed', 'cancelled', 'completed', 'no_show', 'rescheduled')),
  form_response_id uuid,
  lead_id uuid,
  source text default 'booking_page',
  notes text,
  cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 5. Booking Reminders
create table if not exists public.booking_reminders (
  id uuid primary key default gen_random_uuid(),
  tenant_id uuid not null references public.tenants(id) on delete cascade,
  booking_page_id uuid not null references public.booking_pages(id) on delete cascade,
  type text not null default 'email' check (type in ('email', 'sms')),
  minutes_before integer not null default 60,
  template_subject text,
  template_body text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Indexes
create index if not exists idx_booking_pages_tenant on public.booking_pages(tenant_id);
create index if not exists idx_booking_pages_slug on public.booking_pages(tenant_id, slug);
create index if not exists idx_team_availability_member on public.team_availability(tenant_id, member_id);
create index if not exists idx_availability_overrides_member_date on public.availability_overrides(tenant_id, member_id, override_date);
create index if not exists idx_appointments_tenant on public.appointments(tenant_id);
create index if not exists idx_appointments_booking_page on public.appointments(booking_page_id);
create index if not exists idx_appointments_start_time on public.appointments(start_time);
create index if not exists idx_appointments_status on public.appointments(status);
create index if not exists idx_booking_reminders_booking_page on public.booking_reminders(booking_page_id);

-- RLS Policies
alter table public.booking_pages enable row level security;
alter table public.team_availability enable row level security;
alter table public.availability_overrides enable row level security;
alter table public.appointments enable row level security;
alter table public.booking_reminders enable row level security;

-- booking_pages policies
create policy "Users can view booking pages for their tenant"
  on public.booking_pages for select
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can create booking pages for their tenant"
  on public.booking_pages for insert
  with check (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update booking pages for their tenant"
  on public.booking_pages for update
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can delete booking pages for their tenant"
  on public.booking_pages for delete
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- team_availability policies
create policy "Users can view team availability for their tenant"
  on public.team_availability for select
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can manage team availability for their tenant"
  on public.team_availability for insert
  with check (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update team availability for their tenant"
  on public.team_availability for update
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can delete team availability for their tenant"
  on public.team_availability for delete
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- availability_overrides policies
create policy "Users can view availability overrides for their tenant"
  on public.availability_overrides for select
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can create availability overrides for their tenant"
  on public.availability_overrides for insert
  with check (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update availability overrides for their tenant"
  on public.availability_overrides for update
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can delete availability overrides for their tenant"
  on public.availability_overrides for delete
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- appointments policies
create policy "Users can view appointments for their tenant"
  on public.appointments for select
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can create appointments for their tenant"
  on public.appointments for insert
  with check (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update appointments for their tenant"
  on public.appointments for update
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can delete appointments for their tenant"
  on public.appointments for delete
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- booking_reminders policies
create policy "Users can view booking reminders for their tenant"
  on public.booking_reminders for select
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can create booking reminders for their tenant"
  on public.booking_reminders for insert
  with check (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can update booking reminders for their tenant"
  on public.booking_reminders for update
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

create policy "Users can delete booking reminders for their tenant"
  on public.booking_reminders for delete
  using (tenant_id in (select tenant_id from public.profiles where id = auth.uid()));

-- Service role can manage all booking tables (for public booking submissions)
create policy "Service role full access to booking_pages"
  on public.booking_pages for all
  using (auth.role() = 'service_role');

create policy "Service role full access to appointments"
  on public.appointments for all
  using (auth.role() = 'service_role');

-- Updated_at triggers
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger update_booking_pages_updated_at
  before update on public.booking_pages
  for each row execute function public.update_updated_at_column();

create trigger update_team_availability_updated_at
  before update on public.team_availability
  for each row execute function public.update_updated_at_column();

create trigger update_availability_overrides_updated_at
  before update on public.availability_overrides
  for each row execute function public.update_updated_at_column();

create trigger update_appointments_updated_at
  before update on public.appointments
  for each row execute function public.update_updated_at_column();

create trigger update_booking_reminders_updated_at
  before update on public.booking_reminders
  for each row execute function public.update_updated_at_column();
