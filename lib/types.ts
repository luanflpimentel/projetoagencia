// ============================================
// TYPES TYPESCRIPT - Agência Talismã
// Gerados do Schema Supabase PostgreSQL
// ============================================

// ===== TIPOS BASE =====

export type StatusConexao = 'desconectado' | 'connecting' | 'conectado';
export type StatusAtendimento = 'em_andamento' | 'qualificado' | 'desqualificado' | 'encerrado';

// ATUALIZADO: Tipos de eventos do sistema (incluindo UAZAPI + Chatwoot)
export type TipoEvento =
  // Clientes
  | 'cliente_criado'
  | 'cliente_editado'
  | 'cliente_excluido'

  // Templates
  | 'template_criado'
  | 'template_editado'
  | 'template_excluido'
  | 'template_usado'

  // WhatsApp/UAZAPI
  | 'instancia_criada'
  | 'qrcode_gerado'
  | 'conexao'
  | 'desconexao'
  | 'status_alterado'
  | 'mensagem_recebida'
  | 'webhook_recebido'
  | 'grupo_avisos_criado'
  | 'ia_ativada_desativada'

  // Chatwoot
  | 'chatwoot_provisionado'
  | 'chatwoot_erro'
  | 'chatwoot_uazapi_integrado'

  // Atendimentos
  | 'atendimento_iniciado'
  | 'atendimento_finalizado'
  | 'atendimento_qualificado'
  | 'atendimento_desqualificado'

  // Erros
  | 'erro_criar_instancia'
  | 'erro_gerar_qrcode'
  | 'erro_desconectar'
  | 'erro_geral'

  // Configurações
  | 'config_atualizada'
  | 'prompt_editado';

// ===== TABELAS PRINCIPAIS =====

export interface Cliente {
  id: string; // uuid
  nome_cliente: string;
  nome_instancia: string; // UNIQUE
  numero_whatsapp?: string | null;
  email?: string | null;
  nome_escritorio: string;
  nome_agente: string; // default: 'Julia'
  prompt_sistema: string; // Prompt compilado final
  prompt_editado_manualmente: boolean; // default: false
  ultima_regeneracao?: string | null; // ISO timestamp
  instance_token?: string;
  status_conexao: StatusConexao; // default: 'desconectado'
  ultima_conexao?: string | null; // ISO timestamp
  ultima_desconexao?: string | null; // ISO timestamp
  usuario_id: string; // FK para auth.users
  ia_ativa: boolean; // default: true - Controla se IA responde mensagens
  grupo_avisos_id?: string | null; // ID do grupo de avisos criado na primeira conexão

  // Chatwoot Integration
  chatwoot_account_id?: number | null;
  chatwoot_user_id?: number | null;
  chatwoot_user_email?: string | null;
  chatwoot_user_access_token?: string | null;
  chatwoot_inbox_id?: number | null;
  chatwoot_channel_id?: number | null;
  chatwoot_status?: 'pending' | 'active' | 'error' | null;
  chatwoot_provisioned_at?: string | null; // ISO timestamp
  chatwoot_error_message?: string | null;

  ativo: boolean; // default: true
  criado_em: string; // ISO timestamp
  atualizado_em: string; // ISO timestamp
}

export interface Template {
  id: string; // uuid
  nome_template: string;
  area_atuacao: string;
  descricao: string | null;
  keywords: string; // Separadas por \n
  pitch_inicial: string;
  perguntas_qualificacao: string; // Separadas por \n
  validacao_proposta: string;
  mensagem_desqualificacao: string | null;
  versao: string; // default: 'v1.0'
  ativo: boolean; // default: true
  criado_em: string; // ISO timestamp
  atualizado_em: string; // ISO timestamp
}

export interface ClienteTemplate {
  id: string; // uuid
  cliente_id: string; // FK → clientes
  template_id: string; // FK → templates
  adicionado_em: string; // ISO timestamp
}

export interface Atendimento {
  id: string; // uuid
  cliente_id: string | null; // FK → clientes
  nome_lead: string | null;
  telefone_lead: string;
  email_lead: string | null;
  dados_coletados: Record<string, any> | null; // JSONB
  status_atendimento: StatusAtendimento; // default: 'em_andamento'
  protocolo_gerado: string | null;
  iniciado_em: string; // ISO timestamp
  finalizado_em: string | null; // ISO timestamp
}

export interface LogSistema {
  id: string; // uuid
  cliente_id: string | null; // FK → clientes
  tipo_evento: TipoEvento;
  descricao?: string | null;
  metadata?: Record<string, any>;
  criado_em: string; // ISO timestamp
}

// ===== VIEWS =====

export interface VwClienteLista {
  id: string;
  nome_cliente: string;
  nome_instancia: string;
  numero_whatsapp: string | null;
  email: string | null;
  status_conexao: StatusConexao;
  nome_escritorio: string;
  nome_agente: string;
  prompt_editado_manualmente: boolean;
  ultima_conexao: string | null;
  usuario_id: string; // Permite filtro no frontend
  ia_ativa: boolean; // Controla se IA responde mensagens
  ativo: boolean;

  // Campos Chatwoot
  chatwoot_account_id?: number | null;
  chatwoot_user_id?: number | null;
  chatwoot_user_email?: string | null;
  chatwoot_user_access_token?: string | null;
  chatwoot_inbox_id?: number | null;
  chatwoot_channel_id?: number | null;
  chatwoot_status?: 'pending' | 'active' | 'error' | null;
  chatwoot_provisioned_at?: string | null;
  chatwoot_error_message?: string | null;
}

export interface VwDashboardStats {
  total_clientes: number;
  total_templates: number;
  clientes_conectados: number;
  atendimentos_hoje: number;
}

export interface VwTemplateComUso extends Template {
  total_clientes_usando: number;
}

export interface VwClienteComTemplates {
  id: string;
  nome_cliente: string;
  nome_instancia: string;
  nome_escritorio: string;
  nome_agente: string;
  status_conexao: StatusConexao;
  prompt_editado_manualmente: boolean;
  usuario_id: string; // ✨ NOVO
  ativo: boolean;
  templates: Array<{
    template_id: string;
    nome_template: string;
    area_atuacao: string;
  }> | null;
}

export interface VwAtendimentoRecente extends Atendimento {
  nome_cliente: string;
  nome_instancia: string;
  nome_escritorio: string;
}

// ===== TIPOS PARA FORMS =====

export interface ClienteFormData {
  nome_cliente: string;
  nome_instancia: string;
  numero_whatsapp?: string;
  email?: string;
  nome_escritorio: string;
  nome_agente?: string; // default: 'Julia'
  template_ids: string[]; // IDs dos templates selecionados
  // usuario_id será preenchido automaticamente no backend
}

export interface TemplateFormData {
  nome_template: string;
  area_atuacao: string;
  descricao?: string;
  keywords: string; // String com \n
  pitch_inicial: string;
  perguntas_qualificacao: string; // String com \n
  validacao_proposta: string;
  mensagem_desqualificacao?: string;
}

export interface ConfigurarAssistenteData {
  nome_escritorio: string;
  nome_agente: string;
  template_ids: string[];
  prompt_sistema?: string; // Se editado manualmente
}

// ===== TIPOS PARA API RESPONSES =====

export interface ApiResponse<T> {
  data: T | null;
  error: string | null;
}

export interface PaginatedResponse<T> {
  data: T[];
  count: number;
  page: number;
  pageSize: number;
}

// ===== TIPOS UTILITÁRIOS =====

export type ClienteInsert = Omit<Cliente, 'id' | 'criado_em' | 'atualizado_em'>;
export type ClienteUpdate = Partial<Omit<Cliente, 'id' | 'criado_em' | 'usuario_id'>>; // ✨ usuario_id não pode ser alterado

export type TemplateInsert = Omit<Template, 'id' | 'criado_em' | 'atualizado_em'>;
export type TemplateUpdate = Partial<Omit<Template, 'id' | 'criado_em'>>;

// ===== TIPOS PARA SUPABASE QUERIES =====

export interface SupabaseQuery {
  select?: string;
  eq?: Record<string, any>;
  neq?: Record<string, any>;
  order?: { column: string; ascending?: boolean };
  limit?: number;
  offset?: number;
}

// ===== HELPERS =====

export const parseKeywords = (keywords: string): string[] => {
  return keywords.split('\n').filter(k => k.trim() !== '');
};

export const parsePerguntas = (perguntas: string): string[] => {
  return perguntas.split('\n').filter(p => p.trim() !== '');
};

export const formatKeywords = (keywords: string[]): string => {
  return keywords.join('\n');
};

export const formatPerguntas = (perguntas: string[]): string => {
  return perguntas.join('\n');
};

// ===== VALIDAÇÕES =====

export const validarNomeInstancia = (nome: string): boolean => {
  // Deve ser lowercase, sem espaços, apenas letras, números e hífens
  const regex = /^[a-z0-9-]+$/;
  return regex.test(nome);
};

export const normalizarNomeInstancia = (nome: string): string => {
  return nome
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '');
};

// ===== CONSTANTS =====

export const STATUS_CONEXAO_LABELS: Record<StatusConexao, string> = {
  desconectado: 'Desconectado',
  connecting: 'Conectando...',
  conectado: 'Conectado',
};

export const STATUS_CONEXAO_COLORS: Record<StatusConexao, string> = {
  desconectado: 'red',
  connecting: 'yellow',
  conectado: 'green',
};

export const STATUS_ATENDIMENTO_LABELS: Record<StatusAtendimento, string> = {
  em_andamento: 'Em Andamento',
  qualificado: 'Qualificado',
  desqualificado: 'Desqualificado',
  encerrado: 'Encerrado',
};

export const STATUS_ATENDIMENTO_COLORS: Record<StatusAtendimento, string> = {
  em_andamento: 'blue',
  qualificado: 'green',
  desqualificado: 'red',
  encerrado: 'gray',
};

// ATUALIZADO: Labels para todos os tipos de evento
export const TIPO_EVENTO_LABELS: Record<TipoEvento, string> = {
  // Clientes
  cliente_criado: 'Cliente Criado',
  cliente_editado: 'Cliente Editado',
  cliente_excluido: 'Cliente Excluído',
  
  // Templates
  template_criado: 'Template Criado',
  template_editado: 'Template Editado',
  template_excluido: 'Template Excluído',
  template_usado: 'Template Usado',
  
  // WhatsApp/UAZAPI
  instancia_criada: 'Instância Criada',
  qrcode_gerado: 'QR Code Gerado',
  conexao: 'Conectado',
  desconexao: 'Desconectado',
  status_alterado: 'Status Alterado',
  mensagem_recebida: 'Mensagem Recebida',
  webhook_recebido: 'Webhook Recebido',
  
  // Atendimentos
  atendimento_iniciado: 'Atendimento Iniciado',
  atendimento_finalizado: 'Atendimento Finalizado',
  atendimento_qualificado: 'Lead Qualificado',
  atendimento_desqualificado: 'Lead Desqualificado',
  
  // Erros
  erro_criar_instancia: 'Erro ao Criar Instância',
  erro_gerar_qrcode: 'Erro ao Gerar QR Code',
  erro_desconectar: 'Erro ao Desconectar',
  erro_geral: 'Erro Geral',
  
  // Configurações
  config_atualizada: 'Configuração Atualizada',
  prompt_editado: 'Prompt Editado',

  // IA e Grupos
  grupo_avisos_criado: 'Grupo de Avisos Criado',
  ia_ativada_desativada: 'IA Ativada/Desativada',

  // Chatwoot
  chatwoot_provisionado: 'Chatwoot Provisionado',
  chatwoot_erro: 'Erro no Chatwoot',
  chatwoot_uazapi_integrado: 'Chatwoot Integrado à UAZAPI',
};

export const AREAS_ATUACAO = [
  'Direito do Trabalho',
  'Direito Previdenciário',
  'Direito Civil',
  'Direito de Família',
  'Direito do Consumidor',
  'Direito Tributário',
] as const;

export type AreaAtuacao = typeof AREAS_ATUACAO[number];

// ==========================================
// Types de Conexão WhatsApp
// ==========================================

export type ConnectionState = 
  | 'idle'
  | 'generating'
  | 'waiting'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'timeout';

export type TimeoutType = 
  | 'qr'
  | 'connection';

export interface ConnectionError {
  type: 'timeout' | 'api' | 'verification' | 'unknown';
  message: string;
  details?: any;
}

export interface ConnectionStatus {
  state: ConnectionState;
  qrCode: string | null;
  countdown: number;
  error: ConnectionError | null;
  isConnected: boolean;
  profileName: string | null;
  phoneNumber: string | null;
}

export interface UazapiStatusResponse {
  instance: {
    id: string;
    token: string;
    status: 'disconnected' | 'connecting' | 'connected';
    paircode?: string;
    qrcode?: string;
    name: string;
    profileName?: string;
    profilePicUrl?: string;
    isBusiness?: boolean;
    plataform?: string;
    systemName: string;
    owner?: string;
    lastDisconnect?: string;
    lastDisconnectReason?: string;
    created: string;
    updated: string;
  };
  status: {
    connected: boolean;
    loggedIn: boolean;
    jid: string | null | {};
  };
}

export interface UazapiConnectResponse {
  connected: boolean;
  loggedIn: boolean;
  jid: string | null;
  instance: {
    id: string;
    token: string;
    status: string;
    paircode?: string;
    qrcode?: string;
    name: string;
    profileName?: string;
    profilePicUrl?: string;
    owner?: string;
    [key: string]: any;
  };
}

export interface ConnectionCriteria {
  instanceStatusConnected: boolean;
  statusConnected: boolean;
  loggedIn: boolean;
  hasValidJid: boolean;
}

export interface VerificationResult {
  isConnected: boolean;
  criteria: ConnectionCriteria;
  profileName?: string;
  phoneNumber?: string;
}

// ============================================
// INTERFACES PARA TESTE DE PROMPT (FASE 7.0)
// ============================================

export interface TestPromptRequest {
  clienteId: string;
  mensagem: string;
}

export interface TestPromptResponse {
  success: boolean;
  resposta: string;
  metadata: {
    modelo: string;
    temperatura: number;
    tokens: number;
    tempo_ms: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// ============================================
// STATS DO DASHBOARD (para compatibilidade)
// ============================================

export interface DashboardStats {
  total: number;
  conectados: number;
  desconectados: number;
}


// ============================================
// SISTEMA DE USUÁRIOS MULTI-TENANT
// ============================================

export type UserRole = 'agencia' | 'cliente';

export interface Usuario {
  id: string;
  email: string;
  nome_completo: string;
  role: UserRole;
  cliente_id: string | null;
  avatar_url?: string;
  telefone?: string;
  ativo: boolean;
  email_verificado: boolean;
  primeiro_acesso: boolean;
  ultimo_login?: string;
  criado_em: string;
  criado_por?: string;
  atualizado_em: string;
  atualizado_por?: string;
}

export interface UsuarioComCliente extends Usuario {
  cliente?: {
    id: string;
    nome_cliente: string;
  };
}

export interface Convite {
  id: string;
  email: string;
  cliente_id: string | null;
  role: UserRole;
  token: string;
  aceito: boolean;
  aceito_em?: string;
  expira_em: string;
  criado_em: string;
  criado_por?: string;
}

export interface ConviteComDetalhes extends Convite {
  cliente?: {
    id: string;
    nome_cliente: string;
  };
  criador?: {
    id: string;
    nome_completo: string;
  };
  expirado: boolean;
}

export interface CriarUsuarioInput {
  email: string;
  nome_completo: string;
  role: UserRole;
  cliente_id: string | null;
  telefone?: string;
  senha_temporaria?: string;
}

export interface EditarUsuarioInput {
  nome_completo?: string;
  telefone?: string;
  avatar_url?: string;
  ativo?: boolean;
  role?: UserRole;
}

export interface CriarConviteInput {
  email: string;
  cliente_id: string | null;
  role: UserRole;
  validade_horas?: number;
}

export interface PermissoesUsuario {
  // Usuários
  pode_ver_usuarios: boolean;
  pode_criar_usuarios: boolean;
  pode_editar_usuarios: boolean;
  pode_deletar_usuarios: boolean;
  
  // Clientes
  pode_ver_todos_clientes: boolean;
  pode_criar_clientes: boolean;
  pode_editar_clientes: boolean;
  pode_deletar_clientes: boolean;
  
  // Logs
  pode_ver_todos_logs: boolean;
  
  // Sistema
  is_agencia: boolean;
  is_cliente: boolean;
}

export interface UsuarioAutenticado {
  usuario: Usuario;
  permissoes: PermissoesUsuario;
}

export interface FiltrosUsuarios {
  busca?: string;
  role?: UserRole;
  cliente_id?: string;
  ativo?: boolean;
}

export interface EstatisticasUsuarios {
  total_usuarios: number;
  usuarios_ativos: number;
  usuarios_inativos: number;
  por_role: {
    agencia: number;
    cliente: number;
  };
  convites_pendentes: number;
}

// Helper types
export type RoleLabel = {
  [K in UserRole]: string;
};

export const ROLE_LABELS: RoleLabel = {
  agencia: 'Agência',
  cliente: 'Cliente',
};

export const ROLE_DESCRIPTIONS: RoleLabel = {
  agencia: 'Acesso completo ao sistema (vê e gerencia tudo)',
  cliente: 'Acesso limitado (vê apenas seu WhatsApp)',
};
