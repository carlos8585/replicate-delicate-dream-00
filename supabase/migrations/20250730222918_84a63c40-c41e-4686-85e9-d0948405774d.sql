-- Alterar a coluna role para permitir valores NULL
ALTER TABLE public.users ALTER COLUMN role DROP NOT NULL;