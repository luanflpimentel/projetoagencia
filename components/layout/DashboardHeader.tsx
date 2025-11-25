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
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-foreground">
            {usuario?.role === 'agencia' ? 'Gestão de Clientes' : 'Meu Negócio'}
          </h1>
          <p className="text-sm text-muted-foreground">
            Bem-vindo ao sistema
          </p>
        </div>

        <div className="flex items-center gap-4">

          {/* Menu do usuário */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                <Avatar>
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {usuario?.email ? getInitials(usuario.email) : 'US'}
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-medium">{usuario?.email}</p>
                  <p className="text-xs text-muted-foreground">
                    {usuario?.role === 'agencia' ? 'Administrador' : 'Cliente'}
                  </p>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout}>
                <LogOut className="mr-2 h-4 w-4" />
                Sair
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
