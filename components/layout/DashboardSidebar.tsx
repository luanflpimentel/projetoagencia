'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Users,
  Settings,
  Menu,
  X,
  FileText,
  MessageSquare,
  Activity
} from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/providers/AuthProvider';
import { cn } from '@/lib/utils';

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['main']);
  const pathname = usePathname();
  const { usuario } = useAuth();

  const toggleSection = (section: string) => {
    setOpenSections(prev =>
      prev.includes(section)
        ? prev.filter(s => s !== section)
        : [...prev, section]
    );
  };

  // Filtrar navegação baseado no role
  const getNavigationSections = () => {
    const sections = [];

    // Seção principal
    const mainItems = [];

    if (usuario?.role === 'agencia') {
      mainItems.push(
        { name: 'Dashboard', icon: LayoutDashboard, href: '/dashboard' },
        { name: 'Clientes', icon: Users, href: '/dashboard/clientes' },
        { name: 'Usuários', icon: Users, href: '/dashboard/usuarios' },
        { name: 'Templates', icon: FileText, href: '/dashboard/templates' },
        { name: 'Logs', icon: Activity, href: '/dashboard/logs' }
      );
    } else {
      // Cliente vê apenas "Meu Negócio"
      mainItems.push(
        { name: 'Meu Negócio', icon: Users, href: '/dashboard/clientes' }
      );
    }

    sections.push({
      title: 'Principal',
      key: 'main',
      items: mainItems
    });

    // Seção de sistema (apenas agência)
    if (usuario?.role === 'agencia') {
      sections.push({
        title: 'Sistema',
        key: 'system',
        items: [
          { name: 'Configurações', icon: Settings, href: '/dashboard/configuracoes' }
        ]
      });
    }

    return sections;
  };

  const navigationSections = getNavigationSections();

  return (
    <div className={`bg-sidebar border-r border-sidebar-border flex flex-col transition-all duration-300 shadow-sm ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-sidebar-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">Z</span>
              </div>
              <h2 className="text-base font-semibold text-sidebar-foreground">
                Zeyno
              </h2>
            </div>
          )}
          {isCollapsed && (
            <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center mx-auto">
              <span className="text-primary-foreground font-bold text-xs">Z</span>
            </div>
          )}
          {!isCollapsed && (
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => setIsCollapsed(!isCollapsed)}
              className="h-7 w-7"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto">
        <nav className="p-2 space-y-1">
          {navigationSections.map((section) => (
            <div key={section.key}>
              {!isCollapsed && (
                <Collapsible
                  open={openSections.includes(section.key)}
                  onOpenChange={() => toggleSection(section.key)}
                >
                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full justify-between px-3 py-1.5 h-7 text-xs font-medium text-muted-foreground hover:text-foreground uppercase tracking-wider"
                    >
                      {section.title}
                      <div className={`transition-transform duration-200 ${
                        openSections.includes(section.key) ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-0.5 mt-1">
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                      return (
                        <Button
                          key={item.href}
                          variant={isActive ? "default" : "ghost"}
                          className={cn(
                            "w-full justify-start px-3 py-2 h-9 text-sm font-medium transition-all",
                            isActive && "bg-primary text-primary-foreground shadow-sm border-l-4 border-l-accent"
                          )}
                          asChild
                        >
                          <Link href={item.href}>
                            <IconComponent className="h-4 w-4 mr-3" />
                            {item.name}
                          </Link>
                        </Button>
                      );
                    })}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {isCollapsed && section.items.map((item) => {
                const IconComponent = item.icon;
                const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                return (
                  <Button
                    key={item.href}
                    variant={isActive ? "default" : "ghost"}
                    className="w-full justify-center px-2 py-2 mb-1"
                    asChild
                  >
                    <Link href={item.href}>
                      <IconComponent className="h-4 w-4" />
                    </Link>
                  </Button>
                );
              })}
            </div>
          ))}
        </nav>
      </div>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border mt-auto">
        {!isCollapsed && (
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted-foreground">Versão</span>
              <span className="font-medium text-foreground">1.0.0</span>
            </div>
            <div className="text-xs text-muted-foreground">
              © 2024 Zeyno
            </div>
          </div>
        )}
        {isCollapsed && (
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={() => setIsCollapsed(false)}
            className="w-full"
          >
            <Menu className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
