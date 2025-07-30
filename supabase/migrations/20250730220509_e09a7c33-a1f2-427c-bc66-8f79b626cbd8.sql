-- Remover coluna password da tabela users (já que usamos Supabase Auth)
ALTER TABLE public.users DROP COLUMN IF EXISTS password;