create table if not exists medical_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid null,
  name text,
  blood_type text,
  age integer,
  allergies text,
  medications text,
  conditions text,
  contact_name text,
  contact_phone text,
  created_at timestamptz not null default now()
);

create table if not exists blood_donors (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  blood_type text not null,
  phone text not null,
  area text not null,
  is_available boolean not null default true,
  created_at timestamptz not null default now()
);

alter table medical_profiles enable row level security;
alter table blood_donors enable row level security;

grant usage on schema public to anon;
grant insert, select on medical_profiles to anon;
grant insert, select on blood_donors to anon;

drop policy if exists "Allow public medical profile inserts" on medical_profiles;
drop policy if exists "Allow public medical profile reads" on medical_profiles;
drop policy if exists "Allow public donor inserts" on blood_donors;
drop policy if exists "Allow public donor reads" on blood_donors;

create policy "Allow public medical profile inserts"
on medical_profiles
for insert
to anon
with check (true);

create policy "Allow public medical profile reads"
on medical_profiles
for select
to anon
using (true);

create policy "Allow public donor inserts"
on blood_donors
for insert
to anon
with check (true);

create policy "Allow public donor reads"
on blood_donors
for select
to anon
using (true);
