"use strict";

/* ============================================================
   0. Storage
   ============================================================ */
const STORAGE_KEY = "vitrine_db";
let DB = null;

function uid() { return Math.random().toString(36).slice(2, 10); }

function defaultDB() {
  return {
    pages: [
      { id: uid(), name: "Home", boards: [] }
    ],
    activePageId: null,
    widgetsVisible: { clock: true, search: true, weather: true, weatherCity: "", apps: true },
    floatingWidgets: [], // {id, type, pageId, x, y, style, variant, data}
    wallpaper: { value: WALLPAPER_PRESETS_VALUE(0), type: "photo" },
    settings: {
      general: {
        showDescriptions: false,
        columns: "auto",
        boardWidth: 260,
        sidebarAlways: false,
        quickSaveKey: "",
        quickSaveShortcut: "",
        timeFormat: "12",
        tempUnit: "c",
        fontFamily: "default"
      },
      appearance: {
        board: { primaryColor: "#3f7f93", boardColor: "#ffffff", opacity: 60, blur: 30 },
        searchBar: { color: "#ffffff", opacity: 60, blur: 12, width: 480, matchBoard: false },
        boardText: { size: "M", weight: "Normal", auto: true, color: "#22262b" },
        outline: { color: "#ffffff", opacity: 75, matchBoard: false }
      },
      search: {
        customEngines: [
          { id: "engine1", name: "GitHub", url: "https://github.com/search?q=%s", iconText: "GH" },
          { id: "engine2", name: "StackOverflow", url: "https://stackoverflow.com/search?q=%s", iconText: "SO" },
          { id: "engine3", name: "MDN", url: "https://developer.mozilla.org/en-US/search?q=%s", iconText: "MDN" }
        ]
      }
    },
    tourDone: false
  };
}
function WALLPAPER_PRESETS_VALUE(i) { return WALLPAPER_PRESETS[i].value; }

/* ============================================================
   0b. Font options (system fonts only — no network fetch needed,
   so this works offline and needs no extra host permissions)
   ============================================================ */
const FONT_OPTIONS = [
  { key: "default", name: "System Default", stack: `-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Inter, Helvetica, Arial, sans-serif` },
  { key: "inter", name: "Inter / Helvetica", stack: `Inter, "Helvetica Neue", Helvetica, Arial, sans-serif` },
  { key: "segoe", name: "Segoe UI", stack: `"Segoe UI", Tahoma, Geneva, Verdana, sans-serif` },
  { key: "roboto", name: "Roboto", stack: `Roboto, "Segoe UI", Arial, sans-serif` },
  { key: "trebuchet", name: "Trebuchet MS", stack: `"Trebuchet MS", Helvetica, Arial, sans-serif` },
  { key: "verdana", name: "Verdana", stack: `Verdana, Geneva, sans-serif` },
  { key: "tahoma", name: "Tahoma", stack: `Tahoma, Geneva, sans-serif` },
  { key: "georgia", name: "Georgia (Serif)", stack: `Georgia, "Times New Roman", serif` },
  { key: "times", name: "Times New Roman (Serif)", stack: `"Times New Roman", Times, serif` },
  { key: "palatino", name: "Palatino (Serif)", stack: `Palatino, "Palatino Linotype", "Book Antiqua", serif` },
  { key: "garamond", name: "Garamond (Serif)", stack: `Garamond, Baskerville, "Baskerville Old Face", serif` },
  { key: "courier", name: "Courier New (Mono)", stack: `"Courier New", Courier, monospace` },
  { key: "consolas", name: "Consolas (Mono)", stack: `Consolas, Monaco, "Courier New", monospace` },
  { key: "comic", name: "Comic Sans MS", stack: `"Comic Sans MS", "Comic Sans", cursive, sans-serif` }
];
function fontStackFor(key) {
  const f = FONT_OPTIONS.find((f) => f.key === key);
  return f ? f.stack : FONT_OPTIONS[0].stack;
}
function applyFont() {
  const key = DB.settings.general.fontFamily || "default";
  document.documentElement.style.setProperty("--app-font", fontStackFor(key));
}

async function loadDB() {
  const res = await chrome.storage.local.get([STORAGE_KEY, "markmez_db"]);
  
  if (!res[STORAGE_KEY] && res["markmez_db"]) {
    DB = res["markmez_db"];
    chrome.storage.local.set({ [STORAGE_KEY]: DB });
  } else {
    DB = res[STORAGE_KEY] || defaultDB();
  }

  if (!DB.activePageId && DB.pages[0]) DB.activePageId = DB.pages[0].id;
  if (DB.widgetsVisible.apps === undefined) DB.widgetsVisible.apps = true; 
  if (!DB.settings.general.fontFamily) DB.settings.general.fontFamily = "default";
  
  // Backwards compatibility for search config
  if (!DB.settings.search) {
    DB.settings.search = {
      customEngines: [
        { id: "engine1", name: "GitHub", url: "https://github.com/search?q=%s", iconText: "GH" },
        { id: "engine2", name: "StackOverflow", url: "https://stackoverflow.com/search?q=%s", iconText: "SO" },
        { id: "engine3", name: "MDN", url: "https://developer.mozilla.org/en-US/search?q=%s", iconText: "MDN" }
      ]
    };
  }

  return DB;
}

let saveTimer = null;
function saveDB() {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => chrome.storage.local.set({ [STORAGE_KEY]: DB }), 120);
}
function activePage() { return DB.pages.find((p) => p.id === DB.activePageId) || DB.pages[0]; }
function findBoard(boardId) {
  for (const p of DB.pages) {
    const b = p.boards.find((b) => b.id === boardId);
    if (b) return { page: p, board: b };
  }
  return null;
}

/* ============================================================
   1. Wallpaper presets
   ============================================================ */
const WALLPAPER_PRESETS = [
  { name: "Dragon Temple", type: "photo", value: "wallpapers/dragon-temple.jpg" },
  { name: "Sakura Village", type: "photo", value: "wallpapers/sakura-village.jpg" },
  { name: "Sunset Tree", type: "photo", value: "wallpapers/sunset-tree.jpg" },
  { name: "Autumn River", type: "photo", value: "wallpapers/autumn-river.jpg" },
  { name: "Red Leaves", type: "photo", value: "wallpapers/red-leaves-temple.jpg" },
  { name: "Samurai", type: "photo", value: "wallpapers/samurai-red.jpg" },
  { name: "Forest Gate", type: "photo", value: "wallpapers/red-forest-gate.jpg" },
  { name: "Maple Shrine", type: "photo", value: "wallpapers/maple-shrine.jpg" },
  { name: "Mossy Stairs", type: "photo", value: "wallpapers/mossy-stairs.jpg" },
  { name: "Totoro", type: "photo", value: "wallpapers/totoro.jpg" },
  { name: "Starry City", type: "photo", value: "wallpapers/starry-city.jpg" },
  { name: "Great Wave", type: "photo", value: "wallpapers/great-wave.jpg" },
  { name: "Pirate Ships", type: "photo", value: "wallpapers/pirate-ships.jpg" },
  { name: "Skull Island", type: "photo", value: "wallpapers/skull-island.jpg" },
  { name: "Starry Boat", type: "photo", value: "wallpapers/starry-boat.jpg" },
  { name: "Aurora", type: "gradient", value: "linear-gradient(135deg, #0f2027, #203a43, #2c5364)" },
  { name: "Midnight", type: "gradient", value: "linear-gradient(160deg, #131722, #1b2030 45%, #232945)" },
  { name: "Dusk Clay", type: "gradient", value: "linear-gradient(150deg, #22252b, #4a3b3a 55%, #7a5147)" }
];

/* ============================================================
   2. Color helpers
   ============================================================ */
function hexToRgb(hex) {
  const v = hex.replace("#", "");
  const n = parseInt(v.length === 3 ? v.split("").map((c) => c + c).join("") : v, 16);
  return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}
function rgbToHex(r, g, b) {
  return "#" + [r, g, b].map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
}
function rgbTriple(hex) { const { r, g, b } = hexToRgb(hex); return `${r}, ${g}, ${b}`; }
function rgbToHsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b), d = max - min;
  let h = 0;
  if (d !== 0) {
    if (max === r) h = ((g - b) / d) % 6;
    else if (max === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  const s = max === 0 ? 0 : d / max;
  const v = max;
  return { h, s, v };
}
function hsvToRgb(h, s, v) {
  const c = v * s, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = v - c;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return { r: (r + m) * 255, g: (g + m) * 255, b: (b + m) * 255 };
}
function luminance(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
}
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str == null ? "" : str;
  return div.innerHTML;
}
function faviconFor(url) {
  let domain = "example.com";
  try { domain = new URL(url).hostname; } catch {}
  return `https://www.google.com/s2/favicons?domain=${domain}&sz=64`;
}
function hostnameOf(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; }
}

/* ============================================================
   3. Appearance application
   ============================================================ */
function applyAppearance(overrideState = null) {
  const a = overrideState || DB.settings.appearance;
  const root = document.documentElement.style;

  root.setProperty("--accent", a.board.primaryColor);
  const { r, g, b } = hexToRgb(a.board.primaryColor);
  root.setProperty("--accent-soft", `rgba(${r}, ${g}, ${b}, 0.20)`);

  root.setProperty("--board-color", rgbTriple(a.board.boardColor));
  root.setProperty("--board-opacity", (a.board.opacity / 100).toString());
  root.setProperty("--board-blur", a.board.blur + "px");

  const sColor = a.searchBar.matchBoard ? a.board.boardColor : a.searchBar.color;
  const sOpacity = a.searchBar.matchBoard ? a.board.opacity : a.searchBar.opacity;
  const sBlur = a.searchBar.matchBoard ? a.board.blur : a.searchBar.blur;
  root.setProperty("--search-color", rgbTriple(sColor));
  root.setProperty("--search-opacity", (sOpacity / 100).toString());
  root.setProperty("--search-blur", sBlur + "px");
  root.setProperty("--search-width", a.searchBar.width + "px");

  const sizeMap = { S: "13px", M: "15px", L: "17.5px" };
  root.setProperty("--text-size", sizeMap[a.boardText.size] || "15px");
  root.setProperty("--text-weight", a.boardText.weight === "Bold" ? "800" : "600");

  const textAuto = a.boardText.auto !== false;
  const inkColor = textAuto
    ? (luminance(a.board.boardColor) > 0.55 ? "#22262b" : "#f2f4f6")
    : (a.boardText.color || "#22262b");
  root.setProperty("--ink", inkColor);
  const { r: ir, g: ig, b: ib } = hexToRgb(inkColor);
  root.setProperty("--ink-soft", `rgba(${ir}, ${ig}, ${ib}, 0.68)`);

  const oColor = a.outline.matchBoard ? a.board.boardColor : a.outline.color;
  const oOpacity = a.outline.matchBoard ? a.board.opacity : a.outline.opacity;
  root.setProperty("--outline-color", rgbTriple(oColor));
  root.setProperty("--outline-opacity", (oOpacity / 100).toString());

  root.setProperty("--board-width", DB.settings.general.boardWidth + "px");
}

/* ============================================================
   4. Wallpaper
   ============================================================ */
function applyWallpaper() {
  const bg = document.getElementById("bgLayer");
  const w = DB.wallpaper;
  bg.style.backgroundImage = w.type === "gradient" ? w.value : `url('${w.value}')`;
}
function renderPresetGrid() {
  const grid = document.getElementById("presetGrid");
  grid.innerHTML = "";
  WALLPAPER_PRESETS.forEach((preset) => {
    const tile = document.createElement("button");
    tile.className = "preset-tile" + (preset.value === DB.wallpaper.value ? " is-active" : "");
    tile.style.background = preset.type === "gradient" ? preset.value : `url('${preset.value}') center/cover no-repeat`;
    tile.innerHTML = `<span>${escapeHtml(preset.name)}</span>`;
    tile.onclick = () => setWallpaper(preset.value, preset.type);
    grid.appendChild(tile);
  });
}
function setWallpaper(value, type) {
  DB.wallpaper = { value, type };
  saveDB();
  applyWallpaper();
  renderPresetGrid();
  closeWallpaperDrawer();
  openWallpaperStyleModal(value, type);
}

let wsState = null;
function openWallpaperStyleModal(value, type) {
  wsState = JSON.parse(JSON.stringify(DB.settings.appearance));
  const modal = document.getElementById("wallpaperStyleModal");
  modal.classList.add("is-open");

  const finishFill = (primaryHex, isLight) => {
    document.getElementById("wsThemeNote").textContent = isLight ? "Light theme detected." : "Dark theme detected.";
    wsState.board.primaryColor = primaryHex;
    wsState.board.boardColor = isLight ? "#ffffff" : "#20242c";
    refreshWallpaperStyleUI();
  };

  if (type === "gradient") {
    const hexes = (value.match(/#([0-9a-fA-F]{6}|[0-9a-fA-F]{3})/g) || ["#3f7f93"]);
    let r = 0, g = 0, b = 0;
    hexes.forEach((h) => { const c = hexToRgb(h); r += c.r; g += c.g; b += c.b; });
    r /= hexes.length; g /= hexes.length; b /= hexes.length;
    const avgHex = rgbToHex(r, g, b);
    finishFill(avgHex, luminance(avgHex) > 0.55);
    return;
  }

  const img = new Image();
  img.crossOrigin = "anonymous";
  img.onload = () => {
    try {
      const c = document.createElement("canvas");
      c.width = 40; c.height = 24;
      const ctx = c.getContext("2d");
      ctx.drawImage(img, 0, 0, 40, 24);
      const data = ctx.getImageData(0, 0, 40, 24).data;
      let r = 0, g = 0, b = 0, n = 0;
      for (let i = 0; i < data.length; i += 4) { r += data[i]; g += data[i + 1]; b += data[i + 2]; n++; }
      r /= n; g /= n; b /= n;
      const avgHex = rgbToHex(r, g, b);
      finishFill(avgHex, luminance(avgHex) > 0.55);
    } catch {
      finishFill("#3f7f93", true);
    }
  };
  img.onerror = () => finishFill("#3f7f93", true);
  img.src = value;
}

function refreshWallpaperStyleUI() {
  if (!wsState) return;
  document.getElementById("wsPrimaryHex").textContent = wsState.board.primaryColor.toUpperCase();
  document.getElementById("wsPrimarySwatch").style.background = wsState.board.primaryColor;
  document.getElementById("wsBoardHex").textContent = wsState.board.boardColor.toUpperCase();
  document.getElementById("wsBoardSwatch").style.background = wsState.board.boardColor;
  document.getElementById("wsOpacity").value = wsState.board.opacity;
  document.getElementById("wsOpacityVal").textContent = wsState.board.opacity + "%";
  document.getElementById("wsBlur").value = wsState.board.blur;
  document.getElementById("wsBlurVal").textContent = wsState.board.blur + "px";
  document.querySelectorAll("#wsTextSize button").forEach((b) => b.classList.toggle("is-active", b.dataset.val === wsState.boardText.size));
  document.querySelectorAll("#wsTextWeight button").forEach((b) => b.classList.toggle("is-active", b.dataset.val === wsState.boardText.weight));
  
  applyAppearance(wsState);
}

function closeWallpaperStyleModal() { 
  document.getElementById("wallpaperStyleModal").classList.remove("is-open"); 
  wsState = null; 
  applyAppearance(); 
}

function initWallpaperStyleWiring() {
  document.getElementById("wsPrimarySwatch").onclick = function() {
    if(!wsState) return;
    openColorPicker(this, wsState.board.primaryColor, (hex) => { wsState.board.primaryColor = hex; this.style.background = hex; applyAppearance(wsState); });
  };
  document.getElementById("wsBoardSwatch").onclick = function() {
    if(!wsState) return;
    openColorPicker(this, wsState.board.boardColor, (hex) => { wsState.board.boardColor = hex; this.style.background = hex; applyAppearance(wsState); });
  };
  document.getElementById("wsOpacity").oninput = function() {
    if(!wsState) return;
    wsState.board.opacity = Number(this.value); document.getElementById("wsOpacityVal").textContent = this.value + "%"; applyAppearance(wsState);
  };
  document.getElementById("wsBlur").oninput = function() {
    if(!wsState) return;
    wsState.board.blur = Number(this.value); document.getElementById("wsBlurVal").textContent = this.value + "px"; applyAppearance(wsState);
  };
  document.querySelectorAll("#wsTextSize button").forEach(b => b.onclick = () => {
    if(!wsState) return;
    wsState.boardText.size = b.dataset.val; refreshWallpaperStyleUI();
  });
  document.querySelectorAll("#wsTextWeight button").forEach(b => b.onclick = () => {
    if(!wsState) return;
    wsState.boardText.weight = b.dataset.val; refreshWallpaperStyleUI();
  });

  document.getElementById("wsCancelBtn").onclick = closeWallpaperStyleModal;
  document.getElementById("wsResetBtn").onclick = () => {
    wsState = JSON.parse(JSON.stringify(defaultDB().settings.appearance));
    refreshWallpaperStyleUI();
  };
  document.getElementById("wsSaveBtn").onclick = () => {
    if(!wsState) return;
    DB.settings.appearance = JSON.parse(JSON.stringify(wsState));
    saveDB();
    closeWallpaperStyleModal();
  };
}


/* ============================================================
   5. Page tabs
   ============================================================ */
function renderPageTabs() {
  const wrap = document.getElementById("pageTabs");
  wrap.innerHTML = "";
  DB.pages.forEach((page) => {
    const btn = document.createElement("button");
    btn.className = "pill" + (page.id === DB.activePageId ? " is-active" : "");
    btn.textContent = page.name;
    btn.dataset.pageId = page.id;
    btn.onclick = () => {
      if (page.id === DB.activePageId) {
        openPageMenu(btn, page.id);
      } else {
        switchPage(page.id);
      }
    };
    wrap.appendChild(btn);
  });
  const addBtn = document.createElement("button");
  addBtn.className = "pill-add"; addBtn.innerHTML = "+"; addBtn.title = "Add page";
  addBtn.onclick = () => addPage();
  wrap.appendChild(addBtn);
  advanceTourIfWaitingFor("addPage");
}
function switchPage(id) { DB.activePageId = id; saveDB(); renderPageTabs(); renderBoards(); renderFloatingWidgets(); }
function addPage() {
  const p = { id: uid(), name: "New Page", boards: [] };
  DB.pages.push(p);
  DB.activePageId = p.id;
  saveDB();
  renderPageTabs();
  renderBoards();
  renderFloatingWidgets();
  advanceTourIfWaitingFor("addPageDone");
}
let pageMenuTargetId = null;
function openPageMenu(anchorEl, pageId) {
  pageMenuTargetId = pageId;
  const menu = document.getElementById("pageMenu");
  const rect = anchorEl.getBoundingClientRect();
  menu.style.left = rect.left + "px";
  menu.style.top = rect.bottom + 6 + "px";
  menu.classList.add("is-open");
  document.getElementById("pageMenuScrim").classList.add("is-open");
}
function closePageMenu() { document.getElementById("pageMenu").classList.remove("is-open"); document.getElementById("pageMenuScrim").classList.remove("is-open"); pageMenuTargetId = null; }

/* ============================================================
   6. Boards
   ============================================================ */
function getEffectiveCols() {
  if (window.innerWidth <= 720) return 2;
  const g = DB.settings.general;
  if (g.columns && g.columns !== "auto") return Math.max(1, Number(g.columns));
  const canvas = document.getElementById("boardCanvas");
  const gap = 14;
  const available = (canvas ? canvas.clientWidth : 1200) - 56;
  return Math.max(1, Math.floor((available + gap) / (g.boardWidth + gap)));
}

function migrateBoardPositions(page, cols) {
  const missing = page.boards.filter((b) => b.row == null || b.col == null);
  if (missing.length === 0) return;
  const occupied = new Set(
    page.boards.filter((b) => b.row != null && b.col != null).map((b) => `${b.row},${b.col}`)
  );
  let r = 0, c = 0;
  const nextFree = () => {
    while (occupied.has(`${r},${c}`)) { c++; if (c >= cols) { c = 0; r++; } }
    occupied.add(`${r},${c}`);
    const pos = { row: r, col: c };
    c++; if (c >= cols) { c = 0; r++; }
    return pos;
  };
  missing.forEach((b) => { const pos = nextFree(); b.row = pos.row; b.col = pos.col; });
}

function renderBoards() {
  const grid = document.getElementById("boardGrid");
  grid.innerHTML = "";
  const page = activePage();
  if (!page) return;

  const cols = getEffectiveCols();
  migrateBoardPositions(page, cols);
  page.boards.forEach((b) => { if (b.col > cols - 1) b.col = cols - 1; });

  grid.style.setProperty("--board-cols", cols);
  grid.classList.add("cols-fixed");

  const occupied = new Map();
  page.boards.forEach((b) => occupied.set(`${b.row},${b.col}`, b));
  let maxRow = -1;
  page.boards.forEach((b) => { if (b.row > maxRow) maxRow = b.row; });

  let addRow = 0, addCol = 0;
  findSlot:
  for (let r = 0; r <= maxRow + 1; r++) {
    for (let c = 0; c < cols; c++) {
      if (!occupied.has(`${r},${c}`)) { addRow = r; addCol = c; break findSlot; }
    }
  }
  const lastRow = Math.max(maxRow + 1, addRow);

  for (let r = 0; r <= lastRow; r++) {
    for (let c = 0; c < cols; c++) {
      const board = occupied.get(`${r},${c}`);
      let el;
      if (board) {
        el = renderBoardEl(board);
      } else if (r === addRow && c === addCol) {
        el = renderAddSlot(r, c);
      } else {
        el = renderEmptyCell(r, c);
      }
      el.style.gridRow = String(r + 1);
      el.style.gridColumn = String(c + 1);
      grid.appendChild(el);
    }
  }
  advanceTourIfWaitingFor("firstBoardVisible");
}

function moveBoardToCell(boardId, row, col) {
  const page = activePage();
  const dragged = page.boards.find((b) => b.id === boardId);
  if (!dragged) return;
  if (dragged.row === row && dragged.col === col) return;
  const occupant = page.boards.find((b) => b.id !== boardId && b.row === row && b.col === col);
  if (occupant) { occupant.row = dragged.row; occupant.col = dragged.col; }
  dragged.row = row; dragged.col = col;
  saveDB();
  renderBoards();
  advanceTourIfWaitingFor("dragDone");
}

function renderEmptyCell(row, col) {
  const el = document.createElement("div");
  el.className = "board-empty-cell";
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("text/board-id")) { el.classList.add("is-dragover"); }
  });
  el.addEventListener("dragleave", () => el.classList.remove("is-dragover"));
  el.addEventListener("drop", (e) => {
    el.classList.remove("is-dragover");
    const draggedId = e.dataTransfer.getData("text/board-id");
    if (!draggedId) return;
    e.preventDefault();
    moveBoardToCell(draggedId, row, col);
  });
  return el;
}

function renderAddSlot(row, col) {
  const el = document.createElement("div");
  el.className = "board-add-slot glass" + (activePage().boards.length === 0 && !DB.tourDone ? " pulse" : "");
  el.innerHTML = `<span>+</span>`;
  el.onclick = () => startAddBoard(el, row, col);
  
  el.addEventListener("dragover", (e) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("text/board-id")) { el.classList.add("is-dragover"); }
  });
  el.addEventListener("dragleave", () => el.classList.remove("is-dragover"));
  el.addEventListener("drop", (e) => {
    el.classList.remove("is-dragover");
    const draggedId = e.dataTransfer.getData("text/board-id");
    if (!draggedId) return;
    e.preventDefault();
    moveBoardToCell(draggedId, row, col);
  });
  return el;
}

function startAddBoard(slotEl, row, col) {
  slotEl.classList.add("editing");
  slotEl.classList.remove("pulse");
  slotEl.innerHTML = `<input type="text" placeholder="New Board" />`;
  const input = slotEl.querySelector("input");
  input.focus();
  const commit = () => {
    const name = input.value.trim() || "New Board";
    const board = { id: uid(), name, links: [], accentColor: null, row, col };
    activePage().boards.push(board);
    saveDB();
    renderBoards();
    advanceTourIfWaitingFor("boardCreated");
  };
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); commit(); }
    if (e.key === "Escape") { renderBoards(); }
  });
  input.addEventListener("blur", () => { if (document.body.contains(input)) commit(); });
}

function makeBoardResizable(el, board) {
  const grip = document.createElement("div");
  grip.className = "board-resize";
  el.appendChild(grip);

  if (board.height) {
    el.style.height = board.height + "px";
  }

  grip.addEventListener("mousedown", (e) => {
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startHeight = el.offsetHeight;
    document.body.classList.add("is-resizing-board");
    grip.classList.add("is-active");

    let finalHeight = startHeight;
    function onMove(ev) {
      finalHeight = Math.max(56, startHeight + (ev.clientY - startY));
      el.style.height = finalHeight + "px";
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      document.body.classList.remove("is-resizing-board");
      grip.classList.remove("is-active");
      board.height = finalHeight;
      saveDB();
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

function renderBoardEl(board) {
  const el = document.createElement("div");
  el.className = "board glass" + (board.accentColor ? " accented" : "");
  if (board.accentColor) el.style.setProperty("--board-accent", board.accentColor);
  el.draggable = true;
  el.dataset.boardId = board.id;

  el.addEventListener("dragstart", (e) => {
    el.classList.add("is-dragging");
    e.dataTransfer.setData("text/board-id", board.id);
  });
  el.addEventListener("dragend", () => el.classList.remove("is-dragging"));
  el.addEventListener("dragover", (e) => { 
    if (e.dataTransfer.types.includes("text/board-id")) { 
      e.preventDefault(); 
      el.classList.add("is-dragover"); 
    } 
  });
  el.addEventListener("dragleave", () => el.classList.remove("is-dragover"));
  el.addEventListener("drop", (e) => {
    el.classList.remove("is-dragover");
    const draggedId = e.dataTransfer.getData("text/board-id");
    if (!draggedId || draggedId === board.id) return;
    e.preventDefault();
    reorderBoard(draggedId, board.id);
  });

  const head = document.createElement("div");
  head.className = "board-head";
  head.innerHTML = `
    <span class="board-title">${escapeHtml(board.name)}</span>
    <button class="icon-btn" data-role="add-link" title="Add link">+</button>
    <button class="icon-btn" data-role="menu" title="More">⋯</button>
  `;
  head.querySelector('[data-role="add-link"]').onclick = (e) => { e.stopPropagation(); openAddLinkPopover(board.id, head.querySelector('[data-role="add-link"]')); advanceTourIfWaitingFor("addLinkOpened"); };
  head.querySelector('[data-role="menu"]').onclick = (e) => { e.stopPropagation(); openBoardMenu(board.id, head.querySelector('[data-role="menu"]')); };
  el.appendChild(head);

  const linksWrap = document.createElement("div");
  linksWrap.className = "board-links";
  linksWrap.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("text/link")) e.preventDefault(); });
  linksWrap.addEventListener("drop", (e) => {
    const raw = e.dataTransfer.getData("text/link");
    if (!raw) return;
    e.preventDefault();
    const { fromBoardId, linkId } = JSON.parse(raw);
    moveLink(fromBoardId, board.id, linkId, null);
  });

  if (board.links.length === 0) {
    const empty = document.createElement("div");
    empty.className = "bm-empty";
    empty.textContent = "No links yet — tap + to add one.";
    linksWrap.appendChild(empty);
  } else {
    board.links.forEach((link) => linksWrap.appendChild(renderLinkRow(board, link)));
  }
  el.appendChild(linksWrap);

  makeBoardResizable(el, board);
  return el;
}

function renderLinkRow(board, link) {
  const row = document.createElement("div");
  row.className = "bm-row";
  row.draggable = true;
  row.dataset.linkId = link.id;

  row.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/link", JSON.stringify({ fromBoardId: board.id, linkId: link.id }));
    e.stopPropagation();
  });
  row.addEventListener("dragover", (e) => { if (e.dataTransfer.types.includes("text/link")) { e.preventDefault(); e.stopPropagation(); } });
  row.addEventListener("drop", (e) => {
    const raw = e.dataTransfer.getData("text/link");
    if (!raw) return;
    e.preventDefault(); e.stopPropagation();
    const { fromBoardId, linkId } = JSON.parse(raw);
    moveLink(fromBoardId, board.id, linkId, link.id);
  });

  const desc = DB.settings.general.showDescriptions ? `<span class="bm-desc">${escapeHtml(hostnameOf(link.url))}</span>` : "";
  row.innerHTML = `
    <a href="${escapeHtml(link.url)}" class="bm-link">
      <img src="${faviconFor(link.url)}" class="bm-favicon" onerror="this.style.visibility='hidden'" alt="" />
      <span style="min-width:0;"><span class="bm-title">${escapeHtml(link.title)}</span>${desc}</span>
    </a>
    <button class="bm-del" title="Remove">✕</button>
  `;
  row.querySelector(".bm-del").onclick = (e) => {
    e.preventDefault(); e.stopPropagation();
    board.links = board.links.filter((l) => l.id !== link.id);
    saveDB(); renderBoards();
  };
  return row;
}

function reorderBoard(draggedId, targetId) {
  const page = activePage();
  const target = page.boards.find((b) => b.id === targetId);
  if (!target) return;
  moveBoardToCell(draggedId, target.row, target.col);
}

function moveLink(fromBoardId, toBoardId, linkId, beforeLinkId) {
  const fromRef = findBoard(fromBoardId);
  const toRef = findBoard(toBoardId);
  if (!fromRef || !toRef) return;
  const idx = fromRef.board.links.findIndex((l) => l.id === linkId);
  if (idx === -1) return;
  const [link] = fromRef.board.links.splice(idx, 1);
  if (beforeLinkId) {
    const insertAt = toRef.board.links.findIndex((l) => l.id === beforeLinkId);
    toRef.board.links.splice(insertAt === -1 ? toRef.board.links.length : insertAt, 0, link);
  } else {
    toRef.board.links.push(link);
  }
  saveDB(); renderBoards();
  advanceTourIfWaitingFor("dragDone");
}

let boardMenuTargetId = null;
function openBoardMenu(boardId, anchorEl) {
  boardMenuTargetId = boardId;
  const menu = document.getElementById("boardMenu");
  const rect = anchorEl.getBoundingClientRect();
  menu.style.left = Math.min(rect.left, window.innerWidth - 210) + "px";
  menu.style.top = rect.bottom + 6 + "px";
  menu.classList.add("is-open");
  document.getElementById("boardMenuScrim").classList.add("is-open");
}
function closeBoardMenu() {
  document.getElementById("boardMenu").classList.remove("is-open");
  document.getElementById("boardMenuScrim").classList.remove("is-open");
  document.getElementById("boardCustomizePop").classList.remove("is-open");
}

const BOARD_ACCENTS = ["#4C8DFF", "#2FC9B9", "#9B7BFF", "#FF7A66", "#FFB454", "#3f7f93", "#c0392b", "#7f8c8d"];
function openBoardCustomize(anchorEl) {
  const pop = document.getElementById("boardCustomizePop");
  const row = document.getElementById("boardAccentRow");
  const ref = findBoard(boardMenuTargetId);
  row.innerHTML = "";
  BOARD_ACCENTS.forEach((hex) => {
    const sw = document.createElement("button");
    sw.className = "swatch" + (ref.board.accentColor === hex ? " is-active" : "");
    sw.style.background = hex;
    sw.onclick = () => { ref.board.accentColor = hex; saveDB(); renderBoards(); closeBoardMenu(); };
    row.appendChild(sw);
  });
  const rect = anchorEl.getBoundingClientRect();
  pop.style.left = Math.min(rect.right + 6, window.innerWidth - 220) + "px";
  pop.style.top = rect.top + "px";
  pop.classList.add("is-open");
}

/* ============================================================
   7. Add-link popover & Import bookmarks
   ============================================================ */
let addLinkTargetBoardId = null;
function openAddLinkPopover(boardId, anchorEl) {
  addLinkTargetBoardId = boardId;
  document.getElementById("addLinkBoardId").value = boardId;
  const urlInput = document.getElementById("addLinkUrlInput");
  urlInput.value = "";
  const pop = document.getElementById("addLinkPop");
  const rect = anchorEl.getBoundingClientRect();
  let left = Math.min(rect.left, window.innerWidth - 280);
  let top = rect.bottom + 8;
  if (top + 130 > window.innerHeight) top = rect.top - 130;
  pop.style.left = left + "px";
  pop.style.top = top + "px";
  pop.classList.add("is-open");
  document.getElementById("addLinkScrim").classList.add("is-open");
  urlInput.focus();
}
function closeAddLinkPopover() {
  document.getElementById("addLinkPop").classList.remove("is-open");
  document.getElementById("addLinkScrim").classList.remove("is-open");
  addLinkTargetBoardId = null;
}
function saveAddLink() {
  const boardId = document.getElementById("addLinkBoardId").value || addLinkTargetBoardId;
  let url = document.getElementById("addLinkUrlInput").value.trim();
  if (!url) return;
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  const ref = findBoard(boardId);
  if (!ref) { closeAddLinkPopover(); return; }
  ref.board.links.push({ id: uid(), title: hostnameOf(url), url });
  saveDB();
  renderBoards();
  closeAddLinkPopover();
  advanceTourIfWaitingFor("linkAdded");
}

function importBookmarks() {
  if (!chrome.bookmarks) { alert("Bookmarks permission isn't available."); return; }
  chrome.bookmarks.getTree((tree) => {
    const page = activePage();
    let imported = 0;
    function walk(node) {
      if (!node.children) return;
      const linkChildren = node.children.filter((c) => c.url);
      if (linkChildren.length > 0 && node.title) {
        page.boards.push({
          id: uid(),
          name: node.title,
          links: linkChildren.map((c) => ({ id: uid(), title: c.title || hostnameOf(c.url), url: c.url })),
          accentColor: null
        });
        imported++;
      }
      node.children.forEach(walk);
    }
    tree.forEach(walk);
    saveDB();
    renderBoards();
    if (imported === 0) alert("No bookmark folders with links were found to import.");
  });
}

/* ============================================================
   8. Clock & Weather
   ============================================================ */
function updateClock() {
  const now = new Date();
  const fmt = DB.settings.general.timeFormat === "24" ? { hour: "2-digit", minute: "2-digit", hour12: false } : { hour: "2-digit", minute: "2-digit" };
  const tStr = now.toLocaleTimeString([], fmt);
  const dStr = now.toLocaleDateString([], { weekday: "long", month: "short", day: "numeric" });
  
  document.getElementById("clockTime").textContent = tStr;
  document.getElementById("clockDate").textContent = dStr;
  
  // Update Focus mode overlay clock too
  const focusClock = document.getElementById("focusClock");
  if(focusClock) {
     focusClock.textContent = tStr;
     document.getElementById("focusDate").textContent = dStr;
  }
}
setInterval(updateClock, 1000 * 15);

async function fetchWeather() {
  const unit = DB.settings.general.tempUnit === "f" ? "fahrenheit" : "celsius";
  const setTemp = (t) => { document.getElementById("weatherTemp").textContent = t == null ? "-" : `${Math.round(t)}°`; };
  const city = DB.widgetsVisible.weatherCity;
  try {
    let lat, lon;
    if (city) {
      const geo = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1`).then((r) => r.json());
      if (geo.results && geo.results[0]) { lat = geo.results[0].latitude; lon = geo.results[0].longitude; }
    }
    if (lat == null) {
      const pos = await new Promise((resolve) => {
        if (!navigator.geolocation) return resolve(null);
        navigator.geolocation.getCurrentPosition((p) => resolve(p), () => resolve(null), { timeout: 4000 });
      });
      lat = pos ? pos.coords.latitude : 19.6967;
      lon = pos ? pos.coords.longitude : 72.7699;
    }
    const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m&temperature_unit=${unit}`);
    const data = await res.json();
    setTemp(data.current ? data.current.temperature_2m : null);
  } catch { setTemp(null); }
}

/* ============================================================
   9. Focus Mode Toggle
   ============================================================ */
function toggleFocusMode() {
  const isFocus = document.body.classList.toggle("is-focus-mode");
  if(isFocus) { updateClock(); }
}
document.getElementById("exitFocusBtn").onclick = () => { document.body.classList.remove("is-focus-mode"); };

/* ============================================================
   10. Widgets panel & Floating Widgets (Versions Support)
   ============================================================ */
function applyWidgetsVisibility() {
  const v = DB.widgetsVisible;
  document.getElementById("clockWidget").style.display = v.clock ? "" : "none";
  document.getElementById("weatherWidget").style.display = v.weather ? "" : "none";
  document.getElementById("searchForm").style.display = v.search ? "" : "none";
  document.getElementById("waffleBtn").style.display = v.apps !== false ? "" : "none";
  
  document.querySelectorAll("#widgetsPanel .switch[data-key]").forEach((sw) => {
    sw.classList.toggle("is-on", !!v[sw.dataset.key]);
  });
  document.getElementById("weatherCityInput").value = v.weatherCity || "";
  document.querySelector(".wp-weather-city").classList.toggle("is-visible", !!v.weather);
}
function toggleWidgetVisible(key) {
  DB.widgetsVisible[key] = !DB.widgetsVisible[key];
  saveDB();
  applyWidgetsVisibility();
  if (key === "weather" && DB.widgetsVisible.weather) fetchWeather();
}

function openWidgetsPanel(anchorEl) {
  const panel = document.getElementById("widgetsPanel");
  panel.classList.add("is-open");
  document.getElementById("widgetsScrim").classList.add("is-open");
  applyWidgetsVisibility();
}
function closeWidgetsPanel() {
  document.getElementById("widgetsPanel").classList.remove("is-open");
  document.getElementById("widgetsScrim").classList.remove("is-open");
}

function addFloatingWidget(type) {
  if (type === "board") {
    const slot = document.querySelector(".board-add-slot");
    if (slot) startAddBoard(slot, Number(slot.style.gridRow) - 1, Number(slot.style.gridColumn) - 1);
    closeWidgetsPanel();
    return;
  }
  const w = {
    id: uid(), type, pageId: DB.activePageId,
    x: 40 + Math.random() * 60, y: 90 + Math.random() * 60,
    style: 0,
    variant: 0, 
    data: type === "notes" ? { text: "", tasks: [] } : type === "pomodoro" ? { minutes: 25 } : type === "feed" ? { source: "devto" } : {}
  };
  DB.floatingWidgets.push(w);
  saveDB();
  renderFloatingWidgets();
  closeWidgetsPanel();
}

function renderFloatingWidgets() {
  const wrap = document.getElementById("floatingWidgets");
  wrap.innerHTML = "";
  DB.floatingWidgets.filter((w) => w.pageId === DB.activePageId).forEach((w) => {
    wrap.appendChild(renderFloatingWidgetEl(w));
  });
}

function renderFloatingWidgetEl(w) {
  if (w.style == null) w.style = 0;
  if (w.variant == null) w.variant = 0;

  const el = document.createElement("div");
  el.className = "fwidget glass" + (w.style ? ` fw-style-${w.style}` : "");
  el.style.left = w.x + "px";
  el.style.top = w.y + "px";

  const titleMap = { notes: "Scratchpad", calendar: "Calendar", pomodoro: "Focus timer", feed: "News Feed", system: "System Monitor" };
  const head = document.createElement("div");
  head.className = "fwidget-head";
  
  // Icon for the "Switch Version" toggle
  const variantIcon = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"></polygon><polyline points="2 17 12 22 22 17"></polyline><polyline points="2 12 12 17 22 12"></polyline></svg>`;

  head.innerHTML = `
    <span class="fwidget-title">${titleMap[w.type] || w.type}</span>
    <div class="fwidget-styles" title="Widget style">
      <button class="fw-style-dot${w.style === 0 ? " is-active" : ""}" data-style="0"></button>
      <button class="fw-style-dot${w.style === 1 ? " is-active" : ""}" data-style="1"></button>
      <button class="fw-style-dot${w.style === 2 ? " is-active" : ""}" data-style="2"></button>
    </div>
    <button class="icon-btn" data-role="toggle-variant" title="Switch Version">${variantIcon}</button>
    <button class="icon-btn" data-role="close" title="Close">
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
    </button>
  `;

  head.querySelector('[data-role="toggle-variant"]').onclick = (e) => {
    e.stopPropagation();
    w.variant = w.variant === 0 ? 1 : 0;
    saveDB();
    renderFloatingWidgets();
  };

  head.querySelectorAll(".fw-style-dot").forEach((dot) => {
    dot.onclick = (e) => {
      e.stopPropagation();
      w.style = Number(dot.dataset.style);
      saveDB();
      renderFloatingWidgets();
    };
  });
  
  head.querySelector('[data-role="close"]').onclick = (e) => {
    e.stopPropagation();
    DB.floatingWidgets = DB.floatingWidgets.filter((x) => x.id !== w.id);
    saveDB(); renderFloatingWidgets();
  };
  
  makeDraggableWidget(head, el, w);
  el.appendChild(head);

  if (w.type === "notes") el.appendChild(buildNotesBody(w));
  else if (w.type === "calendar") el.appendChild(buildCalendarBody(w));
  else if (w.type === "pomodoro") el.appendChild(buildPomodoroBody(w));
  else if (w.type === "feed") el.appendChild(buildFeedBody(w));
  else if (w.type === "system") el.appendChild(buildSystemBody(w));

  return el;
}

function makeDraggableWidget(handle, el, w) {
  handle.addEventListener("mousedown", (e) => {
    e.preventDefault();
    const startX = e.clientX, startY = e.clientY;
    const origX = w.x, origY = w.y;
    function onMove(ev) {
      w.x = origX + (ev.clientX - startX);
      w.y = origY + (ev.clientY - startY);
      el.style.left = w.x + "px";
      el.style.top = w.y + "px";
    }
    function onUp() {
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
      saveDB();
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  });
}

// ---- Widget Builders with Versions Support ----

function buildNotesBody(w) {
  const wrap = document.createElement("div");
  
  if (w.variant === 0) {
    // V0: Standard Text Area
    const ta = document.createElement("textarea");
    ta.className = "notes-area";
    ta.value = w.data.text || "";
    ta.placeholder = "Jot something down…";
    ta.oninput = () => { w.data.text = ta.value; saveDB(); };
    wrap.appendChild(ta);
  } else {
    // V1: Checklist / Tasks
    w.data.tasks = w.data.tasks || [];
    wrap.innerHTML = `
      <div class="tasks-list"></div>
      <input type="text" class="task-input" placeholder="+ Add a task and hit enter..." />
    `;
    const list = wrap.querySelector('.tasks-list');
    const input = wrap.querySelector('.task-input');

    const renderTasks = () => {
      list.innerHTML = w.data.tasks.map((t, i) => `
        <label class="task-item ${t.done ? 'is-done' : ''}">
          <input type="checkbox" data-index="${i}" ${t.done ? 'checked' : ''} />
          <span>${escapeHtml(t.text)}</span>
        </label>
      `).join('');
      
      list.querySelectorAll('input').forEach(chk => {
        chk.onchange = (e) => {
          w.data.tasks[e.target.dataset.index].done = e.target.checked;
          saveDB(); renderTasks();
        };
      });
    };

    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && input.value.trim()) {
        w.data.tasks.push({ text: input.value.trim(), done: false });
        input.value = '';
        saveDB(); renderTasks();
      }
    });

    renderTasks();
  }
  return wrap;
}

function buildCalendarBody(w) {
  const wrap = document.createElement("div");
  let calDate = new Date();
  const MONTHS = ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  if (w.variant === 0) {
    // V0: Standard Month Grid
    wrap.innerHTML = `
      <div class="cal-head">
        <span class="cal-title"></span>
        <div class="cal-nav"><button data-dir="-1">‹</button><button data-dir="1">›</button></div>
      </div>
      <div class="cal-dow"><span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span></div>
      <div class="cal-grid"></div>
    `;
    function renderGrid() {
      wrap.querySelector(".cal-title").textContent = `${MONTHS[calDate.getMonth()]} ${calDate.getFullYear()}`;
      const grid = wrap.querySelector(".cal-grid");
      grid.innerHTML = "";
      const firstDay = new Date(calDate.getFullYear(), calDate.getMonth(), 1).getDay();
      const totalDays = new Date(calDate.getFullYear(), calDate.getMonth() + 1, 0).getDate();
      const today = new Date();
      for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement("div"));
      for (let d = 1; d <= totalDays; d++) {
        const cell = document.createElement("div");
        cell.textContent = d;
        cell.className = "cal-day";
        if (d === today.getDate() && calDate.getMonth() === today.getMonth() && calDate.getFullYear() === today.getFullYear()) cell.classList.add("is-today");
        grid.appendChild(cell);
      }
    }
    wrap.querySelectorAll(".cal-nav button").forEach((b) => b.onclick = () => { calDate.setMonth(calDate.getMonth() + Number(b.dataset.dir)); renderGrid(); });
    renderGrid();
  } else {
    // V1: Minimal "Today" View
    wrap.className = "cal-today-view";
    wrap.innerHTML = `
      <div class="cal-today-num">${calDate.getDate()}</div>
      <div class="cal-today-text">${DAYS[calDate.getDay()]}, ${MONTHS[calDate.getMonth()]}</div>
    `;
  }
  return wrap;
}

function buildPomodoroBody(w) {
  const wrap = document.createElement("div");
  let minutes = w.data.minutes || 25;
  let timeLeft = minutes * 60, timerId = null;

  function paint(disp) {
    const m = Math.floor(timeLeft / 60), s = timeLeft % 60;
    disp.textContent = `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }

  if (w.variant === 0) {
    // V0: Full Timer
    wrap.innerHTML = `
      <div class="timer-display">25:00</div>
      <div class="timer-durations">
        <button class="dur-chip" data-min="25">25</button>
        <button class="dur-chip" data-min="15">15</button>
        <button class="dur-chip" data-min="5">5</button>
      </div>
      <div class="timer-actions">
        <button class="btn-primary" data-role="toggle">Start</button>
        <button class="btn-soft" data-role="reset">Reset</button>
      </div>
    `;
    const disp = wrap.querySelector(".timer-display");
    const toggleBtn = wrap.querySelector('[data-role="toggle"]');
    
    wrap.querySelectorAll(".dur-chip").forEach((chip) => {
      if (Number(chip.dataset.min) === minutes) chip.classList.add("is-active");
      chip.onclick = () => {
        clearInterval(timerId); timerId = null; toggleBtn.textContent = "Start";
        wrap.querySelectorAll(".dur-chip").forEach((c) => c.classList.remove("is-active"));
        chip.classList.add("is-active");
        minutes = Number(chip.dataset.min); w.data.minutes = minutes; saveDB();
        timeLeft = minutes * 60; paint(disp);
      };
    });
    toggleBtn.onclick = () => {
      if (timerId) { clearInterval(timerId); timerId = null; toggleBtn.textContent = "Start"; }
      else {
        timerId = setInterval(() => {
          if (timeLeft > 0) { timeLeft--; paint(disp); } else { clearInterval(timerId); timerId = null; toggleBtn.textContent = "Start"; }
        }, 1000);
        toggleBtn.textContent = "Pause";
      }
    };
    wrap.querySelector('[data-role="reset"]').onclick = () => { clearInterval(timerId); timerId = null; timeLeft = minutes * 60; paint(disp); toggleBtn.textContent = "Start"; };
    paint(disp);
  } else {
    // V1: Minimal Inline Timer
    wrap.className = "timer-minimal";
    wrap.innerHTML = `
      <div class="timer-display">25:00</div>
      <button class="timer-minimal-btn" data-role="toggle">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
      </button>
    `;
    const disp = wrap.querySelector(".timer-display");
    const toggleBtn = wrap.querySelector('[data-role="toggle"]');
    const playIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>`;
    const pauseIcon = `<svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>`;

    toggleBtn.onclick = () => {
      if (timerId) { 
        clearInterval(timerId); timerId = null; toggleBtn.innerHTML = playIcon; 
      } else {
        timerId = setInterval(() => {
          if (timeLeft > 0) { timeLeft--; paint(disp); } else { clearInterval(timerId); timerId = null; toggleBtn.innerHTML = playIcon; }
        }, 1000);
        toggleBtn.innerHTML = pauseIcon;
      }
    };
    paint(disp);
  }

  return wrap;
}

// Dev & News Feed Widget Builder
function buildFeedBody(w) {
  const wrap = document.createElement("div");
  wrap.className = "feed-widget";
  let currentFeed = w.data.source || 'devto';

  wrap.innerHTML = `
    <div class="feed-tabs">
      <button class="feed-tab ${currentFeed==='devto'?'is-active':''}" data-src="devto">Dev.to</button>
      <button class="feed-tab ${currentFeed==='hn'?'is-active':''}" data-src="hn">Hacker News</button>
      <button class="feed-tab ${currentFeed==='reddit'?'is-active':''}" data-src="reddit">r/webdev</button>
    </div>
    <div class="feed-content" id="feedContent-${w.id}">
       <div class="feed-loading">Loading feed...</div>
    </div>
  `;

  const content = wrap.querySelector(".feed-content");
  const tabs = wrap.querySelectorAll(".feed-tab");

  async function loadFeed(src) {
     content.innerHTML = '<div class="feed-loading">Loading...</div>';
     try {
        let items = [];
        if (src === 'devto') {
           const res = await fetch('https://dev.to/api/articles?per_page=8');
           const data = await res.json();
           items = data.map(item => ({ title: item.title, url: item.url }));
        } else if (src === 'hn') {
           const res = await fetch('https://hn.algolia.com/api/v1/search?tags=front_page&hitsPerPage=8');
           const data = await res.json();
           items = data.hits.map(item => ({ 
             title: item.title, 
             url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}` 
           }));
        } else if (src === 'reddit') {
           const res = await fetch('https://www.reddit.com/r/webdev/hot.json?limit=8');
           const data = await res.json();
           items = data.data.children.map(child => ({ title: child.data.title, url: 'https://reddit.com' + child.data.permalink }));
        }

        content.innerHTML = items.map(item => `
           <a href="${escapeHtml(item.url)}" target="_blank" class="feed-item">
              <span class="feed-item-title">${escapeHtml(item.title)}</span>
           </a>
        `).join('');
     } catch (err) {
        content.innerHTML = '<div class="feed-error">Failed to load feed. Try again later.</div>';
     }
  }

  tabs.forEach(t => {
     t.onclick = () => {
        tabs.forEach(btn => btn.classList.remove('is-active'));
        t.classList.add('is-active');
        currentFeed = t.dataset.src;
        w.data.source = currentFeed;
        saveDB();
        loadFeed(currentFeed);
     };
  });

  loadFeed(currentFeed);
  return wrap;
}

// System Hardware Monitor
function buildSystemBody(w) {
  const wrap = document.createElement("div");

  if (w.variant === 0) {
    // V0: Progress Bars
    wrap.innerHTML = `
      <div class="sys-stat">
        <div class="sys-stat-head"><span>CPU Usage</span><span id="sysCpuText-${w.id}">0%</span></div>
        <div class="sys-bar-bg"><div class="sys-bar-fill" id="sysCpuBar-${w.id}" style="width:0%"></div></div>
      </div>
      <div class="sys-stat">
        <div class="sys-stat-head"><span>Memory (RAM)</span><span id="sysRamText-${w.id}">0%</span></div>
        <div class="sys-bar-bg"><div class="sys-bar-fill" id="sysRamBar-${w.id}" style="width:0%"></div></div>
      </div>
    `;
  } else {
    // V1: Minimal Text Blocks
    wrap.className = "sys-minimal";
    wrap.innerHTML = `
      <div class="sys-min-item"><div class="sys-min-val" id="sysCpuText-${w.id}">0%</div><div class="sys-min-label">CPU</div></div>
      <div class="sys-min-item"><div class="sys-min-val" id="sysRamText-${w.id}">0%</div><div class="sys-min-label">RAM</div></div>
    `;
  }

  let prevCpu = null;
  const updateStats = () => {
    const cpuText = document.getElementById(`sysCpuText-${w.id}`);
    const cpuBar = document.getElementById(`sysCpuBar-${w.id}`);
    const ramText = document.getElementById(`sysRamText-${w.id}`);
    const ramBar = document.getElementById(`sysRamBar-${w.id}`);
    
    if(!cpuText) return; // widget was closed

    // Chrome Extension API Logic
    if (chrome && chrome.system && chrome.system.memory) {
      chrome.system.memory.getInfo(info => {
        const percent = Math.round(((info.capacity - info.availableCapacity) / info.capacity) * 100);
        ramText.textContent = `${percent}%`;
        if (ramBar) ramBar.style.width = `${percent}%`;
      });
    } else {
      // Mock Fallback for standard browser viewing
      const p = 30 + Math.random() * 40;
      ramText.textContent = `${Math.round(p)}%`;
      if (ramBar) ramBar.style.width = `${p}%`;
    }

    if (chrome && chrome.system && chrome.system.cpu) {
      chrome.system.cpu.getInfo(info => {
        let total = 0, idle = 0;
        info.processors.forEach(p => { total += p.usage.total; idle += p.usage.idle; });
        if (prevCpu) {
          const idleDiff = idle - prevCpu.idle, totalDiff = total - prevCpu.total;
          const percent = Math.floor(100 - ((idleDiff / totalDiff) * 100));
          cpuText.textContent = `${percent}%`;
          if (cpuBar) cpuBar.style.width = `${percent}%`;
        }
        prevCpu = {idle, total};
      });
    } else {
       // Mock Fallback
       const p = 10 + Math.random() * 60;
       cpuText.textContent = `${Math.round(p)}%`;
       if (cpuBar) cpuBar.style.width = `${p}%`;
    }
  };

  updateStats();
  setInterval(updateStats, 2000);
  return wrap;
}

/* ============================================================
   12. Toolbar stack
   ============================================================ */
function initToolbar() {
  const extra = document.getElementById("toolbarExtra");
  document.getElementById("toolbarToggleBtn").onclick = () => extra.classList.add("is-open");
  document.getElementById("toolbarCollapseBtn").onclick = () => extra.classList.remove("is-open");

  document.querySelectorAll("[data-tool]").forEach((btn) => {
    btn.onclick = () => {
      const tool = btn.dataset.tool;
      if (tool === "search") { DB.widgetsVisible.search = true; saveDB(); applyWidgetsVisibility(); document.getElementById("searchInput").focus(); }
      if (tool === "wallpaper") openWallpaperDrawer();
      if (tool === "widgets") openWidgetsPanel(btn);
      if (tool === "import") importBookmarks();
      if (tool === "manage") document.getElementById("boardGrid").classList.toggle("manage-mode");
      if (tool === "focus") toggleFocusMode();
    };
  });
  if (DB.settings.general.sidebarAlways) extra.classList.add("is-open");
}
function openWallpaperDrawer() {
  document.getElementById("wallpaperDrawer").classList.add("is-open");
  document.getElementById("wallpaperScrim").classList.add("is-open");
  renderPresetGrid();
}
function closeWallpaperDrawer() {
  document.getElementById("wallpaperDrawer").classList.remove("is-open");
  document.getElementById("wallpaperScrim").classList.remove("is-open");
}

/* ============================================================
   13. Reusable color picker
   ============================================================ */
let cpTargetSetter = null;
let cpHue = 200, cpHex = "#3f7f93";
function openColorPicker(anchorEl, initialHex, onChange) {
  cpTargetSetter = onChange;
  cpHex = initialHex || "#3f7f93";
  const { r, g, b } = hexToRgb(cpHex);
  const hsv = rgbToHsv(r, g, b);
  cpHue = hsv.h;
  document.getElementById("cpHue").value = Math.round(cpHue);
  document.getElementById("cpR").value = r;
  document.getElementById("cpG").value = g;
  document.getElementById("cpB").value = b;
  drawColorSquare();
  updateCpSwatch();
  const picker = document.getElementById("colorPicker");
  const rect = anchorEl.getBoundingClientRect();
  let left = Math.min(rect.left, window.innerWidth - 250);
  let top = rect.bottom + 8;
  if (top + 320 > window.innerHeight) top = rect.top - 320;
  picker.style.left = left + "px";
  picker.style.top = top + "px";
  picker.classList.add("is-open");
  document.getElementById("colorPickerScrim").classList.add("is-open");
}
function closeColorPicker() {
  document.getElementById("colorPicker").classList.remove("is-open");
  document.getElementById("colorPickerScrim").classList.remove("is-open");
  cpTargetSetter = null;
}
function drawColorSquare() {
  const canvas = document.getElementById("cpSquare");
  const ctx = canvas.getContext("2d");
  const w = canvas.width, h = canvas.height;
  const hueRgb = hsvToRgb(cpHue, 1, 1);
  const hueHex = rgbToHex(hueRgb.r, hueRgb.g, hueRgb.b);
  ctx.fillStyle = hueHex; ctx.fillRect(0, 0, w, h);
  const gradWhite = ctx.createLinearGradient(0, 0, w, 0);
  gradWhite.addColorStop(0, "#fff"); gradWhite.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradWhite; ctx.fillRect(0, 0, w, h);
  const gradBlack = ctx.createLinearGradient(0, 0, 0, h);
  gradBlack.addColorStop(0, "rgba(0,0,0,0)"); gradBlack.addColorStop(1, "#000");
  ctx.fillStyle = gradBlack; ctx.fillRect(0, 0, w, h);
}
function updateCpSwatch() { document.getElementById("cpSwatch").style.background = cpHex; }
function cpEmit() {
  updateCpSwatch();
  if (cpTargetSetter) cpTargetSetter(cpHex);
}
function initColorPicker() {
  const canvas = document.getElementById("cpSquare");
  let dragging = false;
  function pick(e) {
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
    const s = x / rect.width, v = 1 - y / rect.height;
    const { r, g, b } = hsvToRgb(cpHue, s, v);
    cpHex = rgbToHex(r, g, b);
    document.getElementById("cpR").value = Math.round(r);
    document.getElementById("cpG").value = Math.round(g);
    document.getElementById("cpB").value = Math.round(b);
    cpEmit();
  }
  canvas.addEventListener("mousedown", (e) => { dragging = true; pick(e); });
  window.addEventListener("mousemove", (e) => { if (dragging) pick(e); });
  window.addEventListener("mouseup", () => (dragging = false));

  document.getElementById("cpHue").addEventListener("input", (e) => {
    cpHue = Number(e.target.value);
    drawColorSquare();
    const r = Number(document.getElementById("cpR").value) || 0;
    const g = Number(document.getElementById("cpG").value) || 0;
    const b = Number(document.getElementById("cpB").value) || 0;
    cpHex = rgbToHex(r, g, b);
    cpEmit();
  });
  ["cpR", "cpG", "cpB"].forEach((id) => {
    document.getElementById(id).addEventListener("input", () => {
      const r = Number(document.getElementById("cpR").value) || 0;
      const g = Number(document.getElementById("cpG").value) || 0;
      const b = Number(document.getElementById("cpB").value) || 0;
      cpHex = rgbToHex(r, g, b);
      const hsv = rgbToHsv(r, g, b);
      cpHue = hsv.h;
      document.getElementById("cpHue").value = Math.round(cpHue);
      drawColorSquare();
      cpEmit();
    });
  });
}

/* ============================================================
   14. Settings modal & Custom Search Rendering
   ============================================================ */
let apSnapshot = null;
function openSettings(tab) {
  document.getElementById("settingsModal").classList.add("is-open");
  apSnapshot = JSON.parse(JSON.stringify(DB.settings.appearance));
  populateSettingsUI();
  if (tab) switchSettingsTab(tab);
}
function closeSettings() { document.getElementById("settingsModal").classList.remove("is-open"); }
function switchSettingsTab(tab) {
  document.querySelectorAll(".settings-nav button[data-tab]").forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
  document.querySelectorAll(".settings-pane").forEach((p) => p.classList.toggle("is-active", p.dataset.pane === tab));
}

function renderSearchEngineButtons() {
  const container = document.getElementById("searchEnginesList");
  const googleBtn = container.querySelector('[data-engine="google"]');
  
  container.innerHTML = "";
  if(googleBtn) container.appendChild(googleBtn);

  if (DB.settings.search && DB.settings.search.customEngines) {
    DB.settings.search.customEngines.forEach((engine, i) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "engine-btn";
      btn.dataset.engine = engine.id;
      btn.title = `${escapeHtml(engine.name)} (Alt+${i + 2})`;
      btn.innerHTML = `<span style="font-weight: 800; font-size: 11px; font-family: monospace;">${escapeHtml(engine.iconText)}</span>`;
      container.appendChild(btn);
    });
  }

  // Bind the newly created custom engine buttons
  document.querySelectorAll(".engine-btn").forEach(btn => {
    btn.onclick = (e) => {
      e.stopPropagation();
      setSearchEngine(btn.dataset.engine);
    };
  });
}

function populateSettingsUI() {
  const g = DB.settings.general, a = DB.settings.appearance;

  document.getElementById("stShowDescriptions").classList.toggle("is-on", g.showDescriptions);
  document.getElementById("stColumns").value = g.columns;
  document.getElementById("stBoardWidth").value = g.boardWidth;
  document.getElementById("stBoardWidthVal").textContent = g.boardWidth + "px";
  document.getElementById("stSidebarAlways").classList.toggle("is-on", g.sidebarAlways);
  document.getElementById("stTimeFormat").value = g.timeFormat;
  document.getElementById("stTempUnit").value = g.tempUnit;

  const fontSelect = document.getElementById("stFontFamily");
  if (fontSelect.options.length === 0) {
    FONT_OPTIONS.forEach((f) => {
      const opt = document.createElement("option");
      opt.value = f.key; opt.textContent = f.name;
      fontSelect.appendChild(opt);
    });
  }
  fontSelect.value = g.fontFamily || "default";
  document.getElementById("stFontPreview").style.fontFamily = fontStackFor(g.fontFamily || "default");

  const qsSelect = document.getElementById("stQuickSaveBoard");
  qsSelect.innerHTML = "";
  DB.pages.forEach((p) => p.boards.forEach((b) => {
    const opt = document.createElement("option");
    opt.value = `${p.id}:${b.id}`; opt.textContent = `${p.name} / ${b.name}`;
    qsSelect.appendChild(opt);
  }));
  if (g.quickSaveKey) qsSelect.value = g.quickSaveKey;
  document.getElementById("stShortcutDisplay").textContent = g.quickSaveShortcut || "Not set";

  // Search Engine Settings Rendering
  const enginesList = document.getElementById("customSearchEnginesList");
  enginesList.innerHTML = "";
  if (DB.settings.search && DB.settings.search.customEngines) {
    DB.settings.search.customEngines.forEach((engine, i) => {
      const row = document.createElement("div");
      row.style.display = "flex";
      row.style.gap = "8px";
      row.innerHTML = `
        <input type="text" class="text-input" placeholder="Name" value="${escapeHtml(engine.name)}" data-index="${i}" data-field="name" style="flex:1;">
        <input type="text" class="text-input" placeholder="URL (%s for query)" value="${escapeHtml(engine.url)}" data-index="${i}" data-field="url" style="flex:2;">
        <input type="text" class="text-input" placeholder="Short" value="${escapeHtml(engine.iconText)}" data-index="${i}" data-field="iconText" style="flex:0.8;" maxlength="4">
      `;
      enginesList.appendChild(row);
    });
  }

  document.getElementById("apBoardPrimary").style.background = a.board.primaryColor;
  document.getElementById("apBoardColor").style.background = a.board.boardColor;
  document.getElementById("apBoardOpacity").value = a.board.opacity;
  document.getElementById("apBoardOpacityVal").textContent = a.board.opacity + "%";
  document.getElementById("apBoardBlur").value = a.board.blur;
  document.getElementById("apBoardBlurVal").textContent = a.board.blur + "px";

  document.getElementById("apSearchColor").style.background = a.searchBar.color;
  document.getElementById("apSearchOpacity").value = a.searchBar.opacity;
  document.getElementById("apSearchOpacityVal").textContent = a.searchBar.opacity + "%";
  document.getElementById("apSearchBlur").value = a.searchBar.blur;
  document.getElementById("apSearchBlurVal").textContent = a.searchBar.blur + "px";
  document.getElementById("apSearchWidth").value = a.searchBar.width;
  document.getElementById("apSearchWidthVal").textContent = a.searchBar.width + "px";
  document.getElementById("apSearchMatch").classList.toggle("is-on", a.searchBar.matchBoard);

  document.querySelectorAll("#apTextSize button").forEach((b) => b.classList.toggle("is-active", b.dataset.val === a.boardText.size));
  document.querySelectorAll("#apTextWeight button").forEach((b) => b.classList.toggle("is-active", b.dataset.val === a.boardText.weight));
  const textAuto = a.boardText.auto !== false;
  document.getElementById("apTextAuto").classList.toggle("is-on", textAuto);
  document.getElementById("apTextColorRow").style.display = textAuto ? "none" : "block";
  document.getElementById("apTextColor").style.background = a.boardText.color || "#22262b";

  document.getElementById("apOutlineColor").style.background = a.outline.color;
  document.getElementById("apOutlineOpacity").value = a.outline.opacity;
  document.getElementById("apOutlineOpacityVal").textContent = a.outline.opacity + "%";
  document.getElementById("apOutlineMatch").classList.toggle("is-on", a.outline.matchBoard);
}

function initSettingsWiring() {
  document.querySelectorAll(".settings-nav button[data-tab]").forEach((b) => b.onclick = () => switchSettingsTab(b.dataset.tab));
  document.getElementById("closeSettingsBtn").onclick = closeSettings;
  document.getElementById("openSettingsBtn").onclick = () => openSettings("account");

  const g = () => DB.settings.general, a = () => DB.settings.appearance;

  document.getElementById("stShowDescriptions").onclick = function () { g().showDescriptions = !g().showDescriptions; this.classList.toggle("is-on"); saveDB(); renderBoards(); };
  document.getElementById("stColumns").onchange = function () { g().columns = this.value; saveDB(); applyAppearance(); renderBoards(); };
  document.getElementById("stBoardWidth").oninput = function () { g().boardWidth = Number(this.value); document.getElementById("stBoardWidthVal").textContent = this.value + "px"; saveDB(); applyAppearance(); renderBoards(); };
  document.getElementById("stSidebarAlways").onclick = function () { g().sidebarAlways = !g().sidebarAlways; this.classList.toggle("is-on"); saveDB(); if (g().sidebarAlways) document.getElementById("toolbarExtra").classList.add("is-open"); };
  document.getElementById("stQuickSaveBoard").onchange = function () { g().quickSaveKey = this.value; saveDB(); };
  document.getElementById("stTimeFormat").onchange = function () { g().timeFormat = this.value; saveDB(); updateClock(); };
  document.getElementById("stTempUnit").onchange = function () { g().tempUnit = this.value; saveDB(); fetchWeather(); };
  document.getElementById("stFontFamily").onchange = function () {
    g().fontFamily = this.value;
    saveDB();
    applyFont();
    document.getElementById("stFontPreview").style.fontFamily = fontStackFor(this.value);
  };
  document.getElementById("stShortcutChangeBtn").onclick = () => { chrome.tabs.create({ url: "chrome://extensions/shortcuts" }); };
  document.getElementById("restartTourBtn").onclick = () => { closeSettings(); DB.tourDone = false; saveDB(); startTour(); };
  document.getElementById("downloadDataBtn").onclick = downloadData;

  // Custom Search Engines Panel Wire-up
  document.getElementById("customSearchEnginesList").addEventListener("input", (e) => {
    if (e.target.matches("input")) {
      const index = e.target.dataset.index;
      const field = e.target.dataset.field;
      DB.settings.search.customEngines[index][field] = e.target.value;
      saveDB();
      renderSearchEngineButtons();
    }
  });

  // board appearance
  document.getElementById("apBoardPrimary").onclick = function () { openColorPicker(this, a().board.primaryColor, (hex) => { a().board.primaryColor = hex; this.style.background = hex; saveDB(); applyAppearance(); }); };
  document.getElementById("apBoardColor").onclick = function () { openColorPicker(this, a().board.boardColor, (hex) => { a().board.boardColor = hex; this.style.background = hex; saveDB(); applyAppearance(); }); };
  document.getElementById("apBoardOpacity").oninput = function () { a().board.opacity = Number(this.value); document.getElementById("apBoardOpacityVal").textContent = this.value + "%"; saveDB(); applyAppearance(); };
  document.getElementById("apBoardBlur").oninput = function () { a().board.blur = Number(this.value); document.getElementById("apBoardBlurVal").textContent = this.value + "px"; saveDB(); applyAppearance(); };
  document.getElementById("apBoardCancelBtn").onclick = () => { DB.settings.appearance = JSON.parse(JSON.stringify(apSnapshot)); saveDB(); applyAppearance(); populateSettingsUI(); };
  document.getElementById("apBoardResetBtn").onclick = () => { const d = defaultDB().settings.appearance.board; a().board = { ...d }; saveDB(); applyAppearance(); populateSettingsUI(); };

  // search bar
  document.getElementById("apSearchColor").onclick = function () { openColorPicker(this, a().searchBar.color, (hex) => { a().searchBar.color = hex; this.style.background = hex; saveDB(); applyAppearance(); }); };
  document.getElementById("apSearchOpacity").oninput = function () { a().searchBar.opacity = Number(this.value); document.getElementById("apSearchOpacityVal").textContent = this.value + "%"; saveDB(); applyAppearance(); };
  document.getElementById("apSearchBlur").oninput = function () { a().searchBar.blur = Number(this.value); document.getElementById("apSearchBlurVal").textContent = this.value + "px"; saveDB(); applyAppearance(); };
  document.getElementById("apSearchWidth").oninput = function () { a().searchBar.width = Number(this.value); document.getElementById("apSearchWidthVal").textContent = this.value + "px"; saveDB(); applyAppearance(); };
  document.getElementById("apSearchMatch").onclick = function () { a().searchBar.matchBoard = !a().searchBar.matchBoard; this.classList.toggle("is-on"); saveDB(); applyAppearance(); };

  // text
  document.querySelectorAll("#apTextSize button").forEach((b) => b.onclick = () => { a().boardText.size = b.dataset.val; saveDB(); applyAppearance(); populateSettingsUI(); });
  document.querySelectorAll("#apTextWeight button").forEach((b) => b.onclick = () => { a().boardText.weight = b.dataset.val; saveDB(); applyAppearance(); populateSettingsUI(); });
  document.getElementById("apTextAuto").onclick = function () {
    a().boardText.auto = !(a().boardText.auto !== false);
    saveDB(); applyAppearance(); populateSettingsUI();
  };
  document.getElementById("apTextColor").onclick = function () {
    openColorPicker(this, a().boardText.color || "#22262b", (hex) => { a().boardText.color = hex; this.style.background = hex; saveDB(); applyAppearance(); });
  };

  // outline
  document.getElementById("apOutlineColor").onclick = function () { openColorPicker(this, a().outline.color, (hex) => { a().outline.color = hex; this.style.background = hex; saveDB(); applyAppearance(); }); };
  document.getElementById("apOutlineOpacity").oninput = function () { a().outline.opacity = Number(this.value); document.getElementById("apOutlineOpacityVal").textContent = this.value + "%"; saveDB(); applyAppearance(); };
  document.getElementById("apOutlineMatch").onclick = function () { a().outline.matchBoard = !a().outline.matchBoard; this.classList.toggle("is-on"); saveDB(); applyAppearance(); };
  document.getElementById("apOutlineRemoveAllBtn").onclick = () => { DB.pages.forEach((p) => p.boards.forEach((b) => (b.accentColor = null))); saveDB(); renderBoards(); };
}

function downloadData() {
  const blob = new Blob([JSON.stringify(DB, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = "vitrine-data.json"; a.click();
  URL.revokeObjectURL(url);
}

/* ============================================================
   15. Onboarding tour
   ============================================================ */
const TOUR_STEPS = [
  { title: "Create a board", desc: 'Boards hold your bookmarks. Click any highlighted "+" slot to create your first one.', anchor: () => document.querySelector(".board-add-slot"), waitFor: "boardCreated" },
  { title: "Add a bookmark", desc: "Once you have a board, click the + on it to save any link.", anchor: () => document.querySelector('.board-head [data-role="add-link"]'), waitFor: "linkAdded" },
  { title: "Organize with pages", desc: "Create pages for Work, Personal, Travel, or whatever makes sense for you.", anchor: () => document.querySelector(".pages .pill-add"), waitFor: "addPageDone" },
  { title: "Explore the menu", desc: "Change your wallpaper, add widgets, or import your Chrome bookmarks.", anchor: () => document.getElementById("toolbarToggleBtn") },
  { title: "Settings", desc: "Account, board layout, and everything in between, all in one place.", anchor: () => document.getElementById("openSettingsBtn") },
  { title: "Save any page in a click", desc: "Click the Vitrine icon in the toolbar to save the current tab. You can also set up a keyboard shortcut in Settings.", anchor: null },
  { title: "Bring in your bookmarks", desc: "Let's import your existing Chrome bookmarks into boards. It only takes a click.", anchor: null, isImportStep: true },
  { title: "Drag to organize", desc: "Drag any bookmark to move it between boards, or reorder it within a board.", anchor: null, isDragStep: true },
  { title: "You're all set!", desc: "That's all you need to know. Go ahead and make it yours.", anchor: null, isFinal: true },
];
let tourIndex = 0;
let tourWaitingFor = null;

function startTour() {
  tourIndex = 0;
  document.getElementById("tourScrim").classList.add("is-open");
  renderTourStep();
}
function endTour() {
  DB.tourDone = true; saveDB();
  document.getElementById("tourScrim").classList.remove("is-open");
  document.getElementById("tourTooltip").classList.remove("is-open");
  tourWaitingFor = null;
  renderBoards();
}
function advanceTourIfWaitingFor(key) {
  if (tourWaitingFor === key) { tourWaitingFor = null; tourIndex++; renderTourStep(); }
}
function renderTourStep() {
  if (tourIndex >= TOUR_STEPS.length) { endTour(); return; }
  const step = TOUR_STEPS[tourIndex];
  tourWaitingFor = step.waitFor || null;

  const tooltip = document.getElementById("tourTooltip");
  document.getElementById("tourStepLabel").textContent = `${tourIndex + 1} of ${TOUR_STEPS.length}`;
  document.getElementById("tourTitle").textContent = step.title;
  document.getElementById("tourDesc").textContent = step.desc;
  document.getElementById("tourBackBtn").style.visibility = tourIndex === 0 ? "hidden" : "visible";
  document.getElementById("tourImportExtra").style.display = step.isImportStep ? "flex" : "none";
  document.getElementById("tourDragIllustration").style.display = step.isDragStep ? "flex" : "none";
  document.getElementById("tourActions").style.display = step.isImportStep ? "none" : "flex";
  document.getElementById("tourNextBtn").textContent = step.isFinal ? "Done" : "Next →";

  tooltip.classList.add("is-open");
  positionTourTooltip(step);
}
function positionTourTooltip(step) {
  const tooltip = document.getElementById("tourTooltip");
  const anchor = step.anchor ? step.anchor() : null;
  if (anchor) {
    const rect = anchor.getBoundingClientRect();
    let left = rect.left + rect.width / 2 - tooltip.offsetWidth / 2;
    let top = rect.top - tooltip.offsetHeight - 14;
    if (top < 10) top = rect.bottom + 14;
    left = Math.max(10, Math.min(left, window.innerWidth - tooltip.offsetWidth - 10));
    tooltip.style.left = left + "px";
    tooltip.style.top = top + "px";
  } else {
    tooltip.style.left = (window.innerWidth / 2 - tooltip.offsetWidth / 2) + "px";
    tooltip.style.top = (window.innerHeight / 2 - tooltip.offsetHeight / 2) + "px";
  }
}
function initTourWiring() {
  document.getElementById("tourSkipBtn").onclick = endTour;
  document.getElementById("tourBackBtn").onclick = () => { if (tourIndex > 0) { tourIndex--; tourWaitingFor = null; renderTourStep(); } };
  document.getElementById("tourNextBtn").onclick = () => {
    const step = TOUR_STEPS[tourIndex];
    if (step.isFinal) return endTour();
    tourIndex++; tourWaitingFor = null; renderTourStep();
  };
  document.getElementById("tourImportBtn").onclick = () => { importBookmarks(); tourIndex++; tourWaitingFor = null; renderTourStep(); };
  document.getElementById("tourLaterBtn").onclick = () => { tourIndex++; tourWaitingFor = null; renderTourStep(); };
  window.addEventListener("resize", () => { if (document.getElementById("tourTooltip").classList.contains("is-open")) positionTourTooltip(TOUR_STEPS[tourIndex]); });
}

/* ============================================================
   16. Quick-save from extension icon / command
   ============================================================ */
async function checkPendingQuickSave() {
  const res = await chrome.storage.local.get("vitrine_pending_quicksave");
  const pending = res.vitrine_pending_quicksave;
  if (!pending) return;
  await chrome.storage.local.remove("vitrine_pending_quicksave");
  let ref = null;
  if (DB.settings.general.quickSaveKey) {
    const [pageId, boardId] = DB.settings.general.quickSaveKey.split(":");
    ref = findBoard(boardId);
  }
  if (!ref) {
    const page = activePage();
    if (!page.boards.length) page.boards.push({ id: uid(), name: "Saved", links: [], accentColor: null });
    ref = { page, board: page.boards[0] };
  }
  ref.board.links.push({ id: uid(), title: pending.title, url: pending.url });
  saveDB();
  if (ref.page.id === DB.activePageId) renderBoards();
}
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.vitrine_pending_quicksave) checkPendingQuickSave();
});

/* ============================================================
   17. Global click-away & inputs (Search logic)
   ============================================================ */

let currentSearchEngine = 'google';

function setSearchEngine(engine) {
  currentSearchEngine = engine;
  document.querySelectorAll(".engine-btn").forEach(btn => btn.classList.remove("is-active"));
  const activeBtn = document.querySelector(`.engine-btn[data-engine="${engine}"]`);
  if (activeBtn) activeBtn.classList.add("is-active");
  
  let placeholder = 'Search Google...';
  if (engine !== 'google') {
    const custom = DB.settings.search.customEngines.find(x => x.id === engine);
    if (custom && custom.name) placeholder = `Search ${custom.name}...`;
  }
  const searchInput = document.getElementById("searchInput");
  searchInput.placeholder = placeholder;
  searchInput.focus();
}

function openAppsPopover(anchorEl) {
  const pop = document.getElementById("appsPopover");
  const rect = anchorEl.getBoundingClientRect();
  pop.style.top = rect.bottom + 12 + "px";
  pop.style.right = (window.innerWidth - rect.right) + "px";
  pop.classList.add("is-open");
  document.getElementById("appsScrim").classList.add("is-open");
}
function closeAppsPopover() {
  document.getElementById("appsPopover").classList.remove("is-open");
  document.getElementById("appsScrim").classList.remove("is-open");
}

function initGlobalPopoverClosers() {
  document.getElementById("appsScrim").onclick = closeAppsPopover;
  document.getElementById("waffleBtn").onclick = function() { openAppsPopover(this); };

  document.getElementById("addLinkScrim").onclick = closeAddLinkPopover;
  document.getElementById("addLinkCancelBtn").onclick = closeAddLinkPopover;
  document.getElementById("addLinkSaveBtn").onclick = saveAddLink;
  document.getElementById("addLinkUrlInput").addEventListener("keydown", (e) => { if (e.key === "Enter") saveAddLink(); });

  document.getElementById("boardMenuScrim").onclick = closeBoardMenu;
  document.getElementById("boardMenu").querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      const ref = findBoard(boardMenuTargetId);
      const action = btn.dataset.action;
      if (action === "rename") {
        const name = prompt("Rename board", ref.board.name);
        if (name && name.trim()) { ref.board.name = name.trim(); saveDB(); renderBoards(); }
        closeBoardMenu();
      } else if (action === "openall") {
        ref.board.links.forEach((l) => window.open(l.url, "_blank"));
        closeBoardMenu();
      } else if (action === "customize") {
        openBoardCustomize(btn);
      } else if (action === "delete") {
        if (confirm(`Delete board "${ref.board.name}"?`)) {
          ref.page.boards = ref.page.boards.filter((b) => b.id !== ref.board.id);
          saveDB(); renderBoards();
        }
        closeBoardMenu();
      }
    };
  });
  document.getElementById("boardAccentClearBtn").onclick = () => {
    const ref = findBoard(boardMenuTargetId);
    ref.board.accentColor = null; saveDB(); renderBoards(); closeBoardMenu();
  };

  document.getElementById("pageMenuScrim").onclick = closePageMenu;
  document.getElementById("pageMenu").querySelectorAll("button").forEach((btn) => {
    btn.onclick = () => {
      const page = DB.pages.find((p) => p.id === pageMenuTargetId);
      if (btn.dataset.action === "rename") {
        const name = prompt("Rename page", page.name);
        if (name && name.trim()) { page.name = name.trim(); saveDB(); renderPageTabs(); }
      } else if (btn.dataset.action === "delete") {
        if (DB.pages.length <= 1) { alert("You need at least one page."); }
        else if (confirm(`Delete page "${page.name}"?`)) {
          DB.pages = DB.pages.filter((p) => p.id !== page.id);
          if (DB.activePageId === page.id) DB.activePageId = DB.pages[0].id;
          saveDB(); renderPageTabs(); renderBoards(); renderFloatingWidgets();
        }
      }
      closePageMenu();
    };
  });

  document.getElementById("widgetsScrim").onclick = closeWidgetsPanel;
  document.querySelectorAll("[data-add-widget]").forEach((row) => {
    row.querySelector(".wp-add-btn").onclick = () => addFloatingWidget(row.dataset.addWidget);
  });
  document.querySelectorAll("[data-toggle-widget]").forEach((row) => {
    row.querySelector(".switch").onclick = () => toggleWidgetVisible(row.dataset.toggleWidget);
  });
  document.getElementById("weatherApplyBtn").onclick = () => {
    DB.widgetsVisible.weatherCity = document.getElementById("weatherCityInput").value.trim();
    saveDB(); fetchWeather();
  };

  document.getElementById("colorPickerScrim").onclick = closeColorPicker;

  document.getElementById("wallpaperScrim").onclick = closeWallpaperDrawer;
  document.getElementById("closeWallpaperBtn").onclick = closeWallpaperDrawer;
  document.getElementById("wallpaperUpload").onchange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setWallpaper(ev.target.result, "photo");
    reader.readAsDataURL(file);
  };
  document.getElementById("saveUrlBtn").onclick = () => {
    const url = document.getElementById("wallpaperUrlInput").value.trim();
    if (url) { setWallpaper(url, "photo"); document.getElementById("wallpaperUrlInput").value = ""; }
  };

  // Search Engine & Autocomplete Logic
  const searchInput = document.getElementById("searchInput");
  const suggestionsBox = document.getElementById("searchSuggestionsBox");
  const suggestionsList = document.getElementById("searchSuggestionsList");
  const searchForm = document.getElementById("searchForm");
  
  let suggestDebounce = null;
  let currentFocus = -1; 

  searchForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    const q = searchInput.value.trim();
    if (!q) return;
    
    let url = `https://www.google.com/search?q=${encodeURIComponent(q)}`;
    
    if (currentSearchEngine !== 'google') {
      const custom = DB.settings.search.customEngines.find(x => x.id === currentSearchEngine);
      if (custom && custom.url) {
        url = custom.url.replace("%s", encodeURIComponent(q));
      }
    }
    
    window.location.href = url;
  });

  function bindSuggestionClickEvents() {
    suggestionsList.querySelectorAll(".search-suggestion-item").forEach(item => {
      item.onclick = () => {
        searchInput.value = item.dataset.val;
        searchForm.dispatchEvent(new Event("submit"));
      };
    });
  }

  function setActiveSuggestion(items) {
    if (!items || !items.length) return;
    items.forEach(item => item.classList.remove("is-selected"));
    if (currentFocus >= items.length) currentFocus = 0;
    if (currentFocus < 0) currentFocus = items.length - 1;
    items[currentFocus].classList.add("is-selected");
  }

  searchInput.addEventListener("keydown", function(e) {
    if (e.altKey && e.key >= '1' && e.key <= '4') {
      e.preventDefault();
      const engines = ['google'];
      if(DB.settings.search && DB.settings.search.customEngines) {
         engines.push(...DB.settings.search.customEngines.map(x => x.id));
      }
      const idx = parseInt(e.key) - 1;
      if (engines[idx]) setSearchEngine(engines[idx]);
      return;
    }

    const items = suggestionsList.querySelectorAll(".search-suggestion-item");
    if (!suggestionsBox.classList.contains("is-open") || items.length === 0) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      currentFocus++;
      setActiveSuggestion(items);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      currentFocus--;
      setActiveSuggestion(items);
    } else if (e.key === "Enter") {
      if (currentFocus > -1) {
        e.preventDefault();
        searchInput.value = items[currentFocus].dataset.val;
        searchForm.dispatchEvent(new Event("submit"));
      }
    }
  });

  searchInput.addEventListener("focus", () => {
    const q = searchInput.value.trim();
    if (q) suggestionsBox.classList.add("is-open");
  });

  searchInput.addEventListener("input", (e) => {
    const q = e.target.value.trim();
    clearTimeout(suggestDebounce);
    currentFocus = -1; 
    
    if (!q) {
      suggestionsBox.classList.remove("is-open");
      suggestionsList.innerHTML = "";
      return;
    }
    
    suggestionsBox.classList.add("is-open");
    suggestDebounce = setTimeout(async () => {
      try {
        const res = await fetch(`https://suggestqueries.google.com/complete/search?client=chrome&q=${encodeURIComponent(q)}`);
        const data = await res.json();
        const webSuggestions = (data && data[1]) || [];
        
        const webHtml = webSuggestions.slice(0, 5).map(s => `
          <div class="search-suggestion-item" data-val="${escapeHtml(s)}">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" style="opacity:0.6;"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <span>${escapeHtml(s)}</span>
          </div>
        `).join("");

        suggestionsList.innerHTML = webHtml;
        if (webHtml) bindSuggestionClickEvents();
      } catch {
        suggestionsList.innerHTML = "";
      }
    }, 150);
  });
  
  document.addEventListener("click", (e) => {
    if (!searchForm.contains(e.target)) {
      suggestionsBox.classList.remove("is-open");
    }
  });
}

/* ============================================================
   18. Init
   ============================================================ */
async function init() {
  await loadDB();
  applyAppearance();
  applyFont();
  applyWallpaper();
  applyWidgetsVisibility();
  renderPageTabs();
  renderBoards();
  renderFloatingWidgets();
  renderSearchEngineButtons();
  updateClock();
  if (DB.widgetsVisible.weather) fetchWeather();

  initToolbar();
  initColorPicker();
  initSettingsWiring();
  initWallpaperStyleWiring();
  initTourWiring();
  initGlobalPopoverClosers();

  let resizeTimer = null;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(renderBoards, 150);
  });

  await checkPendingQuickSave();

  if (!DB.tourDone) startTour();
}

document.addEventListener("DOMContentLoaded", init);