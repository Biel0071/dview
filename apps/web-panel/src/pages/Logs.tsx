import { useEffect, useState } from "react";
import { Filter, Search } from "lucide-react";
import type { AuditLog } from "@droidview/shared";
import { api } from "../api";

export function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [query, setQuery] = useState("");
  const [severity, setSeverity] = useState("all");
  const [action, setAction] = useState("all");

  useEffect(() => {
    void api.logs().then(setLogs);
  }, []);

  const actions = Array.from(new Set(logs.map((log) => log.action))).sort();
  const filtered = logs.filter((log) => {
    const matchesSeverity = severity === "all" || log.severity === severity;
    const matchesAction = action === "all" || log.action === action;
    const text = `${log.actor} ${log.action} ${log.target} ${log.message}`.toLowerCase();
    return matchesSeverity && matchesAction && text.includes(query.toLowerCase());
  });

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Auditoria</h2>
          <small>{filtered.length} registros exibidos de {logs.length} recebidos.</small>
        </div>
      </div>
      <div className="filters three">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar ator, alvo ou mensagem" />
        </label>
        <label>
          <Filter size={17} />
          <select value={severity} onChange={(event) => setSeverity(event.target.value)}>
            <option value="all">Todas severidades</option>
            <option value="info">Info</option>
            <option value="warning">Warning</option>
            <option value="critical">Critical</option>
          </select>
        </label>
        <label>
          Acao
          <select value={action} onChange={(event) => setAction(event.target.value)}>
            <option value="all">Todas</option>
            {actions.map((item) => <option value={item} key={item}>{item}</option>)}
          </select>
        </label>
      </div>
      <div className="table">
        {filtered.map((log) => (
          <div className="row log-row" key={log.id}>
            <span>{new Date(log.timestamp).toLocaleString()}</span>
            <span>{log.actor}</span>
            <span>{log.action}</span>
            <span>{log.target}</span>
            <span className={`badge ${log.severity}`}>{log.severity}</span>
            <span>{log.message}</span>
          </div>
        ))}
        {!filtered.length ? <div className="empty-inline">Nenhum registro encontrado com estes filtros.</div> : null}
      </div>
    </section>
  );
}
