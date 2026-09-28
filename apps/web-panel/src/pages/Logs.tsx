import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  Copy,
  Download,
  Filter,
  Info,
  ListChecks,
  Radio,
  RefreshCw,
  Search,
  Shield,
  ShieldAlert,
  Trash2,
  X,
  Zap
} from "lucide-react";
import type { AuditLog } from "@droidview/shared";
import { api } from "../api";

export function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [action, setAction] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [autoSync, setAutoSync] = useState(true);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const fetchLogs = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const data = await api.logs();
      if (Array.isArray(data)) {
        setLogs(data);
      }
      if (!silent) {
        showToast("Registros de auditoria atualizados.");
      }
    } catch {
      if (!silent) {
        showToast("Falha ao sincronizar logs com o servidor.");
      }
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    void fetchLogs(true);
  }, []);

  useEffect(() => {
    if (!autoSync) return;
    const interval = setInterval(() => {
      void fetchLogs(true);
    }, 8000);
    return () => clearInterval(interval);
  }, [autoSync]);

  const actions = useMemo(() => {
    return Array.from(new Set(logs.map((log) => log.action))).sort();
  }, [logs]);

  const filtered = useMemo(() => {
    return logs.filter((log) => {
      const matchesSeverity = severity === "all" || log.severity === severity;
      const matchesAction = action === "all" || log.action === action;
      const text = `${log.actor} ${log.action} ${log.target} ${log.message}`.toLowerCase();
      return matchesSeverity && matchesAction && text.includes(query.toLowerCase());
    });
  }, [logs, severity, action, query]);

  const counts = useMemo(() => {
    return {
      total: logs.length,
      critical: logs.filter((l) => l.severity === "critical").length,
      warning: logs.filter((l) => l.severity === "warning").length,
      info: logs.filter((l) => l.severity === "info").length
    };
  }, [logs]);

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(filtered, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exportados ${filtered.length} registros em formato JSON.`);
  };

  const handleExportCsv = () => {
    const headers = ["ID", "Timestamp", "Severidade", "Ator", "Acao", "Alvo", "Mensagem"];
    const rows = filtered.map((l) => [
      l.id,
      new Date(l.timestamp).toISOString(),
      l.severity,
      `"${l.actor.replace(/"/g, '""')}"`,
      `"${l.action.replace(/"/g, '""')}"`,
      `"${l.target.replace(/"/g, '""')}"`,
      `"${l.message.replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit_logs_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Exportados ${filtered.length} registros em formato CSV.`);
  };

  const handleCopyLog = (log: AuditLog) => {
    const line = `[${new Date(log.timestamp).toISOString()}] [${log.severity.toUpperCase()}] ${log.actor} -> ${log.action} (${log.target}): ${log.message}`;
    void navigator.clipboard.writeText(line);
    showToast("Registro copiado para a área de transferência.");
  };

  const handleClearFilters = () => {
    setQuery("");
    setSeverity("all");
    setAction("all");
  };

  const getSeverityBadge = (sev: string) => {
    switch (sev) {
      case "critical":
        return (
          <span className="badge critical" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AlertTriangle size={12} /> CRITICAL
          </span>
        );
      case "warning":
        return (
          <span className="badge warning" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <AlertCircle size={12} /> WARNING
          </span>
        );
      default:
        return (
          <span className="badge info" style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
            <CheckCircle2 size={12} /> INFO
          </span>
        );
    }
  };

  return (
    <section className="stack">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* KPI Metrics Summary */}
      <div className="kpi-grid">
        <article
          className="metric metric-devices"
          onClick={() => { setSeverity("all"); }}
          style={{ cursor: "pointer" }}
        >
          <div className="metric-header-row">
            <div className="metric-icon-wrap">
              <ListChecks size={20} />
            </div>
            <span className="metric-trend-pill">Trilha Completa</span>
          </div>
          <span className="metric-label">Total de Eventos</span>
          <strong className="metric-value">{counts.total}</strong>
        </article>

        <article
          className="metric metric-alerts"
          onClick={() => { setSeverity("critical"); }}
          style={{ cursor: "pointer" }}
        >
          <div className="metric-header-row">
            <div className="metric-icon-wrap" style={{ background: "rgba(239, 68, 68, 0.15)", color: "#ef4444" }}>
              <ShieldAlert size={20} />
            </div>
            <span className="metric-trend-pill" style={{ color: "#ef4444" }}>Atenção Imediata</span>
          </div>
          <span className="metric-label">Severidade Crítica</span>
          <strong className="metric-value" style={{ color: "#ef4444" }}>{counts.critical}</strong>
        </article>

        <article
          className="metric metric-online"
          onClick={() => { setSeverity("warning"); }}
          style={{ cursor: "pointer" }}
        >
          <div className="metric-header-row">
            <div className="metric-icon-wrap" style={{ background: "rgba(245, 158, 11, 0.15)", color: "#f59e0b" }}>
              <AlertCircle size={20} />
            </div>
            <span className="metric-trend-pill" style={{ color: "#f59e0b" }}>Supervisão</span>
          </div>
          <span className="metric-label">Avisos / Alertas</span>
          <strong className="metric-value" style={{ color: "#f59e0b" }}>{counts.warning}</strong>
        </article>

        <article
          className="metric metric-safe"
          onClick={() => { setSeverity("info"); }}
          style={{ cursor: "pointer" }}
        >
          <div className="metric-header-row">
            <div className="metric-icon-wrap" style={{ background: "rgba(34, 197, 94, 0.15)", color: "#22c55e" }}>
              <CheckCircle2 size={20} />
            </div>
            <span className="metric-trend-pill" style={{ color: "#22c55e" }}>Conformes</span>
          </div>
          <span className="metric-label">Operações Normais</span>
          <strong className="metric-value" style={{ color: "#22c55e" }}>{counts.info}</strong>
        </article>
      </div>

      {/* Main Panel */}
      <section className="panel">
        <div className="panel-heading">
          <div>
            <h2>Trilha de Auditoria Corporativa</h2>
            <small>
              {filtered.length} de {logs.length} registros exibidos • Canal seguro inviolável com assinatura cronológica.
            </small>
          </div>

          <div className="toolbar compact" style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            <button
              type="button"
              className={`secondary compact-btn ${autoSync ? "active" : ""}`}
              onClick={() => {
                setAutoSync(!autoSync);
                showToast(autoSync ? "Sincronização automática pausada." : "Sincronização automática ativada (8s).");
              }}
              title="Alternar sincronização automática a cada 8 segundos"
              style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Radio size={13} style={{ color: autoSync ? "#22c55e" : "#64748b" }} />
              <span>{autoSync ? "Live Sync Ativo" : "Live Sync Pausado"}</span>
            </button>

            <button
              type="button"
              className="secondary compact-btn"
              onClick={() => void fetchLogs(false)}
              disabled={isLoading}
              title="Atualizar agora"
              style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <RefreshCw size={13} className={isLoading ? "animate-spin" : ""} />
              <span>Atualizar</span>
            </button>

            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleExportJson}
              title="Exportar registros filtrados em JSON"
              style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Download size={13} style={{ color: "#38bdf8" }} />
              <span>JSON</span>
            </button>

            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleExportCsv}
              title="Exportar registros filtrados em CSV"
              style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <Download size={13} style={{ color: "#22c55e" }} />
              <span>CSV</span>
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="filters" style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          <label className="search-field" style={{ flex: 1, minWidth: "240px" }}>
            <Search size={16} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Buscar por ator, alvo, ação ou detalhe da mensagem..."
            />
            {query && (
              <button className="control-clear-btn" onClick={() => setQuery("")} title="Limpar busca">
                <X size={12} />
              </button>
            )}
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Filter size={16} />
            <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
              <option value="all">Todas severidades ({logs.length})</option>
              <option value="critical">Crítico ({counts.critical})</option>
              <option value="warning">Aviso ({counts.warning})</option>
              <option value="info">Informativo ({counts.info})</option>
            </select>
          </label>

          <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span>Ação:</span>
            <select value={action} onChange={(event) => setAction(event.target.value)}>
              <option value="all">Todas as ações</option>
              {actions.map((item) => (
                <option value={item} key={item}>
                  {item}
                </option>
              ))}
            </select>
          </label>

          {(query || severity !== "all" || action !== "all") && (
            <button
              type="button"
              className="secondary compact-btn"
              onClick={handleClearFilters}
              style={{ fontSize: "11px", padding: "6px 10px" }}
              title="Limpar todos os filtros aplicados"
            >
              <X size={12} style={{ marginRight: "4px" }} /> Limpar Filtros
            </button>
          )}
        </div>

        {/* Logs Table */}
        <div className="table" style={{ marginTop: "12px" }}>
          {filtered.map((log) => (
            <div
              className="row log-row"
              key={log.id}
              onClick={() => setSelectedLog(log)}
              style={{ cursor: "pointer" }}
              title="Clique para ver detalhes do evento"
            >
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#94a3b8" }}>
                {new Date(log.timestamp).toLocaleString("pt-BR")}
              </span>
              <span>{getSeverityBadge(log.severity)}</span>
              <strong style={{ color: "#f8fafc" }}>{log.actor}</strong>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "#38bdf8" }}>
                {log.action}
              </span>
              <span style={{ color: "#cbd5e1" }}>{log.target}</span>
              <span style={{ color: "#94a3b8", flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {log.message}
              </span>
              <button
                type="button"
                className="icon-action-btn"
                title="Copiar linha de log"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCopyLog(log);
                }}
              >
                <Copy size={13} />
              </button>
            </div>
          ))}

          {!filtered.length && (
            <div className="empty-inline" style={{ padding: "40px 20px", textAlign: "center" }}>
              <Shield size={36} style={{ color: "#64748b", margin: "0 auto 10px", display: "block" }} />
              <strong style={{ fontSize: "14px", color: "#f8fafc", display: "block" }}>
                Nenhum registro encontrado com os filtros atuais
              </strong>
              <p style={{ fontSize: "12px", color: "#94a3b8", margin: "6px 0 14px" }}>
                Ajuste os filtros de severidade ou o termo de pesquisa para visualizar os eventos.
              </p>
              {(query || severity !== "all" || action !== "all") && (
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={handleClearFilters}
                  style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                >
                  <RefreshCw size={12} /> Redefinir Filtros
                </button>
              )}
            </div>
          )}
        </div>
      </section>

      {/* DETAIL MODAL */}
      {selectedLog && (
        <div className="app-config-modal-backdrop" onClick={() => setSelectedLog(null)}>
          <div className="app-config-modal-card" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Shield size={18} style={{ color: "var(--crimson-neon)" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>
                  Detalhes do Evento de Auditoria
                </h3>
              </div>
              <button className="modal-close-btn" onClick={() => setSelectedLog(null)}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", padding: "14px 0", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Identificador (ID):</span>
                <code style={{ color: "#38bdf8" }}>{selectedLog.id}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Data &amp; Hora:</span>
                <span style={{ color: "#f8fafc", fontFamily: "var(--font-mono)" }}>
                  {new Date(selectedLog.timestamp).toLocaleString("pt-BR")}
                </span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Severidade:</span>
                <span>{getSeverityBadge(selectedLog.severity)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Ator Responsável:</span>
                <strong style={{ color: "#f8fafc" }}>{selectedLog.actor}</strong>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Ação Auditada:</span>
                <code style={{ color: "#facc15" }}>{selectedLog.action}</code>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #1e293b", paddingBottom: "8px" }}>
                <span style={{ color: "#94a3b8" }}>Alvo / Dispositivo:</span>
                <span style={{ color: "#cbd5e1" }}>{selectedLog.target}</span>
              </div>
              <div>
                <span style={{ color: "#94a3b8", display: "block", marginBottom: "4px" }}>Mensagem do Sistema:</span>
                <div style={{ background: "#090c14", padding: "10px", borderRadius: "6px", border: "1px solid #1e293b", color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "12px", whiteSpace: "pre-wrap" }}>
                  {selectedLog.message}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", gap: "8px", paddingTop: "12px", borderTop: "1px solid #1e293b" }}>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  handleCopyLog(selectedLog);
                  setSelectedLog(null);
                }}
                style={{ flex: 1, justifyContent: "center", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Copy size={13} />
                <span>Copiar Evento</span>
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => setSelectedLog(null)}
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
