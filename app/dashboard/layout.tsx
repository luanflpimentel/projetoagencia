// app/dashboard/layout.tsx
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import { DashboardLayout as Layout } from '@/components/layout/DashboardLayout';

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

  return (
    <Layout>
      {children}
    </Layout>
  );
}
