// lib/services/chatwoot.service.ts
// Serviço para integração com Chatwoot Platform API e Application API

const CHATWOOT_BASE_URL = process.env.CHATWOOT_BASE_URL;
const CHATWOOT_PLATFORM_API_TOKEN = process.env.CHATWOOT_PLATFORM_API_TOKEN;

interface ChatwootAccount {
  id: number;
  name: string;
  locale: string;
  support_email: string;
  status: string;
}

interface ChatwootUser {
  id: number;
  name: string;
  email: string;
  access_token: string;
  confirmed: boolean;
}

interface ChatwootAccountUser {
  id: number;
  account_id: number;
  user_id: number;
  role: string;
}

interface ChatwootInbox {
  id: number;
  name: string;
  channel_id: number;
  channel_type: string;
}

interface ProvisionResult {
  success: boolean;
  account_id?: number;
  user_id?: number;
  user_email?: string;
  user_access_token?: string;
  inbox_id?: number;
  channel_id?: number;
  error?: string;
  step?: string;
}

class ChatwootService {
  private baseUrl: string;
  private platformToken: string;

  constructor() {
    if (!CHATWOOT_BASE_URL || !CHATWOOT_PLATFORM_API_TOKEN) {
      throw new Error('CHATWOOT_BASE_URL and CHATWOOT_PLATFORM_API_TOKEN must be set in environment variables');
    }

    this.baseUrl = CHATWOOT_BASE_URL;
    this.platformToken = CHATWOOT_PLATFORM_API_TOKEN;
  }

  /**
   * Requisição genérica para Chatwoot
   */
  private async request(
    endpoint: string,
    options: RequestInit,
    token: string
  ): Promise<any> {
    const url = `${this.baseUrl}${endpoint}`;

    console.log('🔄 Chatwoot Request:', {
      url,
      method: options.method || 'GET',
      hasToken: !!token,
    });

    const response = await fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'api_access_token': token,
        ...options.headers,
      },
    });

    console.log('✅ Chatwoot Response:', {
      status: response.status,
      statusText: response.statusText,
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Chatwoot Error:', errorText);
      throw new Error(`Chatwoot Error [${response.status}]: ${errorText}`);
    }

    return response.json();
  }

  /**
   * PASSO 1: Criar Account
   */
  async createAccount(
    name: string,
    supportEmail: string
  ): Promise<ChatwootAccount> {
    console.log('📝 [STEP 1] Criando Account no Chatwoot...');

    const data = await this.request(
      '/platform/api/v1/accounts',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          locale: 'pt_BR',
          support_email: supportEmail,
          status: 'active',
        }),
      },
      this.platformToken
    );

    console.log('✅ [STEP 1] Account criada:', { account_id: data.id });
    return data;
  }

  /**
   * PASSO 2: Criar User
   */
  async createUser(
    name: string,
    email: string,
    password: string
  ): Promise<ChatwootUser> {
    console.log('📝 [STEP 2] Criando User no Chatwoot...');

    const data = await this.request(
      '/platform/api/v1/users',
      {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          custom_attributes: {},
        }),
      },
      this.platformToken
    );

    console.log('✅ [STEP 2] User criado:', { user_id: data.id, email: data.email });
    return data;
  }

  /**
   * PASSO 3: Vincular User ao Account
   */
  async linkUserToAccount(
    accountId: number,
    userId: number,
    role: 'administrator' | 'agent' = 'administrator'
  ): Promise<ChatwootAccountUser> {
    console.log('📝 [STEP 3] Vinculando User ao Account...');

    const data = await this.request(
      `/platform/api/v1/accounts/${accountId}/account_users`,
      {
        method: 'POST',
        body: JSON.stringify({
          user_id: userId,
          role,
        }),
      },
      this.platformToken
    );

    console.log('✅ [STEP 3] User vinculado ao Account');
    return data;
  }

  /**
   * PASSO 4: Criar Inbox (API Channel)
   * ⚠️ ATENÇÃO: Usa USER Access Token, não Platform API Token!
   */
  async createInbox(
    accountId: number,
    inboxName: string,
    userAccessToken: string
  ): Promise<ChatwootInbox> {
    console.log('📝 [STEP 4] Criando Inbox no Chatwoot...');

    const data = await this.request(
      `/api/v1/accounts/${accountId}/inboxes`,
      {
        method: 'POST',
        body: JSON.stringify({
          name: inboxName,
          channel: {
            type: 'api',
          },
        }),
      },
      userAccessToken  // ← USER Token, não Platform Token!
    );

    console.log('✅ [STEP 4] Inbox criada:', {
      inbox_id: data.id,
      channel_id: data.channel_id,
    });
    return data;
  }

  /**
   * FASE 1: Provisionar apenas Account + User (SEM Inbox)
   * A Inbox será criada na FASE 2, ao conectar o WhatsApp
   */
  async provisionAccountAndUser(
    nomeEscritorio: string,
    emailContato: string
  ): Promise<ProvisionResult> {
    try {
      const password = 'AgenciaTalisma1!'; // Senha fixa

      // PASSO 1: Criar Account
      let account: ChatwootAccount;
      try {
        account = await this.createAccount(nomeEscritorio, emailContato);
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          step: 'create_account',
        };
      }

      // PASSO 2: Criar User
      let user: ChatwootUser;
      try {
        user = await this.createUser(nomeEscritorio, emailContato, password);
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          step: 'create_user',
          account_id: account.id,
        };
      }

      // PASSO 3: Vincular User ao Account
      try {
        await this.linkUserToAccount(account.id, user.id, 'administrator');
      } catch (error: any) {
        return {
          success: false,
          error: error.message,
          step: 'link_user',
          account_id: account.id,
          user_id: user.id,
        };
      }

      // ✅ SUCESSO (Account + User criados, Inbox será criada depois)
      console.log('🎉 Account e User criados com sucesso! Inbox será criada ao conectar WhatsApp.');

      return {
        success: true,
        account_id: account.id,
        user_id: user.id,
        user_email: user.email,
        user_access_token: user.access_token,
        // inbox_id e channel_id serão preenchidos na FASE 2
      };

    } catch (error: any) {
      console.error('❌ Erro inesperado no provisionamento:', error);
      return {
        success: false,
        error: `Erro inesperado: ${error.message}`,
        step: 'unknown',
      };
    }
  }

  /**
   * FASE 2: Criar Inbox ao conectar WhatsApp
   * Chamado apenas quando o WhatsApp for conectado
   */
  async createInboxOnWhatsAppConnect(
    accountId: number,
    nomeEscritorio: string,
    userAccessToken: string
  ): Promise<{ success: boolean; inbox_id?: number; channel_id?: number; error?: string }> {
    try {
      const inboxName = `WhatsApp - ${nomeEscritorio}`;
      const inbox = await this.createInbox(accountId, inboxName, userAccessToken);

      return {
        success: true,
        inbox_id: inbox.id,
        channel_id: inbox.channel_id,
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message,
      };
    }
  }
}

// Singleton
export const chatwootService = new ChatwootService();
