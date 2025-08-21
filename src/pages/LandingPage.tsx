import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Activity, Dumbbell, Utensils, Trophy, BarChart2, Heart } from 'lucide-react';
import Logo from '@/components/common/Logo';

const LandingPage = () => {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Barra de navegação */}
      <header className="bg-white shadow py-4">
        <div className="container mx-auto px-4 flex justify-between items-center">
          <Logo size="medium" />
          <div className="space-x-2">
            <Button asChild variant="ghost">
              <Link to="/auth/login">Entrar</Link>
            </Button>
            <Button asChild className="bg-fitness-primary hover:bg-fitness-primary/90">
              <Link to="/auth/register">Começar Grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-fitness-primary/10 to-fitness-secondary/10 py-20">
        <div className="container mx-auto px-4 flex flex-col lg:flex-row items-center gap-12">
          <div className="lg:w-1/2 space-y-6">
            <h1 className="text-4xl md:text-5xl font-bold">
              Seu Companheiro para Fitness e Nutrição
            </h1>
            <p className="text-xl text-gray-700">
              Monitore seus treinos, planeje suas refeições e alcance seus objetivos de forma eficiente
              com a plataforma completa ForgeNFuel.
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Button asChild size="lg" className="bg-fitness-primary hover:bg-fitness-primary/90">
                <Link to="/auth/register">Começar Gratuitamente</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <a href="#features">Conheça os Recursos</a>
              </Button>
            </div>
          </div>
          <div className="lg:w-1/2">
            <img 
              src="/dashboard-preview.png" 
              alt="Dashboard do ForgeNFuel"
              className="rounded-lg shadow-2xl"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">Recursos Principais</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Tudo o que você precisa para gerenciar sua saúde e condicionamento físico em um só lugar.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Dumbbell />} 
              title="Planejamento de Treinos" 
              description="Crie e gerencie seus planos de treinamento personalizados, com acompanhamento detalhado de cada exercício."
            />
            <FeatureCard 
              icon={<Utensils />} 
              title="Planejamento Nutricional" 
              description="Organize suas refeições e monitore seu consumo de nutrientes para atingir suas metas de forma saudável."
            />
            <FeatureCard 
              icon={<BarChart2 />} 
              title="Acompanhamento de Progresso" 
              description="Visualize seu progresso ao longo do tempo com gráficos intuitivos e métricas detalhadas."
            />
            <FeatureCard 
              icon={<Trophy />} 
              title="Gamificação" 
              description="Ganhe pontos, conquiste medalhas e mantenha-se motivado com nosso sistema de recompensas."
            />
            <FeatureCard 
              icon={<Heart />} 
              title="Integração com Dispositivos" 
              description="Sincronize com seus dispositivos de monitoramento para um acompanhamento completo da sua saúde."
            />
            <FeatureCard 
              icon={<Activity />} 
              title="Relatórios Personalizados" 
              description="Receba insights sobre seu desempenho e recomendações personalizadas para melhorar seus resultados."
            />
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20 bg-gray-50">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold mb-4">O Que Nossos Usuários Dizem</h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <TestimonialCard 
              name="Carlos Silva"
              role="Usuário há 6 meses"
              quote="O ForgeNFuel mudou completamente minha abordagem de treino. Consigo planejar e acompanhar tudo de forma muito mais eficiente."
            />
            <TestimonialCard 
              name="Marina Santos"
              role="Personal Trainer"
              quote="Recomendo para todos os meus alunos. A interface é intuitiva e os recursos de planejamento são excelentes para acompanhar a evolução."
            />
            <TestimonialCard 
              name="Rafael Oliveira"
              role="Usuário há 1 ano"
              quote="O que mais gosto é o planejamento nutricional. Consegui finalmente manter uma dieta consistente graças ao aplicativo."
            />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-fitness-primary/10">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Pronto para Transformar seus Hábitos?</h2>
          <p className="text-xl text-gray-700 mb-8 max-w-3xl mx-auto">
            Junte-se a milhares de pessoas que já estão alcançando seus objetivos com o ForgeNFuel.
          </p>
          <Button asChild size="lg" className="bg-fitness-primary hover:bg-fitness-primary/90">
            <Link to="/auth/register">Começar Gratuitamente</Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col md:flex-row justify-between items-center mb-8">
            <Logo size="medium" />
            <div className="mt-4 md:mt-0">
              <ul className="flex space-x-6">
                <li><a href="#" className="hover:text-fitness-secondary">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-fitness-secondary">Blog</a></li>
                <li><a href="#" className="hover:text-fitness-secondary">Contato</a></li>
                <li><a href="#" className="hover:text-fitness-secondary">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-fitness-secondary">Privacidade</a></li>
              </ul>
            </div>
          </div>
          <div className="text-center text-gray-400">
            <p>&copy; {new Date().getFullYear()} ForgeNFuel. Todos os direitos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Componentes auxiliares
const FeatureCard = ({ icon, title, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100 hover:shadow-lg transition-shadow">
    <div className="text-fitness-primary mb-4">
      {React.cloneElement(icon, { size: 36 })}
    </div>
    <h3 className="text-xl font-bold mb-2">{title}</h3>
    <p className="text-gray-600">{description}</p>
  </div>
);

const TestimonialCard = ({ name, role, quote }) => (
  <div className="bg-white p-6 rounded-lg shadow-md border border-gray-100">
    <div className="mb-4">
      <svg className="h-8 w-8 text-fitness-secondary opacity-50" fill="currentColor" viewBox="0 0 32 32">
        <path d="M9.352 4C4.456 7.456 1 13.12 1 19.36c0 5.088 3.072 8.064 6.624 8.064 3.36 0 5.856-2.688 5.856-5.856 0-3.168-2.208-5.472-5.088-5.472-.576 0-1.344.096-1.536.192.48-3.264 3.552-7.104 6.624-9.024L9.352 4zm16.512 0c-4.8 3.456-8.256 9.12-8.256 15.36 0 5.088 3.072 8.064 6.624 8.064 3.264 0 5.856-2.688 5.856-5.856 0-3.168-2.304-5.472-5.184-5.472-.576 0-1.248.096-1.44.192.48-3.264 3.456-7.104 6.528-9.024L25.864 4z" />
      </svg>
    </div>
    <p className="text-gray-600 italic mb-4">{quote}</p>
    <div className="font-bold">{name}</div>
    <div className="text-gray-500 text-sm">{role}</div>
  </div>
);

export default LandingPage;