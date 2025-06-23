import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  BarChart3, 
  TrendingUp, 
  FileText, 
  Briefcase, 
  Package, 
  CheckCircle, 
  ChevronRight, 
  Star, 
  ArrowRight, 
  Users, 
  Target, 
  DollarSign, 
  Clock, 
  ShieldCheck,
  Menu,
  X
} from 'lucide-react';
import logoHorizontal from '../../assets/FreeSample-Vectorizer-io-logo horizontal.svg';

export const LandingPage: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4 md:justify-start md:space-x-10">
            <div className="flex justify-start lg:w-0 lg:flex-1">
              <a href="#" className="flex items-center">
                <img
                  className="h-10 w-auto sm:h-12"
                  src={logoHorizontal}
                  alt="FoodDash"
                />
              </a>
            </div>
            
            <div className="-mr-2 -my-2 md:hidden">
              <button
                type="button"
                className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                onClick={() => setMobileMenuOpen(true)}
              >
                <span className="sr-only">Abrir menu</span>
                <Menu className="h-6 w-6" aria-hidden="true" />
              </button>
            </div>
            
            <nav className="hidden md:flex space-x-10">
              <a href="#features" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Recursos
              </a>
              <a href="#testimonials" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Depoimentos
              </a>
              <a href="#pricing" className="text-base font-medium text-gray-500 hover:text-gray-900">
                Preços
              </a>
              <a href="#faq" className="text-base font-medium text-gray-500 hover:text-gray-900">
                FAQ
              </a>
            </nav>
            
            <div className="hidden md:flex items-center justify-end md:flex-1 lg:w-0">
              <Link to="/auth" className="whitespace-nowrap text-base font-medium text-gray-500 hover:text-gray-900">
                Entrar
              </Link>
              <Link
                to="/auth"
                className="ml-8 whitespace-nowrap inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700"
              >
                Começar grátis
              </Link>
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        {mobileMenuOpen && (
          <div className="absolute top-0 inset-x-0 p-2 transition transform origin-top-right md:hidden z-50">
            <div className="rounded-lg shadow-lg ring-1 ring-black ring-opacity-5 bg-white divide-y-2 divide-gray-50">
              <div className="pt-5 pb-6 px-5">
                <div className="flex items-center justify-between">
                  <div>
                    <img
                      className="h-8 w-auto"
                      src={logoHorizontal}
                      alt="FoodDash"
                    />
                  </div>
                  <div className="-mr-2">
                    <button
                      type="button"
                      className="bg-white rounded-md p-2 inline-flex items-center justify-center text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-orange-500"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <span className="sr-only">Fechar menu</span>
                      <X className="h-6 w-6" aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="mt-6">
                  <nav className="grid gap-y-8">
                    <a
                      href="#features"
                      className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <CheckCircle className="flex-shrink-0 h-6 w-6 text-orange-600" />
                      <span className="ml-3 text-base font-medium text-gray-900">Recursos</span>
                    </a>
                    <a
                      href="#testimonials"
                      className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <Star className="flex-shrink-0 h-6 w-6 text-orange-600" />
                      <span className="ml-3 text-base font-medium text-gray-900">Depoimentos</span>
                    </a>
                    <a
                      href="#pricing"
                      className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <DollarSign className="flex-shrink-0 h-6 w-6 text-orange-600" />
                      <span className="ml-3 text-base font-medium text-gray-900">Preços</span>
                    </a>
                    <a
                      href="#faq"
                      className="-m-3 p-3 flex items-center rounded-md hover:bg-gray-50"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      <ShieldCheck className="flex-shrink-0 h-6 w-6 text-orange-600" />
                      <span className="ml-3 text-base font-medium text-gray-900">FAQ</span>
                    </a>
                  </nav>
                </div>
              </div>
              <div className="py-6 px-5 space-y-6">
                <div>
                  <Link
                    to="/auth"
                    className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-base font-medium text-white bg-orange-600 hover:bg-orange-700"
                  >
                    Começar grátis
                  </Link>
                  <p className="mt-6 text-center text-base font-medium text-gray-500">
                    Já tem uma conta?{' '}
                    <Link to="/auth" className="text-orange-600 hover:text-orange-500">
                      Entrar
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-orange-50 via-white to-green-50">
        <div className="max-w-7xl mx-auto">
          <div className="relative z-10 pb-8 bg-transparent sm:pb-16 md:pb-20 lg:max-w-2xl lg:w-full lg:pb-28 xl:pb-32">
            <main className="mt-10 mx-auto max-w-7xl px-4 sm:mt-12 sm:px-6 md:mt-16 lg:mt-20 lg:px-8 xl:mt-28">
              <div className="sm:text-center lg:text-left">
                <h1 className="text-4xl tracking-tight font-extrabold text-gray-900 sm:text-5xl md:text-6xl">
                  <span className="block">Gestão inteligente</span>
                  <span className="block text-orange-600">para seu restaurante</span>
                </h1>
                <p className="mt-3 text-base text-gray-500 sm:mt-5 sm:text-lg sm:max-w-xl sm:mx-auto md:mt-5 md:text-xl lg:mx-0">
                  Compare seu desempenho com outros restaurantes da sua região, 
                  gerencie suas finanças com precisão e tome decisões baseadas em dados.
                </p>
                <div className="mt-5 sm:mt-8 sm:flex sm:justify-center lg:justify-start">
                  <div className="rounded-md shadow">
                    <Link
                      to="/auth"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-600 hover:bg-orange-700 md:py-4 md:text-lg md:px-10"
                    >
                      Começar agora
                    </Link>
                  </div>
                  <div className="mt-3 sm:mt-0 sm:ml-3">
                    <a
                      href="#features"
                      className="w-full flex items-center justify-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-orange-700 bg-orange-100 hover:bg-orange-200 md:py-4 md:text-lg md:px-10"
                    >
                      Saiba mais
                    </a>
                  </div>
                </div>
              </div>
            </main>
          </div>
        </div>
        <div className="lg:absolute lg:inset-y-0 lg:right-0 lg:w-1/2">
          <img
            className="h-56 w-full object-cover sm:h-72 md:h-96 lg:w-full lg:h-full"
            src="https://images.pexels.com/photos/3184183/pexels-photo-3184183.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
            alt="Equipe de restaurante analisando dados"
          />
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-orange-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:py-16 sm:px-6 lg:px-8 lg:py-20">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
              Usado por mais de 2.000 restaurantes em todo o Brasil
            </h2>
            <p className="mt-3 text-xl text-orange-200">
              Restaurantes que usam o FoodDash aumentam sua lucratividade em média 23%
            </p>
          </div>
          <dl className="mt-10 text-center sm:max-w-3xl sm:mx-auto sm:grid sm:grid-cols-3 sm:gap-8">
            <div className="flex flex-col">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-orange-200">
                Restaurantes
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">2.000+</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-orange-200">
                Aumento médio de lucro
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">23%</dd>
            </div>
            <div className="flex flex-col mt-10 sm:mt-0">
              <dt className="order-2 mt-2 text-lg leading-6 font-medium text-orange-200">
                Satisfação dos clientes
              </dt>
              <dd className="order-1 text-5xl font-extrabold text-white">98%</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Features Section */}
      <div id="features" className="py-16 bg-white overflow-hidden lg:py-24">
        <div className="relative max-w-xl mx-auto px-4 sm:px-6 lg:px-8 lg:max-w-7xl">
          <div className="relative">
            <h2 className="text-center text-3xl leading-8 font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Uma plataforma completa para seu restaurante
            </h2>
            <p className="mt-4 max-w-3xl mx-auto text-center text-xl text-gray-500">
              Tudo o que você precisa para gerenciar seu restaurante de forma inteligente e lucrativa
            </p>
          </div>

          <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div className="relative">
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                Comparativo de mercado exclusivo
              </h3>
              <p className="mt-3 text-lg text-gray-500">
                Compare seu desempenho com outros restaurantes da sua região e categoria. 
                Saiba exatamente onde você está se destacando e onde precisa melhorar.
              </p>

              <dl className="mt-10 space-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <Target className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Benchmark regional</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Compare seu ticket médio, margem de lucro e outros indicadores com restaurantes similares na sua região.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <BarChart3 className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Análise competitiva</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Entenda como seus custos e despesas se comparam com a média do mercado e identifique oportunidades de melhoria.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <TrendingUp className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Insights acionáveis</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Receba recomendações personalizadas para melhorar seus resultados com base nos dados comparativos.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
              <img
                className="relative mx-auto rounded-lg shadow-lg"
                width={490}
                src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Dashboard de comparativo de mercado"
              />
            </div>
          </div>

          <div className="relative mt-12 sm:mt-16 lg:mt-24">
            <div className="lg:grid lg:grid-flow-row-dense lg:grid-cols-2 lg:gap-8 lg:items-center">
              <div className="lg:col-start-2">
                <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                  DRE automática e análise financeira
                </h3>
                <p className="mt-3 text-lg text-gray-500">
                  Gere automaticamente sua Demonstração de Resultados do Exercício e tenha uma visão clara da saúde financeira do seu negócio.
                </p>

                <dl className="mt-10 space-y-10">
                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                        <FileText className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">DRE automática</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Sua DRE é gerada automaticamente a partir dos dados de vendas e despesas, sem necessidade de planilhas complexas.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                        <TrendingUp className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Análise temporal</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Compare resultados mês a mês e identifique tendências para tomar decisões mais assertivas.
                    </dd>
                  </div>

                  <div className="relative">
                    <dt>
                      <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                        <DollarSign className="h-6 w-6" />
                      </div>
                      <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Controle de custos</p>
                    </dt>
                    <dd className="mt-2 ml-16 text-base text-gray-500">
                      Monitore seus custos por categoria e identifique onde estão seus maiores gastos e oportunidades de economia.
                    </dd>
                  </div>
                </dl>
              </div>

              <div className="mt-10 -mx-4 relative lg:mt-0 lg:col-start-1">
                <img
                  className="relative mx-auto rounded-lg shadow-lg"
                  width={490}
                  src="https://images.pexels.com/photos/6694543/pexels-photo-6694543.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                  alt="Dashboard de DRE e análise financeira"
                />
              </div>
            </div>
          </div>

          <div className="relative mt-12 lg:mt-24 lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
            <div className="relative">
              <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                Gestão de vagas e fornecedores
              </h3>
              <p className="mt-3 text-lg text-gray-500">
                Encontre os melhores profissionais e fornecedores para seu restaurante, tudo em um só lugar.
              </p>

              <dl className="mt-10 space-y-10">
                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <Briefcase className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Gestão de vagas</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Publique vagas, receba candidaturas e gerencie todo o processo de contratação em uma interface intuitiva.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <Package className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Marketplace de fornecedores</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Encontre fornecedores qualificados, compare preços e condições, e faça negócios diretamente pela plataforma.
                  </dd>
                </div>

                <div className="relative">
                  <dt>
                    <div className="absolute flex items-center justify-center h-12 w-12 rounded-md bg-orange-500 text-white">
                      <Users className="h-6 w-6" />
                    </div>
                    <p className="ml-16 text-lg leading-6 font-medium text-gray-900">Gestão de acessos</p>
                  </dt>
                  <dd className="mt-2 ml-16 text-base text-gray-500">
                    Crie acessos para sua equipe com permissões específicas, mantendo o controle total sobre quem acessa o quê.
                  </dd>
                </div>
              </dl>
            </div>

            <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
              <img
                className="relative mx-auto rounded-lg shadow-lg"
                width={490}
                src="https://images.pexels.com/photos/4427430/pexels-photo-4427430.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                alt="Gestão de vagas e fornecedores"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Testimonials */}
      <div id="testimonials" className="bg-gray-50 py-16 lg:py-24">
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative">
            <div className="text-center">
              <h2 className="text-3xl tracking-tight font-extrabold text-gray-900 sm:text-4xl">
                O que nossos clientes dizem
              </h2>
              <p className="mt-3 max-w-2xl mx-auto text-xl text-gray-500 sm:mt-4">
                Restaurantes de todo o Brasil estão transformando seus negócios com o FoodDash
              </p>
            </div>
            
            <div className="mt-12 max-w-lg mx-auto grid gap-5 lg:grid-cols-3 lg:max-w-none">
              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src="https://images.pexels.com/photos/220453/pexels-photo-220453.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Carlos Silva</p>
                        <p className="text-xs text-gray-500">Restaurante Sabor & Arte, São Paulo</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div className="mt-3 text-base text-gray-500">
                      "O comparativo de mercado do FoodDash foi revelador. Descobrimos que nosso CMV estava 8% acima da média regional e conseguimos ajustar nossos processos. Em 3 meses, aumentamos nossa margem de lucro em 15%."
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src="https://images.pexels.com/photos/774909/pexels-photo-774909.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Ana Oliveira</p>
                        <p className="text-xs text-gray-500">Cantina Bella Napoli, Rio de Janeiro</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div className="mt-3 text-base text-gray-500">
                      "A DRE automática economiza horas do meu tempo toda semana. Antes eu passava o domingo inteiro fazendo planilhas, agora tenho tudo em tempo real e posso focar no que realmente importa: atender bem meus clientes."
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col rounded-lg shadow-lg overflow-hidden">
                <div className="flex-1 bg-white p-6 flex flex-col justify-between">
                  <div className="flex-1">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <img className="h-10 w-10 rounded-full" src="https://images.pexels.com/photos/2379004/pexels-photo-2379004.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1" alt="" />
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium text-gray-900">Marcos Almeida</p>
                        <p className="text-xs text-gray-500">Churrascaria Brasa Viva, Belo Horizonte</p>
                      </div>
                    </div>
                    <div className="flex items-center mt-2">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 text-yellow-400 fill-current" />
                      ))}
                    </div>
                    <div className="mt-3 text-base text-gray-500">
                      "Encontramos nosso chef executivo através da plataforma de vagas do FoodDash. O processo foi simples e rápido. Além disso, conseguimos fornecedores com preços 12% menores para nossos principais insumos."
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feature Screenshots */}
      <div className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Conheça nossa plataforma
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Interface intuitiva e poderosa para transformar a gestão do seu restaurante
            </p>
          </div>

          <div className="mt-16">
            <div className="space-y-12">
              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                  <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
                    <img
                      className="relative mx-auto rounded-lg shadow-lg"
                      width={490}
                      src="https://images.pexels.com/photos/7821486/pexels-photo-7821486.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt="Dashboard com comparativo de mercado"
                    />
                  </div>
                  <div className="relative lg:col-start-2">
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                      Dashboard com comparativo de mercado
                    </h3>
                    <p className="mt-3 text-lg text-gray-500">
                      Visualize como seu restaurante se compara com outros estabelecimentos da mesma categoria e região. 
                      Identifique oportunidades de melhoria e celebre seus pontos fortes.
                    </p>
                    <div className="mt-10">
                      <Link
                        to="/auth"
                        className="text-base font-medium text-orange-600 hover:text-orange-500 flex items-center"
                      >
                        <span>Experimente gratuitamente</span>
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                  <div className="relative">
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                      DRE automática e análise financeira
                    </h3>
                    <p className="mt-3 text-lg text-gray-500">
                      Sua Demonstração de Resultados é gerada automaticamente a partir dos dados de vendas e despesas. 
                      Analise sua lucratividade, margens e tendências sem esforço.
                    </p>
                    <div className="mt-10">
                      <Link
                        to="/auth"
                        className="text-base font-medium text-orange-600 hover:text-orange-500 flex items-center"
                      >
                        <span>Experimente gratuitamente</span>
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                  <div className="mt-10 -mx-4 relative lg:mt-0 lg:col-start-2" aria-hidden="true">
                    <img
                      className="relative mx-auto rounded-lg shadow-lg"
                      width={490}
                      src="https://images.pexels.com/photos/6693661/pexels-photo-6693661.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt="DRE automática e análise financeira"
                    />
                  </div>
                </div>
              </div>

              <div className="relative">
                <div className="lg:grid lg:grid-cols-2 lg:gap-8 lg:items-center">
                  <div className="mt-10 -mx-4 relative lg:mt-0" aria-hidden="true">
                    <img
                      className="relative mx-auto rounded-lg shadow-lg"
                      width={490}
                      src="https://images.pexels.com/photos/7688336/pexels-photo-7688336.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=1"
                      alt="Gestão de vagas e fornecedores"
                    />
                  </div>
                  <div className="relative lg:col-start-2">
                    <h3 className="text-2xl font-extrabold text-gray-900 tracking-tight sm:text-3xl">
                      Gestão de vagas e fornecedores
                    </h3>
                    <p className="mt-3 text-lg text-gray-500">
                      Publique vagas, encontre os melhores profissionais e conecte-se com fornecedores qualificados. 
                      Tudo integrado à sua plataforma de gestão.
                    </p>
                    <div className="mt-10">
                      <Link
                        to="/auth"
                        className="text-base font-medium text-orange-600 hover:text-orange-500 flex items-center"
                      >
                        <span>Experimente gratuitamente</span>
                        <ChevronRight className="ml-1 h-5 w-5" />
                      </Link>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Pricing Section */}
      <div id="pricing" className="bg-gray-50 py-16 lg:py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold text-gray-900 sm:text-4xl">
              Planos simples e transparentes
            </h2>
            <p className="mt-4 max-w-2xl mx-auto text-xl text-gray-500">
              Escolha o plano ideal para o seu restaurante
            </p>
          </div>

          <div className="mt-16 space-y-12 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-x-8">
            <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Mensal</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">R$149,90</span>
                  <span className="ml-1 text-xl font-semibold">/mês</span>
                </p>
                <p className="mt-6 text-gray-500">
                  Ideal para testar a plataforma
                </p>

                <ul role="list" className="mt-6 space-y-6">
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Dashboard completo</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Gestão de vendas e despesas</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">DRE automática</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Comparativo com mercado</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/pricing"
                className="mt-8 block w-full bg-orange-600 border border-transparent rounded-md py-3 px-6 text-center font-medium text-white hover:bg-orange-700"
              >
                Começar agora
              </Link>
            </div>

            <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
              <div className="absolute top-0 inset-x-0 transform translate-y-px">
                <div className="flex justify-center transform -translate-y-1/2">
                  <span className="inline-flex rounded-full bg-orange-600 px-4 py-1 text-sm font-semibold tracking-wider uppercase text-white">
                    Mais popular
                  </span>
                </div>
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Semestral</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">R$129,90</span>
                  <span className="ml-1 text-xl font-semibold">/mês</span>
                </p>
                <p className="mt-6 text-gray-500">
                  Economia de 13% ao mês
                </p>

                <ul role="list" className="mt-6 space-y-6">
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Dashboard completo</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Gestão de vendas e despesas</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">DRE automática</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Comparativo com mercado</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Suporte prioritário</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/pricing"
                className="mt-8 block w-full bg-orange-600 border border-transparent rounded-md py-3 px-6 text-center font-medium text-white hover:bg-orange-700"
              >
                Começar agora
              </Link>
            </div>

            <div className="relative p-8 bg-white border border-gray-200 rounded-2xl shadow-sm flex flex-col">
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-gray-900">Anual</h3>
                <p className="mt-4 flex items-baseline text-gray-900">
                  <span className="text-5xl font-extrabold tracking-tight">R$99,90</span>
                  <span className="ml-1 text-xl font-semibold">/mês</span>
                </p>
                <p className="mt-6 text-gray-500">
                  Economia de 33% ao mês
                </p>

                <ul role="list" className="mt-6 space-y-6">
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Dashboard completo</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Gestão de vendas e despesas</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">DRE automática</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Comparativo com mercado</span>
                  </li>
                  <li className="flex">
                    <CheckCircle className="flex-shrink-0 w-6 h-6 text-green-500" />
                    <span className="ml-3 text-gray-500">Suporte VIP</span>
                  </li>
                </ul>
              </div>

              <Link
                to="/pricing"
                className="mt-8 block w-full bg-orange-600 border border-transparent rounded-md py-3 px-6 text-center font-medium text-white hover:bg-orange-700"
              >
                Começar agora
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ Section */}
      <div id="faq" className="bg-white">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            Perguntas frequentes
          </h2>
          <div className="mt-12">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:gap-x-8 md:gap-y-12 lg:grid-cols-3">
              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Preciso ter conhecimentos técnicos para usar o FoodDash?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Não! Nossa plataforma foi desenvolvida para ser intuitiva e fácil de usar. Você não precisa ter conhecimentos técnicos ou financeiros avançados.
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Como funciona o comparativo com o mercado?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Utilizamos dados anônimos agregados de restaurantes similares ao seu na mesma região e categoria culinária, permitindo comparações precisas e relevantes.
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Posso cancelar minha assinatura a qualquer momento?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Sim! Não há contratos de fidelidade. Você pode cancelar sua assinatura a qualquer momento, sem multas ou taxas adicionais.
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Meus dados estão seguros?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Absolutamente. Utilizamos criptografia de ponta a ponta e seguimos as melhores práticas de segurança para proteger seus dados. Sua privacidade é nossa prioridade.
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Quanto tempo leva para configurar a plataforma?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Em poucos minutos você já pode começar a usar. A configuração inicial é simples e intuitiva, e você pode importar seus dados existentes facilmente.
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-gray-900">
                  Vocês oferecem suporte técnico?
                </dt>
                <dd className="mt-2 text-base text-gray-500">
                  Sim! Oferecemos suporte por email para todos os planos, e suporte prioritário para os planos Semestral e Anual.
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-orange-600">
        <div className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:py-16 lg:px-8 lg:flex lg:items-center lg:justify-between">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            <span className="block">Pronto para transformar seu restaurante?</span>
            <span className="block text-orange-200">Comece hoje mesmo com 7 dias grátis.</span>
          </h2>
          <div className="mt-8 flex lg:mt-0 lg:flex-shrink-0">
            <div className="inline-flex rounded-md shadow">
              <Link
                to="/auth"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-orange-600 bg-white hover:bg-orange-50"
              >
                Começar agora
              </Link>
            </div>
            <div className="ml-3 inline-flex rounded-md shadow">
              <a
                href="#features"
                className="inline-flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-white bg-orange-700 hover:bg-orange-800"
              >
                Saiba mais
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-white">
        <div className="max-w-7xl mx-auto py-12 px-4 overflow-hidden sm:px-6 lg:px-8">
          <nav className="-mx-5 -my-2 flex flex-wrap justify-center" aria-label="Footer">
            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Sobre
              </a>
            </div>

            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Blog
              </a>
            </div>

            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Termos
              </a>
            </div>

            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Privacidade
              </a>
            </div>

            <div className="px-5 py-2">
              <a href="#" className="text-base text-gray-500 hover:text-gray-900">
                Contato
              </a>
            </div>
          </nav>
          <div className="mt-8 flex justify-center space-x-6">
            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Facebook</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
              </svg>
            </a>

            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Instagram</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M12.315 2c2.43 0 2.784.013 3.808.06 1.064.049 1.791.218 2.427.465a4.902 4.902 0 011.772 1.153 4.902 4.902 0 011.153 1.772c.247.636.416 1.363.465 2.427.048 1.067.06 1.407.06 4.123v.08c0 2.643-.012 2.987-.06 4.043-.049 1.064-.218 1.791-.465 2.427a4.902 4.902 0 01-1.153 1.772 4.902 4.902 0 01-1.772 1.153c-.636.247-1.363.416-2.427.465-1.067.048-1.407.06-4.123.06h-.08c-2.643 0-2.987-.012-4.043-.06-1.064-.049-1.791-.218-2.427-.465a4.902 4.902 0 01-1.772-1.153 4.902 4.902 0 01-1.153-1.772c-.247-.636-.416-1.363-.465-2.427-.047-1.024-.06-1.379-.06-3.808v-.63c0-2.43.013-2.784.06-3.808.049-1.064.218-1.791.465-2.427a4.902 4.902 0 011.153-1.772A4.902 4.902 0 015.45 2.525c.636-.247 1.363-.416 2.427-.465C8.901 2.013 9.256 2 11.685 2h.63zm-.081 1.802h-.468c-2.456 0-2.784.011-3.807.058-.975.045-1.504.207-1.857.344-.467.182-.8.398-1.15.748-.35.35-.566.683-.748 1.15-.137.353-.3.882-.344 1.857-.047 1.023-.058 1.351-.058 3.807v.468c0 2.456.011 2.784.058 3.807.045.975.207 1.504.344 1.857.182.466.399.8.748 1.15.35.35.683.566 1.15.748.353.137.882.3 1.857.344 1.054.048 1.37.058 4.041.058h.08c2.597 0 2.917-.01 3.96-.058.976-.045 1.505-.207 1.858-.344.466-.182.8-.398 1.15-.748.35-.35.566-.683.748-1.15.137-.353.3-.882.344-1.857.048-1.055.058-1.37.058-4.041v-.08c0-2.597-.01-2.917-.058-3.96-.045-.976-.207-1.505-.344-1.858a3.097 3.097 0 00-.748-1.15 3.098 3.098 0 00-1.15-.748c-.353-.137-.882-.3-1.857-.344-1.023-.047-1.351-.058-3.807-.058zM12 6.865a5.135 5.135 0 110 10.27 5.135 5.135 0 010-10.27zm0 1.802a3.333 3.333 0 100 6.666 3.333 3.333 0 000-6.666zm5.338-3.205a1.2 1.2 0 110 2.4 1.2 1.2 0 010-2.4z" clipRule="evenodd" />
              </svg>
            </a>

            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">Twitter</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
              </svg>
            </a>

            <a href="#" className="text-gray-400 hover:text-gray-500">
              <span className="sr-only">LinkedIn</span>
              <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path fillRule="evenodd" d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" clipRule="evenodd" />
              </svg>
            </a>
          </div>
          <p className="mt-8 text-center text-base text-gray-400">
            &copy; 2025 FoodDash. Todos os direitos reservados.
          </p>
        </div>
      </footer>
    </div>
  );
};