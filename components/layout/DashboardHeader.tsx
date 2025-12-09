'use client';

import { Button } from '@/components/ui/button';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';
import { useRouter } from 'next/navigation';
import { LogOut, Bell } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

export function DashboardHeader() {
  const { usuario, logout } = useAuthWithPermissions();
  const router = useRouter();

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  const getInitials = (email: string) => {
    return email.substring(0, 2).toUpperCase();
  };

  return (
    <header className="bg-card border-b border-border px-6 py-3 shadow-sm sticky top-0 z-40">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div>
            <h1 className="text-lg font-semibold text-foreground">
              {usuario?.role === 'agencia' ? 'Gestão de Clientes' : 'Meu Negócio'}
            </h1>
            <p className="text-xs text-muted-foreground">
              Bem-vindo de volta, {usuario?.nome_completo || usuario?.email?.split('@')[0] || 'Usuário'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="relative h-9 w-9 rounded-full ring-2 ring-transparent hover:ring-accent transition-all"
              >
                <Avatar className="h-9 w-9">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-semibold">
                    {usuario?.email ? getInitials(usuario.email) : 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 p-2">
              <DropdownMenuLabel className="pb-2">
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarFallback className="bg-primary text-primary-foreground">
                      {usuario?.email ? getInitials(usuario.email) : 'US'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col space-y-0.5">
                    <p className="text-sm font-semibold">{usuario?.nome_completo || 'Usuário'}</p>
                    <p className="text-xs text-muted-foreground truncate">{usuario?.email}</p>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="py-1">
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${usuario?.role === 'agencia' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                  <span className="text-xs font-medium">
                    {usuario?.role === 'agencia' ? 'Administrador' : 'Cliente'}
                  </span>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive cursor-pointer">
                <LogOut className="mr-2 h-4 w-4" />
                <span>Sair da conta</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
