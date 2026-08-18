import { FormEvent, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import type { ApkBuildResponse } from "@droidview/shared";
import { api } from "../api";

export function ApkBuilder() {
  const [serverUrl, setServerUrl] = useState(api.baseUrl);
  const [enrollmentToken, setEnrollmentToken] = useState(`enroll-${Date.now()}`);
  const [deviceName, setDeviceName] = useState("Novo aparelho");
  const [result, setResult] = useState<ApkBuildResponse | null>(null);

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    setResult(await api.buildApk({ serverUrl, enrollmentToken, deviceName }));
  };

  return (
    <section className="builder-layout">
      <form className="panel settings-grid" onSubmit={submit}>
        <h2>Gerar pacote de pareamento</h2>
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
        <button className="primary" type="submit">Gerar</button>
      </form>
      {result ? (
        <aside className="panel qr-panel">
          <h2>{result.apkName}</h2>
          <QRCodeSVG value={result.qrPayload} size={180} />
          <a className="primary link-button" href={`${api.baseUrl}${result.downloadUrl}`}>Baixar APK MVP</a>
          <small>SHA256: {result.sha256}</small>
        </aside>
      ) : null}
    </section>
  );
}
