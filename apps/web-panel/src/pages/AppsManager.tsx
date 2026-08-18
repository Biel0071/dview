import { useEffect, useState } from "react";
import type { AppPackage } from "@droidview/shared";
import { api } from "../api";

export function AppsManager() {
  const [apps, setApps] = useState<AppPackage[]>([]);

  useEffect(() => {
    void api.apps().then(setApps);
  }, []);

  return (
    <section className="panel">
      <h2>Apps corporativos</h2>
      <div className="table">
        {apps.map((app) => (
          <div className="row" key={app.id}>
            <span>{app.name}</span>
            <span>{app.packageName}</span>
            <span>{app.version}</span>
            <span className="badge">{app.status}</span>
          </div>
        ))}
      </div>
    </section>
  );
}
