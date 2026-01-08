// app/login/page.tsx
import { LoginForm } from '@/components/auth/login-form';

export default function LoginPage() {
  // Redirecionamento é feito pelo middleware.ts
  // Removido para evitar conflito de múltiplos redirects

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