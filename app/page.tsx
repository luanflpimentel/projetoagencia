import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-gray-100">
      <div className="text-center">
        <h1 className="text-5xl font-bold text-gray-800 mb-4">
          Agência Talismã
        </h1>
        <p className="text-xl text-gray-600 mb-8">
          Sistema de Gerenciamento de Chatbots para Advocacia
        </p>
        <Link 
          href="/dashboard"
          className="inline-block px-8 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-lg"
        >
          Acessar Dashboard →
        </Link>
      </div>
    </div>
  );
}