import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { useAppContext } from '@/context/AppContext';
import Logo from '@/components/common/Logo';

const Register = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formErrors, setFormErrors] = useState<{
    name?: string;
    email?: string;
    password?: string;
    passwordConfirm?: string;
  }>({});
  
  const { register } = useAppContext();
  const navigate = useNavigate();
  const { toast } = useToast();

  const validateForm = () => {
    const errors: {
      name?: string;
      email?: string;
      password?: string;
      passwordConfirm?: string;
    } = {};
    
    if (!name) errors.name = "Nome é obrigatório";
    
    if (!email) errors.email = "Email é obrigatório";
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = "Email inválido";
    
    if (!password) errors.password = "Senha é obrigatória";
    else if (password.length < 6) errors.password = "A senha deve ter pelo menos 6 caracteres";
    
    if (!passwordConfirm) errors.passwordConfirm = "Confirmação de senha é obrigatória";
    else if (password !== passwordConfirm) errors.passwordConfirm = "As senhas não coincidem";
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsLoading(true);

    try {
      const result = await register({ name, email, password });
      
      if (result.success) {
        toast({
          title: "Registro realizado com sucesso",
          description: "Bem-vindo ao StrengthSprint!",
        });
        navigate('/');
      } else {
        // Tratamento de erros específicos
        if (result.message?.includes("already exists")) {
          setFormErrors({...formErrors, email: "Este email já está em uso"});
        } else {
          toast({
            title: "Erro ao criar conta",
            description: result.message || "Verifique seus dados e tente novamente.",
            variant: "destructive"
          });
        }
      }
    } catch (error) {
      console.error('Erro inesperado:', error);
      toast({
        title: "Erro ao criar conta",
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
          <CardTitle className="text-2xl font-bold">Crie sua conta</CardTitle>
          <CardDescription>
            Comece sua jornada de fitness e nutrição com o StrengthSprint
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome completo</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                required
              />
              {formErrors.name && <p className="text-red-500 text-sm">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              {formErrors.email && <p className="text-red-500 text-sm">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {formErrors.password && <p className="text-red-500 text-sm">{formErrors.password}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="password-confirm">Confirme a senha</Label>
              <Input
                id="password-confirm"
                type="password"
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              {formErrors.passwordConfirm && <p className="text-red-500 text-sm">{formErrors.passwordConfirm}</p>}
            </div>
            <Button 
              type="submit" 
              className="w-full bg-fitness-primary hover:bg-fitness-primary/90"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Cadastrando...
                </>
              ) : 'Criar conta'}
            </Button>
          </form>
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Já tem uma conta?{' '}
              <Link to="/auth/login" className="font-medium text-fitness-primary hover:underline">
                Entrar
              </Link>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;