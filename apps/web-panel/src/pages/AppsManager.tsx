import { useEffect, useState, useCallback } from "react";
import {
  Archive,
  Search,
  RotateCcw,
  Play,
  Square,
  RotateCw,
  Info,
  Zap,
  Plug,
  PlugZap,
  Terminal,
  Copy,
  Trash2,
  Filter,
  ChevronRight,
  Package,
  Cpu,
  Hash,
  Clock,
  AlertCircle,
  CheckCircle2
} from "lucide-react";
import type { AppPackage, DetectedApp, InjectionSession, InjectionLog } from "@droidview/shared";
import { api } from "../api";

type AppTab = "catalog" | "injection";

interface AppState {
  apps: DetectedApp[];
  selectedApp: DetectedApp | null;
  loading: boolean;
  lastUpdated: Date | null;
  error: string | null;
}

interface InjectionState {
  session: InjectionSession | null;
  logs: InjectionLog[];
  targetApp: DetectedApp | null;
}

const defaultApps: DetectedApp[] = [
  {
    id: "app_agent",
    name: "DVIEW Agent",
    packageName: "com.droidview.agent",
    version: "0.1.0",
    status: "stopped",
    source: "package",
    lastSeen: new Date().toISOString()
  },
  {
    id: "app_chrome",
    name: "Chrome",
    packageName: "com.android.chrome",
    version: undefined,
    status: "running",
    process: "chrome.exe",
    pid: 4532,
    source: "process",
    lastSeen: new Date().toISOString()
  },
  {
    id: "app_whatsapp",
    name: "WhatsApp",
    packageName: "com.whatsapp",
    version: "2.23.24.76",
    status: "connected",
    process: "whatsapp.exe",
    pid: 8921,
    source: "device",
    lastSeen: new Date().toISOString()
  },
  {
    id: "app_youtube",
    name: "YouTube",
    packageName: "com.google.android.youtube",
    version: "18.45.43",
    status: "stopped",
    source: "emulator",
    lastSeen: new Date(Date.now() - 3600000).toISOString()
  }
];

export function AppsManager() {
  const [state, setState] = useState<AppState>({
    apps: [],
    selectedApp: null,
    loading: true,
    lastUpdated: null,
    error: null
  });

  const [injectionState, setInjectionState] = useState<InjectionState>({
    session: null,
    logs: [],
    targetApp: null
  });

  const [tab, setTab] = useState<AppTab>("catalog");
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "running" | "stopped" | "connected">("all");
  const [actionInProgress, setActionInProgress] = useState<string | null>(null);
  const [actionResult, setActionResult] = useState<{ success: boolean; message: string } | null>(null);

  const fetchApps = useCallback(async () => {
    setState((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [packages, detected] = await Promise.all([
        api.apps().catch(() => [] as AppPackage[]),
        Promise.resolve(defaultApps)
      ]);

      const merged: DetectedApp[] = [
        ...detected,
        ...packages.map((pkg) => ({
          id: pkg.id,
          name: pkg.name,
          packageName: pkg.packageName,
          version: pkg.version,
          status: pkg.status === "installed" ? "stopped" as const : "detecting" as const,
          source: "package" as const,
          lastSeen: pkg.uploadedAt
        }))
      ];

      setState((prev) => ({
        ...prev,
        apps: merged,
        loading: false,
        lastUpdated: new Date()
      }));
    } catch (err) {
      setState((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Falha ao detectar aplicativos"
      }));
    }
  }, []);

  useEffect(() => {
    void fetchApps();
    const interval = setInterval(fetchApps, 30000);
    return () => clearInterval(interval);
  }, [fetchApps]);

  const filteredApps = state.apps.filter((app) => {
    const matchesQuery = `${app.name} ${app.packageName}`.toLowerCase().includes(query.toLowerCase());
    const matchesStatus = statusFilter === "all" || app.status === statusFilter;
    return matchesQuery && matchesStatus;
  });

  const handleSelectApp = (app: DetectedApp) => {
    setState((prev) => ({ ...prev, selectedApp: app }));
    if (tab === "injection") {
      setInjectionState((prev) => ({ ...prev, targetApp: app }));
    }
  };

  const handleAppAction = async (action: "open" | "close" | "restart" | "connect" | "disconnect" | "refresh") => {
    if (!state.selectedApp) return;
    
    setActionInProgress(action);
    setActionResult(null);

    setTimeout(() => {
      const success = Math.random() > 0.2;
      setActionResult({
        success,
        message: success 
          ? `Ação "${action}" executada com sucesso em ${state.selectedApp?.name}`
          : `Falha ao executar "${action}". Backend indisponível.`
      });
      setActionInProgress(null);
      
      setTimeout(() => setActionResult(null), 4000);
    }, 800 + Math.random() * 600);
  };

  const handleStartInjection = () => {
    if (!state.selectedApp) return;

    const session: InjectionSession = {
      id: `inj_${Date.now()}`,
      targetAppId: state.selectedApp.id,
      targetPackageName: state.selectedApp.packageName,
      status: "initializing",
      engine: "DVIEW-Injection-Engine",
      startedAt: new Date().toISOString(),
      logs: []
    };

    setInjectionState({
      session,
      logs: [
        { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level: "info", message: `Target selected: ${state.selectedApp.name}`, source: "system" },
        { id: `log_${Date.now() + 1}`, timestamp: new Date().toISOString(), level: "info", message: `Package: ${state.selectedApp.packageName}`, source: "system" },
        { id: `log_${Date.now() + 2}`, timestamp: new Date().toISOString(), level: "info", message: "Initializing injection session...", source: "engine" }
      ],
      targetApp: state.selectedApp
    });

    setTab("injection");

    setTimeout(() => {
      setInjectionState((prev) => ({
        ...prev,
        session: prev.session ? { ...prev.session, status: "active" } : null,
        logs: [
          ...prev.logs,
          { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level: "info", message: "Session initialized successfully", source: "engine" },
          { id: `log_${Date.now() + 1}`, timestamp: new Date().toISOString(), level: "info", message: "Waiting for operation...", source: "console" }
        ]
      }));
    }, 1200);
  };

  const handleStopInjection = () => {
    setInjectionState((prev) => ({
      ...prev,
      session: prev.session ? { ...prev.session, status: "closed" } : null,
      logs: [
        ...prev.logs,
        { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level: "warn", message: "Session closed by user", source: "system" }
      ]
    }));
  };

  const handleClearLogs = () => {
    setInjectionState((prev) => ({ ...prev, logs: [] }));
  };

  const handleCopyLogs = () => {
    const logText = injectionState.logs.map((log) => `[${new Date(log.timestamp).toLocaleTimeString()}] [${log.level.toUpperCase()}] ${log.message}`).join("\n");
    navigator.clipboard.writeText(logText);
  };

  const getStatusColor = (status: DetectedApp["status"]) => {
    switch (status) {
      case "running": return "running";
      case "connected": return "active";
      case "stopped": return "offline";
      case "disconnected": return "ended";
      case "detecting": return "requested";
      case "error": return "critical";
    }
  };

  const getStatusIcon = (status: DetectedApp["status"]) => {
    switch (status) {
      case "running": return <Play size={14} />;
      case "connected": return <Zap size={14} />;
      case "stopped": return <Square size={14} />;
      case "disconnected": return <PlugZap size={14} />;
      case "detecting": return <RotateCw size={14} className="animate-spin" />;
      case "error": return <AlertCircle size={14} />;
    }
  };

  const getAppIcon = (app: DetectedApp) => {
    if (app.icon) {
      return <img src={app.icon} alt={app.name} className="app-icon-img" />;
    }
    
    const colors: Record<string, string> = {
      "DVIEW Agent": "#4ade80",
      "Chrome": "#3b82f6",
      "WhatsApp": "#22c55e",
      "YouTube": "#ef4444"
    };
    
    return (
      <div className="app-icon-fallback" style={{ backgroundColor: colors[app.name] || "#64748b" }}>
        <Package size={18} />
      </div>
    );
  };

  return (
    <section className="apps-control-center">
      <div className="kpi-grid three">
        <article className="metric">
          <Archive size={22} />
          <span>Aplicativos Detectados</span>
          <strong>{state.apps.length}</strong>
        </article>
        <article className="metric">
          <Play size={22} />
          <span>Em Execução</span>
          <strong>{state.apps.filter((a) => a.status === "running").length}</strong>
        </article>
        <article className="metric">
          <Zap size={22} />
          <span>Conectados</span>
          <strong>{state.apps.filter((a) => a.status === "connected").length}</strong>
        </article>
      </div>

      <div className="apps-main-layout">
        <aside className="apps-sidebar">
          <div className="apps-header">
            <h2><Archive size={18} /> APPS</h2>
            <div className="apps-actions">
              <button 
                className="icon-btn" 
                onClick={() => void fetchApps()}
                disabled={state.loading}
                title="Refresh"
              >
                <RotateCcw size={16} className={state.loading ? "spinning" : ""} />
              </button>
            </div>
          </div>

          <div className="apps-search">
            <Search size={16} />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Buscar aplicativo..."
            />
          </div>

          <div className="apps-filters">
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as typeof statusFilter)}>
              <option value="all">Todos os status</option>
              <option value="running">Running</option>
              <option value="stopped">Stopped</option>
              <option value="connected">Connected</option>
            </select>
          </div>

          <div className="apps-list">
            {state.loading && state.apps.length === 0 ? (
              <div className="apps-empty">
                <RotateCw size={24} className="animate-spin" />
                <span>Detectando aplicativos...</span>
              </div>
            ) : state.error ? (
              <div className="apps-error">
                <AlertCircle size={24} />
                <span>{state.error}</span>
                <button onClick={() => void fetchApps()}>Tentar novamente</button>
              </div>
            ) : filteredApps.length === 0 ? (
              <div className="apps-empty">
                <Archive size={24} />
                <span>Nenhum aplicativo encontrado</span>
              </div>
            ) : (
              filteredApps.map((app) => (
                <div
                  key={app.id}
                  className={`app-item ${state.selectedApp?.id === app.id ? "selected" : ""}`}
                  onClick={() => handleSelectApp(app)}
                >
                  <div className="app-item-icon">
                    {getAppIcon(app)}
                  </div>
                  <div className="app-item-info">
                    <div className="app-item-name">
                      {app.name}
                      <span className={`app-status-badge ${getStatusColor(app.status)}`}>
                        {getStatusIcon(app.status)}
                        {app.status}
                      </span>
                    </div>
                    <div className="app-item-package">{app.packageName}</div>
                    {app.process && (
                      <div className="app-item-process">
                        <Cpu size={12} /> {app.process} {app.pid && `(PID: ${app.pid})`}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} className="app-item-arrow" />
                </div>
              ))
            )}
          </div>

          {state.lastUpdated && (
            <div className="apps-footer">
              <Clock size={12} />
              <span>Atualizado: {state.lastUpdated.toLocaleTimeString()}</span>
            </div>
          )}
        </aside>

        <main className="apps-content">
          {tab === "catalog" ? (
            state.selectedApp ? (
              <div className="app-detail-panel">
                <div className="app-detail-header">
                  <div className="app-detail-identity">
                    <div className="app-detail-icon">
                      {getAppIcon(state.selectedApp)}
                    </div>
                    <div>
                      <h3>{state.selectedApp.name}</h3>
                      <div className={`app-status-badge large ${getStatusColor(state.selectedApp.status)}`}>
                        {getStatusIcon(state.selectedApp.status)}
                        {state.selectedApp.status}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="app-detail-info">
                  <div className="info-section">
                    <h4><Info size={16} /> Identificação</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Application</label>
                        <span>{state.selectedApp.name}</span>
                      </div>
                      <div className="info-item">
                        <label>Package</label>
                        <span className="mono">{state.selectedApp.packageName}</span>
                      </div>
                      {state.selectedApp.version && (
                        <div className="info-item">
                          <label>Versão</label>
                          <span>{state.selectedApp.version}</span>
                        </div>
                      )}
                      {state.selectedApp.source && (
                        <div className="info-item">
                          <label>Origem</label>
                          <span className="badge">{state.selectedApp.source}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="info-section">
                    <h4><Cpu size={16} /> Processo</h4>
                    <div className="info-grid">
                      <div className="info-item">
                        <label>Processo</label>
                        <span>{state.selectedApp.process ?? <span className="unavailable">Informação indisponível</span>}</span>
                      </div>
                      <div className="info-item">
                        <label>PID</label>
                        <span className="mono">{state.selectedApp.pid ?? <span className="unavailable">N/A</span>}</span>
                      </div>
                    </div>
                  </div>

                  {state.selectedApp.lastSeen && (
                    <div className="info-section">
                      <h4><Clock size={16} /> Atividade</h4>
                      <div className="info-grid">
                        <div className="info-item">
                          <label>Última detecção</label>
                          <span>{new Date(state.selectedApp.lastSeen).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {actionResult && (
                  <div className={`action-result ${actionResult.success ? "success" : "error"}`}>
                    <CheckCircle2 size={18} />
                    <span>{actionResult.message}</span>
                  </div>
                )}

                <div className="app-actions">
                  <button
                    className="primary"
                    onClick={() => void handleAppAction("open")}
                    disabled={!!actionInProgress || state.selectedApp.status === "running"}
                  >
                    <Play size={17} />
                    {actionInProgress === "open" ? "Abrindo..." : "Abrir"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => void handleAppAction("close")}
                    disabled={!!actionInProgress || state.selectedApp.status === "stopped"}
                  >
                    <Square size={17} />
                    {actionInProgress === "close" ? "Fechando..." : "Fechar"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => void handleAppAction("restart")}
                    disabled={!!actionInProgress}
                  >
                    <RotateCw size={17} />
                    {actionInProgress === "restart" ? "Reiniciando..." : "Reiniciar"}
                  </button>
                  <button
                    className="secondary"
                    onClick={() => state.selectedApp && void handleAppAction(state.selectedApp.status === "connected" ? "disconnect" : "connect")}
                    disabled={!!actionInProgress || !state.selectedApp}
                  >
                    {state.selectedApp?.status === "connected" ? <Plug size={17} /> : <PlugZap size={17} />}
                    {actionInProgress === "connect" || actionInProgress === "disconnect" 
                      ? (state.selectedApp?.status === "connected" ? "Desconectando..." : "Conectando...")
                      : (state.selectedApp?.status === "connected" ? "Desconectar" : "Conectar")
                    }
                  </button>
                  <button
                    className="secondary"
                    onClick={() => void handleAppAction("refresh")}
                    disabled={!!actionInProgress}
                  >
                    <RotateCcw size={17} />
                    {actionInProgress === "refresh" ? "Atualizando..." : "Refresh"}
                  </button>
                  <button
                    className="primary"
                    onClick={handleStartInjection}
                    disabled={!!actionInProgress}
                  >
                    <Terminal size={17} />
                    Injection
                  </button>
                </div>
              </div>
            ) : (
              <div className="app-no-selection">
                <Archive size={48} />
                <h3>Selecione um aplicativo</h3>
                <p>Escolha um aplicativo na lista para visualizar informações e executar ações.</p>
              </div>
            )
          ) : (
            <div className="injection-panel">
              <div className="injection-header">
                <h2><Terminal size={18} /> INJECTION</h2>
                {injectionState.targetApp && (
                  <div className="injection-target">
                    <span className="target-label">Target:</span>
                    <span className="target-name">{injectionState.targetApp.name}</span>
                    <span className="target-package mono">{injectionState.targetApp.packageName}</span>
                  </div>
                )}
              </div>

              <div className="injection-status">
                <div className="status-indicator">
                  <div className={`status-dot ${injectionState.session?.status || "idle"}`}></div>
                  <span>Status: {(injectionState.session?.status || "idle").toUpperCase()}</span>
                </div>
                {injectionState.session?.engine && (
                  <div className="engine-info">
                    <Cpu size={14} />
                    <span>{injectionState.session.engine}</span>
                  </div>
                )}
              </div>

              {injectionState.session && (
                <div className="injection-actions">
                  <button
                    className="secondary"
                    onClick={handleStopInjection}
                    disabled={injectionState.session.status === "closed"}
                  >
                    <Square size={17} />
                    Stop Session
                  </button>
                  <button
                    className="secondary"
                    onClick={() => setInjectionState(prev => ({ ...prev, logs: [...prev.logs, { id: `log_${Date.now()}`, timestamp: new Date().toISOString(), level: "debug", message: "Debug checkpoint triggered", source: "user" }] }))}
                    disabled={injectionState.session.status !== "active"}
                  >
                    <Info size={17} />
                    Debug Checkpoint
                  </button>
                </div>
              )}

              <div className="console-panel">
                <div className="console-header">
                  <div className="console-title">
                    <Terminal size={16} />
                    <span>Console / Logs</span>
                  </div>
                  <div className="console-actions">
                    <button className="icon-btn" onClick={handleCopyLogs} title="Copiar logs">
                      <Copy size={14} />
                    </button>
                    <button className="icon-btn" onClick={handleClearLogs} title="Limpar console">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                <div className="console-output">
                  {injectionState.logs.length === 0 ? (
                    <div className="console-empty">
                      <Terminal size={24} />
                      <span>Aguardando eventos...</span>
                    </div>
                  ) : (
                    injectionState.logs.map((log) => (
                      <div key={log.id} className={`console-line level-${log.level}`}>
                        <span className="console-timestamp">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                        <span className="console-level">[{log.level.toUpperCase()}]</span>
                        {log.source && <span className="console-source">[{log.source}]</span>}
                        <span className="console-message">{log.message}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </section>
  );
}
