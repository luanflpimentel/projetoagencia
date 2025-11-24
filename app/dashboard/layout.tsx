// app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/DashboardNav';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();

  // ✅ CORRIGIDO: Usar getUser() ao invés de getSession()
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect('/login');
  }

  // Buscar role do usuário
  const { data: usuarioData } = await supabase
    .from('usuarios')
    .select('role')
    .eq('id', user.id)
    .single();

  const userRole = usuarioData?.role as 'agencia' | 'cliente' | undefined;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navigation */}
      <DashboardNav userEmail={user.email} userRole={userRole} />

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
}
