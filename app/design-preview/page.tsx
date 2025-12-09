'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  LayoutDashboard, Users, FileText, Activity, Settings,
  CheckCircle, XCircle, Plus, RefreshCw, Search, Bell,
  LogOut, Menu, X, Save, Copy, Trash2
} from 'lucide-react';

export default function DesignPreviewPage() {
  const [activeSection, setActiveSection] = useState('colors');

  const sections = [
    { id: 'colors', name: 'Paleta de Cores' },
    { id: 'typography', name: 'Tipografia' },
    { id: 'buttons', name: 'Botões' },
    { id: 'cards', name: 'Cards' },
    { id: 'forms', name: 'Formulários' },
    { id: 'layout', name: 'Layout Completo' },
  ];

  return (
    <div className="min-h-screen bg-muted">
      {/* Header do Preview */}
      <header className="bg-card border-b border-border px-6 py-4 sticky top-0 z-50">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Preview do Novo Design</h1>
            <p className="text-sm text-muted-foreground">
              Visualize todos os componentes e layouts antes de aprovar
            </p>
          </div>
          <Button variant="outline" onClick={() => window.history.back()}>
            ← Voltar
          </Button>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar de Navegação */}
        <aside className="w-64 bg-card border-r border-border min-h-screen p-4 sticky top-[73px] h-[calc(100vh-73px)] overflow-y-auto">
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={`w-full text-left px-4 py-2 rounded-lg transition-colors ${
                  activeSection === section.id
                    ? 'bg-primary text-primary-foreground font-medium'
                    : 'hover:bg-secondary text-foreground'
                }`}
              >
                {section.name}
              </button>
            ))}
          </nav>
        </aside>

        {/* Conteúdo Principal */}
        <main className="flex-1 p-8 space-y-8">
          {/* Seção: Paleta de Cores */}
          {activeSection === 'colors' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Paleta de Cores</h2>
                <p className="text-muted-foreground">
                  Sistema de cores padronizado para todo o projeto
                </p>
              </div>

              {/* Cores Principais */}
              <Card>
                <CardHeader>
                  <CardTitle>Cores Principais</CardTitle>
                  <CardDescription>Cores base do design system</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <div className="h-24 rounded-lg bg-primary border border-border mb-2"></div>
                      <p className="text-sm font-medium">Primary</p>
                      <p className="text-xs text-muted-foreground">#030213</p>
                    </div>
                    <div>
                      <div className="h-24 rounded-lg bg-secondary border border-border mb-2"></div>
                      <p className="text-sm font-medium">Secondary</p>
                      <p className="text-xs text-muted-foreground">#f3f3f5</p>
                    </div>
                    <div>
                      <div className="h-24 rounded-lg bg-accent border border-border mb-2"></div>
                      <p className="text-sm font-medium">Accent</p>
                      <p className="text-xs text-muted-foreground">#e9ebef</p>
                    </div>
                    <div>
                      <div className="h-24 rounded-lg bg-muted border border-border mb-2"></div>
                      <p className="text-sm font-medium">Muted</p>
                      <p className="text-xs text-muted-foreground">#ececf0</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Cores de Estado */}
              <Card>
                <CardHeader>
                  <CardTitle>Cores de Estado</CardTitle>
                  <CardDescription>Para feedback e notificações</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div>
                      <div className="h-24 rounded-lg bg-green-500 mb-2"></div>
                      <p className="text-sm font-medium">Success</p>
                      <p className="text-xs text-muted-foreground">#10B981</p>
                    </div>
                    <div>
                      <div className="h-24 rounded-lg bg-destructive mb-2"></div>
                      <p className="text-sm font-medium">Error</p>
                      <p className="text-xs text-muted-foreground">#d4183d</p>
                    </div>
                    <div>
                      <div className="h-24 rounded-lg bg-yellow-500 mb-2"></div>
                      <p className="text-sm font-medium">Warning</p>
                      <p className="text-xs text-muted-foreground">#F59E0B</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Texto */}
              <Card>
                <CardHeader>
                  <CardTitle>Cores de Texto</CardTitle>
                  <CardDescription>Hierarquia de texto</CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <p className="text-foreground font-medium mb-1">Texto Principal</p>
                    <p className="text-xs text-muted-foreground">#030213 - Para títulos e conteúdo importante</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground font-medium mb-1">Texto Secundário</p>
                    <p className="text-xs text-muted-foreground">#5a5a6b - Para descrições e metadados</p>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Seção: Tipografia */}
          {activeSection === 'typography' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Tipografia</h2>
                <p className="text-muted-foreground">
                  Escalas de texto e hierarquia visual
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Tamanhos de Texto</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="border-b border-border pb-3">
                    <h1 className="text-4xl font-bold text-foreground">Heading 1 (36px)</h1>
                    <p className="text-xs text-muted-foreground mt-1">Para títulos principais de páginas</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <h2 className="text-3xl font-bold text-foreground">Heading 2 (30px)</h2>
                    <p className="text-xs text-muted-foreground mt-1">Para seções importantes</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <h3 className="text-2xl font-semibold text-foreground">Heading 3 (24px)</h3>
                    <p className="text-xs text-muted-foreground mt-1">Para subtítulos</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <h4 className="text-xl font-semibold text-foreground">Heading 4 (20px)</h4>
                    <p className="text-xs text-muted-foreground mt-1">Para cards e componentes</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <p className="text-base text-foreground">Body Text (16px)</p>
                    <p className="text-xs text-muted-foreground mt-1">Para conteúdo principal</p>
                  </div>
                  <div className="border-b border-border pb-3">
                    <p className="text-sm text-foreground">Small Text (14px)</p>
                    <p className="text-xs text-muted-foreground mt-1">Para labels e metadados</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Extra Small (12px)</p>
                    <p className="text-xs text-muted-foreground mt-1">Para timestamps e informações secundárias</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pesos de Fonte</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-lg font-normal">Normal (400) - Para texto regular</p>
                  <p className="text-lg font-medium">Medium (500) - Para destaques sutis</p>
                  <p className="text-lg font-semibold">Semibold (600) - Para subtítulos</p>
                  <p className="text-lg font-bold">Bold (700) - Para títulos principais</p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Seção: Botões */}
          {activeSection === 'buttons' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Botões</h2>
                <p className="text-muted-foreground">
                  Todos os estilos e variantes de botões
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Variantes de Botões</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Default (Primary)</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default">Default Button</Button>
                      <Button variant="default" disabled>Disabled</Button>
                      <Button variant="default">
                        <Plus className="mr-2 h-4 w-4" />
                        Com Ícone
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Secondary</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="secondary">Secondary Button</Button>
                      <Button variant="secondary" disabled>Disabled</Button>
                      <Button variant="secondary">
                        <Save className="mr-2 h-4 w-4" />
                        Com Ícone
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Outline</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="outline">Outline Button</Button>
                      <Button variant="outline" disabled>Disabled</Button>
                      <Button variant="outline">
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Com Ícone
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Ghost</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="ghost">Ghost Button</Button>
                      <Button variant="ghost" disabled>Disabled</Button>
                      <Button variant="ghost">
                        <Settings className="mr-2 h-4 w-4" />
                        Com Ícone
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h4 className="text-sm font-semibold text-foreground">Destructive</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="destructive">Destructive Button</Button>
                      <Button variant="destructive" disabled>Disabled</Button>
                      <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Excluir
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Tamanhos de Botões</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap items-center gap-3">
                    <Button size="sm">Small</Button>
                    <Button size="default">Default</Button>
                    <Button size="lg">Large</Button>
                    <Button size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Botões com Estados</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex gap-3">
                    <Button variant="default">
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Sucesso
                    </Button>
                    <Button variant="destructive">
                      <XCircle className="mr-2 h-4 w-4" />
                      Erro
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Seção: Cards */}
          {activeSection === 'cards' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Cards</h2>
                <p className="text-muted-foreground">
                  Componentes de card e containers
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Card Simples</CardTitle>
                    <CardDescription>Card básico com título e descrição</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Este é um exemplo de conteúdo dentro de um card.
                    </p>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                    <Users className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">24</div>
                    <p className="text-xs text-muted-foreground">+2 desde o mês passado</p>
                  </CardContent>
                </Card>

                <Card className="border-l-4 border-l-green-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      Status Conectado
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">
                      Sistema operando normalmente
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Card className="bg-blue-50 border-blue-200">
                <CardHeader>
                  <CardTitle className="text-blue-900">Card com Background</CardTitle>
                  <CardDescription className="text-blue-700">
                    Card com cor de fundo personalizada
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-blue-800">
                    Útil para destacar informações importantes ou criar hierarquia visual.
                  </p>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Seção: Formulários */}
          {activeSection === 'forms' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Formulários</h2>
                <p className="text-muted-foreground">
                  Componentes de entrada e formulários
                </p>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Inputs e Labels</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="input1">Input Padrão</Label>
                    <Input id="input1" placeholder="Digite algo..." />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input2">Input com Valor</Label>
                    <Input id="input2" defaultValue="João Silva" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="input3">Input Desabilitado</Label>
                    <Input id="input3" disabled placeholder="Campo desabilitado" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="search">Busca com Ícone</Label>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="search" className="pl-10" placeholder="Buscar..." />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </section>
          )}

          {/* Seção: Layout Completo */}
          {activeSection === 'layout' && (
            <section className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">Layout Completo</h2>
                <p className="text-muted-foreground">
                  Exemplo de página completa com todos os componentes
                </p>
              </div>

              {/* Simulação de Dashboard */}
              <div className="border-4 border-dashed border-border rounded-lg p-1">
                <div className="bg-background rounded-lg overflow-hidden">
                  {/* Header Simulado */}
                  <div className="bg-card border-b border-border px-6 py-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h1 className="text-xl font-semibold text-foreground">Dashboard</h1>
                        <p className="text-sm text-muted-foreground">Bem-vindo ao sistema</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon">
                          <Bell className="h-5 w-5" />
                        </Button>
                        <Button variant="ghost" size="icon">
                          <Settings className="h-5 w-5" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Conteúdo Simulado */}
                  <div className="p-6 space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Total de Clientes</CardTitle>
                          <Users className="h-4 w-4 text-blue-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">24</div>
                          <p className="text-xs text-muted-foreground">Clientes cadastrados</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Conectados</CardTitle>
                          <CheckCircle className="h-4 w-4 text-green-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">18</div>
                          <p className="text-xs text-muted-foreground">75% do total</p>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                          <CardTitle className="text-sm font-medium">Desconectados</CardTitle>
                          <XCircle className="h-4 w-4 text-red-600" />
                        </CardHeader>
                        <CardContent>
                          <div className="text-2xl font-bold">6</div>
                          <p className="text-xs text-muted-foreground">25% do total</p>
                        </CardContent>
                      </Card>
                    </div>

                    {/* Content Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      <Card>
                        <CardHeader>
                          <CardTitle>Últimas Atividades</CardTitle>
                          <CardDescription>Atividades recentes no sistema</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="space-y-3">
                            {[1, 2, 3].map((i) => (
                              <div key={i} className="flex items-center space-x-4">
                                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                                <div className="flex-1">
                                  <p className="text-sm">Cliente {i}</p>
                                  <p className="text-xs text-muted-foreground">Ação realizada</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </CardContent>
                      </Card>

                      <Card>
                        <CardHeader>
                          <CardTitle>Ações Rápidas</CardTitle>
                          <CardDescription>Tarefas comuns</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-2">
                          <Button variant="outline" className="w-full justify-start">
                            <Plus className="mr-2 h-4 w-4" />
                            Adicionar Cliente
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <FileText className="mr-2 h-4 w-4" />
                            Gerenciar Templates
                          </Button>
                          <Button variant="outline" className="w-full justify-start">
                            <Activity className="mr-2 h-4 w-4" />
                            Ver Logs
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}
        </main>
      </div>
    </div>
  );
}
