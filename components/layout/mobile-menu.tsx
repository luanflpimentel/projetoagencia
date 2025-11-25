// components/layout/mobile-menu.tsx - Menu Mobile
'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LogoutButton } from '@/components/auth/logout-button';

export function MobileMenu({ userEmail }: { userEmail: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/dashboard/clientes', label: 'Clientes', icon: '👥' },
    { href: '/dashboard/templates', label: 'Templates', icon: '📄' },
    { href: '/dashboard/logs', label: 'Logs', icon: '📋' },
  ];

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Header com logo e botão */}
      <div className="flex items-center justify-between">
        <Link href="/dashboard" className="text-xl font-bold text-blue-600">
          Agência Talismã
        </Link>

        {/* Hamburger Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          aria-label="Menu"
        >
          {isOpen ? (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          ) : (
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          )}
        </button>
      </div>

      {/* Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40"
            onClick={() => setIsOpen(false)}
          />

          {/* Menu Drawer */}
          <div className="fixed top-0 right-0 bottom-0 w-64 bg-white shadow-xl z-50 animate-slide-in-right">
            <div className="flex flex-col h-full">
              {/* Header do Menu */}
              <div className="p-4 border-b">
                <div className="flex items-center justify-between mb-4">
                  <span className="font-semibold text-gray-900">Menu</span>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="p-2 rounded-lg hover:bg-gray-100"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="text-sm text-gray-600 truncate">
                  {userEmail}
                </div>
              </div>

              {/* Links de Navegação */}
              <nav className="flex-1 overflow-y-auto p-4">
                <div className="space-y-2">
                  {links.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsOpen(false)}
                      className={`
                        flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                        ${isActive(link.href)
                          ? 'bg-blue-50 text-blue-600 font-medium'
                          : 'text-gray-700 hover:bg-gray-50'
                        }
                      `}
                    >
                      <span className="text-xl">{link.icon}</span>
                      <span>{link.label}</span>
                    </Link>
                  ))}
                </div>
              </nav>

              {/* Footer com Logout */}
              <div className="p-4 border-t">
                <LogoutButton />
              </div>
            </div>
          </div>
        </>
      )}
    </>
  );
}