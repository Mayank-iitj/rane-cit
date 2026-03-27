'use client';

import { useState, useEffect, useCallback } from 'react';
import { api, getAuth, clearAuth, connectWebSocket } from '@/lib/api';

// ═══════════════════════════════════════════════════
// Icons (inline SVG for zero dependencies)
// ═══════════════════════════════════════════════════
const Icon = ({ d, size = 18 }: { d: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={d} /></svg>
);

const icons = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  machines: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  chart: "M18 20V10 M12 20V4 M6 20v-6",
  alert: "M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z M12 9v4 M12 17h.01",
  code: "M16 18l6-6-6-6 M8 6l-6 6 6 6",
  brain: "M12 2a4 4 0 0 0-4 4v1a4 4 0 0 0 0 8v1a4 4 0 0 0 4 4 4 4 0 0 0 4-4v-1a4 4 0 0 0 0-8V6a4 4 0 0 0-4-4z",
  twin: "M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z",
  settings: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z M12 6v6l4 2",
  api: "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8",
};

// ═══════════════════════════════════════════════════
// Sidebar Navigation
// ═══════════════════════════════════════════════════
const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: icons.dashboard, section: 'core' },
  { id: 'machines', label: 'Machines', icon: icons.machines, section: 'core' },
  { id: 'analytics', label: 'Analytics', icon: icons.chart, section: 'core' },
  { id: 'alerts', label: 'Alerts', icon: icons.alert, section: 'core' },
  { id: 'gcode', label: 'G-code Intelligence', icon: icons.code, section: 'intelligence' },
  { id: 'copilot', label: 'AI Copilot', icon: icons.brain, section: 'intelligence' },
  { id: 'twin', label: 'Digital Twin', icon: icons.twin, section: 'intelligence' },
  { id: 'api', label: 'API Explorer', icon: icons.api, section: 'developer' },
  { id: 'settings', label: 'Settings', icon: icons.settings, section: 'system' },
];

// ═══════════════════════════════════════════════════
// Main Dashboard App
// ═══════════════════════════════════════════════════
export default function DashboardPage() {
  const [activePage, setActivePage] = useState('dashboard');
  const [fleet, setFleet] = useState<any>(null);
  const [machines, setMachines] = useState<any[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [oee, setOEE] = useState<any[]>([]);
  const [energy, setEnergy] = useState<any[]>([]);
  const [liveData, setLiveData] = useState<any[]>([]);
  const [copilotMessages, setCopilotMessages] = useState<any[]>([{ role: 'assistant', text: "I'm the cnc.mayyanks.app AI Copilot. Ask me about your machines, predictions, or optimizations." }]);
  const [copilotInput, setCopilotInput] = useState('');
  const [twinState, setTwinState] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const auth = getAuth();

  // Fetch data
  const fetchData = useCallback(async () => {
    try {
      const [fleetRes, machinesRes, alertsRes, alertStatsRes, oeeRes, energyRes] = await Promise.all([
        api.getFleet(), api.listMachines(), api.listAlerts(), api.getAlertStats(), api.getOEE(), api.getEnergy()
      ]);
      if (fleetRes.ok) setFleet(await fleetRes.json());
      if (machinesRes.ok) setMachines(await machinesRes.json());
      if (alertsRes.ok) setAlerts(await alertsRes.json());
      if (alertStatsRes.ok) setAlertStats(await alertStatsRes.json());
      if (oeeRes.ok) setOEE(await oeeRes.json());
      if (energyRes.ok) setEnergy(await energyRes.json());
    } catch (e) {
      console.error('Fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!auth.isAuthenticated) { window.location.href = '/login'; return; }
    fetchData();
    const interval = setInterval(fetchData, 30000);

    // WebSocket
    const ws = connectWebSocket((msg) => {
      if (msg.channel === 'telemetry:new') {
        setLiveData(prev => [...prev.slice(-50), msg.data]);
      }
      if (msg.channel === 'alert:triggered') {
        setAlerts(prev => [msg.data, ...prev.slice(0, 49)]);
      }
    });

    return () => { clearInterval(interval); ws?.close(); };
  }, []);

  const handleLogout = () => { clearAuth(); window.location.href = '/login'; };

  const handleCopilotSend = async () => {
    if (!copilotInput.trim()) return;
    const q = copilotInput;
    setCopilotMessages(prev => [...prev, { role: 'user', text: q }]);
    setCopilotInput('');
    try {
      const res = await api.askCopilot(q, machines[0]?.id);
      if (res.ok) {
        const data = await res.json();
        setCopilotMessages(prev => [...prev, { role: 'assistant', text: data.answer, actions: data.suggested_actions }]);
      }
    } catch {}
  };

  const loadTwin = async (machineId: string) => {
    const res = await api.getDigitalTwin(machineId);
    if (res.ok) setTwinState(await res.json());
  };

  // ═══════ RENDER ═══════
  const renderSection = (title: string) => <div className="nav-section">{title}</div>;
  let currentSection = '';

  return (
    <div className="app-layout">
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-brand">
          <div className="sidebar-brand-icon">⚙️</div>
          <div>
            <h1>cnc.mayyanks</h1>
            <p>Intelligence Platform</p>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(item => {
            const showSection = item.section !== currentSection;
            currentSection = item.section;
            return (
              <div key={item.id}>
                {showSection && renderSection(item.section)}
                <div className={`nav-link ${activePage === item.id ? 'active' : ''}`} onClick={() => setActivePage(item.id)}>
                  <Icon d={item.icon} />
                  {item.label}
                </div>
              </div>
            );
          })}
        </nav>
        <div style={{ padding: '1rem 1.25rem', borderTop: '1px solid var(--border)' }}>
          <div className="nav-link" onClick={handleLogout}>
            <Icon d={icons.logout} /> Sign Out
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <header className="topbar">
          <h2 className="topbar-title">{navItems.find(n => n.id === activePage)?.label || 'Dashboard'}</h2>
          <div className="topbar-actions">
            <span className="badge badge-green">LIVE</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{auth.user?.email}</span>
          </div>
        </header>

        <div className="page-content animate-fade-in">
          {/* ═══ Dashboard ═══ */}
          {activePage === 'dashboard' && (
            <>
              <div className="stats-grid">
                <div className="stat-card"><div className="stat-label">Total Machines</div><div className="stat-value">{fleet?.total_machines || 0}</div><div className="stat-change up">↑ {fleet?.running_count || 0} running</div></div>
                <div className="stat-card"><div className="stat-label">Fleet Utilization</div><div className="stat-value">{fleet?.fleet_utilization || 0}%</div></div>
                <div className="stat-card"><div className="stat-label">Active Alerts</div><div className="stat-value" style={{ WebkitTextFillColor: (fleet?.active_alerts || 0) > 0 ? '#ef4444' : undefined }}>{fleet?.active_alerts || 0}</div></div>
                <div className="stat-card"><div className="stat-label">Energy (24h)</div><div className="stat-value">{fleet?.total_energy_kwh || 0} kWh</div></div>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Machine Status</span></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Machine</th><th>Status</th><th>Protocol</th></tr></thead>
                      <tbody>
                        {machines.map(m => (
                          <tr key={m.id}><td><span className={`status-dot ${m.status}`} />{m.name}</td><td><span className={`badge badge-${m.status === 'running' ? 'green' : m.status === 'idle' ? 'yellow' : 'red'}`}>{m.status}</span></td><td>{m.protocol}</td></tr>
                        ))}
                        {machines.length === 0 && <tr><td colSpan={3} style={{ color: '#64748b', textAlign: 'center' }}>No machines. Start the API server to see demo data.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Recent Alerts</span></div>
                  {alerts.slice(0, 8).map((a, i) => (
                    <div key={i} style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <span className={`badge badge-${a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'yellow' : 'blue'}`}>{a.severity}</span>
                      <span style={{ fontSize: '0.85rem' }}>{a.title}</span>
                    </div>
                  ))}
                  {alerts.length === 0 && <p style={{ color: '#64748b', fontSize: '0.85rem' }}>No alerts</p>}
                </div>
              </div>

              {liveData.length > 0 && (
                <div className="card" style={{ marginTop: '1rem' }}>
                  <div className="card-header"><span className="card-title">🔴 Live Telemetry Feed</span></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Machine</th><th>Spindle RPM</th><th>Temp °C</th><th>Vibration</th><th>Load %</th></tr></thead>
                      <tbody>
                        {liveData.slice(-8).reverse().map((d, i) => (
                          <tr key={i}><td>{d.machine_name}</td><td>{d.spindle_speed?.toFixed(0)}</td><td>{d.temperature?.toFixed(1)}</td><td>{d.vibration?.toFixed(3)}</td><td>{d.load_percent?.toFixed(1)}</td></tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </>
          )}

          {/* ═══ Machines ═══ */}
          {activePage === 'machines' && (
            <div>
              <div className="table-container">
                <table>
                  <thead><tr><th>Name</th><th>Model</th><th>Manufacturer</th><th>Status</th><th>Location</th><th>Protocol</th></tr></thead>
                  <tbody>
                    {machines.map(m => (
                      <tr key={m.id}>
                        <td><strong>{m.name}</strong></td>
                        <td>{m.model || '—'}</td>
                        <td>{m.manufacturer || '—'}</td>
                        <td><span className={`badge badge-${m.status === 'running' ? 'green' : m.status === 'idle' ? 'yellow' : m.status === 'online' ? 'blue' : 'red'}`}>{m.status}</span></td>
                        <td>{m.location || '—'}</td>
                        <td><span className="badge badge-purple">{m.protocol}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ═══ Analytics ═══ */}
          {activePage === 'analytics' && (
            <>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#22d3ee' }}>⚡ OEE — Overall Equipment Effectiveness</h3>
              <div className="table-container" style={{ marginBottom: '1.5rem' }}>
                <table>
                  <thead><tr><th>Machine</th><th>Availability</th><th>Performance</th><th>Quality</th><th>OEE</th></tr></thead>
                  <tbody>
                    {oee.map((o, i) => (
                      <tr key={i}><td>{o.machine_name}</td><td>{o.availability}%</td><td>{o.performance}%</td><td>{o.quality}%</td><td><strong style={{ color: o.oee > 70 ? '#34d399' : o.oee > 50 ? '#fbbf24' : '#ef4444' }}>{o.oee}%</strong></td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: '1rem', color: '#34d399' }}>🔋 Energy Consumption</h3>
              <div className="table-container">
                <table>
                  <thead><tr><th>Machine</th><th>Total kWh</th><th>Avg Power W</th><th>Peak W</th><th>Cost $</th><th>Efficiency</th></tr></thead>
                  <tbody>
                    {energy.map((e, i) => (
                      <tr key={i}><td>{e.machine_name}</td><td>{e.total_kwh}</td><td>{e.avg_power_w}</td><td>{e.peak_power_w}</td><td>${e.cost_estimate}</td><td>{e.efficiency_score}%</td></tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ Alerts ═══ */}
          {activePage === 'alerts' && (
            <>
              {alertStats && (
                <div className="stats-grid">
                  <div className="stat-card"><div className="stat-label">Total</div><div className="stat-value">{alertStats.total}</div></div>
                  <div className="stat-card"><div className="stat-label">Critical</div><div className="stat-value" style={{ WebkitTextFillColor: '#ef4444' }}>{alertStats.critical}</div></div>
                  <div className="stat-card"><div className="stat-label">Warning</div><div className="stat-value" style={{ WebkitTextFillColor: '#fbbf24' }}>{alertStats.warning}</div></div>
                  <div className="stat-card"><div className="stat-label">Unacknowledged</div><div className="stat-value">{alertStats.unacknowledged}</div></div>
                </div>
              )}
              <div className="table-container">
                <table>
                  <thead><tr><th>Severity</th><th>Type</th><th>Title</th><th>Machine</th><th>Ack</th><th>Action</th></tr></thead>
                  <tbody>
                    {alerts.map((a, i) => (
                      <tr key={i}>
                        <td><span className={`badge badge-${a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'yellow' : 'blue'}`}>{a.severity}</span></td>
                        <td>{a.type}</td>
                        <td>{a.title}</td>
                        <td>{a.machine_id?.slice(0, 8)}</td>
                        <td>{a.is_acknowledged ? '✅' : '❌'}</td>
                        <td>{!a.is_acknowledged && <button className="btn btn-secondary" style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem' }} onClick={async () => { await api.acknowledgeAlert(a.id); fetchData(); }}>Acknowledge</button>}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}

          {/* ═══ G-code Intelligence ═══ */}
          {activePage === 'gcode' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><span className="card-title">Upload G-code for Analysis</span></div>
                <input type="file" accept=".nc,.gcode,.ngc,.tap" className="form-input" onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const res = await api.analyzeGcode(file);
                    if (res.ok) alert('G-code analyzed! Check programs list.');
                  }
                }} />
                <p style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.5rem' }}>Supports .nc, .gcode, .ngc, .tap files</p>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">G-code Optimizer</span></div>
                <textarea className="form-input" rows={8} placeholder="Paste G-code here..." style={{ fontFamily: 'monospace', fontSize: '0.8rem' }} id="gcode-input" />
                <button className="btn btn-primary" style={{ marginTop: '0.75rem' }} onClick={async () => {
                  const textarea = document.getElementById('gcode-input') as HTMLTextAreaElement;
                  if (textarea?.value) {
                    const res = await api.optimizeGcode(textarea.value);
                    if (res.ok) { const data = await res.json(); alert(`Optimized! Saved ${data.time_saved_percent}% time. Changes: ${data.changes_made.join(', ')}`); }
                  }
                }}>Optimize</button>
              </div>
            </div>
          )}

          {/* ═══ AI Copilot ═══ */}
          {activePage === 'copilot' && (
            <div className="chat-container">
              <div className="chat-messages">
                {copilotMessages.map((msg, i) => (
                  <div key={i} className="chat-message">
                    <div className={`chat-bubble ${msg.role === 'user' ? 'user' : ''}`}>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{msg.text}</div>
                      {msg.actions && msg.actions.length > 0 && (
                        <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                          {msg.actions.map((a: string, j: number) => (
                            <span key={j} className="badge badge-blue">{a}</span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <div className="chat-input-area">
                <input className="form-input" placeholder='Ask: "Why did Machine 2 stop?" or "Predict next failure"' value={copilotInput} onChange={e => setCopilotInput(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleCopilotSend()} />
                <button className="btn btn-primary" onClick={handleCopilotSend}>Send</button>
              </div>
            </div>
          )}

          {/* ═══ Digital Twin ═══ */}
          {activePage === 'twin' && (
            <>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {machines.map(m => (
                  <button key={m.id} className="btn btn-secondary" onClick={() => loadTwin(m.id)}>{m.name}</button>
                ))}
              </div>
              {twinState ? (
                <div className="grid-3">
                  <div className="stat-card"><div className="stat-label">Machine</div><div className="stat-value" style={{ fontSize: '1.2rem' }}>{twinState.machine_name}</div><div className="stat-change">{twinState.status}</div></div>
                  <div className="stat-card"><div className="stat-label">Health Score</div><div className="stat-value" style={{ WebkitTextFillColor: twinState.health_score > 80 ? '#34d399' : twinState.health_score > 50 ? '#fbbf24' : '#ef4444' }}>{twinState.health_score}%</div></div>
                  <div className="stat-card"><div className="stat-label">Spindle RPM</div><div className="stat-value">{twinState.spindle_speed_rpm?.toFixed(0)}</div></div>
                  <div className="stat-card"><div className="stat-label">Temperature</div><div className="stat-value">{twinState.spindle_temperature_c?.toFixed(1)}°C</div></div>
                  <div className="stat-card"><div className="stat-label">Vibration</div><div className="stat-value">{twinState.vibration_mm_s?.toFixed(3)}</div></div>
                  <div className="stat-card"><div className="stat-label">Tool Wear</div><div className="stat-value">{twinState.tool_wear_percent?.toFixed(1)}%</div></div>
                  <div className="stat-card"><div className="stat-label">Power</div><div className="stat-value">{twinState.power_consumption_w?.toFixed(0)}W</div></div>
                  <div className="stat-card"><div className="stat-label">Coolant Flow</div><div className="stat-value">{twinState.coolant_flow_lpm?.toFixed(1)} L/m</div></div>
                  <div className="stat-card"><div className="stat-label">Tool Life</div><div className="stat-value">{twinState.tool_life_remaining_min?.toFixed(0)} min</div></div>
                </div>
              ) : (
                <div className="card" style={{ textAlign: 'center', padding: '3rem' }}>
                  <p style={{ color: '#64748b' }}>Select a machine above to view its digital twin</p>
                </div>
              )}
            </>
          )}

          {/* ═══ API Explorer ═══ */}
          {activePage === 'api' && (
            <>
              <p style={{ color: '#94a3b8', marginBottom: '1.5rem', fontSize: '0.9rem' }}>cnc.mayyanks.app API — Full endpoint reference. Base URL: <code style={{ color: '#22d3ee' }}>https://cnc.mayyanks.app/api</code></p>
              {[
                { section: 'Authentication', endpoints: [
                  { m: 'POST', p: '/auth/login', d: 'JWT login' },
                  { m: 'POST', p: '/auth/register', d: 'Create account' },
                  { m: 'GET', p: '/auth/google/login', d: 'Google OAuth redirect' },
                  { m: 'POST', p: '/auth/google/verify-token', d: 'Verify Google ID token' },
                  { m: 'POST', p: '/auth/refresh', d: 'Refresh access token' },
                  { m: 'POST', p: '/auth/api-keys', d: 'Create API key' },
                ]},
                { section: 'Machines', endpoints: [
                  { m: 'GET', p: '/machines', d: 'List machines' },
                  { m: 'POST', p: '/machines', d: 'Register machine' },
                  { m: 'GET', p: '/machines/:id', d: 'Machine details' },
                  { m: 'PATCH', p: '/machines/:id', d: 'Update machine' },
                  { m: 'DELETE', p: '/machines/:id', d: 'Delete machine' },
                  { m: 'POST', p: '/machines/:id/heartbeat', d: 'Edge agent heartbeat' },
                ]},
                { section: 'Telemetry', endpoints: [
                  { m: 'POST', p: '/telemetry/ingest', d: 'Ingest single reading' },
                  { m: 'POST', p: '/telemetry/ingest/batch', d: 'Batch ingest' },
                  { m: 'GET', p: '/telemetry/:machine_id', d: 'Query telemetry' },
                  { m: 'GET', p: '/telemetry/:machine_id/stats', d: 'Aggregated stats' },
                  { m: 'GET', p: '/telemetry/:machine_id/latest', d: 'Latest reading' },
                ]},
                { section: 'Analytics', endpoints: [
                  { m: 'GET', p: '/analytics/oee', d: 'OEE calculation' },
                  { m: 'GET', p: '/analytics/fleet', d: 'Fleet intelligence' },
                  { m: 'GET', p: '/analytics/downtime', d: 'Downtime analysis' },
                  { m: 'GET', p: '/analytics/energy', d: 'Energy consumption' },
                ]},
                { section: 'ML Service', endpoints: [
                  { m: 'POST', p: '/predict/failure', d: 'Failure prediction' },
                  { m: 'POST', p: '/detect/anomaly', d: 'Anomaly detection' },
                  { m: 'POST', p: '/optimize/parameters', d: 'Parameter optimization' },
                ]},
                { section: 'G-code', endpoints: [
                  { m: 'POST', p: '/gcode/analyze', d: 'Analyze G-code file' },
                  { m: 'POST', p: '/gcode/optimize', d: 'Optimize G-code' },
                  { m: 'GET', p: '/gcode/programs', d: 'List programs' },
                ]},
                { section: 'Digital Twin & Copilot', endpoints: [
                  { m: 'GET', p: '/digital-twin/:id', d: 'Twin state' },
                  { m: 'POST', p: '/digital-twin/simulate', d: 'Run simulation' },
                  { m: 'POST', p: '/copilot/ask', d: 'Ask AI copilot' },
                  { m: 'GET', p: '/copilot/suggestions/:id', d: 'Autonomous suggestions' },
                ]},
              ].map(({ section, endpoints }) => (
                <div key={section} style={{ marginBottom: '1.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#22d3ee', marginBottom: '0.5rem' }}>{section}</h3>
                  {endpoints.map(({ m, p, d }) => (
                    <div key={p} className="api-endpoint">
                      <span className={`api-method ${m.toLowerCase()}`}>{m}</span>
                      <span className="api-path">{p}</span>
                      <span className="api-desc">{d}</span>
                    </div>
                  ))}
                </div>
              ))}
            </>
          )}

          {/* ═══ Settings ═══ */}
          {activePage === 'settings' && (
            <div className="grid-2">
              <div className="card">
                <div className="card-header"><span className="card-title">Profile</span></div>
                <div className="form-group"><label className="form-label">Email</label><input className="form-input" value={auth.user?.email || ''} readOnly /></div>
                <div className="form-group"><label className="form-label">Name</label><input className="form-input" value={auth.user?.name || ''} readOnly /></div>
                <div className="form-group"><label className="form-label">Role</label><input className="form-input" value={auth.user?.role || ''} readOnly /></div>
                <div className="form-group"><label className="form-label">Organization</label><input className="form-input" value={auth.user?.org_id || ''} readOnly /></div>
              </div>
              <div className="card">
                <div className="card-header"><span className="card-title">Platform Info</span></div>
                <div style={{ fontSize: '0.85rem', lineHeight: 2 }}>
                  <p><strong>Product:</strong> cnc.mayyanks.app</p>
                  <p><strong>Version:</strong> 1.0.0</p>
                  <p><strong>API:</strong> https://cnc.mayyanks.app/api</p>
                  <p><strong>WebSocket:</strong> wss://cnc.mayyanks.app/ws</p>
                  <p><strong>Services:</strong> API, ML, Realtime, Ingestion, Edge Agent</p>
                  <p><strong>Auth:</strong> JWT + Google OAuth + API Keys</p>
                </div>
                <button className="btn btn-danger" onClick={handleLogout} style={{ marginTop: '1rem', width: '100%', justifyContent: 'center' }}>Sign Out</button>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
