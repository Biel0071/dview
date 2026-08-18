export function SettingsPage() {
  return (
    <section className="panel settings-grid">
      <h2>Configuracoes</h2>
      <label>
        URL do backend
        <input value={import.meta.env.VITE_API_URL ?? "http://localhost:3000"} readOnly />
      </label>
      <label className="check">
        <input type="checkbox" defaultChecked />
        Exigir consentimento por sessao
      </label>
      <label className="check">
        <input type="checkbox" defaultChecked />
        Exibir indicador no aparelho durante sessao
      </label>
    </section>
  );
}
