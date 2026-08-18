import { KeyRound, Languages, MonitorCog, Save, ShieldCheck, UserRound } from "lucide-react";
import { languageNames, type Language } from "../i18n";
import { useAppStore } from "../store";

export function SettingsPage() {
  const { user, preferences, updatePreferences } = useAppStore();

  return (
    <section className="settings-layout">
      <article className="panel settings-grid">
        <div className="panel-heading">
          <div>
            <h2><Languages size={18} /> Idioma e interface</h2>
            <small>Preferencias salvas neste computador.</small>
          </div>
          <span className="badge info"><Save size={14} /> auto-save</span>
        </div>
        <label>
          Idioma
          <select
            value={preferences.language}
            onChange={(event) => updatePreferences({ language: event.target.value as Language })}
          >
            {Object.entries(languageNames).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          URL do backend
          <input value={import.meta.env.VITE_API_URL ?? "http://localhost:3000"} readOnly />
        </label>
      </article>

      <article className="panel settings-grid">
        <h2><UserRound size={18} /> Perfil</h2>
        <label>
          Nome
          <input value={user?.name ?? "Administrador local"} readOnly />
        </label>
        <label>
          Email
          <input value={user?.email ?? "admin@droidview.local"} readOnly />
        </label>
        <label>
          Papel
          <input value={user?.role ?? "admin"} readOnly />
        </label>
      </article>

      <article className="panel settings-grid">
        <h2><ShieldCheck size={18} /> Seguranca</h2>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.requireConsent}
            onChange={(event) => updatePreferences({ requireConsent: event.target.checked })}
          />
          Exigir consentimento por sessao
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.showDeviceIndicator}
            onChange={(event) => updatePreferences({ showDeviceIndicator: event.target.checked })}
          />
          Exibir indicador no aparelho durante sessao
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.maskSensitiveFields}
            onChange={(event) => updatePreferences({ maskSensitiveFields: event.target.checked })}
          />
          Mascarar campos sensiveis no painel
        </label>
      </article>

      <article className="panel settings-grid">
        <h2><MonitorCog size={18} /> Preferencias de sessao</h2>
        <label>
          Qualidade padrao
          <select
            value={preferences.sessionQuality}
            onChange={(event) => updatePreferences({ sessionQuality: event.target.value as typeof preferences.sessionQuality })}
          >
            <option value="balanced">Balanceada</option>
            <option value="performance">Desempenho</option>
            <option value="quality">Qualidade</option>
          </select>
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.autoEndIdleSessions}
            onChange={(event) => updatePreferences({ autoEndIdleSessions: event.target.checked })}
          />
          Encerrar sessoes ociosas automaticamente
        </label>
        <label className="check">
          <input
            type="checkbox"
            checked={preferences.notifyOfflineDevices}
            onChange={(event) => updatePreferences({ notifyOfflineDevices: event.target.checked })}
          />
          Notificar quando aparelho ficar offline
        </label>
      </article>

      <article className="panel settings-grid full">
        <h2><KeyRound size={18} /> Politica de acesso</h2>
        <div className="policy-grid">
          <span>2FA local</span><strong>Obrigatorio</strong>
          <span>Controle remoto</span><strong>Somente com aceite visivel</strong>
          <span>Auditoria</span><strong>Logs exibidos no painel</strong>
        </div>
      </article>
    </section>
  );
}
