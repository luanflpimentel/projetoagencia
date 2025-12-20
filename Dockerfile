# 🐳 Dockerfile - Zeyno Next.js 16
# Build otimizado para produção

# Args de build para variáveis públicas do Next.js
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CHATWOOT_BASE_URL
ARG NEXT_PUBLIC_APP_URL

# Args de build para variáveis privadas (necessárias durante o build)
ARG SUPABASE_SERVICE_ROLE_KEY
ARG CHATWOOT_BASE_URL
ARG CHATWOOT_PLATFORM_API_TOKEN
ARG UAZAPI_BASE_URL
ARG UAZAPI_ADMIN_TOKEN
ARG WEBHOOK_SECRET

# ============================================
# STAGE 1: Dependências de Produção
# ============================================
FROM node:24-alpine AS deps-prod

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

# Instalar APENAS dependências de produção
RUN npm ci --omit=dev && \
    npm cache clean --force

# ============================================
# STAGE 2: Dependencies (Completo)
# ============================================
FROM node:24-alpine AS deps-full

RUN apk add --no-cache libc6-compat

WORKDIR /app

COPY package*.json ./

# Instalar TODAS as dependências (incluindo dev para build)
RUN npm ci && \
    npm cache clean --force

# ============================================
# STAGE 3: Builder - Build da Aplicação
# ============================================
FROM node:24-alpine AS builder

WORKDIR /app

# Copiar node_modules
COPY --from=deps-full /app/node_modules ./node_modules

# Copiar código
COPY . .

# Passar ARGs como ENV para o build (públicas)
ARG NEXT_PUBLIC_SUPABASE_URL
ARG NEXT_PUBLIC_SUPABASE_ANON_KEY
ARG NEXT_PUBLIC_CHATWOOT_BASE_URL
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_PUBLIC_SUPABASE_ANON_KEY=$NEXT_PUBLIC_SUPABASE_ANON_KEY
ENV NEXT_PUBLIC_CHATWOOT_BASE_URL=$NEXT_PUBLIC_CHATWOOT_BASE_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL

# Passar ARGs como ENV para o build (privadas - apenas para static analysis)
ARG SUPABASE_SERVICE_ROLE_KEY
ARG CHATWOOT_BASE_URL
ARG CHATWOOT_PLATFORM_API_TOKEN
ARG UAZAPI_BASE_URL
ARG UAZAPI_ADMIN_TOKEN
ARG WEBHOOK_SECRET
ENV SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
ENV CHATWOOT_BASE_URL=$CHATWOOT_BASE_URL
ENV CHATWOOT_PLATFORM_API_TOKEN=$CHATWOOT_PLATFORM_API_TOKEN
ENV UAZAPI_BASE_URL=$UAZAPI_BASE_URL
ENV UAZAPI_ADMIN_TOKEN=$UAZAPI_ADMIN_TOKEN
ENV WEBHOOK_SECRET=$WEBHOOK_SECRET

# Build da aplicação
RUN npm run build

# ============================================
# STAGE 4: Runner
# ============================================
FROM node:24-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Criar usuário não-root
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copiar arquivos do builder
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copiar APENAS dependências de produção
COPY --from=deps-prod /app/node_modules ./node_modules

# Ajustar permissões
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "server.js"]