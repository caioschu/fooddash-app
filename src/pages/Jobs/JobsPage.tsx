import React, { useState } from 'react';
import { Search, Briefcase, MapPin, Clock, DollarSign, MessageSquare, Mail, Filter } from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';

type Job = {
  id: string;
  title: string;
  company: string;
  location: string;
  schedule: string;
  salary?: string;
  description: string;
  requirements: string[];
  benefits: string[];
  contactPreference: 'whatsapp' | 'email' | 'both';
  contact: {
    whatsapp?: string;
    email?: string;
  };
  createdAt: string;
  jobType: string;
};

// Job types organized by category
const jobCategories = [
  {
    name: 'Todos',
    roles: []
  },
  {
    name: 'Cozinha',
    roles: [
      'Chef de Cozinha',
      'Sous Chef',
      'Chef de Partida',
      'Cozinheiro(a)',
      'Auxiliar de Cozinha',
      'Confeiteiro(a)',
      'Padeiro(a)',
      'Sushiman',
      'Pizzaiolo(a)'
    ]
  },
  {
    name: 'Salão',
    roles: [
      'Maître',
      'Gerente de Salão',
      'Garçom/Garçonete',
      'Sommelier',
      'Hostess',
      'Barista',
      'Bartender',
      'Cumim'
    ]
  },
  {
    name: 'Administrativo',
    roles: [
      'Gerente Geral',
      'Gerente Administrativo',
      'Supervisor(a)',
      'Coordenador(a)',
      'Assistente Administrativo',
      'Comprador(a)',
      'Financeiro',
      'RH'
    ]
  },
  {
    name: 'Delivery',
    roles: [
      'Atendente de Delivery',
      'Motoboy/Motogirl',
      'Entregador(a)',
      'Coordenador(a) de Delivery'
    ]
  },
  {
    name: 'Outros',
    roles: [
      'Auxiliar de Limpeza',
      'Auxiliar de Serviços Gerais',
      'Estoquista',
      'Segurança',
      'Manobrista'
    ]
  }
];

// Get all roles from all categories
const allRoles = jobCategories.reduce((acc, category) => {
  if (category.name !== 'Todos') {
    return [...acc, ...category.roles];
  }
  return acc;
}, [] as string[]);

// Update the first category with all roles
jobCategories[0].roles = allRoles;

// Brazilian cities
const cities = [
  'São Paulo, SP',
  'Rio de Janeiro, RJ',
  'Belo Horizonte, MG',
  'Curitiba, PR',
  'Porto Alegre, RS',
  'Salvador, BA',
  'Recife, PE',
  'Fortaleza, CE',
  'Brasília, DF',
  'Manaus, AM'
];

export const JobsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [showFilters, setShowFilters] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  
  // Mock jobs data
  const [jobs] = useState<Job[]>([
    {
      id: '1',
      title: 'Cozinheiro(a)',
      company: 'Restaurante Italiano Bella Pasta',
      location: 'São Paulo, SP',
      schedule: 'Integral, 44h semanais',
      salary: 'R$ 2.800,00',
      description: 'Restaurante especializado em culinária italiana busca cozinheiro(a) com experiência em massas e risotos. Necessário experiência mínima de 2 anos em cozinha profissional.',
      requirements: [
        'Experiência mínima de 2 anos em cozinha italiana',
        'Conhecimento em preparo de massas e risotos',
        'Disponibilidade para trabalhar aos finais de semana'
      ],
      benefits: [
        'Vale transporte',
        'Vale refeição',
        'Plano de saúde',
        'Seguro de vida'
      ],
      contactPreference: 'both',
      contact: {
        whatsapp: '5511987654321',
        email: 'chef@bellapasta.com'
      },
      createdAt: '2025-06-01',
      jobType: 'Cozinheiro(a)'
    },
    {
      id: '2',
      title: 'Garçom/Garçonete',
      company: 'Restaurante Italiano Bella Pasta',
      location: 'São Paulo, SP',
      schedule: 'Integral, 44h semanais',
      salary: 'R$ 1.800,00 + gorjetas',
      description: 'Buscamos profissionais com experiência em atendimento ao cliente para compor nossa equipe de salão.',
      requirements: [
        'Experiência mínima de 1 ano como garçom/garçonete',
        'Boa comunicação',
        'Disponibilidade para trabalhar aos finais de semana'
      ],
      benefits: [
        'Vale transporte',
        'Vale refeição',
        'Plano de saúde',
        'Seguro de vida'
      ],
      contactPreference: 'whatsapp',
      contact: {
        whatsapp: '5511987654321'
      },
      createdAt: '2025-06-02',
      jobType: 'Garçom/Garçonete'
    },
    {
      id: '3',
      title: 'Chef de Cozinha',
      company: 'Sushi House',
      location: 'Belo Horizonte, MG',
      schedule: 'Integral, 44h semanais',
      salary: 'R$ 4.500,00',
      description: 'Procuramos Chef de Cozinha especializado em culinária japonesa para liderar nossa equipe. Experiência comprovada em sushi e pratos orientais.',
      requirements: [
        'Experiência mínima de 5 anos como chef',
        'Especialização em culinária japonesa',
        'Liderança de equipe',
        'Conhecimento em controle de custos'
      ],
      benefits: [
        'Vale transporte',
        'Vale refeição',
        'Plano de saúde',
        'Participação nos lucros',
        'Seguro de vida'
      ],
      contactPreference: 'email',
      contact: {
        email: 'rh@sushihouse.com'
      },
      createdAt: '2025-05-28',
      jobType: 'Chef de Cozinha'
    }
  ]);

  // Filter jobs based on search, location and roles
  const filteredJobs = jobs.filter(job => {
    const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         job.company.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesLocation = !locationFilter || job.location === locationFilter;
    const matchesRoles = selectedRoles.length === 0 || selectedRoles.includes(job.jobType);
    
    return matchesSearch && matchesLocation && matchesRoles;
  });

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vagas Disponíveis</h1>
          <p className="text-gray-600 mt-1">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'vaga encontrada' : 'vagas encontradas'}
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar vagas..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              <option value="">Todas as cidades</option>
              {cities.map(city => (
                <option key={city} value={city}>{city}</option>
              ))}
            </select>

            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center px-4 py-3 text-gray-700 hover:text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
            >
              <Filter className="h-5 w-5 mr-2" />
              {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
            </button>
          </div>
        </div>
        
        {showFilters && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Cargos de Interesse
            </label>
            <div className="flex flex-wrap gap-2 mb-4">
              {jobCategories.map(category => (
                <button
                  key={category.name}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.name
                      ? 'bg-orange-100 text-orange-800'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {jobCategories
                .find(cat => cat.name === selectedCategory)
                ?.roles.map(role => (
                  <label
                    key={role}
                    className={`relative flex items-center p-4 rounded-lg cursor-pointer transition-colors ${
                      selectedRoles.includes(role)
                        ? 'bg-orange-50 border-2 border-orange-500'
                        : 'bg-white border border-gray-200 hover:border-orange-200'
                    }`}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={selectedRoles.includes(role)}
                      onChange={() => {
                        setSelectedRoles(
                          selectedRoles.includes(role)
                            ? selectedRoles.filter(r => r !== role)
                            : [...selectedRoles, role]
                        );
                      }}
                    />
                    <span className={`text-sm ${
                      selectedRoles.includes(role)
                        ? 'font-medium text-orange-700'
                        : 'text-gray-700'
                    }`}>
                      {role}
                    </span>
                  </label>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="space-y-6">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-200">
            <div className="p-6">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <h3 className="text-lg font-medium text-gray-900 mb-1">{job.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{job.company}</p>
                  
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center text-sm text-gray-500">
                      <MapPin className="h-4 w-4 mr-1" />
                      {job.location}
                    </div>
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="h-4 w-4 mr-1" />
                      {job.schedule}
                    </div>
                    {job.salary && (
                      <div className="flex items-center text-sm text-gray-500">
                        <DollarSign className="h-4 w-4 mr-1" />
                        {job.salary}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-gray-700 mb-4">
                    <p className="mb-4">{job.description}</p>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Requisitos:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {job.requirements.map((req, index) => (
                          <li key={index} className="text-sm text-gray-600">{req}</li>
                        ))}
                      </ul>
                    </div>
                    
                    <div className="mb-4">
                      <h4 className="text-sm font-medium text-gray-900 mb-2">Benefícios:</h4>
                      <ul className="list-disc list-inside space-y-1">
                        {job.benefits.map((benefit, index) => (
                          <li key={index} className="text-sm text-gray-600">{benefit}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-3">
                    {job.contact.whatsapp && (
                      <a
                        href={`https://wa.me/${job.contact.whatsapp}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                      >
                        <MessageSquare className="h-4 w-4" />
                        <span>WhatsApp</span>
                      </a>
                    )}
                    
                    {job.contact.email && (
                      <a
                        href={`mailto:${job.contact.email}`}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                      >
                        <Mail className="h-4 w-4" />
                        <span>Email</span>
                      </a>
                    )}
                  </div>
                </div>
                
                <div className="text-right ml-6">
                  <span className="inline-block px-3 py-1 text-xs font-medium rounded-full bg-orange-100 text-orange-800">
                    {new Date(job.createdAt).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="text-center py-12">
            <Briefcase className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhuma vaga encontrada</h3>
            <p className="text-gray-600">
              Tente ajustar seus filtros ou busque por outro termo.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};