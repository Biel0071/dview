import { useState } from "react";
import {
  Activity,
  CheckCircle2,
  ChevronRight,
  Globe,
  KeyRound,
  Languages,
  MonitorCog,
  Radio,
  RefreshCw,
  Save,
  Server,
  ShieldCheck,
  UserRound,
  Zap
} from "lucide-react";
import { languageNames, type Language } from "../i18n";
import { useAppStore } from "../store";
import { api } from "../api";

export function SettingsPage() {
  const { user, preferences, updatePreferences, setView } = useAppStore();
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [testingHealth, setTestingHealth] = useState(false);
  const [healthStatus, setHealthStatus] = useState<{ ok: boolean; latency: number; time: string } | null>(null);

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
    <section className="settings-layout" style={{ maxWidth: "1100px", margin: "0 auto" }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

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
            onClick={() => setView("About")}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", fontSize: "11.5px" }}
            title="Abrir console com 5 diagnósticos e topologia da rede"
          >
            <Server size={13} style={{ color: "var(--crimson-neon)" }} />
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
  );
}
