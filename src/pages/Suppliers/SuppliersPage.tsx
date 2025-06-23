import React, { useState } from 'react';
import { Search, Package, MapPin, Phone, Mail, Filter, Star, Building2 } from 'lucide-react';

type Supplier = {
  id: string;
  name: string;
  category: string;
  location: string;
  phone: string;
  email: string;
  rating: number;
  description: string;
  products: string[];
  certifications: string[];
  deliveryAreas: string[];
  minimumOrder?: string;
  paymentTerms: string[];
  logo?: string;
  verified: boolean;
};

// Supplier categories
const supplierCategories = [
  'Todos',
  'Carnes e Aves',
  'Peixes e Frutos do Mar',
  'Vegetais e Frutas',
  'Laticínios',
  'Bebidas',
  'Panificação',
  'Condimentos e Temperos',
  'Produtos de Limpeza',
  'Embalagens',
  'Equipamentos',
  'Outros'
];

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

export const SuppliersPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [locationFilter, setLocationFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('Todos');
  const [showFilters, setShowFilters] = useState(true);
  
  // Mock suppliers data
  const [suppliers] = useState<Supplier[]>([
    {
      id: '1',
      name: 'Distribuidora Fresh Foods',
      category: 'Vegetais e Frutas',
      location: 'São Paulo, SP',
      phone: '(11) 3456-7890',
      email: 'vendas@freshfoods.com.br',
      rating: 4.8,
      description: 'Fornecedor especializado em vegetais orgânicos e frutas frescas. Atendemos restaurantes de alta qualidade com produtos selecionados diariamente no CEAGESP.',
      products: ['Vegetais orgânicos', 'Frutas frescas', 'Ervas aromáticas', 'Cogumelos especiais'],
      certifications: ['Orgânico Brasil', 'HACCP', 'ISO 22000'],
      deliveryAreas: ['São Paulo Capital', 'Grande São Paulo', 'Campinas'],
      minimumOrder: 'R$ 200,00',
      paymentTerms: ['À vista', '7 dias', '14 dias', '30 dias'],
      verified: true
    },
    {
      id: '2',
      name: 'Açougue Premium Carnes',
      category: 'Carnes e Aves',
      location: 'Belo Horizonte, MG',
      phone: '(31) 2345-6789',
      email: 'contato@premiumcarnes.com.br',
      rating: 4.9,
      description: 'Fornecedor de carnes nobres e aves de primeira qualidade. Trabalhamos com frigoríficos certificados e oferecemos cortes especiais para restaurantes.',
      products: ['Carnes bovinas premium', 'Aves caipiras', 'Suínos especiais', 'Cortes sob medida'],
      certifications: ['SIF', 'HACCP', 'BPF'],
      deliveryAreas: ['Belo Horizonte', 'Região Metropolitana'],
      minimumOrder: 'R$ 500,00',
      paymentTerms: ['À vista', '15 dias', '30 dias'],
      verified: true
    },
    {
      id: '3',
      name: 'Oceano Azul Pescados',
      category: 'Peixes e Frutos do Mar',
      location: 'Rio de Janeiro, RJ',
      phone: '(21) 3456-7890',
      email: 'vendas@oceanoazul.com.br',
      rating: 4.7,
      description: 'Especialistas em peixes frescos e frutos do mar. Recebemos produtos diariamente dos principais portos do Brasil, garantindo máxima qualidade e frescor.',
      products: ['Peixes frescos', 'Camarões', 'Lulas', 'Polvos', 'Ostras', 'Mariscos'],
      certifications: ['DIPOA', 'HACCP', 'MSC'],
      deliveryAreas: ['Rio de Janeiro', 'Niterói', 'Região dos Lagos'],
      minimumOrder: 'R$ 300,00',
      paymentTerms: ['À vista', '7 dias', '21 dias'],
      verified: true
    },
    {
      id: '4',
      name: 'Laticínios Vale Verde',
      category: 'Laticínios',
      location: 'Curitiba, PR',
      phone: '(41) 3456-7890',
      email: 'comercial@valeverde.com.br',
      rating: 4.6,
      description: 'Produtores de laticínios artesanais e industriais. Oferecemos queijos especiais, iogurtes, manteigas e cremes para restaurantes que buscam qualidade diferenciada.',
      products: ['Queijos artesanais', 'Iogurtes', 'Manteigas especiais', 'Cremes culinários', 'Leites especiais'],
      certifications: ['SIF', 'Orgânico Brasil', 'HACCP'],
      deliveryAreas: ['Curitiba', 'Região Metropolitana', 'Interior do Paraná'],
      minimumOrder: 'R$ 250,00',
      paymentTerms: ['À vista', '14 dias', '28 dias'],
      verified: false
    }
  ]);

  // Filter suppliers based on search, location and category
  const filteredSuppliers = suppliers.filter(supplier => {
    const matchesSearch = supplier.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         supplier.products.some(product => product.toLowerCase().includes(searchTerm.toLowerCase()));
    
    const matchesLocation = !locationFilter || supplier.location === locationFilter;
    const matchesCategory = categoryFilter === 'Todos' || supplier.category === categoryFilter;
    
    return matchesSearch && matchesLocation && matchesCategory;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        className={`w-4 h-4 ${
          i < Math.floor(rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Fornecedores</h1>
          <p className="text-gray-600 mt-1">
            {filteredSuppliers.length} {filteredSuppliers.length === 1 ? 'fornecedor encontrado' : 'fornecedores encontrados'}
          </p>
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Buscar fornecedores ou produtos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            />
          </div>
          
          <div className="flex flex-wrap gap-4">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent transition-colors"
            >
              {supplierCategories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Apenas Verificados
                </label>
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    className="rounded border-gray-300 text-orange-600 focus:ring-orange-500"
                  />
                  <span className="ml-2 text-sm text-gray-600">Mostrar apenas fornecedores verificados</span>
                </label>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Avaliação Mínima
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="">Qualquer avaliação</option>
                  <option value="4.5">4.5+ estrelas</option>
                  <option value="4.0">4.0+ estrelas</option>
                  <option value="3.5">3.5+ estrelas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Prazo de Pagamento
                </label>
                <select className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent">
                  <option value="">Qualquer prazo</option>
                  <option value="vista">À vista</option>
                  <option value="7">7 dias</option>
                  <option value="15">15 dias</option>
                  <option value="30">30 dias</option>
                </select>
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {filteredSuppliers.map(supplier => (
          <div key={supplier.id} className="bg-white rounded-xl shadow-sm border border-gray-100 hover:border-orange-200 hover:shadow-md transition-all duration-200">
            <div className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
                    <Building2 className="w-6 h-6 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="text-lg font-medium text-gray-900 flex items-center">
                      {supplier.name}
                      {supplier.verified && (
                        <span className="ml-2 px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full">
                          Verificado
                        </span>
                      )}
                    </h3>
                    <p className="text-sm text-gray-600">{supplier.category}</p>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="flex items-center space-x-1 mb-1">
                    {renderStars(supplier.rating)}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{supplier.rating}</span>
                </div>
              </div>

              <div className="flex items-center text-sm text-gray-500 mb-3">
                <MapPin className="h-4 w-4 mr-1" />
                {supplier.location}
              </div>

              <p className="text-gray-700 mb-4 text-sm">{supplier.description}</p>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Produtos:</h4>
                <div className="flex flex-wrap gap-2">
                  {supplier.products.slice(0, 3).map((product, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded-full"
                    >
                      {product}
                    </span>
                  ))}
                  {supplier.products.length > 3 && (
                    <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                      +{supplier.products.length - 3} mais
                    </span>
                  )}
                </div>
              </div>

              <div className="mb-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">Certificações:</h4>
                <div className="flex flex-wrap gap-2">
                  {supplier.certifications.map((cert, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 text-xs font-medium bg-green-100 text-green-800 rounded-full"
                    >
                      {cert}
                    </span>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4 text-sm">
                <div>
                  <span className="text-gray-500">Pedido mínimo:</span>
                  <p className="font-medium text-gray-900">{supplier.minimumOrder || 'Não informado'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Área de entrega:</span>
                  <p className="font-medium text-gray-900">{supplier.deliveryAreas[0]}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 pt-4 border-t border-gray-100">
                <a
                  href={`tel:${supplier.phone}`}
                  className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                >
                  <Phone className="h-4 w-4 mr-2" />
                  Ligar
                </a>
                
                <a
                  href={`mailto:${supplier.email}`}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Email
                </a>

                <button className="flex items-center px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm">
                  <Package className="h-4 w-4 mr-2" />
                  Ver Catálogo
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredSuppliers.length === 0 && (
        <div className="text-center py-12">
          <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Nenhum fornecedor encontrado</h3>
          <p className="text-gray-600">
            Tente ajustar seus filtros ou busque por outro termo.
          </p>
        </div>
      )}
    </div>
  );
};