import React from "react";
import {
  X,
  Folder,
  Layers,
  Zap,
  RotateCw,
  Boxes,
  RefreshCw,
  Unlock,
  Lock
} from "lucide-react";
import type { ControlDevice, InstalledAppItem } from "../types";
import { AppLogo } from "../AppLogo";

export interface FloatingLeftDrawerProps {
  openLeftDrawer: "pastas" | "island" | "info";
  setOpenLeftDrawer: React.Dispatch<React.SetStateAction<null | "pastas" | "island" | "info">>;
  realApps: InstalledAppItem[];
  handleLaunchApp: (app: InstalledAppItem, isMainRoot?: boolean) => void;
  handleSyncApps: () => void;
  isSyncingApps: boolean;
  islandStatus: any;
  handleValidateIsland: () => void;
  isValidatingIsland: boolean;
  handleAutoMirror: () => void;
  isMirroringIsland: boolean;
  handleSeedSyncIsland: () => void;
  isSeedSyncingIsland: boolean;
  islandFeedback: string | null;
  device: ControlDevice;
  updateStatus: any;
  showToast: (msg: string) => void;
  handleTriggerOtaUpdate: () => void;
  isUpdatingOta: boolean;
  handleToggleLock: () => void;
  isScreenLocked: boolean;
}

export const FloatingLeftDrawer: React.FC<FloatingLeftDrawerProps> = ({
  openLeftDrawer,
  setOpenLeftDrawer,
  realApps,
  handleLaunchApp,
  handleSyncApps,
  isSyncingApps,
  islandStatus,
  handleValidateIsland,
  isValidatingIsland,
  handleAutoMirror,
  isMirroringIsland,
  handleSeedSyncIsland,
  isSeedSyncingIsland,
  islandFeedback,
  device,
  updateStatus,
  showToast,
  handleTriggerOtaUpdate,
  isUpdatingOta,
  handleToggleLock,
  isScreenLocked
}) => {
  return (
    <div
              style={{
                width: "240px",
                minWidth: "240px",
                background: "#080c16",
                borderRight: "1px solid #1e293b",
                display: "flex",
                flexDirection: "column",
                zIndex: 25,
                overflowY: "auto",
                padding: "8px"
              }}
            >
              {/* Header do Painel Esquerdo */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "3px" }}>
                  <button
                    type="button"
                    onClick={() => setOpenLeftDrawer("pastas")}
                    style={{
                      background: openLeftDrawer === "pastas" ? "rgba(255, 26, 42, 0.2)" : "transparent",
                      border: `1px solid ${openLeftDrawer === "pastas" ? "#ff1a2a" : "transparent"}`,
                      color: openLeftDrawer === "pastas" ? "#ff4d5a" : "#94a3b8",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Pastas
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenLeftDrawer("island")}
                    style={{
                      background: openLeftDrawer === "island" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                      border: `1px solid ${openLeftDrawer === "island" ? "#38bdf8" : "transparent"}`,
                      color: openLeftDrawer === "island" ? "#38bdf8" : "#94a3b8",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Island
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenLeftDrawer("info")}
                    style={{
                      background: openLeftDrawer === "info" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                      border: `1px solid ${openLeftDrawer === "info" ? "#22c55e" : "transparent"}`,
                      color: openLeftDrawer === "info" ? "#22c55e" : "#94a3b8",
                      fontSize: "9.5px",
                      fontWeight: 700,
                      padding: "2px 6px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Info
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenLeftDrawer(null)}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* TAB PASTAS (PRINCIPAL COM DVIEW E SEPARADA COM ISLAND) */}
              {openLeftDrawer === "pastas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* 1. PASTA PRINCIPAL (USER 0 · RAIZ - APENAS DVIEW) */}
                  <div style={{ background: "#0c101d", border: "1px solid rgba(255, 26, 42, 0.35)", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#ff4d5a" }}>
                        <Folder size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />PASTA PRINCIPAL [1]
                      </span>
                      <span style={{ fontSize: "7.5px", background: "rgba(255,26,42,0.2)", color: "#ff8088", padding: "1px 4px", borderRadius: "2px", fontWeight: 800 }}>
                        USER 0 · RAIZ
                      </span>
                    </div>

                    {(() => {
                      const dviewApp: InstalledAppItem = realApps.find(
                        (a) => a.packageName.includes("droidview.agent") || a.name.toLowerCase().includes("jadlog") || a.name.toLowerCase().includes("dview")
                      ) || {
                        id: "app_dview_main",
                        name: "Entregue Jad Log (DVIEW)",
                        packageName: "com.droidview.agent",
                        version: "1.0.0",
                        status: "active",
                        isSystem: false,
                        iconType: "tools",
                        iconUrl: undefined
                      };

                      return (
                        <button
                          type="button"
                          onClick={() => handleLaunchApp(dviewApp, true)}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "6px",
                            padding: "5px 7px",
                            background: "rgba(255, 26, 42, 0.08)",
                            border: "1px solid rgba(255, 26, 42, 0.3)",
                            borderRadius: "5px",
                            color: "#fff",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "left"
                          }}
                          title="Abrir aplicativo principal DVIEW na partição raiz (User 0)"
                        >
                          <AppLogo name={dviewApp.name} packageName={dviewApp.packageName} size={18} iconUrl={dviewApp.iconUrl} />
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <div style={{ fontSize: "10px", fontWeight: 800, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {dviewApp.name}
                            </div>
                            <div style={{ fontSize: "7.5px", color: "#ff8088", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                              {dviewApp.packageName}
                            </div>
                          </div>
                          <span style={{ fontSize: "7.5px", background: "#22c55e", color: "#000", fontWeight: 800, padding: "1px 4px", borderRadius: "2px" }}>
                            RAIZ
                          </span>
                        </button>
                      );
                    })()}
                  </div>

                  {/* 2. PASTA SEPARADA: CONTAINER ISLAND */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#38bdf8" }}>
                        <Layers size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />PASTA SEPARADA [{realApps.filter((a) => !a.packageName.includes("droidview.agent")).length}]
                      </span>
                      <button
                        type="button"
                        onClick={handleSyncApps}
                        disabled={isSyncingApps}
                        style={{
                          background: "rgba(56, 189, 248, 0.15)",
                          border: "1px solid #38bdf8",
                          color: "#38bdf8",
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "3px",
                          cursor: "pointer"
                        }}
                      >
                        {isSyncingApps ? "..." : "SYNC"}
                      </button>
                    </div>

                    <div style={{ fontSize: "8px", color: "#94a3b8", marginBottom: "5px", lineHeight: "1.2" }}>
                      <Zap size={9} style={{ display: "inline", verticalAlign: "middle", marginRight: "3px", color: "#38bdf8" }} />
                      <span style={{ color: "#38bdf8", fontWeight: 700 }}>Auto-Mirror:</span> Clique no app para clonar e abrir na Island (User 10).
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "240px", overflowY: "auto" }}>
                      {realApps.filter((a) => !a.packageName.includes("droidview.agent")).length === 0 ? (
                        <div style={{ fontSize: "9.5px", color: "#64748b", padding: "4px 0" }}>Nenhum outro app listado.</div>
                      ) : (
                        realApps
                          .filter((a) => !a.packageName.includes("droidview.agent"))
                          .map((app) => {
                            const isMirrored = islandStatus?.mirroredApps?.includes(app.packageName);
                            return (
                              <button
                                key={app.id || app.packageName}
                                type="button"
                                onClick={() => handleLaunchApp(app, false)}
                                title={`Auto-Mirror e abrir ${app.name} dentro da Island (User 10)`}
                                style={{
                                  display: "flex",
                                  alignItems: "center",
                                  gap: "6px",
                                  padding: "4px 6px",
                                  background: isMirrored ? "rgba(2, 132, 199, 0.12)" : "rgba(15, 23, 42, 0.6)",
                                  border: `1px solid ${isMirrored ? "rgba(56, 189, 248, 0.4)" : "#1e293b"}`,
                                  borderRadius: "4px",
                                  color: "#f8fafc",
                                  cursor: "pointer",
                                  textAlign: "left",
                                  width: "100%"
                                }}
                              >
                                <AppLogo name={app.name} packageName={app.packageName} size={16} iconUrl={app.iconUrl} />
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "9.5px", fontWeight: 700, color: "#fff", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {app.name}
                                  </div>
                                  <div style={{ fontSize: "7.5px", color: "#64748b", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {app.packageName}
                                  </div>
                                </div>
                                <span
                                  style={{
                                    fontSize: "7px",
                                    fontWeight: 700,
                                    padding: "1px 3px",
                                    borderRadius: "2px",
                                    background: isMirrored ? "rgba(56, 189, 248, 0.2)" : "rgba(148, 163, 184, 0.1)",
                                    color: isMirrored ? "#38bdf8" : "#94a3b8",
                                    border: `1px solid ${isMirrored ? "rgba(56, 189, 248, 0.4)" : "rgba(148, 163, 184, 0.2)"}`
                                  }}
                                >
                                  {isMirrored ? "MIRRORED" : "MIRROR"}
                                </span>
                              </button>
                            );
                          })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB ISLAND SANDBOX CONTROLS */}
              {openLeftDrawer === "island" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ background: "#0c101d", border: "1px solid rgba(56, 189, 248, 0.3)", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                        <Layers size={11} style={{ color: "#38bdf8" }} />
                        <span>PERFIL ISLAND</span>
                      </span>
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "3px",
                          border: "1px solid",
                          background: (islandStatus?.isInstalled ?? true) ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          borderColor: (islandStatus?.isInstalled ?? true) ? "#22c55e" : "#ef4444",
                          color: (islandStatus?.isInstalled ?? true) ? "#22c55e" : "#ef4444"
                        }}
                      >
                        ATIVO ({islandStatus?.profileUserId || 10})
                      </span>
                    </div>

                    <p style={{ fontSize: "8.5px", color: "#94a3b8", margin: "0 0 8px 0", lineHeight: "1.3" }}>
                      Isolamento completo de execução e espelhamento automático com partição segura.
                    </p>

                    <div style={{ display: "flex", flexDirection: "column", gap: "5px" }}>
                      <button
                        type="button"
                        onClick={handleValidateIsland}
                        disabled={isValidatingIsland}
                        style={{
                          background: "#131826",
                          border: "1px solid #38bdf8",
                          color: "#38bdf8",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        <RotateCw size={10} className={isValidatingIsland ? "animate-spin" : ""} />
                        <span>{isValidatingIsland ? "Validando..." : "Validar Island"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleAutoMirror}
                        disabled={isMirroringIsland || !islandStatus?.isInstalled}
                        style={{
                          background: "rgba(56, 189, 248, 0.2)",
                          border: "1px solid #38bdf8",
                          color: "#38bdf8",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          cursor: islandStatus?.isInstalled ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          opacity: islandStatus?.isInstalled ? 1 : 0.5
                        }}
                      >
                        <Boxes size={10} className={isMirroringIsland ? "animate-spin" : ""} />
                        <span>{isMirroringIsland ? "Clonando..." : "Auto-Mirror Apps"}</span>
                      </button>

                      <button
                        type="button"
                        onClick={handleSeedSyncIsland}
                        disabled={isSeedSyncingIsland || !islandStatus?.isInstalled}
                        style={{
                          background: "rgba(34, 197, 94, 0.15)",
                          border: "1px solid #22c55e",
                          color: "#22c55e",
                          borderRadius: "4px",
                          padding: "4px 8px",
                          fontSize: "9px",
                          fontWeight: 700,
                          cursor: islandStatus?.isInstalled ? "pointer" : "not-allowed",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          opacity: islandStatus?.isInstalled ? 1 : 0.5
                        }}
                      >
                        <RefreshCw size={10} className={isSeedSyncingIsland ? "animate-spin" : ""} />
                        <span>{isSeedSyncingIsland ? "Sincronizando..." : "Atualizar via Seed OTA"}</span>
                      </button>
                    </div>

                    {islandFeedback && (
                      <div style={{ marginTop: "6px", fontSize: "8.5px", color: "#38bdf8", textAlign: "center", fontWeight: 700 }}>
                        {islandFeedback}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* TAB INFO & HARDWARE */}
              {openLeftDrawer === "info" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "9.5px", color: "#cbd5e1" }}>
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ fontWeight: 800, color: "#38bdf8", marginBottom: "6px" }}>TELEMETRIA DO HARDWARE</div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Modelo:</span>
                      <span style={{ fontWeight: 700 }}>{device.model}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Endereço IP:</span>
                      <span style={{ fontFamily: "monospace", color: "#38bdf8" }}>{device.ip}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Bateria:</span>
                      <span style={{ color: "#22c55e", fontWeight: 700 }}>{device.battery}%</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Android:</span>
                      <span>v{device.androidVersion || "13"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0" }}>
                      <span style={{ color: "#64748b" }}>Velocidade:</span>
                      <span style={{ color: "#eab308" }}>{device.networkSpeed || "86 Mbps"}</span>
                    </div>
                  </div>

                  {/* SEED OTA & VERSÃO DO AGENTE */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: 800, color: "#a855f7" }}>VERSÃO & SEED OTA</span>
                      <span
                        style={{
                          fontSize: "8px",
                          fontWeight: 700,
                          padding: "1px 4px",
                          borderRadius: "3px",
                          background: updateStatus?.adminAccessesSatisfied ? "rgba(34, 197, 94, 0.2)" : "rgba(245, 158, 11, 0.2)",
                          color: updateStatus?.adminAccessesSatisfied ? "#22c55e" : "#f59e0b",
                          border: `1px solid ${updateStatus?.adminAccessesSatisfied ? "#22c55e" : "#f59e0b"}`
                        }}
                      >
                        {updateStatus?.adminAccessesSatisfied ? "● COMPATÍVEL" : "▲ ATUALIZAÇÃO DISP."}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Versão Agente:</span>
                      <span style={{ fontWeight: 700, color: "#fff" }}>v{updateStatus?.currentAgentVersion || "1.2.4"}</span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", padding: "2px 0", borderBottom: "1px solid #161f30" }}>
                      <span style={{ color: "#64748b" }}>Status Admin:</span>
                      <span style={{ color: "#22c55e" }}>
                        {updateStatus?.adminAccessesSatisfied ? "Acessos Ativos (OK)" : "Atualização recomendada"}
                      </span>
                    </div>

                    <div style={{ marginTop: "6px" }}>
                      <span style={{ color: "#64748b", fontSize: "8.5px", display: "block", marginBottom: "2px" }}>Seed OTA C2:</span>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <code style={{ fontSize: "8px", background: "#05070a", padding: "2px 4px", borderRadius: "3px", color: "#38bdf8", flex: 1, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {updateStatus?.updateSeed || "SEED-DVIEW-JADLOG-7F9A-OTA"}
                        </code>
                        <button
                          type="button"
                          onClick={() => {
                            void navigator.clipboard.writeText(updateStatus?.updateSeed || "SEED-DVIEW-JADLOG-7F9A-OTA");
                            showToast("Seed OTA copiada!");
                          }}
                          style={{ background: "#1e293b", border: "none", color: "#cbd5e1", borderRadius: "3px", padding: "2px 5px", cursor: "pointer", fontSize: "8px" }}
                        >
                          Copiar
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleTriggerOtaUpdate}
                      disabled={isUpdatingOta}
                      style={{
                        marginTop: "8px",
                        width: "100%",
                        background: "rgba(168, 85, 247, 0.2)",
                        border: "1px solid #a855f7",
                        color: "#c084fc",
                        borderRadius: "4px",
                        padding: "4px",
                        fontSize: "9px",
                        fontWeight: 700,
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <RotateCw size={10} className={isUpdatingOta ? "animate-spin" : ""} />
                      <span>{isUpdatingOta ? "Atualizando em Background..." : "Atualizar via Seed (OTA)"}</span>
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleToggleLock}
                    style={{
                      background: isScreenLocked ? "rgba(34, 197, 94, 0.15)" : "rgba(239, 68, 68, 0.15)",
                      border: `1px solid ${isScreenLocked ? "#22c55e" : "#ef4444"}`,
                      color: isScreenLocked ? "#22c55e" : "#ef4444",
                      borderRadius: "5px",
                      padding: "6px",
                      fontWeight: 700,
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "5px"
                    }}
                  >
                    {isScreenLocked ? <Unlock size={12} /> : <Lock size={12} />}
                    <span>{isScreenLocked ? "Desbloquear Aparelho" : "Bloquear Aparelho"}</span>
                  </button>
                </div>
              )}
            </div>
            );
};
