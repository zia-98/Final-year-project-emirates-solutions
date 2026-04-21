create table if not exists saved_roadmaps (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) not null,
  title text not null,
  roadmap_data jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Policy to allow users to view their own saved roadmaps
alter table saved_roadmaps enable row level security;

drop policy if exists "Users can view their own saved roadmaps" on saved_roadmaps;
create policy "Users can view their own saved roadmaps"
  on saved_roadmaps for select
  using (auth.uid() = user_id);

drop policy if exists "Users can insert their own saved roadmaps" on saved_roadmaps;
create policy "Users can insert their own saved roadmaps"
  on saved_roadmaps for insert
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete their own saved roadmaps" on saved_roadmaps;
create policy "Users can delete their own saved roadmaps"
  on saved_roadmaps for delete
  using (auth.uid() = user_id);
