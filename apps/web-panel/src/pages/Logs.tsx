import { useEffect, useState } from "react";
import type { AuditLog } from "@droidview/shared";
import { api } from "../api";

export function Logs() {
  const [logs, setLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    void api.logs().then(setLogs);
  }, []);

  return (
    <section className="panel">
      <h2>Auditoria</h2>
      <div className="table">
        {logs.map((log) => (
          <div className="row log-row" key={log.id}>
            <span>{new Date(log.timestamp).toLocaleString()}</span>
            <span>{log.action}</span>
            <span>{log.target}</span>
            <span className={`badge ${log.severity}`}>{log.severity}</span>
            <span>{log.message}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
