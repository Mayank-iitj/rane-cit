// cnc-mayyanks-frontend — API Client & Auth Store
const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || '';

// ═══════════════════════════════════════════════════
// Auth Store (Zustand-like in-memory)
// ═══════════════════════════════════════════════════

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

export interface AuthResponse {
  access_token: string;
  refresh_token: string;
  user: User;
}

export interface WebSocketMessage {
  channel: string;
  data: unknown;
}

let authState: AuthState = {
  user: null,
  accessToken: null,
  refreshToken: null,
  isAuthenticated: false,
};

export function getAuth(): AuthState {
  if (typeof window !== 'undefined' && !authState.accessToken) {
    const stored = localStorage.getItem('cnc_mayyanks_auth');
    if (stored) {
      authState = JSON.parse(stored);
    }
  }
  return authState;
}

export function setAuth(data: AuthResponse) {
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

export function clearAuth() {
  authState = { user: null, accessToken: null, refreshToken: null, isAuthenticated: false };
  if (typeof window !== 'undefined') {
    localStorage.removeItem('cnc_mayyanks_auth');
  }
}

// ═══════════════════════════════════════════════════
// API Client
// ═══════════════════════════════════════════════════

async function apiFetch(path: string, options: RequestInit = {}) {
  const auth = getAuth();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  if (auth.accessToken) {
    headers['Authorization'] = `Bearer ${auth.accessToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });

  if (res.status === 401) {
    // Try refresh
    if (auth.refreshToken) {
      const refreshRes = await fetch(`${API_URL}/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: auth.refreshToken }),
      });
      if (refreshRes.ok) {
        const data = await refreshRes.json();
        setAuth(data);
        headers['Authorization'] = `Bearer ${data.access_token}`;
        return fetch(`${API_URL}${path}`, { ...options, headers });
      }
    }
    clearAuth();
    if (typeof window !== 'undefined') window.location.href = '/login';
  }

  return res;
}

export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiFetch('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  register: (email: string, password: string, full_name: string, org_name?: string) =>
    apiFetch('/auth/register', { method: 'POST', body: JSON.stringify({ email, password, full_name, org_name }) }),
  googleVerify: (id_token: string) =>
    apiFetch('/auth/google/verify-token', { method: 'POST', body: JSON.stringify({ id_token }) }),
  me: () => apiFetch('/auth/me'),

  // Machines
  listMachines: () => apiFetch('/machines'),
  getMachine: (id: string) => apiFetch(`/machines/${id}`),
  createMachine: (data: Record<string, unknown>) => apiFetch('/machines', { method: 'POST', body: JSON.stringify(data) }),
  updateMachine: (id: string, data: Record<string, unknown>) => apiFetch(`/machines/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteMachine: (id: string) => apiFetch(`/machines/${id}`, { method: 'DELETE' }),

  // Telemetry
  getTelemetry: (machineId: string, hours = 1) => apiFetch(`/telemetry/${machineId}?hours=${hours}`),
  getTelemetryStats: (machineId: string, hours = 24) => apiFetch(`/telemetry/${machineId}/stats?hours=${hours}`),
  getLatestTelemetry: (machineId: string) => apiFetch(`/telemetry/${machineId}/latest`),

  // Analytics
  getOEE: (hours = 24) => apiFetch(`/analytics/oee?hours=${hours}`),
  getFleet: () => apiFetch('/analytics/fleet'),
  getDowntime: (hours = 24) => apiFetch(`/analytics/downtime?hours=${hours}`),
  getEnergy: (hours = 24) => apiFetch(`/analytics/energy?hours=${hours}`),

  // Alerts
  listAlerts: (hours = 24) => apiFetch(`/alerts?hours=${hours}`),
  getAlertStats: () => apiFetch('/alerts/stats'),
  acknowledgeAlert: (id: string) => apiFetch(`/alerts/${id}/acknowledge`, { method: 'POST' }),

  // G-code
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
  listPrograms: () => apiFetch('/gcode/programs'),

  // Digital Twin
  getDigitalTwin: (machineId: string) => apiFetch(`/digital-twin/${machineId}`),
  simulate: (machineId: string, scenario: string, duration = 60) =>
    apiFetch('/digital-twin/simulate', { method: 'POST', body: JSON.stringify({ machine_id: machineId, scenario, duration_seconds: duration }) }),

  // Copilot
  askCopilot: (question: string, machineId?: string) =>
    apiFetch('/copilot/ask', { method: 'POST', body: JSON.stringify({ question, machine_id: machineId }) }),
  getSuggestions: (machineId: string) => apiFetch(`/copilot/suggestions/${machineId}`),

  // Tenants
  listTenants: () => apiFetch('/tenants'),

  // API Directory
  getDirectory: () => apiFetch(''),
};

// ═══════════════════════════════════════════════════
// WebSocket Connection
// ═══════════════════════════════════════════════════

export function connectWebSocket(onMessage: (data: WebSocketMessage) => void): WebSocket | null {
  if (typeof window === 'undefined') return null;

  const ws = new WebSocket(WS_URL);

  ws.onopen = () => {
    console.log('[cnc-mayyanks] WebSocket connected');
  };

  ws.onmessage = (event) => {
    try {
      const data = JSON.parse(event.data) as WebSocketMessage;
      onMessage(data);
    } catch (e) {
      console.error('[cnc-mayyanks] WebSocket parse error', e);
    }
  };

  ws.onerror = (err) => {
    console.error('[cnc-mayyanks] WebSocket error', err);
  };

  ws.onclose = () => {
    console.log('[cnc-mayyanks] WebSocket disconnected, reconnecting in 3s...');
    setTimeout(() => connectWebSocket(onMessage), 3000);
  };

  return ws;
}

export { API_URL, WS_URL };
