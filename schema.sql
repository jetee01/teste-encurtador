create table if not exists public.links (
  slug text primary key check (slug ~ '^[A-Za-z0-9]{7}$'),
  target_url text not null check (target_url ~ '^https?://'),
  created_at timestamptz not null default now()
);

alter table public.links enable row level security;
grant select, insert on public.links to anon, authenticated;

-- Links curtos são públicos por natureza: qualquer pessoa pode consultar e criar links.
create policy "Anyone can look up short links"
  on public.links for select
  to anon, authenticated
  using (true);

create policy "Anyone can create short links"
  on public.links for insert
  to anon, authenticated
  with check (
    char_length(target_url) <= 4096
    and target_url ~ '^https?://'
    and slug ~ '^[A-Za-z0-9]{7}$'
  );
