import { useEffect, useState } from "react";
import {
  Activity,
  Boxes,
  CheckCircle2,
  ChevronRight,
  Globe,
  KeyRound,
  Languages,
  ListChecks,
  MonitorCog,
  MonitorSmartphone,
  Radio,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  Sliders,
  UserRound,
  Zap
} from "lucide-react";
import { languageNames, type Language } from "../i18n";
import { useAppStore } from "../store";
import { api } from "../api";
import { AppsManager } from "./AppsManager";
import { Logs } from "./Logs";
import { RemoteSession } from "./RemoteSession";
import { About } from "./About";

export type SettingsTab = "preferences" | "apps" | "logs" | "sessions" | "about";

interface SettingsPageProps {
  initialTab?: SettingsTab;
}

export function SettingsPage({ initialTab }: SettingsPageProps) {
  const { user, preferences, updatePreferences, setView } = useAppStore();
  const [activeTab, setActiveTab] = useState<SettingsTab>(initialTab || "preferences");
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; latency: number; time: string } | null>(null);

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab]);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleUpdate = (patch: Partial<typeof preferences>, msg?: string) => {
    updatePreferences(patch);
    showToast(msg || "Preferência atualizada e salva com sucesso.");
  };

  const handleTestHealth = async () => {
    setTestingHealth(true);
    setHealthStatus(null);
    const start = performance.now();
    try {
      const res = await fetch(`${api.baseUrl}/health`, { method: "GET" });
      const elapsed = Math.round(performance.now() - start);
      if (res.ok) {
        setHealthStatus({ ok: true, latency: elapsed, time: new Date().toLocaleTimeString() });
        showToast(`Servidor operacional: resposta em ${elapsed}ms.`);
      } else {
        setHealthStatus({ ok: false, latency: elapsed, time: new Date().toLocaleTimeString() });
        showToast("Servidor retornou status não-200.");
      }
    } catch {
      const elapsed = Math.round(performance.now() - start);
      setHealthStatus({ ok: false, latency: elapsed, time: new Date().toLocaleTimeString() });
      showToast("Não foi possível conectar ao backend.");
    } finally {
      setTestingHealth(false);
    }
  };

  return (
    <div className="admin-settings-container" style={{ width: "100%", maxWidth: "1280px", margin: "0 auto", paddingBottom: "24px" }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert" style={{ marginBottom: "12px" }}>
          <Zap size={14} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Admin Modular Tabs Navigation */}
      <div
        className="admin-settings-tabs-bar"
        style={{
          display: "flex",
          alignItems: "center",
          gap: "6px",
          padding: "6px 8px",
          background: "rgba(10, 14, 23, 0.8)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          marginBottom: "16px",
          overflowX: "auto"
        }}
      >
        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "preferences" ? "active" : ""}`}
          onClick={() => setActiveTab("preferences")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "preferences" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "preferences" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "preferences" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <Sliders size={14} style={{ color: activeTab === "preferences" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Preferências & Sistema</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "apps" ? "active" : ""}`}
          onClick={() => setActiveTab("apps")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "apps" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "apps" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "apps" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <Boxes size={14} style={{ color: activeTab === "apps" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Gerenciador de Apps</span>
          <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "rgba(255, 26, 42, 0.2)", color: "#ff4d5a", border: "1px solid rgba(255, 26, 42, 0.4)", fontWeight: 800 }}>ADMIN</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "logs" ? "active" : ""}`}
          onClick={() => setActiveTab("logs")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "logs" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "logs" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "logs" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <ListChecks size={14} style={{ color: activeTab === "logs" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Logs & Auditoria</span>
          <span style={{ fontSize: "9px", padding: "1px 5px", borderRadius: "4px", background: "rgba(255, 26, 42, 0.2)", color: "#ff4d5a", border: "1px solid rgba(255, 26, 42, 0.4)", fontWeight: 800 }}>ADMIN</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "sessions" ? "active" : ""}`}
          onClick={() => setActiveTab("sessions")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "sessions" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "sessions" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <MonitorSmartphone size={14} style={{ color: activeTab === "sessions" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Sessões Remotas Ativas</span>
        </button>

        <button
          type="button"
          className={`admin-tab-btn ${activeTab === "about" ? "active" : ""}`}
          onClick={() => setActiveTab("about")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "7px",
            padding: "8px 14px",
            borderRadius: "6px",
            border: "1px solid",
            borderColor: activeTab === "about" ? "var(--crimson-neon, #ff1a2a)" : "transparent",
            background: activeTab === "about" ? "rgba(255, 26, 42, 0.15)" : "transparent",
            color: activeTab === "about" ? "#ffffff" : "#94a3b8",
            fontSize: "12px",
            fontWeight: 700,
            cursor: "pointer",
            transition: "all 0.15s ease",
            whiteSpace: "nowrap"
          }}
        >
          <ShieldCheck size={14} style={{ color: activeTab === "about" ? "var(--crimson-neon, #ff1a2a)" : "#64748b" }} />
          <span>Sobre & Diagnóstico</span>
        </button>
      </div>

      {/* Tab 1: Preferências & Sistema */}
      {activeTab === "preferences" && (
        <section className="settings-layout" style={{ maxWidth: "1100px", margin: "0 auto" }}>
          {/* Idioma e Interface */}
          <article className="panel settings-grid">
            <div className="panel-heading">
              <div>
                <h2><Languages size={18} /> Idioma e Interface</h2>
                <small>Preferências de internacionalização e endpoint local.</small>
              </div>
              <span className="badge info"><Save size={14} /> auto-save</span>
            </div>
            <label>
              Idioma do Painel
              <select
                value={preferences.language}
                onChange={(event) =>
                  handleUpdate({ language: event.target.value as Language }, "Idioma do painel alterado.")
                }
              >
                {Object.entries(languageNames).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </label>
            <label>
              URL do Backend Fastify
              <input value={api.baseUrl} readOnly />
            </label>
            <div style={{ marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px" }}>
              <button
                type="button"
                className="secondary compact-btn"
                onClick={handleTestHealth}
                disabled={testingHealth}
                style={{ fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "6px" }}
              >
                <Radio size={13} style={{ color: "#38bdf8" }} />
                <span>{testingHealth ? "Testando link..." : "Testar Conexão com Servidor"}</span>
              </button>
              {healthStatus && (
                <span
                  className={`badge ${healthStatus.ok ? "online" : "offline"}`}
                  style={{ fontSize: "11px" }}
                >
                  {healthStatus.ok ? (
                    <>
                      <CheckCircle2 size={12} /> {healthStatus.latency}ms · Ativo ({healthStatus.time})
                    </>
                  ) : (
                    <>Falha de Conexão ({healthStatus.time})</>
                  )}
                </span>
              )}
            </div>
          </article>

          {/* Perfil do Operador */}
          <article className="panel settings-grid">
            <div className="panel-heading">
              <h2><UserRound size={18} /> Perfil do Operador</h2>
              <span className="badge active">{user?.role === "admin" ? "ADMIN" : "OPERADOR"}</span>
            </div>
            <label>
              Nome
              <input value={user?.name ?? "Administrador local"} readOnly />
            </label>
            <label>
              Email
              <input value={user?.email ?? "admin@dview.local"} readOnly />
            </label>
            <label>
              Papel de Segurança
              <input value={user?.role === "admin" ? "Super Administrador (Acesso Irrestrito)" : "Operador Supervisionado"} readOnly />
            </label>
          </article>

          {/* Segurança */}
          <article className="panel settings-grid">
            <div className="panel-heading">
              <h2><ShieldCheck size={18} /> Políticas de Segurança</h2>
              <span className="badge safe">AES-256</span>
            </div>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.requireConsent}
                onChange={(event) =>
                  handleUpdate({ requireConsent: event.target.checked }, "Política de consentimento atualizada.")
                }
              />
              Exigir consentimento por sessão no aparelho
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.showDeviceIndicator}
                onChange={(event) =>
                  handleUpdate({ showDeviceIndicator: event.target.checked }, "Indicador visual de tela atualizado.")
                }
              />
              Exibir indicador luminoso no aparelho durante sessão
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.maskSensitiveFields}
                onChange={(event) =>
                  handleUpdate({ maskSensitiveFields: event.target.checked }, "Mascaramento de credenciais atualizado.")
                }
              />
              Mascarar senhas e campos bancários no painel
            </label>
          </article>

          {/* Preferências de Sessão */}
          <article className="panel settings-grid">
            <div className="panel-heading">
              <h2><MonitorCog size={18} /> Preferências de Streaming</h2>
            </div>
            <label>
              Qualidade Padrão de Vídeo
              <select
                value={preferences.sessionQuality}
                onChange={(event) =>
                  handleUpdate(
                    { sessionQuality: event.target.value as typeof preferences.sessionQuality },
                    "Qualidade padrão de vídeo ajustada."
                  )
                }
              >
                <option value="balanced">Balanceada (720p @ 30fps)</option>
                <option value="performance">Desempenho (Baixa Latência)</option>
                <option value="quality">Alta Qualidade (1080p Nativa)</option>
              </select>
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.autoEndIdleSessions}
                onChange={(event) =>
                  handleUpdate({ autoEndIdleSessions: event.target.checked }, "Configuração de ociosidade salva.")
                }
              />
              Encerrar sessões ociosas automaticamente após 15m
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={preferences.notifyOfflineDevices}
                onChange={(event) =>
                  handleUpdate({ notifyOfflineDevices: event.target.checked }, "Notificação de perda de sinal salva.")
                }
              />
              Notificar quando aparelho perder conexão
            </label>
          </article>

          {/* Política de Acesso e Arquitetura */}
          <article className="panel settings-grid full">
            <div className="panel-heading" style={{ margin: 0, paddingBottom: "10px" }}>
              <h2><KeyRound size={18} /> Política de Acesso &amp; Auditoria</h2>
              <button
                type="button"
                className="secondary compact-btn"
                onClick={() => setActiveTab("about")}
                style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}
                title="Abrir console com diagnósticos e topologia da rede"
              >
                <Server size={13} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
                <span>Console de Arquitetura &amp; Diagnóstico</span>
                <ChevronRight size={13} />
              </button>
            </div>
            <div className="policy-grid">
              <span>Autenticação 2FA</span><strong>TOTP RFC-6238 Obrigatório</strong>
              <span>Controle Remoto</span><strong>Canal Criptografado AES-256-GCM</strong>
              <span>Trilha de Auditoria</span><strong>Logs Imutáveis com Assinatura SHA-256</strong>
            </div>
          </article>
        </section>
      )}

      {/* Tab 2: Gerenciador de Aplicativos (Apps Manager) */}
      {activeTab === "apps" && <AppsManager />}

      {/* Tab 3: Logs de Conexão & Alertas */}
      {activeTab === "logs" && <Logs />}

      {/* Tab 4: Sessões Remotas Ativas */}
      {activeTab === "sessions" && <RemoteSession />}

      {/* Tab 5: Sobre o Sistema & Diagnóstico */}
      {activeTab === "about" && <About />}
    </div>
  );
}
