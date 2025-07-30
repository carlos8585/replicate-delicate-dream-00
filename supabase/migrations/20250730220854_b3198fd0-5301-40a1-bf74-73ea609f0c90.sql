-- Atualizar políticas RLS para permitir cadastro de novos usuários
DROP POLICY IF EXISTS "Users can insert their own data" ON public.users;

-- Criar política que permite qualquer usuário autenticado inserir seu próprio registro
CREATE POLICY "Users can insert their own data" ON public.users
FOR INSERT 
TO authenticated
WITH CHECK (auth.uid() = id);

-- Criar política que permite inserir dados durante signup (quando auth.uid() é null)
CREATE POLICY "Allow signup user creation" ON public.users
FOR INSERT 
TO anon
WITH CHECK (true);