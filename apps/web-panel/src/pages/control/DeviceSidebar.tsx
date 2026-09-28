import { useMemo, useState } from "react";
import { Battery, MonitorSmartphone, Plus, Radio, Search, Smartphone, Star, Wifi, WifiOff, X } from "lucide-react";
import type { ControlDevice } from "./types";

interface Props {
  devices: ControlDevice[];
  selectedId: string;
  onSelect: (device: ControlDevice) => void;
  onToggleFavorite?: (deviceId: string) => void;
  onAddEmulator?: () => void;
}

export function DeviceSidebar({
  devices,
  selectedId,
  onSelect,
  onToggleFavorite,
  onAddEmulator
}: Props) {
  const [query, setQuery] = useState("");
  const [filterMode, setFilterMode] = useState<"all" | "favorites" | "online" | "offline">("all");

  const isEmulatorDevice = (d: ControlDevice) => {
    return (
      d.id.startsWith("emu") ||
      d.name.toLowerCase().includes("emulador") ||
      d.model.toLowerCase().includes("emulator") ||
      d.model.toLowerCase().includes("avd")
    );
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return devices.filter((d) => {
      const matchStatus =
        filterMode === "all" ||
        (filterMode === "favorites" && Boolean(d.isFavorite)) ||
        (filterMode === "online" && d.status === "online") ||
        (filterMode === "offline" && d.status === "offline");

      const matchQuery =
        !q ||
        d.name.toLowerCase().includes(q) ||
        d.model.toLowerCase().includes(q) ||
        d.ip.includes(q);

      return matchStatus && matchQuery;
    });
  }, [devices, query, filterMode]);

  // Group devices by temporal section: "HOJE", "ONTEM", etc.
  const groupedSections = useMemo(() => {
    const groups: { [key: string]: ControlDevice[] } = {};
    const defaultOrder = ["HOJE", "ONTEM", "EMULADORES"];

    for (const d of filtered) {
      const gKey = d.dateGroup || "HOJE";
      if (!groups[gKey]) {
        groups[gKey] = [];
      }
      groups[gKey].push(d);
    }

    const orderedKeys: string[] = [];
    for (const key of defaultOrder) {
      if (groups[key]) {
        orderedKeys.push(key);
      }
    }
    for (const key of Object.keys(groups)) {
      if (!orderedKeys.includes(key)) {
        orderedKeys.push(key);
      }
    }

    return orderedKeys.map((title) => ({
      title,
      items: groups[title]
    }));
  }, [filtered]);

  const favoritesCount = devices.filter((d) => Boolean(d.isFavorite)).length;
  const onlineCount = devices.filter((d) => d.status === "online").length;

  return (
    <aside className="control-col-sidebar">
      {/* Search Input */}
      <div className="control-search-wrap">
        <Search size={14} style={{ color: "#94a3b8" }} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar dispositivo..."
        />
        {query && (
          <button className="control-clear-btn" onClick={() => setQuery("")} title="Limpar busca">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Filter Mode Tabs */}
      <div className="control-sidebar-filter-chips" style={{ display: "flex", gap: "4px", padding: "0 10px 8px 10px" }}>
        <button
          type="button"
          className={`control-sidebar-filter-btn ${filterMode === "all" ? "active" : ""}`}
          onClick={() => setFilterMode("all")}
        >
          Todos ({devices.length})
        </button>
        <button
          type="button"
          className={`control-sidebar-filter-btn ${filterMode === "online" ? "active" : ""}`}
          onClick={() => setFilterMode("online")}
        >
          Online ({onlineCount})
        </button>
        <button
          type="button"
          className={`control-sidebar-filter-btn ${filterMode === "favorites" ? "active" : ""}`}
          onClick={() => setFilterMode("favorites")}
          title="Favoritos"
        >
          ★ ({favoritesCount})
        </button>
      </div>

      {/* Grouped Devices List */}
      <div className="control-devices-scroll">
        {devices.length === 0 ? (
          <div className="control-empty-sidebar-card">
            <Smartphone size={26} style={{ color: "#64748b", margin: "0 auto 8px", display: "block" }} />
            <strong style={{ fontSize: "12.5px", color: "#f1f5f9", display: "block", textAlign: "center" }}>
              Nenhum aparelho conectado
            </strong>
            <p style={{ fontSize: "11px", color: "#94a3b8", textAlign: "center", margin: "6px 0 12px" }}>
              Inicie um emulador local ou conecte um smartphone físico com o agente.
            </p>
            {onAddEmulator && (
              <button
                type="button"
                className="primary compact-btn"
                onClick={onAddEmulator}
                style={{ width: "100%", justifyContent: "center", fontSize: "11.5px" }}
              >
                <Plus size={13} /> Conectar Emulador
              </button>
            )}
          </div>
        ) : filtered.length === 0 ? (
          <div className="control-empty-hint">Nenhum dispositivo encontrado.</div>
        ) : (
          groupedSections.map((group) => (
            <div key={group.title} className="control-device-group">
              <div className="control-temporal-group-header">
                <span className="control-group-title">{group.title}</span>
              </div>

              {group.items.map((device) => {
                const isSelected = device.id === selectedId;
                const isOnline = device.status === "online";
                const isFav = Boolean(device.isFavorite);

                return (
                  <div
                    key={device.id}
                    className={`control-device-card ${isSelected ? "selected-tactical" : ""} ${!isOnline ? "offline" : ""}`}
                    onClick={() => onSelect(device)}
                  >
                    <div className="control-device-left-meta">
                      <span
                        className={`control-status-dot-indicator ${isOnline ? "online" : "offline"}`}
                        title={isOnline ? "Conectado / Online" : "Desconectado / Offline"}
                      />
                    </div>

                    <div className="control-device-info-col">
                      <span className="control-device-label-name" title={device.name}>
                        {device.name}
                      </span>
                      <div className="control-device-row-bottom">
                        <span className="control-device-sub-ip">{device.ip}</span>
                        {isOnline ? (
                          <span
                            className={`sidebar-net-pill ${
                              device.networkType === "4g" || device.networkType === "5g" ? "cellular" : "wifi"
                            }`}
                            title={`${device.networkName || "Wi-Fi"} · ${device.networkSpeed || "86 Mbps"}`}
                          >
                            {device.networkType === "4g" || device.networkType === "5g" ? (
                              <Radio size={9} />
                            ) : (
                              <Wifi size={9} />
                            )}
                            <span>{device.networkSpeed || "86 Mbps"}</span>
                          </span>
                        ) : (
                          <span className="sidebar-net-pill offline" title="Aparelho offline">
                            <WifiOff size={9} />
                            <span>Offline</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="control-device-right-meta">
                      <span className="control-device-time-ago">{device.lastSeen}</span>
                      <button
                        type="button"
                        className={`control-favorite-btn ${isFav ? "is-favorite" : ""}`}
                        title={isFav ? "Remover dos favoritos" : "Favoritar dispositivo"}
                        onClick={(e) => {
                          e.stopPropagation();
                          onToggleFavorite?.(device.id);
                        }}
                      >
                        <Star
                          size={12}
                          fill={isFav ? "#facc15" : "none"}
                          color={isFav ? "#facc15" : "#475569"}
                        />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ))
        )}
      </div>

      {/* Quick Add / Spawn Emulator Button in Footer */}
      {onAddEmulator && (
        <div className="control-sidebar-footer-action">
          <button
            type="button"
            className="control-add-emu-btn"
            onClick={onAddEmulator}
            title="Conectar ou adicionar nova instância de emulador Android"
          >
            <Plus size={14} />
            <span>Adicionar Emulador</span>
          </button>
        </div>
      )}
    </aside>
  );
}
