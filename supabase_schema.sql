
-- Create profiles table (if not exists, usually handled by Auth triggers)
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text unique,
  username text,
  avatar_url text,
  updated_at timestamp with time zone
);

-- FUNCTION: Handle New User
-- This function will be called by the trigger every time a new user is created or confirmed in auth.users
create or replace function public.handle_new_user()
returns trigger as $$
declare
  user_name text;
begin
  -- Extract username from metadata or use email prefix
  user_name := new.raw_user_meta_data->>'name';
  
  -- If no name in metadata (email/password signup), try username field
  if user_name is null then
    user_name := new.raw_user_meta_data->>'username';
  end if;
  
  -- If still null, use email prefix as fallback
  if user_name is null and new.email is not null then
    user_name := split_part(new.email, '@', 1);
  end if;

  insert into public.profiles (id, email, username, avatar_url, updated_at)
  values (
    new.id, 
    new.email,
    user_name,
    coalesce(
      new.raw_user_meta_data->>'avatar_url',
      new.raw_user_meta_data->>'picture'  -- Google OAuth uses 'picture'
    ),
    now()
  )
  on conflict (id) do update set
    email = excluded.email,
    username = coalesce(excluded.username, profiles.username),
    avatar_url = coalesce(excluded.avatar_url, profiles.avatar_url),
    updated_at = now();
    
  return new;
end;
$$ language plpgsql security definer;

-- TRIGGER: On Auth User Created or Updated
-- Triggers the handle_new_user function after a row is inserted or updated in auth.users
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert or update on auth.users
  for each row execute procedure public.handle_new_user();

-- Create memories table
create table if not exists public.memories (
  id uuid default gen_random_uuid() primary key,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  user_id uuid references public.profiles(id), -- Link to public.profiles
  content text not null,
  image_url text,
  latitude double precision not null,
  longitude double precision not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.memories enable row level security;

-- Policy: Profiles are viewable by everyone
create policy "Public profiles are viewable by everyone."
  on public.profiles for select
  using ( true );

-- Policy: Allow the auth/system to insert profiles (required for triggers sometimes, though security definer handles it)
-- Note: 'security definer' on the function should bypass this, but let's be safe.
-- We usually don't need a policy for the trigger itself if it's security definer, 
-- but let's ensure the table structure is correct.

-- Policy: Users can update their own profile
create policy "Users can update own profile."
  on public.profiles for update
  using ( auth.uid() = id );

-- Policy: Anyone can read memories
create policy "Public memories are viewable by everyone."
  on public.memories for select
  using ( true );

-- Policy: Only authenticated users can insert memories
-- (If you want to allow anon inserts for now, change 'authenticated' to 'anon' or remove the role check)
create policy "Anyone can insert memories"
  on public.memories for insert
  with check ( true ); 

-- Storage: Create bucket 'memories'
insert into storage.buckets (id, name, public)
values ('memories', 'memories', true)
on conflict (id) do nothing;

-- Storage Policy: Anyone can upload images
create policy "Anyone can upload images"
  on storage.objects for insert
  with check ( bucket_id = 'memories' );

-- Storage Policy: Anyone can view images
create policy "Anyone can view images"
  on storage.objects for select
  using ( bucket_id = 'memories' );
