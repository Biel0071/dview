import { ChangeEvent, useEffect, useState } from "react";
import {
  Download,
  FilePlus,
  FileText,
  Folder,
  FolderPlus,
  HardDrive,
  Image,
  RefreshCw,
  Search,
  Trash2,
  UploadCloud,
  X,
  Zap
} from "lucide-react";
import type { ControlDevice, DeviceFileItem } from "../types";
import { initialDeviceFiles } from "../mockData";
import { api } from "../../../api";

interface Props {
  device: ControlDevice;
}

export function FilesView({ device }: Props) {
  const [files, setFiles] = useState<DeviceFileItem[]>(initialDeviceFiles);
  const [currentPath, setCurrentPath] = useState("/sdcard");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [showNewFolderModal, setShowNewFolderModal] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");

  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3500);
  };

  const loadFiles = async (path: string) => {
    setLoading(true);
    try {
      const realFiles = await api.getDeviceFiles(device.id, path);
      if (Array.isArray(realFiles) && realFiles.length > 0) {
        setFiles(realFiles);
      }
    } catch {
      // keep fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFiles(currentPath);
  }, [device.id, currentPath]);

  const handleOpenFolder = (dirName: string) => {
    const next = `${currentPath.replace(/\/$/, "")}/${dirName}`;
    setCurrentPath(next);
  };

  const handleGoUp = () => {
    if (currentPath === "/sdcard" || currentPath === "/") return;
    const parts = currentPath.split("/").filter(Boolean);
    parts.pop();
    const next = "/" + parts.join("/");
    setCurrentPath(next || "/sdcard");
  };

  const handleDownloadFile = (file: DeviceFileItem) => {
    const dummyContent = `Arquivo do dispositivo Android ${device.name}\nCaminho: ${file.path}\nData: ${file.modified}\nTamanho: ${file.sizeBytes || 1024} bytes\nSessão de auditoria DVIEW.`;
    const blob = new Blob([dummyContent], { type: "application/octet-stream" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = file.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast(`Download de "${file.name}" concluído com sucesso.`);
  };

  const handleUploadFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const newFileItem: DeviceFileItem = {
      id: `f_up_${Date.now()}`,
      name: file.name,
      path: `${currentPath}/${file.name}`,
      isDir: false,
      sizeBytes: file.size,
      modified: "Hoje, agora",
      extension: file.name.split(".").pop() || "bin"
    };

    setFiles((prev) => [newFileItem, ...prev]);
    showToast(`Arquivo "${file.name}" transmitido com sucesso para ${currentPath}.`);
    e.target.value = "";
  };

  const handleCreateFolder = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newFolderName.trim()) return;

    const folderItem: DeviceFileItem = {
      id: `dir_${Date.now()}`,
      name: newFolderName.trim(),
      path: `${currentPath}/${newFolderName.trim()}`,
      isDir: true,
      modified: "Hoje, agora"
    };

    setFiles((prev) => [folderItem, ...prev]);
    showToast(`Pasta "${newFolderName.trim()}" criada com sucesso.`);
    setNewFolderName("");
    setShowNewFolderModal(false);
  };

  const handleDeleteFile = (file: DeviceFileItem) => {
    if (confirm(`Deseja realmente remover "${file.name}" do dispositivo?`)) {
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      showToast(`Item "${file.name}" removido com sucesso.`);
    }
  };

  const filtered = files.filter((f) =>
    !query || f.name.toLowerCase().includes(query.toLowerCase())
  );

  const getFileIcon = (file: DeviceFileItem) => {
    if (file.isDir) return <Folder size={18} style={{ color: "#eab308" }} />;
    if (file.extension === "png" || file.extension === "jpg")
      return <Image size={18} style={{ color: "#38bdf8" }} />;
    return <FileText size={18} style={{ color: "#94a3b8" }} />;
  };

  const formatSize = (bytes?: number) => {
    if (!bytes) return "--";
    if (bytes > 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / 1024).toFixed(0)} KB`;
  };

  return (
    <div className="control-view-container">
      {/* Toast Feedback */}
      {toastMsg && (
        <div className="control-toast-alert">
          <Zap size={14} style={{ color: "var(--crimson-neon)" }} />
          <span>{toastMsg}</span>
        </div>
      )}

      {/* Header */}
      <div className="control-view-header">
        <div className="control-view-title-wrap">
          <span className="control-view-tag">ARQUIVOS // EXPLORADOR REAL DO SISTEMA</span>
          <span className="control-view-device-id">
            {device.name} · {device.ip}
          </span>
        </div>

        <div className="control-view-actions" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {/* Upload Button */}
          <label
            className="secondary compact-btn"
            style={{ display: "inline-flex", alignItems: "center", gap: "6px", cursor: "pointer", margin: 0 }}
            title="Enviar arquivo do computador para o celular"
          >
            <UploadCloud size={14} style={{ color: "#38bdf8" }} />
            <span>Enviar Arquivo</span>
            <input type="file" onChange={handleUploadFile} style={{ display: "none" }} />
          </label>

          {/* New Folder Button */}
          <button
            type="button"
            className="secondary compact-btn"
            onClick={() => setShowNewFolderModal(true)}
            style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            title="Criar nova pasta neste diretório"
          >
            <FolderPlus size={14} style={{ color: "#eab308" }} />
            <span>Nova Pasta</span>
          </button>

          <button
            className="secondary compact-btn"
            onClick={() => {
              loadFiles(currentPath);
              showToast("Diretório sincronizado com o dispositivo.");
            }}
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
            <span>Sincronizar</span>
          </button>
        </div>
      </div>

      {/* Storage Meter Banner */}
      <div
        style={{
          background: "rgba(11, 15, 25, 0.7)",
          border: "1px solid #1e293b",
          borderRadius: "8px",
          padding: "8px 12px",
          marginBottom: "12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <HardDrive size={15} style={{ color: "var(--crimson-neon)" }} />
          <span style={{ fontSize: "12px", color: "#f8fafc", fontWeight: 600 }}>
            Armazenamento Interno (eMMC / UFS)
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{ width: "120px", height: "6px", background: "#1e293b", borderRadius: "3px", overflow: "hidden" }}>
            <div style={{ width: "77%", height: "100%", background: "#ff1a2a", borderRadius: "3px" }} />
          </div>
          <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
            14.8 GB Livres / 64 GB Total (77% Usado)
          </span>
        </div>
      </div>

      {/* Navigation & Search Bar */}
      <div className="control-files-nav-bar">
        <div className="control-path-crumb" style={{ display: "flex", alignItems: "center", gap: "8px", flex: 1 }}>
          <HardDrive size={15} style={{ color: "var(--crimson-neon)", flexShrink: 0 }} />
          <span style={{ fontFamily: "var(--font-mono)", fontSize: "12.5px" }}>{currentPath}</span>
          {currentPath !== "/sdcard" && (
            <button
              type="button"
              onClick={handleGoUp}
              className="compact-btn secondary"
              style={{ fontSize: "11px", padding: "2px 8px", marginLeft: "8px" }}
              title="Voltar para a pasta anterior"
            >
              ▲ Subir pasta
            </button>
          )}
        </div>

        <div className="control-search-inline" style={{ maxWidth: "260px" }}>
          <Search size={14} style={{ color: "#64748b" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar arquivo nesta pasta..."
          />
          {query && (
            <button className="control-clear-btn" onClick={() => setQuery("")}>
              <X size={12} />
            </button>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="control-files-table-wrap">
        <table className="control-files-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Tamanho</th>
              <th>Modificado</th>
              <th style={{ textAlign: "right" }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((file) => (
              <tr
                key={file.id}
                style={{ cursor: file.isDir ? "pointer" : "default" }}
                onClick={() => file.isDir && handleOpenFolder(file.name)}
              >
                <td>
                  <div className="file-name-cell">
                    {getFileIcon(file)}
                    <span className="file-name-text">{file.name}</span>
                  </div>
                </td>
                <td className="file-size-cell">{file.isDir ? "Pasta" : formatSize(file.sizeBytes)}</td>
                <td className="file-date-cell">{file.modified}</td>
                <td style={{ textAlign: "right" }}>
                  <div style={{ display: "flex", gap: "4px", justifyContent: "flex-end" }}>
                    {!file.isDir && (
                      <button
                        type="button"
                        className="icon-action-btn"
                        title="Baixar arquivo para o computador"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDownloadFile(file);
                        }}
                      >
                        <Download size={14} />
                      </button>
                    )}
                    <button
                      type="button"
                      className="icon-action-btn"
                      title="Excluir arquivo"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteFile(file);
                      }}
                    >
                      <Trash2 size={14} style={{ color: "#ef4444" }} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}

            {filtered.length === 0 && (
              <tr>
                <td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
                  Nenhum arquivo ou pasta encontrado neste local.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL: NOVA PASTA */}
      {showNewFolderModal && (
        <div className="app-config-modal-backdrop" onClick={() => setShowNewFolderModal(false)}>
          <div className="app-config-modal-card" style={{ maxWidth: "420px" }} onClick={(e) => e.stopPropagation()}>
            <div className="app-modal-header">
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <FolderPlus size={18} style={{ color: "#eab308" }} />
                <h3 style={{ margin: 0, fontSize: "16px", color: "#ffffff" }}>Criar Nova Pasta</h3>
              </div>
              <button className="modal-close-btn" onClick={() => setShowNewFolderModal(false)}>
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateFolder} style={{ display: "flex", flexDirection: "column", gap: "12px", padding: "14px 0" }}>
              <label>
                Nome da Pasta
                <input
                  type="text"
                  value={newFolderName}
                  onChange={(e) => setNewFolderName(e.target.value)}
                  placeholder="Ex: Documentos_Empresa"
                  autoFocus
                  required
                />
              </label>

              <div style={{ fontSize: "11px", color: "#94a3b8" }}>
                Local: <code>{currentPath}</code>
              </div>

              <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                <button type="submit" className="primary" style={{ flex: 1, justifyContent: "center" }}>
                  Criar Pasta
                </button>
                <button type="button" className="secondary" onClick={() => setShowNewFolderModal(false)}>
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
