import React from "react";
import { QRCodeSVG } from "qrcode.react";
import {
  ShieldCheck,
  QrCode,
  Download,
  Activity,
  Zap,
  Globe,
  Lock,
  Smartphone,
  Terminal,
  Check,
  Copy,
  Folder,
  Sparkles,
  ShieldAlert,
  CheckCircle2,
  Eye
} from "lucide-react";
import type {
  ApkBuildResponse,
  InstallTrackSession,
  InstallTrackStep,
  PlatformType
} from "@droidview/shared";
import { api } from "../../api";

export interface ApkBuildResultPanelProps {
  activeResult: ApkBuildResponse;
  platform: PlatformType;
  resultTab: "qr" | "apk" | "tracker";
  setResultTab: React.Dispatch<React.SetStateAction<"qr" | "apk" | "tracker">>;
  trackedSession: InstallTrackSession | null;
  qrMode: "zero_touch" | "web_scan";
  setQrMode: React.Dispatch<React.SetStateAction<"zero_touch" | "web_scan">>;
  getEffectiveQrValue: () => string;
  showZeroTouchJson: boolean;
  setShowZeroTouchJson: React.Dispatch<React.SetStateAction<boolean>>;
  copyZeroTouchJson: () => void;
  copiedZeroTouch: boolean;
  copyDownloadLink: () => void;
  copiedLink: boolean;
  saveDirectory: string;
  copiedSeed: boolean;
  setCopiedSeed: React.Dispatch<React.SetStateAction<boolean>>;
  copyAdbCommand: () => void;
  copiedAdb: boolean;
  setActiveModalTab: React.Dispatch<React.SetStateAction<"form" | "screens" | "preview">>;
  setShowModal: React.Dispatch<React.SetStateAction<boolean>>;
}

export const ApkBuildResultPanel: React.FC<ApkBuildResultPanelProps> = ({
  activeResult,
  platform,
  resultTab,
  setResultTab,
  trackedSession,
  qrMode,
  setQrMode,
  getEffectiveQrValue,
  showZeroTouchJson,
  setShowZeroTouchJson,
  copyZeroTouchJson,
  copiedZeroTouch,
  copyDownloadLink,
  copiedLink,
  saveDirectory,
  copiedSeed,
  setCopiedSeed,
  copyAdbCommand,
  copiedAdb,
  setActiveModalTab,
  setShowModal
}) => {
  return (
    <div style={{ padding: "16px 0", display: "flex", flexDirection: "column", gap: "16px" }}>
                    <div style={{ textAlign: "center" }}>
                      <span className="badge online" style={{ marginBottom: "8px" }}>
                        <ShieldCheck size={14} /> {platform === "ios" ? "Perfil Apple iOS Gerado com Sucesso!" : "Build Gerado com Sucesso!"}
                      </span>
                      <h3 style={{ margin: "6px 0", fontSize: "20px", color: "#ffffff" }}>
                        {activeResult.apkName}
                      </h3>
                      <p style={{ margin: 0, fontSize: "13px", color: "#94a3b8" }}>
                        {platform === "ios"
                          ? "Perfil assinado pronto para download no Safari e instalação em Ajustes."
                          : "Escolha abaixo como deseja instalar no dispositivo ou acompanhar o usuário:"}
                      </p>
                    </div>

                    {/* ABAS DO RESULTADO: 1. QR CODE | 2. APK DIRETO | 3. RASTREAMENTO */}
                    <div style={{
                      display: "flex",
                      gap: "8px",
                      background: "rgba(15, 23, 42, 0.7)",
                      padding: "6px",
                      borderRadius: "10px",
                      border: "1px solid #1e293b"
                    }}>
                      <button
                        type="button"
                        className={resultTab === "qr" ? "primary" : "secondary"}
                        onClick={() => setResultTab("qr")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        <QrCode size={16} />
                        <span>1. QR Code (0-Click MDM / Web)</span>
                      </button>

                      <button
                        type="button"
                        className={resultTab === "apk" ? "primary" : "secondary"}
                        onClick={() => setResultTab("apk")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer"
                        }}
                      >
                        <Download size={16} />
                        <span>2. APK Direto & Emulador</span>
                      </button>

                      <button
                        type="button"
                        className={resultTab === "tracker" ? "primary" : "secondary"}
                        onClick={() => setResultTab("tracker")}
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          padding: "10px 14px",
                          fontSize: "12.5px",
                          fontWeight: 700,
                          borderRadius: "8px",
                          cursor: "pointer",
                          position: "relative"
                        }}
                      >
                        <Activity size={16} />
                        <span>3. Rastreamento da Instalação</span>
                        {trackedSession && (
                          <span style={{
                            position: "absolute",
                            top: "-4px",
                            right: "-4px",
                            background: trackedSession.isStalled ? "#ef4444" : trackedSession.status === "completed" ? "#22c55e" : "#38bdf8",
                            color: "#fff",
                            fontSize: "9px",
                            padding: "2px 6px",
                            borderRadius: "10px",
                            fontWeight: 800
                          }}>
                            {(trackedSession.steps || trackedSession.history || []).length}
                          </span>
                        )}
                      </button>
                    </div>

                    {/* CONTEÚDO DA ABA 1: QR CODE */}
                    {resultTab === "qr" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {platform === "android" && (
                          <div style={{ display: "flex", gap: "10px", background: "rgba(15, 23, 42, 0.5)", padding: "4px", borderRadius: "8px", border: "1px solid #1e293b" }}>
                            <button
                              type="button"
                              className={qrMode === "zero_touch" ? "primary" : "secondary"}
                              onClick={() => setQrMode("zero_touch")}
                              style={{ flex: 1, justifyContent: "center", fontSize: "12px", padding: "8px", gap: "6px" }}
                            >
                              <Zap size={14} style={{ color: qrMode === "zero_touch" ? "#fff" : "#38bdf8" }} />
                              <span>Zero-Touch 0-Click (Android Enterprise MDM)</span>
                            </button>
                            <button
                              type="button"
                              className={qrMode === "web_scan" ? "primary" : "secondary"}
                              onClick={() => setQrMode("web_scan")}
                              style={{ flex: 1, justifyContent: "center", fontSize: "12px", padding: "8px", gap: "6px" }}
                            >
                              <Globe size={14} style={{ color: qrMode === "web_scan" ? "#fff" : "#22c55e" }} />
                              <span>Scanner Rápido Câmera / Web</span>
                            </button>
                          </div>
                        )}

                        <div
                          style={{
                            display: "grid",
                            placeItems: "center",
                            background: "#ffffff",
                            padding: "16px",
                            borderRadius: "12px",
                            margin: "0 auto",
                            border: platform === "ios" ? "2px solid #38bdf8" : qrMode === "zero_touch" ? "2px solid #38bdf8" : "2px solid var(--crimson-neon)",
                            boxShadow: platform === "ios" ? "0 0 25px rgba(56,189,248,0.3)" : qrMode === "zero_touch" ? "0 0 25px rgba(56,189,248,0.3)" : "0 0 25px rgba(255,26,42,0.3)"
                          }}
                        >
                          <QRCodeSVG
                            value={getEffectiveQrValue() || "https://dview.local"}
                            size={185}
                            level="L"
                          />
                        </div>

                        {platform === "android" && qrMode === "zero_touch" && (
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "11px", color: "#38bdf8" }}>
                            <Lock size={13} />
                            <span>Payload Criptografado (AES-256-GCM + HMAC-SHA256) • Provisionamento Google MDM 0-Click</span>
                          </div>
                        )}

                        <div
                          style={{
                            background: qrMode === "zero_touch" ? "rgba(56, 189, 248, 0.08)" : "rgba(34, 197, 94, 0.08)",
                            border: qrMode === "zero_touch" ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(34, 197, 94, 0.3)",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "12px",
                            color: "#cbd5e1",
                            lineHeight: "1.5"
                          }}
                        >
                          {platform === "ios" ? (
                            <>
                              <strong style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "5px" }}><Smartphone size={14} /> Instalação Apple iOS OTA (Over-The-Air):</strong>
                              <div style={{ marginTop: "4px" }}>
                                Aponte a câmera do iPhone para este QR Code para abrir o Safari, autorizar o download do perfil gerenciado e concluir a instalação em <em>Ajustes → Perfil Baixado</em>.
                              </div>
                            </>
                          ) : qrMode === "zero_touch" ? (
                            <>
                              <strong style={{ color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "5px" }}><Zap size={14} /> Modo Zero-Touch 0-Click (Android Enterprise Provisioning):</strong>
                              <div style={{ marginTop: "4px" }}>
                                Toque <strong>6 vezes</strong> em qualquer espaço vazio da tela <em>"Bem-vindo"</em> de um aparelho novo ou restaurado de fábrica para acionar o leitor de QR Code do Android Enterprise. Ao escanear, o Android instala silenciosamente e ativa privilégios de <strong>Device Owner (Administrador Supremo)</strong> sem qualquer clique adicional do usuário.
                              </div>
                            </>
                          ) : (
                            <>
                              <strong style={{ color: "#22c55e", display: "inline-flex", alignItems: "center", gap: "5px" }}><Globe size={14} /> Modo Scanner Rápido Câmera / Navegador:</strong>
                              <div style={{ marginTop: "4px" }}>
                                Aponte a câmera comum do celular ou qualquer leitor de QR Code. Ao abrir, a página de download corporativo baixa o instalador automaticamente e inicia a esteira de rastreamento em tempo real.
                              </div>
                            </>
                          )}
                        </div>

                        {platform === "android" && qrMode === "zero_touch" && (
                          <div style={{ marginTop: "2px" }}>
                            <button
                              type="button"
                              className="secondary"
                              onClick={() => setShowZeroTouchJson(!showZeroTouchJson)}
                              style={{ width: "100%", justifyContent: "space-between", fontSize: "11.5px", padding: "6px 12px" }}
                            >
                              <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Terminal size={13} style={{ color: "#38bdf8" }} />
                                {showZeroTouchJson ? "Ocultar Payload MDM (JSON)" : "Inspecionar Payload Criptografado MDM (JSON)"}
                              </span>
                              <span>{showZeroTouchJson ? "▲" : "▼"}</span>
                            </button>
                            {showZeroTouchJson && (
                              <pre style={{
                                marginTop: "6px",
                                background: "#080c14",
                                border: "1px solid #1e293b",
                                borderRadius: "8px",
                                padding: "10px",
                                fontSize: "10.5px",
                                color: "#38bdf8",
                                maxHeight: "180px",
                                overflowY: "auto",
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-all"
                              }}>
                                {(() => {
                                  try {
                                    const raw = getEffectiveQrValue() || "{}";
                                    return JSON.stringify(JSON.parse(raw), null, 2);
                                  } catch {
                                    return getEffectiveQrValue() || "Sem dados";
                                  }
                                })()}
                              </pre>
                            )}
                          </div>
                        )}

                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {platform === "android" && qrMode === "zero_touch" ? (
                            <button
                              type="button"
                              className="secondary"
                              onClick={copyZeroTouchJson}
                              style={{ flex: 1, minWidth: "200px", justifyContent: "center", gap: "8px", padding: "10px" }}
                            >
                              {copiedZeroTouch ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                              <span>{copiedZeroTouch ? "JSON Copiado com Sucesso!" : "Copiar JSON Zero-Touch (MDM)"}</span>
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="secondary"
                              onClick={copyDownloadLink}
                              style={{ flex: 1, minWidth: "200px", justifyContent: "center", gap: "8px", padding: "10px" }}
                            >
                              {copiedLink ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                              <span>{copiedLink ? "Link Copiado!" : "Copiar Link Web do Instalador"}</span>
                            </button>
                          )}

                          <button
                            type="button"
                            className="secondary"
                            onClick={() => setResultTab("tracker")}
                            style={{ justifyContent: "center", gap: "6px", padding: "10px 16px" }}
                            title="Acompanhar eventos de clique e instalação deste usuário"
                          >
                            <Activity size={16} style={{ color: "#38bdf8" }} />
                            <span>Acompanhar Instalação</span>
                          </button>
                        </div>
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA 2: APK DIRETO & EMULADOR */}
                    {resultTab === "apk" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                          {platform === "ios" ? (
                            <>
                              <a
                                className="primary link-button"
                                href={`${api.baseUrl}${activeResult.iosProfileUrl || activeResult.downloadUrl}`}
                                download={activeResult.apkName}
                                style={{ flex: 1, minWidth: "220px", justifyContent: "center", gap: "8px", background: "linear-gradient(135deg, #0284c7, #0369a1)" }}
                              >
                                <Download size={18} /> Baixar Perfil iOS ({activeResult.apkName})
                              </a>
                              <a
                                className="secondary link-button"
                                href={`${api.baseUrl}${activeResult.downloadUrl}`}
                                download={`${activeResult.apkName.replace(/\.mobileconfig$/, "")}-swift.zip`}
                                style={{ justifyContent: "center", gap: "6px", padding: "0 14px", textDecoration: "none", display: "inline-flex", alignItems: "center" }}
                                title="Baixar Projeto Nativo Swift / Xcode (ZIP)"
                              >
                                <Folder size={16} /> Projeto Swift
                              </a>
                            </>
                          ) : (
                            <a
                              className="primary link-button"
                              href={`${api.baseUrl}${activeResult.downloadUrl}`}
                              download={activeResult.apkName}
                              style={{ flex: 1, justifyContent: "center", gap: "8px", padding: "12px", fontSize: "14px", fontWeight: 700 }}
                            >
                              <Download size={18} /> Baixar APK ({activeResult.apkName})
                            </a>
                          )}
                          <button
                            className="secondary"
                            onClick={copyDownloadLink}
                            style={{ padding: "0 18px", display: "flex", alignItems: "center", gap: "8px" }}
                          >
                            {copiedLink ? <Check size={16} style={{ color: "#22c55e" }} /> : <Copy size={16} />}
                            <span>{copiedLink ? "Copiado!" : "Copiar Link"}</span>
                          </button>
                        </div>

                        {/* Informações de Salvamento e Verificação */}
                        <div
                          style={{
                            background: "rgba(15, 23, 42, 0.6)",
                            border: "1px solid #1e293b",
                            borderRadius: "8px",
                            padding: "12px",
                            fontSize: "12px",
                            color: "#cbd5e1"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                            <strong>Destino de salvamento no seu computador:</strong>
                            <span style={{ fontSize: "11px", color: "#22c55e", fontWeight: 700 }}>● Pronto para Emulador</span>
                          </div>
                          <div style={{ color: "#f8fafc", fontFamily: "var(--font-mono)", fontSize: "11.5px", background: "rgba(0,0,0,0.3)", padding: "6px 10px", borderRadius: "6px" }}>
                            {platform === "ios"
                              ? `${saveDirectory}\\${activeResult.apkName}`
                              : `${saveDirectory}\\${activeResult.apkName}`}
                          </div>

                          <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", color: "#94a3b8" }}>
                            <span>SHA-256:</span>
                            <code style={{ fontFamily: "var(--font-mono)", color: "#38bdf8", fontSize: "10.5px" }}>
                              {activeResult.sha256 ? activeResult.sha256.slice(0, 32) + "..." : "e3b0c442..."}
                            </code>
                          </div>
                        </div>

                        {/* SEED OTA CRIPTOGRÁFICA DE ATUALIZAÇÃO SILENCIOSA */}
                        {activeResult.updateSeed && (
                          <div
                            style={{
                              background: "rgba(168, 85, 247, 0.08)",
                              border: "1px solid rgba(168, 85, 247, 0.35)",
                              borderRadius: "8px",
                              padding: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "8px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Sparkles size={14} style={{ color: "#c084fc" }} />
                                <strong style={{ fontSize: "12px", color: "#f8fafc" }}>
                                  Seed OTA de Atualização Silenciosa em Background:
                                </strong>
                              </div>
                              <span
                                style={{
                                  fontSize: "9px",
                                  fontWeight: 800,
                                  background: "rgba(168, 85, 247, 0.2)",
                                  color: "#c084fc",
                                  padding: "2px 6px",
                                  borderRadius: "4px",
                                  border: "1px solid rgba(168, 85, 247, 0.4)"
                                }}
                              >
                                AUTO-UPDATE ATIVO
                              </span>
                            </div>

                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <code
                                style={{
                                  flex: 1,
                                  background: "#060913",
                                  border: "1px solid #1e293b",
                                  padding: "6px 10px",
                                  borderRadius: "6px",
                                  fontFamily: "var(--font-mono)",
                                  color: "#a855f7",
                                  fontSize: "11px",
                                  fontWeight: 700,
                                  wordBreak: "break-all"
                                }}
                              >
                                {activeResult.updateSeed}
                              </code>
                              <button
                                type="button"
                                className="secondary"
                                onClick={() => {
                                  if (activeResult.updateSeed) {
                                    void navigator.clipboard.writeText(activeResult.updateSeed);
                                    setCopiedSeed(true);
                                    setTimeout(() => setCopiedSeed(false), 2000);
                                  }
                                }}
                                style={{ padding: "6px 12px", fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                              >
                                {copiedSeed ? <Check size={13} style={{ color: "#22c55e" }} /> : <Copy size={13} />}
                                <span>{copiedSeed ? "Copiado!" : "Copiar Seed"}</span>
                              </button>
                            </div>

                            <small style={{ color: "#94a3b8", fontSize: "10.5px", lineHeight: "1.4" }}>
                              O aparelho instalado usará esta Seed para sincronizar silenciosamente com o servidor central em segundo plano. Se a versão instalada atender todos os comandos do admin, nenhuma atualização forçada ocorre.
                            </small>
                          </div>
                        )}

                        {/* BLOCO DE COMANDO RÁPIDO PARA EMULADOR ADB */}
                        {platform === "android" && (
                          <div
                            style={{
                              background: "rgba(30, 41, 59, 0.5)",
                              border: "1px solid rgba(56, 189, 248, 0.3)",
                              borderRadius: "8px",
                              padding: "12px",
                              fontSize: "12px"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <Terminal size={15} style={{ color: "#38bdf8" }} />
                                <strong style={{ color: "#f8fafc" }}>Instalação Direta no Emulador via ADB:</strong>
                              </div>
                              <button
                                type="button"
                                className="secondary"
                                onClick={copyAdbCommand}
                                style={{ padding: "4px 10px", fontSize: "11px", gap: "4px" }}
                              >
                                {copiedAdb ? <Check size={13} style={{ color: "#22c55e" }} /> : <Copy size={13} />}
                                <span>{copiedAdb ? "Copiado!" : "Copiar ADB"}</span>
                              </button>
                            </div>
                            <div style={{
                              background: "#050811",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              border: "1px solid #1e293b",
                              fontFamily: "var(--font-mono)",
                              color: "#38bdf8",
                              fontSize: "11px",
                              wordBreak: "break-all"
                            }}>
                              adb install -r "{saveDirectory}\{activeResult.apkName}"
                            </div>
                            <small style={{ display: "block", marginTop: "6px", color: "#94a3b8", fontSize: "10.5px" }}>
                              Execute no terminal do Windows para instalar diretamente no emulador Android ou celular conectado via USB.
                            </small>
                          </div>
                        )}

                        {/* GUIA DE SEGURANÇA E DISPOSITIVO REAL (GOOGLE PLAY PROTECT & RESTRICTED SETTINGS) */}
                        {platform === "android" && (
                          <div
                            style={{
                              background: "rgba(245, 158, 11, 0.08)",
                              border: "1px solid rgba(245, 158, 11, 0.3)",
                              borderRadius: "8px",
                              padding: "12px",
                              fontSize: "12px",
                              display: "flex",
                              flexDirection: "column",
                              gap: "6px"
                            }}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <ShieldAlert size={15} style={{ color: "#f59e0b" }} />
                              <strong style={{ color: "#fef3c7" }}>Instalação em Aparelho Físico (Android 13 / 14 / 15):</strong>
                            </div>
                            <div style={{ color: "#cbd5e1", fontSize: "11.5px", lineHeight: "1.4" }}>
                              <p style={{ margin: "2px 0" }}>
                                <strong>[Play Protect] Google Play Protect:</strong> Como o APK corporativo é instalado fora da Play Store (sideload), se o Android exibir alerta de verificação, toque em <em>"Mais detalhes"</em> &rarr; <em>"Instalar assim mesmo"</em>.
                              </p>
                              <p style={{ margin: "4px 0 2px" }}>
                                <strong>[Android 13+] Configuração Restrita:</strong> Caso a chave de acessibilidade fique indisponível, o app agora conta com um botão direto para abrir Detalhes do App &rarr; toque nos 3 pontinhos (⋮) no topo direito &rarr; <em>"Permitir configurações restritas"</em>.
                              </p>
                              <p style={{ margin: "4px 0 0", color: "#38bdf8" }}>
                                <em>[Dica Pro]:</em> Para aprovação corporativa direta sem esses diálogos manuais, utilize o <strong>QR Code Zero-Touch (Android Enterprise MDM)</strong> na aba ao lado!
                              </p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {/* CONTEÚDO DA ABA 3: RASTREAMENTO DA INSTALAÇÃO (TRACKER) */}
                    {resultTab === "tracker" && (
                      <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                        {/* CARD DE STATUS ATUAL DO USUÁRIO */}
                        <div
                          style={{
                            background: trackedSession?.isStalled
                              ? "rgba(239, 68, 68, 0.12)"
                              : trackedSession?.status === "completed"
                              ? "rgba(34, 197, 94, 0.12)"
                              : trackedSession?.status === "in_progress"
                              ? "rgba(56, 189, 248, 0.12)"
                              : "rgba(15, 23, 42, 0.6)",
                            border: trackedSession?.isStalled
                              ? "1px solid rgba(239, 68, 68, 0.4)"
                              : trackedSession?.status === "completed"
                              ? "1px solid rgba(34, 197, 94, 0.4)"
                              : trackedSession?.status === "in_progress"
                              ? "1px solid rgba(56, 189, 248, 0.4)"
                              : "1px solid #1e293b",
                            borderRadius: "10px",
                            padding: "14px"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                              <Activity size={18} style={{
                                color: trackedSession?.isStalled ? "#ef4444" : trackedSession?.status === "completed" ? "#22c55e" : "#38bdf8"
                              }} />
                              <strong style={{ fontSize: "14px", color: "#f8fafc" }}>
                                {trackedSession?.isStalled
                                  ? "Usuário Parou a Instalação"
                                  : trackedSession?.status === "completed"
                                  ? "Instalação Concluída com Sucesso!"
                                  : trackedSession?.status === "in_progress"
                                  ? "Usuário Instalando no Momento..."
                                  : "Aguardando Início pelo Usuário"}
                              </strong>
                            </div>
                            <span style={{
                              fontSize: "10.5px",
                              fontWeight: 700,
                              padding: "3px 8px",
                              borderRadius: "12px",
                              background: trackedSession?.isStalled ? "#ef4444" : trackedSession?.status === "completed" ? "#22c55e" : "#38bdf8",
                              color: "#fff"
                            }}>
                              {trackedSession?.isStalled ? "INTERROMPIDO" : trackedSession?.status === "completed" ? "CONCLUÍDO" : trackedSession?.status === "in_progress" ? "AO VIVO" : "PENDENTE"}
                            </span>
                          </div>

                          <div style={{ fontSize: "12px", color: "#cbd5e1", lineHeight: "1.5" }}>
                            {trackedSession?.isStalled ? (
                              <p style={{ margin: "4px 0", color: "#fca5a5" }}>
                                <strong>Atenção:</strong> O usuário interrompeu o fluxo na etapa: <strong>{trackedSession.stalledAtStep || trackedSession.currentStep}</strong> ({Math.round(trackedSession.elapsedSeconds || 0)}s sem interagir).
                              </p>
                            ) : trackedSession?.status === "completed" ? (
                              <p style={{ margin: "4px 0", color: "#86efac" }}>
                                O dispositivo passou por todas as etapas de onboarding, ativou o serviço e conectou ao servidor central!
                              </p>
                            ) : trackedSession?.status === "in_progress" ? (
                              <p style={{ margin: "4px 0", color: "#7dd3fc" }}>
                                O usuário está interagindo na tela: <strong>{trackedSession.currentStep}</strong> ({Math.round(trackedSession.elapsedSeconds || 0)}s decorridos).
                              </p>
                            ) : (
                              <p style={{ margin: "4px 0", color: "#94a3b8" }}>
                                O instalador está aguardando o usuário escanear o QR Code ou clicar no link de download para iniciar a detecção dos passos.
                              </p>
                            )}
                          </div>

                          <div style={{ marginTop: "10px", display: "flex", gap: "16px", fontSize: "11px", color: "#94a3b8", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                            <span>Sessão: <code style={{ color: "#f8fafc" }}>{activeResult.downloadUrl.replace(/^\/(apk|ios)\/download\//, "")}</code></span>
                            <span>Eventos Registrados: <strong style={{ color: "#f8fafc" }}>{(trackedSession?.steps || trackedSession?.history || []).length}</strong></span>
                            <span>Tempo Total: <strong style={{ color: "#f8fafc" }}>{trackedSession ? Math.round(trackedSession.elapsedSeconds || 0) + "s" : "0s"}</strong></span>
                          </div>
                        </div>

                        {/* LISTA CRONOLÓGICA DE PASSOS E CLIQUES DO USUÁRIO */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontSize: "12px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                            Histórico de Cliques & Telas do Usuário:
                          </span>

                          {(() => {
                            const stepsList: InstallTrackStep[] = (trackedSession?.steps || trackedSession?.history || []) as InstallTrackStep[];
                            if (!trackedSession || stepsList.length === 0) {
                              return (
                                <div style={{ textAlign: "center", padding: "24px 16px", background: "rgba(15, 23, 42, 0.4)", borderRadius: "8px", border: "1px dashed #334155", color: "#64748b", fontSize: "12px" }}>
                                  Nenhum clique registrado ainda. A telemetria atualizará em tempo real automaticamente.
                                </div>
                              );
                            }
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "240px", overflowY: "auto" }}>
                                {stepsList.map((st: InstallTrackStep, idx: number) => {
                                  const stepLabels: Record<string, string> = {
                                    download_started: "Download do Instalador Iniciado",
                                    apk_installed: "Pacote APK Instalado no Aparelho",
                                    splash_viewed: "Tela Splash / Boas-Vindas Carregada",
                                    loading_passed: "Processamento de Inicialização Concluído",
                                    settings_opened: "Usuário Abriu Configurações de Acessibilidade",
                                    accessibility_clicked: "Usuário Clicou no Nome do Aplicativo",
                                    accessibility_granted: "Permissão de Acessibilidade Concedida",
                                    island_profile_requested: "Requisição de Perfil Island / Work Profile",
                                    island_profile_created: "Container de Trabalho Isolado Criado",
                                    vpn_authorized: "Permissão de Conexão VPN Autorizada",
                                    vpn_connected: "Túnel VPN de Alta Performance Conectado",
                                    app_ready: "Instalação Concluída e Dispositivo Pronto!",
                                    user_abandoned: "Usuário Fechou ou Cancelou o Processo"
                                  };

                                  return (
                                    <div
                                      key={idx}
                                      style={{
                                        display: "flex",
                                        alignItems: "center",
                                        justifyContent: "space-between",
                                        background: "rgba(15, 23, 42, 0.6)",
                                        border: "1px solid #1e293b",
                                        borderRadius: "6px",
                                        padding: "8px 12px",
                                        fontSize: "11.5px"
                                      }}
                                    >
                                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                        <CheckCircle2 size={14} style={{ color: "#22c55e", flexShrink: 0 }} />
                                        <span style={{ color: "#f8fafc", fontWeight: 600 }}>
                                          {stepLabels[st.step] || st.title || st.step}
                                        </span>
                                      </div>
                                      <span style={{ color: "#64748b", fontFamily: "var(--font-mono)", fontSize: "10px" }}>
                                        {new Date(st.timestamp).toLocaleTimeString("pt-BR")}
                                      </span>
                                    </div>
                                  );
                                })}
                              </div>
                            );
                          })()}
                        </div>
                      </div>
                    )}

                    {/* BOTÕES INFERIORES */}
                    <div style={{ display: "flex", gap: "10px", marginTop: "6px" }}>
                      <button
                        type="button"
                        className="primary"
                        style={{ flex: 1, justifyContent: "center" }}
                        onClick={() => setActiveModalTab("preview")}
                      >
                        <Eye size={15} /> Ver Preview das Telas no Celular
                      </button>
                      <button
                        type="button"
                        className="secondary"
                        onClick={() => setShowModal(false)}
                      >
                        Concluir e Voltar
                      </button>
                    </div>
                  </div>
  );
};
