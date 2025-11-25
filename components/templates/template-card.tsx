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
    <div className="bg-card rounded-lg shadow hover:shadow-lg transition-shadow p-6 border border-border">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-foreground mb-1">
            {nome_template}
          </h3>
          <p className="text-sm text-muted-foreground">
            {area_atuacao}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs bg-primary text-primary-foreground px-2 py-1 rounded font-medium">
            {versao}
          </span>
        </div>
      </div>

      {/* Keywords */}
      <div className="mb-4">
        <p className="text-xs text-muted-foreground font-medium mb-2">Keywords:</p>
        <div className="flex flex-wrap gap-2">
          {displayKeywords.map((keyword, index) => (
            <span
              key={index}
              className="text-xs bg-secondary text-secondary-foreground px-2 py-1 rounded font-medium"
            >
              {keyword.trim()}
            </span>
          ))}
          {hasMore && (
            <span className="text-xs text-muted-foreground px-2 py-1 font-medium">
              +{keywordsArray.length - 3} mais
            </span>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-sm text-foreground">
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{total_clientes_usando} clientes</span>
        </div>
      </div>

      {/* Actions */}
      <div className="flex gap-2 pt-4 border-t border-border">
        <Link
          href={`/dashboard/templates/${id}`}
          className="flex-1 text-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium text-sm"
        >
          Editar
        </Link>
        {onDuplicate && (
          <button
            onClick={() => onDuplicate(id)}
            className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg hover:bg-accent transition-colors"
            title="Duplicar"
          >
            <Copy size={18} />
          </button>
        )}
        {onDelete && (
          <button
            onClick={() => onDelete(id)}
            className="px-4 py-2 bg-destructive/10 text-destructive rounded-lg hover:bg-destructive/20 transition-colors"
            title="Desativar"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}