import React from 'react';
import { Shield, Lock } from 'lucide-react';
import { useEmployeeAuth } from '../../hooks/useEmployeeAuth';
import { useAuth } from '../../hooks/useAuth';

interface PermissionGuardProps {
  permission: 'sales' | 'expenses' | 'dre' | 'profile' | 'dashboard' | 'analytics' | 'reports' | 'settings';
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const PermissionGuard: React.FC<PermissionGuardProps> = ({
  permission,
  children,
  fallback
}) => {
  const { hasPermission, isEmployeeAuth, employeeUser } = useEmployeeAuth();
  const { user } = useAuth();

  // Se não é funcionário (é usuário normal), libera acesso
  if (!isEmployeeAuth) {
    return <>{children}</>;
  }

  // Se é funcionário mas não tem permissão
  if (!hasPermission(permission)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className="flex flex-col items-center justify-center p-8 text-center">
        <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
          <Lock className="w-8 h-8 text-red-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Acesso Negado</h3>
        <p className="text-gray-600 mb-4">
          Você não tem permissão para acessar esta funcionalidade.
        </p>
        <div className="text-sm text-gray-500">
          Usuário: {employeeUser?.name} ({employeeUser?.email})
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

// Hook para usar nas páginas
export const usePermissionCheck = () => {
  const { hasPermission, isEmployeeAuth } = useEmployeeAuth();
  const { user } = useAuth();

  const checkPermission = (permission: string): boolean => {
    if (!isEmployeeAuth) return true; // Usuário normal sempre tem acesso
    return hasPermission(permission as any);
  };

  return { checkPermission, isEmployeeAuth };
};