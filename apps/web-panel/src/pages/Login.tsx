import { FormEvent, useState } from "react";
import { ShieldCheck } from "lucide-react";
import { api } from "../api";
import { useAppStore } from "../store";

export function Login() {
  const setAuth = useAppStore((state) => state.setAuth);
  const [email, setEmail] = useState("admin@dview.local");
  const [password, setPassword] = useState("admin123");
  const [totp, setTotp] = useState("123456");
  const [error, setError] = useState("");

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    try {
      const result = await api.login(email, password, totp);
      setAuth(result.token, result.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha no login");
    }
  };

  return (
    <main className="login-screen">
      <form className="login-panel" onSubmit={submit}>
        <div className="brand big">
          <ShieldCheck size={32} />
          <div>
            <strong>DVIEW</strong>
            <span>Admin Console</span>
          </div>
        </div>
        <label>
          E-mail
          <input value={email} onChange={(event) => setEmail(event.target.value)} />
        </label>
        <label>
          Senha
          <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
        </label>
        <label>
          Codigo 2FA
          <input value={totp} onChange={(event) => setTotp(event.target.value)} />
        </label>
        {error ? <div className="alert">{error}</div> : null}
        <button className="primary" type="submit">Entrar</button>
      </form>
    </main>
  );
}
