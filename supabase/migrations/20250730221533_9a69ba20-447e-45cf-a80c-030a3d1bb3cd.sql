-- Remover políticas existentes e criar uma mais simples para insert
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;
DROP POLICY IF EXISTS "Allow signup user creation" ON public.users;

-- Criar política única que permite insert para qualquer um autenticado ou anônimo
CREATE POLICY "Allow user creation" ON public.users
FOR INSERT 
TO public
WITH CHECK (true);