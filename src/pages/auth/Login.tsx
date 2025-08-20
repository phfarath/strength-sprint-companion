import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { GoogleLogin } from '@react-oauth/google';
import { useAppContext } from '@/context/AppContext';
import Logo from '@/components/common/Logo';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{email?: string, password?: string}>({});
  const { login, loginWithGoogle } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const errors: {email?: string, password?: string} = {};
    if (!email) errors.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email inválido";
    
    if (!password) errors.password = "Senha é obrigatória";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const result = await login(email, password);
      
      if (result.success) {
        toast({
          title: "Login realizado com sucesso",
          description: "Bem-vindo de volta ao StrengthSprint!",
        });
        navigate('/');
      } else {
        toast({
          title: "Erro ao fazer login",
          description: result.message || "Verifique suas credenciais e tente novamente.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro ao fazer login",
        description: "Ocorreu um erro inesperado. Tente novamente mais tarde.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-2 text-center">
          <div className="flex justify-center mb-4">
            <Logo size="large" />
          </div>
          <CardTitle className="text-2xl font-bold">Entrar no StrengthSprint</CardTitle>
          <CardDescription>
            Entre para acompanhar seus treinos e planos alimentares
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={formErrors.email ? "border-red-500" : ""}
                required
              />
              {formErrors.email && <p className="text-sm text-red-500">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Senha</Label>
                <Link 
                  to="/auth/recuperar-senha" 
                  className="text-sm font-medium text-fitness-primary hover:underline"
                >
                  Esqueceu a senha?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button 
              type="submit" 
              className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : 'Entrar'}
            </Button>
          </form>

          {/* Divisor */}
          <div className="my-4 flex items-center">
            <span className="flex-1 h-px bg-gray-200" />
            <span className="px-3 text-sm text-gray-500">ou</span>
            <span className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Botão Google */}
          <div className="flex justify-center">
            <GoogleLogin
              onSuccess={async (credentialResponse) => {
                const idToken = credentialResponse.credential;
                if (!idToken) {
                  toast({
                    title: "Falha no login com Google",
                    description: "Não foi possível obter o token do Google.",
                    variant: "destructive"
                  });
                  return;
                }
                const result = await loginWithGoogle(idToken);
                if (result.success) {
                  toast({
                    title: "Login realizado com sucesso",
                    description: "Bem-vindo de volta ao StrengthSprint!",
                  });
                  navigate('/');
                } else {
                  toast({
                    title: "Erro ao fazer login",
                    description: result.message || "Tente novamente.",
                    variant: "destructive"
                  });
                }
              }}
              onError={() => {
                toast({
                  title: "Falha no login com Google",
                  description: "Tente novamente.",
                  variant: "destructive"
                });
              }}
            />
          </div>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Não tem uma conta?{' '}
              <Link to="/auth/register" className="font-medium text-fitness-primary hover:underline">
                Cadastre-se
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Login;