import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Eye, EyeOff } from 'lucide-react';
import PendingApproval from './PendingApproval';
import WaitingApproval from './WaitingApproval';
import EngineerDashboard from './EngineerDashboard';
import ManagerDashboard from './ManagerDashboard';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [name, setName] = useState('');
  const [currentStep, setCurrentStep] = useState<'auth' | 'waiting' | 'pending' | 'dashboard'>('auth');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setIsLoading(true);
    try {
      // Fazer login com Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (authError) {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos.",
          variant: "destructive",
        });
        return;
      }

      // Buscar dados do usuário na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authData.user?.id)
        .single();

      if (userError || !userData) {
        toast({
          title: "Erro",
          description: "Usuário não encontrado no sistema.",
          variant: "destructive",
        });
        return;
      }

      // Atualizar último login
      await supabase
        .from('users')
        .update({ last_login: new Date().toISOString() })
        .eq('id', userData.id);

      setCurrentUser(userData);

      if (!userData.role) {
        setCurrentStep('waiting');
      } else if (userData.role === 'manager') {
        setCurrentStep('dashboard');
      } else {
        setCurrentStep('dashboard');
      }

      toast({
        title: "Login realizado!",
        description: `Bem-vindo, ${userData.name}!`,
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !name) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    try {
      console.log('Iniciando cadastro para email:', email);
      
      // Criar conta no Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: {
            name: name,
          }
        }
      });

      if (authError) {
        if (authError.message.includes('already registered') || authError.message.includes('already exists')) {
          toast({
            title: "Email já cadastrado",
            description: "Este email já possui uma conta. Tente fazer login ou use outro email.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Erro no cadastro", 
            description: authError.message,
            variant: "destructive",
          });
        }
        return;
      }

      if (!authData.user) {
        console.error('Nenhum usuário retornado do auth');
        throw new Error('Erro ao criar usuário');
      }

      console.log('Auth criado com sucesso, ID:', authData.user.id);
      console.log('Tentando criar perfil na tabela users...');

      // Criar registro na tabela users
      const { data: userData, error: userError } = await supabase
        .from('users')
        .insert([{
          id: authData.user.id,
          email,
          name,
          role: null, // Aguardando aprovação
          email_verified: true,
        }])
        .select()
        .single();

      console.log('Resultado do insert:', { userData, userError });

      if (userError) {
        console.error('Erro detalhado ao criar perfil:', userError);
        toast({
          title: "Erro",
          description: `Erro ao criar perfil: ${userError.message}`,
          variant: "destructive",
        });
        return;
      }

      setCurrentUser(userData);
      setCurrentStep('waiting');

      toast({
        title: "Conta criada!",
        description: "Sua conta foi criada e está aguardando aprovação.",
      });

    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao criar conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentStep('auth');
    setCurrentUser(null);
    setEmail('');
    setPassword('');
    setName('');
  };

  const handleGoToPendingApproval = () => {
    setCurrentStep('pending');
  };

  if (currentStep === 'waiting') {
    return (
      <WaitingApproval
        user={currentUser}
        onLogout={handleLogout}
      />
    );
  }

  if (currentStep === 'pending') {
    return (
      <PendingApproval
        user={currentUser}
        onLogout={handleLogout}
        onBack={() => setCurrentStep('dashboard')}
      />
    );
  }

  if (currentStep === 'dashboard') {
    if (currentUser?.role === 'manager') {
      return <ManagerDashboard user={currentUser} onLogout={handleLogout} />;
    } else {
      return <EngineerDashboard user={currentUser} onLogout={handleLogout} />;
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center mb-4">
            <FileText className="w-6 h-6 text-primary" />
          </div>
          <CardTitle>Sistema de Pedidos</CardTitle>
          <CardDescription>
            {isLogin ? 'Faça login em sua conta' : 'Crie sua conta no sistema'}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={isLogin ? handleLogin : handleSignup} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name">Nome Completo</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Seu nome completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu.email@empresa.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Digite sua senha"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
            </div>
            
            <Button 
              type="submit" 
              className="w-full" 
              disabled={isLoading || !email || !password || (!isLogin && !name)}
            >
              {isLoading ? (isLogin ? 'Entrando...' : 'Criando conta...') : (isLogin ? 'Entrar' : 'Criar Conta')}
            </Button>
          </form>
          
          <div className="text-center">
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setEmail('');
                setPassword('');
                setName('');
              }}
            >
              {isLogin ? 'Não tem conta? Cadastre-se' : 'Já tem conta? Faça login'}
            </Button>
          </div>
          
          <div className="text-center">
            <p className="text-sm text-muted-foreground">
              Sistema de Gestão de Materiais de Construção
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginForm;