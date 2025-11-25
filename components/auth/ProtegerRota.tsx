// components/auth/ProtegerRota.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthWithPermissions } from '@/hooks/useAuthWithPermissions';

interface ProtegerRotaProps {
  children: React.ReactNode;
  /** Se true, apenas usuários tipo "agencia" podem acessar */
  somenteAgencia?: boolean;
  /** Se fornecido, redireciona para esta rota caso não tenha permissão */
  rotaRedirecionamento?: string;
}

/**
 * Componente para proteger rotas por permissão de usuário.
 *
 * **Uso:**
 * ```tsx
 * export default function UsuariosPage() {
 *   return (
 *     <ProtegerRota somenteAgencia>
 *       <ConteudoDaPagina />
 *     </ProtegerRota>
 *   );
 * }
 * ```
 */
export default function ProtegerRota({
  children,
  somenteAgencia = false,
  rotaRedirecionamento = '/dashboard/clientes'
}: ProtegerRotaProps) {
  const { usuario, loading } = useAuthWithPermissions();
  const router = useRouter();

  useEffect(() => {
    // Aguardar carregamento
    if (loading) return;

    // Se não está autenticado, redireciona para login
    if (!usuario) {
      router.push('/login');
      return;
    }

    // Se a rota é somente para agência e o usuário é cliente
    if (somenteAgencia && usuario.role !== 'agencia') {
      console.warn(`⚠️ Acesso negado: ${usuario.email} tentou acessar área restrita`);
      router.push(rotaRedirecionamento);
      return;
    }
  }, [usuario, loading, somenteAgencia, rotaRedirecionamento, router]);

  // Enquanto carrega, mostra loader
  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  // Se não está autenticado ou não tem permissão, não renderiza nada
  // (o useEffect acima já redirecionou)
  if (!usuario || (somenteAgencia && usuario.role !== 'agencia')) {
    return null;
  }

  // Renderiza o conteúdo
  return <>{children}</>;
}
