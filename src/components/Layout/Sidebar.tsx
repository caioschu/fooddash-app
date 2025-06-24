import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useSidebar } from '../../hooks/useSidebar';
import {
  Home, User, TrendingUp, CreditCard, FileText,
  BarChart3, Users, Briefcase, Settings, Package, Database,
  Menu, X, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Shield, Crown, Globe
} from 'lucide-react';

const restaurantNavItems = [
  { to: '/dashboard', icon: Home, label: 'Dashboard' },
  { to: '/profile', icon: User, label: 'Perfil' },
  { to: '/profile/access', icon: Shield, label: 'Gestão de Acessos' },
  { to: '/sales', icon: TrendingUp, label: 'Vendas' },
  { to: '/expenses', icon: CreditCard, label: 'Despesas' },
  { to: '/dre', icon: FileText, label: 'DRE' },
  { to: '/jobs', icon: Briefcase, label: 'Vagas', badge: 'Em breve' },
  { to: '/suppliers', icon: Package, label: 'Fornecedores', badge: 'Em breve' },
  { to: '/pricing', icon: Crown, label: 'Planos' },
];

const supplierNavItems = [
  { to: '/supplier-dashboard', icon: Home, label: 'Dashboard' },
  { to: '/supplier-profile', icon: User, label: 'Perfil' },
  { to: '/restaurants', icon: Users, label: 'Restaurantes' },
  { to: '/pricing', icon: Crown, label: 'Planos' },
];

const candidateNavItems = [
  { to: '/candidate-dashboard', icon: Home, label: 'Dashboard' },
  { to: '/candidate-profile', icon: User, label: 'Perfil' },
  { to: '/job-listings', icon: Briefcase, label: 'Vagas' },
  { to: '/pricing', icon: Crown, label: 'Planos' },
];

const adminNavItems = [
  { to: '/admin', icon: Settings, label: 'Administração' },
  { to: '/admin/restaurants', icon: Users, label: 'Restaurantes' },
  { to: '/admin/suppliers', icon: Package, label: 'Fornecedores' },
  { to: '/admin/benchmarking', icon: BarChart3, label: 'Benchmarking' },
  { to: '/admin/categories', icon: Database, label: 'Categorias' },
  { to: '/admin/analytics', icon: TrendingUp, label: 'Análises' },
  { to: '/admin-access', icon: Shield, label: 'Gerenciar Admins' },
  { to: '/admin-promote', icon: Users, label: 'Promover Admin' },
  { to: '/pricing', icon: Crown, label: 'Planos' },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuth();
  const { isCollapsed, isMobileMenuOpen, closeMobileMenu, toggleSidebar } = useSidebar();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [isAdmin, setIsAdmin] = useState(false);

  // Verificar se o usuário é admin
  useEffect(() => {
    const checkAdminStatus = async () => {
      if (!user) return;
      
      // Verificar se o email é de admin
      if (user.email === 'admin@fooddash.com.br' || 
          user.email === 'caioschu@hotmail.com' || 
          user.tipo_usuario === 'admin') {
        setIsAdmin(true);
      }
    };
    
    checkAdminStatus();
  }, [user]);

  const getNavItems = () => {
    if (!user) return restaurantNavItems;
    
    switch (user?.tipo_usuario) {
      case 'restaurante':
        return isAdmin || user.email === 'caioschu@hotmail.com' || user.email === 'admin@fooddash.com.br'
          ? [...restaurantNavItems, 
              ...adminNavItems
            ] 
          : restaurantNavItems;
      case 'fornecedor':
        return supplierNavItems;
      case 'candidato':
        return candidateNavItems;
      case 'admin':
        return [...restaurantNavItems, ...adminNavItems];
      default:
        return restaurantNavItems;
    }
  };

  const navItems = getNavItems();

  // Fechar menu mobile ao clicar fora
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const sidebar = document.getElementById('mobile-sidebar');
      const menuButton = document.querySelector('[data-menu-button]');
      
      if (isMobileMenuOpen && sidebar && !sidebar.contains(event.target as Node) && 
          !menuButton?.contains(event.target as Node)) {
        closeMobileMenu();
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMobileMenuOpen, closeMobileMenu]);

  const toggleSubmenu = (itemLabel: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [itemLabel]: !prev[itemLabel]
    }));
  };

  return (
    <>
      {/* Mobile Menu Button - Posicionado no canto superior esquerdo */}
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
          {navItems.map((item) => (
            <div key={item.to}>
              {/* Main Item */}
              <div className="relative">
                <NavLink
                  to={item.to}
                  onClick={() => {
                    // Fechar menu mobile ao navegar
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
                  
                  {/* Label - Hidden quando collapsed no desktop */}
                  {(!isCollapsed || window.innerWidth < 768) && (
                    <div className="flex items-center justify-between w-full">
                      <span>{item.label}</span>
                      <div className="flex items-center space-x-2">
                        {item.badge && (
                          <span className="inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 via-red-600 to-pink-600 text-white rounded-full shadow-sm transform transition-all duration-200 hover:scale-110 hover:shadow-md border border-red-400/20">
                            <span className="relative z-10 tracking-tight">{item.badge}</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full animate-pulse"></div>
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* Badge para sidebar collapsed - versão compacta */}
                  {isCollapsed && item.badge && window.innerWidth >= 768 && (
                    <div className="absolute -top-0.5 -right-0.5">
                      <span className="flex h-3 w-3 relative">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-gradient-to-r from-red-500 to-pink-600 border border-white shadow-sm"></span>
                      </span>
                      <div className="absolute left-6 top-1/2 transform -translate-y-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-50 pointer-events-none shadow-lg">
                        {item.badge}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-1 w-0 h-0 border-t-[3px] border-b-[3px] border-r-[4px] border-transparent border-r-gray-900"></div>
                      </div>
                    </div>
                  )}
                </NavLink>
              </div>
            </div>
          ))}
        </nav>

        {/* Collapse Button - Apenas no desktop, posicionado embaixo */}
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