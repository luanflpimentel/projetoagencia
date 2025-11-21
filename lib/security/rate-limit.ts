// lib/security/rate-limit.ts - VERSÃO CORRIGIDA
import { NextRequest, NextResponse } from 'next/server';

interface RateLimitConfig {
  interval: number; // em milissegundos
  uniqueTokenPerInterval: number;
}

// Cache simples em memória para rate limiting
const rateLimit = new Map<string, number[]>();

// Função para obter IP do request
function getIP(request: NextRequest): string {
  const forwardedFor = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  
  if (forwardedFor) {
    return forwardedFor.split(',')[0].trim();
  }
  
  if (realIp) {
    return realIp;
  }
  
  return 'unknown';
}

export function rateLimiter(config: RateLimitConfig) {
  return {
    check: (request: NextRequest, limit: number, token: string) => {
      const now = Date.now();
      const ip = getIP(request);
      const tokenKey = `${token}-${ip}`;
      
      // Limpar timestamps antigos
      const timestamps = rateLimit.get(tokenKey) || [];
      const validTimestamps = timestamps.filter(
        timestamp => now - timestamp < config.interval
      );

      // Verificar se excedeu o limite
      if (validTimestamps.length >= limit) {
        return {
          success: false,
          remaining: 0,
          reset: new Date(validTimestamps[0] + config.interval),
        };
      }

      // Adicionar novo timestamp
      validTimestamps.push(now);
      rateLimit.set(tokenKey, validTimestamps);

      return {
        success: true,
        remaining: limit - validTimestamps.length,
        reset: new Date(now + config.interval),
      };
    },
  };
}

// Rate limiter padrão: 100 requests por 15 minutos
export const defaultRateLimiter = rateLimiter({
  interval: 15 * 60 * 1000, // 15 minutos
  uniqueTokenPerInterval: 100,
});

// Rate limiter para APIs sensíveis: 10 requests por minuto
export const strictRateLimiter = rateLimiter({
  interval: 60 * 1000, // 1 minuto
  uniqueTokenPerInterval: 10,
});