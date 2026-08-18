import { useEffect, useState } from "react";
import { Archive, CheckCircle2, Download, Search, UploadCloud } from "lucide-react";
import type { AppPackage } from "@droidview/shared";
import { api } from "../api";

export function AppsManager() {
  const [apps, setApps] = useState<AppPackage[]>([]);
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("stable");

  useEffect(() => {
    void api.apps().then(setApps);
  }, []);

  const filtered = apps.filter((app) => `${app.name} ${app.packageName} ${app.version}`.toLowerCase().includes(query.toLowerCase()));
  const installed = apps.filter((app) => app.status === "installed").length;
  const available = apps.filter((app) => app.status === "available").length;

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
    </section>
  );
}
