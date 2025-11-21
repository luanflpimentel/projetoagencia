# 🐳 Dockerfile - BotConversa Next.js 16
# Build otimizado para produção

# ============================================
# STAGE 1: Dependencies
# ============================================
FROM node:24-alpine AS deps

# Instalar dependências do sistema necessárias
RUN apk add --no-cache libc6-compat

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./

# Instalar dependências
RUN npm ci --only=production && \
    npm cache clean --force

# ============================================
# STAGE 2: Builder
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar node_modules do stage anterior
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de ambiente necessárias para o build
# Essas serão substituídas no runtime
ENV NEXT_TELEMETRY_DISABLED=1
ENV NODE_ENV=production

# Build da aplicação
RUN npm run build

# ============================================
# STAGE 3: Runner
# ============================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

# Mudar para usuário não-root
USER nextjs

# Expor porta
EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["node", "server.js"]
