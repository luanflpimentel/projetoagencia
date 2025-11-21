// lib/security/validation.ts - VERSÃO CORRIGIDA
import { z, ZodError } from 'zod';

// Schemas de validação usando Zod

export const ClienteSchema = z.object({
  nome_cliente: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(255),
  nome_instancia: z.string().min(2).max(255).regex(/^[a-z0-9-]+$/, 'Use apenas letras minúsculas, números e hífen'),
  numero_whatsapp: z.string().regex(/^\d{10,15}$/, 'WhatsApp deve ter entre 10 e 15 dígitos').optional().nullable(),
  email: z.string().email('Email inválido').optional().nullable(),
  nome_escritorio: z.string().min(2).max(255),
  nome_agente: z.string().min(2).max(255),
  prompt_sistema: z.string().min(10, 'Prompt muito curto'),
});

export const TemplateSchema = z.object({
  nome_template: z.string().min(2).max(255),
  area_atuacao: z.string().min(2).max(100),
  descricao: z.string().optional().nullable(),
  keywords: z.string().min(2),
  pitch_inicial: z.string().min(10),
  perguntas_qualificacao: z.string().min(10),
  validacao_proposta: z.string().min(10),
  mensagem_desqualificacao: z.string().optional().nullable(),
});

// Funções de sanitização

export function sanitizeString(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < e >
    .replace(/javascript:/gi, '') // Remove javascript:
    .replace(/on\w+=/gi, ''); // Remove event handlers
}

export function sanitizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export function sanitizePhone(phone: string): string {
  return phone.replace(/\D/g, ''); // Remove tudo que não é dígito
}

export function sanitizeInstanceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-') // Substitui caracteres inválidos por hífen
    .replace(/-+/g, '-') // Remove hífens duplicados
    .replace(/^-|-$/g, ''); // Remove hífens no início e fim
}

// Validação de dados de entrada

export function validateCliente(data: any) {
  try {
    const validated = ClienteSchema.parse(data);
    return {
      success: true as const,
      data: {
        ...validated,
        nome_cliente: sanitizeString(validated.nome_cliente),
        nome_instancia: sanitizeInstanceName(validated.nome_instancia),
        numero_whatsapp: validated.numero_whatsapp ? sanitizePhone(validated.numero_whatsapp) : null,
        email: validated.email ? sanitizeEmail(validated.email) : null,
        nome_escritorio: sanitizeString(validated.nome_escritorio),
        nome_agente: sanitizeString(validated.nome_agente),
        prompt_sistema: sanitizeString(validated.prompt_sistema),
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false as const,
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }
    return {
      success: false as const,
      errors: [{ field: 'unknown', message: 'Erro de validação' }],
    };
  }
}

export function validateTemplate(data: any) {
  try {
    const validated = TemplateSchema.parse(data);
    return {
      success: true as const,
      data: {
        ...validated,
        nome_template: sanitizeString(validated.nome_template),
        area_atuacao: sanitizeString(validated.area_atuacao),
        descricao: validated.descricao ? sanitizeString(validated.descricao) : null,
        keywords: sanitizeString(validated.keywords),
        pitch_inicial: sanitizeString(validated.pitch_inicial),
        perguntas_qualificacao: sanitizeString(validated.perguntas_qualificacao),
        validacao_proposta: sanitizeString(validated.validacao_proposta),
        mensagem_desqualificacao: validated.mensagem_desqualificacao 
          ? sanitizeString(validated.mensagem_desqualificacao) 
          : null,
      },
    };
  } catch (error) {
    if (error instanceof ZodError) {
      return {
        success: false as const,
        errors: error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      };
    }
    return {
      success: false as const,
      errors: [{ field: 'unknown', message: 'Erro de validação' }],
    };
  }
}

// Validação de UUID
export function isValidUUID(uuid: string): boolean {
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
}

// Prevenir SQL Injection (validação adicional)
export function sanitizeForSQL(input: string): string {
  return input.replace(/['";\\]/g, ''); // Remove caracteres perigosos
}