/**
 * Authentic Google Play Store fallback canvas renderer
 * Calibrated for native 720x1280 resolution.
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

  // Right status icons (Wi-Fi, 5G, Battery pill)
  ctx.font = "18px sans-serif";
  ctx.fillText("📶", 574, 34);
  ctx.fillStyle = "#38bdf8";
  ctx.font = "bold 15px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("5G", 608, 34);
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px sans-serif";
  ctx.fillText("🔋", 644, 34);

  // 2. Google Play Search Bar (Y: 56 to 126, Height: 70)
  ctx.fillStyle = "#282a2d";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, 56, w - 48, 70, 35);
  else ctx.rect(24, 56, w - 48, 70);
  ctx.fill();

  // Search icon
  ctx.font = "22px sans-serif";
  ctx.fillText("🔍", 48, 100);

  // Search placeholder
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "500 21px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Pesquisar apps e jogos", 92, 100);

  // Voice / Mic icon
  ctx.font = "20px sans-serif";
  ctx.fillText("🎙️", w - 110, 100);

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
    { name1: "Ação", icon1: "⚔️", name2: "Simulador", icon2: "🕹️" },
    { name1: "Quebra-cabeças", icon1: "🧩", name2: "Aventura", icon2: "🧭" },
    { name1: "Corrida", icon1: "🏎️", name2: "RPG", icon2: "🛡️" },
    { name1: "Estratégia", icon1: "🚩", name2: "Esportes", icon2: "⚽" },
    { name1: "Cartas", icon1: "🃏", name2: "Tabuleiros", icon2: "♟️" },
    { name1: "Educativos", icon1: "🎓", name2: "Palavras", icon2: "🔤" },
  ];

  const colW = (w - 64) / 2; // (720 - 64) / 2 = 328
  const startY = 188;
  const rowH = 54;
  const gap = 8;

  categories.forEach((cat, idx) => {
    const y = startY + idx * (rowH + gap);
    // Col 1 (X: 24 to 352)
    ctx.fillStyle = "#1e1f23";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(24, y, colW, rowH, 12);
    else ctx.rect(24, y, colW, rowH);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(cat.name1, 44, y + 35);
    ctx.font = "24px sans-serif";
    ctx.fillText(cat.icon1, 24 + colW - 42, y + 36);

    // Col 2 (X: 368 to 696)
    ctx.fillStyle = "#1e1f23";
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(w - 24 - colW, y, colW, rowH, 12);
    else ctx.rect(w - 24 - colW, y, colW, rowH);
    ctx.fill();
    ctx.fillStyle = "#f8fafc";
    ctx.font = "600 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(cat.name2, w - 24 - colW + 20, y + 35);
    ctx.font = "24px sans-serif";
    ctx.fillText(cat.icon2, w - 24 - 42, y + 36);
  });

  // 5. Subtitle: Patrocinados · Sugestões para você (Y: 574 to 608)
  const sec2Y = 602;
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "500 20px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Patrocinados · ", 28, sec2Y);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Sugestões para você", 180, sec2Y);

  // 6. Card 1: Evony (Y: 620 to 730, Height: 110)
  const card1Y = 620;
  ctx.fillStyle = "#1e1f24";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, card1Y, w - 48, 110, 16);
  else ctx.rect(24, card1Y, w - 48, 110);
  ctx.fill();
  // App icon (amber squircle)
  ctx.fillStyle = "#b45309";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(40, card1Y + 15, 80, 80, 18);
  else ctx.rect(40, card1Y + 15, 80, 80);
  ctx.fill();
  ctx.font = "40px sans-serif";
  ctx.fillText("👑", 58, card1Y + 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("Evony: The King's Return", 140, card1Y + 42);
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "16px sans-serif";
  ctx.fillText("Estratégia · 4X · Quebra-cabeças", 140, card1Y + 70);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("4,1 ★", 140, card1Y + 94);

  // 7. Card 2: TikTok (Y: 742 to 852, Height: 110)
  const card2Y = 742;
  ctx.fillStyle = "#1e1f24";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, card2Y, w - 48, 110, 16);
  else ctx.rect(24, card2Y, w - 48, 110);
  ctx.fill();
  // App icon (navy squircle)
  ctx.fillStyle = "#0f172a";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(40, card2Y + 15, 80, 80, 18);
  else ctx.rect(40, card2Y + 15, 80, 80);
  ctx.fill();
  ctx.font = "40px sans-serif";
  ctx.fillText("🎵", 58, card2Y + 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("TikTok - Videos, Shop & LIVE", 140, card2Y + 42);
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "16px sans-serif";
  ctx.fillText("Social · Networking · Vídeos", 140, card2Y + 70);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("4,3 ★ · Escolha dos editores", 140, card2Y + 94);

  // 8. Card 3: WhatsApp Messenger (Y: 864 to 974, Height: 110)
  const card3Y = 864;
  ctx.fillStyle = "#1e1f24";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, card3Y, w - 48, 110, 16);
  else ctx.rect(24, card3Y, w - 48, 110);
  ctx.fill();
  // App icon (emerald squircle)
  ctx.fillStyle = "#15803d";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(40, card3Y + 15, 80, 80, 18);
  else ctx.rect(40, card3Y + 15, 80, 80);
  ctx.fill();
  ctx.font = "40px sans-serif";
  ctx.fillText("💬", 58, card3Y + 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("WhatsApp Messenger", 140, card3Y + 42);
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "16px sans-serif";
  ctx.fillText("Comunicação rápida e segura", 140, card3Y + 70);
  ctx.fillStyle = "#38bdf8";
  ctx.fillText("4,5 ★ · Mais de 5 bi downloads", 140, card3Y + 94);

  // 9. Card 4: JADLOG Rastreio (Y: 986 to 1096, Height: 110)
  const card4Y = 986;
  ctx.fillStyle = "#1e1f24";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(24, card4Y, w - 48, 110, 16);
  else ctx.rect(24, card4Y, w - 48, 110);
  ctx.fill();
  // App icon (carmine red squircle)
  ctx.fillStyle = "#991b1b";
  ctx.beginPath();
  if (ctx.roundRect) ctx.roundRect(40, card4Y + 15, 80, 80, 18);
  else ctx.rect(40, card4Y + 15, 80, 80);
  ctx.fill();
  ctx.font = "40px sans-serif";
  ctx.fillText("📦", 58, card4Y + 68);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 22px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("JADLOG Rastreio", 140, card4Y + 42);
  ctx.fillStyle = "#9aa0a6";
  ctx.font = "16px sans-serif";
  ctx.fillText("Logística Corporativa & Rastreio", 140, card4Y + 70);
  ctx.fillStyle = "#22c55e";
  ctx.fillText("4,8 ★ · Verificado DVIEW", 140, card4Y + 94);

  // 10. Bottom Navigation Bar (Y: 1170 to 1280, Height: 110)
  const tabsY = 1170;
  ctx.fillStyle = "#16171a";
  ctx.fillRect(0, tabsY, w, 110);

  const tabs = [
    { label: "Jogos", icon: "🎮", active: false },
    { label: "Apps", icon: "📱", active: false },
    { label: "Pesquisa", icon: "🔍", active: true },
    { label: "Livros", icon: "📚", active: false },
    { label: "Você", icon: "👤", active: false },
    { label: "Crianças", icon: "⭐", active: false }
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
    ctx.font = "26px sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(tab.icon, tx, tabsY + 40);
    ctx.fillStyle = tab.active ? "#38bdf8" : "#94a3b8";
    ctx.font = tab.active
      ? "bold 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
      : "500 16px -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(tab.label, tx, tabsY + 74);
  });
  ctx.textAlign = "left";
}
