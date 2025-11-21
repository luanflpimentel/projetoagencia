// components/DashboardNav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { createClient } from '@/lib/supabase-browser';
import { useRouter } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: '📊' },
  { href: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
  { href: '/dashboard/templates', label: 'Templates', icon: '📄' },
  { href: '/dashboard/usuarios', label: 'Usuários', icon: '👤' },
  { href: '/dashboard/logs', label: 'Logs', icon: '📋' },
];

interface DashboardNavProps {
  userEmail?: string;
}

export default function DashboardNav({ userEmail }: DashboardNavProps) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  async function handleLogout() {
    try {
      setIsLoggingOut(true);
      await supabase.auth.signOut();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      setIsLoggingOut(false);
    }
  }

  return (
    <nav className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <span className="text-2xl">💬</span>
              <span className="text-xl font-bold text-gray-900">BotConversa</span>
            </Link>
          </div>

          {/* Navigation Items - Desktop */}
          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`
                    flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium
                    transition-colors duration-150
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </div>

          {/* User Menu - Desktop */}
          <div className="hidden md:flex items-center space-x-4">
            {userEmail && (
              <div className="text-sm text-gray-600 max-w-[200px] truncate">
                {userEmail}
              </div>
            )}

            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                px-4 py-2 rounded-lg text-sm font-medium
                transition-colors duration-150
                ${isLoggingOut
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
                }
              `}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-gray-600 hover:bg-gray-100"
            >
              <svg
                className="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                {mobileMenuOpen ? (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                ) : (
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden pb-3 space-y-1">
            {navItems.map((item) => {
              const isActive = pathname === item.href || 
                             (item.href !== '/dashboard' && pathname?.startsWith(item.href));
              
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium
                    ${isActive 
                      ? 'bg-blue-50 text-blue-700' 
                      : 'text-gray-600 hover:bg-gray-50'
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
            
            {/* User info mobile */}
            {userEmail && (
              <div className="px-3 py-2 text-sm text-gray-500 border-t border-gray-200 mt-2 pt-2">
                {userEmail}
              </div>
            )}
            
            {/* Logout button mobile */}
            <button
              onClick={handleLogout}
              disabled={isLoggingOut}
              className={`
                w-full text-left px-3 py-2 rounded-lg text-sm font-medium
                ${isLoggingOut
                  ? 'bg-gray-300 text-gray-500'
                  : 'bg-red-600 text-white hover:bg-red-700'
                }
              `}
            >
              {isLoggingOut ? 'Saindo...' : 'Sair'}
            </button>
          </div>
        )}
      </div>
    </nav>
  );
}