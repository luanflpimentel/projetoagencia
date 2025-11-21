// components/auth/logout-button.tsx
'use client';

import { useAuth } from '@/hooks/useAuth';

export function LogoutButton() {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut();
      // Redirecionamento é feito automaticamente pelo useAuth
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-md focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
    >
      Sair
    </button>
  );
}