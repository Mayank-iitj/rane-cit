'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { api, getAuth, clearAuth, connectWebSocket } from '../_shared/api';

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
  back: "M15 18l-6-6 6-6 M9 12h12",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
  zap: "M13 2L3 14h9l-1 8 10-12h-9l1-8",
};

function Icon({ d }: { d: string }) {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

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

const WORKFLOW_SEQUENCE = ['dashboard', 'machines', 'analytics', 'alerts', 'copilot', 'twin', 'api'];

const SECTION_GUIDE: Record<string, { title: string; caption: string; icon: string }> = {
  dashboard: {
    title: 'Mission Control',
    caption: 'Live fleet pulse, throughput, and risk posture for judges in one frame.',
    icon: icons.dashboard,
  },
  machines: {
    title: 'Machine Command Grid',
    caption: 'Tap any machine row to open its twin and drill into its operating condition.',
    icon: icons.machines,
  },
  analytics: {
    title: 'Production Intelligence',
    caption: 'OEE and energy evidence for measurable business impact.',
    icon: icons.chart,
  },
  alerts: {
    title: 'Predictive Alert Desk',
    caption: 'Actionable alerts prioritized for operational safety and uptime.',
    icon: icons.alert,
  },
  gcode: {
    title: 'Program Optimizer',
    caption: 'Analyze and optimize toolpaths to reduce cycle time and wear.',
    icon: icons.code,
  },
  copilot: {
    title: 'Judge Copilot',
    caption: 'One-click preset answers for judges with explainable recommendations.',
    icon: icons.brain,
  },
  twin: {
    title: 'Digital Twin Lens',
    caption: 'High-fidelity machine state for instant diagnostics and decisions.',
    icon: icons.twin,
  },
  api: {
    title: 'Developer Surface',
    caption: 'Trace every capability to concrete API endpoints and integrations.',
    icon: icons.api,
  },
  settings: {
    title: 'Control Settings',
    caption: 'Profile and platform configuration details for deployment context.',
    icon: icons.settings,
  },
};

interface FleetData {
  total_machines: number;
  running_count: number;
  fleet_utilization: number;
  active_alerts: number;
  total_energy_kwh: number;
}

interface MachineData {
  id: string;
  name: string;
  status: string;
  protocol: string;
  model?: string;
  manufacturer?: string;
  location?: string;
}

interface AlertData {
  id: string;
  severity: string;
  type: string;
  title: string;
  machine_id?: string;
  is_acknowledged: boolean;
}

interface AlertStats {
  total: number;
  critical: number;
  warning: number;
  unacknowledged: number;
}

interface OEEData {
  machine_name: string;
  availability: number;
  performance: number;
  quality: number;
  oee: number;
}

interface EnergyData {
  machine_name: string;
  total_kwh: number;
  avg_power_w: number;
  peak_power_w: number;
  cost_estimate: number;
  efficiency_score: number;
}

interface LiveTelemetry {
  machine_name: string;
  spindle_speed?: number;
  temperature?: number;
  vibration?: number;
  load_percent?: number;
}

interface CopilotMessage {
  role: 'assistant' | 'user';
  text: string;
  actions?: string[];
}

interface TwinState {
  machine_name: string;
  status: string;
  health_score: number;
  spindle_speed_rpm?: number;
  spindle_temperature_c?: number;
  vibration_mm_s?: number;
  tool_wear_percent?: number;
  power_consumption_w?: number;
  coolant_flow_lpm?: number;
  tool_life_remaining_min?: number;
}

interface CopilotPreset {
  question: string;
  answer: string;
  actions: string[];
}

const DEMO_FLEET: FleetData = {
  total_machines: 8,
  running_count: 6,
  fleet_utilization: 82.4,
  active_alerts: 3,
  total_energy_kwh: 1248.7,
};

const DEMO_MACHINES: MachineData[] = [
  { id: 'mcn-01', name: 'Haas VF-2 #A1', status: 'running', protocol: 'MTConnect', model: 'VF-2', manufacturer: 'Haas', location: 'Line A - Cell 1' },
  { id: 'mcn-02', name: 'DMG Mori CMX #B2', status: 'running', protocol: 'OPC-UA', model: 'CMX 1100 V', manufacturer: 'DMG Mori', location: 'Line B - Cell 2' },
  { id: 'mcn-03', name: 'Mazak QTN #C3', status: 'idle', protocol: 'Modbus', model: 'QTN 250', manufacturer: 'Mazak', location: 'Line C - Cell 1' },
  { id: 'mcn-04', name: 'Makino PS95 #A2', status: 'running', protocol: 'MTConnect', model: 'PS95', manufacturer: 'Makino', location: 'Line A - Cell 2' },
  { id: 'mcn-05', name: 'Okuma GENOS #B1', status: 'running', protocol: 'OPC-UA', model: 'GENOS M560V', manufacturer: 'Okuma', location: 'Line B - Cell 1' },
  { id: 'mcn-06', name: 'Doosan DNM #D1', status: 'offline', protocol: 'MQTT', model: 'DNM 4500', manufacturer: 'Doosan', location: 'Line D - Cell 1' },
  { id: 'mcn-07', name: 'Brother Speedio #E1', status: 'running', protocol: 'MTConnect', model: 'S700X1', manufacturer: 'Brother', location: 'Line E - Cell 1' },
  { id: 'mcn-08', name: 'Hurco VMX #F1', status: 'idle', protocol: 'Modbus', model: 'VMX42', manufacturer: 'Hurco', location: 'Line F - Cell 1' },
];

const DEMO_ALERTS: AlertData[] = [
  { id: 'alt-001', severity: 'critical', type: 'HIGH_TEMPERATURE', title: 'Spindle temperature exceeded threshold', machine_id: 'mcn-02', is_acknowledged: false },
  { id: 'alt-002', severity: 'warning', type: 'VIBRATION_ANOMALY', title: 'Abnormal vibration trend on X axis', machine_id: 'mcn-04', is_acknowledged: false },
  { id: 'alt-003', severity: 'info', type: 'TOOL_WEAR', title: 'Tool life below 18%', machine_id: 'mcn-05', is_acknowledged: true },
  { id: 'alt-004', severity: 'warning', type: 'ENERGY_SPIKE', title: 'Power draw anomaly detected', machine_id: 'mcn-01', is_acknowledged: false },
  { id: 'alt-005', severity: 'info', type: 'COOLANT_FLOW', title: 'Coolant flow reduced by 9%', machine_id: 'mcn-03', is_acknowledged: true },
];

const DEMO_ALERT_STATS: AlertStats = {
  total: 5,
  critical: 1,
  warning: 2,
  unacknowledged: 3,
};

const DEMO_OEE: OEEData[] = [
  { machine_name: 'Haas VF-2 #A1', availability: 93.2, performance: 88.4, quality: 97.1, oee: 79.9 },
  { machine_name: 'DMG Mori CMX #B2', availability: 89.6, performance: 85.8, quality: 96.4, oee: 74.0 },
  { machine_name: 'Makino PS95 #A2', availability: 95.0, performance: 90.5, quality: 98.2, oee: 84.4 },
  { machine_name: 'Okuma GENOS #B1', availability: 91.4, performance: 87.6, quality: 97.5, oee: 78.0 },
];

const DEMO_ENERGY: EnergyData[] = [
  { machine_name: 'Haas VF-2 #A1', total_kwh: 182.4, avg_power_w: 6120, peak_power_w: 8900, cost_estimate: 22.8, efficiency_score: 88.1 },
  { machine_name: 'DMG Mori CMX #B2', total_kwh: 205.3, avg_power_w: 6640, peak_power_w: 9300, cost_estimate: 25.7, efficiency_score: 84.3 },
  { machine_name: 'Makino PS95 #A2', total_kwh: 169.8, avg_power_w: 5840, peak_power_w: 8120, cost_estimate: 21.2, efficiency_score: 91.2 },
  { machine_name: 'Okuma GENOS #B1', total_kwh: 191.1, avg_power_w: 6290, peak_power_w: 9020, cost_estimate: 23.9, efficiency_score: 86.8 },
];

const DEMO_LIVE: LiveTelemetry[] = [
  { machine_name: 'Haas VF-2 #A1', spindle_speed: 12400, temperature: 62.4, vibration: 2.14, load_percent: 71.3 },
  { machine_name: 'DMG Mori CMX #B2', spindle_speed: 11680, temperature: 89.2, vibration: 7.94, load_percent: 92.5 },
  { machine_name: 'Makino PS95 #A2', spindle_speed: 13220, temperature: 58.6, vibration: 1.98, load_percent: 67.8 },
  { machine_name: 'Okuma GENOS #B1', spindle_speed: 10950, temperature: 65.1, vibration: 2.47, load_percent: 74.2 },
];

const DEMO_TWIN_STATES: Record<string, TwinState> = {
  'mcn-01': { machine_name: 'Haas VF-2 #A1', status: 'RUNNING', health_score: 91, spindle_speed_rpm: 12400, spindle_temperature_c: 62.4, vibration_mm_s: 2.14, tool_wear_percent: 28.3, power_consumption_w: 6120, coolant_flow_lpm: 16.2, tool_life_remaining_min: 210 },
  'mcn-02': { machine_name: 'DMG Mori CMX #B2', status: 'RUNNING', health_score: 72, spindle_speed_rpm: 11680, spindle_temperature_c: 89.2, vibration_mm_s: 7.94, tool_wear_percent: 67.5, power_consumption_w: 6640, coolant_flow_lpm: 13.4, tool_life_remaining_min: 64 },
  'mcn-03': { machine_name: 'Mazak QTN #C3', status: 'IDLE', health_score: 86, spindle_speed_rpm: 0, spindle_temperature_c: 39.8, vibration_mm_s: 0.92, tool_wear_percent: 42.0, power_consumption_w: 1800, coolant_flow_lpm: 6.1, tool_life_remaining_min: 185 },
  'mcn-04': { machine_name: 'Makino PS95 #A2', status: 'RUNNING', health_score: 88, spindle_speed_rpm: 13220, spindle_temperature_c: 58.6, vibration_mm_s: 1.98, tool_wear_percent: 31.4, power_consumption_w: 5840, coolant_flow_lpm: 15.8, tool_life_remaining_min: 233 },
};

const COPILOT_PRESET_QNA: CopilotPreset[] = [
  { question: 'Which machine is highest risk right now?', answer: 'DMG Mori CMX #B2 is highest risk. It has 89.2C spindle temperature, 7.94 mm/s vibration, and only 64 minutes estimated tool life remaining.', actions: ['Schedule 20-min maintenance window', 'Reduce spindle by 8%', 'Inspect spindle bearings'] },
  { question: 'Why did OEE drop this shift?', answer: 'OEE dropped primarily due to performance loss on CMX #B2 and one offline asset (Doosan DNM #D1). Availability remained high, but cycle slowdown increased by ~11%.', actions: ['Rebalance jobs to Makino PS95', 'Run feed/spindle optimization profile', 'Bring DNM #D1 back online'] },
  { question: 'What should we do about the critical alert?', answer: 'Immediate response: cool down CMX #B2 spindle and inspect lubrication flow. This is a heat-driven failure precursor, not a transient spike.', actions: ['Pause current high-load job', 'Verify coolant pressure', 'Trigger maintenance checklist M-14'] },
  { question: 'Best optimization opportunity today?', answer: 'Process optimization on Haas VF-2 #A1 can deliver the biggest gain: predicted 6.8% cycle-time reduction with no quality penalty.', actions: ['Apply profile OPT-VF2-06', 'Increase feed by 4%', 'Reduce idle retract motion'] },
  { question: 'Projected savings for this month?', answer: 'Projected monthly savings: $11,600 from downtime reduction, $3,200 from tool-life extension, and $1,750 from energy improvements.', actions: ['Export ROI summary', 'Share with finance', 'Enable weekly savings report'] },
  { question: 'Any anomaly trend we should watch?', answer: 'Yes. Vibration drift on Makino PS95 #A2 is upward for 3 consecutive hours. It is below critical but statistically significant.', actions: ['Set tighter vibration threshold', 'Schedule spindle balance check', 'Enable 10-min anomaly polling'] },
  { question: 'What is the fastest way to reduce unacknowledged alerts?', answer: 'Auto-route alerts by severity and machine ownership. 3 alerts are pending acknowledgment and can be closed within one shift.', actions: ['Route critical to maintenance lead', 'Auto-ack info alerts', 'Use 30-min escalation policy'] },
  { question: 'How healthy is the fleet overall?', answer: 'Fleet health is stable at 84/100. 6 machines running, 2 idle/offline, with 1 machine in elevated risk category.', actions: ['Maintain current load distribution', 'Prioritize CMX inspection', 'Restart DNM #D1 diagnostics'] },
  { question: 'What should we present to judges in 2 minutes?', answer: 'Show three points: realtime telemetry feed, predictive alert before failure, and ROI dashboard proving measurable impact. This demonstrates operational and financial value.', actions: ['Open Dashboard tab', 'Highlight critical alert workflow', 'Show monthly savings estimate'] },
  { question: 'Can we run in demo-only mode safely?', answer: 'Yes. Demo mode is active with stable synthetic data across machines, alerts, analytics, digital twin, and copilot answers. No external dependencies required.', actions: ['Keep demo mode enabled', 'Use preset Q&A only', 'Avoid live API calls during presentation'] },
];

// ═══════════════════════════════════════════════════
// Main Dashboard App
// ═══════════════════════════════════════════════════
export default function DashboardPage() {
  const router = useRouter();
  const DEMO_MODE = true;
  const startsInWorkflowMode = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('workflow') === '1';
  const [activePage, setActivePage] = useState(startsInWorkflowMode ? WORKFLOW_SEQUENCE[0] : 'dashboard');
  const [fleet, setFleet] = useState<FleetData | null>(DEMO_FLEET);
  const [machines, setMachines] = useState<MachineData[]>(DEMO_MACHINES);
  const [alerts, setAlerts] = useState<AlertData[]>(DEMO_ALERTS);
  const [alertStats, setAlertStats] = useState<AlertStats | null>(DEMO_ALERT_STATS);
  const [oee, setOEE] = useState<OEEData[]>(DEMO_OEE);
  const [energy, setEnergy] = useState<EnergyData[]>(DEMO_ENERGY);
  const [liveData, setLiveData] = useState<LiveTelemetry[]>(DEMO_LIVE);
  const [copilotMessages, setCopilotMessages] = useState<CopilotMessage[]>([
    { role: 'assistant', text: 'Presentation Copilot is in demo mode. Choose one of the 10 preset judge questions below.' },
  ]);
  const [copilotInput, setCopilotInput] = useState('');
  const [twinState, setTwinState] = useState<TwinState | null>(DEMO_TWIN_STATES[DEMO_MACHINES[0].id]);
  const [workflowRunning, setWorkflowRunning] = useState(startsInWorkflowMode);
  const [workflowStep, setWorkflowStep] = useState(0);
  const [workflowLoop, setWorkflowLoop] = useState(startsInWorkflowMode ? 1 : 0);
  const [selectedMachineId, setSelectedMachineId] = useState(DEMO_MACHINES[0].id);

  const auth = getAuth();

  // Fetch data
  const fetchData = useCallback(async () => {
    if (DEMO_MODE) {
      setFleet(DEMO_FLEET);
      setMachines(DEMO_MACHINES);
      setAlerts(DEMO_ALERTS);
      setAlertStats(DEMO_ALERT_STATS);
      setOEE(DEMO_OEE);
      setEnergy(DEMO_ENERGY);
      setLiveData(DEMO_LIVE);
      return;
    }

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
      setFleet(DEMO_FLEET);
      setMachines(DEMO_MACHINES);
      setAlerts(DEMO_ALERTS);
      setAlertStats(DEMO_ALERT_STATS);
      setOEE(DEMO_OEE);
      setEnergy(DEMO_ENERGY);
      setLiveData(DEMO_LIVE);
    }
  }, [DEMO_MODE]);

  useEffect(() => {
    // No authentication required - allow guest access
    queueMicrotask(() => {
      void fetchData();
    });
    const interval = setInterval(fetchData, 30000);

    // WebSocket
    const ws = connectWebSocket((msg) => {
      if (DEMO_MODE) {
        return;
      }
      if (msg.channel === 'telemetry:new') {
        setLiveData(prev => [...prev.slice(-50), msg.data as LiveTelemetry]);
      }
      if (msg.channel === 'alert:triggered') {
        setAlerts(prev => [msg.data as AlertData, ...prev.slice(0, 49)]);
      }
    });

    return () => { clearInterval(interval); ws?.close(); };
  }, [DEMO_MODE, auth.isAuthenticated, fetchData]);

  const handleLogout = () => { clearAuth(); window.location.href = '/'; };
  const handleBack = () => {
    if (window.history.length > 1) {
      router.back();
      return;
    }
    router.push('/');
  };

  const handlePresetQuestion = (preset: CopilotPreset) => {
    setCopilotMessages(prev => [
      ...prev,
      { role: 'user', text: preset.question },
      { role: 'assistant', text: preset.answer, actions: preset.actions },
    ]);
  };

  const loadTwin = useCallback(async (machineId: string) => {
    if (DEMO_MODE) {
      setTwinState(DEMO_TWIN_STATES[machineId] || null);
      return;
    }

    const res = await api.getDigitalTwin(machineId);
    if (res.ok) {
      setTwinState(await res.json());
    } else {
      setTwinState(DEMO_TWIN_STATES[machineId] || null);
    }
  }, [DEMO_MODE]);

  const stopWorkflowAndNavigate = useCallback((page: string) => {
    setWorkflowRunning(false);
    setActivePage(page);
    setWorkflowLoop((prev) => prev + 1);
  }, []);

  const openMachineTwin = useCallback((machineId?: string) => {
    if (!machineId) {
      return;
    }
    setSelectedMachineId(machineId);
    stopWorkflowAndNavigate('twin');
    void loadTwin(machineId);
  }, [loadTwin, stopWorkflowAndNavigate]);

  const getMachineIdByName = useCallback((machineName: string) => {
    return machines.find((m) => m.name === machineName)?.id;
  }, [machines]);

  useEffect(() => {
    if (!workflowRunning) {
      return undefined;
    }

    const timer = window.setTimeout(() => {
      setWorkflowStep((prev) => {
        const nextStep = prev + 1;

        if (nextStep >= WORKFLOW_SEQUENCE.length) {
          setWorkflowRunning(false);
          setActivePage('dashboard');
          setWorkflowLoop((loop) => loop + 1);
          return 0;
        }

        const nextPage = WORKFLOW_SEQUENCE[nextStep];
        setActivePage(nextPage);
        if (nextPage === 'twin') {
          void loadTwin(selectedMachineId);
        }
        setWorkflowLoop((loop) => loop + 1);
        return nextStep;
      });
    }, 2600);

    return () => window.clearTimeout(timer);
  }, [loadTwin, selectedMachineId, workflowRunning, workflowStep]);

  const startWorkflow = () => {
    setWorkflowStep(0);
    setWorkflowRunning(true);
    setActivePage(WORKFLOW_SEQUENCE[0]);
    setWorkflowLoop((prev) => prev + 1);
  };

  // ═══════ RENDER ═══════
  const renderSection = (title: string) => <div className="nav-section">{title}</div>;

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
          {navItems.map((item, index) => {
            const previousSection = index > 0 ? navItems[index - 1].section : null;
            const showSection = item.section !== previousSection;
            return (
              <div key={item.id}>
                {showSection && renderSection(item.section)}
                <div className={`nav-link ${activePage === item.id ? 'active' : ''}`} onClick={() => stopWorkflowAndNavigate(item.id)}>
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
          <div className="topbar-actions" style={{ gap: '0.55rem' }}>
            <button className="btn btn-secondary" onClick={handleBack}>
              <Icon d={icons.back} /> Back
            </button>
            <h2 className="topbar-title">{navItems.find(n => n.id === activePage)?.label || 'Dashboard'}</h2>
          </div>
          <div className="topbar-actions">
            <button className="btn btn-primary workflow-run-btn" onClick={startWorkflow}>
              <Icon d={icons.zap} />
              {workflowRunning ? 'Workflow Running' : 'Run Workflow'}
            </button>
            {workflowRunning && (
              <span className="badge badge-blue workflow-stage-badge">
                Stage {Math.min(workflowStep + 1, WORKFLOW_SEQUENCE.length)} / {WORKFLOW_SEQUENCE.length}
              </span>
            )}
            <span className="badge badge-green">LIVE</span>
            <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>{auth.user?.email}</span>
          </div>
        </header>

        {workflowRunning && (
          <div className="workflow-progress-wrap" role="status" aria-live="polite">
            <div className="workflow-progress-label">
              Judge Demo Workflow: {navItems.find((n) => n.id === activePage)?.label || 'Dashboard'}
            </div>
            <div className="workflow-progress-track">
              <div
                className="workflow-progress-fill"
                style={{ width: `${((Math.min(workflowStep + 1, WORKFLOW_SEQUENCE.length)) / WORKFLOW_SEQUENCE.length) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div key={`${activePage}-${workflowLoop}`} className="page-content page-transition">
          <div className="section-guide-card">
            <div className="section-guide-icon"><Icon d={(SECTION_GUIDE[activePage] || SECTION_GUIDE.dashboard).icon} /></div>
            <div>
              <p className="section-guide-title">{(SECTION_GUIDE[activePage] || SECTION_GUIDE.dashboard).title}</p>
              <p className="section-guide-caption">{(SECTION_GUIDE[activePage] || SECTION_GUIDE.dashboard).caption}</p>
            </div>
          </div>

          {/* ═══ Dashboard ═══ */}
          {activePage === 'dashboard' && (
            <>
              <div className="stats-grid">
                <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('machines')}><div className="stat-label">Total Machines</div><div className="stat-value">{fleet?.total_machines || 0}</div><div className="stat-change up">↑ {fleet?.running_count || 0} running</div></button>
                <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Fleet Utilization</div><div className="stat-value">{fleet?.fleet_utilization || 0}%</div></button>
                <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('alerts')}><div className="stat-label">Active Alerts</div><div className="stat-value" style={{ WebkitTextFillColor: (fleet?.active_alerts || 0) > 0 ? '#ef4444' : undefined }}>{fleet?.active_alerts || 0}</div></button>
                <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Energy (24h)</div><div className="stat-value">{fleet?.total_energy_kwh || 0} kWh</div></button>
              </div>

              <div className="grid-2">
                <div className="card">
                  <div className="card-header"><span className="card-title">Machine Status</span></div>
                  <div className="table-container">
                    <table>
                      <thead><tr><th>Machine</th><th>Status</th><th>Protocol</th></tr></thead>
                      <tbody>
                        {machines.map(m => (
                          <tr key={m.id} className="clickable-row" onClick={() => openMachineTwin(m.id)}><td><span className={`status-dot ${m.status}`} />{m.name}</td><td><span className={`badge badge-${m.status === 'running' ? 'green' : m.status === 'idle' ? 'yellow' : 'red'}`}>{m.status}</span></td><td>{m.protocol}</td></tr>
                        ))}
                        {machines.length === 0 && <tr><td colSpan={3} style={{ color: '#64748b', textAlign: 'center' }}>No machines. Start the API server to see demo data.</td></tr>}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card">
                  <div className="card-header"><span className="card-title">Recent Alerts</span></div>
                  {alerts.slice(0, 8).map((a, i) => (
                    <button type="button" key={i} className="clickable-inline" style={{ padding: '0.5rem 0', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }} onClick={() => stopWorkflowAndNavigate('alerts')}>
                      <span className={`badge badge-${a.severity === 'critical' ? 'red' : a.severity === 'warning' ? 'yellow' : 'blue'}`}>{a.severity}</span>
                      <span style={{ fontSize: '0.85rem' }}>{a.title}</span>
                    </button>
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
                          <tr key={i} className="clickable-row" onClick={() => openMachineTwin(getMachineIdByName(d.machine_name))}><td>{d.machine_name}</td><td>{d.spindle_speed?.toFixed(0)}</td><td>{d.temperature?.toFixed(1)}</td><td>{d.vibration?.toFixed(3)}</td><td>{d.load_percent?.toFixed(1)}</td></tr>
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
                      <tr key={m.id} className="clickable-row" onClick={() => openMachineTwin(m.id)}>
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
                      <tr key={i} className="clickable-row" onClick={() => openMachineTwin(getMachineIdByName(o.machine_name))}><td>{o.machine_name}</td><td>{o.availability}%</td><td>{o.performance}%</td><td>{o.quality}%</td><td><strong style={{ color: o.oee > 70 ? '#34d399' : o.oee > 50 ? '#fbbf24' : '#ef4444' }}>{o.oee}%</strong></td></tr>
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
                      <tr key={i} className="clickable-row" onClick={() => openMachineTwin(getMachineIdByName(e.machine_name))}><td>{e.machine_name}</td><td>{e.total_kwh}</td><td>{e.avg_power_w}</td><td>{e.peak_power_w}</td><td>${e.cost_estimate}</td><td>{e.efficiency_score}%</td></tr>
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
                      <tr key={i} className="clickable-row" onClick={() => openMachineTwin(a.machine_id)}>
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
              <div className="card" style={{ margin: '0 1rem 1rem' }}>
                <div className="card-header"><span className="card-title">Judge Demo Questions (Preset)</span></div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {COPILOT_PRESET_QNA.map((item, idx) => (
                    <button
                      key={idx}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.78rem', padding: '0.4rem 0.65rem' }}
                      onClick={() => handlePresetQuestion(item)}
                    >
                      Q{idx + 1}: {item.question}
                    </button>
                  ))}
                </div>
              </div>

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
                <input
                  className="form-input"
                  placeholder="Preset Q&A mode enabled for judges presentation"
                  value={copilotInput}
                  onChange={e => setCopilotInput(e.target.value)}
                  readOnly
                />
                <button className="btn btn-primary" disabled>Preset Only</button>
              </div>
            </div>
          )}

          {/* ═══ Digital Twin ═══ */}
          {activePage === 'twin' && (
            <>
              <div style={{ marginBottom: '1rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                {machines.map(m => (
                  <button key={m.id} className="btn btn-secondary" onClick={() => { setSelectedMachineId(m.id); void loadTwin(m.id); }}>{m.name}</button>
                ))}
              </div>
              {twinState ? (
                <div className="grid-3">
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('machines')}><div className="stat-label">Machine</div><div className="stat-value" style={{ fontSize: '1.2rem' }}>{twinState.machine_name}</div><div className="stat-change">{twinState.status}</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('alerts')}><div className="stat-label">Health Score</div><div className="stat-value" style={{ WebkitTextFillColor: twinState.health_score > 80 ? '#34d399' : twinState.health_score > 50 ? '#fbbf24' : '#ef4444' }}>{twinState.health_score}%</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Spindle RPM</div><div className="stat-value">{twinState.spindle_speed_rpm?.toFixed(0)}</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Temperature</div><div className="stat-value">{twinState.spindle_temperature_c?.toFixed(1)}°C</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Vibration</div><div className="stat-value">{twinState.vibration_mm_s?.toFixed(3)}</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('alerts')}><div className="stat-label">Tool Wear</div><div className="stat-value">{twinState.tool_wear_percent?.toFixed(1)}%</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Power</div><div className="stat-value">{twinState.power_consumption_w?.toFixed(0)}W</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('analytics')}><div className="stat-label">Coolant Flow</div><div className="stat-value">{twinState.coolant_flow_lpm?.toFixed(1)} L/m</div></button>
                  <button type="button" className="stat-card clickable-tile" onClick={() => stopWorkflowAndNavigate('alerts')}><div className="stat-label">Tool Life</div><div className="stat-value">{twinState.tool_life_remaining_min?.toFixed(0)} min</div></button>
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
                    <button
                      type="button"
                      key={`${section}-${m}-${p}`}
                      className="api-endpoint"
                      onClick={() => {
                        stopWorkflowAndNavigate('copilot');
                        setCopilotMessages((prev) => [
                          ...prev,
                          { role: 'assistant', text: `Selected endpoint: ${m} ${p}. ${d}` },
                        ]);
                      }}
                    >
                      <span className={`api-method ${m.toLowerCase()}`}>{m}</span>
                      <span className="api-path">{p}</span>
                      <span className="api-desc">{d}</span>
                    </button>
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
