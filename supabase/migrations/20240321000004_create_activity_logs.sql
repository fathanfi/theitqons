create table public.activity_logs (
  id uuid default gen_random_uuid() primary key,
  student_id uuid references public.students(id) on delete cascade,
  action_type text not null,
  message text not null,
  related_id uuid,
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  created_by uuid references auth.users(id) on delete set null
);

-- Enable RLS
alter table public.activity_logs enable row level security;

-- Create policies
create policy "Enable read access for authenticated users"
  on public.activity_logs for select
  to authenticated
  using (true);

create policy "Enable insert for authenticated users"
  on public.activity_logs for insert
  to authenticated
  with check (true);

-- Create indexes for better query performance
create index activity_logs_student_id_idx on public.activity_logs(student_id);
create index activity_logs_action_type_idx on public.activity_logs(action_type);
create index activity_logs_created_at_idx on public.activity_logs(created_at desc);
create index activity_logs_related_id_idx on public.activity_logs(related_id); 