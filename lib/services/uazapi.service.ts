// lib/services/uazapi.service.ts - VERSÃO FINAL COM TYPES CORRIGIDOS

const UAZAPI_BASE_URL = process.env.UAZAPI_BASE_URL!;
const UAZAPI_ADMIN_TOKEN = process.env.UAZAPI_ADMIN_TOKEN!;

export interface UazapiInstanceCreate {
  name: string;
  systemName?: string;
}

export interface UazapiConnectResponse {
  qrcode?: string;
  pairingCode?: string;
  message?: string;
  connected?: boolean;
  status?: string;
  instance?: {
    qrcode?: string;
    paircode?: string;
    status?: string;
    [key: string]: any;
  };
  [key: string]: any;
}

export interface UazapiInstanceInfo {
  id: string;
  token: string;
  status: string;
  paircode: string;
  qrcode: string;
  name: string;
  profileName: string;
  profilePicUrl: string;
  isBusiness: boolean;
  plataform: string;
  systemName: string;
  owner: string;
  current_presence: string;
  lastDisconnect: string;
  lastDisconnectReason: string;
  adminField01: string;
  adminField02: string;
  openai_apikey: string;
  chatbot_enabled: boolean;
  chatbot_ignoreGroups: boolean;
  chatbot_stopConversation: string;
  chatbot_stopMinutes: number;
  chatbot_stopWhenYouSendMsg: number;
  created: string;
  updated: string;
  currentTime: string;
}

export interface UazapiInstance {
  connected: boolean;
  info: string;
  instance: UazapiInstanceInfo;
  loggedIn: boolean;
  name: string;
  response: string;
  token: string;
}

// ✨ INTERFACE CORRIGIDA - Suporta todas as estruturas de resposta
export interface UazapiStatus {
  // Propriedades no nível raiz
  connected?: boolean;
  jid?: string | null;
  loggedIn?: boolean;
  phone?: string;
  name?: string;
  
  // Status pode ser string OU objeto
  status?: string | {
    connected: boolean;
    jid: string | null;
    loggedIn: boolean;
  };
  
  state?: 'connected' | 'disconnected' | 'qrReadWait' | 'connecting';
  
  // Propriedades aninhadas em instance
  instance?: {
    id?: string;
    token?: string;
    status: string;
    qrcode?: string;
    paircode?: string;
    profileName?: string;
    profilePicUrl?: string;
    owner?: string;
    loggedIn?: boolean;
    isBusiness?: boolean;
    plataform?: string;
    [key: string]: any;
  };
}

export class UazapiService {
  private async request(
    endpoint: string, 
    options: RequestInit = {}, 
    instanceToken?: string
  ) {
    try {
      console.log('🔄 UAZAPI Request:', {
        url: `${UAZAPI_BASE_URL}${endpoint}`,
        method: options.method || 'GET',
        hasInstanceToken: !!instanceToken,
      });

      const headers: Record<string, string> = {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        ...options.headers as Record<string, string>,
      };

      // Usar token da instância ou admintoken
      if (instanceToken) {
        headers['token'] = instanceToken;
      } else {
        headers['admintoken'] = UAZAPI_ADMIN_TOKEN;
      }

      const response = await fetch(`${UAZAPI_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      console.log('✅ UAZAPI Response:', {
        status: response.status,
        statusText: response.statusText,
      });

      // ✨ Para /instance/connect, aceitar 409 (retornar dados mesmo assim)
      const isConnectEndpoint = endpoint.includes('/connect');
      const is409 = response.status === 409;

      if (!response.ok && !(isConnectEndpoint && is409)) {
        const errorText = await response.text();
        console.error('❌ UAZAPI Error:', errorText);
        throw new Error(`UAZAPI Error [${response.status}]: ${errorText}`);
      }

      // Pegar JSON (mesmo em 409 para /connect)
      const data = await response.json();

      // ✅ REMOVIDO: Não lançar erro aqui, deixar o endpoint decidir
      // O endpoint /qrcode vai lidar com a ausência de QR Code

      return data;

    } catch (error: any) {
      console.error('❌ UAZAPI Request Error:', {
        endpoint,
        error: error.message,
      });
      throw error;
    }
  }

  async createInstance(data: UazapiInstanceCreate): Promise<UazapiInstance> {
    return this.request('/instance/init', {
      method: 'POST',
      body: JSON.stringify({
        name: data.name,
        systemName: data.systemName || 'zeyno',
      }),
    });
  }

  async getQRCode(instanceToken: string): Promise<UazapiConnectResponse> {
    return this.request('/instance/connect', {
      method: 'POST',
      body: JSON.stringify({}),
    }, instanceToken);
  }

  async connectWithPhone(instanceToken: string, phone: string): Promise<any> {
    return this.request('/instance/connect', {
      method: 'POST',
      body: JSON.stringify({ phone }),
    }, instanceToken);
  }

  async getStatus(instanceToken: string): Promise<UazapiStatus> {
    return this.request('/instance/status', {
      method: 'GET',
    }, instanceToken);
  }

  async logout(instanceToken: string): Promise<void> {
    return this.request('/instance/disconnect', {
      method: 'POST',
    }, instanceToken);
  }

  async deleteInstance(instanceToken: string): Promise<void> {
    return this.request('/instance', {
      method: 'DELETE',
    }, instanceToken);
  }

  async updateInstanceName(instanceToken: string, newName: string): Promise<any> {
    return this.request('/instance/updateInstanceName', {
      method: 'POST',
      body: JSON.stringify({ name: newName }),
    }, instanceToken);
  }

  async listInstances(): Promise<UazapiInstance[]> {
    return this.request('/instance/fetchInstances', {
      method: 'GET',
    });
  }

  async getInstance(instanceName: string): Promise<UazapiInstance> {
    return this.request(`/instance/${instanceName}`, {
      method: 'GET',
    });
  }

  async getPrivacy(instanceToken: string): Promise<any> {
    return this.request('/instance/privacy', {
      method: 'GET',
    }, instanceToken);
  }

  async setPrivacy(instanceToken: string, settings: any): Promise<any> {
    return this.request('/instance/privacy', {
      method: 'POST',
      body: JSON.stringify(settings),
    }, instanceToken);
  }

  async setPresence(
    instanceToken: string, 
    presence: 'available' | 'unavailable'
  ): Promise<any> {
    return this.request('/instance/presence', {
      method: 'POST',
      body: JSON.stringify({ presence }),
    }, instanceToken);
  }

  async createGroup(
    instanceToken: string,
    name: string,
    participants: string[]
  ): Promise<any> {
    return this.request('/group/create', {
      method: 'POST',
      body: JSON.stringify({ name, participants }),
    }, instanceToken);
  }

  /**
   * PASSO 5 (FASE 2): Configurar integração Chatwoot na UAZAPI
   */
  async configureChatwoot(
    instanceToken: string,
    chatwootConfig: {
      url: string;
      access_token: string;
      account_id: number;
      inbox_id: number;
    }
  ): Promise<any> {
    console.log('📝 [STEP 5] Configurando Chatwoot na UAZAPI...');

    return this.request('/chatwoot/config', {
      method: 'PUT',
      body: JSON.stringify({
        enabled: true,
        url: chatwootConfig.url,
        access_token: chatwootConfig.access_token,
        account_id: chatwootConfig.account_id,
        inbox_id: chatwootConfig.inbox_id,
        ignore_groups: false,
        sign_messages: false,
        create_new_conversation: false,
      }),
    }, instanceToken);
  }
}

export const uazapiService = new UazapiService();