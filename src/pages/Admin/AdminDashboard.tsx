import React from 'react';
import { Users, Building2, BarChart3, TrendingUp, Database, Settings } from 'lucide-react';

export const AdminDashboard: React.FC = () => {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Painel Administrativo</h1>
          <p className="text-gray-600 mt-1">Gerencie dados do sistema FoodDash</p>
        </div>
        <div className="flex items-center space-x-3">
          <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-sm font-medium">
            Admin
          </span>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">1.247</h3>
          <p className="text-sm text-gray-600">Restaurantes Ativos</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Users className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">3.891</h3>
          <p className="text-sm text-gray-600">Usuários Totais</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">89</h3>
          <p className="text-sm text-gray-600">Dados de Benchmarking</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 rounded-lg bg-orange-50 text-orange-600 flex items-center justify-center">
              <TrendingUp className="w-6 h-6" />
            </div>
          </div>
          <h3 className="text-2xl font-bold text-gray-900 mb-1">+12%</h3>
          <p className="text-sm text-gray-600">Crescimento Mensal</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Gerenciar Restaurantes</h3>
              <p className="text-sm text-gray-600">Visualizar e editar dados dos restaurantes</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Dados de Benchmarking</h3>
              <p className="text-sm text-gray-600">Atualizar médias de mercado por região</p>
            </div>
          </div>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition-shadow cursor-pointer">
          <div className="flex items-center space-x-4">
            <div className="w-12 h-12 rounded-lg bg-green-50 text-green-600 flex items-center justify-center">
              <Database className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900">Backup do Sistema</h3>
              <p className="text-sm text-gray-600">Realizar backup dos dados</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
        <h3 className="font-semibold text-gray-900 mb-4">Atividade Recente</h3>
        <div className="space-y-4">
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Novo restaurante cadastrado</p>
              <p className="text-xs text-gray-600">Pizzaria Bella Vista - São Paulo, SP</p>
            </div>
            <span className="text-xs text-gray-500">2 min atrás</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Dados de benchmarking atualizados</p>
              <p className="text-xs text-gray-600">Categoria: Comida Japonesa - Rio de Janeiro, RJ</p>
            </div>
            <span className="text-xs text-gray-500">15 min atrás</span>
          </div>
          
          <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
            <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Backup automático realizado</p>
              <p className="text-xs text-gray-600">Todos os dados foram salvos com sucesso</p>
            </div>
            <span className="text-xs text-gray-500">1 hora atrás</span>
          </div>
        </div>
      </div>
    </div>
  );
};