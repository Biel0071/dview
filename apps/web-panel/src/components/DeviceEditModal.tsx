import React, { useState } from "react";
import {
  Activity,
  Battery,
  Boxes,
  Check,
  Copy,
  ExternalLink,
  FileText,
  MessageSquare,
  Package,
  Phone,
  Radio,
  SlidersHorizontal,
  Smartphone,
  User,
  Wifi,
  X,
  Zap,
  Sparkles
} from "lucide-react";
import type { Device } from "@droidview/shared";
import { api } from "../api";
import { useAppStore } from "../store";

interface Props {
  device: Partial<Device> & { id: string };
  isOpen: boolean;
  onClose: () => void;
  onSaved?: (updated: Device) => void;
  onGoToControl?: (deviceId: string) => void;
}

const COMMON_APK_SUGGESTIONS = [
  "JADLOG Rastreio",
  "Entregue Jad Log",
  "Lojas Renner",
  "Nubank",
  "Mercado Livre",
  "DVIEW Agent",
  "SHEIN Rastreio",
  "Magalu Entregas"
];

export function DeviceEditModal({ device, isOpen, onClose, onSaved, onGoToControl }: Props) {
  const { upsertDevice } = useAppStore();

  const [name, setName] = useState(device.name || "");
  const [contactName, setContactName] = useState(device.contactName || "");
  const [phoneNumber, setPhoneNumber] = useState(device.phoneNumber || "");
  const [apkName, setApkName] = useState(device.apkName || "");
  const [notes, setNotes] = useState(device.notes || "");

  const [saving, setSaving] = useState(false);
  const [autoIdentifying, setAutoIdentifying] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [copiedPhone, setCopiedPhone] = useState(false);

  const handleAutoPull = async () => {
    setAutoIdentifying(true);
    setToastMsg("Sincronizando dados e identificando usuário do aparelho...");
    try {
      const res = await api.autoIdentifyDevice(device.id);
      if (res?.device) {
        if (res.device.contactName) setContactName(res.device.contactName);
        if (res.device.phoneNumber) setPhoneNumber(res.device.phoneNumber);
        if (res.device.apkName) setApkName(res.device.apkName);
        if (res.device.notes) setNotes(res.device.notes);
        if (res.device.name) setName(res.device.name);
        setToastMsg(`✓ Dados extraídos: ${res.device.contactName || "Identificado"} (${res.device.phoneNumber || "-"})`);
      }
    } catch (err: any) {
      setToastMsg(`Falha ao extrair dados: ${err.message || "Erro de conexão"}`);
    } finally {
      setAutoIdentifying(false);
    }
  };

  // Sync state if device prop changes
  React.useEffect(() => {
    if (isOpen) {
      setName(device.name || "");
      setContactName(device.contactName || "");
      setPhoneNumber(device.phoneNumber || "");
      setApkName(device.apkName || "");
      setNotes(device.notes || "");
      setToastMsg(null);
    }
  }, [device.id, isOpen]);

  if (!isOpen) return null;

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  const handleCopyPhone = () => {
    if (!phoneNumber) return;
    navigator.clipboard.writeText(phoneNumber);
    setCopiedPhone(true);
    showToast("Número de telefone copiado!");
    setTimeout(() => setCopiedPhone(false), 2000);
  };

  const handleOpenWhatsApp = () => {
    if (!phoneNumber) return;
    const cleanNumber = phoneNumber.replace(/\D/g, "");
    if (!cleanNumber) return;
    window.open(`https://wa.me/${cleanNumber}`, "_blank");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setToastMsg(null);

    const payload = {
      name: name.trim() || device.name,
      contactName: contactName.trim(),
      phoneNumber: phoneNumber.trim(),
      apkName: apkName.trim(),
      notes: notes.trim()
    };

    try {
      const res = await api.updateDevice(device.id, payload);
      const updated = res.device || { ...device, ...payload };
      upsertDevice(updated as Device);
      onSaved?.(updated as Device);
      showToast("✓ Informações salvas com sucesso!");
      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      // Fallback local caso o endpoint falhe
      const localUpdated = { ...device, ...payload } as Device;
      upsertDevice(localUpdated);
      onSaved?.(localUpdated);
      showToast("✓ Informações salvas localmente!");
      setTimeout(() => {
        onClose();
      }, 700);
    } finally {
      setSaving(false);
    }
  };

  const isOnline = device.status === "online";
  const battColor = (device.battery ?? 100) > 50 ? "#22c55e" : (device.battery ?? 100) > 20 ? "#f59e0b" : "#ef4444";

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 99999,
        background: "rgba(4, 6, 12, 0.85)",
        backdropFilter: "blur(6px)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "16px"
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        className="modal-card tactical-edit-device-modal"
        style={{
          width: "100%",
          maxWidth: "580px",
          background: "linear-gradient(180deg, #0e1320 0%, #080a12 100%)",
          border: "1px solid #1e293b",
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.9), 0 0 0 1px rgba(255, 26, 42, 0.15)",
          borderRadius: "12px",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          maxHeight: "90vh"
        }}
      >
        {/* HEADER */}
        <div
          style={{
            padding: "16px 20px",
            borderBottom: "1px solid #1e293b",
            background: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "36px",
                height: "36px",
                borderRadius: "8px",
                background: "rgba(56, 189, 248, 0.12)",
                border: "1px solid rgba(56, 189, 248, 0.25)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#38bdf8"
              }}
            >
              <Smartphone size={19} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <h3 style={{ margin: 0, fontSize: "15px", fontWeight: 800, color: "#fff" }}>
                  Editar Aparelho & Contato
                </h3>
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "4px",
                    padding: "2px 7px",
                    borderRadius: "10px",
                    fontSize: "10.5px",
                    fontWeight: 700,
                    background: isOnline ? "rgba(34, 197, 94, 0.15)" : "rgba(100, 116, 139, 0.15)",
                    color: isOnline ? "#22c55e" : "#94a3b8",
                    border: `1px solid ${isOnline ? "rgba(34, 197, 94, 0.3)" : "rgba(100, 116, 139, 0.3)"}`
                  }}
                >
                  <span
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: isOnline ? "#22c55e" : "#64748b"
                    }}
                  />
                  {isOnline ? "ONLINE" : "OFFLINE"}
                </span>
              </div>
              <small style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono, monospace)" }}>
                ID: {device.id} · {device.model || "Android"}
              </small>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "#94a3b8",
              cursor: "pointer",
              padding: "6px",
              borderRadius: "6px",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}
            title="Fechar (Esc)"
          >
            <X size={18} />
          </button>
        </div>

        {/* TOAST FEEDBACK */}
        {toastMsg && (
          <div
            style={{
              padding: "10px 18px",
              background: toastMsg.startsWith("✓") ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 26, 42, 0.15)",
              borderBottom: `1px solid ${toastMsg.startsWith("✓") ? "#22c55e" : "#ff1a2a"}`,
              color: toastMsg.startsWith("✓") ? "#86efac" : "#fca5a5",
              fontSize: "12px",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}
          >
            <Zap size={14} />
            <span>{toastMsg}</span>
          </div>
        )}

        {/* FORM CONTENT */}
        <form onSubmit={handleSubmit} style={{ overflowY: "auto", padding: "18px 20px", display: "flex", flexDirection: "column", gap: "14px" }}>
          {/* CAMPO 1: NOME DO CONTATO */}
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "#cbd5e1"
                }}
              >
                <User size={14} style={{ color: "#38bdf8" }} />
                <span>Nome do Contato / Responsável</span>
              </label>
              <button
                type="button"
                onClick={handleAutoPull}
                disabled={autoIdentifying}
                style={{
                  background: "rgba(56, 189, 248, 0.12)",
                  border: "1px solid rgba(56, 189, 248, 0.3)",
                  borderRadius: "4px",
                  color: "#38bdf8",
                  fontSize: "10.5px",
                  fontWeight: 700,
                  padding: "3px 8px",
                  cursor: "pointer",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px",
                  transition: "all 0.15s ease"
                }}
                title="Puxar identificação e contas salvas no celular automaticamente"
              >
                <Sparkles size={11} className={autoIdentifying ? "animate-spin" : ""} />
                <span>{autoIdentifying ? "Identificando..." : "Auto-Preencher do Celular"}</span>
              </button>
            </div>
            <input
              type="text"
              value={contactName}
              onChange={(e) => setContactName(e.target.value)}
              placeholder="Ex: Carlos Ferreira, Vanderlei Silva, João da Silva..."
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#060810",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                outline: "none",
                transition: "border-color 0.15s ease"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#38bdf8")}
              onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
            />
            <small style={{ fontSize: "10.5px", color: "#64748b", marginTop: "4px", display: "block" }}>
              Identificação visível nos cards de dispositivos, alertas e relatórios.
            </small>
          </div>

          {/* CAMPO 2: TELEFONE / WHATSAPP */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: "6px"
              }}
            >
              <Phone size={14} style={{ color: "#22c55e" }} />
              <span>Telefone / WhatsApp</span>
            </label>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="Ex: +55 (11) 98765-4321 ou (11) 99999-8888"
                style={{
                  flex: 1,
                  padding: "10px 12px",
                  background: "#060810",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  color: "#fff",
                  fontSize: "13px",
                  fontFamily: "var(--font-mono, monospace)",
                  outline: "none"
                }}
                onFocus={(e) => (e.target.style.borderColor = "#22c55e")}
                onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
              />
              <button
                type="button"
                onClick={handleCopyPhone}
                disabled={!phoneNumber}
                title="Copiar número de telefone"
                style={{
                  padding: "0 12px",
                  background: "rgba(100, 116, 139, 0.12)",
                  border: "1px solid #1e293b",
                  borderRadius: "6px",
                  color: copiedPhone ? "#22c55e" : "#94a3b8",
                  cursor: phoneNumber ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  fontSize: "11px"
                }}
              >
                {copiedPhone ? <Check size={14} /> : <Copy size={14} />}
              </button>
              <button
                type="button"
                onClick={handleOpenWhatsApp}
                disabled={!phoneNumber}
                title="Abrir no WhatsApp"
                style={{
                  padding: "0 12px",
                  background: "rgba(34, 197, 94, 0.12)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "6px",
                  color: "#22c55e",
                  cursor: phoneNumber ? "pointer" : "not-allowed",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "4px",
                  fontSize: "11.5px",
                  fontWeight: 700
                }}
              >
                <MessageSquare size={13} />
                <span>Zap</span>
              </button>
            </div>
          </div>

          {/* CAMPO 3: NOME DO APK CADASTRADO */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: "6px"
              }}
            >
              <Package size={14} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
              <span>Nome do APK / Aplicação Vinculada</span>
            </label>
            <input
              type="text"
              value={apkName}
              onChange={(e) => setApkName(e.target.value)}
              placeholder="Ex: JADLOG Rastreio, Lojas Renner, Nubank..."
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#060810",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                outline: "none"
              }}
              onFocus={(e) => (e.target.style.borderColor = "var(--crimson-neon, #ff1a2a)")}
              onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
            />

            {/* SUGESTÕES RÁPIDAS DE APK */}
            <div style={{ display: "flex", gap: "5px", flexWrap: "wrap", marginTop: "6px" }}>
              <span style={{ fontSize: "10px", color: "#64748b", alignSelf: "center", marginRight: "2px" }}>
                Sugestões:
              </span>
              {COMMON_APK_SUGGESTIONS.map((sug) => (
                <button
                  key={sug}
                  type="button"
                  onClick={() => setApkName(sug)}
                  style={{
                    background: apkName === sug ? "rgba(255, 26, 42, 0.18)" : "rgba(15, 23, 42, 0.6)",
                    border: `1px solid ${apkName === sug ? "var(--crimson-neon, #ff1a2a)" : "#1e293b"}`,
                    color: apkName === sug ? "#ffffff" : "#94a3b8",
                    padding: "2px 7px",
                    borderRadius: "4px",
                    fontSize: "10px",
                    fontWeight: 600,
                    cursor: "pointer",
                    transition: "all 0.12s ease"
                  }}
                >
                  {sug}
                </button>
              ))}
            </div>
          </div>

          {/* CAMPO 4: NOME DO APARELHO / RÓTULO */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: "6px"
              }}
            >
              <Smartphone size={14} style={{ color: "#a855f7" }} />
              <span>Rótulo / Nome do Aparelho no Sistema</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Entregue Jad Log (SM-N975F) ou Moto G84 - Entregador 02"
              style={{
                width: "100%",
                padding: "10px 12px",
                background: "#060810",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#fff",
                fontSize: "13px",
                outline: "none"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#a855f7")}
              onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
            />
          </div>

          {/* CAMPO 5: NOTAS / OBSERVAÇÕES */}
          <div>
            <label
              style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "12px",
                fontWeight: 700,
                color: "#cbd5e1",
                marginBottom: "6px"
              }}
            >
              <FileText size={14} style={{ color: "#94a3b8" }} />
              <span>Notas e Observações Operacionais</span>
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Digite detalhes do aparelho, endereço de entrega, operadora, histórico..."
              rows={2}
              style={{
                width: "100%",
                padding: "8px 12px",
                background: "#060810",
                border: "1px solid #1e293b",
                borderRadius: "6px",
                color: "#cbd5e1",
                fontSize: "12.5px",
                outline: "none",
                resize: "vertical"
              }}
              onFocus={(e) => (e.target.style.borderColor = "#64748b")}
              onBlur={(e) => (e.target.style.borderColor = "#1e293b")}
            />
          </div>

          {/* TELEMETRIA TÉCNICA RESUMIDA */}
          <div
            style={{
              padding: "10px 12px",
              background: "rgba(10, 14, 23, 0.8)",
              border: "1px solid #1e293b",
              borderRadius: "8px",
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: "8px",
              fontSize: "11px"
            }}
          >
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Modelo & SO</span>
              <strong style={{ color: "#e2e8f0" }}>{device.model || "Android"} · v{device.androidVersion || "14"}</strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>IP & Rede</span>
              <strong style={{ color: "#38bdf8", fontFamily: "var(--font-mono, monospace)" }}>
                {device.ipAddress || (device as any).ip || "127.0.0.1"}
              </strong>
            </div>
            <div>
              <span style={{ color: "#64748b", display: "block" }}>Bateria</span>
              <strong style={{ color: battColor }}>{device.battery ?? 100}%</strong>
            </div>
          </div>

          {/* FOOTER ACTIONS */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingTop: "10px",
              borderTop: "1px solid #1e293b",
              marginTop: "4px"
            }}
          >
            {onGoToControl ? (
              <button
                type="button"
                className="secondary"
                onClick={() => {
                  onGoToControl(device.id);
                  onClose();
                }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  padding: "7px 12px"
                }}
              >
                <SlidersHorizontal size={13} style={{ color: "#38bdf8" }} />
                <span>Abrir Controle</span>
              </button>
            ) : <div />}

            <div style={{ display: "flex", gap: "8px" }}>
              <button
                type="button"
                className="secondary"
                onClick={onClose}
                disabled={saving}
                style={{ fontSize: "12px", padding: "7px 14px" }}
              >
                Cancelar
              </button>

              <button
                type="submit"
                className="primary"
                disabled={saving}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  fontSize: "12px",
                  padding: "7px 18px",
                  fontWeight: 800
                }}
              >
                <Check size={14} />
                <span>{saving ? "Salvando..." : "Salvar Alterações"}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
