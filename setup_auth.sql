-- 1. Cria a tabela de Perfis
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  role TEXT DEFAULT 'leader' CHECK (role IN ('master', 'admin', 'leader')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilita RLS na tabela de perfis
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 2. Políticas de Acesso
-- Todos podem ler a tabela de profiles (necessário para listar líderes e autores)
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);

-- Apenas masters podem atualizar ou deletar perfis
CREATE POLICY "Masters can update profiles" ON public.profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'master'
  )
);
CREATE POLICY "Masters can delete profiles" ON public.profiles FOR DELETE USING (
  EXISTS (
    SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'master'
  )
);

-- Os próprios usuários podem atualizar informações básicas do seu perfil (se quisermos no futuro)
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- 3. Função para ciar perfil automaticamente quando registrar via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, role, status)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Novo Usuário'), 
    'leader', 
    'pending'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para executar a função
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- =========================================================================
-- COMANDO DE EMERGÊNCIA (DESBLOQUEIO MASTER)
-- Se você precisar de um acesso MASTER urgente agora mesmo:
-- 1. Vá na aba Authentication > Users do Supabase e crie um novo usuário com e-mail e senha.
-- 2. Depois de criado, copie o ID ("User UID") daquele usuário lá no Supabase.
-- 3. Substitua 'SEU-USER-ID-AQUI' no comando abaixo e rode-o para forçar aprovação.
-- =========================================================================

-- UPDATE public.profiles 
-- SET role = 'master', status = 'approved' 
-- WHERE id = 'SEU-USER-ID-AQUI';
