// app/api/health/route.ts
// Endpoint de healthcheck para Docker e monitoramento

import { NextResponse } from 'next/server';

export async function GET() {
  try {
    // Você pode adicionar mais verificações aqui:
    // - Conectividade com Supabase
    // - Status de serviços externos
    // - Etc.
    
    return NextResponse.json(
      {
        status: 'healthy',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        environment: process.env.NODE_ENV,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      },
      { status: 503 }
    );
  }
}
