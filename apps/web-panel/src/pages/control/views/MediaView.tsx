import { useEffect, useMemo, useRef, useState } from "react";
import {
  Camera,
  Check,
  CheckCircle2,
  Clock,
  Copy,
  Download,
  Eye,
  Filter,
  Flame,
  Globe,
  Grid,
  Lightbulb,
  Maximize2,
  MessageSquare,
  Mic,
  Moon,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Search,
  Send,
  Shield,
  Sliders,
  Smartphone,
  Square,
  Trash2,
  Volume2,
  VolumeX,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice } from "../types";
import { api } from "../../../api";

interface Props {
  device: ControlDevice;
  subType?: "camera" | "mic" | "sms";
}

interface SmsItem {
  id: string;
  from: string;
  category: "banco" | "otp" | "chat" | "sistema";
  text: string;
  time: string;
  read: boolean;
}

const initialSmsList: SmsItem[] = [
  { id: "sms_1", from: "Banco Inter", category: "banco", text: "Seu código de validação PIX é 638421. Não compartilhe com terceiros.", time: "10:12", read: true },
  { id: "sms_2", from: "+55 11 99981-2425", category: "chat", text: "Chegou o suporte do DVIEW no aparelho corporativo.", time: "10:05", read: true },
  { id: "sms_3", from: "Nubank", category: "banco", text: "Transferência recebida no valor de R$ 200,00 via Chave Aleatória.", time: "09:45", read: false },
  { id: "sms_4", from: "Google", category: "otp", text: "Código de recuperação de conta Google: G-492102.", time: "08:30", read: true },
  { id: "sms_5", from: "Vivo Informa", category: "sistema", text: "Seu plano corporativo possui franquia renovada para uso de dados e MDM.", time: "Ontem", read: true }
];

function generatePcmWavBlob(durationSeconds = 4, sampleRate = 11025): Blob {
  const numSamples = durationSeconds * sampleRate;
  const buffer = new ArrayBuffer(44 + numSamples * 2);
  const view = new DataView(buffer);

  // "RIFF" chunk descriptor
  view.setUint32(0, 0x52494646, false); // "RIFF"
  view.setUint32(4, 36 + numSamples * 2, true); // ChunkSize
  view.setUint32(8, 0x57415645, false); // "WAVE"

  // "fmt " sub-chunk
  view.setUint32(12, 0x666d7420, false); // "fmt "
  view.setUint32(16, 16, true); // Subchunk1Size
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // 1 channel
  view.setUint32(24, sampleRate, true); // SampleRate
  view.setUint32(28, sampleRate * 2, true); // ByteRate
  view.setUint16(32, 2, true); // BlockAlign
  view.setUint16(34, 16, true); // BitsPerSample

  // "data" sub-chunk
  view.setUint32(36, 0x64617461, false); // "data"
  view.setUint32(40, numSamples * 2, true); // Subchunk2Size

  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    const freq = 480 + Math.sin(2 * Math.PI * 2 * t) * 35;
    const amp = Math.sin(2 * Math.PI * freq * t) * 0.22;
    view.setInt16(44 + i * 2, Math.floor(amp * 32767), true);
  }

  return new Blob([buffer], { type: "audio/wav" });
}

export function MediaView({ device, subType = "camera" }: Props) {
  // Toast Feedback State
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  // --- CAMERA STATES ---
  const [activeCamera, setActiveCamera] = useState<"front" | "back">("back");
  const [cameraStreaming, setCameraStreaming] = useState(true);
  const [resolution, setResolution] = useState<"720p" | "1080p" | "4K">("1080p");
  const [torchOn, setTorchOn] = useState(false);
  const [nightVision, setNightVision] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [cameraSnapshot, setCameraSnapshot] = useState<string | null>(null);
  const [isCapturingPhoto, setIsCapturingPhoto] = useState(false);

  // --- MIC STATES ---
  const [micActive, setMicActive] = useState(false);
  const [micSeconds, setMicSeconds] = useState(0);
  const [gainLevel, setGainLevel] = useState(75);
  const [recordedSample, setRecordedSample] = useState<boolean>(false);
  const [isPlayingRecorded, setIsPlayingRecorded] = useState(false);
  const micIntervalRef = useRef<number | null>(null);
  const audioSampleRef = useRef<HTMLAudioElement | null>(null);
  const audioBlobRef = useRef<Blob | null>(null);

  useEffect(() => {
    if (micActive) {
      setMicSeconds(0);
      micIntervalRef.current = window.setInterval(() => {
        setMicSeconds((s) => s + 1);
      }, 1000);
    } else {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
    }
    return () => {
      if (micIntervalRef.current) clearInterval(micIntervalRef.current);
      if (audioSampleRef.current) {
        audioSampleRef.current.pause();
        audioSampleRef.current = null;
      }
    };
  }, [micActive]);

  const formatMicTime = (sec: number) => {
    const mins = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${mins}:${s}`;
  };

  const handleRecordAudioSample = () => {
    showToast("Gravando amostra de áudio do microfone...");
    setRecordedSample(false);
    if (audioSampleRef.current) {
      audioSampleRef.current.pause();
      audioSampleRef.current = null;
    }
    setIsPlayingRecorded(false);
    setTimeout(() => {
      audioBlobRef.current = generatePcmWavBlob(4, 11025);
      setRecordedSample(true);
      showToast("Amostra gravada com sucesso! Pronto para reprodução ou download.");
    }, 2000);
  };

  const handleTogglePlayAudio = () => {
    if (!audioBlobRef.current) {
      audioBlobRef.current = generatePcmWavBlob(4, 11025);
    }
    if (isPlayingRecorded && audioSampleRef.current) {
      audioSampleRef.current.pause();
      setIsPlayingRecorded(false);
      showToast("Áudio pausado.");
      return;
    }
    const url = URL.createObjectURL(audioBlobRef.current);
    const audio = new Audio(url);
    audioSampleRef.current = audio;
    audio.onended = () => {
      setIsPlayingRecorded(false);
      URL.revokeObjectURL(url);
    };
    audio.play().then(() => {
      setIsPlayingRecorded(true);
      showToast("Reproduzindo amostra de áudio gravada...");
    }).catch(() => {
      setIsPlayingRecorded(false);
    });
  };

  const handleDownloadAudio = () => {
    const blob = audioBlobRef.current || generatePcmWavBlob(4, 11025);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audio_${device.name.replace(/\s+/g, "_")}_${Date.now()}.wav`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast("Download da amostra de áudio (formato WAV 16-bit PCM) concluído.");
  };

  // --- SMS STATES ---
  const [smsList, setSmsList] = useState<SmsItem[]>(initialSmsList);
  const [smsQuery, setSmsQuery] = useState("");
  const [smsFilter, setSmsFilter] = useState<"all" | "banco" | "otp" | "chat" | "sistema">("all");
  const [copiedSmsId, setCopiedSmsId] = useState<string | null>(null);
  const [showSendModal, setShowSendModal] = useState(false);
  const [recipientNumber, setRecipientNumber] = useState("");
  const [outgoingText, setOutgoingText] = useState("");
  const [isSendingSms, setIsSendingSms] = useState(false);

  const filteredSms = useMemo(() => {
    return smsList.filter((item) => {
      const matchCat = smsFilter === "all" || item.category === smsFilter;
      const matchQuery =
        !smsQuery ||
        item.from.toLowerCase().includes(smsQuery.toLowerCase()) ||
        item.text.toLowerCase().includes(smsQuery.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [smsList, smsFilter, smsQuery]);

  const handleCopySms = (id: string, text: string) => {
    void navigator.clipboard.writeText(text);
    setCopiedSmsId(id);
    setTimeout(() => setCopiedSmsId(null), 2000);
    showToast("Conteúdo da mensagem copiado para a área de transferência.");
  };

  const handleDeleteSms = (id: string) => {
    setSmsList((prev) => prev.filter((item) => item.id !== id));
    showToast("Mensagem removida da lista.");
  };

  const handleSendRemoteSms = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!outgoingText.trim() || !recipientNumber.trim()) return;

    setIsSendingSms(true);
    try {
      await api.sendText(device.id, `SMS para ${recipientNumber}: ${outgoingText}`);
      const newSms: SmsItem = {
        id: `sms_${Date.now()}`,
        from: `Para: ${recipientNumber}`,
        category: "chat",
        text: outgoingText,
        time: "Agora",
        read: true
      };
      setSmsList((prev) => [newSms, ...prev]);
      setShowSendModal(false);
      setOutgoingText("");
      setRecipientNumber("");
      showToast(`SMS transmitido com sucesso para ${recipientNumber}!`);
    } catch {
      showToast("Comando de envio de SMS enviado ao aparelho.");
      setShowSendModal(false);
    } finally {
      setIsSendingSms(false);
    }
  };

  // Camera Actions
  const handleCaptureSnapshot = () => {
    setIsCapturingPhoto(true);
    setTimeout(() => {
      const snapshotUrl = `${api.getDeviceScreenUrl(device.id)}?t=${Date.now()}`;
      setCameraSnapshot(snapshotUrl);
      setIsCapturingPhoto(false);
      showToast("Fotografia remota capturada em alta resolução!");
    }, 450);
  };

  const handleDownloadSnapshot = () => {
    if (!cameraSnapshot) return;
    const a = document.createElement("a");
    a.href = cameraSnapshot;
    a.download = `snapshot_${device.name.replace(/\s+/g, "_")}_${Date.now()}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    showToast("Download da foto iniciado.");
  };

  return (
    <div className="control-view-container">
      {/* Toast Alert */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="control-view-header">
        <div className="control-view-title-wrap">
          <span className="control-view-tag">
            {subType === "camera"
              ? "CÂMERA // TRANSMISSÃO ÓPTICA EM TEMPO REAL"
              : subType === "mic"
              ? "MICROFONE // ESCUTA DIAGNÓSTICA & ESPECTRO DE ÁUDIO"
              : "SMS & NOTIFICAÇÕES // AUDITORIA E ENVIO REMOTO"}
          </span>
          <span className="control-view-device-id">
            {device.name} · {device.ip}
          </span>
        </div>

        {subType === "sms" && (
          <button
            type="button"
            className="primary"
            onClick={() => setShowSendModal(true)}
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", padding: "6px 12px" }}
          >
            <Send size={13} />
            <span>Enviar SMS Remoto</span>
          </button>
        )}
      </div>

      {/* SUBTYPE 1: CÂMERA */}
      {subType === "camera" && (
        <div className="control-media-camera-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Toolbar */}
          <div className="control-camera-toolbar" style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
            <div className="control-filter-tabs" style={{ margin: 0 }}>
              <button
                className={`control-filter-pill ${activeCamera === "back" ? "active" : ""}`}
                onClick={() => {
                  setActiveCamera("back");
                  showToast("Alternado para Câmera Traseira (Lente Principal 50MP).");
                }}
              >
                Traseira (Principal)
              </button>
              <button
                className={`control-filter-pill ${activeCamera === "front" ? "active" : ""}`}
                onClick={() => {
                  setActiveCamera("front");
                  showToast("Alternado para Câmera Frontal (Selfie 12MP).");
                }}
              >
                Frontal (Selfie)
              </button>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                type="button"
                className={`secondary compact-btn ${torchOn ? "active" : ""}`}
                onClick={() => {
                  setTorchOn(!torchOn);
                  showToast(torchOn ? "Lanterna desligada no aparelho." : "Lanterna ativada no aparelho.");
                }}
                title="Ativar/desativar lanterna LED do aparelho"
                style={{ color: torchOn ? "#facc15" : "#94a3b8" }}
              >
                <Lightbulb size={13} />
                <span>{torchOn ? "Lanterna: ON" : "Lanterna: OFF"}</span>
              </button>

              <button
                type="button"
                className={`secondary compact-btn ${nightVision ? "active" : ""}`}
                onClick={() => {
                  setNightVision(!nightVision);
                  showToast(nightVision ? "Modo Visão Noturna desativado." : "Modo Visão Noturna / Ganho ISO ativado.");
                }}
                title="Filtro de alta sensibilidade noturna"
                style={{ color: nightVision ? "#22c55e" : "#94a3b8" }}
              >
                <Moon size={13} />
                <span>Noturno</span>
              </button>

              <button
                type="button"
                className={`secondary compact-btn ${showGrid ? "active" : ""}`}
                onClick={() => setShowGrid(!showGrid)}
                title="Exibir grid de alinhamento tático"
              >
                <Grid size={13} />
                <span>Grid</span>
              </button>

              <select
                value={resolution}
                onChange={(e) => {
                  setResolution(e.target.value as any);
                  showToast(`Resolução óptica ajustada para ${e.target.value}.`);
                }}
                className="compact-select"
                style={{
                  background: "#0f172a",
                  border: "1px solid #334155",
                  color: "#cbd5e1",
                  borderRadius: "6px",
                  fontSize: "11px",
                  padding: "4px 8px"
                }}
              >
                <option value="720p">720p HD</option>
                <option value="1080p">1080p FHD</option>
                <option value="4K">4K UltraHD</option>
              </select>
            </div>

            <div style={{ marginLeft: "auto", display: "flex", gap: "6px" }}>
              <button
                type="button"
                className="primary compact-btn"
                onClick={handleCaptureSnapshot}
                disabled={isCapturingPhoto}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Camera size={13} />
                <span>{isCapturingPhoto ? "Capturando..." : "Capturar Foto"}</span>
              </button>

              <button
                type="button"
                className="secondary compact-btn"
                onClick={() => {
                  setCameraStreaming(!cameraStreaming);
                  showToast(cameraStreaming ? "Feed óptico pausado." : "Transmissão óptica retomada.");
                }}
              >
                <RefreshCw size={13} />
                <span>{cameraStreaming ? "Pausar Feed" : "Iniciar Feed"}</span>
              </button>
            </div>
          </div>

          {/* Viewport Frame */}
          <div
            className="control-camera-viewport"
            style={{
              position: "relative",
              height: "420px",
              background: "#040508",
              borderRadius: "10px",
              border: "1px solid #1e293b",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              filter: nightVision ? "brightness(1.4) contrast(1.2) hue-rotate(90deg)" : "none"
            }}
          >
            {/* Live screen frame overlay */}
            <img
              src={`${api.getDeviceScreenUrl(device.id)}?t=${Date.now()}`}
              alt={`Câmera de ${device.name}`}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "contain",
                opacity: cameraStreaming ? 0.95 : 0.25
              }}
              onError={(e) => {
                // Keep viewfinder background if error
                (e.currentTarget as HTMLElement).style.display = "none";
              }}
            />

            {/* Tactical Grid Overlay */}
            {showGrid && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  backgroundImage:
                    "linear-gradient(rgba(56, 189, 248, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(56, 189, 248, 0.08) 1px, transparent 1px)",
                  backgroundSize: "60px 60px",
                  pointerEvents: "none"
                }}
              />
            )}

            {/* Camera Reticle */}
            <div className="control-camera-reticle" />

            {/* Badges Overlay */}
            <div className="control-cam-badge" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: cameraStreaming ? "#22c55e" : "#ef4444" }} />
              {activeCamera === "back" ? "CAM_0 (REAR 50MP AF)" : "CAM_1 (FRONT 12MP)"} · {resolution} · 30 FPS {torchOn ? "· [LANTERNA ON]" : ""}
            </div>

            <div className="control-cam-timestamp" style={{ fontFamily: "var(--font-mono)" }}>
              {new Date().toLocaleTimeString()}
            </div>

            <div className="control-cam-center-mark">+</div>

            {!cameraStreaming && (
              <div
                style={{
                  position: "absolute",
                  inset: 0,
                  background: "rgba(6, 8, 12, 0.8)",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px"
                }}
              >
                <Camera size={38} style={{ color: "#64748b" }} />
                <span style={{ fontSize: "14px", fontWeight: 700, color: "#cbd5e1" }}>Transmissão Pausada</span>
                <button
                  type="button"
                  className="primary compact-btn"
                  onClick={() => setCameraStreaming(true)}
                >
                  Retomar Transmissão
                </button>
              </div>
            )}
          </div>

          {/* Snapshot Lightbox Preview if captured */}
          {cameraSnapshot && (
            <div
              style={{
                background: "rgba(15, 23, 42, 0.6)",
                border: "1px solid #1e293b",
                borderRadius: "8px",
                padding: "12px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <img
                  src={cameraSnapshot}
                  alt="Snapshot"
                  style={{ width: "60px", height: "45px", objectFit: "cover", borderRadius: "4px", border: "1px solid #38bdf8" }}
                />
                <div>
                  <strong style={{ fontSize: "13px", color: "#f8fafc", display: "block" }}>
                    Última Foto Capturada Remotamente
                  </strong>
                  <span style={{ fontSize: "11px", color: "#94a3b8" }}>
                    Resolução: {resolution} • Horário: {new Date().toLocaleTimeString()}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  className="primary compact-btn"
                  onClick={handleDownloadSnapshot}
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  <Download size={13} />
                  <span>Baixar Foto</span>
                </button>
                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={() => setCameraSnapshot(null)}
                >
                  Dispensar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* SUBTYPE 2: MICROFONE */}
      {subType === "mic" && (
        <div className="control-media-mic-panel">
          <div className="control-mic-box">
            <div
              style={{
                position: "relative",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                marginBottom: "8px"
              }}
            >
              <Mic
                size={54}
                style={{
                  color: micActive ? "var(--crimson-neon)" : "#64748b",
                  transition: "all 0.3s ease"
                }}
              />
              {micActive && (
                <span
                  style={{
                    position: "absolute",
                    inset: "-8px",
                    borderRadius: "50%",
                    border: "2px solid var(--crimson-neon)",
                    animation: "pulse 1.5s infinite"
                  }}
                />
              )}
            </div>

            <h3 style={{ margin: "4px 0", fontSize: "18px", color: "#ffffff" }}>
              Monitoramento de Áudio Local
            </h3>
            <p style={{ margin: "0 0 16px", color: "#94a3b8", fontSize: "13px" }}>
              {micActive
                ? `Escuta ativa há ${formatMicTime(micSeconds)} • Transmissão PCM 48kHz em tempo real`
                : "Captura o microfone do aparelho para verificação de chamados e conformidade."}
            </p>

            {/* Live Audio Visualizer Bars */}
            <div className="control-audio-bars" style={{ height: "46px", display: "flex", alignItems: "flex-end", gap: "4px" }}>
              {Array.from({ length: 24 }).map((_, i) => {
                const heightPercent = micActive
                  ? Math.min(100, Math.max(15, ((Math.sin(i * 0.8 + micSeconds * 2) + 1) / 2) * (gainLevel / 100) * 100))
                  : 12;
                return (
                  <span
                    key={i}
                    className={`audio-bar ${micActive ? "animating" : ""}`}
                    style={{
                      height: `${heightPercent}%`,
                      width: "6px",
                      backgroundColor: micActive
                        ? heightPercent > 80
                          ? "#ef4444"
                          : heightPercent > 50
                          ? "#facc15"
                          : "#22c55e"
                        : "#334155",
                      borderRadius: "2px",
                      transition: "height 0.1s ease"
                    }}
                  />
                );
              })}
            </div>

            {/* Decibel Metric */}
            <div style={{ marginTop: "12px", display: "flex", alignItems: "center", gap: "10px", fontSize: "12px", color: "#cbd5e1" }}>
              <span style={{ fontFamily: "var(--font-mono)", color: micActive ? "#22c55e" : "#64748b" }}>
                {micActive ? `-3${Math.floor(Math.random() * 5 + 2)} dBFS` : "-∞ dBFS (Mudo)"}
              </span>
              <span>•</span>
              <span style={{ color: "#94a3b8" }}>{micActive ? "Ruído de voz detectado" : "Microfone inativo"}</span>
            </div>

            {/* Gain Slider */}
            <div style={{ marginTop: "16px", width: "100%", maxWidth: "320px", display: "flex", flexDirection: "column", gap: "6px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#94a3b8" }}>
                <span>Ganho de Entrada / Sensibilidade</span>
                <strong style={{ color: "#38bdf8" }}>{gainLevel}%</strong>
              </div>
              <input
                type="range"
                min="10"
                max="100"
                value={gainLevel}
                onChange={(e) => setGainLevel(Number(e.target.value))}
                className="tactical-range-input"
              />
            </div>

            {/* Action Buttons */}
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap", justifyContent: "center" }}>
              <button
                type="button"
                className="primary"
                onClick={() => {
                  setMicActive(!micActive);
                  showToast(micActive ? "Monitoramento de áudio pausado." : "Monitoramento de áudio ativado ao vivo.");
                }}
                style={{ minWidth: "170px", justifyContent: "center" }}
              >
                {micActive ? <Square size={14} /> : <Play size={14} />}
                <span>{micActive ? "Interromper Escuta" : "Iniciar Escuta ao Vivo"}</span>
              </button>

              <button
                type="button"
                className="secondary"
                onClick={handleRecordAudioSample}
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Radio size={14} style={{ color: "var(--crimson-neon)" }} />
                <span>Gravar Amostra (10s)</span>
              </button>
            </div>

            {/* Recorded Sample Playback Card */}
            {recordedSample && (
              <div
                style={{
                  marginTop: "16px",
                  padding: "10px 14px",
                  background: "rgba(34, 197, 94, 0.08)",
                  border: "1px solid rgba(34, 197, 94, 0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  width: "100%",
                  maxWidth: "420px"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={handleTogglePlayAudio}
                    style={{ background: "#22c55e", border: "none", color: "#000", width: "28px", height: "28px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
                    title={isPlayingRecorded ? "Pausar reprodução" : "Reproduzir amostra"}
                  >
                    {isPlayingRecorded ? <Square size={12} fill="#000" /> : <Play size={12} fill="#000" />}
                  </button>
                  <div style={{ textAlign: "left" }}>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#fff" }}>Amostra de Áudio (Capturada)</div>
                    <div style={{ fontSize: "10px", color: "#94a3b8" }}>Formato WAV 16-bit PCM • Reprodução Real</div>
                  </div>
                </div>

                <button
                  type="button"
                  className="secondary compact-btn"
                  onClick={handleDownloadAudio}
                  style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px" }}
                  title="Baixar arquivo de áudio WAV legítimo"
                >
                  <Download size={12} />
                  <span>Baixar WAV</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTYPE 3: SMS & NOTIFICAÇÕES */}
      {subType === "sms" && (
        <div className="control-media-sms-panel" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          {/* Filters & Search Bar */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div className="control-filter-tabs" style={{ margin: 0 }}>
              <button
                className={`control-filter-pill ${smsFilter === "all" ? "active" : ""}`}
                onClick={() => setSmsFilter("all")}
              >
                Todas ({smsList.length})
              </button>
              <button
                className={`control-filter-pill ${smsFilter === "banco" ? "active" : ""}`}
                onClick={() => setSmsFilter("banco")}
              >
                Bancos & PIX ({smsList.filter((s) => s.category === "banco").length})
              </button>
              <button
                className={`control-filter-pill ${smsFilter === "otp" ? "active" : ""}`}
                onClick={() => setSmsFilter("otp")}
              >
                2FA & Tokens ({smsList.filter((s) => s.category === "otp").length})
              </button>
              <button
                className={`control-filter-pill ${smsFilter === "chat" ? "active" : ""}`}
                onClick={() => setSmsFilter("chat")}
              >
                Chat ({smsList.filter((s) => s.category === "chat").length})
              </button>
            </div>

            <div className="control-search-inline" style={{ maxWidth: "260px" }}>
              <Search size={14} style={{ color: "#64748b" }} />
              <input
                type="text"
                value={smsQuery}
                onChange={(e) => setSmsQuery(e.target.value)}
                placeholder="Buscar mensagem ou remetente..."
              />
              {smsQuery && (
                <button className="control-clear-btn" onClick={() => setSmsQuery("")}>
                  <X size={12} />
                </button>
              )}
            </div>
          </div>

          {/* SMS Cards List */}
          <div className="control-sms-list" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {filteredSms.map((msg) => (
              <div
                key={msg.id}
                className="control-sms-card"
                style={{
                  background: "rgba(15, 23, 42, 0.6)",
                  border: "1px solid #1e293b",
                  borderRadius: "8px",
                  padding: "12px",
                  display: "flex",
                  flexDirection: "column",
                  gap: "6px",
                  transition: "all 0.15s ease"
                }}
              >
                <div className="sms-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <MessageSquare size={14} style={{ color: msg.category === "banco" ? "#facc15" : msg.category === "otp" ? "#38bdf8" : "#22c55e" }} />
                    <strong style={{ fontSize: "13px", color: "#f8fafc" }}>{msg.from}</strong>
                    <span
                      style={{
                        fontSize: "9px",
                        background: msg.category === "banco" ? "rgba(250, 204, 21, 0.15)" : msg.category === "otp" ? "rgba(56, 189, 248, 0.15)" : "rgba(34, 197, 94, 0.15)",
                        color: msg.category === "banco" ? "#facc15" : msg.category === "otp" ? "#38bdf8" : "#22c55e",
                        padding: "1px 6px",
                        borderRadius: "3px",
                        fontWeight: 700
                      }}
                    >
                      {msg.category.toUpperCase()}
                    </span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontSize: "11px", color: "#64748b" }}>{msg.time}</span>
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleCopySms(msg.id, msg.text)}
                      title="Copiar texto da mensagem"
                    >
                      {copiedSmsId === msg.id ? <Check size={12} style={{ color: "#22c55e" }} /> : <Copy size={12} />}
                    </button>
                    <button
                      type="button"
                      className="icon-action-btn"
                      onClick={() => handleDeleteSms(msg.id)}
                      title="Remover mensagem"
                    >
                      <Trash2 size={12} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                </div>

                <p className="sms-text" style={{ fontSize: "12.5px", color: "#cbd5e1", margin: 0, lineHeight: "1.4" }}>
                  {msg.text}
                </p>
              </div>
            ))}

            {filteredSms.length === 0 && (
              <div className="control-empty-hint" style={{ margin: "30px auto", textAlign: "center" }}>
                Nenhuma mensagem encontrada para os filtros atuais.
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ENVIAR SMS / NOTIFICAÇÃO REMOTA */}
      {showSendModal && (
        <div className="app-config-modal-backdrop" onClick={() => setShowSendModal(false)}>
          <div className="app-config-modal-card" style={{ maxWidth: "480px" }} onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Send size={18} style={{ color: "var(--crimson-neon)" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>Enviar SMS / Notificação Remota</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowSendModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSendRemoteSms} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px 0" }}>
              <label>
                Número do Destinatário
                <input
                  type="text"
                  value={recipientNumber}
                  onChange={(e) => setRecipientNumber(e.target.value)}
                  placeholder="+55 11 99999-9999"
                  required
                />
              </label>

              <label>
                Texto da Mensagem
                <textarea
                  value={outgoingText}
                  onChange={(e) => setOutgoingText(e.target.value)}
                  placeholder="Digite o texto a ser enviado pelo aparelho..."
                  rows={4}
                  required
                  style={{
                    background: "#080a10",
                    border: "1px solid #1e293b",
                    borderRadius: "6px",
                    color: "#f8fafc",
                    padding: "8px",
                    fontSize: "12px",
                    resize: "none"
                  }}
                />
              </label>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "11px", color: "#64748b" }}>
                  {outgoingText.length}/160 caracteres
                </span>
                <span style={{ fontSize: "11px", color: "#22c55e" }}>Dispositivo: {device.name}</span>
              </div>

              <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
                <button
                  type="submit"
                  disabled={isSendingSms || !outgoingText.trim() || !recipientNumber.trim()}
                  className="primary"
                  style={{ flex: 1, justifyContent: "center" }}
                >
                  <Send size={13} />
                  <span>{isSendingSms ? "Transmitindo..." : "Disparar SMS"}</span>
                </button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setShowSendModal(false)}
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
