import { ChangeEvent, FormEvent, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ApkBuildResponse } from "@droidview/shared";
import { api } from "../api";

export function ApkBuilder() {
  const [serverUrl, setServerUrl] = useState(api.baseUrl);
  const [redirectUrl, setRedirectUrl] = useState("https://example.com");
  const [appName, setAppName] = useState("DVIEW WebApp");
  const [enrollmentToken, setEnrollmentToken] = useState(`enroll-${Date.now()}`);
  const [deviceName, setDeviceName] = useState("Novo aparelho");
  const [logoDataUrl, setLogoDataUrl] = useState("");
  const [result, setResult] = useState<ApkBuildResponse | null>(null);

  const selectLogo = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setLogoDataUrl(String(reader.result));
    reader.readAsDataURL(file);
  };

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setResult(await api.buildApk({ serverUrl, enrollmentToken, deviceName, appName, redirectUrl, logoDataUrl }));
  };

  return (
    <section className="builder-layout">
      <form className="panel settings-grid" onSubmit={submit}>
        <h2>Gerar APK / WebApp</h2>
        <label>
          Nome do APK
          <input value={appName} onChange={(event) => setAppName(event.target.value)} />
        </label>
        <label>
          URL do site/PWA apos instalar
          <input value={redirectUrl} onChange={(event) => setRedirectUrl(event.target.value)} placeholder="https://seusite.com" />
        </label>
        <label>
          URL do servidor
          <input value={serverUrl} onChange={(event) => setServerUrl(event.target.value)} />
        </label>
        <label>
          Token de pareamento
          <input value={enrollmentToken} onChange={(event) => setEnrollmentToken(event.target.value)} />
        </label>
        <label>
          Nome do aparelho
          <input value={deviceName} onChange={(event) => setDeviceName(event.target.value)} />
        </label>
        <label>
          Logo do APK
          <input type="file" accept="image/png,image/jpeg,image/webp" onChange={selectLogo} />
        </label>
        {logoDataUrl ? <img className="logo-preview" src={logoDataUrl} alt="Logo selecionado" /> : null}
        <button className="primary" type="submit">Gerar</button>
        <small>Nome/logo entram na configuracao do WebApp. Para trocar icone/nome nativos instalados, gere uma build Android assinada personalizada.</small>
      </form>
      {result ? (
        <aside className="panel qr-panel">
          <h2>{result.apkName}</h2>
          <QRCodeSVG value={result.qrPayload} size={180} />
          <a className="primary link-button" href={`${api.baseUrl}${result.downloadUrl}`}>Baixar APK</a>
          {result.note ? <small>{result.note}</small> : null}
          <small>SHA256: {result.sha256}</small>
        </aside>
      ) : null}
    </section>
  );
}
