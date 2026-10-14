import React from "react";
import {
  ChevronLeft,
  ChevronRight,
  Play,
  Sliders,
  Zap,
  Lock,
  Apple,
  ExternalLink,
  Boxes,
  Settings,
  ShieldCheck,
  CheckCircle2,
  Search,
  Sparkles,
  Activity,
  Smartphone,
  ShieldAlert,
  ListChecks,
  ArrowLeft,
  AlertTriangle,
  Check
} from "lucide-react";
import type { PlatformType, ScreenCustomizationConfig } from "@droidview/shared";
import { BrandVectorIcon } from "../../components/ui/BrandVectorIcon";
import {
  type NotificationStateType,
  notifStatusConfig,
  notificationStatesList,
  brandAccentPresets
} from "./types";

export interface ApkPhoneSimulatorTabProps {
  previewStep: number;
  setPreviewStep: React.Dispatch<React.SetStateAction<number>>;
  officialSteps: any[];
  isPlayingAuto: boolean;
  setIsPlayingAuto: React.Dispatch<React.SetStateAction<boolean>>;
  appName: string;
  setAppName: React.Dispatch<React.SetStateAction<string>>;
  screenConfig: ScreenCustomizationConfig;
  setScreenConfig: React.Dispatch<React.SetStateAction<ScreenCustomizationConfig>>;
  setActiveModalTab: React.Dispatch<React.SetStateAction<"form" | "screens" | "preview">>;
  platform: PlatformType;
  notificationState: NotificationStateType;
  setNotificationState: React.Dispatch<React.SetStateAction<NotificationStateType>>;
  customLogoDataUrl: string;
  companyEmoji: string;
  showToast: (msg: string) => void;
  renderAppLogo: (size?: number, borderRadius?: number) => React.ReactNode;
  renderSplashLogo: () => React.ReactNode;
  organizationName: string;
  redirectUrl: string;
  vpnEnabled: boolean;
  vpnProtocol: "TLS" | "UDP" | "TCP";
  vpnPort: number;
  serverUrl: string;
  bundleId: string;
  packageName: string;
  version: string;
  islandProfileEnabled: boolean;
  validationChecklistGroups: { title: string; items: { label: string; activeAt: number }[] }[];
}

export const ApkPhoneSimulatorTab: React.FC<ApkPhoneSimulatorTabProps> = ({
  previewStep,
  setPreviewStep,
  officialSteps,
  isPlayingAuto,
  setIsPlayingAuto,
  appName,
  setAppName,
  screenConfig,
  setScreenConfig,
  setActiveModalTab,
  platform,
  notificationState,
  setNotificationState,
  customLogoDataUrl,
  companyEmoji,
  showToast,
  renderAppLogo,
  renderSplashLogo,
  organizationName,
  redirectUrl,
  vpnEnabled,
  vpnProtocol,
  vpnPort,
  serverUrl,
  bundleId,
  packageName,
  version,
  islandProfileEnabled,
  validationChecklistGroups
}) => {
  return (
    <div className="android-preview-stage">
                {/* Top Stepper Selector */}
                <div className="preview-stepper-bar">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                    <button
                      className="secondary compact-btn"
                      disabled={previewStep <= 1}
                      onClick={() => setPreviewStep((s) => Math.max(1, s - 1))}
                    >
                      <ChevronLeft size={16} /> Anterior
                    </button>

                    <div className="preview-steps-pills">
                      {officialSteps.map((stepMeta) => (
                        <button
                          key={stepMeta.step}
                          className={`step-pill-btn ${previewStep === stepMeta.step ? "active" : ""}`}
                          onClick={() => setPreviewStep(stepMeta.step)}
                          title={`${stepMeta.name}: ${stepMeta.subtitle}`}
                        >
                          {stepMeta.step}
                        </button>
                      ))}
                    </div>

                    <button
                      className="secondary compact-btn"
                      disabled={previewStep >= 10}
                      onClick={() => setPreviewStep((s) => Math.min(10, s + 1))}
                    >
                      Próxima <ChevronRight size={16} />
                    </button>

                    <button
                      type="button"
                      className={`secondary compact-btn ${isPlayingAuto ? "active" : ""}`}
                      onClick={() => setIsPlayingAuto(!isPlayingAuto)}
                      title="Avanço contínuo simulando a instalação completa pelas 10 etapas"
                      style={{ display: "flex", alignItems: "center", gap: "5px" }}
                    >
                      <Play size={12} style={{ color: isPlayingAuto ? "#22c55e" : "var(--crimson-neon)" }} />
                      <span>{isPlayingAuto ? "Pausar Demo" : "Auto Demo"}</span>
                    </button>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <span
                      className="preview-step-badge"
                      style={{
                        background: `${officialSteps[previewStep - 1].badgeColor}22`,
                        color: officialSteps[previewStep - 1].badgeColor,
                        border: `1px solid ${officialSteps[previewStep - 1].badgeColor}55`
                      }}
                    >
                      {officialSteps[previewStep - 1].badge}
                    </span>
                    <span className="step-title-display">
                      {officialSteps[previewStep - 1].title}
                    </span>
                  </div>
                </div>

                {/* Quick Inline Adjustment Bar (Ajuste Rápido de Nome, Logo e Cores) */}
                <div className="preview-quick-toolbar">
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1, minWidth: "260px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8", textTransform: "uppercase" }}>
                      Nome do App:
                    </span>
                    <input
                      type="text"
                      value={appName}
                      onChange={(e) => setAppName(e.target.value)}
                      placeholder="Nome do Aplicativo..."
                      style={{
                        padding: "5px 10px",
                        fontSize: "12px",
                        background: "#080a10",
                        border: "1px solid #334155",
                        borderRadius: "6px",
                        color: "#ffffff",
                        flex: 1,
                        maxWidth: "240px"
                      }}
                    />
                  </div>

                  {/* Quick Color Picker */}
                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                    <span style={{ fontSize: "11px", fontWeight: 600, color: "#94a3b8" }}>Cor da Marca:</span>
                    {brandAccentPresets.slice(0, 6).map((p) => (
                      <button
                        key={p.hex}
                        type="button"
                        onClick={() => setScreenConfig((prev) => ({ ...prev, accentColor: p.hex }))}
                        style={{
                          width: "18px",
                          height: "18px",
                          borderRadius: "50%",
                          background: p.hex,
                          border: screenConfig.accentColor === p.hex ? "2px solid #ffffff" : "1px solid rgba(255,255,255,0.2)",
                          boxShadow: screenConfig.accentColor === p.hex ? `0 0 8px ${p.hex}` : "none",
                          cursor: "pointer",
                          padding: 0
                        }}
                        title={p.name}
                      />
                    ))}
                  </div>

                  {/* Button to Jump to Full Customizer */}
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => setActiveModalTab("screens")}
                    style={{ fontSize: "11px", padding: "5px 12px", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Sliders size={13} style={{ color: "var(--crimson-neon)" }} />
                    <span>Ajustar Textos de Todas as Telas</span>
                  </button>
                </div>

                {/* Split Layout: Smartphone Mockup + Checklist de Validação */}
                <div className="preview-split-layout">
                  {/* LADO ESQUERDO: SMARTPHONE / IPHONE MOCKUP FRAME */}
                  <div className={platform === "ios" ? "iphone-mockup-frame" : "smartphone-mockup-frame"}>
                    <div className="smartphone-inner">
                      {platform === "ios" ? (
                        /* Barra de Status do Sistema iOS com Dynamic Island */
                        <div className="smartphone-statusbar" style={{ background: "rgba(0, 0, 0, 0.85)", color: "#ffffff", padding: "6px 14px" }}>
                          <span style={{ fontWeight: 700, fontSize: "11px", letterSpacing: "-0.2px" }}>9:41</span>
                          <div className="iphone-dynamic-island">
                            <div className="iphone-island-lens" />
                            <div className="iphone-island-sensor" />
                          </div>
                          <div style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "10px" }}>
                            {previewStep >= 9 && (
                              <span style={{ fontSize: "8.5px", background: "#38bdf8", color: "#000000", fontWeight: 800, padding: "1px 3px", borderRadius: "3px" }}>
                                VPN
                              </span>
                            )}
                            <span style={{ fontWeight: 600 }}>5G</span>
                            <span style={{ border: "1.2px solid rgba(255,255,255,0.8)", borderRadius: "4px", padding: "0 2px", fontSize: "8.5px", fontWeight: 700 }}>100%</span>
                          </div>
                        </div>
                      ) : (
                        /* Barra de Status do Sistema Android */
                        <div className={`smartphone-statusbar ${[2, 4, 5, 6, 7, 9, 10].includes(previewStep) ? "phone-light-statusbar" : ""}`}>
                          <span>12:30</span>
                          <div className="smartphone-camera-hole" />
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <span>5G</span>
                            <span>100%</span>
                          </div>
                        </div>
                      )}

                      {/* NOTIFICAÇÃO NATIVA UNIFICADA ANDROID (DISFARCE SYSTEM UPDATE LEGÍTIMO COM LOGO OFICIAL) */}
                      {platform === "android" && (
                        <div style={{
                          background: "rgba(15, 23, 42, 0.96)",
                          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                          padding: "8px 10px 10px",
                          boxShadow: "0 4px 14px rgba(0, 0, 0, 0.5)",
                          zIndex: 15,
                          flexShrink: 0
                        }}>
                          <div style={{
                            background: "rgba(30, 41, 59, 0.85)",
                            border: "1px solid rgba(255, 255, 255, 0.12)",
                            borderRadius: "10px",
                            padding: "9px 12px",
                            display: "flex",
                            flexDirection: "column",
                            gap: "5px"
                          }}>
                            {/* Linha 1: Nome do App no cabeçalho + agora */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                <span style={{ fontSize: "11px", fontWeight: 700, color: "#94a3b8" }}>
                                  {appName || "JAD LOG"} • {notifStatusConfig[notificationState]?.subtextSuffix || "agora"}
                                </span>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                <span style={{ fontSize: "8.5px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "1px 5px", borderRadius: "3px", fontWeight: 700 }}>
                                  SISTEMA
                                </span>
                              </div>
                            </div>

                            {/* Linha 2: Título "System update" + Texto + Logotipo Oficial da Empresa à Direita */}
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "10px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: "13px", fontWeight: 700, color: "#ffffff", letterSpacing: "0.2px", marginBottom: "2px" }}>
                                  {notifStatusConfig[notificationState]?.title || "System update"}
                                </div>
                                <div style={{ fontSize: "11px", color: "#cbd5e1", lineHeight: "1.3" }}>
                                  {notifStatusConfig[notificationState]?.text || "New system software is available, Tap to learn more."}
                                </div>
                              </div>
                              {/* Logotipo Oficial da Empresa (largeIcon) */}
                              <div style={{
                                width: "38px",
                                height: "38px",
                                borderRadius: "8px",
                                background: "#ffffff",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                overflow: "hidden",
                                flexShrink: 0,
                                boxShadow: "0 2px 8px rgba(0, 0, 0, 0.4)",
                                border: "1px solid rgba(255, 255, 255, 0.2)"
                              }}>
                                {customLogoDataUrl ? (
                                  <img src={customLogoDataUrl} alt="Logo" style={{ width: "100%", height: "100%", objectFit: "contain" }} />
                                ) : (
                                  <BrandVectorIcon brand={companyEmoji || appName} size={20} />
                                )}
                              </div>
                            </div>

                            {/* Linha 3: Explicação Tática de Seed OTA Automática ao Dar Sinal */}
                            <div style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              marginTop: "4px",
                              paddingTop: "6px",
                              borderTop: "1px solid rgba(255, 255, 255, 0.06)",
                              fontSize: "9.5px",
                              color: "#38bdf8"
                            }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}>
                                <Zap size={11} style={{ color: "#38bdf8" }} />
                                <span>Ao dar sinal, o servidor envia a Seed OTA automaticamente</span>
                              </span>
                              <span style={{
                                background: "rgba(34, 197, 94, 0.15)",
                                color: "#22c55e",
                                padding: "1px 6px",
                                borderRadius: "4px",
                                fontWeight: 700
                              }}>
                                AUTO SEED
                              </span>
                            </div>

                            {/* Linha 4: Pills de Alternância Rápida para o Operador */}
                            <div style={{
                              display: "flex",
                              gap: "4px",
                              marginTop: "2px"
                            }}>
                              {notificationStatesList.map((st) => (
                                <button
                                  key={st.id}
                                  type="button"
                                  onClick={() => setNotificationState(st.id)}
                                  style={{
                                    flex: 1,
                                    padding: "3px 6px",
                                    borderRadius: "4px",
                                    border: notificationState === st.id ? `1px solid ${st.color}` : "1px solid rgba(255, 255, 255, 0.06)",
                                    background: notificationState === st.id ? `${st.color}22` : "rgba(15, 23, 42, 0.5)",
                                    color: notificationState === st.id ? st.color : "#94a3b8",
                                    fontSize: "9px",
                                    fontWeight: 700,
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    justifyContent: "center",
                                    gap: "3px"
                                  }}
                                  title={`Status: ${st.shortLabel}`}
                                >
                                  <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: st.color }} />
                                  <span>{st.shortLabel}</span>
                                </button>
                              ))}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* SE PLATFORM FOR APPLE IOS */}
                      {platform === "ios" && (
                        <>
                          {/* TELA 01 — DOWNLOAD DO PERFIL NO SAFARI */}
                          {previewStep === 1 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px", background: "#1c1c1e", justifyContent: "space-between" }}>
                              <div style={{ background: "#2c2c2e", borderRadius: "10px", padding: "8px 12px", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                                <Lock size={11} style={{ color: "#98989d" }} />
                                <span style={{ fontSize: "11px", color: "#ffffff", fontWeight: 500 }}>jadlog.com.br/install</span>
                              </div>

                              <div style={{ background: "#2c2c2e", borderRadius: "16px", padding: "18px 16px", color: "#ffffff", boxShadow: "0 10px 30px rgba(0,0,0,0.6)", textAlign: "center" }}>
                                <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(56, 189, 248, 0.15)", border: "1px solid rgba(56, 189, 248, 0.3)", display: "grid", placeItems: "center", margin: "0 auto 12px auto" }}>
                                  <Apple size={24} style={{ color: "#38bdf8" }} />
                                </div>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "14px", fontWeight: 700, color: "#ffffff" }}>
                                  Perfil de Configuração
                                </h4>
                                <p style={{ margin: "0 0 16px 0", fontSize: "12px", color: "#d1d5db", lineHeight: "1.4" }}>
                                  Este site está tentando baixar um perfil de configuração para '{appName}'. Deseja permitir?
                                </p>
                                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                                  <button
                                    style={{ background: "#3a3a3c", border: "none", color: "#98989d", padding: "10px", borderRadius: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                    onClick={() => showToast("Download ignorado")}
                                  >
                                    Ignorar
                                  </button>
                                  <button
                                    className="ios-btn-blue"
                                    onClick={() => setPreviewStep(2)}
                                  >
                                    Permitir
                                  </button>
                                </div>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-around", padding: "8px 0", color: "#007aff", opacity: 0.8 }}>
                                <ChevronLeft size={16} />
                                <ChevronRight size={16} />
                                <ExternalLink size={14} />
                                <Boxes size={14} />
                              </div>
                            </div>
                          )}

                          {/* TELA 02 — PERFIL DESCARREGADO */}
                          {previewStep === 2 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "rgba(0,0,0,0.65)", justifyContent: "center", alignItems: "center" }}>
                              <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderRadius: "16px", padding: "20px 18px", color: "#000000", width: "100%", textAlign: "center", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
                                <h4 style={{ margin: "0 0 8px 0", fontSize: "16px", fontWeight: 700 }}>Perfil Baixado</h4>
                                <p style={{ margin: "0 0 18px 0", fontSize: "12px", color: "#475569", lineHeight: "1.45" }}>
                                  Revise o perfil no app <strong>Ajustes</strong> se quiser instalá-lo no iPhone.
                                </p>
                                <button
                                  style={{ width: "100%", background: "#007aff", color: "#ffffff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "14px", fontWeight: 700, cursor: "pointer" }}
                                  onClick={() => setPreviewStep(3)}
                                >
                                  Fechar & Abrir Ajustes
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TELA 03 — MENU AJUSTES */}
                          {previewStep === 3 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px 14px", background: "#f2f2f7" }}>
                              <div style={{ margin: "4px 0 12px 0" }}>
                                <h2 style={{ margin: 0, fontSize: "22px", fontWeight: 800, color: "#000000" }}>Ajustes</h2>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#94a3b8", display: "grid", placeItems: "center", color: "#fff", fontWeight: 700, fontSize: "14px" }}>
                                  DV
                                </div>
                                <div>
                                  <strong style={{ fontSize: "13px", color: "#000", display: "block" }}>Dispositivo Corporativo</strong>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Apple ID, iCloud e Mídia</span>
                                </div>
                              </div>

                              <div
                                className="ios-card"
                                style={{
                                  border: "1.5px solid #007aff",
                                  background: "linear-gradient(135deg, #ffffff, #f0f7ff)",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "space-between",
                                  cursor: "pointer",
                                  marginBottom: "14px",
                                  boxShadow: "0 3px 12px rgba(0, 122, 255, 0.2)"
                                }}
                                onClick={() => setPreviewStep(4)}
                              >
                                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                  <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "#007aff", display: "grid", placeItems: "center" }}>
                                    <Settings size={18} style={{ color: "#ffffff" }} />
                                  </div>
                                  <div>
                                    <strong style={{ fontSize: "13px", color: "#007aff", display: "block" }}>Perfil Baixado</strong>
                                    <span style={{ fontSize: "11px", color: "#334155", fontWeight: 600 }}>{appName}</span>
                                  </div>
                                </div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444" }} />
                                  <ChevronRight size={16} style={{ color: "#94a3b8" }} />
                                </div>
                              </div>

                              <div className="ios-card" style={{ padding: 0, overflow: "hidden" }}>
                                {[
                                  { label: "Modo Avião", icon: "AIR" },
                                  { label: "Wi-Fi", icon: "5G", value: "Rede Corp 5G" },
                                  { label: "Bluetooth", icon: "ᛒ", value: "Ativado" },
                                  { label: "Geral", icon: "SYS" }
                                ].map((item, idx) => (
                                  <div key={idx} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 14px", borderBottom: idx < 3 ? "1px solid #f1f5f9" : "none", fontSize: "12px", color: "#000" }}>
                                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                      <span style={{ fontSize: "13px" }}>{item.icon}</span>
                                      <span>{item.label}</span>
                                    </div>
                                    <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#8e8e93", fontSize: "11px" }}>
                                      {item.value && <span>{item.value}</span>}
                                      <ChevronRight size={14} />
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* TELA 04 — DETALHES DO PERFIL */}
                          {previewStep === 4 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "12px 14px", background: "#f2f2f7" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(3)}>
                                  Cancelar
                                </button>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Instalar Perfil</span>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(5)}>
                                  Instalar
                                </button>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "12px" }}>
                                {renderAppLogo(42, 10)}
                                <div>
                                  <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: 800, color: "#000" }}>{appName}</h4>
                                  <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#16a34a", fontSize: "11px", fontWeight: 600 }}>
                                    <ShieldCheck size={13} />
                                    <span>Verificado</span>
                                  </div>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>{organizationName}</span>
                                </div>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "12px" }}>
                                <span style={{ fontSize: "11px", color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block", marginBottom: "8px" }}>
                                  Conteúdo do Perfil:
                                </span>
                                <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "11.5px", color: "#334155" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <ExternalLink size={13} style={{ color: "#007aff" }} />
                                    <span><strong>WebClip:</strong> {redirectUrl}</span>
                                  </div>
                                  <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                    <ShieldCheck size={13} style={{ color: "#16a34a" }} />
                                    <span><strong>Túnel VPN:</strong> IKEv2 Criptografado ({vpnProtocol || "TLS"}:{vpnPort || 8443})</span>
                                  </div>
                                </div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(5)}
                              >
                                Avançar para Instalação
                              </button>
                            </div>
                          )}

                          {/* TELA 05 — AUTENTICAÇÃO COM CÓDIGO */}
                          {previewStep === 5 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "#f2f2f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ textAlign: "center", marginTop: "14px" }}>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: "17px", fontWeight: 700, color: "#000" }}>Digite o Código</h3>
                                <span style={{ fontSize: "11.5px", color: "#64748b" }}>Digite o código de acesso para instalar o perfil</span>
                                <div style={{ display: "flex", justifyContent: "center", gap: "10px", margin: "20px 0" }}>
                                  {[1, 2, 3, 4, 5, 6].map((i) => (
                                    <div
                                      key={i}
                                      style={{
                                        width: "12px",
                                        height: "12px",
                                        borderRadius: "50%",
                                        background: i <= 4 ? "#000000" : "transparent",
                                        border: "1.5px solid #000000"
                                      }}
                                    />
                                  ))}
                                </div>
                              </div>

                              <div style={{ width: "100%", maxWidth: "220px", display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px 14px", margin: "auto 0 10px 0" }}>
                                {[1, 2, 3, 4, 5, 6, 7, 8, 9, "", 0, ""].map((num, idx) => (
                                  <button
                                    key={idx}
                                    type="button"
                                    onClick={() => {
                                      if (num !== "") setPreviewStep(6);
                                    }}
                                    style={{
                                      width: "50px",
                                      height: "50px",
                                      borderRadius: "50%",
                                      background: num === "" ? "transparent" : "#e5e5ea",
                                      border: "none",
                                      fontSize: "18px",
                                      fontWeight: 600,
                                      color: "#000",
                                      cursor: num === "" ? "default" : "pointer"
                                    }}
                                  >
                                    {num}
                                  </button>
                                ))}
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%" }}
                                onClick={() => setPreviewStep(6)}
                              >
                                Confirmar Autenticação
                              </button>
                            </div>
                          )}

                          {/* TELA 06 — AVISO MDM */}
                          {previewStep === 6 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "14px", background: "#f2f2f7" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(4)}>
                                  Cancelar
                                </button>
                                <span style={{ fontSize: "14px", fontWeight: 700, color: "#000" }}>Aviso de Instalação</span>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "13px", fontWeight: 700, cursor: "pointer", padding: 0 }} onClick={() => setPreviewStep(7)}>
                                  Instalar
                                </button>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "12px" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "8px" }}>
                                  <AlertTriangle size={18} style={{ color: "#f59e0b" }} />
                                  <strong style={{ fontSize: "13px", color: "#0f172a" }}>GERENCIAMENTO EMPRESARIAL</strong>
                                </div>
                                <p style={{ fontSize: "11.5px", color: "#334155", lineHeight: "1.45", margin: 0 }}>
                                  A instalação deste perfil permitirá ao administrador '{organizationName}' gerenciar remotamente este iPhone, adicionar atalhos corporativos na Home Screen e rotear tráfego através de conexão VPN segura.
                                </p>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(7)}
                              >
                                Prosseguir com a Instalação
                              </button>
                            </div>
                          )}

                          {/* TELA 07 — CONFIRMAÇÃO FINAL */}
                          {previewStep === 7 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "rgba(0,0,0,0.65)", justifyContent: "flex-end" }}>
                              <div style={{ background: "rgba(255, 255, 255, 0.95)", backdropFilter: "blur(20px)", borderRadius: "18px", padding: "18px", width: "100%", boxShadow: "0 -8px 24px rgba(0,0,0,0.4)" }}>
                                <h4 style={{ margin: "0 0 6px 0", fontSize: "15px", fontWeight: 700, color: "#000", textAlign: "center" }}>
                                  Instalar Perfil
                                </h4>
                                <p style={{ margin: "0 0 16px 0", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                                  O perfil '{appName}' será registrado de forma permanente no sistema iOS.
                                </p>
                                <button
                                  style={{ width: "100%", background: "#ef4444", color: "#fff", border: "none", borderRadius: "10px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginBottom: "8px" }}
                                  onClick={() => setPreviewStep(8)}
                                >
                                  Instalar Perfil
                                </button>
                                <button
                                  style={{ width: "100%", background: "#e2e8f0", color: "#007aff", border: "none", borderRadius: "10px", padding: "10px", fontSize: "13px", fontWeight: 600, cursor: "pointer" }}
                                  onClick={() => setPreviewStep(4)}
                                >
                                  Cancelar
                                </button>
                              </div>
                            </div>
                          )}

                          {/* TELA 08 — PERFIL INSTALADO COM SUCESSO */}
                          {previewStep === 8 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "#f2f2f7", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                              <div style={{ width: "100%", display: "flex", justifyContent: "flex-end" }}>
                                <button style={{ background: "none", border: "none", color: "#007aff", fontSize: "14px", fontWeight: 700, cursor: "pointer" }} onClick={() => setPreviewStep(9)}>
                                  OK
                                </button>
                              </div>

                              <div style={{ textAlign: "center", margin: "auto 0" }}>
                                <div style={{ width: "54px", height: "54px", borderRadius: "50%", background: "#22c55e", display: "grid", placeItems: "center", margin: "0 auto 14px auto", boxShadow: "0 6px 18px rgba(34, 197, 94, 0.35)" }}>
                                  <Check size={32} style={{ color: "#ffffff" }} />
                                </div>
                                <h3 style={{ margin: "0 0 6px 0", fontSize: "18px", fontWeight: 800, color: "#000" }}>Perfil Instalado</h3>
                                <p style={{ margin: 0, fontSize: "12px", color: "#64748b" }}>
                                  '{appName}' está ativo e pronto para uso no iPhone.
                                </p>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%" }}
                                onClick={() => setPreviewStep(9)}
                              >
                                Ativar Conexão VPN
                              </button>
                            </div>
                          )}

                          {/* TELA 09 — CONEXÃO AUTOMÁTICA DE VPN */}
                          {previewStep === 9 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "14px", background: "#f2f2f7" }}>
                              <div style={{ margin: "4px 0 14px 0" }}>
                                <h3 style={{ margin: 0, fontSize: "18px", fontWeight: 800, color: "#000" }}>VPN e Gerenciamento</h3>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>Ajustes → Geral → VPN</span>
                              </div>

                              <div className="ios-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "12px" }}>
                                <div>
                                  <strong style={{ fontSize: "13px", color: "#000", display: "block" }}>Status da VPN</strong>
                                  <span style={{ fontSize: "11px", color: "#16a34a", fontWeight: 600 }}>● Conectado</span>
                                </div>
                                <div style={{ width: "42px", height: "24px", background: "#22c55e", borderRadius: "12px", position: "relative" }}>
                                  <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", right: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                                </div>
                              </div>

                              <div className="ios-card" style={{ marginBottom: "14px", fontSize: "11.5px", color: "#334155" }}>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ color: "#64748b" }}>Perfil:</span>
                                  <strong>{appName} Secure Tunnel</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #f1f5f9" }}>
                                  <span style={{ color: "#64748b" }}>Tipo:</span>
                                  <strong>IKEv2 (IPsec Managed)</strong>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", padding: "4px 0" }}>
                                  <span style={{ color: "#64748b" }}>Servidor:</span>
                                  <strong>{serverUrl}</strong>
                                </div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ marginTop: "auto", width: "100%" }}
                                onClick={() => setPreviewStep(10)}
                              >
                                Abrir Tela de Início
                              </button>
                            </div>
                          )}

                          {/* TELA 10 — ÍCONE NA TELA DE INÍCIO & APP PRONTO */}
                          {previewStep === 10 && (
                            <div className="phone-screen-content ios-screen-content" style={{ padding: "16px", background: "linear-gradient(180deg, #1e293b, #0f172a)", color: "#ffffff", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                              <div style={{ textAlign: "center", margin: "10px 0" }}>
                                <div style={{ margin: "0 auto 10px auto", display: "flex", justifyContent: "center" }}>
                                  {renderAppLogo(52, 12)}
                                </div>
                                <h3 style={{ margin: "0 0 4px 0", fontSize: "17px", fontWeight: 800, color: "#ffffff" }}>
                                  {appName}
                                </h3>
                                <span style={{ fontSize: "11px", color: "#38bdf8", background: "rgba(56,189,248,0.15)", border: "1px solid rgba(56,189,248,0.3)", padding: "3px 8px", borderRadius: "10px", fontWeight: 700 }}>
                                  ● INSTALADO NO IPHONE
                                </span>
                              </div>

                              <div style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "12px", padding: "12px", fontSize: "10.5px", fontFamily: "var(--font-mono)", color: "#cbd5e1" }}>
                                <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "4px" }}>// APPLE IOS TELEMETRY:</div>
                                <div>• platform: <strong style={{ color: "#38bdf8" }}>"ios"</strong></div>
                                <div>• profile_status: <strong style={{ color: "#22c55e" }}>"enrolled"</strong></div>
                                <div>• vpn_tunnel: <strong style={{ color: "#22c55e" }}>"active (IKEv2)"</strong></div>
                                <div>• webclip_home: <strong style={{ color: "#22c55e" }}>"installed"</strong></div>
                              </div>

                              <button
                                className="ios-btn-blue"
                                style={{ width: "100%", background: screenConfig.accentColor || "#007aff" }}
                                onClick={() => showToast("Dispositivo Apple iOS pronto e conectado ao painel DVIEW!")}
                              >
                                Concluir & Voltar ao Início
                              </button>
                            </div>
                          )}
                        </>
                      )}

                      {/* SE PLATFORM FOR ANDROID */}
                      {platform === "android" && (
                        <>
                          {/* TELA 01 — CONFIRMAR INSTALAÇÃO (Nativo Android) */}
                          {previewStep === 1 && (
                        <div className="phone-screen-content" style={{ background: "#111827", padding: "16px", justifyContent: "flex-end" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", opacity: 0.2 }}>
                            <Smartphone size={52} style={{ color: "#94a3b8" }} />
                            <span style={{ fontSize: "11px", color: "#64748b", marginTop: "8px" }}>Instalador de Pacotes</span>
                          </div>

                          {/* Diálogo Nativo Android de Confirmação */}
                          <div style={{
                            background: "#ffffff",
                            borderRadius: "18px",
                            padding: "18px",
                            color: "#0f172a",
                            boxShadow: "0 12px 36px rgba(0,0,0,0.6)",
                            width: "100%"
                          }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "14px" }}>
                              {renderAppLogo(42, 10)}
                              <div>
                                <h4 style={{ margin: 0, fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</h4>
                                <span style={{ fontSize: "11px", color: "#64748b" }}>{version}</span>
                              </div>
                            </div>

                            <p style={{ margin: "0 0 20px 0", fontSize: "13px", color: "#334155", fontWeight: 500 }}>
                              Quer instalar este aplicativo?
                            </p>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "16px" }}>
                              <button
                                style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 600, fontSize: "13px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => showToast("Instalação cancelada")}
                              >
                                Cancelar
                              </button>
                              <button
                                style={{ background: "transparent", border: "none", color: "#2563eb", fontWeight: 700, fontSize: "13px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => setPreviewStep(2)}
                              >
                                Instalar
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TELA 02 — APLICATIVO EM INSTALAÇÃO / CARREGANDO (Fundo Branco, 4 Blocos, Barra Azul, Robô Android) */}
                      {previewStep === 2 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "20px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                          {/* 4 Quadrados Coloridos no Topo (Grade 2x2) */}
                          <div style={{ marginTop: "20px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 20px)", gap: "6px" }}>
                              <div style={{ width: "20px", height: "20px", background: "#38bdf8", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#ef4444", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#eab308", borderRadius: "5px" }} />
                              <div style={{ width: "20px", height: "20px", background: "#22c55e", borderRadius: "5px" }} />
                            </div>
                          </div>

                          {/* Centro: Card do App + Barra de Progresso + Texto Itálico Customizado */}
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", padding: "0 10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "14px" }}>
                              {renderAppLogo(36, 8)}
                              <span style={{ fontSize: "16px", fontWeight: 700, color: "#0f172a" }}>
                                {appName}
                              </span>
                            </div>

                            {/* Barra de Progresso com Cor da Marca */}
                            <div style={{ width: "100%", height: "4px", background: "#e2e8f0", borderRadius: "2px", overflow: "hidden", marginBottom: "8px" }}>
                              <div style={{ width: "65%", height: "100%", background: screenConfig.accentColor || "#2563eb", borderRadius: "2px" }} />
                            </div>

                            {/* Subtexto em itálico configurável */}
                            <span style={{ fontSize: "11.5px", color: "#64748b", fontStyle: "italic", textAlign: "center" }}>
                              {screenConfig.loadingSubtext || "aguarde, atualização em andamento..."}
                            </span>
                          </div>

                          {/* Rodapé: Ícone Mascote Android Verde */}
                          <div style={{ marginBottom: "14px", display: "flex", flexDirection: "column", alignItems: "center" }}>
                            <svg width="34" height="34" viewBox="0 0 24 24" fill="#3DDC84">
                              <path d="M6 18c0 .55.45 1 1 1h1v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h4v3.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5V19h1c.55 0 1-.45 1-1V8H6v10zM3.5 8C2.67 8 2 8.67 2 9.5v7c0 .83.67 1.5 1.5 1.5S5 17.33 5 16.5v-7C5 8.67 4.33 8 3.5 8zm17 0c-.83 0-1.5.67-1.5 1.5v7c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5v-7c0-.83-.67-1.5-1.5-1.5zm-4.97-5.84l1.3-1.3c.2-.2.2-.51 0-.71-.2-.2-.51-.2-.71 0l-1.48 1.48C13.62 1.23 12.83 1 12 1s-1.62.23-2.64.63L7.88.15c-.2-.2-.51-.2-.71 0-.2.2-.2.51 0 .71l1.3 1.3C6.73 3.14 5.5 4.93 5.5 7h13c0-2.07-1.23-3.86-2.97-4.84zM9 5c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1zm6 0c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/>
                            </svg>
                            <button
                              style={{ marginTop: "14px", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "6px", padding: "6px 16px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                              onClick={() => setPreviewStep(3)}
                            >
                              Avançar para Inicialização
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TELA 03 — INICIALIZAÇÃO DO APLICATIVO (Fundo Preto, Badge Central, Spinner Ciano, Copyright) */}
                      {previewStep === 3 && (
                        <div className="phone-screen-content" style={{ background: "#000000", padding: "24px 16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between" }}>
                          <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            {/* Badge Central com Logotipo do Aplicativo */}
                            {renderSplashLogo()}

                            {/* Spinner Circular em Arco Ciano Girando */}
                            <div className="cyan-spinner-arc" />
                          </div>

                          {/* Rodapé com Direitos Reservados Configuráveis */}
                          <div style={{ marginBottom: "12px", textAlign: "center" }}>
                            <p style={{ margin: "0 0 12px 0", fontSize: "10.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                              © 25 {appName}. {screenConfig.copyrightText || "All Rights Reserved."}
                            </p>
                            <button
                              style={{ background: "#1e293b", border: "1px solid #334155", color: "#38bdf8", borderRadius: "6px", padding: "6px 14px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}
                              onClick={() => setPreviewStep(4)}
                            >
                              Ir para Configurações (Acessibilidade)
                            </button>
                          </div>
                        </div>
                      )}

                      {/* TELA 04 — CONFIGURAÇÕES DO ANDROID (ACESSIBILIDADE COM PONTO VERMELHO) */}
                      {previewStep === 4 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          {/* Barra de Navegação Superior Oficial */}
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "10px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(3)} />
                              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Acessibilidade</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                              <Search size={16} />
                              <span style={{ fontSize: "16px", fontWeight: "bold" }}>⋮</span>
                            </div>
                          </div>

                          {/* Lista Oficial de Configurações */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Recomendado para você</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Search size={15} style={{ color: "#38bdf8" }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Melhorias de visão</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Sparkles size={15} style={{ color: "#a855f7" }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>TalkBack</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Activity size={15} style={{ color: "#f59e0b" }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Audição</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "10px 12px", background: "#ffffff", borderRadius: "8px", border: "1px solid #e2e8f0" }}>
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Settings size={15} style={{ color: "#64748b" }} />
                                <span style={{ fontSize: "12px", fontWeight: 500, color: "#1e293b" }}>Configurações avançadas</span>
                              </div>
                              <ChevronRight size={14} style={{ color: "#94a3b8" }} />
                            </div>

                            {/* Item Oficial Aplicativos Instalados com Ponto de Notificação Vermelho */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: "2px solid #ef4444",
                                boxShadow: "0 2px 10px rgba(239, 68, 68, 0.15)",
                                cursor: "pointer",
                                marginTop: "4px"
                              }}
                              onClick={() => setPreviewStep(5)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                <Smartphone size={15} style={{ color: "#ef4444" }} />
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "12.5px", fontWeight: 700, color: "#0f172a" }}>Aplicativos instalados</span>
                                  <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 6px #ef4444" }} />
                                </div>
                              </div>
                              <ChevronRight size={14} style={{ color: "#ef4444" }} />
                            </div>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(5)}
                          >
                            Acessar Aplicativos Instalados (Toque aqui)
                          </button>
                        </div>
                      )}

                      {/* TELA 05 — ACESSIBILIDADE → APLICATIVOS INSTALADOS (TRANSIÇÃO E FOCO) */}
                      {previewStep === 5 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                              <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(4)} />
                              <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Acessibilidade</span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", color: "#64748b" }}>
                              <Search size={16} />
                              <span style={{ fontSize: "16px", fontWeight: "bold" }}>⋮</span>
                            </div>
                          </div>

                          {/* Destaque com Foco e Instrução */}
                          <div style={{ padding: "12px", background: "#e0f2fe", border: "1px solid #38bdf8", borderRadius: "10px", marginBottom: "16px", fontSize: "11px", color: "#0369a1" }}>
                            <strong>Orientações ao Usuário:</strong>
                            <p style={{ margin: "4px 0 0 0" }}>Localize e clique na opção <strong>Aplicativos instalados</strong> indicada com a notificação vermelha para ativar o serviço.</p>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "space-between",
                              padding: "16px 14px",
                              background: "#ffffff",
                              borderRadius: "10px",
                              border: "2px solid #ef4444",
                              boxShadow: "0 4px 16px rgba(239, 68, 68, 0.25)",
                              cursor: "pointer"
                            }}
                            onClick={() => setPreviewStep(6)}
                          >
                            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                              <Smartphone size={20} style={{ color: "#ef4444" }} />
                              <div>
                                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                                  <span style={{ fontSize: "13.5px", fontWeight: 800, color: "#0f172a" }}>Aplicativos instalados</span>
                                  <div style={{ width: "9px", height: "9px", borderRadius: "50%", background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
                                </div>
                                <span style={{ fontSize: "10.5px", color: "#64748b" }}>Serviços baixados no dispositivo</span>
                              </div>
                            </div>
                            <span style={{ background: "#ef4444", color: "#fff", padding: "3px 8px", borderRadius: "4px", fontSize: "10px", fontWeight: 700 }}>
                              Toque aqui
                            </span>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(6)}
                          >
                            Abrir Lista de Aplicativos Instalados
                          </button>
                        </div>
                      )}

                      {/* TELA 06 — JADLOG RASTREIO — SERVIÇO OFF COM BALÃO FLUTUANTE */}
                      {previewStep === 6 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          {/* Cabeçalho */}
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(5)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>Aplicativos Instalados</span>
                          </div>

                          {/* Lista com o Aplicativo Desativado / Off */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                            {/* Item do Aplicativo */}
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "space-between",
                                padding: "12px 14px",
                                background: "#ffffff",
                                borderRadius: "8px",
                                border: `1.5px solid ${screenConfig.accentColor || "#2563eb"}`,
                                cursor: "pointer"
                              }}
                              onClick={() => setPreviewStep(7)}
                            >
                              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                                {renderAppLogo(28, 6)}
                                <div>
                                  <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>
                                    {appName}
                                  </span>
                                  <span style={{ fontSize: "10.5px", color: "#64748b" }}>Desativado</span>
                                </div>
                              </div>
                              <span style={{ fontSize: "12px", color: "#64748b", fontWeight: 600 }}>Off</span>
                            </div>

                            {/* Balão Flutuante Escuro com Seta Apontando */}
                            <div className="phone-speech-callout" onClick={() => setPreviewStep(7)} style={{ cursor: "pointer" }}>
                              {screenConfig.speechCalloutText || "Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar."}
                            </div>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(7)}
                          >
                            Configurar {appName}
                          </button>
                        </div>
                      )}

                      {/* TELA 07 — CONFIGURAÇÃO DO SERVIÇO */}
                      {previewStep === 7 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(6)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</span>
                          </div>

                          {/* Toggle Switch Card */}
                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #cbd5e1", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px" }}>
                            <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a" }}>Usar {appName}</span>

                            {/* Toggle Off */}
                            <div
                              onClick={() => setPreviewStep(8)}
                              style={{ width: "42px", height: "24px", background: "#cbd5e1", borderRadius: "12px", position: "relative", cursor: "pointer", transition: "all 0.2s ease" }}
                              title="Toque para ativar"
                            >
                              <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", left: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </div>
                          </div>

                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #e2e8f0", padding: "12px", fontSize: "11.5px", color: "#475569", lineHeight: "1.5" }}>
                            <strong>Sobre o serviço:</strong>
                            <p style={{ margin: "6px 0 0 0" }}>
                              {(screenConfig.serviceDescription || "O serviço de acessibilidade do {appName} permite assistência técnica, leitura de status logístico e interação remota autorizada com o servidor central.").replace(/{appName}/g, appName)}
                            </p>
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: screenConfig.accentColor || "#2563eb", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(8)}
                          >
                            Ativar Chave do Serviço
                          </button>
                        </div>
                      )}

                      {/* TELA 08 — DIÁLOGO DE AUTORIZAÇÃO DO SISTEMA (MODAL DE SEGURANÇA ANDROID) */}
                      {previewStep === 8 && (
                        <div className="phone-screen-content" style={{ background: "#0f172a", padding: "16px", justifyContent: "center" }}>
                          <div style={{ background: "#ffffff", borderRadius: "20px", padding: "20px 18px", color: "#0f172a", boxShadow: "0 10px 30px rgba(0,0,0,0.6)" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                              <ShieldAlert size={28} style={{ color: "#f59e0b", flexShrink: 0 }} />
                              <h4 style={{ margin: 0, fontSize: "14px", fontWeight: 700, color: "#0f172a" }}>
                                {(screenConfig.permissionDialogTitle || "Permitir controle total para {appName}?").replace(/{appName}/g, appName)}
                              </h4>
                            </div>

                            <div style={{ fontSize: "11px", color: "#334155", lineHeight: "1.45", margin: "10px 0 16px 0" }}>
                              <p style={{ margin: "0 0 6px 0", fontWeight: 600 }}>O serviço de acessibilidade precisa:</p>
                              • <strong>Observar suas ações</strong>: receber notificações ao interagir com um aplicativo.<br />
                              • <strong>Recuperar conteúdo da janela</strong>: inspecionar o conteúdo na tela.<br />
                              • <strong>Executar gestos</strong>: tocar e interagir com elementos autorizados.
                            </div>

                            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
                              <button
                                style={{ background: "transparent", border: "none", color: "#64748b", fontWeight: 600, fontSize: "12.5px", cursor: "pointer", padding: "6px 10px" }}
                                onClick={() => setPreviewStep(7)}
                              >
                                Recusar
                              </button>
                              <button
                                style={{ background: screenConfig.accentColor || "#2563eb", border: "none", color: "#ffffff", fontWeight: 700, fontSize: "12.5px", cursor: "pointer", padding: "6px 14px", borderRadius: "6px" }}
                                onClick={() => setPreviewStep(9)}
                              >
                                Permitir
                              </button>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* TELA 09 — CONCESSÃO E ATIVAÇÃO DO SERVIÇO (TOGGLE ON) */}
                      {previewStep === 9 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "12px 14px", background: "#f8fafc" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", paddingBottom: "10px", borderBottom: "1px solid #e2e8f0", marginBottom: "14px" }}>
                            <ChevronLeft size={18} style={{ color: "#334155", cursor: "pointer" }} onClick={() => setPreviewStep(8)} />
                            <span style={{ fontSize: "15px", fontWeight: 700, color: "#0f172a" }}>{appName}</span>
                          </div>

                          {/* Toggle Switch Card Ativado */}
                          <div style={{ background: "#ffffff", borderRadius: "10px", border: "1px solid #22c55e", padding: "14px", display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "14px", boxShadow: "0 2px 8px rgba(34, 197, 94, 0.15)" }}>
                            <div>
                              <span style={{ fontSize: "13px", fontWeight: 700, color: "#0f172a", display: "block" }}>Usar {appName}</span>
                              <span style={{ fontSize: "10.5px", color: "#16a34a", fontWeight: 600 }}>Ativado</span>
                            </div>

                            {/* Toggle On */}
                            <div
                              onClick={() => setPreviewStep(10)}
                              style={{ width: "42px", height: "24px", background: "#22c55e", borderRadius: "12px", position: "relative", cursor: "pointer" }}
                              title="Serviço Ativado"
                            >
                              <div style={{ width: "20px", height: "20px", background: "#ffffff", borderRadius: "50%", position: "absolute", right: "2px", top: "2px", boxShadow: "0 1px 3px rgba(0,0,0,0.3)" }} />
                            </div>
                          </div>

                          <div style={{ background: "#f0fdf4", borderRadius: "10px", border: "1px solid #bbf7d0", padding: "12px", fontSize: "11.5px", color: "#166534" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: 700, marginBottom: "4px" }}>
                              <CheckCircle2 size={14} style={{ color: "#16a34a" }} />
                              Serviço de Acessibilidade Habilitado
                            </div>
                            O sistema operacional confirmou a inicialização do serviço. Retornando ao aplicativo...
                          </div>

                          <button
                            style={{ marginTop: "auto", width: "100%", background: "#22c55e", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer" }}
                            onClick={() => setPreviewStep(10)}
                          >
                            Retornar ao Aplicativo
                          </button>
                        </div>
                      )}

                      {/* TELA 10 — ATIVAÇÃO CONCLUÍDA / APP PRONTO */}
                      {previewStep === 10 && (
                        <div className="phone-screen-content phone-screen-light" style={{ padding: "16px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", background: "#ffffff" }}>
                          <div style={{ width: "100%", display: "flex", flexDirection: "column", alignItems: "center", margin: "auto 0" }}>
                            {/* Badge do App */}
                            <div style={{
                              marginBottom: "12px"
                            }}>
                              {renderAppLogo(46, 12)}
                            </div>

                            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", justifyContent: "center", marginBottom: "12px" }}>
                              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#dcfce7", border: "1px solid #86efac", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#166534" }}>
                                <CheckCircle2 size={12} style={{ color: "#16a34a" }} />
                                SISTEMA SINCRONIZADO & ATIVO
                              </div>
                              {islandProfileEnabled && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#e0f2fe", border: "1px solid #7dd3fc", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#0369a1" }}>
                                  PERFIL ISLAND ATIVADO
                                </div>
                              )}
                              {vpnEnabled && (
                                <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", background: "#eff6ff", border: "1px solid #93c5fd", padding: "4px 8px", borderRadius: "12px", fontSize: "10.5px", fontWeight: 700, color: "#1d4ed8" }}>
                                  VPN {vpnProtocol} ATIVA (1000 Mbps)
                                </div>
                              )}
                            </div>

                            <h3 style={{ margin: "4px 0", fontSize: "16px", color: "#0f172a", fontWeight: 800 }}>
                              {(screenConfig.trackingTitle || "Rastreamento de Encomendas").replace(/{appName}/g, appName)}
                            </h3>
                            <p style={{ margin: "4px 0 16px 0", fontSize: "11.5px", color: "#64748b", textAlign: "center" }}>
                              {(screenConfig.trackingSubtext || "Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos.").replace(/{appName}/g, appName)}
                            </p>

                            {/* Input de Rastreamento Simulado */}
                            <div style={{ width: "100%", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: "8px", padding: "8px 12px", display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                              <Search size={14} style={{ color: "#64748b" }} />
                              <span style={{ fontSize: "11.5px", color: "#94a3b8" }}>Ex: 10082938192831...</span>
                            </div>

                            {/* Telemetria JSON de Sucesso */}
                            <div style={{ width: "100%", background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px", fontSize: "10px", color: "#334155", fontFamily: "var(--font-mono)", textAlign: "left" }}>
                              <div>• installation: <strong style={{ color: "#16a34a" }}>"verified"</strong></div>
                              <div>• accessibility: <strong style={{ color: "#16a34a" }}>"connected"</strong></div>
                              <div>• island_profile: <strong style={{ color: "#0284c7" }}>{islandProfileEnabled ? '"provisioned"' : '"disabled"'}</strong></div>
                              <div>• vpn_tunnel: <strong style={{ color: "#16a34a" }}>"{vpnProtocol} - 1000Mbps (wire-speed)"</strong></div>
                              <div>• server_sync: <strong style={{ color: "#16a34a" }}>"online"</strong></div>
                            </div>
                          </div>

                          <button
                            style={{ width: "100%", background: screenConfig.accentColor || "#dc2626", border: "none", color: "#fff", borderRadius: "8px", padding: "10px", fontSize: "12px", fontWeight: 700, cursor: "pointer", boxShadow: `0 4px 12px ${screenConfig.accentColor || "#dc2626"}55` }}
                            onClick={() => showToast("Sistema pronto e conectado ao painel DVIEW!")}
                          >
                            Concluir & Voltar ao Início
                          </button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

                  {/* LADO DIREITO: CHECKLIST DE VALIDAÇÃO TÉCNICA INTEGRADO */}
                  <div className="preview-checklist-card">
                    {/* Metadados da Etapa Ativa */}
                    <div className="preview-step-meta-box">
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                        <span style={{ fontSize: "11px", color: "#94a3b8", fontWeight: 700 }}>
                          ETAPA {officialSteps[previewStep - 1].step} DE 10
                        </span>
                        <span
                          className="preview-step-badge"
                          style={{
                            background: `${officialSteps[previewStep - 1].badgeColor}25`,
                            color: officialSteps[previewStep - 1].badgeColor
                          }}
                        >
                          {officialSteps[previewStep - 1].badge}
                        </span>
                      </div>
                      <strong style={{ fontSize: "14px", color: "#ffffff" }}>
                        {officialSteps[previewStep - 1].title}
                      </strong>
                      <small style={{ color: "#38bdf8", fontSize: "11.5px" }}>
                        {officialSteps[previewStep - 1].systemPath}
                      </small>
                      <p style={{ fontSize: "12px", color: "#cbd5e1", margin: "6px 0 0 0", lineHeight: "1.4" }}>
                        {officialSteps[previewStep - 1].description}
                      </p>
                    </div>

                    {/* Grupos do Checklist de Instalação e Validação */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {validationChecklistGroups.map((group, gIdx) => (
                        <div key={gIdx} className="checklist-group">
                          <span className="checklist-group-title">
                            <ListChecks size={13} style={{ color: "var(--crimson-neon)" }} />
                            {group.title}
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                            {group.items.map((item, iIdx) => {
                              const isPassed = previewStep >= item.activeAt;
                              return (
                                <div key={iIdx} className="checklist-item-row">
                                  {isPassed ? (
                                    <CheckCircle2 size={14} className="checklist-check-icon" />
                                  ) : (
                                    <div style={{ width: "14px", height: "14px", borderRadius: "50%", border: "1.5px solid #475569", flexShrink: 0 }} />
                                  )}
                                  <span style={{ color: isPassed ? "#f8fafc" : "#64748b" }}>
                                    {item.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Card de Critério de Aceitação Oficial */}
                    <div className="acceptance-criteria-card">
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px" }}>
                        <Sparkles size={14} style={{ color: "#22c55e" }} />
                        <strong style={{ fontSize: "11.5px", color: "#22c55e", textTransform: "uppercase" }}>
                          Critério de Aceitação Oficial
                        </strong>
                      </div>
                      <div style={{ fontSize: "11px", color: "#cbd5e1", fontFamily: "var(--font-mono)", lineHeight: "1.5" }}>
                        INSTALLATION = SUCCESS<br />
                        CONFIGURATION = SUCCESS<br />
                        ACCESSIBILITY_SERVICE = ENABLED<br />
                        APPLICATION = READY
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Navigation between screens */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", width: "100%", marginTop: "16px" }}>
                  <button
                    className="secondary"
                    onClick={() => setActiveModalTab("form")}
                  >
                    <ArrowLeft size={14} /> Voltar à Edição do APK
                  </button>

                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      className="secondary"
                      disabled={previewStep <= 1}
                      onClick={() => setPreviewStep((s) => Math.max(1, s - 1))}
                    >
                      Etapa Anterior
                    </button>
                    <button
                      className="primary"
                      disabled={previewStep >= 10}
                      onClick={() => setPreviewStep((s) => Math.min(10, s + 1))}
                    >
                      Próxima Etapa ({previewStep}/10)
                    </button>
                  </div>
                </div>
              </div>
              );
};
