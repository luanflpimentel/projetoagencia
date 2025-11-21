// components/ui/confirm-modal.tsx - VERSÃO CORRIGIDA
'use client';

import { ReactNode } from 'react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  type = 'danger',
  loading = false,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const typeStyles = {
    danger: {
      icon: (
        <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-red-100',
      button: 'bg-red-600 hover:bg-red-700 focus:ring-red-500',
    },
    warning: {
      icon: (
        <svg className="h-6 w-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      iconBg: 'bg-yellow-100',
      button: 'bg-yellow-600 hover:bg-yellow-700 focus:ring-yellow-500',
    },
    info: {
      icon: (
        <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
      iconBg: 'bg-blue-100',
      button: 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500',
    },
  };

  const styles = typeStyles[type];

  return (
    <>
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full p-6 animate-scale-in">
            <div className="sm:flex sm:items-start">
              <div className={`mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full ${styles.iconBg} sm:mx-0 sm:h-10 sm:w-10`}>
                {styles.icon}
              </div>
              <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left flex-1">
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
                {description && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-600">
                      {description}
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse gap-2">
              <button
                type="button"
                disabled={loading}
                onClick={onConfirm}
                className={`
                  w-full inline-flex justify-center items-center rounded-md border border-transparent px-4 py-2 text-base font-medium text-white shadow-sm sm:w-auto sm:text-sm
                  ${styles.button}
                  disabled:opacity-50 disabled:cursor-not-allowed
                  focus:outline-none focus:ring-2 focus:ring-offset-2
                `}
              >
                {loading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processando...
                  </>
                ) : (
                  confirmText
                )}
              </button>
              <button
                type="button"
                disabled={loading}
                onClick={onClose}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 bg-white px-4 py-2 text-base font-medium text-gray-700 shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {cancelText}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// Hook para facilitar o uso
import { useState, useCallback } from 'react';

interface UseConfirmModalConfig {
  title?: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  type?: 'danger' | 'warning' | 'info';
  loading?: boolean;
  onConfirm?: () => void;
}

export function useConfirmModal() {
  const [isOpen, setIsOpen] = useState(false);
  const [config, setConfig] = useState<UseConfirmModalConfig>({});

  const openConfirm = useCallback((options: UseConfirmModalConfig) => {
    setConfig(options);
    setIsOpen(true);
  }, []);

  const closeConfirm = useCallback(() => {
    setIsOpen(false);
  }, []);

  const ConfirmModalComponent = useCallback((props: Partial<ConfirmModalProps> = {}) => (
    <ConfirmModal
      isOpen={isOpen}
      onClose={closeConfirm}
      title={config.title || props.title || 'Confirmar'}
      description={config.description || props.description}
      confirmText={config.confirmText || props.confirmText}
      cancelText={config.cancelText || props.cancelText}
      type={config.type || props.type}
      loading={config.loading || props.loading}
      onConfirm={config.onConfirm || props.onConfirm || (() => {})}
      {...props}
    />
  ), [isOpen, closeConfirm, config]);

  return {
    isOpen,
    openConfirm,
    closeConfirm,
    ConfirmModal: ConfirmModalComponent,
  };
}