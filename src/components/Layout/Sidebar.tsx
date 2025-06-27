import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useEmployeeAuth } from '../../hooks/useEmployeeAuth';
import { useSidebar } from '../../hooks/useSidebar';
import {
  Home, User, TrendingUp, CreditCard, FileText,
  BarChart3, Users, Briefcase, Settings, Package, Database,
  Menu, X, ChevronLeft, ChevronRight, Shield, Crown,
  ChevronDown, ChevronUp, UserCog, Calculator
} from 'lucide-react';

const restaurantNavItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard', permission: 'dashboard' },
  { to: '/profile', icon: User, label: 'Perfil', permission: 'profile' },
  { to: '/profile/access', icon: Shield, label: 'Gestão de Acessos', permission: 'profile' },
  { to: '/sales', icon: TrendingUp, label: 'Vendas', permission: 'sales' },
  { to: '/expenses', icon: CreditCard, label: 'Despesas', permission: 'expenses' },
  { to: '/dre', icon: FileText, label: 'DRE', permission: 'dre' },
  { to: '/valuation', icon: Calculator, label: 'Valuation', permission: 'dashboard' },
  { to: '/jobs', icon: Briefcase, label: 'Vagas', badge: 'Em breve', permission: 'dashboard' },
  { to: '/suppliers', icon: Package, label: 'Fornecedores', badge: 'Em breve', permission: 'dashboard' },
  { to: '/pricing', icon: Crown, label: 'Planos', permission: 'dashboard' },
];

const adminNavItems = [
  { to: '/admin', icon: Settings, label: 'Dashboard Admin' },
  { to: '/admin/restaurants', icon: Users, label: 'Restaurantes' },
  { to: '/admin/users', icon: UserCog, label: 'Usuários' },
  { to: '/admin/benchmarking', icon: BarChart3, label: 'Benchmarking' },
  { to: '/admin/categories', icon: Database, label: 'Categorias' },
  { to: '/admin/analytics', icon: TrendingUp, label: 'Análises' },
  { to: '/admin/valuation', icon: Calculator, label: 'Valuation' },
  { to: '/admin-access', icon: Shield, label: 'Gerenciar Admins' },
  { to: '/admin-promote', icon: Users, label: 'Promover Admin' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { employeeUser, isEmployeeAuth, hasPermission } = useEmployeeAuth();
  const { isCollapsed, isMobileMenuOpen, closeMobileMenu, toggleSidebar } = useSidebar();
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminMenuOpen, setAdminMenuOpen] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      if (user.email === 'admin@fooddash.com.br' || 
          user.email === 'caioschu@hotmail.com' || 
          user.tipo_usuario === 'admin') {
        setIsAdmin(true);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const toggleAdminMenu = (e: React.MouseEvent) => {
    e.preventDefault();
    setAdminMenuOpen(!adminMenuOpen);
  };

  // Filtrar itens de navegação com base nas permissões do funcionário
  const filteredNavItems = restaurantNavItems.filter(item => {
    if (isEmployeeAuth) {
      return hasPermission(item.permission);
    }
    return true;
  });

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        data-menu-button
        onClick={toggleSidebar}
        className="fixed top-4 left-4 z-50 p-2 bg-white border border-gray-200 rounded-lg shadow-sm text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors md:hidden"
        style={{ top: '20px', left: '20px' }}
      >
        {isMobileMenuOpen ? (
          <X className="w-5 h-5" />
        ) : (
          <Menu className="w-5 h-5" />
        )}
      </button>

      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden"
          onClick={closeMobileMenu}
        />
      )}

      {/* Sidebar */}
      <aside 
        id="mobile-sidebar"
        className={`
          fixed top-16 left-0 h-[calc(100vh-4rem)] w-64 bg-white border-r border-gray-200 overflow-y-auto transition-all duration-300 z-30 flex flex-col
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          md:translate-x-0 md:top-20 md:h-[calc(100vh-5rem)]
          ${isCollapsed ? 'md:w-16' : 'md:w-64'}
        `}
      >
        {/* Navigation Items */}
        <nav className="p-3 md:p-4 space-y-1 md:space-y-2 flex-1">
          {/* Restaurant Nav Items */}
          {filteredNavItems.map((item, index) => (
            <div key={`${item.to}-${index}`}>
              <NavLink
                to={item.to}
                onClick={() => {
                  if (window.innerWidth < 768) {
                    closeMobileMenu();
                  }
                }}
                className={({ isActive }) =>
                  `flex items-center ${
                    isCollapsed && window.innerWidth >= 768 
                      ? 'justify-center px-2 md:px-3' 
                      : 'space-x-3 px-3'
                  } py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors relative group ${
                    isActive
                      ? 'bg-orange-100 text-orange-700'
                      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                  }`
                }
                title={isCollapsed ? item.label : undefined}
              >
                <item.icon className="w-5 h-5 flex-shrink-0" />
                
                {(!isCollapsed || window.innerWidth < 768) && (
                  <div className="flex items-center justify-between w-full">
                    <span>{item.label}</span>
                    <div className="flex items-center space-x-2">
                      {item.badge && (
                        <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white rounded-full shadow-sm">
                          {item.badge}
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </NavLink>
            </div>
          ))}

          {/* Admin Section - Only show if user is admin and not employee */}
          {isAdmin && !isEmployeeAuth && (
            <div className="pt-4 mt-4 border-t border-gray-200">
              {/* Admin Section Header with Dropdown */}
              <div 
                className={`flex items-center ${
                  isCollapsed && window.innerWidth >= 768 
                    ? 'justify-center px-2 md:px-3' 
                    : 'space-x-3 px-3'
                } py-2.5 md:py-2 rounded-lg text-sm font-medium transition-colors cursor-pointer text-gray-600 hover:bg-gray-100 hover:text-gray-900`}
                onClick={toggleAdminMenu}
              >
                <Settings className="w-5 h-5 flex-shrink-0 text-purple-600" />
                
                {(!isCollapsed || window.innerWidth < 768) && (
                  <div className="flex items-center justify-between w-full">
                    <span className="font-semibold text-purple-600">Administração</span>
                    {adminMenuOpen ? 
                      <ChevronUp className="w-4 h-4 text-purple-600" /> : 
                      <ChevronDown className="w-4 h-4 text-purple-600" />
                    }
                  </div>
                )}
              </div>

              {/* Admin Nav Items - Show when dropdown is open */}
              {(adminMenuOpen || isCollapsed) && (
                <div className={`mt-1 ${isCollapsed && window.innerWidth >= 768 ? '' : 'ml-4'}`}>
                  {adminNavItems.map((item, index) => (
                    <div key={`${item.to}-${index}`}>
                      <NavLink
                        to={item.to}
                        onClick={() => {
                          if (window.innerWidth < 768) {
                            closeMobileMenu();
                          }
                        }}
                        className={({ isActive }) =>
                          `flex items-center ${
                            isCollapsed && window.innerWidth >= 768 
                              ? 'justify-center px-2 md:px-3' 
                              : 'space-x-3 px-3'
                          } py-2 md:py-1.5 rounded-lg text-sm font-medium transition-colors relative group ${
                            isActive
                              ? 'bg-purple-100 text-purple-700'
                              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                          }`
                        }
                        title={isCollapsed ? item.label : undefined}
                      >
                        <item.icon className="w-5 h-5 flex-shrink-0" />
                        
                        {(!isCollapsed || window.innerWidth < 768) && (
                          <span>{item.label}</span>
                        )}
                      </NavLink>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </nav>

        {/* Collapse Button */}
        <div className="hidden md:block p-4 border-t border-gray-200">
          <button
            onClick={toggleSidebar}
            className={`w-full flex items-center ${
              isCollapsed ? 'justify-center' : 'justify-between'
            } px-3 py-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors text-sm`}
            title={isCollapsed ? 'Expandir sidebar' : 'Recolher sidebar'}
          >
            {!isCollapsed && <span>Recolher menu</span>}
            {isCollapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        </div>
      </aside>
    </>
  );
};