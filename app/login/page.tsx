// app/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';
import { createClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';

export default async function LoginPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();

  // Se já está autenticado, redireciona para dashboard
  if (user) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Zeyno
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Entre com suas credenciais
          </p>
        </div>
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <LoginForm />
        </div>
      </div>
    </div>
  );
}