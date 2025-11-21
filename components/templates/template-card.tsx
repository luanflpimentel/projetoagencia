import { FileText, Users, Copy, Trash2 } from 'lucide-react';
import Link from 'next/link';

interface TemplateCardProps {
  id: string;
  nome_template: string;
  area_atuacao: string;
  keywords: string;
  total_clientes_usando: number;
  versao: string;
  onDuplicate?: (id: string) => void;
  onDelete?: (id: string) => void;
}

export default function TemplateCard({
  id,
  nome_template,
  area_atuacao,
  keywords,
  total_clientes_usando,
  versao,
  onDuplicate,
  onDelete,
}: TemplateCardProps) {
  const keywordsArray = keywords.split('\n').filter(k => k.trim() !== '');
  const displayKeywords = keywordsArray.slice(0, 3);
  const hasMore = keywordsArray.length > 3;

  return (
    <div className="bg-white rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-gray-200">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            {nome_template}
          </h3>
          <p className="text-sm text-gray-600">
            {area_atuacao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded">
            {versao}
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="mb-4">
        <p className="text-xs text-gray-500 mb-2">Keywords:</p>
        <div className="flex flex-wrap gap-2">
          {displayKeywords.map((keyword, index) => (
            <span
              key={index}
              className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
            >
              {keyword.trim()}
            </span>
          ))}
          {hasMore && (
            <span className="text-xs text-gray-500 px-2 py-1">
              +{keywordsArray.length - 3} mais
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{total_clientes_usando} clientes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-gray-200">
        <Link
          href={`/dashboard/templates/${id}`}
          className="flex-1 text-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
        >
          Editar
        </Link>
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(id)}
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
            title="Duplicar"
          >
            <Copy size={18} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
            title="Desativar"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}