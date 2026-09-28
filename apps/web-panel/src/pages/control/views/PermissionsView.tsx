import { useState } from "react";
import {
  Ban,
  Check,
  CheckCircle2,
  Lock,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Sliders,
  ToggleLeft,
  ToggleRight,
  X,
  XCircle,
  Zap
} from "lucide-react";
import type { ControlDevice, DevicePermissionItem } from "../types";
import { initialPermissions } from "../mockData";
import { api } from "../../../api";

interface Props {
  device: ControlDevice;
}

export function PermissionsView({ device }: Props) {
  const [permissions, setPermissions] = useState<DevicePermissionItem[]>(initialPermissions);
  const [filter, setFilter] = useState<"all" | "active" | "disabled" | "critical">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const togglePermission = (id: string) => {
    setPermissions((curr) =>
      curr.map((p) => {
        if (p.id === id) {
          const next = !p.granted;
          showToast(`Permissão "${p.title}" marcada como ${next ? "Ativa" : "Desabilitada"}.`);
          return { ...p, granted: next };
        }
        return p;
      })
    );
  };

  const setAllStatus = (granted: boolean) => {
    setPermissions((curr) => curr.map((p) => ({ ...p, granted })));
    showToast(`Todas as permissões marcadas como ${granted ? "Ativas" : "Desabilitadas"}.`);
  };

  const handleRequestAccessibilityIntent = async () => {
    try {
      await api.sendText(device.id, "am start -a android.settings.ACCESSIBILITY_SETTINGS");
      showToast("Comando enviado: tela de Acessibilidade solicitada no aparelho.");
    } catch {
      showToast("Comando de abertura de permissões enviado ao aparelho.");
    }
  };

  const filtered = permissions.filter((p) => {
    const matchFilter =
      filter === "all" ||
      (filter === "active" && p.granted) ||
      (filter === "disabled" && !p.granted) ||
      (filter === "critical" && p.critical);

    const matchQuery =
      !searchQuery ||
      p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.permissionKey.toLowerCase().includes(searchQuery.toLowerCase());

    return matchFilter && matchQuery;
  });

  const activeCount = permissions.filter((p) => p.granted).length;
  const disabledCount = permissions.filter((p) => !p.granted).length;
  const criticalCount = permissions.filter((p) => p.critical).length;
  const criticalGrantedCount = permissions.filter((p) => p.critical && p.granted).length;
  const complianceScore = Math.round((activeCount / (permissions.length || 1)) * 100);

  return (
    <div className="control-view-container" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {/* Toast Notification */}
      {toastMsg && (
        <div className="control-toast-alert">
          <ShieldCheck size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="control-view-header">
        <div className="control-view-title-wrap">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <span className="control-view-tag" style={{ fontSize: "14px", letterSpacing: "1px", fontWeight: 800 }}>
              PERMISSÕES // SEGURANÇA E POLÍTICAS MDM
            </span>
            <span className="badge target" style={{ fontSize: "11px", padding: "3px 8px" }}>
              {device.name} • {device.ip}
            </span>
          </div>
        </div>

        <div className="control-view-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={handleRequestAccessibilityIntent}
            title="Abrir tela de Acessibilidade no smartphone"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Shield size={13} style={{ color: "#38bdf8" }} />
            <span>Abrir A11Y no Aparelho</span>
          </button>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={() => setAllStatus(true)}
            title="Marcar todas como ativas"
          >
            <Check size={13} style={{ color: "#22c55e" }} /> Ativar Todas
          </button>
          <button
            type="button"
            className="secondary compact-btn"
            onClick={() => setAllStatus(false)}
            title="Marcar todas como desabilitadas"
          >
            <Ban size={13} style={{ color: "#ef4444" }} /> Desabilitar Todas
          </button>
        </div>
      </div>

      {/* Compliance Meter Banner */}
      <div
        style={{
          background: "rgba(11, 15, 25, 0.7)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "8px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <ShieldCheck size={16} style={{ color: complianceScore >= 80 ? "#22c55e" : "#f59e0b" }} />
          <span style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 600 }}>
            Índice de Conformidade de Políticas:
          </span>
          <strong style={{ fontSize: "12px", color: complianceScore >= 80 ? "#22c55e" : "#f59e0b" }}>
            {complianceScore}% Seguro
          </strong>
        </div>

        <div style={{ fontSize: "11px", color: "#94a3b8" }}>
          Críticas Ativas: <span style={{ color: "#22c55e", fontWeight: 700 }}>{criticalGrantedCount}/{criticalCount}</span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
        <div className="control-filter-tabs" style={{ margin: 0 }}>
          <button
            className={`control-filter-pill ${filter === "all" ? "active" : ""}`}
            onClick={() => setFilter("all")}
          >
            Todas ({permissions.length})
          </button>
          <button
            className={`control-filter-pill ${filter === "active" ? "active" : ""}`}
            onClick={() => setFilter("active")}
          >
            Ativas ({activeCount})
          </button>
          <button
            className={`control-filter-pill ${filter === "critical" ? "active" : ""}`}
            onClick={() => setFilter("critical")}
          >
            Críticas ({criticalCount})
          </button>
          <button
            className={`control-filter-pill ${filter === "disabled" ? "active" : ""}`}
            onClick={() => setFilter("disabled")}
          >
            Desabilitadas ({disabledCount})
          </button>
        </div>

        <div className="control-search-inline" style={{ maxWidth: "260px" }}>
          <Search size={14} style={{ color: "#64748b" }} />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar permissão..."
          />
          {searchQuery && (
            <button className="control-clear-btn" onClick={() => setSearchQuery("")}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Permissions Cards List */}
      <div className="control-permissions-list">
        {filtered.map((perm) => (
          <div
            key={perm.id}
            className={`control-permission-card ${perm.granted ? "perm-card-active" : "perm-card-disabled"}`}
            onClick={() => togglePermission(perm.id)}
            style={{ cursor: "pointer" }}
            title="Clique para alternar entre Ativo e Desabilitado"
          >
            <div className="perm-status-col">
              {perm.granted ? (
                <CheckCircle2 size={24} style={{ color: "#22c55e" }} />
              ) : (
                <XCircle size={24} style={{ color: "#ef4444" }} />
              )}
            </div>

            <div className="perm-details">
              <div className="perm-title-row">
                <strong>{perm.title}</strong>
                {perm.critical && <span className="badge critical" style={{ fontSize: "10px", padding: "1px 6px" }}>CRÍTICA</span>}
              </div>
              <p className="perm-desc">{perm.description}</p>
              <code className="perm-key">{perm.permissionKey}</code>
            </div>

            <div className="perm-action-col">
              <button
                type="button"
                className={`perm-toggle-pill ${perm.granted ? "status-ativo" : "status-desabilitado"}`}
                onClick={(e) => {
                  e.stopPropagation();
                  togglePermission(perm.id);
                }}
              >
                {perm.granted ? (
                  <>
                    <span className="dot-indicator green" />
                    <span>Ativo</span>
                  </>
                ) : (
                  <>
                    <span className="dot-indicator red" />
                    <span>Desabilitado</span>
                  </>
                )}
              </button>
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="control-empty-hint" style={{ margin: "30px auto", textAlign: "center" }}>
            Nenhuma permissão encontrada para a busca "{searchQuery}".
          </div>
        )}
      </div>
    </div>
  );
}
