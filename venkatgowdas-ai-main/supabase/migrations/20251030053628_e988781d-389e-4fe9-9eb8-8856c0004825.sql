-- Create profiles table for user data
create table public.profiles (
  id uuid not null references auth.users(id) on delete cascade,
  email text,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
on public.profiles
for select
using (auth.uid() = id);

create policy "Users can update their own profile"
on public.profiles
for update
using (auth.uid() = id);

create policy "Users can insert their own profile"
on public.profiles
for insert
with check (auth.uid() = id);

-- Create function to handle new user signups
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email);
  return new;
end;
$$;

-- Trigger to create profile on signup
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- Create website_generations table for history
create table public.website_generations (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  prompt text not null,
  generated_code text not null,
  website_url text,
  created_at timestamp with time zone not null default now(),
  primary key (id)
);

alter table public.website_generations enable row level security;

create policy "Users can view their own generations"
on public.website_generations
for select
using (auth.uid() = user_id);

create policy "Users can insert their own generations"
on public.website_generations
for insert
with check (auth.uid() = user_id);

create policy "Users can delete their own generations"
on public.website_generations
for delete
using (auth.uid() = user_id);

-- Create index for faster queries
create index website_generations_user_id_idx on public.website_generations(user_id);
create index website_generations_created_at_idx on public.website_generations(created_at desc);