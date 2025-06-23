import { createContext, useContext, useState, ReactNode } from 'react';
import { Toast, ToastType } from '../components/Common/Toast';

interface ToastContextType {
  showToast: (type: ToastType, title: string, message?: string, duration?: number) => void;
  showSuccess: (title: string, message?: string) => void;
  showError: (title: string, message?: string) => void;
  showWarning: (title: string, message?: string) => void;
  showInfo: (title: string, message?: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

interface ToastState {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
  duration?: number;
}

export const ToastProvider = ({ children }: { children: ReactNode }) => {
  const [toasts, setToasts] = useState<ToastState[]>([]);

  const showToast = (type: ToastType, title: string, message?: string, duration?: number) => {
    const id = Math.random().toString(36).substring(2);
    const newToast: ToastState = { id, type, title, message, duration };
    
    setToasts(prev => [...prev, newToast]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  };

  const showSuccess = (title: string, message?: string) => {
    showToast('success', title, message);
  };

  const showError = (title: string, message?: string) => {
    showToast('error', title, message);
  };

  const showWarning = (title: string, message?: string) => {
    showToast('warning', title, message);
  };

  const showInfo = (title: string, message?: string) => {
    showToast('info', title, message);
  };

  return (
    <ToastContext.Provider value={{
      showToast,
      showSuccess,
      showError,
      showWarning,
      showInfo
    }}>
      {children}
      
      {/* Render Toasts */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            type={toast.type}
            title={toast.title}
            message={toast.message}
            isVisible={true}
            onClose={() => removeToast(toast.id)}
            duration={toast.duration}
          />
        ))}
      </div>
    </ToastContext.Provider>
  );
};