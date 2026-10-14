import React from "react";
import {
  Sparkles,
  RotateCcw,
  Palette,
  Check,
  Sliders,
  ShieldAlert,
  CheckCircle2,
  ArrowLeft,
  Eye
} from "lucide-react";
import type { ScreenCustomizationConfig } from "@droidview/shared";
import { defaultScreenConfig, brandAccentPresets } from "./types";

export interface ApkScreenCustomizerTabProps {
  screenConfig: ScreenCustomizationConfig;
  setScreenConfig: React.Dispatch<React.SetStateAction<ScreenCustomizationConfig>>;
  showToast: (msg: string) => void;
  renderAppLogo: (size?: number, borderRadius?: number) => React.ReactNode;
  appName: string;
  setActiveModalTab: React.Dispatch<React.SetStateAction<"form" | "screens" | "preview">>;
}

export const ApkScreenCustomizerTab: React.FC<ApkScreenCustomizerTabProps> = ({
  screenConfig,
  setScreenConfig,
  showToast,
  renderAppLogo,
  appName,
  setActiveModalTab
}) => {
  return (
    <div className="screen-customizer-container">
                {/* Banner Informativo */}
                <div className="customizer-intro-banner">
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <Sparkles size={20} style={{ color: "var(--crimson-neon)", flexShrink: 0 }} />
                    <div>
                      <strong style={{ fontSize: "14px", color: "#f8fafc", display: "block" }}>
                        Personalização Dinâmica de Todas as Telas de Instalação e Ativação
                      </strong>
                      <span style={{ fontSize: "12px", color: "#94a3b8" }}>
                        O logotipo, o nome do aplicativo e todos os textos ajustados aqui refletem em tempo real no simulador interativo de 10 etapas e são embutidos nos parâmetros do APK.
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    className="secondary compact-btn"
                    onClick={() => {
                      setScreenConfig(defaultScreenConfig);
                      showToast("Textos e parâmetros restaurados para o padrão oficial do vídeo!");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <RotateCcw size={13} />
                    <span>Restaurar Padrão do Vídeo</span>
                  </button>
                </div>

                {/* Grid de Seções de Customização */}
                <div className="customizer-grid">
                  {/* CARD 1: Identidade Visual e Cor de Destaque */}
                  <div className="customizer-card">
                    <h4 className="customizer-card-title">
                      <Palette size={15} style={{ color: screenConfig.accentColor || "#dc2626" }} />
                      Identidade Visual & Cor de Destaque
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      <div>
                        <label style={{ fontSize: "12px", color: "#cbd5e1", marginBottom: "6px", display: "block" }}>
                          Paleta de Cores da Marca:
                        </label>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                          {brandAccentPresets.map((preset) => (
                            <button
                              key={preset.hex}
                              type="button"
                              className={`color-swatch-btn ${screenConfig.accentColor === preset.hex ? "active" : ""}`}
                              style={{ backgroundColor: preset.hex }}
                              onClick={() => setScreenConfig((prev) => ({ ...prev, accentColor: preset.hex }))}
                              title={preset.name}
                            >
                              {screenConfig.accentColor === preset.hex && <Check size={12} color="#ffffff" />}
                            </button>
                          ))}
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginLeft: "6px" }}>
                            <input
                              type="color"
                              value={screenConfig.accentColor || "#dc2626"}
                              onChange={(e) => setScreenConfig((prev) => ({ ...prev, accentColor: e.target.value }))}
                              style={{ width: "28px", height: "28px", padding: 0, border: "none", borderRadius: "50%", cursor: "pointer", background: "transparent" }}
                              title="Selecionar cor personalizada"
                            />
                            <span style={{ fontSize: "11px", color: "#94a3b8", fontFamily: "var(--font-mono)" }}>
                              {screenConfig.accentColor || "#dc2626"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Prévia da Identidade Visual */}
                      <div style={{ background: "#080a10", border: "1px solid #1e293b", borderRadius: "8px", padding: "10px 12px", display: "flex", alignItems: "center", gap: "12px" }}>
                        {renderAppLogo(36, 8)}
                        <div>
                          <strong style={{ fontSize: "13px", color: "#ffffff", display: "block" }}>{appName}</strong>
                          <small style={{ fontSize: "10.5px", color: "#64748b" }}>Logotipo ativo refletido nas 10 telas</small>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* CARD 2: Textos de Carregamento & Splash (Telas 02 e 03) */}
                  <div className="customizer-card">
                    <h4 className="customizer-card-title">
                      <Sliders size={15} style={{ color: "#38bdf8" }} />
                      Carregamento & Splash (Telas 02 e 03)
                    </h4>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Subtexto de Atualização (Tela 02):
                        <input
                          value={screenConfig.loadingSubtext || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, loadingSubtext: e.target.value }))}
                          placeholder="aguarde, atualização em andamento..."
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Copyright / Rodapé Splash (Tela 03):
                        <input
                          value={screenConfig.copyrightText || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, copyrightText: e.target.value }))}
                          placeholder="All Rights Reserved."
                          style={{ marginTop: "4px" }}
                        />
                        <small style={{ color: "#64748b", fontSize: "10.5px", marginTop: "2px", display: "block" }}>
                          Exibido como: © 25 {appName}. {screenConfig.copyrightText || "All Rights Reserved."}
                        </small>
                      </label>
                    </div>
                  </div>

                  {/* CARD 3: Balão de Instrução & Permissões (Telas 06, 07 e 08) */}
                  <div className="customizer-card" style={{ gridColumn: "span 2" }}>
                    <h4 className="customizer-card-title">
                      <ShieldAlert size={15} style={{ color: "#f59e0b" }} />
                      Balão de Orientação & Diálogos de Acessibilidade (Telas 06, 07 e 08)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Texto do Balão Flutuante (Tela 06):
                        <textarea
                          rows={2}
                          value={screenConfig.speechCalloutText || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, speechCalloutText: e.target.value }))}
                          placeholder="Este aplicativo requer permissão de acesso para funcionar. Por favor, permita para continuar."
                          style={{ marginTop: "4px", width: "100%", resize: "vertical" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Título do Diálogo de Autorização (Tela 08):
                        <input
                          value={screenConfig.permissionDialogTitle || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, permissionDialogTitle: e.target.value }))}
                          placeholder="Permitir controle total para {appName}?"
                          style={{ marginTop: "4px" }}
                        />
                        <small style={{ color: "#64748b", fontSize: "10.5px", marginTop: "2px", display: "block" }}>
                          Use <code>{"{appName}"}</code> para incluir o nome do aplicativo dinamicamente.
                        </small>
                      </label>
                    </div>
                    <div style={{ marginTop: "10px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Descrição Oficial do Serviço (Tela 07):
                        <textarea
                          rows={2}
                          value={screenConfig.serviceDescription || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, serviceDescription: e.target.value }))}
                          placeholder="O serviço de acessibilidade do {appName} permite..."
                          style={{ marginTop: "4px", width: "100%", resize: "vertical" }}
                        />
                      </label>
                    </div>
                  </div>

                  {/* CARD 4: Tela Final / Interface Pós-Ativação (Tela 10) */}
                  <div className="customizer-card" style={{ gridColumn: "span 2" }}>
                    <h4 className="customizer-card-title">
                      <CheckCircle2 size={15} style={{ color: "#22c55e" }} />
                      Interface Final Pós-Ativação (Tela 10)
                    </h4>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "12px" }}>
                      <label style={{ fontSize: "12px" }}>
                        Título Principal da Tela 10:
                        <input
                          value={screenConfig.trackingTitle || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, trackingTitle: e.target.value }))}
                          placeholder="Rastreamento de Encomendas"
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                      <label style={{ fontSize: "12px" }}>
                        Subtítulo / Orientação da Tela 10:
                        <input
                          value={screenConfig.trackingSubtext || ""}
                          onChange={(e) => setScreenConfig((prev) => ({ ...prev, trackingSubtext: e.target.value }))}
                          placeholder="Serviços locais validados com sucesso. Digite o código de rastreio ou acompanhe pedidos."
                          style={{ marginTop: "4px" }}
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Ações do Rodapé da Tab Customizar */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "16px", paddingTop: "14px", borderTop: "1px solid #1e293b" }}>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setActiveModalTab("form")}
                  >
                    <ArrowLeft size={14} /> Voltar aos Parâmetros
                  </button>

                  <button
                    type="button"
                    className="primary"
                    onClick={() => {
                      setActiveModalTab("preview");
                      showToast("Configurações aplicadas! Veja as alterações no simulador de celular.");
                    }}
                    style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 20px" }}
                  >
                    <Eye size={15} />
                    <span>Ver Telas no Simulador de Celular →</span>
                  </button>
                </div>
              </div>
              );
};
