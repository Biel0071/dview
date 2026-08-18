import { useEffect, useState } from "react";
import {
  Archive,
  CheckCircle2,
  Download,
  Eye,
  ListChecks,
  Play,
  Plus,
  RotateCcw,
  Save,
  Search,
  Settings,
  Trash2,
  UploadCloud
} from "lucide-react";
import type { AppPackage } from "@droidview/shared";
import { api } from "../api";

interface InstallStep {
  id: string;
  title: string;
  screen: string;
  instruction: string;
  target: string;
  delayMs: number;
  x: number;
  y: number;
  required: boolean;
}

interface ManagedAppConfig {
  displayName: string;
  packageName: string;
  webUrl: string;
  channel: string;
  consentMode: "guided" | "manual";
  installSteps: InstallStep[];
}

const defaultSteps: InstallStep[] = [
  {
    id: "open-apk",
    title: "Abrir instalador APK",
    screen: "Android Package Installer",
    instruction: "Toque em instalar e aguarde a conclusao.",
    target: "Botao Instalar",
    delayMs: 800,
    x: 72,
    y: 78,
    required: true
  },
  {
    id: "open-agent",
    title: "Abrir DVIEW Agent",
    screen: "DVIEW Agent",
    instruction: "Abra o app instalado e confira servidor, aparelho e pareamento.",
    target: "Tela inicial",
    delayMs: 500,
    x: 50,
    y: 18,
    required: true
  },
  {
    id: "accept-consent",
    title: "Marcar aceite",
    screen: "DVIEW Agent",
    instruction: "Marque a caixa de aceite para permitir apenas sessoes visiveis e consentidas.",
    target: "Checkbox de aceite",
    delayMs: 400,
    x: 13,
    y: 40,
    required: true
  },
  {
    id: "activate-agent",
    title: "Ativar agente visivel",
    screen: "DVIEW Agent",
    instruction: "Toque em Ativar agente visivel para iniciar a notificacao persistente.",
    target: "Botao ativar",
    delayMs: 700,
    x: 50,
    y: 48,
    required: true
  },
  {
    id: "device-admin",
    title: "Permissao Device Admin",
    screen: "Android Device Admin",
    instruction: "Revise a tela oficial do Android e toque em ativar se concordar.",
    target: "Botao ativar admin",
    delayMs: 1200,
    x: 65,
    y: 86,
    required: false
  },
  {
    id: "screen-consent",
    title: "Compartilhamento de tela",
    screen: "MediaProjection",
    instruction: "Quando precisar de sessao remota, aceite o dialogo nativo de captura de tela.",
    target: "Botao iniciar agora",
    delayMs: 1000,
    x: 70,
    y: 82,
    required: false
  }
];

const defaultManagedConfig: ManagedAppConfig = {
  displayName: "DVIEW WebApp",
  packageName: "com.droidview.agent",
  webUrl: "https://example.com",
  channel: "stable",
  consentMode: "guided",
  installSteps: defaultSteps
};

function loadManagedConfig(): ManagedAppConfig {
  const raw = localStorage.getItem("droidview.apps.manager.config");
  if (!raw) return defaultManagedConfig;
  try {
    const parsed = JSON.parse(raw) as Partial<ManagedAppConfig>;
    return {
      ...defaultManagedConfig,
      ...parsed,
      installSteps: parsed.installSteps?.length ? parsed.installSteps : defaultSteps
    };
  } catch {
    return defaultManagedConfig;
  }
}

export function AppsManager() {
  const [apps, setApps] = useState<AppPackage[]>([]);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("stable");
  const [tab, setTab] = useState<"catalog" | "builder" | "config" | "logs">("catalog");
  const [config, setConfig] = useState<ManagedAppConfig>(loadManagedConfig);
  const [selectedStepId, setSelectedStepId] = useState(config.installSteps[0]?.id ?? "");
  const [playingIndex, setPlayingIndex] = useState(0);
  const [adminLogs, setAdminLogs] = useState<string[]>(() => {
    const raw = localStorage.getItem("droidview.apps.manager.logs");
    return raw ? JSON.parse(raw) : ["Apps Manager inicializado."];
  });

  useEffect(() => {
    void api.apps().then(setApps);
  }, []);

  const selectedStep = config.installSteps.find((step) => step.id === selectedStepId) ?? config.installSteps[0];
  const previewStep = config.installSteps[playingIndex] ?? selectedStep;

  const filtered = apps.filter((app) => `${app.name} ${app.packageName} ${app.version}`.toLowerCase().includes(query.toLowerCase()));
  const installed = apps.filter((app) => app.status === "installed").length;
  const available = apps.filter((app) => app.status === "available").length;

  const log = (message: string) => {
    const next = [`${new Date().toLocaleTimeString()} - ${message}`, ...adminLogs].slice(0, 20);
    setAdminLogs(next);
    localStorage.setItem("droidview.apps.manager.logs", JSON.stringify(next));
  };

  const saveConfig = () => {
    localStorage.setItem("droidview.apps.manager.config", JSON.stringify(config));
    log("Configuracao do app e roteiro de instalacao salvos.");
  };

  const updateStep = (id: string, patch: Partial<InstallStep>) => {
    setConfig((current) => ({
      ...current,
      installSteps: current.installSteps.map((step) => (step.id === id ? { ...step, ...patch } : step))
    }));
  };

  const addStep = () => {
    const step: InstallStep = {
      id: `step-${Date.now()}`,
      title: "Novo passo",
      screen: "Android",
      instruction: "Descreva a acao que o usuario deve confirmar.",
      target: "Area de toque",
      delayMs: 600,
      x: 50,
      y: 50,
      required: false
    };
    setConfig((current) => ({ ...current, installSteps: [...current.installSteps, step] }));
    setSelectedStepId(step.id);
    log("Novo passo de instalacao criado.");
  };

  const removeStep = (id: string) => {
    const next = config.installSteps.filter((step) => step.id !== id);
    setConfig((current) => ({ ...current, installSteps: next.length ? next : defaultSteps }));
    setSelectedStepId(next[0]?.id ?? defaultSteps[0].id);
    log("Passo removido do roteiro.");
  };

  const playSimulation = () => {
    log("Simulacao de instalacao iniciada.");
    setPlayingIndex(0);
    config.installSteps.forEach((step, index) => {
      window.setTimeout(() => setPlayingIndex(index), config.installSteps.slice(0, index + 1).reduce((sum, item) => sum + item.delayMs, 0));
    });
  };

  const resetSteps = () => {
    setConfig((current) => ({ ...current, installSteps: defaultSteps }));
    setSelectedStepId(defaultSteps[0].id);
    log("Roteiro restaurado para padrao seguro.");
  };

  return (
    <section className="stack">
      <div className="kpi-grid three">
        <article className="metric">
          <CheckCircle2 size={22} />
          <span>Instalados</span>
          <strong>{installed}</strong>
        </article>
        <article className="metric">
          <Archive size={22} />
          <span>Disponiveis</span>
          <strong>{available}</strong>
        </article>
        <article className="metric">
          <Download size={22} />
          <span>Canal</span>
          <strong>{channel}</strong>
        </article>
      </div>

      <section className="panel">
        <div className="tabs">
          <button className={tab === "catalog" ? "active" : ""} onClick={() => setTab("catalog")}>
            <Archive size={17} /> Catalogo
          </button>
          <button className={tab === "builder" ? "active" : ""} onClick={() => setTab("builder")}>
            <Eye size={17} /> Preview e steps
          </button>
          <button className={tab === "config" ? "active" : ""} onClick={() => setTab("config")}>
            <Settings size={17} /> Config admin
          </button>
          <button className={tab === "logs" ? "active" : ""} onClick={() => setTab("logs")}>
            <ListChecks size={17} /> Logs
          </button>
        </div>
      </section>

      {tab === "catalog" ? (
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Apps corporativos</h2>
            <small>Catalogo do painel para distribuicao assistida e consentida.</small>
          </div>
          <button className="secondary">
            <UploadCloud size={17} /> Preparar upload
          </button>
        </div>
        <div className="filters">
          <label className="search-field">
            <Search size={17} />
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar app ou pacote" />
          </label>
          <label>
            Canal de distribuicao
            <select value={channel} onChange={(event) => setChannel(event.target.value)}>
              <option value="stable">stable</option>
              <option value="beta">beta</option>
              <option value="internal">internal</option>
            </select>
          </label>
        </div>
      <div className="table">
        {filtered.map((app) => (
          <div className="row app-row" key={app.id}>
            <span>
              <strong>{app.name}</strong>
              <small>Atualizado {new Date(app.uploadedAt).toLocaleDateString()}</small>
            </span>
            <span>{app.packageName}</span>
            <span>{app.version}</span>
            <span className="badge">{app.status}</span>
            <button className="secondary" disabled={app.status === "installing"}>Enviar para grupo</button>
          </div>
        ))}
        {!filtered.length ? <div className="empty-inline">Nenhum app encontrado.</div> : null}
      </div>
      </section>
      ) : null}

      {tab === "builder" ? (
        <section className="builder-admin-grid">
          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Preview do app criado</h2>
                <small>Simulador visual do fluxo assistido de instalacao.</small>
              </div>
              <div className="toolbar">
                <button className="secondary" onClick={playSimulation}>
                  <Play size={17} /> Simular
                </button>
                <button className="secondary" onClick={resetSteps}>
                  <RotateCcw size={17} /> Reset
                </button>
              </div>
            </div>
            <div className="install-preview">
              <div className="install-phone">
                <div className="phone-topbar">18:25 · Android</div>
                <h3>{config.displayName}</h3>
                <p>{previewStep?.screen}</p>
                <div className="mock-lines">
                  <span />
                  <span />
                  <span />
                </div>
                <button>Instalar / Autorizar</button>
                <button>Voltar</button>
                {previewStep ? (
                  <div
                    className="tap-target"
                    style={{ left: `${previewStep.x}%`, top: `${previewStep.y}%` }}
                    title={previewStep.target}
                  />
                ) : null}
              </div>
              <div className="step-callout">
                <strong>{previewStep?.title}</strong>
                <span>{previewStep?.instruction}</span>
                <small>Alvo: {previewStep?.target} · Delay: {previewStep?.delayMs}ms</small>
              </div>
            </div>
          </div>

          <div className="panel">
            <div className="panel-heading">
              <div>
                <h2>Editor de steps</h2>
                <small>Configure ordem, texto, alvo piscando e tempo.</small>
              </div>
              <button className="secondary" onClick={addStep}>
                <Plus size={17} /> Passo
              </button>
            </div>
            <div className="step-list">
              {config.installSteps.map((step, index) => (
                <button key={step.id} className={selectedStepId === step.id ? "active" : ""} onClick={() => setSelectedStepId(step.id)}>
                  <span>{index + 1}. {step.title}</span>
                  <small>{step.screen}</small>
                </button>
              ))}
            </div>
            {selectedStep ? (
              <div className="settings-grid">
                <label>
                  Titulo
                  <input value={selectedStep.title} onChange={(event) => updateStep(selectedStep.id, { title: event.target.value })} />
                </label>
                <label>
                  Tela
                  <input value={selectedStep.screen} onChange={(event) => updateStep(selectedStep.id, { screen: event.target.value })} />
                </label>
                <label>
                  Instrucao exibida
                  <input value={selectedStep.instruction} onChange={(event) => updateStep(selectedStep.id, { instruction: event.target.value })} />
                </label>
                <label>
                  Onde clicar
                  <input value={selectedStep.target} onChange={(event) => updateStep(selectedStep.id, { target: event.target.value })} />
                </label>
                <label>
                  Delay do passo
                  <input type="number" value={selectedStep.delayMs} onChange={(event) => updateStep(selectedStep.id, { delayMs: Number(event.target.value) })} />
                </label>
                <div className="range-grid">
                  <label>
                    X alvo
                    <input type="range" min="5" max="95" value={selectedStep.x} onChange={(event) => updateStep(selectedStep.id, { x: Number(event.target.value) })} />
                  </label>
                  <label>
                    Y alvo
                    <input type="range" min="5" max="95" value={selectedStep.y} onChange={(event) => updateStep(selectedStep.id, { y: Number(event.target.value) })} />
                  </label>
                </div>
                <label className="check">
                  <input type="checkbox" checked={selectedStep.required} onChange={(event) => updateStep(selectedStep.id, { required: event.target.checked })} />
                  Obrigatorio
                </label>
                <div className="toolbar">
                  <button className="primary" onClick={saveConfig}>
                    <Save size={17} /> Salvar roteiro
                  </button>
                  <button className="danger" onClick={() => removeStep(selectedStep.id)}>
                    <Trash2 size={17} /> Remover
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}

      {tab === "config" ? (
        <section className="panel settings-grid">
          <h2>Config admin do app</h2>
          <label>
            Nome exibido
            <input value={config.displayName} onChange={(event) => setConfig({ ...config, displayName: event.target.value })} />
          </label>
          <label>
            Package
            <input value={config.packageName} onChange={(event) => setConfig({ ...config, packageName: event.target.value })} />
          </label>
          <label>
            URL WebApp/PWA
            <input value={config.webUrl} onChange={(event) => setConfig({ ...config, webUrl: event.target.value })} />
          </label>
          <label>
            Modo de consentimento
            <select value={config.consentMode} onChange={(event) => setConfig({ ...config, consentMode: event.target.value as ManagedAppConfig["consentMode"] })}>
              <option value="guided">guided</option>
              <option value="manual">manual</option>
            </select>
          </label>
          <button className="primary" onClick={saveConfig}>
            <Save size={17} /> Salvar config
          </button>
          <div className="alert">Permissoes Android sensiveis podem ser abertas pelo guia, mas o toque final de autorizacao continua manual por seguranca do sistema.</div>
        </section>
      ) : null}

      {tab === "logs" ? (
        <section className="panel">
          <div className="panel-heading">
            <div>
              <h2>Logs do Apps Manager</h2>
              <small>Historico local de configuracao, simulacao e distribuicao.</small>
            </div>
            <button className="secondary" onClick={() => { setAdminLogs([]); localStorage.removeItem("droidview.apps.manager.logs"); }}>
              Limpar
            </button>
          </div>
          <div className="table">
            {adminLogs.map((entry) => (
              <div className="row log-manager-row" key={entry}>
                <span>{entry}</span>
              </div>
            ))}
          </div>
        </section>
      ) : null}
    </section>
  );
}
