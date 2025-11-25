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
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';

export function DashboardSidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [openSections, setOpenSections] = useState<string[]>(['main']);
  const pathname = usePathname();
  const { usuario } = useAuthWithPermissions();

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
    <div className={`bg-white border-r border-border flex flex-col transition-all duration-300 ${
      isCollapsed ? 'w-16' : 'w-64'
    }`}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <h2 className="text-lg font-semibold text-foreground">
              Agência Talismã
            </h2>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
          </Button>
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
                      className="w-full justify-between px-2 py-1 h-8 text-xs text-muted-foreground hover:text-foreground"
                    >
                      {section.title}
                      <div className={`transition-transform ${
                        openSections.includes(section.key) ? 'rotate-90' : ''
                      }`}>
                        ▶
                      </div>
                    </Button>
                  </CollapsibleTrigger>
                  <CollapsibleContent className="space-y-1">
                    {section.items.map((item) => {
                      const IconComponent = item.icon;
                      const isActive = pathname === item.href || pathname.startsWith(item.href + '/');

                      return (
                        <Button
                          key={item.href}
                          variant={isActive ? "default" : "ghost"}
                          className="w-full justify-start px-4 py-2"
                          asChild
                        >
                          <Link href={item.href}>
                            <IconComponent className="h-4 w-4 mr-2" />
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
      <div className="p-4 border-t border-border">
        {!isCollapsed && (
          <div className="text-sm text-muted-foreground">
            <p>Agência Talismã</p>
            <p>v1.0.0</p>
          </div>
        )}
      </div>
    </div>
  );
}
