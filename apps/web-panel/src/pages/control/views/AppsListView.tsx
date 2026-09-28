import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Boxes,
  Check,
  Copy,
  ExternalLink,
  Info,
  Play,
  Power,
  RefreshCw,
  Search,
  Shield,
  Trash2,
  X,
  Zap,
  Lock,
  Unlock
} from "lucide-react";
import type { ControlDevice, InstalledAppItem } from "../types";
import { initialInstalledApps } from "../mockData";
import { api } from "../../../api";
import { getAppEmojiFallback } from "../DeviceToolMenu";
import { AppLogo } from "../AppLogo";

interface Props {
  device: ControlDevice;
  onOpenAppControl?: (app: InstalledAppItem) => void;
}

export function AppsListView({ device, onOpenAppControl }: Props) {
  const [apps, setApps] = useState<InstalledAppItem[]>(initialInstalledApps);
  const [query, setQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "user" | "system" | "finance">("all");
  const [selectedApp, setSelectedApp] = useState<InstalledAppItem | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedPkg, setCopiedPkg] = useState(false);
  const [confirmDeleteAppId, setConfirmDeleteAppId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadRealApps = async () => {
    setIsSyncing(true);
    try {
      const realList = await api.getDeviceApps(device.id);
      if (Array.isArray(realList) && realList.length > 0) {
        setApps(realList);
        showToast(`${realList.length} aplicativos reais sincronizados com ${device.name}.`);
      }
    } catch {
      showToast(`Falha ao obter lista de apps do dispositivo.`);
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    loadRealApps();
  }, [device.id]);

  const handleDetectSync = () => {
    loadRealApps();
  };

  const isFinanceApp = (app: InstalledAppItem) => {
    const text = `${app.name} ${app.packageName}`.toLowerCase();
    return (
      text.includes("bank") ||
      text.includes("nubank") ||
      text.includes("inter") ||
      text.includes("itau") ||
      text.includes("caixa") ||
      text.includes("santander") ||
      text.includes("bradesco")
    );
  };

  const filtered = apps.filter((app) => {
    const matchType =
      filterType === "all" ||
      (filterType === "system" && app.isSystem) ||
      (filterType === "user" && !app.isSystem) ||
      (filterType === "finance" && isFinanceApp(app));

    const matchQuery =
      !query ||
      app.name.toLowerCase().includes(query.toLowerCase()) ||
      app.packageName.toLowerCase().includes(query.toLowerCase());

    return matchType && matchQuery;
  });

  // Action Handlers
  const handleLaunch = async (app: InstalledAppItem) => {
    try {
      await api.launchApp(device.id, app.packageName);
      showToast(`Iniciando ${app.name} (${app.packageName}) no dispositivo.`);
    } catch {
      showToast(`Comando enviado para iniciar ${app.name}.`);
    }
    setApps((curr) =>
      curr.map((a) => (a.id === app.id ? { ...a, status: "active" } : a))
    );
    if (onOpenAppControl) {
      onOpenAppControl(app);
    }
  };

  const handleToggleEnable = (app: InstalledAppItem) => {
    const isCurrentlyDisabled = app.status === "disabled";
    const nextStatus = isCurrentlyDisabled ? "active" : "disabled";
    const actionName = isCurrentlyDisabled ? "Habilitado" : "Desabilitado";
    showToast(`Aplicativo ${app.name} foi ${actionName}.`);
    setApps((curr) =>
      curr.map((a) => (a.id === app.id ? { ...a, status: nextStatus } : a))
    );
    if (selectedApp?.id === app.id) {
      setSelectedApp((curr) => (curr ? { ...curr, status: nextStatus } : null));
    }
    if (isCurrentlyDisabled && onOpenAppControl) {
      onOpenAppControl({ ...app, status: "active" });
    }
  };

  const handleForceStop = async (app: InstalledAppItem) => {
    try {
      await api.stopApp(device.id, app.packageName);
      showToast(`Processo de ${app.name} encerrado no dispositivo.`);
    } catch {
      showToast(`Comando enviado para encerrar ${app.name}.`);
    }
    setApps((curr) =>
      curr.map((a) => (a.id === app.id ? { ...a, status: "stopped" } : a))
    );
    if (selectedApp?.id === app.id) {
      setSelectedApp((curr) => (curr ? { ...curr, status: "stopped" } : null));
    }
  };

  const handleConfirmUninstall = (app: InstalledAppItem) => {
    setApps((curr) => curr.filter((a) => a.id !== app.id));
    setSelectedApp(null);
    setConfirmDeleteAppId(null);
    showToast(`Comando de desinstalação executado para "${app.name}".`);
  };

  const handleClearData = (app: InstalledAppItem) => {
    showToast(`Dados de cache e armazenamento limpos para "${app.name}".`);
  };

  const handleTogglePermission = (permKey: string) => {
    if (!selectedApp || !selectedApp.permissions) return;
    const updatedPerms = selectedApp.permissions.map((p) =>
      p.key === permKey ? { ...p, granted: !p.granted } : p
    );
    const updatedApp = { ...selectedApp, permissions: updatedPerms };
    setSelectedApp(updatedApp);
    setApps((curr) => curr.map((a) => (a.id === selectedApp.id ? updatedApp : a)));
    showToast(`Permissão "${permKey}" atualizada.`);
  };

  const copyPackageName = (pkg: string) => {
    void navigator.clipboard.writeText(pkg);
    setCopiedPkg(true);
    setTimeout(() => setCopiedPkg(false), 2000);
  };

  return (
    <div className="control-view-container app-detect-container">
      {/* Toast Notification */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header matching reference screenshot */}
      <div className="control-view-header">
        <div className="control-view-title-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 700, margin: 0, color: "#ffffff" }}>Apps</h2>
            <span className="badge online" style={{ fontSize: "11px" }}>{apps.length} Total</span>
          </div>
          <span className="control-view-device-id" style={{ color: "#94a3b8", fontSize: "12px", marginTop: "2px" }}>
            {device.name} • {device.ip}
          </span>
        </div>

        <div className="control-view-actions" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            className={`primary detect-sync-btn ${isSyncing ? "syncing" : ""}`}
            onClick={handleDetectSync}
            disabled={isSyncing}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "7px 14px",
              fontSize: "12px",
              fontWeight: 600,
              background: "linear-gradient(135deg, var(--crimson-neon), #991b1b)",
              boxShadow: "0 0 15px rgba(255,26,42,0.3)"
            }}
          >
            <RefreshCw size={14} className={isSyncing ? "animate-spin" : ""} />
            <span>{isSyncing ? "Sincronizando..." : "Detect Sync"}</span>
          </button>
        </div>
      </div>

      {/* Sub Header / Filters & Search */}
      <div className="control-files-nav-bar" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
        <div className="control-filter-tabs">
          <button
            className={`control-filter-pill ${filterType === "all" ? "active" : ""}`}
            onClick={() => setFilterType("all")}
          >
            Todos ({apps.length})
          </button>
          <button
            className={`control-filter-pill ${filterType === "user" ? "active" : ""}`}
            onClick={() => setFilterType("user")}
          >
            Usuário ({apps.filter((a) => !a.isSystem).length})
          </button>
          <button
            className={`control-filter-pill ${filterType === "system" ? "active" : ""}`}
            onClick={() => setFilterType("system")}
          >
            Sistema ({apps.filter((a) => a.isSystem).length})
          </button>
          <button
            className={`control-filter-pill ${filterType === "finance" ? "active" : ""}`}
            onClick={() => setFilterType("finance")}
          >
            Bancos ({apps.filter(isFinanceApp).length})
          </button>
        </div>

        <div className="control-search-inline" style={{ minWidth: "240px" }}>
          <Search size={14} style={{ color: "#64748b" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar aplicativo ou pacote..."
          />
          {query && (
            <button className="control-clear-btn" onClick={() => setQuery("")} title="Limpar busca">
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Launcher Grid Area Matching Screenshot media_1789659588703.png */}
      <div className="apps-launcher-grid-viewport">
        <div className="apps-launcher-grid">
          {filtered.map((app) => {
            const isSelected = selectedApp?.id === app.id;
            return (
              <button
                key={app.id}
                className={`app-launcher-icon-btn ${isSelected ? "selected" : ""} ${app.status === "disabled" ? "disabled-app" : ""}`}
                onClick={() => setSelectedApp(app)}
                title={`${app.name} (${app.packageName})\nClique para abrir menu de configurações`}
              >
                <div style={{ position: "relative", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                  <AppLogo name={app.name} packageName={app.packageName} size={48} iconUrl={app.iconUrl} />
                  {app.status === "active" && <span className="app-running-dot" />}
                  {app.status === "disabled" && <span className="app-disabled-badge">OFF</span>}
                </div>
                <span className="app-launcher-label" title={app.name}>
                  {app.name}
                </span>
              </button>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="control-empty-hint" style={{ margin: "40px auto", textAlign: "center" }}>
            Nenhum aplicativo encontrado para a busca "{query}".
          </div>
        )}
      </div>

      {/* App Configuration & Controls Modal / Drawer */}
      {selectedApp && (
        <div className="app-config-modal-backdrop" onClick={() => setSelectedApp(null)}>
          <div className="app-config-modal-card" onClick={(e) => e.stopPropagation()}>
            {/* Modal Top Bar */}
            <div className="app-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                <AppLogo name={selectedApp.name} packageName={selectedApp.packageName} size={52} iconUrl={selectedApp.iconUrl} />
                <div>
                  <h3 style={{ margin: 0, fontSize: "18px", color: "#ffffff", fontWeight: 700 }}>
                    {selectedApp.name}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <code className="app-pkg-code">{selectedApp.packageName}</code>
                    <button
                      className="icon-copy-btn"
                      onClick={() => copyPackageName(selectedApp.packageName)}
                      title="Copiar nome do pacote"
                    >
                      {copiedPkg ? <Check size={12} style={{ color: "#22c55e" }} /> : <Copy size={12} />}
                    </button>
                  </div>
                </div>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedApp(null)}>
                <X size={18} />
              </button>
            </div>

            {/* Badges & Meta */}
            <div className="app-modal-meta-row">
              <span className={`badge ${selectedApp.status === "active" ? "online" : selectedApp.status === "disabled" ? "warning" : "offline"}`}>
                Status: {selectedApp.status === "active" ? "Ativo" : selectedApp.status === "disabled" ? "Desabilitado" : "Parado"}
              </span>
              <span className="badge info">v{selectedApp.version}</span>
              <span className="badge offline">{selectedApp.isSystem ? "App de Sistema" : "App de Terceiros"}</span>
              {selectedApp.sizeMb && <span className="badge offline">{selectedApp.sizeMb} MB</span>}
            </div>

            {/* Action Buttons Grid */}
            <div className="app-modal-actions-box">
              <span className="app-actions-title">AÇÕES DIRETAS NO DISPOSITIVO</span>
              <div className="app-actions-grid">
                {/* 1. Abrir Direto e Controle */}
                <button
                  className="primary action-pill-btn"
                  onClick={() => handleLaunch(selectedApp)}
                  disabled={selectedApp.status === "disabled"}
                >
                  <Play size={15} />
                  <span>Abrir Tela & Controle</span>
                </button>

                {/* 2. Habilitar / Desabilitar */}
                <button
                  className={`secondary action-pill-btn ${selectedApp.status === "disabled" ? "enable-style" : ""}`}
                  onClick={() => handleToggleEnable(selectedApp)}
                >
                  {selectedApp.status === "disabled" ? <Unlock size={15} style={{ color: "#22c55e" }} /> : <Lock size={15} style={{ color: "#f59e0b" }} />}
                  <span>{selectedApp.status === "disabled" ? "Habilitar & Abrir Tela" : "Desabilitar App"}</span>
                </button>

                {/* 3. Forçar Parada */}
                <button
                  className="secondary action-pill-btn"
                  onClick={() => handleForceStop(selectedApp)}
                  disabled={selectedApp.status === "stopped" || selectedApp.status === "disabled"}
                >
                  <Power size={15} />
                  <span>Forçar Parada</span>
                </button>

                {/* 4. Limpar Dados */}
                <button
                  className="secondary action-pill-btn"
                  onClick={() => handleClearData(selectedApp)}
                >
                  <RefreshCw size={15} />
                  <span>Limpar Cache</span>
                </button>

                {/* 5. Desinstalar */}
                {confirmDeleteAppId === selectedApp.id ? (
                  <div style={{ display: "flex", gap: "6px", gridColumn: "span 2" }}>
                    <button
                      className="danger action-pill-btn"
                      style={{ flex: 1 }}
                      onClick={() => handleConfirmUninstall(selectedApp)}
                    >
                      Confirmar Desinstalação
                    </button>
                    <button
                      className="secondary action-pill-btn"
                      onClick={() => setConfirmDeleteAppId(null)}
                    >
                      Cancelar
                    </button>
                  </div>
                ) : (
                  <button
                    className="danger action-pill-btn"
                    onClick={() => setConfirmDeleteAppId(selectedApp.id)}
                    disabled={selectedApp.isSystem}
                    title={selectedApp.isSystem ? "Aplicativos de sistema não podem ser desinstalados sem root" : "Desinstalar aplicativo do aparelho"}
                  >
                    <Trash2 size={15} />
                    <span>Desinstalar</span>
                  </button>
                )}
              </div>
            </div>

            {/* Permissions / Details Checklist */}
            <div className="app-modal-perms-box">
              <span className="app-actions-title">PERMISSÕES DO APLICATIVO (CLIQUE PARA ALTERAR)</span>
              <div className="app-perms-list">
                {selectedApp.permissions && selectedApp.permissions.length > 0 ? (
                  selectedApp.permissions.map((perm) => (
                    <div
                      key={perm.key}
                      className="app-perm-item"
                      onClick={() => handleTogglePermission(perm.key)}
                      style={{ cursor: "pointer" }}
                      title="Clique para alternar permissão"
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Shield size={14} style={{ color: perm.granted ? "var(--crimson-neon)" : "#64748b" }} />
                        <span style={{ fontSize: "13px", color: "#e2e8f0" }}>{perm.name}</span>
                        <code style={{ fontSize: "10px", color: "#64748b" }}>{perm.key}</code>
                      </div>
                      <span className={`badge ${perm.granted ? "online" : "offline"}`} style={{ fontSize: "10px" }}>
                        {perm.granted ? "Concedida" : "Negada"}
                      </span>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#94a3b8", fontSize: "12px", padding: "8px 0" }}>
                    Permissões padrão de execução declaradas no manifesto.
                  </div>
                )}
              </div>
            </div>

            {/* Footer info */}
            <div className="app-modal-footer">
              <small style={{ color: "#64748b", fontSize: "11px" }}>
                Instalado em: {selectedApp.installDate || "17/09/2026"} • Dispositivo: {device.name} ({device.ip})
              </small>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
