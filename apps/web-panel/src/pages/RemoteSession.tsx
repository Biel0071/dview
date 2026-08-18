import { MessageSquare, MousePointer2, Square, Video } from "lucide-react";
import { useAppStore } from "../store";

export function RemoteSession() {
  const { sessions, devices } = useAppStore();
  const session = sessions[0];
  const device = devices.find((item) => item.id === session?.deviceId);

  if (!session) {
    return <section className="empty">Nenhuma sessao solicitada. Abra Clients e selecione um dispositivo online.</section>;
  }

  return (
    <section className="remote-grid">
      <div className="remote-stage">
        <div className="phone-frame">
          <div className="phone-status">Consentimento pendente</div>
          <Video size={42} />
          <strong>{device?.name ?? session.deviceId}</strong>
          <span>Codigo de consentimento: {session.consentCode}</span>
        </div>
      </div>
      <aside className="panel tools">
        <h2>Controle remoto</h2>
        <p>Status: <span className={`badge ${session.status}`}>{session.status}</span></p>
        <button className="secondary"><MousePointer2 size={18} /> Toque remoto</button>
        <button className="secondary"><MessageSquare size={18} /> Chat</button>
        <button className="danger"><Square size={18} /> Encerrar</button>
        <small>O MVP exige aceite visivel no aparelho antes de qualquer captura real de tela.</small>
      </aside>
    </section>
  );
}
