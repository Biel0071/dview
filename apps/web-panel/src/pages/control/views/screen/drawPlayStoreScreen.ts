/**
 * Authentic Google Play Store fallback canvas renderer
 * Calibrated for native 720x1280 resolution (Vector-first, zero raw emojis).
 */
export function drawPlayStoreScreen(ctx: CanvasRenderingContext2D, w = 720, h = 1280): void {
  // Background (Dark Theme Material 3)
  ctx.fillStyle = "#111214";
  ctx.fillRect(0, 0, w, h);

  // 1. Native Android 14 Status Bar (Y: 0 to 48)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("04:04", 32, 34);

  // Notification dot
  ctx.fillStyle = "#9aa0a6";
  ctx.beginPath();
  ctx.arc(106, 26, 3.5, 0, Math.PI * 2);
  ctx.fill();

  // Right status icons (Signal bars, 5G, Battery vector)
  ctx.fillStyle = "#ffffff";
  for (let b = 0; b < 4; b++) {
    const bh = 6 + b * 3;
    ctx.fillRect(574 + b * 5, 34 - bh, 3, bh);
  }
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("5G", 602, 34);

  // Vector battery icon
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 2;
  ctx.strokeRect(638, 19, 24, 14);
  ctx.fillStyle = "#22c55e";
  ctx.fillRect(640, 21, 18, 10);
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(663, 23, 2, 6);

  // 2. Google Play Search Bar (Y: 56 to 126, Height: 70)
  ctx.fillStyle = "#282a2d";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, 56, w - 48, 70, 35);
  else ctx.rect(24, 56, w - 48, 70);
  ctx.fill();

  // Vector Search Magnifier icon
  ctx.strokeStyle = "#9aa0a6";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.arc(58, 88, 9, 0, Math.PI * 2);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(65, 95);
  ctx.lineTo(72, 102);
  ctx.stroke();

  // Search placeholder
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Pesquisar apps e jogos", 92, 99);

  // Vector Mic icon
  ctx.fillStyle = "#9aa0a6";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(w - 112, 79, 8, 16, 4);
  else ctx.rect(w - 112, 79, 8, 16);
  ctx.fill();

  // User avatar circle
  ctx.fillStyle = "#a855f7";
  ctx.beginPath();
  ctx.arc(w - 60, 91, 22, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 20px sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("R", w - 60, 99);
  ctx.textAlign = "left";

  // 3. Section Title: Explorar jogos (Y: 142 to 178)
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Explorar jogos", 28, 168);

  // 4. Category Grid (2 columns x 6 rows) (Y: 188 to 552)
  const categories = [
    { name1: "Ação", tag1: "ACT", name2: "Simulador", tag2: "SIM" },
    { name1: "Quebra-cabeças", tag1: "PZL", name2: "Aventura", tag2: "ADV" },
    { name1: "Corrida", tag1: "RCE", name2: "RPG", tag2: "RPG" },
    { name1: "Estratégia", tag1: "STR", name2: "Esportes", tag2: "SPT" },
    { name1: "Cartas", tag1: "CRD", name2: "Tabuleiros", tag2: "BRD" },
    { name1: "Educativos", tag1: "EDU", name2: "Palavras", tag2: "WRD" }
  ];

  const colW = (w - 64) / 2;
  const startY = 188;
  const rowH = 54;
  const gap = 8;

  categories.forEach((cat, idx) => {
    const y = startY + idx * (rowH + gap);
    // Col 1
    ctx.fillStyle = "#1e1f23";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, y, colW, rowH, 12);
    else ctx.rect(24, y, colW, rowH);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(cat.name1, 44, y + 35);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(cat.tag1, 24 + colW - 44, y + 33);

    // Col 2
    ctx.fillStyle = "#1e1f23";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(w - 24 - colW, y, colW, rowH, 12);
    else ctx.rect(w - 24 - colW, y, colW, rowH);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(cat.name2, w - 24 - colW + 20, y + 35);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "bold 12px monospace";
    ctx.fillText(cat.tag2, w - 24 - 44, y + 33);
  });

  // 5. Subtitle: Patrocinados · Sugestões para você
  const sec2Y = 602;
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Patrocinados · ", 28, sec2Y);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Sugestões para você", 180, sec2Y);

  // Helper to draw app card with clean vector monogram
  const drawAppCard = (
    cardY: number,
    bgColor: string,
    monogram: string,
    title: string,
    subtitle: string,
    ratingText: string,
    ratingColor = "#38bdf8"
  ) => {
    ctx.fillStyle = "#1e1f24";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, cardY, w - 48, 110, 16);
    else ctx.rect(24, cardY, w - 48, 110);
    ctx.fill();

    ctx.fillStyle = bgColor;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(40, cardY + 15, 80, 80, 18);
    else ctx.rect(40, cardY + 15, 80, 80);
    ctx.fill();

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(monogram, 80, cardY + 64);
    ctx.textAlign = "left";

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(title, 140, cardY + 42);
    ctx.fillStyle = "#9aa0a6";
    ctx.font = "16px sans-serif";
    ctx.fillText(subtitle, 140, cardY + 70);
    ctx.fillStyle = ratingColor;
    ctx.fillText(ratingText, 140, cardY + 94);
  };

  drawAppCard(620, "#b45309", "EV", "Evony: The King's Return", "Estratégia · 4X · Quebra-cabeças", "4,1 · Top Estratégia");
  drawAppCard(742, "#0f172a", "TK", "TikTok - Videos, Shop & LIVE", "Social · Networking · Vídeos", "4,3 · Escolha dos editores");
  drawAppCard(864, "#15803d", "WA", "WhatsApp Messenger", "Comunicação rápida e segura", "4,5 · Mais de 5 bi downloads");
  drawAppCard(986, "#991b1b", "JD", "JADLOG Rastreio", "Logística Corporativa & Rastreio", "4,8 · Verificado DVIEW", "#22c55e");

  // 10. Bottom Navigation Bar (Y: 1170 to 1280, Height: 110)
  const tabsY = 1170;
  ctx.fillStyle = "#16171a";
  ctx.fillRect(0, tabsY, w, 110);

  const tabs = [
    { label: "Jogos", badge: "JG", active: false },
    { label: "Apps", badge: "AP", active: false },
    { label: "Pesquisa", badge: "PQ", active: true },
    { label: "Livros", badge: "LV", active: false },
    { label: "Você", badge: "VC", active: false },
    { label: "Família", badge: "FM", active: false }
  ];

  const tabW = w / tabs.length;
  tabs.forEach((tab, i) => {
    const tx = i * tabW + tabW / 2;
    if (tab.active) {
      ctx.fillStyle = "rgba(56, 189, 248, 0.22)";
      ctx.beginPath();
      if (ctx.roundRect) ctx.roundRect(tx - 38, tabsY + 10, 76, 42, 21);
      else ctx.rect(tx - 38, tabsY + 10, 76, 42);
      ctx.fill();
    }
    ctx.fillStyle = tab.active ? "#38bdf8" : "#cbd5e1";
    ctx.font = "bold 17px monospace";
    ctx.textAlign = "center";
    ctx.fillText(tab.badge, tx, tabsY + 37);
    ctx.fillStyle = tab.active ? "#38bdf8" : "#94a3b8";
    ctx.font = tab.active
      ? "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(tab.label, tx, tabsY + 74);
  });
  ctx.textAlign = "left";
}
