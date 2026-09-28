import { FormEvent, useState } from "react";
import { Lock, Mail, ShieldAlert, KeyRound } from "lucide-react";
import { api } from "../api";
import { useAppStore } from "../store";

export function Login() {
  const setAuth = useAppStore((state) => state.setAuth);
  const [email, setEmail] = useState("admin@dview.local");
  const [password, setPassword] = useState("admin123");
  const [totp, setTotp] = useState("123456");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await api.login(email, password, totp);
      setAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-screen">
      <form className="login-panel" onSubmit={submit}>
        <div className="login-hero-logo">
          <img src="./dview-logo.jpg" alt="DVIEW" className="login-logo-img" />
          <div className="login-brand-text">DVIEW</div>
          <div className="login-slogan">SEE EVERYTHING. FEAR NOTHING.</div>
          <span style={{ color: "#64748b", fontSize: "11px", letterSpacing: "1.5px", textTransform: "uppercase", marginTop: "4px", fontFamily: "var(--font-tactical)" }}>
            Console Central &amp; Suporte Remoto
          </span>
        </div>

        <label>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Mail size={14} style={{ color: "#94a3b8" }} />
            E-mail de Acesso
          </span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="admin@dview.local"
            required
          />
        </label>

        <label>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Lock size={14} style={{ color: "#94a3b8" }} />
            Senha
          </span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="••••••••"
            required
          />
        </label>

        <label>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <KeyRound size={14} style={{ color: "#94a3b8" }} />
            Token de Segurança 2FA
          </span>
          <input
            value={totp}
            onChange={(event) => setTotp(event.target.value)}
            placeholder="123456"
            maxLength={6}
            required
          />
        </label>

        {error ? (
          <div className="alert">
            <ShieldAlert size={18} style={{ color: "#ff4d5a", flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        ) : null}

        <button className="primary" type="submit" disabled={loading} style={{ marginTop: "6px", width: "100%", justifyContent: "center" }}>
          {loading ? "Autenticando..." : "Entrar no Sistema"}
        </button>

        <div style={{ textAlign: "center", marginTop: "8px", fontSize: "11px", color: "#526071", fontFamily: "var(--font-mono)" }}>
          DEMO: admin@dview.local / admin123 / 123456
        </div>
      </form>
    </main>
  );
}
