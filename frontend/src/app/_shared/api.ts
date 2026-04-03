const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

export interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  org_id: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
}

interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

interface WebSocketMessage {
  channel: string;
  data: unknown;
}

// Default anonymous user (no login required)
const ANONYMOUS_USER: User = {
  id: 'anonymous',
  email: 'guest@cnc.mayyanks.app',
  name: 'Guest User',
  role: 'viewer',
  org_id: 'public',
};

let authState: AuthState = {
  user: ANONYMOUS_USER,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export function getAuth(): AuthState {
  if (typeof window !== 'undefined' && !authState.accessToken) {
    const stored = localStorage.getItem('cnc_mayyanks_auth');
    if (stored) {
      authState = JSON.parse(stored) as AuthState;
    } else {
      // Maintain anonymous access if no stored auth
      authState = {
        user: ANONYMOUS_USER,
        accessToken: null,
        refreshToken: null,
        isAuthenticated: false,
      };
    }
  }
  return authState;
}

export function setAuth(data: AuthResponse): void {
  authState = {
    user: data.user,
    accessToken: data.access_token,
    refreshToken: data.refresh_token,
    isAuthenticated: true,
  };
  if (typeof window !== 'undefined') {
    localStorage.setItem('cnc_mayyanks_auth', JSON.stringify(authState));
  }
}

export function clearAuth(): void {
  authState = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cnc_mayyanks_auth');
  }
}

async function apiFetch(path: string, options: RequestInit = {}): Promise<Response> {
  try {
    const auth = getAuth();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> | undefined),
    };

    if (auth.accessToken) {
      headers.Authorization = `Bearer ${auth.accessToken}`;
    }

    const res = await fetch(`${API_URL}${path}`, { ...options, headers });

    if (res.status === 401) {
      if (auth.refreshToken) {
        const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refresh_token: auth.refreshToken }),
        });

        if (refreshRes.ok) {
          const data = (await refreshRes.json()) as AuthResponse;
          setAuth(data);
          headers.Authorization = `Bearer ${data.access_token}`;
          return fetch(`${API_URL}${path}`, { ...options, headers });
        }
      }
    }

    // FIX: Return response even on error so caller can check .ok
    if (!res.ok && res.status >= 500) {
      console.error(`API Error [${res.status}] ${path}`, res.statusText);
    }
    return res;
  } catch (error) {
    // FIX: Catch network errors and return error response
    console.error(`API Network Error: ${path}`, error);
    // Return a mock error response
    return new Response(JSON.stringify({ error: 'Network error' }), {
      status: 0,
      statusText: 'Network error',
    });
  }
}

export const api = {
  listMachines: () => apiFetch('/machines'),
  listAlerts: (hours = 24) => apiFetch(`/alerts?hours=${hours}`),
  getAlertStats: () => apiFetch('/alerts/stats'),
  getOEE: (hours = 24) => apiFetch(`/analytics/oee?hours=${hours}`),
  getFleet: () => apiFetch('/analytics/fleet'),
  getEnergy: (hours = 24) => apiFetch(`/analytics/energy?hours=${hours}`),
  askCopilot: (question: string, machineId?: string) =>
    apiFetch('/copilot/ask', { method: 'POST', body: JSON.stringify({ question, machine_id: machineId }) }),
  getDigitalTwin: (machineId: string) => apiFetch(`/digital-twin/${machineId}`),
  acknowledgeAlert: (id: string) => apiFetch(`/alerts/${id}/acknowledge`, { method: 'POST' }),
  analyzeGcode: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const auth = getAuth();
    return fetch(`${API_URL}/gcode/analyze`, {
      method: 'POST',
      headers: auth.accessToken ? { Authorization: `Bearer ${auth.accessToken}` } : {},
      body: formData,
    });
  },
  optimizeGcode: (gcode: string) =>
    apiFetch('/gcode/optimize', { method: 'POST', body: JSON.stringify({ gcode }) }),
};

let globalWs: WebSocket | null = null;
let wsReconnectTimeout: NodeJS.Timeout | null = null;

export function connectWebSocket(onMessage: (data: WebSocketMessage) => void): WebSocket | null {
  if (typeof window === 'undefined') {
    return null;
  }

  // FIX: Close existing connection before creating new one (prevent memory leak)
  if (globalWs) {
    globalWs.close();
    globalWs = null;
  }

  // Clear any pending reconnection
  if (wsReconnectTimeout) {
    clearTimeout(wsReconnectTimeout);
    wsReconnectTimeout = null;
  }

  const derivedWsUrl =
    WS_URL ||
    `${window.location.protocol === 'https:' ? 'wss:' : 'ws:'}//${window.location.host}/api/realtime`;

  try {
    const ws = new WebSocket(derivedWsUrl);
    globalWs = ws;

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as WebSocketMessage;
        onMessage(data);
      } catch (e) {
        // Silently ignore parse errors in production
        if (process.env.NODE_ENV === 'development') {
          console.error('[cnc-mayyanks] WebSocket parse error', e);
        }
      }
    };

    ws.onerror = (error) => {
      if (process.env.NODE_ENV === 'development') {
        console.error('[cnc-mayyanks] WebSocket error', error);
      }
    };

    ws.onclose = () => {
      globalWs = null;
      // Exponential backoff: 3s, 6s, 12s, max 30s
      const delay = Math.min(3000 * Math.pow(1.5, Math.floor(Math.random() * 10)), 30000);
      wsReconnectTimeout = setTimeout(() => connectWebSocket(onMessage), delay);
    };

    return ws;
  } catch (error) {
    if (process.env.NODE_ENV === 'development') {
      console.error('[cnc-mayyanks] WebSocket connection failed', error);
    }
    return null;
  }
}
