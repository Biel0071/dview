import { useMemo, useState } from "react";
import { Battery, ClipboardCheck, Filter, Play, Search, ShieldCheck } from "lucide-react";
import { api } from "../api";
import { useAppStore } from "../store";

const statusOptions = ["all", "online", "offline", "pending"] as const;

export function Devices() {
  const { devices, setSessions, setView } = useAppStore();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<(typeof statusOptions)[number]>("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return devices.filter((device) => {
      const matchesStatus = status === "all" || device.status === status;
      const text = `${device.name} ${device.model} ${device.id} ${device.androidVersion}`.toLowerCase();
      return matchesStatus && text.includes(query.toLowerCase());
    });
  }, [devices, query, status]);

  const start = async (deviceId: string) => {
    const session = await api.startSession(deviceId);
    setSessions([session]);
    setView("Remote Session");
  };

  return (
    <section className="panel">
      <div className="panel-heading">
        <div>
          <h2>Dispositivos pareados</h2>
          <small>{filtered.length} de {devices.length} aparelhos visiveis.</small>
        </div>
        <div className="toolbar compact">
          <button className="secondary" disabled={!selectedIds.length}>
            <ClipboardCheck size={17} /> Solicitar auditoria
          </button>
        </div>
      </div>

      <div className="filters">
        <label className="search-field">
          <Search size={17} />
          <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar por nome, modelo ou ID" />
        </label>
        <label>
          <Filter size={17} />
          <select value={status} onChange={(event) => setStatus(event.target.value as typeof status)}>
            <option value="all">Todos os status</option>
            <option value="online">Online</option>
            <option value="offline">Offline</option>
            <option value="pending">Pendente</option>
          </select>
        </label>
      </div>

      <div className="table">
        {filtered.map((device) => (
          <div className="row device-row" key={device.id}>
            <label className="check compact-check">
              <input
                type="checkbox"
                checked={selectedIds.includes(device.id)}
                onChange={(event) =>
                  setSelectedIds((current) =>
                    event.target.checked ? [...current, device.id] : current.filter((id) => id !== device.id)
                  )
                }
              />
            </label>
            <span>
              <strong>{device.name}</strong>
              <small>{device.id} · visto {new Date(device.lastSeen).toLocaleString()}</small>
            </span>
            <span>{device.model}</span>
            <span>Android {device.androidVersion}</span>
            <span><Battery size={15} /> {device.battery}%</span>
            <span className={`badge ${device.status}`}>{device.status}</span>
            <span className={`badge ${device.consentRequired ? "info" : "warning"}`}>
              <ShieldCheck size={14} /> {device.consentRequired ? "consentimento" : "revisar politica"}
            </span>
            <button className="secondary" disabled={device.status !== "online"} onClick={() => void start(device.id)}>
              <Play size={16} /> Sessao
            </button>
          </div>
        ))}
        {!filtered.length ? <div className="empty-inline">Nenhum aparelho combina com os filtros atuais.</div> : null}
      </div>
    </section>
  );
}
