import { api } from "../api";
import { useAppStore } from "../store";

export function Devices() {
  const { devices, setSessions, setView } = useAppStore();

  const start = async (deviceId: string) => {
    const session = await api.startSession(deviceId);
    setSessions([session]);
    setView("Remote Session");
  };

  return (
    <section className="panel">
      <h2>Clientes pareados</h2>
      <div className="table">
        {devices.map((device) => (
          <div className="row device-row" key={device.id}>
            <span>
              <strong>{device.name}</strong>
              <small>{device.id}</small>
            </span>
            <span>{device.model}</span>
            <span>Android {device.androidVersion}</span>
            <span className={`badge ${device.status}`}>{device.status}</span>
            <button className="secondary" disabled={device.status !== "online"} onClick={() => void start(device.id)}>
              Sessao
            </button>
          </div>
        ))}
      </div>
    </section>
  );
}
