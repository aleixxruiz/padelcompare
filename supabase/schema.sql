-- ============================================================
-- Padel Match — esquema de Supabase
-- Ejecuta esto en tu proyecto: Supabase → SQL Editor → New query → pega → Run
-- ============================================================

-- Tabla de perfiles (1 fila por usuario; el id == auth.users.id)
create table if not exists public.perfiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  nombre        text,
  nivel_playtomic numeric(3,1),            -- 0.0 a 7.0
  estilo        text,                       -- control | potencia | polivalente | indiferente
  mano          text,                       -- derecha | reves | ambidiestro
  frecuencia    text,                       -- ocasional | 1-2 semana | 3+ semana
  presupuesto   integer,                    -- € máximo
  lesion_codo   boolean default false,
  peso          integer,                    -- kg (opcional)
  consentimiento boolean default false,     -- aceptó la política de privacidad
  created_at    timestamptz default now(),
  updated_at    timestamptz default now()
);

-- Seguridad a nivel de fila: cada usuario solo ve/edita SU perfil
alter table public.perfiles enable row level security;

drop policy if exists "perfil propio: ver" on public.perfiles;
create policy "perfil propio: ver"
  on public.perfiles for select
  using (auth.uid() = id);

drop policy if exists "perfil propio: insertar" on public.perfiles;
create policy "perfil propio: insertar"
  on public.perfiles for insert
  with check (auth.uid() = id);

drop policy if exists "perfil propio: actualizar" on public.perfiles;
create policy "perfil propio: actualizar"
  on public.perfiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Mantener updated_at al día
create or replace function public.tocar_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end; $$;

drop trigger if exists trg_perfiles_updated on public.perfiles;
create trigger trg_perfiles_updated
  before update on public.perfiles
  for each row execute function public.tocar_updated_at();
