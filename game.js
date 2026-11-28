(() => {
  const canvas = document.getElementById("game");
  const ctx = canvas.getContext("2d");
  ctx.imageSmoothingEnabled = false;

  const W = 640;
  const H = 360;
  const GROUND_MIN_Y = 232;
  const GROUND_MAX_Y = 312;

  const keys = {};
  const justPressed = {};

  const STATE = {
    TITLE: "TITLE",
    WORLD_MAP: "WORLD_MAP",
    AIRPORT_INTRO: "AIRPORT_INTRO",
    PLAYING: "PLAYING",
    RELOAD_CUTSCENE: "RELOAD_CUTSCENE",
    BOSS_MUTATE: "BOSS_MUTATE",
    PAUSED: "PAUSED",
    STAGE_CLEAR: "STAGE_CLEAR",
    VICTORY: "VICTORY",
    GAME_OVER: "GAME_OVER",
  };

  let gameState = STATE.TITLE;
  let currentStage = 1; // 1: Harbour, 2: Restroom, 3: Bio-Lab F1, 4: Bio-Lab B1 (Gas), 5: Bio-Lab F3 (Dr. Genex)
  let selectedChar = "mustache"; // "mustache" | "samurai" | "momo" | "raven" | "shaka" | "alice" | "ironfist" | "nightheron" | "magic" | "ling" | "rose"
  let selectedIsland = 0; // 0 = Jersey Harbour, 1 = Bio-Island Lab, 2 = Taiwan Island, 3 = Japan Archipelago
  let worldMapView = "world"; // "world" | "taiwan" | "japan"
  let selectedRegionNode = 0;
  let mapCameraY = 0;

  const TAIWAN_MAP_NODES = [
    { num: "01", name: "台北 101", stage: 101, x: 204, y: 52, hit: [120, 8, 294, 92] },
    { num: "02", name: "九份老街", stage: 102, x: 540, y: 66, hit: [446, 10, 632, 114] },
    { num: "03", name: "日月潭", stage: 103, x: 112, y: 120, hit: [14, 72, 212, 166] },
    { num: "04", name: "阿里山森林鐵路", stage: 104, x: 524, y: 196, hit: [418, 128, 632, 260] },
    { num: "05", name: "安平古堡", stage: 105, x: 102, y: 215, hit: [8, 166, 200, 260] },
    { num: "06", name: "高雄港", stage: 106, x: 108, y: 310, hit: [8, 262, 204, 354] },
    { num: "07", name: "大稻埕・城隍廟", stage: 107, x: 378, y: 56, hit: [338, 26, 424, 88] },
  ];

  const JAPAN_MAP_NODES = [
    { num: "01", name: "淺草雷門", stage: 201, x: 548, y: 204, hit: [478, 146, 628, 256] },
    { num: "02", name: "晴空塔與隅田川", stage: 202, x: 528, y: 88, hit: [452, 24, 600, 144] },
    { num: "03", name: "富士山與河口湖", stage: 203, x: 392, y: 230, hit: [314, 152, 470, 278] },
    { num: "04", name: "伏見稻荷", stage: 204, x: 256, y: 142, hit: [190, 68, 326, 186] },
    { num: "05", name: "大阪道頓堀", stage: 205, x: 218, y: 256, hit: [144, 194, 306, 326] },
    { num: "06", name: "宮島海上大鳥居", stage: 206, x: 68, y: 214, hit: [10, 146, 140, 286] },
  ];
  let tick = 0;
  let cameraX = 0;
  let stageWidth = 1800;
  let shakeTime = 0;
  let shakeMag = 0;
  let hitstop = 0;
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
  let maxCombo = 0;
  let displayHp = 100;
  let stageStartTick = 0;
  let stageDamageTaken = 0;
  let stageBrisketsEaten = 0;
  let bossWarningTimer = 0;
  let bossWarningName = "";
  let koSlowMoTimer = 0;
  let koFlashTimer = 0;
  let justDodgeFlashTimer = 0;
  let ambientParticles = [];
  let seaSelectedCountry = 0; // 0: MY, 1: SG, 2: TH, 3: VN
  let titlePreviewMode = 1; // 0: J Attack, 1: K Skill (highlighted cyan), 2: R Ultimate
  let stageClearSummary = null;
  let reloadCutsceneTimer = 0;
  let bossMutateTimer = 0;
  let bossMutateTitle = "";
  let bossMutateSub = "";
  let toxicTimer = 0;
  let brisketEatenCount = 0;
  let stageClearTimer = 0;
  let goArrowTimer = 0;
  let unlockedUltLevel = 0; // 0 = Base, 1 = Unlocked, 2 = Mastered (inherited across Bio-Island!)
  let unlockBannerTimer = 0;
  let unlockBannerTitle = "";
  let unlockBannerSub = "";

  // Persistent Stage Clear & Rank Save Data (localStorage)
  const PROGRESS_KEY = "protocol_progress_v1";
  let stageProgress = {};
  try {
    const raw = localStorage.getItem(PROGRESS_KEY);
    if (raw) stageProgress = JSON.parse(raw) || {};
  } catch (_) {
    stageProgress = {};
  }
  const RANK_ORDER = { C: 1, B: 2, A: 3, S: 4 };
  function saveStageProgress(stageId, stageScore, rank, bestComboVal) {
    const key = String(stageId);
    const prev = stageProgress[key] || { cleared: false, bestScore: 0, bestRank: "C", bestCombo: 0 };
    const nextRank = (RANK_ORDER[rank] || 0) >= (RANK_ORDER[prev.bestRank] || 0) ? rank : prev.bestRank;
    stageProgress[key] = {
      cleared: true,
      bestScore: Math.max(prev.bestScore || 0, stageScore),
      bestRank: nextRank,
      bestCombo: Math.max(prev.bestCombo || 0, bestComboVal),
    };
    try {
      localStorage.setItem(PROGRESS_KEY, JSON.stringify(stageProgress));
    } catch (_) {}
  }
  function getStageRecord(stageId) {
    return stageProgress[String(stageId)] || null;
  }

  let player = null;
  let enemies = [];
  let smokers = [];
  let pickups = [];
  let particles = [];
  let floatingTexts = [];
  let slashEffects = [];
  let swordWaves = [];
  let skillEffects = [];
  let enemyProjectiles = [];
  let waves = [];
  let activeWaveIndex = 0;
  let cameraLocked = false;
  let cameraLockX = 0;

  // --- Input ---
  window.addEventListener("keydown", (e) => {
    const code = e.code;
    if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Space"].includes(code)) {
      e.preventDefault();
    }
    if (!keys[code]) {
      justPressed[code] = true;
    }
    keys[code] = true;

    if (code === "KeyM") {
      toggleSfxButton();
    }
    if (code === "KeyP" && (gameState === STATE.PLAYING || gameState === STATE.PAUSED)) {
      gameState = gameState === STATE.PLAYING ? STATE.PAUSED : STATE.PLAYING;
    }
    if (gameState === STATE.TITLE && (code === "ArrowLeft" || code === "KeyA" || code === "ArrowRight" || code === "KeyD")) {
      const order = ["mustache", "samurai", "momo", "raven", "shaka", "alice", "ironfist", "nightheron", "magic", "ling", "rose", "fallen"];
      const idx = order.indexOf(selectedChar);
      const dir = (code === "ArrowRight" || code === "KeyD") ? 1 : -1;
      selectedChar = order[(idx + dir + order.length) % order.length];
      syncCharButtons();
      if (player) player.charId = selectedChar;
      window.sound.init();
      window.sound.playTone(selectedChar === "fallen" ? 1480 : selectedChar === "rose" ? 1350 : selectedChar === "ling" ? 1108 : selectedChar === "magic" ? 1244 : selectedChar === "nightheron" ? 987 : selectedChar === "ironfist" ? 440 : selectedChar === "alice" ? 1397 : selectedChar === "shaka" ? 1318 : selectedChar === "raven" ? 1175 : selectedChar === "momo" ? 1046 : selectedChar === "samurai" ? 880 : 520, 0.06, "triangle", 0.08);
    }
    if (gameState === STATE.WORLD_MAP) {
      if (worldMapView === "sea") {
        if (code === "Escape" || code === "Backspace") {
          worldMapView = "world";
          window.sound.init();
          window.sound.playTone(440, 0.06, "triangle", 0.08);
        } else if (code === "ArrowRight" || code === "KeyD") {
          seaSelectedCountry = (seaSelectedCountry + 1) % 4;
          window.sound.init();
          window.sound.playTone(784, 0.06, "triangle", 0.08);
        } else if (code === "ArrowLeft" || code === "KeyA") {
          seaSelectedCountry = (seaSelectedCountry + 3) % 4;
          window.sound.init();
          window.sound.playTone(660, 0.06, "triangle", 0.08);
        }
      } else if (worldMapView === "taiwan" || worldMapView === "japan") {
        const nodes = worldMapView === "taiwan" ? TAIWAN_MAP_NODES : JAPAN_MAP_NODES;
        if (code === "Escape" || code === "Backspace") {
          worldMapView = "world";
          window.sound.init();
          window.sound.playTone(440, 0.06, "triangle", 0.08);
        } else if (code === "ArrowRight" || code === "KeyD" || code === "ArrowDown" || code === "KeyS") {
          selectedRegionNode = (selectedRegionNode + 1) % nodes.length;
          window.sound.init();
          window.sound.playTone(784, 0.06, "triangle", 0.08);
        } else if (code === "ArrowLeft" || code === "KeyA" || code === "ArrowUp" || code === "KeyW") {
          selectedRegionNode = (selectedRegionNode - 1 + nodes.length) % nodes.length;
          window.sound.init();
          window.sound.playTone(660, 0.06, "triangle", 0.08);
        }
      } else {
        if (code === "ArrowDown" || code === "KeyS") {
          if (selectedIsland === 0 || selectedIsland === 1) selectedIsland = selectedIsland === 1 ? 3 : 2;
          else selectedIsland = 4; // Pan camera DOWN to Row 3: Southeast Asia 4 Countries!
          window.sound.init();
          window.sound.playTone(selectedIsland === 4 ? 987 : 784, 0.07, "triangle", 0.09);
        } else if (code === "ArrowUp" || code === "KeyW") {
          if (selectedIsland === 4) selectedIsland = 2;
          else if (selectedIsland === 2) selectedIsland = 0;
          else if (selectedIsland === 3) selectedIsland = 1;
          window.sound.init();
          window.sound.playTone(520, 0.07, "triangle", 0.09);
        } else if (code === "ArrowLeft" || code === "KeyA" || code === "ArrowRight" || code === "KeyD") {
          const order = [0, 1, 2, 3, 4]; // Island 1 -> Bio-Island -> Taiwan -> Japan -> Southeast Asia
          const idx = order.indexOf(selectedIsland);
          const dir = (code === "ArrowRight" || code === "KeyD") ? 1 : -1;
          selectedIsland = order[(idx + dir + order.length) % order.length];
          window.sound.init();
          window.sound.playTone(selectedIsland === 4 ? 987 : selectedIsland === 3 ? 880 : selectedIsland === 2 ? 784 : selectedIsland === 1 ? 660 : 440, 0.07, "triangle", 0.09);
        }
      }
    }
    if ((code === "Enter" || code === "Space") && gameState === STATE.WORLD_MAP) {
      window.sound.init();
      window.sound.startBgm();
      if (worldMapView === "taiwan") {
        startStage(TAIWAN_MAP_NODES[selectedRegionNode].stage);
      } else if (worldMapView === "japan") {
        startStage(JAPAN_MAP_NODES[selectedRegionNode].stage);
      } else if (worldMapView === "sea") {
        const baseIds = [301, 401, 501, 601];
        startStage(baseIds[seaSelectedCountry] || 301);
      } else if (selectedIsland === 4) {
        worldMapView = "sea";
      } else if (selectedIsland === 2) {
        worldMapView = "taiwan";
        selectedRegionNode = 0;
      } else if (selectedIsland === 3) {
        worldMapView = "japan";
        selectedRegionNode = 0;
      } else {
        startStage(selectedIsland === 0 ? 1 : 3);
      }
    }
    if ((code === "Enter" || code === "Space") && gameState === STATE.TITLE) {
      window.sound.init();
      window.sound.startBgm();
      openWorldMap();
    }
    if (code === "Enter" && (gameState === STATE.GAME_OVER || gameState === STATE.VICTORY)) {
      score = 0;
      unlockedUltLevel = 0;
      startStage(1);
    }
  });

  window.addEventListener("keyup", (e) => {
    keys[e.code] = false;
  });

  canvas.addEventListener("click", (e) => {
    window.sound.init();
    if (gameState === STATE.TITLE) {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      const order = ["mustache", "samurai", "momo", "raven", "shaka", "alice", "ironfist", "nightheron", "magic", "ling", "rose", "fallen"];
      const idx = order.indexOf(selectedChar);
      const toneMap = { mustache: 520, samurai: 880, momo: 1046, raven: 1175, shaka: 1318, alice: 1397, ironfist: 440, nightheron: 987, magic: 1244, ling: 1108, rose: 1350, fallen: 1480 };

      // Bottom Left arrow button (◀) -> previous fighter (aligned to bespoke Select art)
      if (cx >= 4 && cx <= 40 && cy >= 286 && cy <= 354) {
        selectedChar = order[(idx - 1 + order.length) % order.length];
        syncCharButtons();
        if (player) player.charId = selectedChar;
        window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
        return;
      }
      // Bottom Right arrow button (▶) -> next fighter (aligned to bespoke Select art)
      if (cx >= 600 && cx <= 636 && cy >= 286 && cy <= 354) {
        selectedChar = order[(idx + 1) % order.length];
        syncCharButtons();
        if (player) player.charId = selectedChar;
        window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
        return;
      }
      // Bottom 12-Hero Portrait Strip click (y: 288..352, x: 40..600 aligned to painted 12-portrait bar)
      if (cy >= 288 && cy <= 352) {
        const startX = 40;
        const slotW = (600 - 40) / order.length;
        for (let i = 0; i < order.length; i++) {
          const sx = startX + i * slotW;
          if (cx >= sx && cx <= sx + slotW) {
            selectedChar = order[i];
            syncCharButtons();
            if (player) player.charId = selectedChar;
            window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
            return;
          }
        }
        return;
      }
      window.sound.startBgm();
      openWorldMap();
    } else if (gameState === STATE.WORLD_MAP) {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      if (worldMapView === "taiwan" || worldMapView === "japan" || worldMapView === "sea") {
        // Top-left Back to Global World Map button
        if (cx >= 8 && cx <= 126 && cy >= 6 && cy <= 34) {
          worldMapView = "world";
          window.sound.playTone(440, 0.06, "triangle", 0.08);
          return;
        }
        // Top-right quick switch Taiwan -> Japan -> SEA -> Taiwan
        if (cx >= 518 && cx <= 632 && cy >= 6 && cy <= 34) {
          worldMapView = worldMapView === "taiwan" ? "japan" : worldMapView === "japan" ? "sea" : "taiwan";
          selectedIsland = worldMapView === "taiwan" ? 2 : worldMapView === "japan" ? 3 : 2;
          selectedRegionNode = 0;
          window.sound.playTone(880, 0.07, "triangle", 0.09);
          return;
        }
        if (worldMapView === "sea") {
          // 4 Country Tabs (MY, SG, TH, VN)
          if (cy >= 44 && cy <= 74) {
            const tabW = (W - 24) / 4;
            const tabIdx = Math.max(0, Math.min(3, Math.floor((cx - 12) / tabW)));
            seaSelectedCountry = tabIdx;
            window.sound.playTone(660 + tabIdx * 90, 0.06, "triangle", 0.08);
            return;
          }
          // 2x3 Stage Grid
          const baseIds = [301, 401, 501, 601];
          const baseId = baseIds[seaSelectedCountry] || 301;
          for (let i = 0; i < 6; i++) {
            const col = i % 3;
            const row = Math.floor(i / 3);
            const sx = 18 + col * 204;
            const sy = 88 + row * 124;
            if (cx >= sx && cx <= sx + 194 && cy >= sy && cy <= sy + 112) {
              window.sound.startBgm();
              startStage(baseId + i);
              return;
            }
          }
          return;
        }
        // Check clicking any numbered landmark on the Taiwan or Japan full-screen map!
        const nodes = worldMapView === "taiwan" ? TAIWAN_MAP_NODES : JAPAN_MAP_NODES;
        for (let i = 0; i < nodes.length; i++) {
          const n = nodes[i];
          const [x1, y1, x2, y2] = n.hit;
          if (cx >= x1 && cx <= x2 && cy >= y1 && cy <= y2) {
            selectedRegionNode = i;
            window.sound.startBgm();
            startStage(n.stage);
            return;
          }
        }
        return;
      }
      // Top-right SEA Tour entry pill on Global World Map
      if (cx >= 488 && cx <= 632 && cy >= 6 && cy <= 36) {
        worldMapView = "sea";
        window.sound.playTone(987, 0.07, "triangle", 0.09);
        return;
      }
      if (cy >= 46 && cy <= 355) {
        if (cy >= 286) {
          // 5 Bottom cards: First click selects & smoothly pans camera; clicking active card deploys / opens region map!
          const clicked = Math.min(4, Math.max(0, Math.floor((cx / W) * 5)));
          if (selectedIsland !== clicked) {
            selectedIsland = clicked;
            window.sound.playTone(clicked === 4 ? 987 : clicked === 3 ? 880 : clicked === 2 ? 784 : clicked === 1 ? 660 : 440, 0.07, "triangle", 0.09);
            return;
          }
          if (clicked === 2) {
            worldMapView = "taiwan";
            selectedRegionNode = 0;
            window.sound.playTone(880, 0.07, "triangle", 0.09);
            return;
          }
          if (clicked === 3) {
            worldMapView = "japan";
            selectedRegionNode = 0;
            window.sound.playTone(987, 0.07, "triangle", 0.09);
            return;
          }
          if (clicked === 4) {
            worldMapView = "sea";
            window.sound.playTone(1046, 0.07, "triangle", 0.09);
            return;
          }
          window.sound.startBgm();
          startStage(clicked === 0 ? 1 : 3);
        } else if (mapCameraY > 510) {
          // Currently panned down to Row 3 (Southeast Asia 4-Country Archipelago)!
          // Upper-Left = Thailand (2), Upper-Right = Vietnam (3), Lower-Left = Malaysia (0), Lower-Right = Singapore (1)
          const isUpper = cy < 168;
          const isLeft = cx < W * 0.5;
          seaSelectedCountry = isUpper ? (isLeft ? 2 : 3) : (isLeft ? 0 : 1);
          selectedIsland = 4;
          worldMapView = "sea";
          window.sound.playTone(987, 0.07, "triangle", 0.09);
        } else if (mapCameraY > 180) {
          // Currently panned to Row 2 -> Left half opens Full Taiwan Map, Right half opens Full Japan Map!
          const target = cx < W * 0.5 ? 2 : 3;
          selectedIsland = target;
          worldMapView = target === 2 ? "taiwan" : "japan";
          selectedRegionNode = 0;
          window.sound.playTone(target === 3 ? 987 : 880, 0.07, "triangle", 0.09);
        } else if (cx < W * 0.5) {
          selectedIsland = 0;
          window.sound.startBgm();
          startStage(1);
        } else {
          selectedIsland = 1;
          window.sound.startBgm();
          startStage(3);
        }
      }
    } else if (gameState === STATE.STAGE_CLEAR && stageClearSummary && stageClearTimer <= 325) {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      // Right button: Return to World Map
      if (cx >= 332 && cx <= 496 && cy >= 248 && cy <= 286) {
        openWorldMap();
        return;
      }
      // Left button (or anywhere else on card): Advance to next stage
      stageClearTimer = 0;
    } else if (gameState === STATE.GAME_OVER || gameState === STATE.VICTORY) {
      score = 0;
      unlockedUltLevel = 0;
      startStage(1);
    }
  });

  // UI Buttons
  const btnCharMustache = document.getElementById("btn-char-mustache");
  const btnCharSamurai = document.getElementById("btn-char-samurai");
  const btnCharMomo = document.getElementById("btn-char-momo");
  const btnCharRaven = document.getElementById("btn-char-raven");
  const btnCharShaka = document.getElementById("btn-char-shaka");
  const btnCharAlice = document.getElementById("btn-char-alice");
  const btnCharIronfist = document.getElementById("btn-char-ironfist");
  const btnCharNightheron = document.getElementById("btn-char-nightheron");
  const btnCharMagic = document.getElementById("btn-char-magic");
  const btnCharLing = document.getElementById("btn-char-ling");
  const btnCharRose = document.getElementById("btn-char-rose");
  const btnCharFallen = document.getElementById("btn-char-fallen");
  const btnStage1 = document.getElementById("btn-stage-1");
  const btnStage2 = document.getElementById("btn-stage-2");
  const btnStageAirport = document.getElementById("btn-stage-airport");
  const btnStageDadaocheng = document.getElementById("btn-stage-dadaocheng");
  const btnStageTrain = document.getElementById("btn-stage-train");
  const wtStageBtns = Array.from(document.querySelectorAll(".wt-stage-btn"));
  const btnMap = document.getElementById("btn-map");
  const btnMute = document.getElementById("btn-mute");
  const btnBgm = document.getElementById("btn-bgm");
  const btnShader = document.getElementById("btn-shader");
  const btnFullscreen = document.getElementById("btn-fullscreen");
  if (btnShader && window.shaderFX) {
    btnShader.textContent = window.shaderFX.getLabel();
    btnShader.addEventListener("click", () => {
      window.shaderFX.cycleMode();
      btnShader.textContent = window.shaderFX.getLabel();
      window.sound.init();
      window.sound.playTone(880, 0.06, "triangle", 0.08);
    });
  }
  const btnDevDrawer = document.getElementById("btn-dev-drawer");
  const devDrawer = document.getElementById("dev-drawer");
  const btnHelpModal = document.getElementById("btn-help-modal");
  const helpModal = document.getElementById("help-modal");
  const btnHelpClose = document.getElementById("btn-help-close");

  function syncHelpMoveList() {
    const atkEl = document.getElementById("help-atk-desc");
    const skillEl = document.getElementById("help-skill-desc");
    const ultEl = document.getElementById("help-ult-desc");
    if (!atkEl || !skillEl || !ultEl) return;
    const moves = {
      mustache: ["重拳三連擊", "《重裝震地槌》360° 擊飛解圍（3.0s）", "《手臂上膛》爆氣連擊（Lv.1～3 強化）"],
      samurai: ["武士刀居合三連斬", "《殘影瞬步・居合》無敵穿怪斬（2.5s）", "《劍氣亂舞》Lv.3 解鎖雙刀交叉突進"],
      momo: ["《防狼噴霧》中距控場長硬直", "《血蝠瞬閃》無敵位移留霧（3.0s）", "《吸血鬼覺醒》長爪吸血＋血爪波"],
      raven: ["《影刃・飛刀連擊》第3段毒飛刀", "《煙霧鉤爪》鉤中背刺／落空影遁（2.8s）", "《日蝕雙槍》Lv.3 日蝕槍鬥術＋交叉處決"],
      shaka: ["《靈臂延伸・三連掌》超長距聚敵", "《千手束縛・金剛鎖》1.5秒定身（3.2s）", "《千手觀音・萬臂群控》Lv.3 金光天墜"],
      alice: ["《黃銅指虎・薔薇連打》第3段破甲重轟", "《言靈指令：「跪下！」》2.5秒破甲支配（3.0s）", "《絕對契約・言靈領域》自動破甲＋彈指臣服"],
      ironfist: ["《鐵拳三段・半拍假動作》第3段突進白光重拳", "《繃帶緊束・鐵山靠》霸體衝撞撞飛（2.8s）", "《末班起飛・崩山轟拳》Lv.3 召喚夜鷺合體爆裂"],
      nightheron: ["《插袋連踢・雨幕三連》第3段水花月牙低掃", "《鞋跟輕叩・雨燕迴避踢》無敵滑步反踢（2.5s）", "《末班起飛・雨夜天翔》雙水刃＋Lv.3 高空斜踢"],
      magic: ["《紫焰咒術・王冠骷髏連擊》第3段喚出黑暗騎士重劈", "《能量・牽引陣》無敵影步＋聚怪禁錮爆裂（3.0s）", "《暗徵召喚・暗影女皇降臨》雙骷髏＋Lv.3 紫光洪流"],
      ling: ["《三聖輪轉・靈印連召》白虎撲擊→青龍貫穿→朱雀爆燃", "《北方・玄武鎮海印》無敵水盾＋360°震退＋回血4HP（3.0s）", "《四象靈契・聖獸降臨》龍虎雷柱＋Lv.3 四聖獸齊衝"],
      rose: ["《烈焰火拳・三段連轟》燃炎直拳→熾焰勾拳→爆炎重轟", "《精神支配・意識侵入》桃紅腦波定身2秒＋火拳暴擊（3.0s）", "《群體暗示・三階煉獄火拳》燃炎→爆炎→Lv.3 巨型煉獄拳"],
    };
    const [a, s, u] = moves[selectedChar] || moves.mustache;
    atkEl.textContent = a;
    skillEl.textContent = s;
    ultEl.textContent = u;
  }

  function closeDevDrawer() {
    if (!devDrawer || !btnDevDrawer) return;
    devDrawer.classList.remove("open");
    devDrawer.setAttribute("aria-hidden", "true");
    btnDevDrawer.classList.remove("open");
  }

  function closeHelpModal() {
    if (!helpModal) return;
    helpModal.classList.remove("open");
    helpModal.setAttribute("aria-hidden", "true");
  }

  if (btnDevDrawer && devDrawer) {
    btnDevDrawer.addEventListener("click", (e) => {
      e.stopPropagation();
      const willOpen = !devDrawer.classList.contains("open");
      devDrawer.classList.toggle("open", willOpen);
      devDrawer.setAttribute("aria-hidden", String(!willOpen));
      btnDevDrawer.classList.toggle("open", willOpen);
    });
    document.addEventListener("click", (e) => {
      if (devDrawer.classList.contains("open") && !devDrawer.contains(e.target) && e.target !== btnDevDrawer) {
        closeDevDrawer();
      }
    });
  }

  if (btnHelpModal && helpModal) {
    btnHelpModal.addEventListener("click", () => {
      closeDevDrawer();
      syncHelpMoveList();
      helpModal.classList.add("open");
      helpModal.setAttribute("aria-hidden", "false");
    });
    if (btnHelpClose) btnHelpClose.addEventListener("click", closeHelpModal);
    helpModal.addEventListener("click", (e) => {
      if (e.target === helpModal) closeHelpModal();
    });
  }

  window.addEventListener("keydown", (e) => {
    if (e.code === "Escape") {
      closeDevDrawer();
      closeHelpModal();
      if (document.body.classList.contains("is-fullscreen") && !document.fullscreenElement) {
        document.body.classList.remove("is-fullscreen");
        if (btnFullscreen) btnFullscreen.textContent = "⛶ 全螢幕";
      }
    }
  });

  // Fullscreen Toggle (Native Fullscreen API on Android/Desktop + Edge-to-Edge fallback on iOS Safari)
  function syncFullscreenButton() {
    if (!btnFullscreen) return;
    const active = !!document.fullscreenElement || !!document.webkitFullscreenElement || document.body.classList.contains("is-fullscreen");
    btnFullscreen.textContent = active ? "✕ 離開全螢幕" : "⛶ 全螢幕";
    btnFullscreen.classList.toggle("active", active);
  }

  if (btnFullscreen) {
    btnFullscreen.addEventListener("click", async () => {
      const root = document.documentElement;
      const inNativeFs = !!document.fullscreenElement || !!document.webkitFullscreenElement;
      if (inNativeFs) {
        try {
          if (document.exitFullscreen) await document.exitFullscreen();
          else if (document.webkitExitFullscreen) document.webkitExitFullscreen();
        } catch (_) {}
        document.body.classList.remove("is-fullscreen");
      } else if (document.body.classList.contains("is-fullscreen")) {
        document.body.classList.remove("is-fullscreen");
      } else {
        document.body.classList.add("is-fullscreen");
        try {
          if (root.requestFullscreen) await root.requestFullscreen();
          else if (root.webkitRequestFullscreen) root.webkitRequestFullscreen();
        } catch (_) {
          // iOS Safari fallback: edge-to-edge CSS fullscreen + scroll nudge
          window.scrollTo(0, 1);
        }
      }
      syncFullscreenButton();
    });
    document.addEventListener("fullscreenchange", () => {
      if (!document.fullscreenElement) document.body.classList.remove("is-fullscreen");
      syncFullscreenButton();
    });
    document.addEventListener("webkitfullscreenchange", () => {
      if (!document.webkitFullscreenElement) document.body.classList.remove("is-fullscreen");
      syncFullscreenButton();
    });
    window.addEventListener("orientationchange", () => {
      setTimeout(() => window.scrollTo(0, 1), 150);
    });
  }

  function syncCharButtons() {
    btnCharMustache.classList.toggle("active", selectedChar === "mustache");
    btnCharSamurai.classList.toggle("active", selectedChar === "samurai");
    if (btnCharMomo) btnCharMomo.classList.toggle("active", selectedChar === "momo");
    if (btnCharRaven) btnCharRaven.classList.toggle("active", selectedChar === "raven");
    if (btnCharShaka) btnCharShaka.classList.toggle("active", selectedChar === "shaka");
    if (btnCharAlice) btnCharAlice.classList.toggle("active", selectedChar === "alice");
    if (btnCharIronfist) btnCharIronfist.classList.toggle("active", selectedChar === "ironfist");
    if (btnCharNightheron) btnCharNightheron.classList.toggle("active", selectedChar === "nightheron");
    if (btnCharMagic) btnCharMagic.classList.toggle("active", selectedChar === "magic");
    if (btnCharLing) btnCharLing.classList.toggle("active", selectedChar === "ling");
    if (btnCharRose) btnCharRose.classList.toggle("active", selectedChar === "rose");
    if (btnCharFallen) btnCharFallen.classList.toggle("active", selectedChar === "fallen");
    document.body.classList.toggle("char-mustache", selectedChar === "mustache");
    document.body.classList.toggle("char-samurai", selectedChar === "samurai");
    document.body.classList.toggle("char-momo", selectedChar === "momo");
    document.body.classList.toggle("char-raven", selectedChar === "raven");
    document.body.classList.toggle("char-shaka", selectedChar === "shaka");
    document.body.classList.toggle("char-alice", selectedChar === "alice");
    document.body.classList.toggle("char-ironfist", selectedChar === "ironfist");
    document.body.classList.toggle("char-nightheron", selectedChar === "nightheron");
    document.body.classList.toggle("char-magic", selectedChar === "magic");
    document.body.classList.toggle("char-ling", selectedChar === "ling");
    document.body.classList.toggle("char-rose", selectedChar === "rose");
    document.body.classList.toggle("char-fallen", selectedChar === "fallen");
    const skillLabelEl = document.getElementById("tbtn-skill-label");
    if (skillLabelEl) {
      skillLabelEl.textContent =
        selectedChar === "fallen"
          ? "審判"
          : selectedChar === "rose"
          ? "支配"
          : selectedChar === "ling"
          ? "玄武"
          : selectedChar === "magic"
          ? "牽引"
          : selectedChar === "nightheron"
          ? "踏影"
          : selectedChar === "ironfist"
          ? "鐵壁"
          : selectedChar === "alice"
          ? "言靈"
          : selectedChar === "shaka"
          ? "金剛鎖"
          : selectedChar === "raven"
          ? "鉤爪"
          : selectedChar === "samurai"
          ? "瞬步"
          : selectedChar === "momo"
          ? "血蝠"
          : "震地";
    }
    syncHelpMoveList();
  }

  function selectCharacter(charId) {
    selectedChar = charId;
    syncCharButtons();
    if (player) {
      player.charId = charId;
      if (gameState === STATE.PLAYING) {
        showSpeech(
          charId === "rose"
            ? "蘿絲登場——先以精神支配鎖死意識，再用煉獄火拳燒成灰燼！"
            : charId === "ling"
            ? "四象召喚者・鈴登場！三聖輪轉結印，按 K 玄武護體回血！"
            : charId === "magic"
            ? "黑魔法師・瑪姬降臨！按 K 展開牽引陣，按 R 喚出暗影女皇！"
            : charId === "nightheron"
            ? "叩！夜鷺登場——雙手插袋，雨幕水刃踢！"
            : charId === "ironfist"
            ? "鐵拳上場！拉緊白繃帶，鐵山靠加崩山轟拳！"
            : charId === "alice"
            ? "愛麗絲登場！按 K 言靈破甲，黃銅指虎粉碎一切護甲！"
            : charId === "shaka"
            ? "釋迦降臨！靈臂延伸三連掌，按 R 開啟萬臂群控！"
            : charId === "raven"
            ? "暗影會 Raven 參戰！短刃飛刀就位，按 R 啟動日蝕雙槍！"
            : charId === "momo"
            ? "Momo 登場！防狼噴霧準備，按 R 變身吸血鬼！"
            : charId === "samurai"
            ? "街頭武士參上！按 R 劍氣亂舞！"
            : "Mustache Hero ready! Press R!",
          140
        );
      }
    }
  }

  btnCharMustache.addEventListener("click", () => {
    window.sound.init();
    selectCharacter("mustache");
  });

  btnCharSamurai.addEventListener("click", () => {
    window.sound.init();
    selectCharacter("samurai");
  });

  if (btnCharMomo) {
    btnCharMomo.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("momo");
    });
  }

  if (btnCharRaven) {
    btnCharRaven.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("raven");
    });
  }

  if (btnCharShaka) {
    btnCharShaka.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("shaka");
    });
  }

  if (btnCharAlice) {
    btnCharAlice.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("alice");
    });
  }

  if (btnCharIronfist) {
    btnCharIronfist.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("ironfist");
    });
  }

  if (btnCharNightheron) {
    btnCharNightheron.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("nightheron");
    });
  }

  if (btnCharMagic) {
    btnCharMagic.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("magic");
    });
  }

  if (btnCharLing) {
    btnCharLing.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("ling");
    });
  }

  if (btnCharRose) {
    btnCharRose.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("rose");
    });
  }

  if (btnCharFallen) {
    btnCharFallen.addEventListener("click", () => {
      window.sound.init();
      selectCharacter("fallen");
    });
  }

  function syncStageButtons() {
    btnStage1.classList.toggle("active", currentStage === 1 && gameState !== STATE.WORLD_MAP);
    btnStage2.classList.toggle("active", currentStage === 2 && gameState !== STATE.WORLD_MAP);
    if (btnStageAirport) btnStageAirport.classList.toggle("active", currentStage === 6 && gameState !== STATE.WORLD_MAP);
    if (btnStageDadaocheng) btnStageDadaocheng.classList.toggle("active", currentStage === 7 && gameState !== STATE.WORLD_MAP);
    if (btnStageTrain) btnStageTrain.classList.toggle("active", currentStage === 8 && gameState !== STATE.WORLD_MAP);
    for (const btn of wtStageBtns) {
      btn.classList.toggle("active", Number(btn.dataset.stageId) === currentStage && gameState !== STATE.WORLD_MAP);
    }
    if (btnMap) btnMap.classList.toggle("active", gameState === STATE.WORLD_MAP || (currentStage >= 3 && currentStage <= 5));
  }

  function openWorldMap() {
    gameState = STATE.WORLD_MAP;
    worldMapView = "world";
    selectedIsland = 0;
    selectedRegionNode = 0;
    mapCameraY = 0;
    window.sound.isBuff = false;
    syncStageButtons();
  }

  if (btnMap) {
    btnMap.addEventListener("click", () => {
      window.sound.init();
      window.sound.startBgm();
      closeDevDrawer();
      openWorldMap();
    });
  }

  function toggleSfxButton() {
    const on = window.sound.toggleSfx();
    btnMute.textContent = on ? "🔊 SFX" : "🔇 SFX";
  }

  btnStage1.addEventListener("click", () => {
    window.sound.init();
    window.sound.startBgm();
    closeDevDrawer();
    startStage(1);
  });

  btnStage2.addEventListener("click", () => {
    window.sound.init();
    window.sound.startBgm();
    closeDevDrawer();
    startStage(2);
  });

  if (btnStageAirport) {
    btnStageAirport.addEventListener("click", () => {
      window.sound.init();
      window.sound.startBgm();
      closeDevDrawer();
      startStage(6);
    });
  }

  if (btnStageDadaocheng) {
    btnStageDadaocheng.addEventListener("click", () => {
      window.sound.init();
      window.sound.startBgm();
      closeDevDrawer();
      startStage(7);
    });
  }

  if (btnStageTrain) {
    btnStageTrain.addEventListener("click", () => {
      window.sound.init();
      window.sound.startBgm();
      closeDevDrawer();
      startStage(8);
    });
  }

  for (const btn of wtStageBtns) {
    btn.addEventListener("click", () => {
      const sid = Number(btn.dataset.stageId);
      if (!sid) return;
      window.sound.init();
      window.sound.startBgm();
      closeDevDrawer();
      startStage(sid);
    });
  }

  btnMute.addEventListener("click", toggleSfxButton);
  btnBgm.addEventListener("click", () => {
    const on = window.sound.toggleBgm();
    btnBgm.textContent = on ? "🎵 BGM" : "🔇 BGM";
  });

  // --- Always-On Touch Controls (Virtual Joystick + Multi-Touch Action Buttons) ---
  let touchAtkHeld = false;
  const joyZone = document.getElementById("joy-zone");
  const joyBase = document.getElementById("joy-base");
  const joyDirArc = document.getElementById("joy-dir-arc");
  const joyKnob = document.getElementById("joy-knob");
  const tbtnAtk = document.getElementById("tbtn-atk");
  const tbtnJump = document.getElementById("tbtn-jump");
  const tbtnUlt = document.getElementById("tbtn-ult");
  const tbtnSkillMask = document.getElementById("tbtn-skill-mask");
  const tbtnSkillNum = document.getElementById("tbtn-skill-num");

  if (joyZone && joyKnob) {
    let joyPointerId = null;
    let originX = 0;
    let originY = 0;
    const maxRadius = 36;

    const resetJoy = () => {
      joyPointerId = null;
      joyZone.classList.remove("joy-active");
      if (joyBase) joyBase.style.transform = "translate(0px, 0px)";
      if (joyDirArc) joyDirArc.classList.remove("visible");
      joyKnob.style.transform = "translate(0px, 0px)";
      keys["ArrowLeft"] = false;
      keys["ArrowRight"] = false;
      keys["ArrowUp"] = false;
      keys["ArrowDown"] = false;
    };

    const updateJoy = (clientX, clientY) => {
      let dx = clientX - originX;
      let dy = clientY - originY;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
      if (joyDirArc) {
        if (dist > 9) {
          const deg = (Math.atan2(dy, dx) * 180) / Math.PI + 90;
          joyDirArc.style.transform = `rotate(${deg}deg)`;
          joyDirArc.classList.add("visible");
        } else {
          joyDirArc.classList.remove("visible");
        }
      }
      const dead = 10;
      keys["ArrowLeft"] = dx < -dead;
      keys["ArrowRight"] = dx > dead;
      keys["ArrowUp"] = dy < -dead;
      keys["ArrowDown"] = dy > dead;
    };

    joyZone.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      window.sound.init();
      window.sound.startBgm();
      joyPointerId = e.pointerId;
      joyZone.setPointerCapture(e.pointerId);
      joyZone.classList.add("joy-active");
      // MOBA-style floating joystick origin: subtly recenter base toward initial thumb touch
      const rect = joyZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const shiftX = Math.max(-18, Math.min(18, e.clientX - cx));
      const shiftY = Math.max(-18, Math.min(18, e.clientY - cy));
      originX = cx + shiftX;
      originY = cy + shiftY;
      if (joyBase) joyBase.style.transform = `translate(${shiftX}px, ${shiftY}px)`;
      updateJoy(e.clientX, e.clientY);
    });

    joyZone.addEventListener("pointermove", (e) => {
      if (e.pointerId !== joyPointerId) return;
      e.preventDefault();
      updateJoy(e.clientX, e.clientY);
    });

    joyZone.addEventListener("pointerup", (e) => {
      if (e.pointerId === joyPointerId) resetJoy();
    });
    joyZone.addEventListener("pointercancel", (e) => {
      if (e.pointerId === joyPointerId) resetJoy();
    });
  }

  function bindTouchAction(el, code, isAttack = false) {
    if (!el) return;
    el.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      window.sound.init();
      window.sound.startBgm();
      el.classList.add("pressed");
      justPressed[code] = true;
      keys[code] = true;
      if (isAttack) touchAtkHeld = true;
    });
    const release = (e) => {
      e.preventDefault();
      el.classList.remove("pressed");
      keys[code] = false;
      if (isAttack) touchAtkHeld = false;
    };
    el.addEventListener("pointerup", release);
    el.addEventListener("pointercancel", release);
    el.addEventListener("pointerleave", release);
  }

  bindTouchAction(tbtnAtk, "KeyJ", true);
  bindTouchAction(tbtnJump, "KeyK", false);
  bindTouchAction(tbtnUlt, "KeyR", false);

  // --- Entities ---
  function createPlayer() {
    return {
      charId: selectedChar,
      x: 110,
      y: 274,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: 1,
      hp: 100,
      maxHp: 100,
      reloadGauge: 100, // Start full so player can immediately experience Ultimate!
      buffTimer: 0,
      buffMax: 600, // 10 seconds of Buff Mode / Sword Aura
      attackTimer: 0,
      attackType: 0, // 0, 1, 2 combo
      attackHitDone: false,
      flurryHitsLeft: 0,
      flurryTimer: 0,
      autoSlashVisual: 0,
      dualDashTimer: 0,
      dualCrossBurstDone: false,
      ravenKataVisual: 0,
      ravenFinisherVisual: 0,
      shakaArrayVisual: 0,
      shakaFinisherVisual: 0,
      shakaBindHit: false,
      aliceDomainVisual: 0,
      aliceSnapVisual: 0,
      aliceCmdHit: false,
      ifFinisherVisual: 0,
      ifRocketTimer: 0,
      nhFinisherVisual: 0,
      magicFinisherVisual: 0,
      lingFinisherVisual: 0,
      roseFinisherVisual: 0,
      fallenFinisherVisual: 0,
      skillCd: 0,
      skillMaxCd: 180,
      skillType: null,
      skillActiveTimer: 0,
      skillImpactDone: false,
      skillStartX: 0,
      skillStartY: 0,
      skillDirX: 1,
      skillDirY: 0,
      hurtTimer: 0,
      invulnTimer: 0,
      eatTimer: 0,
      speechText: "",
      speechTimer: 0,
      walkFrame: 0,
    };
  }

  function isSamurai() {
    return player && player.charId === "samurai";
  }

  function isMomo() {
    return player && player.charId === "momo";
  }

  function isRaven() {
    return player && player.charId === "raven";
  }

  function isShaka() {
    return player && player.charId === "shaka";
  }

  function isAlice() {
    return player && player.charId === "alice";
  }

  function isIronFistHero() {
    return player && player.charId === "ironfist";
  }

  function isNightHeronHero() {
    return player && player.charId === "nightheron";
  }

  function isMagic() {
    return player && player.charId === "magic";
  }

  function isLing() {
    return player && player.charId === "ling";
  }

  function isRose() {
    return player && player.charId === "rose";
  }

  function isFallen() {
    return player && player.charId === "fallen";
  }

  // Unified Remote Targeted AoE VFX Engine (Supports 5 Exclusive 1x4 Hero Strips: Sky-Drop & Ground-Erupt!)
  const REMOTE_AOE_STYLES = {
    fallen: { sigil: "vfx_fallen_sigil", strike: "vfx_fallen_skull", pillar: "vfx_fallen_pillar", burst: "vfx_fallen_burst", motion: "drop", color: "#e9d5ff", label: "審判" },
    shaka: { sigil: "vfx_shaka_sigil", strike: "vfx_shaka_strike", pillar: "vfx_shaka_pillar", burst: "vfx_shaka_burst", motion: "drop", color: "#fde047", label: "如來掌" },
    magic: { sigil: "vfx_magic_sigil", strike: "vfx_magic_strike", pillar: "vfx_magic_pillar", burst: "vfx_magic_burst", motion: "erupt", color: "#c084fc", label: "深淵爪" },
    rose: { sigil: "vfx_rose_sigil", strike: "vfx_rose_strike", pillar: "vfx_rose_pillar", burst: "vfx_rose_burst", motion: "erupt", color: "#fb923c", label: "煉獄焰" },
    ling: { sigil: "vfx_ling_sigil", strike: "vfx_ling_strike", pillar: "vfx_ling_pillar", burst: "vfx_ling_burst", motion: "drop", color: "#2dd4bf", label: "四象雷" },
  };

  function spawnRemoteAoe(style, tx, ty, dmg = 26, delay = 0, radius = 84) {
    skillEffects.push({
      type: "sky_drop_skull",
      style: REMOTE_AOE_STYLES[style] ? style : "fallen",
      x: tx,
      y: Math.max(GROUND_MIN_Y, Math.min(GROUND_MAX_Y, ty)),
      dmg,
      delay,
      radius,
      impacted: false,
      life: 44 + delay,
      maxLife: 44,
    });
  }

  function triggerRemoteAoe(style, maxTargets = 3, dmg = 24, radius = 86) {
    const live = enemies
      .filter((e) => !e.dead && e.x >= cameraX - 24 && e.x <= cameraX + W + 24)
      .sort((a, b) => Math.abs(b.x - player.x) - Math.abs(a.x - player.x));
    const targets = live.slice(0, maxTargets);
    if (targets.length === 0) {
      spawnRemoteAoe(style, player.x + player.facing * 150, player.y, dmg, 0, radius);
      return;
    }
    targets.forEach((e, idx) => {
      spawnRemoteAoe(style, e.x, e.y, dmg, idx * 7, radius);
    });
  }

  function triggerRemoteAoeStorm(style, count = 6, dmg = 34, radius = 92) {
    const live = enemies.filter((e) => !e.dead && e.x >= cameraX - 24 && e.x <= cameraX + W + 24);
    for (let d = 0; d < count; d++) {
      const tgt = live.length > 0 ? live[d % live.length] : null;
      const tx = tgt
        ? tgt.x + (d >= live.length ? (Math.random() - 0.5) * 72 : 0)
        : cameraX + 90 + ((d * 82) % (W - 140));
      const ty = tgt ? tgt.y : GROUND_MIN_Y + 14 + (d % 3) * 24;
      spawnRemoteAoe(style, tx, ty, dmg, d * 6, radius);
    }
  }

  function spawnFallenSkyDrop(tx, ty, dmg = 26, delay = 0, radius = 84) {
    spawnRemoteAoe("fallen", tx, ty, dmg, delay, radius);
  }

  function triggerFallenRemoteJudgment(maxTargets = 3, dmg = 26, radius = 86) {
    triggerRemoteAoe("fallen", maxTargets, dmg, radius);
  }

  function hasSamuraiDualMode() {
    return isSamurai() && unlockedUltLevel >= 3;
  }

  function createEnemy(type, x, y, customName = null) {
    const isBoss = type === "boss";
    const isGenex = type === "genex_boss";
    const isIronFist = type === "boss_ironfist";
    const isNightHeron = type === "boss_nightheron";
    const is89Boss = type === "boss_89_king";
    const is89Knife = type === "thug_knife";
    const is89Bat = type === "thug_bat";
    const isTrainTicket = type === "train_ticket";
    const isTrainPorter = type === "train_porter";
    const isTrainBoss = type === "boss_train_mechanic";
    const isWtScout = type === "wt_scout";
    const isWtGuard = type === "wt_guard";
    const isWtBoss = type === "wt_boss";
    const wtStage = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
    const isMiniBoss = type === "miniboss";
    const isHeavy = type === "heavy";
    const isDog = type === "mutant_dog";
    const isBrute = type === "mutant_brute";
    const isSkull = type === "skull_human";

    const miniBossNames = {
      1: "MINI-BOSS: HARBOUR CAPTAIN",
      2: "MINI-BOSS: VIP SECURITY CHIEF",
      3: "MINI-BOSS: ALPHA CLONE MUTANT",
      4: "MINI-BOSS: TOXIC ABOMINATION",
      5: "MINI-BOSS: BIO-LAB WARDEN",
      7: "MINI-BOSS: 迪化街球棒堂主",
    };

    const baseHp = is89Boss
      ? 340
      : isTrainBoss || isWtBoss
      ? 360
      : isIronFist
      ? 260
      : isNightHeron
      ? 240
      : isGenex
      ? 260
      : isBoss
      ? 320
      : isMiniBoss
      ? 175 + currentStage * 18
      : isTrainPorter || isWtGuard
      ? 86
      : isBrute
      ? 78
      : is89Bat
      ? 68
      : isHeavy
      ? 72
      : isTrainTicket || isWtScout
      ? 52
      : is89Knife
      ? 48
      : isSkull
      ? 52
      : isDog
      ? 38
      : 40;
    // Stage Difficulty Boost: All enemies 2.0x HP + Extra Defense on Mini-Boss (35%) & Main Boss (45%)!
    const hp = Math.round(baseHp * 2.0);
    const isMainBoss = isBoss || isGenex || isIronFist || isNightHeron || is89Boss || isTrainBoss || isWtBoss;
    const defense = isMainBoss ? 0.45 : isMiniBoss ? 0.35 : 0;

    return {
      type,
      name:
        customName ||
        (isWtBoss && wtStage
          ? wtStage.enemies.boss.name
          : isWtGuard && wtStage
          ? wtStage.enemies.guard.name
          : isWtScout && wtStage
          ? wtStage.enemies.scout.name
          : isTrainBoss
          ? "山線特快 BOSS — 緩衝拳機兵"
          : is89Boss
          ? "大稻埕角頭老大 — 平頭刺青 8+9 BOSS"
          : isIronFist
          ? "短髮・鐵拳 (IRON FIST)"
          : isNightHeron
          ? "長髮・夜鷺 (NIGHT HERON)"
          : isGenex
          ? "DR. GENEX — PHASE 1: 巨臂怪力者"
          : isBoss
          ? "THE SYNDICATE ENFORCER"
          : isMiniBoss
          ? miniBossNames[currentStage] || "MINI-BOSS"
          : isTrainTicket
          ? "剪票快手"
          : isTrainPorter
          ? "行李扛夫"
          : is89Knife
          ? "8+9 小刀混混"
          : is89Bat
          ? "8+9 球棒打手"
          : isDog
          ? "MUTANT HOUND"
          : isBrute
          ? "MUTANT BRUTE"
          : isSkull
          ? "SKULL HUMAN"
          : isHeavy
          ? "HEAVY AGENT"
          : "SUIT AGENT"),
      x,
      y,
      z: 0,
      vx: 0,
      vy: 0,
      vz: 0,
      facing: -1,
      hp,
      maxHp: hp,
      defense,
      speed: is89Boss ? 1.8 : is89Knife ? 1.9 : is89Bat ? 1.35 : isIronFist ? 1.7 : isNightHeron ? 1.85 : isGenex ? 1.55 : isDog ? 2.35 : isBoss ? 1.85 : isMiniBoss ? 1.65 : isBrute ? 1.15 : isSkull ? 1.45 : isHeavy ? 1.05 : 1.45,
      damage: is89Boss ? 15 : is89Bat ? 11 : is89Knife ? 8 : isIronFist ? 14 : isNightHeron ? 12 : isGenex ? 14 : isBoss ? 14 : isMiniBoss ? 12 : isBrute ? 11 : isDog ? 8 : isSkull ? 9 : isHeavy ? 10 : 6,
      attackTimer: 0,
      attackCooldown: 36 + Math.floor(Math.random() * 38),
      attackHitDone: false,
      hurtTimer: 0,
      knockdownTimer: 0,
      dead: false,
      fadeTimer: 0,
      walkFrame: Math.random() * 10,
      suitColor: isBoss ? "#1e1b4b" : isMiniBoss ? "#7f1d1d" : isHeavy ? "#334155" : ["#1e3a5f", "#273449", "#374151"][Math.floor(Math.random() * 3)],
      tieColor: isBoss ? "#ef4444" : isMiniBoss ? "#fbbf24" : isHeavy ? "#f59e0b" : "#dc2626",
      // Dr. Genex 3-Phase Boss Fields
      bossPhase: isGenex ? 1 : 0,
      kickAnimTimer: 0,
      specialCooldown: 95,
      diveState: "none", // "none" | "ascend" | "aim" | "dive"
      diveTimer: 0,
      diveTargetX: x,
      diveTargetY: y,
    };
  }

  // Apply enemy defense/armor reduction (Mini-Boss: 35% DEF, Main Boss: 45% DEF)
  // Alice's Linguistic Armor Break (e.armorBreakTimer > 0) shreds enemy defense to 0%!
  function dealEnemyDamage(e, rawDmg, armorPierce = 0) {
    let def = e && e.defense ? e.defense : 0;
    if (e && e.armorBreakTimer && e.armorBreakTimer > 0) {
      def = 0;
    } else if (armorPierce > 0) {
      def = Math.max(0, def - armorPierce);
    }
    const actual = Math.max(1, Math.round(rawDmg * (1 - def)));
    e.hp -= actual;
    return actual;
  }

  function triggerBossMutation(e, nextPhase) {
    e.bossPhase = nextPhase;
    e.hurtTimer = 0;
    e.knockdownTimer = 0;
    e.attackTimer = 0;
    e.diveState = "none";
    e.z = 0;
    e.vz = 0;
    window.sound.bossMutate();
    gameState = STATE.BOSS_MUTATE;

    if (nextPhase === 2) {
      e.maxHp = Math.round(340 * 2.0);
      e.hp = e.maxHp;
      e.defense = 0.45;
      e.speed = 1.75;
      e.name = "DR. GENEX — PHASE 2: 巨臂巨腳斬擊型態";
      bossMutateTimer = 95;
      bossMutateTitle = "⚠ 第二階段進化！PHASE 2 MUTATION! ⚠";
      bossMutateSub = "保留巨臂怪力 ＋ 雙腳巨大化！小心斬擊式踢擊波！";
      triggerShake(48, 5);
      spawnParticles(e.x, e.y, 40, "#a855f7", 30, 5, 36);
    } else if (nextPhase === 3) {
      e.maxHp = Math.round(320 * 2.0);
      e.hp = e.maxHp;
      e.defense = 0.45;
      e.speed = 2.05;
      e.name = "DR. GENEX — FINAL FORM: 黑翼骷髏最終型態";
      bossMutateTimer = 115;
      bossMutateTitle = "☠ 整個畫面劇烈顫抖！最終型態覺醒！ ☠";
      bossMutateSub = "黑翼展開 ＋ 骷髏魔面！小心高空俯衝攻擊！";
      // Violent full-screen earthquake tremor!
      triggerShake(115, 8.5);
      spawnParticles(e.x, e.y, 45, "#ef4444", 36, 5.5, 42);
      spawnParticles(e.x, e.y, 45, "#09090b", 28, 4.5, 42);
    }
  }

  function handleEnemyDefeat(e) {
    if (e.dead) return;

    // DR. GENEX Phase 1 -> Evolves into Phase 2 instead of dying!
    if (e.type === "genex_boss" && e.bossPhase === 1) {
      triggerBossMutation(e, 2);
      return;
    }

    e.dead = true;
    e.fadeTimer = 46;
    const isMajorBoss =
      e.type === "genex_boss" ||
      e.type === "boss" ||
      e.type === "boss_89_king" ||
      e.type === "boss_train_mechanic" ||
      e.type === "boss_ironfist" ||
      e.type === "boss_nightheron" ||
      e.type === "wt_boss";
    score +=
      e.type === "genex_boss"
        ? 5000
        : isMajorBoss
        ? 2500
        : e.type === "miniboss"
        ? 1000
        : e.type === "heavy" || e.type === "mutant_brute" || e.type === "wt_guard" || e.type === "train_porter"
        ? 350
        : 180;
    window.sound.enemyKo();

    // Defeating ANY Mini-Boss or Stage Boss (including Taiwan Tour, Japan Tour, Train, Classic Stages) unlocks Ultimate Level (Lv.1 -> Lv.2 -> Lv.3)!
    if (e.type === "miniboss" || isMajorBoss) {
      const prevLevel = unlockedUltLevel;
      unlockedUltLevel = Math.min(3, unlockedUltLevel + 1);
      player.hp = Math.min(player.maxHp, player.hp + 35);
      player.reloadGauge = 100;
      if (unlockedUltLevel > prevLevel) {
        window.sound.skillUnlock();
        triggerShake(18, 5);
        spawnParticles(e.x, e.y, 34, unlockedUltLevel >= 3 ? "#c084fc" : "#fcd34d", 26, 4.5, 32);
        unlockBannerTimer = 250;
        if (unlockedUltLevel === 1) {
          unlockBannerTitle = "★ Lv.1 大絕進化！ULTIMATE LV.1 UNLOCKED! ★";
          unlockBannerSub = "大絕持續 12 秒＋威力／範圍大幅提升！(已補滿能量，快按 R!)";
          showSpeech("★ Lv.1 大絕解鎖！能量已滿，快按 R 體驗進階必殺！", 210);
        } else if (unlockedUltLevel === 2) {
          unlockBannerTitle = "★★ Lv.2 奧義強化！SUPER ULTIMATE LV.2! ★★";
          unlockBannerSub = "大絕持續 14 秒＋超廣域連擊強化！(再擊敗 1 位 Boss 解鎖 Lv.3 終極收招！)";
          showSpeech("★★ Lv.2 奧義強化！再打倒 1 位魔王就能解鎖 Lv.3 終極奧義！", 210);
        } else {
          unlockBannerTitle = "★★★ Lv.3 終極奧義完全解放！MAX ULTIMATE! ★★★";
          unlockBannerSub = "全角色 Lv.3 終極收招解鎖！（雙刀交叉／暗影女皇／四聖獸齊衝／天翔斜踢！）";
          showSpeech("★★★ Lv.3 終極奧義 MAX 解放！按 R 釋放最強收招！", 230);
        }
      } else {
        spawnText("BOSS KO! 能量全滿!", e.x, e.y - 68, "#fcd34d", 1.15);
      }
    }
  }

  function createSmoker(x, y) {
    return {
      x,
      y,
      hasBrisket: true,
      lidOpen: 0,
      hitFlash: 0,
    };
  }

  function startStage(stageNum) {
    currentStage = stageNum;
    syncStageButtons();
    player = createPlayer();
    enemies = [];
    pickups = [];
    particles = [];
    floatingTexts = [];
    slashEffects = [];
    swordWaves = [];
    skillEffects = [];
    enemyProjectiles = [];
    toxicTimer = 0;
    cameraX = 0;
    cameraLocked = false;
    cameraLockX = 0;
    activeWaveIndex = 0;
    combo = 0;
    comboTimer = 0;
    maxCombo = 0;
    displayHp = player ? player.maxHp : 100;
    stageStartTick = tick;
    stageDamageTaken = 0;
    stageBrisketsEaten = 0;
    bossWarningTimer = 0;
    bossWarningName = "";
    koSlowMoTimer = 0;
    koFlashTimer = 0;
    justDodgeFlashTimer = 0;
    ambientParticles = [];
    stageClearSummary = null;
    hitstop = 0;
    shakeTime = 0;
    goArrowTimer = 0;
    window.sound.isBuff = false;
    if (window.sound.setBossTension) window.sound.setBossTension(false);
    if (window.shaderFX) {
      const wtGrade = window.WorldTour ? window.WorldTour.getStage(stageNum) : null;
      const grade =
        wtGrade && wtGrade.region === "japan"
          ? "japan"
          : stageNum === 102
          ? "jiufen"
          : wtGrade && (wtGrade.region === "malaysia" || wtGrade.region === "singapore" || wtGrade.region === "thailand" || wtGrade.region === "vietnam")
          ? "sea"
          : stageNum === 3 || stageNum === 4 || stageNum === 5
          ? "biolab"
          : "default";
      window.shaderFX.setRegionGrade(grade);
    }

    if (stageNum === 1) {
      stageWidth = 3200;
      smokers = [
        createSmoker(620, 236),
        createSmoker(1320, 236),
        createSmoker(2060, 236),
        createSmoker(2740, 236),
      ];
      waves = [
        {
          triggerX: 60,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "agent", x: 540, y: 254 },
            { type: "agent", x: 600, y: 294 },
            { type: "agent", x: 650, y: 270 },
            { type: "agent", x: 700, y: 258 },
          ],
        },
        {
          triggerX: 640,
          lockX: 580,
          spawned: false,
          cleared: false,
          list: [
            { type: "agent", x: 1180, y: 250 },
            { type: "heavy", x: 1230, y: 288 },
            { type: "agent", x: 520, y: 276 },
            { type: "agent", x: 1260, y: 266 },
            { type: "agent", x: 1300, y: 300 },
          ],
        },
        {
          triggerX: 1260,
          lockX: 1200,
          spawned: false,
          cleared: false,
          list: [
            { type: "heavy", x: 1820, y: 254 },
            { type: "agent", x: 1140, y: 264 },
            { type: "agent", x: 1860, y: 296 },
            { type: "heavy", x: 1890, y: 274 },
            { type: "agent", x: 1120, y: 292 },
            { type: "agent", x: 1920, y: 258 },
          ],
        },
        {
          triggerX: 1880,
          lockX: 1820,
          spawned: false,
          cleared: false,
          list: [
            { type: "miniboss", x: 2450, y: 274 },
            { type: "agent", x: 1770, y: 256 },
            { type: "agent", x: 2480, y: 250 },
            { type: "agent", x: 2500, y: 300 },
          ],
        },
        {
          triggerX: 2520,
          lockX: 2520,
          spawned: false,
          cleared: false,
          list: [
            { type: "heavy", x: 3140, y: 254 },
            { type: "heavy", x: 3170, y: 296 },
            { type: "agent", x: 2470, y: 266 },
            { type: "agent", x: 3190, y: 274 },
            { type: "agent", x: 2460, y: 298 },
            { type: "heavy", x: 3210, y: 262 },
          ],
        },
      ];
    } else if (stageNum === 2) {
      // Stage 2: Extended Grand Restroom Corridor + Mini-Boss + Final Boss!
      stageWidth = 2100;
      smokers = [
        createSmoker(560, 234),
        createSmoker(1220, 234),
        createSmoker(1740, 234),
      ];
      waves = [
        {
          triggerX: 40,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "agent", x: 540, y: 252 },
            { type: "agent", x: 600, y: 296 },
            { type: "heavy", x: 640, y: 274 },
            { type: "agent", x: 680, y: 258 },
            { type: "agent", x: 710, y: 292 },
          ],
        },
        {
          triggerX: 620,
          lockX: 560,
          spawned: false,
          cleared: false,
          list: [
            { type: "heavy", x: 1180, y: 254 },
            { type: "agent", x: 500, y: 274 },
            { type: "agent", x: 1220, y: 296 },
            { type: "heavy", x: 1250, y: 276 },
            { type: "agent", x: 510, y: 298 },
            { type: "agent", x: 1280, y: 256 },
          ],
        },
        {
          triggerX: 1180,
          lockX: 1120,
          spawned: false,
          cleared: false,
          list: [
            { type: "miniboss", x: 1740, y: 274 },
            { type: "agent", x: 1070, y: 256 },
            { type: "agent", x: 1780, y: 252 },
            { type: "heavy", x: 1800, y: 298 },
          ],
        },
        {
          triggerX: 1460,
          lockX: 1460,
          spawned: false,
          cleared: false,
          list: [
            { type: "boss", x: 2080, y: 274 },
            { type: "agent", x: 1410, y: 256 },
            { type: "agent", x: 2110, y: 250 },
            { type: "heavy", x: 2130, y: 298 },
            { type: "agent", x: 1420, y: 296 },
          ],
        },
      ];
    } else if (stageNum === 3) {
      // Stage 3: Bio-Island Lab Floor 1 (Cloning Vats & Mutants!)
      stageWidth = 2600;
      smokers = [
        createSmoker(600, 236),
        createSmoker(1360, 236),
        createSmoker(2100, 236),
      ];
      waves = [
        {
          triggerX: 50,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_dog", x: 560, y: 264 },
            { type: "skull_human", x: 620, y: 292 },
            { type: "mutant_brute", x: 670, y: 270 },
            { type: "mutant_dog", x: 710, y: 252 },
          ],
        },
        {
          triggerX: 640,
          lockX: 580,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_brute", x: 1180, y: 256 },
            { type: "skull_human", x: 520, y: 276 },
            { type: "mutant_dog", x: 1230, y: 296 },
            { type: "skull_human", x: 1260, y: 266 },
            { type: "mutant_brute", x: 1300, y: 288 },
          ],
        },
        {
          triggerX: 1260,
          lockX: 1200,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_dog", x: 1810, y: 252 },
            { type: "mutant_dog", x: 1140, y: 292 },
            { type: "mutant_brute", x: 1850, y: 274 },
            { type: "skull_human", x: 1880, y: 296 },
            { type: "skull_human", x: 1130, y: 260 },
          ],
        },
        {
          triggerX: 1900,
          lockX: 1900,
          spawned: false,
          cleared: false,
          list: [
            { type: "miniboss", x: 2510, y: 274 },
            { type: "mutant_dog", x: 1850, y: 258 },
            { type: "skull_human", x: 2540, y: 252 },
            { type: "mutant_brute", x: 2550, y: 298 },
          ],
        },
      ];
    } else if (stageNum === 4) {
      // Stage 4: Bio-Island Lab B1 (Dark Underground + Toxic Swamp Gas Drain!)
      stageWidth = 2200;
      smokers = [
        createSmoker(480, 236),
        createSmoker(1140, 236),
        createSmoker(1740, 236),
      ];
      waves = [
        {
          triggerX: 50,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_dog", x: 560, y: 256 },
            { type: "skull_human", x: 610, y: 292 },
            { type: "mutant_brute", x: 650, y: 272 },
            { type: "mutant_dog", x: 690, y: 288 },
          ],
        },
        {
          triggerX: 680,
          lockX: 620,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_brute", x: 1240, y: 254 },
            { type: "mutant_dog", x: 560, y: 274 },
            { type: "skull_human", x: 1270, y: 294 },
            { type: "mutant_brute", x: 1300, y: 274 },
            { type: "skull_human", x: 570, y: 298 },
          ],
        },
        {
          triggerX: 1480,
          lockX: 1480,
          spawned: false,
          cleared: false,
          list: [
            { type: "miniboss", x: 2100, y: 274 },
            { type: "mutant_dog", x: 1430, y: 256 },
            { type: "skull_human", x: 2130, y: 250 },
            { type: "mutant_brute", x: 2140, y: 298 },
          ],
        },
      ];
    } else if (stageNum === 6) {
      // Island 1 — Stage 3: 《末班機 (LAST FLIGHT)》 Airport Dual-Boss Showdown!
      stageWidth = 640;
      cameraLocked = true;
      cameraLockX = 0;
      smokers = [createSmoker(92, 236)];
      window.AirportStage.init();
      const iron = createEnemy("boss_ironfist", 435, 248);
      iron.hidden = true;
      const heron = createEnemy("boss_nightheron", 498, 246);
      heron.hidden = true;
      enemies.push(iron, heron);
      waves = [
        {
          triggerX: 0,
          lockX: 0,
          spawned: true,
          cleared: false,
          list: [],
        },
      ];
      gameState = STATE.AIRPORT_INTRO;
      showSpeech("機場停機坪... 黑色直升機正在降落！", 160);
      return;
    } else if (stageNum === 7) {
      // Island 3: 台灣・大稻埕迪化街 (8+9 小刀/球棒軍團 + 平頭刺青老大 BOSS!)
      stageWidth = 2600;
      smokers = [
        createSmoker(620, 236),
        createSmoker(1380, 236),
        createSmoker(2120, 236),
      ];
      waves = [
        {
          triggerX: 50,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "thug_knife", x: 540, y: 256 },
            { type: "thug_bat", x: 600, y: 292 },
            { type: "thug_knife", x: 650, y: 270 },
            { type: "thug_bat", x: 700, y: 254 },
          ],
        },
        {
          triggerX: 640,
          lockX: 580,
          spawned: false,
          cleared: false,
          list: [
            { type: "thug_bat", x: 1180, y: 254 },
            { type: "thug_knife", x: 520, y: 278 },
            { type: "thug_knife", x: 1220, y: 296 },
            { type: "thug_bat", x: 1260, y: 268 },
            { type: "thug_knife", x: 1300, y: 288 },
          ],
        },
        {
          triggerX: 1260,
          lockX: 1200,
          spawned: false,
          cleared: false,
          list: [
            { type: "miniboss", x: 1840, y: 274 },
            { type: "thug_knife", x: 1140, y: 258 },
            { type: "thug_bat", x: 1870, y: 252 },
            { type: "thug_knife", x: 1890, y: 298 },
          ],
        },
        {
          triggerX: 1920,
          lockX: 1920,
          spawned: false,
          cleared: false,
          list: [
            { type: "boss_89_king", x: 2520, y: 274 },
            { type: "thug_knife", x: 1870, y: 258 },
            { type: "thug_bat", x: 2550, y: 296 },
            { type: "thug_knife", x: 2560, y: 252 },
          ],
        },
      ];
      gameState = STATE.PLAYING;
      showSpeech("台灣・大稻埕迪化街！小心拿小刀跟球棒的 8+9！", 180);
      return;
    } else if (stageNum === 8) {
      // Stage 8: 山線特快列車 (Mountain Express — 4 Cars: Rear -> Passenger -> Dining -> Cab Boss!)
      stageWidth = 2960;
      smokers = [
        createSmoker(760, 236),
        createSmoker(1520, 236),
        createSmoker(2160, 236),
      ];
      waves = [
        {
          triggerX: 120,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "train_ticket", x: 480, y: 256 },
            { type: "train_porter", x: 560, y: 288 },
            { type: "train_ticket", x: 610, y: 270 },
          ],
        },
        {
          triggerX: 820,
          lockX: 640,
          spawned: false,
          cleared: false,
          list: [
            { type: "train_ticket", x: 600, y: 274 },
            { type: "train_porter", x: 1200, y: 264 },
            { type: "train_ticket", x: 1260, y: 296 },
            { type: "train_porter", x: 1310, y: 278 },
          ],
        },
        {
          triggerX: 1500,
          lockX: 1280,
          spawned: false,
          cleared: false,
          list: [
            { type: "train_ticket", x: 1240, y: 256 },
            { type: "train_porter", x: 1860, y: 262 },
            { type: "train_ticket", x: 1900, y: 294 },
            { type: "train_porter", x: 1940, y: 276 },
          ],
        },
        {
          triggerX: 2180,
          lockX: 2320,
          spawned: false,
          cleared: false,
          list: [
            { type: "boss_train_mechanic", x: 2840, y: 276 },
            { type: "train_ticket", x: 2290, y: 260 },
            { type: "train_porter", x: 2890, y: 296 },
          ],
        },
      ];
      gameState = STATE.PLAYING;
      showSpeech("山線特快啟動！從車尾行李車一路殺進駕駛室！", 180);
      return;
    } else if (window.WorldTour && window.WorldTour.getStage(stageNum)) {
      const wt = window.WorldTour.getStage(stageNum);
      window.WorldTour.preloadStage(stageNum);
      stageWidth = wt.stageWidth;
      smokers = [
        createSmoker(Math.round(stageWidth * 0.3), 236),
        createSmoker(Math.round(stageWidth * 0.72), 236),
      ];
      waves = window.WorldTour.buildWaves(stageNum);
      gameState = STATE.PLAYING;
      showSpeech(wt.intro, 180);
      return;
    } else {
      // Stage 5: Bio-Island Lab Floor 3 (Guards + Mini-Boss -> 3-PHASE DR. GENEX!)
      stageWidth = 1600;
      smokers = [
        createSmoker(460, 236),
        createSmoker(1080, 236),
        createSmoker(1460, 236),
      ];
      waves = [
        {
          triggerX: 50,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "mutant_dog", x: 540, y: 254 },
            { type: "mutant_brute", x: 600, y: 286 },
            { type: "skull_human", x: 640, y: 266 },
            { type: "miniboss", x: 690, y: 274 },
          ],
        },
        {
          triggerX: 900,
          lockX: 920,
          spawned: false,
          cleared: false,
          list: [
            { type: "genex_boss", x: 1520, y: 274 },
            { type: "mutant_dog", x: 870, y: 260 },
            { type: "skull_human", x: 1550, y: 296 },
          ],
        },
      ];
    }

    gameState = STATE.PLAYING;
    const stageIntros = {
      1: selectedChar === "momo" ? "Momo 參戰！防狼噴霧備戰，按 R 變身吸血鬼！" : selectedChar === "samurai" ? "拔刀！按 R 發動武士刀亂舞！" : "Press R to RELOAD ARMS!",
      2: "豪華廁所激戰！準備迎戰小魔王與 Boss！",
      3: "生化島研究所第一層！周圍全是複製怪物培養皿！",
      4: "地下一層充滿毒沼氣！快打倒小魔王往下衝！",
      5: "研究所第三層！基因研究者就在前方！",
    };
    showSpeech(stageIntros[stageNum] || "GO!", 170);
  }

  // --- Helpers ---
  function triggerShake(frames, mag) {
    shakeTime = Math.max(shakeTime, frames);
    shakeMag = Math.max(shakeMag, mag);
  }

  function showSpeech(text, frames = 150) {
    player.speechText = text;
    player.speechTimer = frames;
  }

  function spawnParticles(x, y, z, color, count = 8, speed = 3, life = 22) {
    for (let i = 0; i < count; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = (0.4 + Math.random() * 0.9) * speed;
      particles.push({
        x,
        y,
        z,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s * 0.35,
        vz: 1.5 + Math.random() * 2.5,
        color,
        size: 2 + Math.floor(Math.random() * 3),
        life,
        maxLife: life,
      });
    }
  }

  function spawnText(text, x, y, color = "#fcd34d", scale = 1) {
    floatingTexts.push({
      text,
      x,
      y,
      vy: -0.9,
      color,
      scale,
      life: 44,
      maxLife: 44,
    });
  }

  function isBuff() {
    return player && player.buffTimer > 0;
  }

  // --- Ultimate Cutscene (Arm Reload for Mustache / Katana Flurry for Samurai) ---
  function triggerArmReload() {
    if (player.reloadGauge < 100 || isBuff()) return;
    if (window.shaderFX) {
      window.shaderFX.pulseAberration(0.88);
      window.shaderFX.triggerShockwave((player.x - cameraX) / W, (player.y - 36) / H, 0.055);
    }
    player.reloadGauge = 0;
    // Unlocked New Move extends Ultimate duration to 12s (720f) or 14s (840f) — guaranteed > 10s!
    player.buffMax = unlockedUltLevel >= 2 ? 840 : unlockedUltLevel >= 1 ? 720 : 600;
    player.buffTimer = player.buffMax;
    player.invulnTimer = 80;
    gameState = STATE.RELOAD_CUTSCENE;
    reloadCutsceneTimer = 72;
    if (isRose()) {
      window.sound.aliceUltDomain();
    } else if (isLing()) {
      window.sound.shakaUltActivate();
    } else if (isMagic()) {
      window.sound.aliceUltDomain();
    } else if (isNightHeronHero()) {
      window.sound.heelDoubleTap();
    } else if (isIronFistHero()) {
      window.sound.armReload();
    } else if (isAlice()) {
      window.sound.aliceUltDomain();
    } else if (isShaka()) {
      window.sound.shakaUltActivate();
    } else if (isRaven()) {
      window.sound.eclipseActivate();
    } else if (isMomo()) {
      window.sound.vampireTransform();
    } else if (isSamurai()) {
      window.sound.bladeStormActivate();
    } else {
      window.sound.armReload();
    }
    window.sound.isBuff = true;
    triggerShake(26, 4);
  }

  function spawnSlashEffect(x, y, z, facing, angle, radius, color, life = 12) {
    slashEffects.push({ x, y, z, facing, angle, radius, color, life, maxLife: life });
  }

  function spawnSwordWave(x, y, z, facing, color = "#38bdf8", lifesteal = false, spriteKey = null, heavy = false) {
    swordWaves.push({
      x,
      y,
      z,
      vx: facing * (spriteKey ? 7.6 : 6.8),
      facing,
      color,
      lifesteal,
      spriteKey,
      heavy,
      life: 28,
      maxLife: 28,
      hitIds: new Set(),
    });
  }

  // --- Update ---
  function update() {
    tick++;

    if (shakeTime > 0) shakeTime--;
    if (bossWarningTimer > 0) bossWarningTimer--;
    if (koFlashTimer > 0) koFlashTimer--;
    if (justDodgeFlashTimer > 0) justDodgeFlashTimer--;
    if (player) {
      if (displayHp > player.hp) {
        displayHp = Math.max(player.hp, displayHp - Math.max(0.35, (displayHp - player.hp) * 0.08));
      } else {
        displayHp = player.hp;
      }
    }
    if (combo > maxCombo) maxCombo = combo;

    if (hitstop > 0) {
      hitstop--;
      clearJustPressed();
      return;
    }

    // Dramatic Final-Boss K.O. Slow-Motion (runs simulation at 1/3 speed)
    if (koSlowMoTimer > 0) {
      koSlowMoTimer--;
      if (koSlowMoTimer % 3 !== 0) {
        updateParticles();
        updateFloatingTexts();
        clearJustPressed();
        return;
      }
    }

    if (gameState === STATE.RELOAD_CUTSCENE) {
      reloadCutsceneTimer--;
      if (isFallen()) {
        // 🪽 墮落天使 — 《審判之痕・三階審判斬擊》 Awakening Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 76, player.y, 18 + Math.random() * 40, "#e9d5ff", 3, 2.8, 20);
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 16 + Math.random() * 34, "#fde047", 2, 2.4, 18);
        }
        if (reloadCutsceneTimer === 36) {
          window.sound.shakaUltActivate();
          triggerShake(16, 5.2);
          triggerFallenRemoteJudgment(2, 24, 88);
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("審判之痕已覺醒！罪孽之人，迎接天降裁決！", 160);
        }
      } else if (isRose()) {
        // 🔥 蘿絲 — 群體暗示・三階煉獄火拳 Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 76, player.y, 18 + Math.random() * 38, "#ec4899", 3, 2.8, 20);
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 16 + Math.random() * 32, "#f97316", 3, 2.6, 18);
        }
        if (reloadCutsceneTimer === 36) {
          window.sound.aliceVoiceCommand();
          triggerShake(14, 4.5);
          triggerRemoteAoe("rose", 2, 24, 86);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 158,
            color: "#ec4899",
            life: 22,
            maxLife: 22,
          });
          // Mass Suggestion: briefly stun all on-screen enemies!
          for (const e of enemies) {
            if (!e.dead && e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              e.hurtTimer = Math.max(e.hurtTimer, 72);
              e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 120);
            }
          }
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("群體暗示完成！三階煉獄火拳，全開焚盡！", 160);
        }
      } else if (isLing()) {
        // 🏮 鈴 — 四象靈契・聖獸降臨 Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          const colors = ["#2dd4bf", "#f8fafc", "#ef4444", "#38bdf8"];
          const col = colors[(reloadCutsceneTimer / 6) % 4];
          spawnParticles(player.x + (Math.random() - 0.5) * 76, player.y, 18 + Math.random() * 38, col, 4, 2.8, 20);
        }
        if (reloadCutsceneTimer === 36) {
          window.sound.waterSweep();
          triggerShake(14, 4.5);
          triggerRemoteAoe("ling", 2, 24, 86);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 140,
            color: "#2dd4bf",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("四象靈契展開！青龍白虎朱雀玄武齊降！", 160);
        }
      } else if (isMagic()) {
        // 🔮 瑪姬 — 開門・裂界 暗影女皇降臨 Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 74, player.y, 18 + Math.random() * 36, "#c084fc", 4, 2.8, 20);
          spawnParticles(player.x + (Math.random() - 0.5) * 74, player.y, 12, "#a855f7", 3, 2.2, 18);
        }
        if (reloadCutsceneTimer === 36) {
          window.sound.aliceVoiceCommand();
          triggerShake(14, 4.5);
          triggerRemoteAoe("magic", 2, 24, 86);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 136,
            color: "#a855f7",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("裂界開啟！王冠骷髏與暗影女皇降臨！", 160);
        }
      } else if (isNightHeronHero()) {
        // Night Heron Burgundy Heel Double-Tap Rain Awakening Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 68, player.y, 18 + Math.random() * 34, "#38bdf8", 4, 2.6, 20);
          spawnParticles(player.x + (Math.random() - 0.5) * 68, player.y, 10, "#e0f2fe", 3, 2.2, 18);
        }
        if (reloadCutsceneTimer === 36) {
          window.sound.waterSweep();
          triggerShake(14, 4);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 128,
            color: "#38bdf8",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(
            unlockedUltLevel >= 3 ? "叩！叩！末班起飛・天翔準備!" : "叩！叩！雨夜天翔・水刃全開!",
            player.x,
            player.y - 86,
            "#7dd3fc",
            1.25
          );
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            unlockedUltLevel >= 3
              ? "鐵拳，借我起飛！雨夜天翔斜踢收招！"
              : "雨幕升起！雙手插袋，水刃連踢！",
            150
          );
        }
      } else if (isIronFistHero()) {
        // Iron Fist White-Gold Steam Awakening Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 24 + Math.random() * 28, "#f8fafc", 4, 2.8, 20);
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 28, "#f59e0b", 3, 2.4, 20);
        }
        if (reloadCutsceneTimer === 36) {
          triggerShake(18, 5);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 124,
            color: "#f59e0b",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(
            unlockedUltLevel >= 3 ? "末班起飛・雙人合體準備!" : "崩山轟拳・蒸氣全開!",
            player.x,
            player.y - 86,
            "#fcd34d",
            1.25
          );
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            unlockedUltLevel >= 3
              ? "夜鷺，準備起飛！崩山轟拳合體收招！"
              : "白繃帶解放！崩山轟拳衝擊波全開！",
            150
          );
        }
      } else if (isAlice()) {
        // Alice Linguistic Domain Awakening Cutscene! (微仰頭紅眼聲波 -> 酒紅領域＋黑玫瑰荊棘)
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 68, player.y, 24 + Math.random() * 32, "#e11d48", 4, 2.6, 22);
          spawnParticles(player.x + (Math.random() - 0.5) * 68, player.y, 28, "#d4af37", 3, 2.2, 22);
        }
        if (reloadCutsceneTimer === 36) {
          triggerShake(16, 4.5);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 130,
            color: "#e11d48",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(
            unlockedUltLevel >= 3 ? "最高指令：「臣服」!" : "絕對契約・言靈領域!",
            player.x,
            player.y - 86,
            "#fb7185",
            1.25
          );
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            unlockedUltLevel >= 3
              ? "全場言靈領域展開！所有護甲粉碎，聽候指令！"
              : "絕對契約生效！領域內敵人自動破甲，黃銅指虎清算開始！",
            150
          );
        }
      } else if (isShaka()) {
        // Shaka Thousand-Hand Awakening Cutscene! (懸浮開輪 -> 千手幻影展開)
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 70, player.y, 24 + Math.random() * 34, "#fbbf24", 4, 2.6, 24);
          spawnParticles(player.x + (Math.random() - 0.5) * 70, player.y, 28, "#e2e8f0", 3, 2.2, 22);
        }
        if (reloadCutsceneTimer === 36) {
          triggerShake(16, 4.5);
          skillEffects.push({
            type: "shockwave",
            x: player.x,
            y: player.y,
            radius: 18,
            maxRadius: 120,
            color: "#fbbf24",
            life: 20,
            maxLife: 20,
          });
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(
            unlockedUltLevel >= 3 ? "千手觀音・天地鎮壓!" : "萬臂群控・金輪展開!",
            player.x,
            player.y - 88,
            "#fde68a",
            1.25
          );
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            unlockedUltLevel >= 3
              ? "萬臂合一！360° 千手手陣全場鎮壓！"
              : "千手幻影展開！多臂齊發遠距群控！",
            150
          );
        }
      } else if (isRaven()) {
        // Raven Eclipse Dual-Pistol Awakening Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 24 + Math.random() * 28, "#d4af37", 4, 2.8, 22);
          spawnParticles(player.x + (Math.random() - 0.5) * 64, player.y, 30, "#a855f7", 3, 2.4, 22);
        }
        if (reloadCutsceneTimer === 36) {
          triggerShake(18, 5);
          spawnSlashEffect(player.x + 18, player.y, 34, 1, -0.25, 58, "#d4af37", 14);
          spawnSlashEffect(player.x - 18, player.y, 34, -1, 0.25, 58, "#a855f7", 14);
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(
            unlockedUltLevel >= 3 ? "日蝕槍鬥術・全彈處決!" : "日蝕處決・雙槍覺醒!",
            player.x,
            player.y - 84,
            "#fcd34d",
            1.2
          );
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            unlockedUltLevel >= 3
              ? "暗影會・日蝕槍鬥術！360° 黑金彈幕全開！"
              : "雙槍上膛！日蝕處決模式，邊走位邊連射！",
            150
          );
        }
      } else if (isMomo()) {
        // Momo Vampire Awakening Cutscene!
        if (reloadCutsceneTimer % 6 === 0) {
          spawnParticles(player.x + (Math.random() - 0.5) * 60, player.y, 24 + Math.random() * 28, "#ef4444", 4, 2.8, 22);
          spawnParticles(player.x + (Math.random() - 0.5) * 60, player.y, 32, "#18181b", 3, 2.2, 22);
        }
        if (reloadCutsceneTimer === 34) {
          triggerShake(18, 5);
          spawnSlashEffect(player.x, player.y, 32, 1, -0.3, 56, "#ef4444", 14);
          spawnSlashEffect(player.x, player.y, 32, -1, 0.3, 56, "#dc2626", 14);
        }
        if (reloadCutsceneTimer === 12) {
          spawnText("長爪吸血覺醒!", player.x, player.y - 84, "#f43f5e", 1.2);
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("吸血鬼型態！長爪攻擊會吸血回血喔！", 150);
        }
      } else if (isSamurai()) {
        // Katana Flurry burst during cutscene!
        if (reloadCutsceneTimer % 8 === 0 && reloadCutsceneTimer > 12 && reloadCutsceneTimer < 62) {
          const ang = (Math.random() - 0.5) * 1.4;
          const ox = (Math.random() - 0.5) * 90;
          const oy = (Math.random() - 0.5) * 34;
          spawnSlashEffect(player.x + ox, player.y + oy, 30, Math.random() < 0.5 ? 1 : -1, ang, 48, "#38bdf8", 12);
          spawnParticles(player.x + ox, player.y + oy, 28, "#e0f2fe", 6, 3.2, 16);
          // Flurry damages nearby enemies during activation (expanded range when unlocked!)
          const burstRangeX = unlockedUltLevel >= 1 ? 200 : 130;
          const burstRangeY = unlockedUltLevel >= 1 ? 85 : 55;
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - player.x) < burstRangeX && Math.abs(e.y - player.y) < burstRangeY) {
              dealEnemyDamage(e, unlockedUltLevel >= 1 ? 16 : 12);
              e.hurtTimer = 10;
              combo++;
              comboTimer = 135;
              score += 140;
              spawnParticles(e.x, e.y, 30, "#38bdf8", 5, 3, 14);
              spawnText("SLASH!", e.x, e.y - 54, "#38bdf8", 0.95);
              if (e.hp <= 0) {
                e.vx = (e.x >= player.x ? 1 : -1) * 5.5;
                e.vz = 4.6;
                handleEnemyDefeat(e);
              }
            }
          }
        }
        if (reloadCutsceneTimer === 12) {
          spawnText(hasSamuraiDualMode() ? "雙刀模式・劍氣傍身!" : "劍氣傍身!", player.x, player.y - 84, hasSamuraiDualMode() ? "#c084fc" : "#38bdf8", 1.2);
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech(
            hasSamuraiDualMode() ? "雙刀模式開啟！按攻擊發動【交叉突進】！" : "武士刀亂舞！劍氣護體！",
            160
          );
        }
      } else {
        if (reloadCutsceneTimer === 34) {
          triggerShake(18, 6);
          spawnParticles(player.x, player.y, 28, "#38bdf8", 22, 4.5, 28);
          spawnParticles(player.x, player.y, 28, "#fcd34d", 14, 3.8, 26);
        }
        if (reloadCutsceneTimer === 12) {
          spawnText("POCKET EQUIPPED!", player.x, player.y - 84, "#fcd34d", 1.15);
        }
        if (reloadCutsceneTimer <= 0) {
          gameState = STATE.PLAYING;
          showSpeech("If you know, you know.", 140);
        }
      }
      updateSlashEffectsAndWaves();
      updateParticles();
      updateFloatingTexts();
      clearJustPressed();
      return;
    }

    if (gameState === STATE.AIRPORT_INTRO) {
      window.AirportStage.updateIntro(enemies, spawnText, triggerShake, () => {
        gameState = STATE.PLAYING;
        showSpeech("鐵拳先上，夜鷺在行李箱旁看戲！小心三連拳的停頓！", 190);
      });
      updateParticles();
      updateFloatingTexts();
      clearJustPressed();
      return;
    }

    if (gameState === STATE.BOSS_MUTATE) {
      bossMutateTimer--;
      if (bossMutateTimer <= 0) {
        gameState = STATE.PLAYING;
      }
      updateParticles();
      updateFloatingTexts();
      clearJustPressed();
      return;
    }

    if (gameState === STATE.STAGE_CLEAR) {
      stageClearTimer--;
      updateParticles();
      updateAmbientParticles();
      updateFloatingTexts();
      if (stageClearTimer <= 325 && (justPressed["Enter"] || justPressed["Space"])) {
        stageClearTimer = 0;
      }
      if (stageClearTimer <= 0) {
        if (currentStage === 1) {
          startStage(2);
        } else if (currentStage === 2) {
          // After clearing Restroom -> Island 1 Stage 3: 《末班機》 Airport Dual Boss!
          startStage(6);
        } else if (currentStage === 6) {
          // Cleared 《末班機》 -> Unlock & enter the Island World Map!
          openWorldMap();
        } else if (currentStage === 3) {
          startStage(4);
        } else if (currentStage === 4) {
          startStage(5);
        } else if (window.WorldTour && window.WorldTour.getStage(currentStage) && window.WorldTour.getStage(currentStage).nextId) {
          startStage(window.WorldTour.getStage(currentStage).nextId);
        } else {
          gameState = STATE.VICTORY;
        }
      }
      clearJustPressed();
      return;
    }

    if (gameState !== STATE.PLAYING) {
      clearJustPressed();
      return;
    }

    // Stage 4 (Lab B1): Toxic Swamp Gas continuously drains player HP!
    if (currentStage === 4 && player && player.hp > 0) {
      toxicTimer++;
      if (toxicTimer >= 78) {
        toxicTimer = 0;
        player.hp = Math.max(0, player.hp - 2);
        window.sound.toxicTick();
        spawnParticles(player.x, player.y, 26, "#4ade80", 5, 1.8, 16);
        spawnText("-2 沼氣", player.x, player.y - 60, "#4ade80", 0.85);
        if (player.hp <= 0) {
          gameState = STATE.GAME_OVER;
          window.sound.isBuff = false;
        }
      }
    }

    updatePlayer();
    updateWaves();
    if (currentStage === 6) {
      window.AirportStage.updateDualBosses(enemies, player, {
        isBuff,
        spawnParticles,
        spawnText,
        triggerShake,
        damagePlayer: (rawDmg, label) => {
          if (player.invulnTimer > 0) return;
          const dmg = isBuff() ? Math.ceil(rawDmg * 0.55) : rawDmg;
          player.hp = Math.max(0, player.hp - dmg);
          player.hurtTimer = 14;
          player.invulnTimer = 34;
          combo = 0;
          window.sound.hurt();
          triggerShake(9, 4);
          spawnParticles(player.x, player.y, 28, "#ef4444", 10, 3, 18);
          spawnText(`-${dmg} ${label}`, player.x, player.y - 56, "#ef4444", 1.0);
          if (player.hp <= 0) {
            gameState = STATE.GAME_OVER;
            window.sound.isBuff = false;
          }
        },
      });
    }
    updateEnemies();
    updateEnemyProjectiles();
    updateSmokersAndPickups();
    updateSlashEffectsAndWaves();
    updateParticles();
    updateAmbientParticles();
    updateFloatingTexts();
    updateCamera();

    if (comboTimer > 0) {
      comboTimer--;
      if (comboTimer === 0) combo = 0;
    }
    if (goArrowTimer > 0) goArrowTimer--;
    if (unlockBannerTimer > 0) unlockBannerTimer--;

    clearJustPressed();
  }

  function clearJustPressed() {
    for (const k in justPressed) {
      justPressed[k] = false;
    }
  }

  function updatePlayer() {
    const p = player;
    if (p.hurtTimer > 0) p.hurtTimer--;
    if (p.invulnTimer > 0) p.invulnTimer--;
    if (p.eatTimer > 0) p.eatTimer--;
    if (p.speechTimer > 0) p.speechTimer--;
    if (p.autoSlashVisual > 0) p.autoSlashVisual--;
    if (p.ravenKataVisual > 0) p.ravenKataVisual--;
    if (p.ravenFinisherVisual > 0) p.ravenFinisherVisual--;
    if (p.shakaArrayVisual > 0) p.shakaArrayVisual--;
    if (p.shakaFinisherVisual > 0) p.shakaFinisherVisual--;
    if (p.aliceDomainVisual > 0) p.aliceDomainVisual--;
    if (p.aliceSnapVisual > 0) p.aliceSnapVisual--;
    if (p.ifFinisherVisual > 0) p.ifFinisherVisual--;
    if (p.nhFinisherVisual > 0) p.nhFinisherVisual--;
    if (p.magicFinisherVisual > 0) p.magicFinisherVisual--;
    if (p.lingFinisherVisual > 0) p.lingFinisherVisual--;
    if (p.roseFinisherVisual > 0) p.roseFinisherVisual--;
    if (p.fallenFinisherVisual > 0) p.fallenFinisherVisual--;
    if (p.ifRocketTimer > 0) {
      p.ifRocketTimer--;
      if (p.ifRocketTimer >= 5) {
        p.x += p.facing * 9.5;
        if (p.ifRocketTimer % 2 === 0) {
          spawnParticles(p.x - p.facing * 14, p.y, 28, "#f59e0b", 3, 2.4, 12);
        }
      }
    }

    // Small Skill Cooldown tick & Mobile Touch Button Cooldown UI sync
    if (p.skillCd > 0) {
      p.skillCd--;
      if (p.skillCd === 0 && tbtnJump) {
        tbtnJump.classList.remove("cd-ready-flash");
        void tbtnJump.offsetWidth;
        tbtnJump.classList.add("cd-ready-flash");
      }
    }
    if (tbtnJump && tbtnSkillMask && tbtnSkillNum) {
      if (p.skillCd > 0) {
        const pct = Math.min(100, (p.skillCd / (p.skillMaxCd || 180)) * 100);
        tbtnSkillMask.style.height = `${pct.toFixed(1)}%`;
        tbtnSkillNum.textContent = (p.skillCd / 60).toFixed(1);
        tbtnJump.classList.add("on-cd");
      } else {
        tbtnSkillMask.style.height = "0%";
        tbtnSkillNum.textContent = "";
        tbtnJump.classList.remove("on-cd");
      }
    }

    // Street Samurai Dual-Katana X-Cross Forward Dash ("雙刀模式・交叉突進")
    if (p.dualDashTimer > 0) {
      p.dualDashTimer--;
      if (p.dualDashTimer >= 10) {
        // Phase 1: High-speed forward dash with dual katanas!
        p.x += p.facing * 7.2;
        if (p.dualDashTimer % 2 === 0) {
          spawnParticles(p.x - p.facing * 14, p.y, p.z + 24, p.dualDashTimer % 4 === 0 ? "#38bdf8" : "#c084fc", 3, 2.2, 12);
        }
      } else if (!p.dualCrossBurstDone) {
        // Phase 2: Plant & Cross both katanas into a blazing X forward!
        p.dualCrossBurstDone = true;
        const fx = p.x + p.facing * 42;
        spawnSlashEffect(fx, p.y - 4, p.z + 32, p.facing, 0.55, 64, "#38bdf8", 14);
        spawnSlashEffect(fx, p.y + 4, p.z + 32, p.facing, -0.55, 64, "#c084fc", 14);
        spawnSwordWave(p.x + p.facing * 36, p.y - 6, p.z + 30, p.facing, "#38bdf8", false);
        spawnSwordWave(p.x + p.facing * 36, p.y + 6, p.z + 26, p.facing, "#c084fc", false);
        spawnText("X 交叉斬!", fx, p.y - 66, "#c084fc", 1.1);
        triggerShake(7, 3.5);
        performPlayerPunch();
      }
    }

    // Mustache Unlocked Multi-Hit Super Punch Flurry!
    if (p.flurryHitsLeft > 0) {
      p.flurryTimer--;
      if (p.flurryTimer <= 0) {
        p.flurryHitsLeft--;
        p.flurryTimer = 4;
        p.attackTimer = Math.max(p.attackTimer, 8);
        performMustacheFlurryHit();
      }
    }

    // Buff timer (Mustache Buff Mode / Samurai Sword Aura / Momo Vampire Form)
    if (p.buffTimer > 0) {
      p.buffTimer--;
      if (isSamurai()) {
        const auraRadius = unlockedUltLevel >= 1 ? 105 : 62;
        const auraRadiusY = unlockedUltLevel >= 1 ? 48 : 32;
        // Orbiting Sword-Qi aura particles
        if (tick % 4 === 0) {
          const ang = tick * 0.22;
          const pr = unlockedUltLevel >= 1 ? 44 : 28;
          spawnParticles(p.x + Math.cos(ang) * pr, p.y + Math.sin(ang) * 14, 22 + Math.sin(ang * 2) * 10, "#38bdf8", 1, 0.9, 14);
        }

        // UNLOCKED NEW MOVE: Continuous 12s+ Auto-Slashing Katana Flurry!
        if (unlockedUltLevel >= 1 && tick % 10 === 0) {
          p.autoSlashVisual = 8;
          const dir = p.facing;
          const randAng = (Math.random() - 0.5) * 0.9;
          spawnSlashEffect(p.x + dir * 28, p.y, p.z + 30, dir, randAng, 68, "#38bdf8", 11);
          spawnSlashEffect(p.x - dir * 14, p.y + 4, p.z + 26, -dir, -randAng, 56, "#a855f7", 10);
          if (tick % 20 === 0) {
            spawnSwordWave(p.x + dir * 32, p.y, p.z + 28, dir);
            window.sound.katanaSlash(true);
          } else {
            window.sound.katanaSlash(false);
          }
          // Hit all enemies in expanded flurry range!
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 126 && Math.abs(e.y - p.y) < 54) {
              const dmg = unlockedUltLevel >= 2 ? 15 : 11;
              dealEnemyDamage(e, dmg);
              e.hurtTimer = 9;
              e.vx = (e.x >= p.x ? 1 : -1) * 1.8;
              combo++;
              comboTimer = 135;
              score += dmg * 12;
              spawnParticles(e.x, e.y, 28, "#38bdf8", 4, 2.4, 12);
              spawnText(`亂舞 ${dmg}`, e.x, e.y - 54, "#7dd3fc", 0.95);
              if (e.hp <= 0) {
                e.vx = (e.x >= p.x ? 1 : -1) * 5.2;
                e.vz = 4.2;
                handleEnemyDefeat(e);
              }
            }
          }
        } else if (tick % 16 === 0) {
          // Base Passive Sword Aura (劍氣傍身) slashes nearby enemies!
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < auraRadius && Math.abs(e.y - p.y) < auraRadiusY) {
              dealEnemyDamage(e, 7);
              e.hurtTimer = 8;
              combo++;
              comboTimer = 135;
              score += 75;
              spawnSlashEffect(e.x, e.y, 28, e.x >= p.x ? 1 : -1, (Math.random() - 0.5) * 1.2, 26, "#7dd3fc", 8);
              spawnParticles(e.x, e.y, 28, "#38bdf8", 4, 2.2, 12);
              spawnText("劍氣 7", e.x, e.y - 50, "#7dd3fc", 0.85);
              window.sound.katanaSlash(false);
              if (e.hp <= 0) {
                e.vx = (e.x >= p.x ? 1 : -1) * 4.5;
                e.vz = 3.8;
                handleEnemyDefeat(e);
              }
            }
          }
        }
        // Alice: Absolute Contract — Linguistic Domain auto-shreds nearby enemy armor!
      } else if (isFallen()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 46, p.y, 20 + Math.random() * 36, tick % 12 === 0 ? "#c084fc" : "#f8fafc", 1, 1.3, 18);
        }
        // Lv.3 Finisher: 《終末宣告》 — Colossal Greatsword Cleave + 8 Staggered Remote Sky-Drop Skulls across the entire screen!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.fallenFinisherVisual = 42;
          p.invulnTimer = Math.max(p.invulnTimer, 42);
          window.sound.shakaHeavenDrop();
          triggerShake(22, 6.5);
          spawnText("🪽 Lv.3 終末宣告・萬骸審判降臨!", p.x, p.y - 96, "#e9d5ff", 1.35);
          const live = enemies.filter((e) => !e.dead && e.x >= cameraX - 24 && e.x <= cameraX + W + 24);
          const totalDrops = 8;
          for (let d = 0; d < totalDrops; d++) {
            const tgt = live.length > 0 ? live[d % live.length] : null;
            const tx = tgt
              ? tgt.x + (d >= live.length ? (Math.random() - 0.5) * 70 : 0)
              : cameraX + 90 + ((d * 76) % (W - 140));
            const ty = tgt ? tgt.y : GROUND_MIN_Y + 14 + (d % 3) * 24;
            spawnFallenSkyDrop(tx, ty, 38, d * 6, 94);
          }
        }
      } else if (isRose()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 44, p.y, 18 + Math.random() * 34, tick % 12 === 0 ? "#ec4899" : "#f97316", 1, 1.4, 18);
        }
        // Lv.3 Finisher: 《煉獄拳・極限熾焰毀滅重轟》 Mass Psychic Lock + Colossal Inferno Fist!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.roseFinisherVisual = 36;
          p.invulnTimer = Math.max(p.invulnTimer, 36);
          window.sound.groundSlam();
          window.sound.aliceUltDomain();
          triggerShake(24, 7.5);
          triggerRemoteAoeStorm("rose", 6, 36, 90);
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 72,
            y: p.y,
            radius: 24,
            maxRadius: 240,
            color: "#f97316",
            life: 28,
            maxLife: 28,
          });
          spawnText("🔥 Lv.3 煉獄拳・極限熾焰毀滅重轟!", p.x, p.y - 94, "#fb923c", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, 68, 0.45);
              e.hurtTimer = 36;
              e.knockdownTimer = 32;
              e.vx = (e.x >= p.x ? 1 : -1) * 7.0;
              e.vz = 5.6;
              combo++;
              comboTimer = 135;
              score += 900;
              spawnParticles(e.x, e.y, 32, "#f97316", 14, 4.8, 22);
              spawnParticles(e.x, e.y, 26, "#ec4899", 8, 4.2, 20);
              spawnText(`煉獄拳 ${dealt}!`, e.x, e.y - 66, "#fb923c", 1.18);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isLing()) {
        if (tick % 6 === 0) {
          const cols = ["#2dd4bf", "#f8fafc", "#ef4444", "#38bdf8"];
          spawnParticles(p.x + (Math.random() - 0.5) * 48, p.y, 18 + Math.random() * 34, cols[(tick / 6) % 4], 1, 1.3, 18);
        }
        // Lv.3 Finisher: 《四象歸一・聖獸齊衝》 All 4 Divine Beasts Full-Screen Convergence!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.lingFinisherVisual = 36;
          p.invulnTimer = Math.max(p.invulnTimer, 36);
          window.sound.shakaUltActivate();
          triggerRemoteAoeStorm("ling", 6, 36, 90);
          triggerShake(22, 7.0);
          skillEffects.push({
            type: "shockwave",
            x: p.x,
            y: p.y,
            radius: 22,
            maxRadius: 235,
            color: "#fbbf24",
            life: 28,
            maxLife: 28,
          });
          spawnText("🏮 四象歸一・四聖獸齊衝爆裂!", p.x, p.y - 94, "#fde68a", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, 66, 0.40);
              e.hurtTimer = 34;
              e.knockdownTimer = 30;
              e.vx = (e.x >= p.x ? 1 : -1) * 6.6;
              e.vz = 5.4;
              combo++;
              comboTimer = 135;
              score += 880;
              spawnParticles(e.x, e.y, 32, "#2dd4bf", 10, 4.4, 22);
              spawnParticles(e.x, e.y, 28, "#ef4444", 10, 4.4, 22);
              spawnText(`四象歸一 ${dealt}!`, e.x, e.y - 66, "#fde68a", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isMagic()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 46, p.y, 18 + Math.random() * 34, tick % 12 === 0 ? "#c084fc" : "#9333ea", 1, 1.3, 18);
        }
        // Lv.3 Finisher: 《暗影女皇降臨・深淵紫光洪流》 Full-Screen Dark Sorcery Beam!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.magicFinisherVisual = 36;
          p.invulnTimer = Math.max(p.invulnTimer, 36);
          window.sound.aliceUltDomain();
          triggerRemoteAoeStorm("magic", 6, 36, 90);
          triggerShake(22, 7.0);
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 64,
            y: p.y,
            radius: 22,
            maxRadius: 230,
            color: "#a855f7",
            life: 28,
            maxLife: 28,
          });
          spawnText("🔮 暗影女皇降臨・深淵紫光洪流!", p.x, p.y - 94, "#e879f9", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, 64, 0.40);
              e.hurtTimer = 34;
              e.knockdownTimer = 30;
              e.vx = (e.x >= p.x ? 1 : -1) * 6.5;
              e.vz = 5.4;
              combo++;
              comboTimer = 135;
              score += 850;
              spawnParticles(e.x, e.y, 32, "#c084fc", 18, 4.5, 22);
              spawnText(`深淵紫光 ${dealt}!`, e.x, e.y - 66, "#e879f9", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isNightHeronHero()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 42, p.y, 16 + Math.random() * 34, tick % 12 === 0 ? "#38bdf8" : "#e0f2fe", 1, 1.2, 16);
        }
        // Lv.3 Finisher: 《合體呼叫：末班起飛（夜鷺視角）》 High-Altitude Diving Water Kick!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.nhFinisherVisual = 34;
          p.invulnTimer = Math.max(p.invulnTimer, 34);
          window.sound.bossDiveSwoop();
          window.sound.waterSweep();
          triggerShake(20, 6.5);
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 48,
            y: p.y,
            radius: 20,
            maxRadius: 215,
            color: "#38bdf8",
            life: 26,
            maxLife: 26,
          });
          spawnText("✈️ 末班起飛・雨夜天翔斜踢!", p.x, p.y - 92, "#7dd3fc", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, 60, 0.35);
              e.hurtTimer = 32;
              e.knockdownTimer = 30;
              e.vx = (e.x >= p.x ? 1 : -1) * 6.2;
              e.vz = 5.4;
              combo++;
              comboTimer = 135;
              score += 800;
              spawnParticles(e.x, e.y, 30, "#38bdf8", 16, 4.4, 22);
              spawnText(`天翔斜踢 ${dealt}!`, e.x, e.y - 64, "#7dd3fc", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isIronFistHero()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 38, p.y, 18 + Math.random() * 32, tick % 12 === 0 ? "#f8fafc" : "#f59e0b", 1, 1.2, 16);
        }
        // Lv.3 Finisher: 《合體呼叫：末班起飛》(Launch Night Heron + Twin Impact Explosion!)
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.ifFinisherVisual = 34;
          p.invulnTimer = Math.max(p.invulnTimer, 34);
          window.sound.bossDiveImpact();
          triggerShake(22, 7);
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 42,
            y: p.y,
            radius: 22,
            maxRadius: 210,
            color: "#f59e0b",
            life: 26,
            maxLife: 26,
          });
          spawnText("✈️ 合體技【末班起飛】爆裂!", p.x, p.y - 92, "#fcd34d", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, 60, 0.35);
              e.hurtTimer = 32;
              e.knockdownTimer = 30;
              e.vx = (e.x >= p.x ? 1 : -1) * 6.5;
              e.vz = 5.6;
              combo++;
              comboTimer = 135;
              score += 800;
              spawnParticles(e.x, e.y, 32, "#fcd34d", 16, 4.6, 22);
              spawnText(`末班起飛 ${dealt}!`, e.x, e.y - 64, "#fcd34d", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isAlice()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 44, p.y, 16 + Math.random() * 34, tick % 12 === 0 ? "#e11d48" : "#d4af37", 1, 1.1, 16);
        }
        // Passive domain aura: enemies within 185px suffer automatic Armor Break!
        if (tick % 16 === 0) {
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 185 && Math.abs(e.y - p.y) < 76) {
              e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 32);
            }
          }
        }
        // Lv.3 Full-Domain Linguistic Suppression Pulse!
        if (unlockedUltLevel >= 3 && tick % 40 === 0) {
          p.aliceDomainVisual = 18;
          window.sound.aliceVoiceCommand();
          skillEffects.push({
            type: "shockwave",
            x: p.x,
            y: p.y,
            radius: 20,
            maxRadius: 175,
            color: "#e11d48",
            life: 20,
            maxLife: 20,
          });
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 185 && Math.abs(e.y - p.y) < 78) {
              e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 90);
              e.hurtTimer = Math.max(e.hurtTimer, 22);
              const dealt = dealEnemyDamage(e, 16, 1.0);
              combo++;
              comboTimer = 135;
              score += 220;
              spawnParticles(e.x, e.y, 28, "#e11d48", 8, 2.8, 16);
              spawnText(`領域壓制 ${dealt}`, e.x, e.y - 58, "#fb7185", 0.95);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
        // Lv.3 Finisher: 《最高指令：「臣服」》 Cold Finger Snap full-screen true-damage burst!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.aliceSnapVisual = 30;
          p.invulnTimer = Math.max(p.invulnTimer, 30);
          window.sound.aliceFingerSnap();
          triggerShake(20, 6.5);
          skillEffects.push({
            type: "alice_snap_wave",
            x: p.x,
            y: p.y,
            life: 28,
            maxLife: 28,
          });
          spawnText("🌹 最高指令：「臣服」! 🌹", p.x, p.y - 88, "#fb7185", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 120);
              const dealt = dealEnemyDamage(e, 55, 1.0);
              e.hurtTimer = 30;
              e.knockdownTimer = 28;
              e.vx = (e.x >= p.x ? 1 : -1) * 5.4;
              e.vz = 5.0;
              combo++;
              comboTimer = 135;
              score += 750;
              spawnParticles(e.x, e.y, 30, "#e11d48", 16, 4.4, 22);
              spawnText(`臣服處決 ${dealt}!`, e.x, e.y - 64, "#fb7185", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isShaka()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 40, p.y, 18 + Math.random() * 38, tick % 12 === 0 ? "#fde68a" : "#e2e8f0", 1, 1.0, 18);
        }
        // Lv.3 Thousand-Hand 360° Array: Periodically binds & damages all nearby enemies!
        if (unlockedUltLevel >= 3 && tick % 42 === 0) {
          p.shakaArrayVisual = 20;
          window.sound.shakaBind();
          skillEffects.push({
            type: "shockwave",
            x: p.x,
            y: p.y,
            radius: 20,
            maxRadius: 165,
            color: "#fde68a",
            life: 20,
            maxLife: 20,
          });
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 175 && Math.abs(e.y - p.y) < 76) {
              e.bindTimer = Math.max(e.bindTimer || 0, 54);
              e.hurtTimer = Math.max(e.hurtTimer, 54);
              dealEnemyDamage(e, 16);
              combo++;
              comboTimer = 135;
              score += 220;
              spawnParticles(e.x, e.y, 32, "#fde68a", 8, 2.8, 16);
              spawnText("360° 千手定身 16", e.x, e.y - 58, "#fde68a", 0.95);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
        // Lv.3 Finisher: 《萬臂合一・金光天墜》 at the end of Ultimate!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.shakaFinisherVisual = 30;
          p.invulnTimer = Math.max(p.invulnTimer, 30);
          window.sound.shakaHeavenDrop();
          triggerRemoteAoeStorm("shaka", 6, 38, 92);
          triggerShake(20, 6.5);
          skillEffects.push({
            type: "shaka_heaven_pillar",
            x: p.x,
            y: p.y,
            life: 28,
            maxLife: 28,
          });
          spawnText("☸ 萬臂合一・金光天墜! ☸", p.x, p.y - 88, "#fde68a", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              dealEnemyDamage(e, 50);
              e.hurtTimer = 30;
              e.knockdownTimer = 28;
              e.vx = (e.x >= p.x ? 1 : -1) * 5.0;
              e.vz = 5.4;
              combo++;
              comboTimer = 135;
              score += 700;
              spawnParticles(e.x, e.y, 30, "#fbbf24", 16, 4.4, 22);
              spawnText("金光天墜 50!", e.x, e.y - 64, "#fde68a", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isRaven()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 34, p.y, 18 + Math.random() * 34, tick % 12 === 0 ? "#d4af37" : "#a855f7", 1, 1.1, 16);
        }
        // Lv.3 Gun Kata: Periodic 360° Eclipse Shuriken & Bullet Storm while Ultimate is active!
        if (unlockedUltLevel >= 3 && tick % 24 === 0) {
          p.ravenKataVisual = 14;
          for (let g = 0; g < 6; g++) {
            const ang = (g / 6) * Math.PI * 2 + tick * 0.08;
            skillEffects.push({
              type: "raven_proj",
              kind: "shuriken",
              x: p.x + Math.cos(ang) * 18,
              y: p.y + Math.sin(ang) * 6,
              z: p.z + 52,
              vx: Math.cos(ang) * 7.8,
              vy: Math.sin(ang) * 3.8,
              facing: Math.cos(ang) >= 0 ? 1 : -1,
              dmg: 14,
              poison: true,
              pierce: true,
              hitIds: new Set(),
              life: 24,
              maxLife: 24,
            });
          }
          window.sound.throwingKnife();
        }
        // Lv.3 Finisher: 《日蝕交叉處決》 — Full-screen Golden X-Cross Snipe at the end of Ultimate!
        if (unlockedUltLevel >= 3 && p.buffTimer === 1) {
          p.ravenFinisherVisual = 28;
          p.invulnTimer = Math.max(p.invulnTimer, 28);
          window.sound.dualCrossDash();
          triggerShake(18, 6);
          skillEffects.push({
            type: "eclipse_x_finisher",
            x: p.x,
            y: p.y,
            life: 26,
            maxLife: 26,
          });
          spawnText("✦ 日蝕交叉處決! ✦", p.x, p.y - 84, "#fcd34d", 1.35);
          for (const e of enemies) {
            if (e.dead) continue;
            if (e.x >= cameraX - 20 && e.x <= cameraX + W + 20) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              dealEnemyDamage(e, 45);
              e.hurtTimer = 28;
              e.knockdownTimer = 26;
              e.vx = (e.x >= p.x ? 1 : -1) * 5.8;
              e.vz = 5.0;
              combo++;
              comboTimer = 135;
              score += 650;
              spawnParticles(e.x, e.y, 32, "#fcd34d", 14, 4.2, 20);
              spawnText("日蝕處決 45!", e.x, e.y - 62, "#fcd34d", 1.15);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (isMomo()) {
        if (tick % 6 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 32, p.y, 18 + Math.random() * 34, "#ef4444", 1, 1.0, 16);
        }
      } else if (tick % 6 === 0) {
        spawnParticles(p.x + (Math.random() - 0.5) * 24, p.y, 14 + Math.random() * 28, "#38bdf8", 1, 1.2, 14);
      }
      if (p.buffTimer === 0) {
        window.sound.isBuff = false;
        spawnText(
          isRose() ? "煉獄收斂" : isLing() ? "四象歸寂" : isMagic() ? "裂界閉合" : isNightHeronHero() ? "雨幕消散" : isIronFistHero() ? "蒸氣收斂" : isAlice() ? "言靈領域消散" : isShaka() ? "千手收斂" : isRaven() ? "雙槍收鞘" : isMomo() ? "變回普通型態" : isSamurai() ? "劍氣消散" : "RELOAD READY TO CHARGE",
          p.x,
          p.y - 68,
          "#94a3b8",
          0.9
        );
      }
    } else if (p.reloadGauge < 100 && tick % 12 === 0) {
      p.reloadGauge = Math.min(100, p.reloadGauge + 1);
    }

    // Trigger Arm Reload
    if (justPressed["KeyR"] || justPressed["KeyL"] || justPressed["KeyC"]) {
      if (p.reloadGauge >= 100 && !isBuff()) {
        triggerArmReload();
        return;
      }
    }

    // Movement
    let dx = 0;
    let dy = 0;
    if (keys["KeyA"] || keys["ArrowLeft"]) dx -= 1;
    if (keys["KeyD"] || keys["ArrowRight"]) dx += 1;
    if (keys["KeyW"] || keys["ArrowUp"]) dy -= 1;
    if (keys["KeyS"] || keys["ArrowDown"]) dy += 1;

    const skillLocksMove =
      p.skillActiveTimer > 0 && (p.skillType === "shadow_dash" || p.skillType === "bat_blink" || p.skillType === "grapple_smoke" || p.skillType === "if_shoulder" || p.skillType === "nh_evade_kick");
    const canMove = !skillLocksMove && p.hurtTimer <= 0 && (p.attackTimer <= 4 || p.z > 0 || (isRaven() && isBuff()));
    const speedX = isBuff() ? 3.25 : 2.75;
    const speedY = isBuff() ? 2.15 : 1.85;

    if (canMove) {
      if (dx !== 0) p.facing = dx > 0 ? 1 : -1;
      p.x += dx * speedX;
      p.y += dy * speedY;
      if (dx !== 0 || dy !== 0) {
        p.walkFrame += 0.22;
        if (p.z === 0 && tick % 10 === 0) {
          particles.push({
            x: p.x - (dx !== 0 ? dx * 10 : p.facing * 8) + (Math.random() - 0.5) * 6,
            y: p.y + (Math.random() - 0.5) * 4,
            z: 2,
            vx: -(dx || p.facing) * 0.6 + (Math.random() - 0.5) * 0.4,
            vy: 0,
            vz: 0.45 + Math.random() * 0.35,
            color: "rgba(226, 232, 240, 0.55)",
            size: 3,
            life: 16,
            maxLife: 16,
          });
        }
      } else {
        p.walkFrame = 0;
      }
    }

    // Small Skill (Replaces Jump on K / X / #tbtn-jump)
    if ((justPressed["KeyK"] || justPressed["KeyX"]) && p.skillCd <= 0 && p.skillActiveTimer <= 0 && p.hurtTimer <= 0) {
      // Check for Perfect JUST DODGE! (activating [K] right as a nearby enemy winds up a strike!)
      const dodgedStrike = enemies.some(
        (e) =>
          !e.dead &&
          e.attackTimer >= 10 &&
          e.attackTimer <= 24 &&
          Math.abs(e.x - p.x) < 120 &&
          Math.abs(e.y - p.y) < 52
      );
      if (dodgedStrike) {
        p.reloadGauge = Math.min(100, p.reloadGauge + 22);
        justDodgeFlashTimer = 16;
        hitstop = Math.max(hitstop, 5);
        score += 500;
        if (window.sound.justDodge) window.sound.justDodge();
        if (window.shaderFX) {
          window.shaderFX.pulseAberration(0.6);
          window.shaderFX.triggerShockwave((p.x - cameraX) / W, (p.y - 30) / H, 0.038);
        }
        spawnParticles(p.x, p.y, 28, "#38bdf8", 14, 3.8, 18);
        spawnText("⚡ JUST DODGE! +22%氣", p.x, p.y - 90, "#38bdf8", 1.2);
      }
      if (isFallen()) {
        // 🪽 墮落天使 — 《審判降臨・骸靈天墜》(Invuln + Remote Sky-Drop Spectral Skull Pillars directly onto distant enemies!)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "fallen_judgment";
        p.skillActiveTimer = 28;
        p.skillImpactDone = false;
        p.invulnTimer = Math.max(p.invulnTimer, 34);
        window.sound.shakaUltActivate();
        spawnText("🪽 審判降臨・骸靈天墜!", p.x, p.y - 78, "#e9d5ff", 1.15);
      } else if (isRose()) {
        // 🔥 蘿絲 — 《精神支配・意識侵入》(Invuln Pink Psychic Brainwave Stun 2.0s + Crit Mark!)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "rose_psychic";
        p.skillActiveTimer = 26;
        p.skillImpactDone = false;
        p.invulnTimer = Math.max(p.invulnTimer, 30);
        window.sound.aliceVoiceCommand();
        spawnText("🧠 精神支配・意識侵入!", p.x, p.y - 74, "#f472b6", 1.12);
      } else if (isLing()) {
        // 🏮 鈴 — 《北方・玄武鎮海印》(Invuln Tortoise-Serpent Water Shield + 360° Pushback + 4 HP Heal!)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "ling_xuanwu";
        p.skillActiveTimer = 26;
        p.skillImpactDone = false;
        p.invulnTimer = Math.max(p.invulnTimer, 34);
        p.hp = Math.min(p.maxHp, p.hp + 4);
        window.sound.waterSweep();
        spawnText("🐢 北方・玄武鎮海印! (+4HP)", p.x, p.y - 74, "#38bdf8", 1.12);
      } else if (isMagic()) {
        // 🔮 瑪姬 — 《能量・牽引陣》(Invulnerable Purple Mist Backstep + Vortex Pull & Burst!)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "magic_vortex";
        p.skillActiveTimer = 26;
        p.skillImpactDone = false;
        p.skillStartX = p.x + p.facing * 56;
        p.skillStartY = p.y;
        p.skillDirX = dx !== 0 ? (dx > 0 ? 1 : -1) : -p.facing;
        p.invulnTimer = Math.max(p.invulnTimer, 28);
        window.sound.aliceVoiceCommand();
        spawnText("🔮 能量・牽引陣!", p.x, p.y - 74, "#c084fc", 1.12);
      } else if (isNightHeronHero()) {
        // 👞 夜鷺 — 《鞋跟輕叩・雨燕迴避踢》(Heel Tap -> Water Slide Evade -> Aerial Counter Kick!)
        p.skillCd = 150;
        p.skillMaxCd = 150;
        p.skillType = "nh_evade_kick";
        p.skillActiveTimer = 24;
        p.skillImpactDone = false;
        p.skillDirX = dx !== 0 ? (dx > 0 ? 1 : -1) : p.facing;
        p.facing = p.skillDirX;
        p.invulnTimer = Math.max(p.invulnTimer, 26);
        window.sound.heelTap();
        spawnText("叩！雨燕迴避踢!", p.x, p.y - 74, "#7dd3fc", 1.1);
      } else if (isIronFistHero()) {
        // 🥊 鐵拳 — 《繃帶緊束・鐵山靠》(Armored Shoulder Charge + Ground Slam!)
        p.skillCd = 168;
        p.skillMaxCd = 168;
        p.skillType = "if_shoulder";
        p.skillActiveTimer = 24;
        p.skillImpactDone = false;
        p.skillDirX = dx !== 0 ? (dx > 0 ? 1 : -1) : p.facing;
        p.facing = p.skillDirX;
        p.invulnTimer = Math.max(p.invulnTimer, 26);
        window.sound.punchSwing();
        spawnText("🥊 繃帶緊束・鐵山靠!", p.x, p.y - 74, "#f8fafc", 1.12);
      } else if (isAlice()) {
        // 🌹 Alice — 《言靈指令：「跪下！」》(Linguistic Control Armor Break + Pushback!)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "alice_voice";
        p.skillActiveTimer = 24;
        p.skillImpactDone = false;
        p.aliceCmdHit = false;
        p.invulnTimer = Math.max(p.invulnTimer, 26);
        window.sound.aliceVoiceCommand();
        spawnText("🌹 言靈指令：「跪下！」", p.x, p.y - 74, "#fb7185", 1.12);
      } else if (isShaka()) {
        // ☸️ 釋迦 — 《千手束縛・金剛鎖》(Restrain Bind / Golden Barrier)
        p.skillCd = 192;
        p.skillMaxCd = 192;
        p.skillType = "shaka_bind";
        p.skillActiveTimer = 26;
        p.skillImpactDone = false;
        p.shakaBindHit = false;
        p.invulnTimer = Math.max(p.invulnTimer, 28);
        p.z = Math.max(p.z, 10);
        p.vz = 2.6; // Brief divine hover clearing low sweeps!
        window.sound.shakaBind();
        spawnText("☸ 千手束縛・金剛鎖!", p.x, p.y - 74, "#fde68a", 1.1);
      } else if (isSamurai()) {
        // ⚔️ 街頭武士 — 《殘影瞬步・居合》(Shadow Dash Slash)
        p.skillCd = 150;
        p.skillMaxCd = 150;
        p.skillType = "shadow_dash";
        p.skillActiveTimer = 16;
        p.skillImpactDone = false;
        p.skillStartX = p.x;
        p.skillStartY = p.y;
        p.skillDirX = dx !== 0 ? (dx > 0 ? 1 : -1) : p.facing;
        p.facing = p.skillDirX;
        p.invulnTimer = Math.max(p.invulnTimer, 22);
        window.sound.shadowDash();
        spawnText("殘影瞬步!", p.x, p.y - 68, "#38bdf8", 1.05);
      } else if (isRaven()) {
        // 🐦‍⬛ Raven — 《煙霧鉤爪・影襲》(Smoke & Grapple)
        p.skillCd = 168;
        p.skillMaxCd = 168;
        p.skillType = "grapple_smoke";
        p.skillActiveTimer = 16;
        p.skillImpactDone = false;
        p.skillStartX = p.x;
        p.skillStartY = p.y;
        p.skillDirX = dx !== 0 ? (dx > 0 ? 1 : -1) : p.facing;
        p.facing = p.skillDirX;
        p.invulnTimer = Math.max(p.invulnTimer, 24);
        window.sound.grappleSmoke();

        // Pop shadow smoke bomb at origin (briefly staggers nearby foes!)
        skillEffects.push({
          type: "mist_cloud",
          x: p.x,
          y: p.y,
          isBlood: false,
          isShadow: true,
          life: 110,
          maxLife: 110,
          tickTimer: 6,
        });
        spawnParticles(p.x, p.y, 26, "#475569", 16, 3.6, 20);
        spawnParticles(p.x, p.y, 24, "#d4af37", 8, 2.8, 16);

        // Search for nearest living enemy in front to hook!
        let hooked = null;
        let bestDist = 225;
        for (const e of enemies) {
          if (e.dead) continue;
          const relX = (e.x - p.x) * p.skillDirX;
          const relY = Math.abs(e.y - p.y);
          if (relX > 18 && relX < bestDist && relY < 52) {
            bestDist = relX;
            hooked = e;
          }
        }
        p.grappleTarget = hooked;
        const lineEndX = hooked ? hooked.x : p.x + p.skillDirX * 124;
        const lineEndY = hooked ? hooked.y : p.y;
        skillEffects.push({
          type: "grapple_line",
          x1: p.x,
          y1: p.y,
          x2: lineEndX,
          y2: lineEndY,
          life: 15,
          maxLife: 15,
        });
        spawnText(hooked ? "⛓ 煙霧鉤爪・鎖定!" : "💨 煙霧鉤爪・影遁!", p.x, p.y - 68, "#d4af37", 1.05);
      } else if (isMomo()) {
        // 🦇 Momo — 《血蝠瞬閃》(Bat Blink)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "bat_blink";
        p.skillActiveTimer = 15;
        p.skillImpactDone = false;
        p.skillStartX = p.x;
        p.skillStartY = p.y;
        if (dx !== 0 || dy !== 0) {
          const len = Math.hypot(dx, dy) || 1;
          p.skillDirX = dx / len;
          p.skillDirY = dy / len;
        } else {
          // Default: blink backward away from facing to create safe spray distance!
          p.skillDirX = -p.facing;
          p.skillDirY = 0;
        }
        p.invulnTimer = Math.max(p.invulnTimer, 24);
        window.sound.batBlink();
        const isBlood = isBuff();
        // Leave persistent Orange-Red Pepper Mist (normal) or Crimson Blood Mist (vampire) at origin!
        skillEffects.push({
          type: "mist_cloud",
          x: p.x,
          y: p.y,
          isBlood,
          life: 145,
          maxLife: 145,
          tickTimer: 4,
        });
        // Burst black-red bat swarm!
        for (let b = 0; b < 10; b++) {
          skillEffects.push({
            type: "bat_swarm",
            x: p.x + (Math.random() - 0.5) * 26,
            y: p.y + (Math.random() - 0.5) * 14,
            z: 18 + Math.random() * 34,
            vx: p.skillDirX * (5.5 + Math.random() * 4.5) + (Math.random() - 0.5) * 1.8,
            vy: p.skillDirY * (3.5 + Math.random() * 2.5) + (Math.random() - 0.5) * 1.4,
            vz: (Math.random() - 0.5) * 1.6,
            phase: Math.random() * Math.PI * 2,
            life: 20 + Math.floor(Math.random() * 10),
            maxLife: 30,
          });
        }
        spawnText(isBlood ? "🦇 血蝠瞬閃・血霧!" : "🦇 血蝠瞬閃・防狼霧!", p.x, p.y - 68, isBlood ? "#fb7185" : "#fb923c", 1.05);
      } else {
        // 👨🏻 八字鬍英雄 — 《重裝震地槌》(Ground Slam)
        p.skillCd = 180;
        p.skillMaxCd = 180;
        p.skillType = "ground_slam";
        p.skillActiveTimer = 34;
        p.skillImpactDone = false;
        p.vz = 6.2;
        p.z = 2;
        p.invulnTimer = Math.max(p.invulnTimer, 24);
        window.sound.jump();
        spawnText("重裝震地槌!", p.x, p.y - 72, "#fcd34d", 1.1);
      }
    }

    // Gravity
    if (p.z > 0 || p.vz > 0) {
      p.z += p.vz;
      p.vz -= p.skillType === "ground_slam" && p.vz < 0 ? 0.85 : 0.38;
      if (p.z <= 0) {
        p.z = 0;
        p.vz = 0;
      }
    }

    // Active Small Skill Choreography
    if (p.skillActiveTimer > 0) {
      p.skillActiveTimer--;
      if (p.skillType === "fallen_judgment") {
        if (p.skillActiveTimer % 3 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 36, p.y, 34, "#e9d5ff", 2, 1.8, 16);
        }
        if (p.skillActiveTimer <= 18 && !p.skillImpactDone) {
          p.skillImpactDone = true;
          triggerFallenRemoteJudgment(isBuff() ? 4 : 3, isBuff() ? 30 : 22, 88);
        }
      } else if (p.skillType === "rose_psychic") {
        if (p.skillActiveTimer % 3 === 0) {
          spawnParticles(p.x + p.facing * 42 + (Math.random() - 0.5) * 38, p.y, 28, "#ec4899", 3, 2.4, 16);
        }
        if (p.skillActiveTimer <= 15 && !p.skillImpactDone) {
          p.skillImpactDone = true;
          triggerShake(8, 3.8);
          triggerRemoteAoe("rose", isBuff() ? 3 : 2, isBuff() ? 26 : 18, 84);
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 64,
            y: p.y,
            radius: 16,
            maxRadius: 148,
            color: "#ec4899",
            life: 20,
            maxLife: 20,
          });
          const dmg = isBuff() ? 24 : 16;
          for (const e of enemies) {
            if (e.dead) continue;
            const inFront = (e.x - p.x) * p.facing > -36 && Math.abs(e.x - p.x) < 176;
            if (inFront && Math.abs(e.y - p.y) < 62) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, dmg, 0.25);
              e.hurtTimer = Math.max(e.hurtTimer, 120); // 2.0s Psychic Stun!
              e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 140); // Exposed to Fire Fist crit!
              combo++;
              comboTimer = 135;
              score += dealt * 12;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 6);
              spawnParticles(e.x, e.y, 44, "#f472b6", 12, 3.2, 20);
              spawnText(`精神支配 ${dealt}!`, e.x, e.y - 62, "#f472b6", 1.08);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (p.skillType === "ling_xuanwu") {
        if (p.skillActiveTimer % 3 === 0) {
          spawnParticles(p.x + (Math.random() - 0.5) * 46, p.y, 18, "#38bdf8", 3, 2.2, 16);
        }
        if (p.skillActiveTimer <= 13 && !p.skillImpactDone) {
          p.skillImpactDone = true;
          triggerRemoteAoe("ling", isBuff() ? 3 : 2, isBuff() ? 26 : 18, 84);
          window.sound.groundSlam();
          triggerShake(10, 4.5);
          skillEffects.push({
            type: "shockwave",
            x: p.x,
            y: p.y,
            radius: 18,
            maxRadius: 142,
            color: "#38bdf8",
            life: 20,
            maxLife: 20,
          });
          spawnParticles(p.x, p.y, 20, "#7dd3fc", 20, 4.8, 20);
          const dmg = isBuff() ? 26 : 18;
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 140 && Math.abs(e.y - p.y) < 64) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, dmg, 0.2);
              e.hurtTimer = 26;
              e.knockdownTimer = 22;
              e.vx = (e.x >= p.x ? 1 : -1) * 6.5;
              e.vz = 4.6;
              combo++;
              comboTimer = 135;
              score += dealt * 12;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 5);
              spawnText(`玄武震退 ${dealt}!`, e.x, e.y - 60, "#7dd3fc", 1.05);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (p.skillType === "magic_vortex") {
        // Phase 1: Graceful purple-mist shadow step away while pulling nearby enemies into vortex center!
        if (p.skillActiveTimer === 21) {
          triggerRemoteAoe("magic", isBuff() ? 3 : 2, isBuff() ? 26 : 18, 84);
        }
        if (p.skillActiveTimer >= 16 && p.skillActiveTimer <= 22) {
          p.x += p.skillDirX * 6.5;
          if (p.skillActiveTimer % 2 === 0) {
            spawnParticles(p.x, p.y, 26, "#c084fc", 4, 2.2, 16);
          }
        }
        const vx = p.skillStartX;
        const vy = p.skillStartY;
        if (p.skillActiveTimer > 7) {
          // Pull nearby enemies toward vortex center
          for (const e of enemies) {
            if (e.dead) continue;
            const ddx = vx - e.x;
            const ddy = vy - e.y;
            if (Math.abs(ddx) < 138 && Math.abs(ddy) < 62) {
              e.x += ddx * 0.14;
              e.y += ddy * 0.14;
              e.hurtTimer = Math.max(e.hurtTimer, 6);
            }
          }
          if (p.skillActiveTimer % 3 === 0) {
            spawnParticles(vx + (Math.random() - 0.5) * 44, vy, 14, "#a855f7", 3, 2.4, 14);
          }
        } else if (!p.skillImpactDone) {
          // Phase 2: Violet Vortex Explosion!
          p.skillImpactDone = true;
          window.sound.groundSlam();
          triggerShake(10, 4.5);
          skillEffects.push({
            type: "shockwave",
            x: vx,
            y: vy,
            radius: 16,
            maxRadius: 132,
            color: "#c084fc",
            life: 20,
            maxLife: 20,
          });
          spawnParticles(vx, vy, 22, "#e879f9", 20, 4.8, 20);
          const dmg = isBuff() ? 28 : 20;
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - vx) < 134 && Math.abs(e.y - vy) < 62) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const dealt = dealEnemyDamage(e, dmg, 0.2);
              e.hurtTimer = 26;
              e.knockdownTimer = 20;
              e.vx = (e.x >= vx ? 1 : -1) * 4.8;
              e.vz = 4.2;
              combo++;
              comboTimer = 135;
              score += dealt * 12;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 5);
              spawnText(`牽引爆裂 ${dealt}!`, e.x, e.y - 60, "#e879f9", 1.05);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (p.skillType === "ground_slam") {
        // Slight forward arc while airborne, then heavy seismic slam!
        if (p.z > 0) {
          p.x += p.facing * 1.8;
        }
        if (p.z <= 0 && !p.skillImpactDone && p.skillActiveTimer < 30) {
          p.skillImpactDone = true;
          p.skillActiveTimer = Math.min(p.skillActiveTimer, 6);
          window.sound.groundSlam();
          triggerShake(12, 5);
          if (window.shaderFX) {
            window.shaderFX.pulseAberration(0.45);
            window.shaderFX.triggerShockwave((p.x - cameraX) / W, p.y / H, 0.045);
          }
          skillEffects.push({
            type: "shockwave",
            x: p.x,
            y: p.y,
            radius: 18,
            maxRadius: 128,
            color: isBuff() ? "#38bdf8" : "#fbbf24",
            life: 20,
            maxLife: 20,
          });
          spawnParticles(p.x, p.y, 10, "#fcd34d", 24, 5.2, 20);
          spawnParticles(p.x, p.y, 6, "#f97316", 12, 3.8, 16);
          const dmg = isBuff() ? 24 : 16;
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - p.x) < 126 && Math.abs(e.y - p.y) < 58) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              dealEnemyDamage(e, dmg);
              e.hurtTimer = 24;
              e.knockdownTimer = 22;
              const pushDir = e.x >= p.x ? 1 : -1;
              e.vx = pushDir * 6.0;
              e.vz = 4.8;
              combo++;
              comboTimer = 135;
              score += dmg * 12;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 5);
              spawnParticles(e.x, e.y, 24, "#fcd34d", 8, 3.2, 16);
              spawnText(`震地 ${dmg}!`, e.x, e.y - 58, "#fcd34d", 1.05);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (p.skillType === "shadow_dash") {
        if (p.skillActiveTimer >= 5) {
          p.x += p.skillDirX * 12.2;
          if (p.skillActiveTimer % 2 === 0) {
            skillEffects.push({
              type: "afterimage",
              x: p.x,
              y: p.y,
              z: p.z,
              facing: p.facing,
              life: 14,
              maxLife: 14,
            });
            spawnParticles(p.x, p.y, p.z + 28, p.skillActiveTimer % 4 === 0 ? "#38bdf8" : "#a855f7", 3, 2.0, 12);
          }
        } else if (!p.skillImpactDone) {
          // Queue the delayed silver-white Iaido blade flash along the dash path!
          p.skillImpactDone = true;
          skillEffects.push({
            type: "delayed_iaido",
            x1: p.skillStartX,
            y1: p.skillStartY,
            x2: p.x,
            y2: p.y,
            facing: p.skillDirX,
            delay: 9,
            detonated: false,
            life: 24,
            maxLife: 24,
            dmg: isBuff() ? 26 : 18,
          });
        }
      } else if (p.skillType === "bat_blink") {
        if (p.skillActiveTimer >= 4) {
          p.x += p.skillDirX * 8.6;
          p.y += p.skillDirY * 5.2;
          if (p.skillActiveTimer % 3 === 0) {
            spawnParticles(p.x, p.y, 28, isBuff() ? "#ef4444" : "#fb923c", 3, 2.0, 12);
          }
        }
      } else if (p.skillType === "nh_evade_kick") {
        // Heel tap(24..20) -> Water slide evade(19..12) -> Aerial counter kick(11..5) -> Elegant land(4..1)
        if (p.skillActiveTimer <= 19 && p.skillActiveTimer >= 12) {
          p.x += p.skillDirX * 8.8;
          if (p.skillActiveTimer % 2 === 0) {
            spawnParticles(p.x - p.skillDirX * 14, p.y, 12, "#38bdf8", 3, 2.2, 12);
          }
        } else if (p.skillActiveTimer === 11 && !p.skillImpactDone) {
          p.skillImpactDone = true;
          p.z = Math.max(p.z, 18);
          p.vz = 2.8;
          window.sound.waterSweep();
          spawnSlashEffect(p.x + p.facing * 32, p.y, 34, p.facing, -0.35, 52, "#38bdf8", 12);
          for (const e of enemies) {
            if (e.dead) continue;
            const relX = (e.x - p.x) * p.facing;
            if (relX > -24 && relX < 120 && Math.abs(e.y - p.y) < 46) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const kDmg = isBuff() ? 26 : 18;
              const dealt = dealEnemyDamage(e, kDmg);
              e.hurtTimer = 24;
              e.vx = p.facing * 5.2;
              e.vz = 4.4;
              combo++;
              comboTimer = 135;
              score += dealt * 14;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 8);
              spawnParticles(e.x, e.y, 30, "#38bdf8", 10, 3.2, 16);
              spawnText(`反身斜踢 ${dealt}!`, e.x, e.y - 60, "#7dd3fc", 1.08);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (p.skillType === "if_shoulder") {
        // Phase: Wrap(24..19) -> Guard(18..14) -> High-Speed Shoulder Charge(13..5) -> Slam Finish(4..1)
        if (p.skillActiveTimer <= 13 && p.skillActiveTimer >= 5) {
          p.x += p.skillDirX * 10.5;
          if (p.skillActiveTimer % 2 === 0) {
            spawnParticles(p.x - p.skillDirX * 16, p.y, 28, "#f8fafc", 3, 2.2, 12);
          }
          for (const e of enemies) {
            if (e.dead || (e._ifHitTick && tick - e._ifHitTick < 14)) continue;
            if (Math.abs(e.x - p.x) < 56 && Math.abs(e.y - p.y) < 38) {
              e._ifHitTick = tick;
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              const sDmg = isBuff() ? 28 : 20;
              const dealt = dealEnemyDamage(e, sDmg);
              e.hurtTimer = 28;
              e.knockdownTimer = 24;
              e.vx = p.skillDirX * 6.4;
              e.vz = 4.6;
              combo++;
              comboTimer = 135;
              score += dealt * 14;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 8);
              window.sound.punchHit(true);
              triggerShake(10, 4);
              spawnParticles(e.x, e.y, 30, "#f8fafc", 12, 3.6, 18);
              spawnText(`鐵山靠 ${dealt}!`, e.x, e.y - 60, "#fcd34d", 1.1);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        } else if (!p.skillImpactDone && p.skillActiveTimer <= 4) {
          p.skillImpactDone = true;
          window.sound.groundSlam();
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.skillDirX * 22,
            y: p.y,
            radius: 16,
            maxRadius: 96,
            color: "#f8fafc",
            life: 16,
            maxLife: 16,
          });
        }
      } else if (p.skillType === "alice_voice") {
        // Emit crimson-gold Linguistic Soundwave at frame 16 (after choker-touch whisper)
        if (!p.skillImpactDone && p.skillActiveTimer <= 16) {
          p.skillImpactDone = true;
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * 44,
            y: p.y,
            radius: 18,
            maxRadius: 132,
            color: "#e11d48",
            life: 18,
            maxLife: 18,
          });
          let hitAny = false;
          const cmdDmg = isBuff() ? 26 : 18;
          for (const e of enemies) {
            if (e.dead) continue;
            const relX = (e.x - p.x) * p.facing;
            const relY = Math.abs(e.y - p.y);
            if (relX > -45 && relX < 185 && relY < 56) {
              hitAny = true;
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              // 2.5 seconds of FULL Armor Break (shreds 35%/45% boss armor to 0%!)
              e.armorBreakTimer = 150;
              e.hurtTimer = Math.max(e.hurtTimer, 34);
              const dealt = dealEnemyDamage(e, cmdDmg, 1.0);
              if (Math.abs(e.x - p.x) < 62) {
                e.vx = (e.x >= p.x ? 1 : -1) * 5.2; // Push back crowded mobs!
              }
              combo++;
              comboTimer = 135;
              score += dealt * 14;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 8);
              spawnParticles(e.x, e.y, 32, "#e11d48", 10, 3.2, 18);
              spawnParticles(e.x, e.y, 28, "#d4af37", 6, 2.6, 16);
              spawnText(`破甲支配 ${dealt}!`, e.x, e.y - 62, "#fb7185", 1.08);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
          p.aliceCmdHit = hitAny;
          if (hitAny) triggerShake(9, 4);
        }
      } else if (p.skillType === "shaka_bind") {
        // Execute grab at frame 18 (after float -> 4-arm reach)
        if (!p.skillImpactDone && p.skillActiveTimer <= 17) {
          p.skillImpactDone = true;
          triggerRemoteAoe("shaka", isBuff() ? 3 : 2, isBuff() ? 28 : 20, 86);
          const grabbed = [];
          for (const e of enemies) {
            if (e.dead) continue;
            const relX = (e.x - p.x) * p.facing;
            const relY = Math.abs(e.y - p.y);
            if (relX > -12 && relX < 185 && relY < 54) {
              grabbed.push(e);
            }
          }
          if (grabbed.length > 0) {
            p.shakaBindHit = true;
            window.sound.shakaClap();
            triggerShake(10, 4);
            const bindDmg = isBuff() ? 26 : 18;
            for (const e of grabbed) {
              if (currentStage === 6 && window.AirportStage) {
                window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
              }
              e.bindTimer = 90; // 1.5s full restrain freeze!
              e.hurtTimer = Math.max(e.hurtTimer, 90);
              dealEnemyDamage(e, bindDmg);
              combo++;
              comboTimer = 135;
              score += bindDmg * 14;
              if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 8);
              spawnParticles(e.x, e.y, 30, "#fde68a", 12, 3.4, 20);
              spawnText(`金剛鎖定身 ${bindDmg}!`, e.x, e.y - 62, "#fde68a", 1.05);
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          } else {
            // Missed grab -> Deploy Golden Spectral Barrier pushing nearby foes away!
            p.shakaBindHit = false;
            window.sound.shakaPalm();
            skillEffects.push({
              type: "shockwave",
              x: p.x + p.facing * 26,
              y: p.y,
              radius: 16,
              maxRadius: 92,
              color: "#fde68a",
              life: 16,
              maxLife: 16,
            });
            spawnText("金色護障!", p.x + p.facing * 32, p.y - 66, "#fde68a", 1.0);
            for (const e of enemies) {
              if (e.dead) continue;
              if (Math.abs(e.x - p.x) < 92 && Math.abs(e.y - p.y) < 46) {
                e.vx = (e.x >= p.x ? 1 : -1) * 5.2;
                e.hurtTimer = Math.max(e.hurtTimer, 18);
              }
            }
          }
        }
      } else if (p.skillType === "grapple_smoke") {
        const tgt = p.grappleTarget;
        if (tgt && !tgt.dead) {
          // Zip rapidly to BEHIND the hooked target!
          const destX = tgt.x + p.skillDirX * 36;
          const destY = tgt.y;
          p.x += (destX - p.x) * 0.34;
          p.y += (destY - p.y) * 0.34;
          if (p.skillActiveTimer % 2 === 0) {
            spawnParticles(p.x, p.y, 28, "#d4af37", 2, 1.8, 10);
          }
          if (!p.skillImpactDone && p.skillActiveTimer <= 5) {
            p.skillImpactDone = true;
            p.facing = -p.skillDirX; // Spin to face target's back!
            if (currentStage === 6 && window.AirportStage) {
              window.AirportStage.tryInterruptTeamCombo(tgt, spawnText, spawnParticles, triggerShake);
            }
            const backDmg = isBuff() ? 32 : 24;
            dealEnemyDamage(tgt, backDmg);
            tgt.hurtTimer = 26;
            tgt.poisonTimer = 120;
            tgt.vx = -p.facing * 4.5;
            combo++;
            comboTimer = 135;
            score += backDmg * 15;
            if (!isBuff()) p.reloadGauge = Math.min(100, p.reloadGauge + 10);
            window.sound.katanaHit(true);
            triggerShake(9, 4);
            spawnSlashEffect(tgt.x, tgt.y, 32, p.facing, -0.5, 48, "#d4af37", 12);
            spawnSlashEffect(tgt.x, tgt.y, 28, p.facing, 0.5, 48, "#a855f7", 12);
            spawnParticles(tgt.x, tgt.y, 30, "#d4af37", 14, 3.8, 18);
            spawnText(`暗殺背刺 ${backDmg}!`, tgt.x, tgt.y - 62, "#fcd34d", 1.15);
            if (tgt.hp <= 0) {
              tgt.vx = p.facing * 5.2;
              tgt.vz = 4.4;
              handleEnemyDefeat(tgt);
            }
          }
        } else {
          // No enemy hooked: high-speed grapple shadow escape!
          if (p.skillActiveTimer >= 4) {
            p.x += p.skillDirX * 9.5;
            if (p.skillActiveTimer % 3 === 0) {
              spawnParticles(p.x, p.y, 26, "#94a3b8", 3, 2.0, 12);
            }
          }
        }
      }
      if (p.skillActiveTimer === 0) {
        p.skillType = null;
        p.grappleTarget = null;
      }
    }

    // Attack / Katana Slash / Momo Pepper Spray & Vampire Claws / Raven Dagger & Dual Pistols / Shaka Spectral Arms / Alice Brass Knuckles!
    const samurai = isSamurai();
    const momo = isMomo();
    const raven = isRaven();
    const shaka = isShaka();
    const alice = isAlice();
    const ironfist = isIronFistHero();
    const nightheron = isNightHeronHero();
    const magic = isMagic();
    const ling = isLing();
    const rose = isRose();
    if ((justPressed["KeyJ"] || justPressed["KeyZ"] || justPressed["Space"] || touchAtkHeld) && p.attackTimer <= ((samurai || momo || raven || shaka || alice || ironfist || nightheron || magic || ling || rose) && isBuff() ? 5 : 3) && p.hurtTimer <= 0) {
      const fallen = isFallen();
      p.attackTimer = fallen ? (isBuff() ? 11 : 13) : rose ? (isBuff() ? 10 : 12) : ling ? (isBuff() ? 11 : 13) : magic ? (isBuff() ? 11 : 13) : nightheron ? (isBuff() ? 11 : 13) : ironfist ? (isBuff() ? 12 : 14) : alice ? (isBuff() ? 10 : 12) : shaka ? (isBuff() ? 13 : 15) : raven ? (isBuff() ? 10 : 12) : momo ? (isBuff() ? 12 : 16) : samurai ? (isBuff() ? 11 : 14) : (isBuff() ? 15 : 14);
      p.attackType = (p.attackType + 1) % 3;
      p.attackHitDone = false;
      if (fallen) {
        if (isBuff()) {
          window.sound.katanaSlash(p.attackType === 2);
          // Launch from Fallen Angel's wing/sword sweep height (targetH=112 -> z≈64)!
          spawnSwordWave(p.x + p.facing * 54, p.y, p.z + 64, p.facing, p.attackType === 2 ? "#c084fc" : "#f8fafc", false, "vfx_proj_fallen", p.attackType === 2);
          if (unlockedUltLevel >= 1 && p.attackType === 2) {
            spawnSwordWave(p.x + p.facing * 40, p.y - 6, p.z + 56, p.facing, "#fde047", false, "vfx_proj_fallen", true);
          }
          // Lv.2+ Punishing Slash: Combo finisher drops a targeted Remote Sky-Drop Skull Pillar right onto a distant enemy!
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            triggerFallenRemoteJudgment(1, 28, 86);
          }
        } else {
          window.sound.punchSwing();
          if (p.attackType === 2) {
            // 3rd Hit: Wing Wind Pressure Wave knocking back a whole row!
            spawnSwordWave(p.x + p.facing * 52, p.y, p.z + 64, p.facing, "#e2e8f0", false, "vfx_proj_fallen", false);
            spawnParticles(p.x + p.facing * 52, p.y, p.z + 62, "#f8fafc", 12, 4.0, 16);
          } else {
            spawnParticles(p.x + p.facing * 42, p.y, p.z + 60, "#e9d5ff", 6, 3.0, 14);
          }
        }
      } else if (rose) {
        const fistSprite =
          isBuff() && unlockedUltLevel >= 3
            ? "vfx_firefist_lv3"
            : isBuff() && unlockedUltLevel >= 2
            ? "vfx_firefist_lv2"
            : "vfx_firefist_lv1";
        if (isBuff()) {
          window.sound.punchHit(true);
          // Launch directly from Rose's outstretched punching fist (shoulder height z ≈ 64)!
          spawnSwordWave(p.x + p.facing * 58, p.y, p.z + 64, p.facing, "#f97316", false, fistSprite, unlockedUltLevel >= 2);
          spawnParticles(p.x + p.facing * 58, p.y, p.z + 64, "#fb923c", 8, 3.2, 14);
          if (unlockedUltLevel >= 1 && p.attackType === 2) {
            spawnSwordWave(p.x + p.facing * 44, p.y - 6, p.z + 58, p.facing, "#fbbf24", false, fistSprite, true);
          }
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            skillEffects.push({
              type: "shockwave",
              x: p.x + p.facing * 58,
              y: p.y,
              radius: 18,
              maxRadius: 142,
              color: "#f97316",
              life: 18,
              maxLife: 18,
            });
          }
        } else {
          window.sound.punchSwing();
          if (p.attackType === 2) {
            // 3rd Hit: Blazing Flying Fire Fist straight out of Rose's punching fist!
            spawnSwordWave(p.x + p.facing * 56, p.y, p.z + 64, p.facing, "#f97316", false, "vfx_firefist_lv1", false);
            spawnParticles(p.x + p.facing * 56, p.y, p.z + 64, "#fb923c", 10, 3.6, 16);
          } else {
            spawnParticles(p.x + p.facing * 46, p.y, p.z + 64, "#f97316", 6, 2.8, 12);
          }
        }
      } else if (ling) {
        if (isBuff()) {
          window.sound.waterSweep();
          const beastColors = ["#f8fafc", "#2dd4bf", "#ef4444"];
          // Launch from Ling's spirit-summoning palm height (targetH=112 -> z≈58)!
          spawnSwordWave(p.x + p.facing * 54, p.y, p.z + 58, p.facing, beastColors[p.attackType], false, "vfx_proj_ling", p.attackType === 2);
          if (unlockedUltLevel >= 1) {
            spawnSwordWave(p.x + p.facing * 40, p.y - 8, p.z + 52, p.facing, "#fbbf24", false, "vfx_proj_ling", true);
          }
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            skillEffects.push({
              type: "shockwave",
              x: p.x + p.facing * 68,
              y: p.y,
              radius: 18,
              maxRadius: 138,
              color: "#ef4444",
              life: 18,
              maxLife: 18,
            });
          }
        } else {
          if (p.attackType === 0) {
            // 白虎撲擊
            window.sound.punchSwing();
            spawnParticles(p.x + p.facing * 48, p.y, p.z + 54, "#f8fafc", 10, 3.4, 14);
          } else if (p.attackType === 1) {
            // 青龍風雷貫穿
            window.sound.waterSweep();
            spawnSwordWave(p.x + p.facing * 50, p.y, p.z + 58, p.facing, "#2dd4bf", false, "vfx_proj_ling", false);
          } else {
            // 朱雀熾焰爆燃
            window.sound.katanaSlash();
            spawnSwordWave(p.x + p.facing * 52, p.y, p.z + 58, p.facing, "#ef4444", false, "vfx_proj_ling", true);
          }
        }
      } else if (magic) {
        if (isBuff()) {
          window.sound.aliceVoiceCommand();
          // Launch from Magic's outstretched dark-magic casting hand (targetH=114 -> z≈62)!
          spawnSwordWave(p.x + p.facing * 52, p.y, p.z + 62, p.facing, "#c084fc", true, "vfx_proj_magic", true);
          if (unlockedUltLevel >= 1) {
            spawnSwordWave(p.x + p.facing * 38, p.y - 8, p.z + 56, p.facing, "#a855f7", false, "vfx_proj_magic", false);
          }
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            skillEffects.push({
              type: "shockwave",
              x: p.x + p.facing * 64,
              y: p.y,
              radius: 18,
              maxRadius: 132,
              color: "#e879f9",
              life: 18,
              maxLife: 18,
            });
          }
        } else {
          if (p.attackType === 0) {
            window.sound.shurikenThrow ? window.sound.shurikenThrow() : window.sound.punchSwing();
            spawnSwordWave(p.x + p.facing * 48, p.y, p.z + 60, p.facing, "#c084fc", false, "vfx_proj_magic", false);
          } else if (p.attackType === 1) {
            window.sound.aliceVoiceCommand();
            spawnSwordWave(p.x + p.facing * 50, p.y, p.z + 60, p.facing, "#a855f7", false, "vfx_proj_magic", false);
          } else {
            window.sound.katanaSlash();
            spawnParticles(p.x + p.facing * 54, p.y, p.z + 58, "#c084fc", 12, 3.6, 16);
          }
        }
      } else if (nightheron) {
        if (isBuff()) {
          window.sound.waterSweep();
          // Launch from Night Heron's kicking foot (mid-high kick z≈48)!
          spawnSwordWave(p.x + p.facing * 48, p.y, p.z + 48, p.facing, "#38bdf8", false, "vfx_proj_nightheron", true);
          if (unlockedUltLevel >= 1) {
            spawnSwordWave(p.x + p.facing * 36, p.y - 8, p.z + 52, p.facing, "#e0f2fe", false, "vfx_proj_nightheron", false);
          }
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            skillEffects.push({
              type: "shockwave",
              x: p.x + p.facing * 42,
              y: p.y,
              radius: 16,
              maxRadius: 118,
              color: "#38bdf8",
              life: 16,
              maxLife: 16,
            });
          }
        } else {
          if (p.attackType === 2) {
            window.sound.waterSweep();
            // 3rd-hit sweep kick water blade (foot level z≈34)!
            spawnSwordWave(p.x + p.facing * 46, p.y, p.z + 34, p.facing, "#38bdf8", false, "vfx_proj_nightheron", false);
          } else {
            window.sound.punchSwing();
          }
        }
      } else if (ironfist) {
        if (isBuff()) {
          window.sound.punchHit(true);
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            // Lv.2 Rocket Dash Punch!
            p.ifRocketTimer = 14;
            spawnText("火箭衝拳!", p.x + p.facing * 26, p.y - 64, "#f59e0b", 1.05);
          }
          // Launch from Iron Fist's outstretched heavy punch (shoulder height z≈58)!
          spawnSwordWave(p.x + p.facing * 52, p.y, p.z + 58, p.facing, "#f59e0b", false, "vfx_proj_ironfist", true);
          if (unlockedUltLevel >= 1 && p.attackType === 1) {
            skillEffects.push({
              type: "shockwave",
              x: p.x,
              y: p.y,
              radius: 16,
              maxRadius: 112,
              color: "#f59e0b",
              life: 16,
              maxLife: 16,
            });
          }
        } else {
          window.sound.punchSwing();
          if (p.attackType === 2) {
            // Signature lunging white-bandage 3rd punch + Steam Air-Cannon Wave!
            p.x += p.facing * 14;
            spawnSwordWave(p.x + p.facing * 50, p.y, p.z + 58, p.facing, "#f59e0b", false, "vfx_proj_ironfist", false);
            spawnParticles(p.x + p.facing * 46, p.y, p.z + 58, "#f8fafc", 10, 3.2, 14);
          }
        }
      } else if (alice) {
        const heavy = p.attackType === 2 || isBuff();
        window.sound.alicePunch(heavy);
        if (isBuff()) {
          // Crimson-Gold Rose-Thorn Soundwave Punch Pressure (aligned to Alice's fist z≈56)!
          spawnSlashEffect(p.x + p.facing * 36, p.y, p.z + 54, p.facing, 0, 52, "#e11d48", 10);
          spawnSwordWave(p.x + p.facing * 46, p.y, p.z + 56, p.facing, "#e11d48", false, "vfx_proj_alice", true);
        } else if (p.attackType === 2) {
          spawnSlashEffect(p.x + p.facing * 32, p.y, p.z + 54, p.facing, 0, 44, "#d4af37", 10);
          spawnSwordWave(p.x + p.facing * 44, p.y, p.z + 56, p.facing, "#e11d48", false, "vfx_proj_alice", false);
          spawnParticles(p.x + p.facing * 42, p.y, p.z + 54, "#e11d48", 10, 3.0, 14);
        }
      } else if (shaka) {
        if (isBuff()) {
          // Launch Golden Buddha Palm Wave straight from Shaka's outstretched palm (targetH=116 + hover -> z≈66)!
          spawnSwordWave(p.x + p.facing * 58, p.y, p.z + 66, p.facing, "#fbbf24", false, "vfx_proj_shaka", p.attackType === 2);
        }
        if (p.attackType === 2) {
          window.sound.shakaClap();
          if (!isBuff()) {
            spawnSwordWave(p.x + p.facing * 56, p.y, p.z + 60, p.facing, "#fbbf24", false, "vfx_proj_shaka", false);
          }
          skillEffects.push({
            type: "shockwave",
            x: p.x + p.facing * (isBuff() ? 78 : 54),
            y: p.y,
            radius: 16,
            maxRadius: isBuff() && unlockedUltLevel >= 2 ? 124 : 76,
            color: "#fde68a",
            life: 16,
            maxLife: 16,
          });
        } else {
          window.sound.shakaPalm();
        }
      } else if (raven) {
        if (isBuff()) {
          // ULTIMATE: 《日蝕處決・雙槍亂舞》(Eclipse Akimbo Dual Pistols!)
          p.attackHitDone = true; // Handled by piercing twin bullets
          window.sound.dualPistolShot();
          const isPoisonAP = unlockedUltLevel >= 1;
          const bulletDmg = unlockedUltLevel >= 3 ? 20 : unlockedUltLevel >= 2 ? 17 : 14;
          // Twin staggered high-velocity pistol rounds!
          for (let b = 0; b < 2; b++) {
            skillEffects.push({
              type: "raven_proj",
              kind: "bullet",
              x: p.x + p.facing * (34 + b * 10),
              y: p.y + (b === 0 ? -5 : 5),
              z: p.z + (b === 0 ? 58 : 52),
              vx: p.facing * 14.5,
              vy: 0,
              facing: p.facing,
              dmg: bulletDmg,
              poison: isPoisonAP,
              pierce: true,
              hitIds: new Set(),
              life: isPoisonAP ? 34 : 26,
              maxLife: isPoisonAP ? 34 : 26,
            });
          }
          // Muzzle flash sparks
          spawnParticles(p.x + p.facing * 38, p.y, p.z + 55, "#fcd34d", 6, 3.0, 10);
          // Lv.2+: Every 2nd volley also unleashes angled Poison Kunai Barrage!
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            window.sound.throwingKnife();
            for (const vyOff of [-2.4, 2.4]) {
              skillEffects.push({
                type: "raven_proj",
                kind: "knife",
                x: p.x + p.facing * 36,
                y: p.y,
                z: p.z + 54,
                vx: p.facing * 10.5,
                vy: vyOff,
                facing: p.facing,
                dmg: 14,
                poison: true,
                pierce: true,
                hitIds: new Set(),
                life: 26,
                maxLife: 26,
              });
            }
          }
        } else if (p.attackType === 2) {
          // 3rd Hit Finisher: Poison Kunai Barrage from Raven's throwing hand (z≈54)!
          p.attackHitDone = true;
          window.sound.throwingKnife();
          for (const vyOff of [-1.2, 1.2]) {
            skillEffects.push({
              type: "raven_proj",
              kind: "knife",
              x: p.x + p.facing * 36,
              y: p.y + vyOff * 3,
              z: p.z + 54,
              vx: p.facing * 9.8,
              vy: vyOff,
              facing: p.facing,
              dmg: 14,
              poison: true,
              pierce: true,
              hitIds: new Set(),
              life: 24,
              maxLife: 24,
            });
          }
          spawnSlashEffect(p.x + p.facing * 32, p.y, p.z + 54, p.facing, 0, 36, "#a855f7", 9);
          // Leave lingering Poison Shadow Mist in front of Raven on 3rd-hit kunai throw!
          const existingMistsR = skillEffects.filter((fx) => fx.type === "mist_cloud");
          if (existingMistsR.length >= 3) {
            const oldIdx = skillEffects.indexOf(existingMistsR[0]);
            if (oldIdx >= 0) skillEffects.splice(oldIdx, 1);
          }
          skillEffects.push({
            type: "mist_cloud",
            x: p.x + p.facing * 72,
            y: p.y,
            isBlood: false,
            isShadow: true,
            scale: 0.78,
            life: 105,
            maxLife: 105,
            tickTimer: 12,
          });
        } else {
          // 1st & 2nd Hit: Fast Assassin Dagger Slashes!
          window.sound.daggerSlash();
          const ang = p.attackType === 0 ? -0.25 : 0.25;
          spawnSlashEffect(p.x + p.facing * 26, p.y, p.z + 52, p.facing, ang, 40, p.attackType === 0 ? "#e2e8f0" : "#d4af37", 9);
        }
      } else if (momo) {
        if (isBuff()) {
          // VAMPIRE LONG-CLAW SLASH! (3 parallel crimson fingernail rake arcs!)
          window.sound.vampireClaw();
          const clawR = unlockedUltLevel >= 1 ? 62 : 48;
          spawnSlashEffect(p.x + p.facing * 28, p.y - 6, p.z + 56, p.facing, -0.22, clawR, "#ef4444", 11);
          spawnSlashEffect(p.x + p.facing * 32, p.y, p.z + 52, p.facing, 0, clawR + 4, "#fb7185", 11);
          spawnSlashEffect(p.x + p.facing * 28, p.y + 6, p.z + 48, p.facing, 0.22, clawR, "#dc2626", 11);
          if (unlockedUltLevel >= 1 || p.attackType === 2) {
            // Crimson Blood-Claw & Bat Wave straight from Momo's claw swipe (z≈54)!
            spawnSwordWave(p.x + p.facing * 44, p.y, p.z + 54, p.facing, "#ef4444", true, "vfx_proj_momo", unlockedUltLevel >= 2);
          }
        } else {
          // NORMAL ATTACK: PEPPER SPRAY MIST CONE! (防狼噴霧)
          window.sound.pepperSpray();
          for (let sp = 0; sp < 14; sp++) {
            const spread = (Math.random() - 0.5) * 0.55;
            const spd = 2.6 + Math.random() * 3.2;
            particles.push({
              x: p.x + p.facing * 22,
              y: p.y + (Math.random() - 0.5) * 10,
              z: p.z + 34 + (Math.random() - 0.5) * 8,
              vx: p.facing * spd,
              vy: spread * 1.4,
              vz: (Math.random() - 0.4) * 0.7,
              color: sp % 2 === 0 ? "rgba(251, 146, 60, 0.85)" : "rgba(253, 224, 71, 0.75)",
              size: 4 + Math.floor(Math.random() * 5),
              life: 16 + Math.floor(Math.random() * 10),
              maxLife: 26,
            });
          }
          if (p.attackType === 2) {
            // 3rd-hit Pepper Spray leaves a lingering spicy Pepper Mist Cloud in front of Momo!
            const existingMistsM = skillEffects.filter((fx) => fx.type === "mist_cloud");
            if (existingMistsM.length >= 3) {
              const oldIdx = skillEffects.indexOf(existingMistsM[0]);
              if (oldIdx >= 0) skillEffects.splice(oldIdx, 1);
            }
            skillEffects.push({
              type: "mist_cloud",
              x: p.x + p.facing * 68,
              y: p.y,
              isBlood: false,
              isShadow: false,
              scale: 0.78,
              life: 105,
              maxLife: 105,
              tickTimer: 12,
            });
          }
        }
      } else if (samurai) {
        if (isBuff() && hasSamuraiDualMode()) {
          // Lv.3 UNLOCKED DUAL-KATANA MODE: Launch 《雙刀模式・交叉突進》!
          p.attackTimer = 18;
          p.dualDashTimer = 18;
          p.dualCrossBurstDone = false;
          p.attackHitDone = true; // Handled on the X-cross finisher!
          window.sound.dualCrossDash();
        } else {
          const heavy = p.attackType === 2 || isBuff();
          window.sound.katanaSlash(heavy);
          // Horizontal sweeping katana slash arc!
          const slashAng = p.attackType === 0 ? -0.1 : p.attackType === 1 ? 0.14 : 0;
          spawnSlashEffect(
            p.x + p.facing * 24,
            p.y,
            p.z + 30,
            p.facing,
            slashAng,
            isBuff() ? 56 : p.attackType === 2 ? 50 : 42,
            isBuff() ? "#38bdf8" : p.attackType === 2 ? "#f43f5e" : "#e0f2fe",
            11
          );
          if (isBuff()) {
            spawnSlashEffect(p.x + p.facing * 32, p.y - 4, p.z + 34, p.facing, 0.42, 52, "#a855f7", 10);
            spawnSlashEffect(p.x + p.facing * 20, p.y + 4, p.z + 24, p.facing, -0.38, 48, "#7dd3fc", 10);
            spawnSwordWave(p.x + p.facing * 32, p.y, p.z + 28, p.facing);
          }
        }
      } else {
        window.sound.punchSwing();
        if (isBuff() || p.attackType === 2) {
          // Mustache Hero: Golden Armored Power-Fist Shockwave straight from his fist (z≈56)!
          spawnSwordWave(p.x + p.facing * 50, p.y, p.z + 56, p.facing, "#fbbf24", false, "vfx_proj_mustache", isBuff());
          spawnParticles(p.x + p.facing * 48, p.y, p.z + 56, "#fde047", 8, 3.2, 14);
        }
      }
    }

    if (p.attackTimer > 0) {
      p.attackTimer--;
      // Active hit window
      if (!p.attackHitDone && p.attackTimer <= 10 && p.attackTimer >= 5) {
        performPlayerPunch();
      }
    }

    // Clamp to bounds
    const minX = cameraLocked ? cameraLockX + 24 : 24;
    const maxX = cameraLocked ? cameraLockX + W - 24 : stageWidth - 24;
    p.x = Math.max(minX, Math.min(maxX, p.x));
    p.y = Math.max(GROUND_MIN_Y, Math.min(GROUND_MAX_Y, p.y));
  }

  // Mustache Unlocked Multi-Hit Super Punch Barrage!
  function performMustacheFlurryHit() {
    const p = player;
    const reachX = unlockedUltLevel >= 2 ? 132 : 115;
    const reachY = unlockedUltLevel >= 2 ? 54 : 46;
    const dmg = unlockedUltLevel >= 2 ? 18 : 14;
    // Visual golden-cyan shockwave slash
    spawnSlashEffect(
      p.x + p.facing * (34 + Math.random() * 18),
      p.y + (Math.random() - 0.5) * 14,
      p.z + 30 + (Math.random() - 0.5) * 10,
      p.facing,
      (Math.random() - 0.5) * 0.5,
      54,
      "#fcd34d",
      9
    );
    window.sound.punchSwing();

    let hitAny = false;
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = (e.x - p.x) * p.facing;
      const dy = Math.abs(e.y - p.y);
      if (dx > -28 && dx < reachX && dy < reachY) {
        dealEnemyDamage(e, dmg);
        e.hurtTimer = 10;
        e.vx = p.facing * (p.flurryHitsLeft === 0 ? 7.2 : 2.2);
        if (p.flurryHitsLeft === 0) {
          e.vz = 5.4;
          e.knockdownTimer = 26;
        }
        combo++;
        comboTimer = 135;
        score += dmg * 12;
        hitAny = true;
        spawnParticles((p.x + e.x) * 0.5, e.y, 32, "#fcd34d", 7, 3.6, 14);
        spawnText(`連擊 ${dmg}!`, e.x, e.y - 58, "#fcd34d", 1.05);
        if (e.hp <= 0) {
          e.vx = p.facing * 7.2;
          e.vz = 5.6;
          handleEnemyDefeat(e);
        }
      }
    }
    if (hitAny) {
      window.sound.punchHit(true);
      triggerShake(6, 3.5);
    }
  }

  function performPlayerPunch() {
    const p = player;
    const buff = isBuff();
    const samurai = isSamurai();
    const momo = isMomo();
    const raven = isRaven();
    const shaka = isShaka();
    const alice = isAlice();
    const ironfist = isIronFistHero();
    const nightheron = isNightHeronHero();
    const magic = isMagic();
    const ling = isLing();
    const rose = isRose();
    // Unlocked New Move massively expands Ultimate AoE reach!
    const ultRangeBoostX = buff && unlockedUltLevel >= 1 ? (unlockedUltLevel >= 2 ? 54 : 38) : 0;
    const ultRangeBoostY = buff && unlockedUltLevel >= 1 ? (unlockedUltLevel >= 2 ? 22 : 16) : 0;
    const reachX = (rose ? (buff ? 142 : 98) : ling ? (buff ? 152 : 116) : magic ? (buff ? 148 : 112) : nightheron ? (buff ? 104 : 76) : ironfist ? (buff ? 102 : 70) : alice ? (buff ? 92 : 66) : shaka ? (buff ? 168 : 118) : raven ? 60 : momo ? (buff ? 84 : 88) : samurai ? (buff ? 84 : 66) : (buff ? 68 : 48)) + ultRangeBoostX;
    const reachY = (rose ? (buff ? 46 : 34) : ling ? (buff ? 48 : 38) : magic ? (buff ? 46 : 36) : nightheron ? (buff ? 40 : 30) : ironfist ? (buff ? 40 : 30) : alice ? (buff ? 38 : 28) : shaka ? (buff ? 52 : 36) : raven ? 28 : momo ? (buff ? 36 : 32) : samurai ? (buff ? 34 : 28) : (buff ? 30 : 24)) + ultRangeBoostY;
    let hitAnything = false;

    // Trigger Mustache's automatic rapid multi-hit punch combo (or Alice Lv.2 Brass Knuckle Flurry!)
    if ((!samurai && !momo && !raven && !shaka && !alice && !ironfist && !nightheron && !magic && !ling && !rose && buff && unlockedUltLevel >= 1) || (alice && buff && unlockedUltLevel >= 2)) {
      p.flurryHitsLeft = unlockedUltLevel >= 2 ? 3 : 2;
      p.flurryTimer = 4;
    }

    // Check smokers first (punching a smoker pops out brisket!)
    for (const s of smokers) {
      if (!s.hasBrisket) continue;
      const dx = (s.x - p.x) * p.facing;
      const dy = Math.abs(s.y - p.y);
      if (dx > -10 && dx < reachX && dy < 32) {
        s.hasBrisket = false;
        s.lidOpen = 1;
        s.hitFlash = 10;
        hitAnything = true;
        window.sound.brisketPop();
        pickups.push({
          type: "brisket",
          x: s.x,
          y: s.y + 14,
          z: 24,
          vx: (p.facing > 0 ? 1 : -1) * 1.1,
          vz: 4.5,
          bob: 0,
        });
        spawnParticles(s.x, s.y, 24, "#fbbf24", 10, 2.5, 22);
        spawnText("SMOKED BRISKET!", s.x, s.y - 44, "#fbbf24", 1);
      }
    }

    // Check enemies
    for (const e of enemies) {
      if (e.dead) continue;
      const dx = (e.x - p.x) * p.facing;
      const dy = Math.abs(e.y - p.y);
      if (dx > -14 && dx < reachX && dy < reachY) {
        const isFinisher = p.attackType === 2 || buff;
        const dmg = buff ? (p.attackType === 2 ? 36 : 26) : (p.attackType === 2 ? 18 : 12);
        const alicePierce = alice ? (buff ? 1.0 : p.attackType === 2 ? 0.25 : 0) : 0;
        dealEnemyDamage(e, dmg, alicePierce);
        e.hurtTimer = momo && !buff ? 20 : 14; // Pepper spray staggers enemies longer!
        e.facing = -p.facing;
        hitAnything = true;

        // Stage 6 《末班機》: Hitting Iron Fist during 合體技 setup interrupts 「末班起飛」!
        if (currentStage === 6 && e.type === "boss_ironfist") {
          window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
        }

        // SHAKA: 2nd hit pulls enemies gently inward (聚敵); Lv.1+ Ult briefly binds enemies!
        if (shaka) {
          if (p.attackType === 1 && !buff) {
            e.x += (p.x + p.facing * 52 - e.x) * 0.35;
          }
          if (buff && unlockedUltLevel >= 1) {
            e.bindTimer = Math.max(e.bindTimer || 0, 42);
            e.hurtTimer = Math.max(e.hurtTimer, 42);
          }
        }

        // MOMO VAMPIRE FORM: Every claw hit steals life and heals her HP!
        if (momo && buff) {
          const healAmt = unlockedUltLevel >= 1 ? 8 : 6;
          p.hp = Math.min(p.maxHp, p.hp + healAmt);
          window.sound.lifestealChime();
          spawnParticles(p.x, p.y, 34, "#4ade80", 5, 2.0, 16);
          spawnParticles(e.x, e.y, 32, "#ef4444", 6, 2.6, 16);
          spawnText(`+${healAmt} 吸血!`, p.x, p.y - 68, "#4ade80", 0.95);
        }

        combo++;
        comboTimer = 135;
        score += dmg * 10 + combo * 15;
        if (!buff) {
          p.reloadGauge = Math.min(100, p.reloadGauge + 12);
        }

        if (isFinisher || e.hp <= 0) {
          e.vx = p.facing * (buff ? 7.2 : 4.2);
          e.vz = buff ? 5.6 : 3.8;
          e.knockdownTimer = 28;
        } else {
          e.vx = p.facing * 2.0;
        }

        const hitX = (p.x + e.x) * 0.5;
        const hitY = e.y;
        spawnParticles(
          hitX,
          hitY,
          32,
          momo ? (buff ? "#ef4444" : "#fb923c") : buff ? "#38bdf8" : samurai ? "#e0f2fe" : "#fcd34d",
          buff ? 14 : 8,
          buff ? 4.2 : 2.8,
          18
        );
        spawnText(
          momo
            ? (buff ? `${dmg}! 血爪!` : `${dmg} 噴霧!`)
            : buff
            ? (samurai ? `${dmg}! 亂舞!` : `${dmg}! BOOM!`)
            : samurai
            ? `${dmg} 斬!`
            : `${dmg}`,
          e.x,
          e.y - 54,
          momo ? (buff ? "#fb7185" : "#fdba74") : buff ? "#38bdf8" : samurai ? "#e0f2fe" : "#fff",
          buff ? 1.15 : 0.95
        );

        if (e.hp <= 0) {
          handleEnemyDefeat(e);
        }
      }
    }

    if (hitAnything) {
      p.attackHitDone = true;
      if (samurai) {
        window.sound.katanaHit(buff);
      } else {
        window.sound.punchHit(buff);
      }
      hitstop = buff ? 4 : 3;
      triggerShake(buff ? 9 : 5, buff ? 4.5 : 2.5);
    }
  }

  function updateSlashEffectsAndWaves() {
    for (let i = slashEffects.length - 1; i >= 0; i--) {
      slashEffects[i].life--;
      if (slashEffects[i].life <= 0) slashEffects.splice(i, 1);
    }
    for (let i = swordWaves.length - 1; i >= 0; i--) {
      const w = swordWaves[i];
      w.x += w.vx;
      w.life--;
      for (const e of enemies) {
        if (e.dead || w.hitIds.has(e)) continue;
        if (Math.abs(e.x - w.x) < 28 && Math.abs(e.y - w.y) < 26) {
          w.hitIds.add(e);
          dealEnemyDamage(e, 14);
          e.hurtTimer = 10;
          e.vx = w.facing * 3.5;
          combo++;
          comboTimer = 135;
          score += 160;
          spawnParticles(e.x, e.y, w.z || 28, w.color || "#38bdf8", 7, 3, 14);
          const waveLabel = w.lifesteal
            ? "血爪波 14"
            : w.spriteKey && w.spriteKey.startsWith("vfx_firefist")
            ? "火拳 14"
            : w.spriteKey === "vfx_proj_magic"
            ? "黑魔法 14"
            : w.spriteKey === "vfx_proj_nightheron"
            ? "水刃 14"
            : w.spriteKey === "vfx_proj_fallen"
            ? "羽翼風壓 14"
            : w.spriteKey === "vfx_proj_ling"
            ? "四象波 14"
            : w.spriteKey === "vfx_proj_ironfist"
            ? "蒸氣拳壓 14"
            : w.spriteKey === "vfx_proj_shaka"
            ? "如來掌 14"
            : w.spriteKey === "vfx_proj_alice"
            ? "言靈音波 14"
            : w.spriteKey === "vfx_proj_mustache"
            ? "黃金拳壓 14"
            : "劍氣 14";
          spawnText(waveLabel, e.x, e.y - 52, w.color || "#38bdf8", 0.95);
          if (w.lifesteal && player) {
            player.hp = Math.min(player.maxHp, player.hp + 5);
            window.sound.lifestealChime();
            spawnText("+5 吸血!", player.x, player.y - 68, "#4ade80", 0.9);
          }
          window.sound.katanaHit(false);
          if (e.hp <= 0) {
            e.vx = w.facing * 5.2;
            e.vz = 4.2;
            handleEnemyDefeat(e);
          }
        }
      }
      if (w.life <= 0) swordWaves.splice(i, 1);
    }

    // Update Small Skill Effects (Shockwave, Afterimages, Delayed Iaido Slash, Bat Swarm, Pepper/Blood Mist)
    for (let i = skillEffects.length - 1; i >= 0; i--) {
      const fx = skillEffects[i];
      fx.life--;
      if (fx.type === "sky_drop_skull") {
        if (fx.delay > 0) {
          fx.delay--;
        } else {
          const phaseLife = fx.life;
          // Impact moment right as the strike hits!
          if (!fx.impacted && phaseLife <= 21) {
            const st = REMOTE_AOE_STYLES[fx.style] || REMOTE_AOE_STYLES.fallen;
            fx.impacted = true;
            window.sound.groundSlam();
            triggerShake(11, 4.6);
            if (window.shaderFX) {
              window.shaderFX.pulseAberration(0.45);
              window.shaderFX.triggerShockwave((fx.x - cameraX) / W, fx.y / H, 0.046);
            }
            spawnParticles(fx.x, fx.y, 18, st.color, 14, 4.2, 20);
            spawnParticles(fx.x, fx.y, 26, "#ffffff", 10, 3.6, 18);
            for (const e of enemies) {
              if (e.dead) continue;
              if (Math.abs(e.x - fx.x) < fx.radius && Math.abs(e.y - fx.y) < 48) {
                if (currentStage === 6 && window.AirportStage) {
                  window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
                }
                const dealt = dealEnemyDamage(e, fx.dmg, 0.35);
                e.hurtTimer = 26;
                e.knockdownTimer = 22;
                e.armorBreakTimer = Math.max(e.armorBreakTimer || 0, 90);
                e.vx = (e.x >= fx.x ? 1 : -1) * 3.8;
                e.vz = 5.2;
                combo++;
                comboTimer = 135;
                score += dealt * 14;
                if (player && !isBuff()) player.reloadGauge = Math.min(100, player.reloadGauge + 6);
                spawnText(`${st.label} ${dealt}!`, e.x, e.y - 62, st.color, 1.12);
                if (e.hp <= 0) handleEnemyDefeat(e);
              }
            }
          }
        }
      } else if (fx.type === "shockwave") {
        const t = 1 - fx.life / fx.maxLife;
        fx.radius = 18 + (fx.maxRadius - 18) * (1 - Math.pow(1 - t, 2));
      } else if (fx.type === "delayed_iaido") {
        if (!fx.detonated) {
          fx.delay--;
          if (fx.delay <= 0) {
            fx.detonated = true;
            window.sound.katanaSlash(true);
            window.sound.katanaHit(true);
            triggerShake(8, 3.5);
            const minX = Math.min(fx.x1, fx.x2) - 24;
            const maxX = Math.max(fx.x1, fx.x2) + 24;
            const midX = (fx.x1 + fx.x2) * 0.5;
            const midY = (fx.y1 + fx.y2) * 0.5;
            spawnText("⚡ 殘影居合!", midX, midY - 64, "#e0f2fe", 1.15);
            spawnParticles(midX, midY, 32, "#e0f2fe", 16, 4.2, 16);
            spawnParticles(midX, midY, 28, "#a855f7", 10, 3.4, 16);
            for (const e of enemies) {
              if (e.dead) continue;
              if (e.x >= minX && e.x <= maxX && Math.abs(e.y - midY) < 44) {
                if (currentStage === 6 && window.AirportStage) {
                  window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
                }
                dealEnemyDamage(e, fx.dmg);
                e.hurtTimer = 22;
                e.vx = fx.facing * 4.2;
                combo++;
                comboTimer = 135;
                score += fx.dmg * 14;
                if (player && !isBuff()) player.reloadGauge = Math.min(100, player.reloadGauge + 7);
                spawnSlashEffect(e.x, e.y, 32, fx.facing, -0.45, 42, "#ffffff", 11);
                spawnSlashEffect(e.x, e.y, 28, -fx.facing, 0.45, 38, "#38bdf8", 11);
                spawnText(`居合 ${fx.dmg}!`, e.x, e.y - 56, "#e0f2fe", 1.05);
                if (e.hp <= 0) {
                  e.vx = fx.facing * 5.6;
                  e.vz = 4.5;
                  handleEnemyDefeat(e);
                }
              }
            }
          }
        }
      } else if (fx.type === "bat_swarm") {
        fx.x += fx.vx;
        fx.y += fx.vy;
        fx.z = Math.max(8, fx.z + fx.vz);
        fx.vx *= 0.94;
        fx.vy *= 0.94;
        fx.phase += 0.45;
      } else if (fx.type === "mist_cloud") {
        fx.tickTimer--;
        if (fx.tickTimer <= 0) {
          fx.tickTimer = 22;
          const mistRx = 72 * (fx.scale || 1);
          const mistRy = 38 * (fx.scale || 1);
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - fx.x) < mistRx && Math.abs(e.y - fx.y) < mistRy) {
              const dmg = fx.isBlood ? 8 : 5;
              dealEnemyDamage(e, dmg);
              e.hurtTimer = Math.max(e.hurtTimer, 18);
              combo++;
              comboTimer = 135;
              score += dmg * 10;
              const mistCol = fx.isShadow ? "#c084fc" : fx.isBlood ? "#ef4444" : "#fb923c";
              const mistTxt = fx.isShadow ? `毒霧 ${dmg}` : fx.isBlood ? `血霧 ${dmg}` : `辣椒霧 ${dmg}`;
              const mistTxtCol = fx.isShadow ? "#d8b4fe" : fx.isBlood ? "#fb7185" : "#fdba74";
              spawnParticles(e.x, e.y, 26, mistCol, 4, 2.0, 14);
              spawnText(mistTxt, e.x, e.y - 52, mistTxtCol, 0.9);
              if (fx.isBlood && player) {
                player.hp = Math.min(player.maxHp, player.hp + 4);
                window.sound.lifestealChime();
                spawnText("+4 血霧吸血!", player.x, player.y - 68, "#4ade80", 0.9);
              }
              if (e.hp <= 0) handleEnemyDefeat(e);
            }
          }
        }
      } else if (fx.type === "raven_proj") {
        fx.x += fx.vx;
        fx.y += fx.vy || 0;
        for (const e of enemies) {
          if (e.dead || fx.hitIds.has(e)) continue;
          if (Math.abs(e.x - fx.x) < 28 && Math.abs(e.y - fx.y) < 28) {
            fx.hitIds.add(e);
            if (currentStage === 6 && window.AirportStage) {
              window.AirportStage.tryInterruptTeamCombo(e, spawnText, spawnParticles, triggerShake);
            }
            dealEnemyDamage(e, fx.dmg);
            e.hurtTimer = Math.max(e.hurtTimer, 11);
            e.vx = fx.facing * (fx.kind === "bullet" ? 2.4 : 3.2);
            if (fx.poison) e.poisonTimer = 120;
            combo++;
            comboTimer = 135;
            score += fx.dmg * 12;
            if (player && !isBuff()) player.reloadGauge = Math.min(100, player.reloadGauge + 7);
            spawnParticles(e.x, e.y, 30, fx.kind === "bullet" ? "#fcd34d" : "#a855f7", 6, 2.6, 12);
            spawnText(
              fx.kind === "bullet" ? `雙槍 ${fx.dmg}` : fx.kind === "shuriken" ? `手裏劍 ${fx.dmg}` : `毒飛刀 ${fx.dmg}`,
              e.x,
              e.y - 54,
              fx.kind === "bullet" ? "#fcd34d" : "#c084fc",
              0.92
            );
            window.sound.katanaHit(false);
            if (e.hp <= 0) {
              e.vx = fx.facing * 5.0;
              e.vz = 4.0;
              handleEnemyDefeat(e);
            }
            if (!fx.pierce) {
              fx.life = 0;
              break;
            }
          }
        }
      }
      if (fx.life <= 0) skillEffects.splice(i, 1);
    }

    // Enemy Poison DoT, Shaka Restrain Bind, and Alice Linguistic Armor Break ticks
    for (const e of enemies) {
      if (e.dead) continue;
      if (e.armorBreakTimer && e.armorBreakTimer > 0) {
        e.armorBreakTimer--;
        if (e.armorBreakTimer % 22 === 0) {
          spawnParticles(e.x, e.y, 44, "#e11d48", 3, 1.4, 12);
        }
      }
      if (e.bindTimer && e.bindTimer > 0) {
        e.bindTimer--;
        e.hurtTimer = Math.max(e.hurtTimer, 2);
        e.vx *= 0.5;
        if (e.bindTimer % 18 === 0) {
          spawnParticles(e.x, e.y, 28, "#fde68a", 3, 1.5, 12);
        }
      }
      if (!e.poisonTimer || e.poisonTimer <= 0) continue;
      e.poisonTimer--;
      if (e.poisonTimer % 26 === 0) {
        dealEnemyDamage(e, 4);
        spawnParticles(e.x, e.y, 28, "#a855f7", 4, 1.8, 14);
        spawnText("劇毒 4", e.x, e.y - 48, "#c084fc", 0.82);
        if (e.hp <= 0) handleEnemyDefeat(e);
      }
    }
  }

  function updateWaves() {
    if (activeWaveIndex >= waves.length) return;
    const wave = waves[activeWaveIndex];

    if (!wave.spawned && player.x >= wave.triggerX) {
      wave.spawned = true;
      cameraLocked = true;
      cameraLockX = wave.lockX;
      for (const item of wave.list) {
        enemies.push(createEnemy(item.type, item.x, item.y));
      }
      let bossLabel = "";
      if (wave.list.some((i) => i.type === "wt_boss")) {
        const wt = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
        bossLabel = (wt && wt.bossBanner) || "STAGE BOSS 登場！";
        spawnText(bossLabel, cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "boss_train_mechanic")) {
        bossLabel = "山線特快 BOSS「緩衝拳機兵」啟動！全車警戒！";
        spawnText(bossLabel, cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "boss_89_king")) {
        bossLabel = "大稻埕 8+9 角頭老大登場！支援輸贏啦！";
        spawnText(bossLabel, cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "genex_boss")) {
        bossLabel = "基因研究者 DR. GENEX 降臨!";
        spawnText(bossLabel, cameraLockX + W / 2, 128, "#ef4444", 1.3);
      } else if (wave.list.some((i) => i.type === "boss")) {
        bossLabel = "FINAL BOSS FIGHT!";
        spawnText(bossLabel, cameraLockX + W / 2, 130, "#ef4444", 1.4);
      } else if (wave.list.some((i) => i.type === "miniboss")) {
        bossLabel = "MINI-BOSS APPEARS!";
        spawnText(bossLabel, cameraLockX + W / 2, 130, "#fbbf24", 1.35);
      }
      if (bossLabel) {
        bossWarningTimer = 85;
        bossWarningName = bossLabel;
        if (window.sound.bossWarning) window.sound.bossWarning();
        if (window.sound.setBossTension) window.sound.setBossTension(true);
      }
    }

    if (wave.spawned && !wave.cleared) {
      const alive = enemies.some((e) => !e.dead);
      if (!alive) {
        wave.cleared = true;
        cameraLocked = false;
        activeWaveIndex++;
        if (activeWaveIndex >= waves.length) {
          // Stage Clear! Trigger Dramatic K.O. Slow-Motion + Compute Arcade Summary & Save Progress!
          gameState = STATE.STAGE_CLEAR;
          stageClearTimer = 360;
          koSlowMoTimer = 34;
          koFlashTimer = 38;
          if (window.sound.setBossTension) window.sound.setBossTension(false);
          if (window.sound.koFinish) window.sound.koFinish();
          if (window.shaderFX) {
            window.shaderFX.pulseAberration(0.95);
            window.shaderFX.triggerShockwave(0.5, 0.5, 0.065);
          }
          window.sound.stageClear();

          const elapsedSec = Math.max(1, Math.round((tick - stageStartTick) / 60));
          const noDamageBonus = stageDamageTaken === 0 ? 1500 : 0;
          const timeBonus = Math.max(0, 1200 - elapsedSec * 10);
          score += noDamageBonus + timeBonus;
          const rank =
            stageDamageTaken === 0 || (maxCombo >= 15 && elapsedSec <= 65)
              ? "S"
              : stageDamageTaken <= 45 && maxCombo >= 8
              ? "A"
              : stageDamageTaken <= 90
              ? "B"
              : "C";
          saveStageProgress(currentStage, score, rank, maxCombo);
          if (window.sound.stageRankFanfare) window.sound.stageRankFanfare(rank === "S");

          const wtCur = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
          const clearLabels = {
            1: "HARBOUR CLEARED!",
            2: "RESTROOM CLEARED! 前往機場《末班機》!",
            6: "《末班機》突破！解鎖島嶼世界地圖!",
            3: "研究所第一層突破！前往地下一層!",
            4: "地下一層突破！逃離沼氣前往第三層!",
            5: "基因研究者擊破！生化島解放!",
            7: "大稻埕角頭擊破！迪化街恢復和平!",
            8: "山線特快全線突破！",
          };
          stageClearSummary = {
            title: (wtCur && `${wtCur.hudName} 突破！`) || clearLabels[currentStage] || "STAGE CLEARED!",
            timeSec: elapsedSec,
            maxCombo,
            briskets: stageBrisketsEaten,
            noDamageBonus,
            timeBonus,
            rank,
            hasNext:
              currentStage === 1 ||
              currentStage === 2 ||
              currentStage === 3 ||
              currentStage === 4 ||
              Boolean(wtCur && wtCur.nextId),
          };
          spawnText(stageClearSummary.title, cameraX + W / 2, 150, "#fcd34d", 1.25);
        } else {
          goArrowTimer = 150;
        }
      }
    }
  }

  function spawnEnemyKickWave(e) {
    window.sound.bossKickWave();
    enemyProjectiles.push({
      x: e.x + e.facing * 26,
      y: e.y,
      z: 28,
      vx: e.facing * 5.8,
      facing: e.facing,
      damage: 13,
      life: 62,
      maxLife: 62,
      color: e.bossPhase === 3 ? "#ef4444" : "#c084fc",
    });
  }

  function updateEnemyProjectiles() {
    const p = player;
    for (let i = enemyProjectiles.length - 1; i >= 0; i--) {
      const pr = enemyProjectiles[i];
      pr.x += pr.vx;
      pr.life--;
      if (Math.abs(pr.x - p.x) < 28 && Math.abs(pr.y - p.y) < 26 && p.z < 28 && p.invulnTimer <= 0) {
        const dmg = isBuff() ? Math.ceil(pr.damage * 0.55) : pr.damage;
        p.hp = Math.max(0, p.hp - dmg);
        p.hurtTimer = 14;
        p.invulnTimer = 36;
        combo = 0;
        window.sound.hurt();
        triggerShake(9, 4);
        spawnParticles(p.x, p.y, 28, pr.color, 10, 3, 18);
        spawnText(`-${dmg} 斬擊波!`, p.x, p.y - 56, "#ef4444", 1.0);
        if (p.hp <= 0) {
          gameState = STATE.GAME_OVER;
          window.sound.isBuff = false;
        }
        enemyProjectiles.splice(i, 1);
        continue;
      }
      if (pr.life <= 0) enemyProjectiles.splice(i, 1);
    }
  }

  function updateEnemies() {
    const p = player;
    for (let i = enemies.length - 1; i >= 0; i--) {
      const e = enemies[i];

      // Check DR. GENEX Phase 2 -> Phase 3 Evolution at 50% HP!
      if (e.type === "genex_boss" && e.bossPhase === 2 && !e.dead && e.hp <= e.maxHp * 0.5) {
        triggerBossMutation(e, 3);
        return;
      }

      if (e.kickAnimTimer > 0) e.kickAnimTimer--;

      // DR. GENEX Phase 3: High-Altitude Diving Swoop Attack (俯衝攻擊)!
      if (e.type === "genex_boss" && e.bossPhase === 3 && !e.dead && e.diveState !== "none") {
        e.diveTimer--;
        if (e.diveState === "ascend") {
          e.z = Math.min(165, e.z + 6.5);
          e.x += (p.x - e.x) * 0.04;
          e.y += (p.y - e.y) * 0.04;
          e.diveTargetX = p.x;
          e.diveTargetY = p.y;
          if (e.diveTimer <= 0) {
            e.diveState = "aim";
            e.diveTimer = 30;
          }
        } else if (e.diveState === "aim") {
          // Track player briefly then lock target!
          if (e.diveTimer > 12) {
            e.diveTargetX = p.x;
            e.diveTargetY = p.y;
          }
          if (e.diveTimer <= 0) {
            e.diveState = "dive";
            e.diveTimer = 26;
            window.sound.bossDiveSwoop();
          }
        } else if (e.diveState === "dive") {
          e.x += (e.diveTargetX - e.x) * 0.22;
          e.y += (e.diveTargetY - e.y) * 0.22;
          e.z = Math.max(0, e.z - 12);
          spawnParticles(e.x, e.y, e.z + 20, "#ef4444", 2, 2, 12);
          if (e.z <= 0 || e.diveTimer <= 0) {
            e.z = 0;
            e.diveState = "none";
            e.specialCooldown = 125;
            window.sound.bossDiveImpact();
            triggerShake(18, 6.5);
            spawnParticles(e.x, e.y, 16, "#ef4444", 24, 5, 26);
            spawnParticles(e.x, e.y, 16, "#a855f7", 18, 4, 24);
            // Wide Dive Impact Shockwave Damage!
            if (Math.abs(p.x - e.x) < 88 && Math.abs(p.y - e.y) < 42 && p.invulnTimer <= 0) {
              const dmg = isBuff() ? 11 : 18;
              p.hp = Math.max(0, p.hp - dmg);
              p.hurtTimer = 18;
              p.invulnTimer = 42;
              combo = 0;
              window.sound.hurt();
              spawnText(`-${dmg} 俯衝重擊!`, p.x, p.y - 60, "#ef4444", 1.15);
              if (p.hp <= 0) {
                gameState = STATE.GAME_OVER;
                window.sound.isBuff = false;
              }
            }
          }
        }
        continue;
      }

      // Physics
      e.x += e.vx;
      e.vx *= e.z > 0 ? 0.96 : 0.78;
      if (e.z > 0 || e.vz !== 0) {
        e.z += e.vz;
        e.vz -= 0.36;
        if (e.z <= 0) {
          e.z = 0;
          e.vz = 0;
          if (Math.abs(e.vx) > 2.2) {
            e.vx *= 0.45;
            e.vz = 1.6;
          }
        }
      }

      if (e.dead) {
        e.fadeTimer--;
        if (e.fadeTimer <= 0) {
          enemies.splice(i, 1);
        }
        continue;
      }

      if (e.hurtTimer > 0) {
        e.hurtTimer--;
        continue;
      }
      if (e.knockdownTimer > 0) {
        e.knockdownTimer--;
        continue;
      }

      // Stage 6 Dual Bosses (鐵拳 & 夜鷺) use their dedicated AirportStage AI!
      if (e.type === "boss_ironfist" || e.type === "boss_nightheron") {
        continue;
      }

      // AI Movement toward player
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      e.facing = dx >= 0 ? 1 : -1;

      // DR. GENEX Special Attacks (Phase 2 Giant Leg Slash Wave / Phase 3 Diving Swoop!)
      if (e.type === "genex_boss") {
        e.specialCooldown--;
        if (e.specialCooldown <= 0 && e.attackTimer <= 0) {
          if (e.bossPhase === 2) {
            e.kickAnimTimer = 24;
            e.specialCooldown = 105;
            spawnEnemyKickWave(e);
            spawnSlashEffect(e.x + e.facing * 26, e.y, 26, e.facing, 0, 56, "#c084fc", 12);
            continue;
          } else if (e.bossPhase === 3) {
            e.diveState = "ascend";
            e.diveTimer = 32;
            e.diveTargetX = p.x;
            e.diveTargetY = p.y;
            spawnText("俯衝鎖定!", e.x, e.y - 84, "#ef4444", 1.1);
            continue;
          }
        }
      }

      if (e.attackTimer > 0) {
        e.attackTimer--;
        if (!e.attackHitDone && e.attackTimer === 10) {
          // DR. GENEX giant arms have much wider AoE reach!
          const hitReachX = e.type === "genex_boss" ? 92 : e.type === "miniboss" || e.type === "boss" ? 56 : 46;
          const hitReachY = e.type === "genex_boss" ? 38 : 22;
          if (Math.abs(dx) < hitReachX && Math.abs(dy) < hitReachY && p.z < 20 && p.invulnTimer <= 0) {
            e.attackHitDone = true;
            const dmg = isBuff() ? Math.ceil(e.damage * 0.5) : e.damage;
            p.hp = Math.max(0, p.hp - dmg);
            stageDamageTaken += dmg;
            p.hurtTimer = 14;
            p.invulnTimer = 36;
            combo = 0;
            window.sound.hurt();
            triggerShake(8, 3.5);
            spawnParticles(p.x, p.y, 28, "#ef4444", 8, 2.5, 18);
            spawnText(`-${dmg}`, p.x, p.y - 54, "#ef4444", 1);
            if (p.hp <= 0) {
              gameState = STATE.GAME_OVER;
              window.sound.isBuff = false;
            }
          }
        }
        continue;
      }

      if (e.attackCooldown > 0) e.attackCooldown--;

      const stopDist = e.type === "boss" ? 38 : 34;
      if (Math.abs(dx) > stopDist || Math.abs(dy) > 12) {
        const dist = Math.hypot(dx, dy) || 1;
        e.x += (dx / dist) * e.speed;
        e.y += (dy / dist) * (e.speed * 0.72);
        e.walkFrame += 0.16;
      } else if (e.attackCooldown <= 0) {
        e.attackTimer = e.type === "boss" ? 20 : 24;
        e.attackCooldown = e.type === "boss" ? 38 : 65 + Math.floor(Math.random() * 35);
        e.attackHitDone = false;
      }

      e.y = Math.max(GROUND_MIN_Y, Math.min(GROUND_MAX_Y, e.y));
    }
  }

  function updateSmokersAndPickups() {
    // Smoker smoke particles
    for (const s of smokers) {
      if (s.hitFlash > 0) s.hitFlash--;
      if (s.hasBrisket && tick % 14 === 0) {
        particles.push({
          x: s.x - 10 + (Math.random() - 0.5) * 4,
          y: s.y - 2,
          z: 36,
          vx: 0.25 + Math.random() * 0.25,
          vy: 0,
          vz: 0.55 + Math.random() * 0.35,
          color: "rgba(226, 232, 240, 0.75)",
          size: 4,
          life: 36,
          maxLife: 36,
        });
      }
      // Also auto-pop brisket if player walks right up to a smoker with low HP
      if (s.hasBrisket && Math.abs(player.x - s.x) < 34 && Math.abs(player.y - s.y) < 26 && player.hp < player.maxHp) {
        s.hasBrisket = false;
        s.lidOpen = 1;
        window.sound.brisketPop();
        pickups.push({
          type: "brisket",
          x: s.x,
          y: s.y + 14,
          z: 24,
          vx: 0.6,
          vz: 4.4,
          bob: 0,
        });
      }
    }

    for (let i = pickups.length - 1; i >= 0; i--) {
      const pk = pickups[i];
      pk.bob += 0.12;
      if (pk.z > 0 || pk.vz !== 0) {
        pk.x += pk.vx;
        pk.z += pk.vz;
        pk.vz -= 0.3;
        if (pk.z <= 0) {
          pk.z = 0;
          pk.vz = 0;
          pk.vx = 0;
        }
      }

      // Collect brisket!
      if (Math.abs(player.x - pk.x) < 32 && Math.abs(player.y - pk.y) < 24 && pk.z < 18) {
        const heal = 45;
        player.hp = Math.min(player.maxHp, player.hp + heal);
        player.reloadGauge = Math.min(100, player.reloadGauge + 25);
        player.eatTimer = 28;
        score += 250;
        brisketEatenCount++;
        stageBrisketsEaten++;
        window.sound.brisketEat();
        spawnParticles(player.x, player.y, 26, "#4ade80", 12, 2.5, 24);
        spawnText(`+${heal} HP!`, player.x, player.y - 62, "#4ade80", 1.1);

        const quotes = [
          "My favorite! An oak-smoked black rub.",
          "Juicy sliced brisket with a thick bark!",
          "Game of the Year awards... here I come.",
        ];
        showSpeech(quotes[(brisketEatenCount - 1) % quotes.length], 190);
        pickups.splice(i, 1);
      }
    }
  }

  function updateParticles() {
    for (let i = particles.length - 1; i >= 0; i--) {
      const pt = particles[i];
      pt.x += pt.vx;
      pt.y += pt.vy;
      pt.z += pt.vz;
      if (pt.z < 0) pt.z = 0;
      pt.life--;
      if (pt.life <= 0) particles.splice(i, 1);
    }
  }

  // Regional Atmospheric Weather & Ambient Particles (Sakura, Jiufen Rain, Neon Motes, Sunset Dust, Bio Spores)
  function updateAmbientParticles() {
    const wt = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
    let mode = "mote";
    if (wt && wt.region === "japan") mode = "sakura";
    else if (currentStage === 102) mode = "rain";
    else if (wt && (wt.region === "malaysia" || wt.region === "singapore" || wt.region === "thailand" || wt.region === "vietnam")) mode = "sunset";
    else if (currentStage === 3 || currentStage === 4 || currentStage === 5) mode = "spore";
    else if (wt && wt.region === "taiwan") mode = "neon";

    const maxCount = mode === "rain" ? 42 : 22;
    if (ambientParticles.length < maxCount && tick % (mode === "rain" ? 2 : 6) === 0) {
      if (mode === "sakura") {
        ambientParticles.push({
          mode,
          x: Math.random() * (W + 80),
          y: -8,
          vx: -0.7 - Math.random() * 0.7,
          vy: 0.65 + Math.random() * 0.55,
          size: 3 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() < 0.5 ? "#fbcfe8" : "#f9a8d4",
        });
      } else if (mode === "rain") {
        ambientParticles.push({
          mode,
          x: Math.random() * (W + 100),
          y: -12,
          vx: -1.8,
          vy: 7.5 + Math.random() * 2.5,
          size: 10 + Math.random() * 6,
          phase: 0,
          color: "rgba(186, 230, 253, 0.42)",
        });
      } else if (mode === "sunset") {
        ambientParticles.push({
          mode,
          x: Math.random() * W,
          y: 30 + Math.random() * (H - 60),
          vx: -0.35 - Math.random() * 0.35,
          vy: -0.15 + Math.random() * 0.3,
          size: 2 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() < 0.5 ? "rgba(253, 224, 71, 0.55)" : "rgba(251, 146, 60, 0.50)",
        });
      } else if (mode === "spore") {
        ambientParticles.push({
          mode,
          x: Math.random() * W,
          y: H - 20 - Math.random() * 140,
          vx: (Math.random() - 0.5) * 0.4,
          vy: -0.35 - Math.random() * 0.35,
          size: 2 + Math.random() * 2,
          phase: Math.random() * Math.PI * 2,
          color: "rgba(74, 222, 128, 0.52)",
        });
      } else {
        ambientParticles.push({
          mode: "neon",
          x: Math.random() * W,
          y: 25 + Math.random() * (H - 70),
          vx: -0.25 - Math.random() * 0.35,
          vy: -0.18 + Math.random() * 0.36,
          size: 2 + Math.random() * 1.5,
          phase: Math.random() * Math.PI * 2,
          color: Math.random() < 0.5 ? "rgba(56, 189, 248, 0.55)" : "rgba(251, 191, 36, 0.50)",
        });
      }
    }

    for (let i = ambientParticles.length - 1; i >= 0; i--) {
      const ap = ambientParticles[i];
      ap.phase += 0.08;
      ap.x += ap.vx + (ap.mode === "sakura" ? Math.sin(ap.phase) * 0.45 : 0);
      ap.y += ap.vy;
      if (ap.x < -30 || ap.x > W + 110 || ap.y < -30 || ap.y > H + 24) {
        ambientParticles.splice(i, 1);
      }
    }
  }

  function drawAmbientParticles() {
    if (!ambientParticles.length) return;
    ctx.save();
    for (const ap of ambientParticles) {
      if (ap.mode === "rain") {
        ctx.strokeStyle = ap.color;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(ap.x, ap.y);
        ctx.lineTo(ap.x + ap.vx * 1.4, ap.y + ap.size);
        ctx.stroke();
      } else if (ap.mode === "sakura") {
        ctx.save();
        ctx.translate(ap.x, ap.y);
        ctx.rotate(ap.phase);
        ctx.fillStyle = ap.color;
        ctx.globalAlpha = 0.82;
        ctx.fillRect(-ap.size / 2, -ap.size / 3, ap.size, ap.size * 0.65);
        ctx.restore();
      } else {
        ctx.globalAlpha = 0.55 + Math.sin(ap.phase) * 0.35;
        ctx.fillStyle = ap.color;
        ctx.beginPath();
        ctx.arc(ap.x, ap.y, ap.size, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.restore();
  }

  function updateFloatingTexts() {
    for (let i = floatingTexts.length - 1; i >= 0; i--) {
      const ft = floatingTexts[i];
      ft.y += ft.vy;
      ft.life--;
      if (ft.life <= 0) floatingTexts.splice(i, 1);
    }
  }

  function updateCamera() {
    const targetX = cameraLocked
      ? cameraLockX
      : Math.max(0, Math.min(stageWidth - W, player.x - W * 0.38));
    cameraX += (targetX - cameraX) * 0.12;
  }

  // =========================================================================
  // RENDERING
  // =========================================================================
  function render() {
    document.body.classList.toggle("in-menu", gameState === STATE.TITLE || gameState === STATE.WORLD_MAP);
    ctx.save();
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.scale(canvas.width / W, canvas.height / H);
    if (shakeTime > 0) {
      const sx = (Math.random() - 0.5) * shakeMag * 2;
      const sy = (Math.random() - 0.5) * shakeMag * 2;
      ctx.translate(sx, sy);
    }

    if (gameState === STATE.WORLD_MAP) {
      drawWorldMapOverlay();
      ctx.restore();
      if (window.shaderFX) window.shaderFX.render(false);
      return;
    }

    if (window.WorldTour && window.WorldTour.getStage(currentStage)) {
      window.WorldTour.drawBackground(ctx, currentStage, cameraX, stageWidth, W, H);
    } else if (currentStage === 1) {
      drawHarbourBackground();
    } else if (currentStage === 2) {
      drawRestroomBackground();
    } else if (currentStage === 6) {
      window.AirportStage.drawAirportBackground(ctx, W, H, tick);
    } else if (currentStage === 7) {
      drawTiledLabBackground("bg_dadaocheng", drawHarbourBackground);
    } else if (currentStage === 8) {
      const bgTrain = window.sprites && window.sprites.get("bg_train");
      if (bgTrain) {
        ctx.save();
        ctx.imageSmoothingEnabled = false;
        const clampedCam = Math.max(0, Math.min(bgTrain.width - W, Math.round(cameraX)));
        ctx.drawImage(bgTrain, -clampedCam, 0);
        ctx.restore();
      } else {
        drawHarbourBackground();
      }
    } else if (currentStage === 3) {
      drawTiledLabBackground("bg_lab_f1", () => window.BioArt.drawLabFloor1Bg(ctx, W, H, cameraX, tick));
    } else if (currentStage === 4) {
      drawTiledLabBackground("bg_lab_b1", () => window.BioArt.drawLabFloor1Bg(ctx, W, H, cameraX, tick));
    } else {
      drawTiledLabBackground("bg_lab_b2", () => window.BioArt.drawLabFloor3Bg(ctx, W, H, cameraX, tick));
    }

    // Draw Phase 3 Boss Dive Target Reticle on ground!
    for (const e of enemies) {
      if (e.type === "genex_boss" && e.bossPhase === 3 && e.diveState !== "none" && !e.dead) {
        const tx = Math.floor(e.diveTargetX - cameraX);
        const ty = Math.floor(e.diveTargetY);
        const pulse = Math.sin(tick * 0.4) * 6;
        ctx.save();
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        ctx.ellipse(tx, ty, 38 + pulse, 14 + pulse * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = "rgba(239, 68, 68, 0.28)";
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("⚠ DANGER: DIVE! ⚠", tx, ty + 4);
        ctx.restore();
      }
    }

    // Collect depth-sorted drawables
    const drawables = [];
    for (const s of smokers) {
      drawables.push({ y: s.y, fn: () => drawSmoker(s) });
    }
    for (const pk of pickups) {
      drawables.push({ y: pk.y, fn: () => drawBrisketPickup(pk) });
    }
    for (const e of enemies) {
      drawables.push({ y: e.y, fn: () => drawEnemy(e) });
    }
    if (player) {
      drawables.push({ y: player.y, fn: () => drawHero(player) });
    }

    drawables.sort((a, b) => a.y - b.y);
    for (const d of drawables) d.fn();

    drawSlashEffectsAndWaves();
    drawEnemyProjectiles();
    drawParticles();
    drawAmbientParticles();
    drawFloatingTexts();

    if (justDodgeFlashTimer > 0) {
      ctx.fillStyle = `rgba(56, 189, 248, ${(justDodgeFlashTimer / 16) * 0.24})`;
      ctx.fillRect(0, 0, W, H);
    }

    if (koFlashTimer > 0) {
      const a = Math.min(1, koFlashTimer / 28);
      ctx.fillStyle = `rgba(255, 255, 255, ${a * 0.45})`;
      ctx.fillRect(0, 0, W, H);
      ctx.save();
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 12;
      ctx.fillStyle = "#fef08a";
      ctx.font = "900 46px monospace";
      ctx.fillText("K.O.!", W / 2, H / 2 - 6);
      ctx.restore();
    }

    if (currentStage === 4) {
      window.BioArt.drawToxicGasOverlay(ctx, W, H, tick);
    }

    if (currentStage === 6) {
      window.AirportStage.drawEffectsOverlay(ctx, enemies, tick);
    }

    if (gameState === STATE.RELOAD_CUTSCENE) {
      drawReloadLightningOverlay();
    }

    if (gameState === STATE.BOSS_MUTATE) {
      drawBossMutateOverlay();
    }

    if (player && player.speechTimer > 0 && (gameState === STATE.PLAYING || gameState === STATE.AIRPORT_INTRO)) {
      drawSpeechBubble(player);
    }

    if (gameState !== STATE.TITLE) drawHUD();

    if (gameState === STATE.TITLE) drawTitleOverlay();
    if (gameState === STATE.STAGE_CLEAR && stageClearSummary && koFlashTimer <= 10) drawStageClearOverlay();
    if (gameState === STATE.PAUSED) drawCenterBanner("PAUSED", "Press P to resume");
    if (gameState === STATE.GAME_OVER) drawCenterBanner("GAME OVER", "Press ENTER or Click to retry");
    if (gameState === STATE.VICTORY) drawVictoryOverlay();

    ctx.restore();
    if (window.shaderFX) window.shaderFX.render(Boolean(player && isBuff()));
  }

  function drawTiledLabBackground(spriteKey, fallbackFn) {
    const bg = window.sprites && window.sprites.get(spriteKey);
    if (bg) {
      const tileW = W;
      const startTile = Math.floor(cameraX / tileW);
      for (let t = startTile; t <= startTile + 1; t++) {
        const drawX = Math.floor(t * tileW - cameraX);
        ctx.save();
        if (Math.abs(t) % 2 === 1) {
          ctx.translate(drawX + tileW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bg, 0, 0, tileW, H);
        } else {
          ctx.drawImage(bg, drawX, 0, tileW, H);
        }
        ctx.restore();
      }
      return;
    }
    fallbackFn();
  }

  function drawEnemyProjectiles() {
    for (const pr of enemyProjectiles) {
      const sx = Math.floor(pr.x - cameraX);
      const sy = Math.floor(pr.y - pr.z);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(pr.facing, 1);
      ctx.fillStyle = pr.color;
      ctx.beginPath();
      ctx.moveTo(-8, -28);
      ctx.quadraticCurveTo(22, 0, -8, 28);
      ctx.quadraticCurveTo(6, 0, -8, -28);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.moveTo(-3, -20);
      ctx.quadraticCurveTo(14, 0, -3, 20);
      ctx.quadraticCurveTo(4, 0, -3, -20);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBossMutateOverlay() {
    const flash = Math.sin(tick * 0.45) * 0.5 + 0.5;
    ctx.fillStyle = `rgba(127, 29, 29, ${0.15 + flash * 0.22})`;
    ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(10, 10, 18, 0.88)";
    ctx.fillRect(40, 68, W - 80, 56);
    ctx.strokeStyle = "#ef4444";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(40, 68, W - 80, 56);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fca5a5";
    ctx.font = "900 15px monospace";
    ctx.fillText(bossMutateTitle, W / 2, 92);
    ctx.fillStyle = "#fef08a";
    ctx.font = "bold 11px monospace";
    ctx.fillText(bossMutateSub, W / 2, 112);
  }

  function drawWorldMapOverlay() {
    // Full-Screen Interactive Southeast Asia 4-Country Tour Map (24 Stages!)
    if (worldMapView === "sea") {
      ctx.fillStyle = "#0b1120";
      ctx.fillRect(0, 0, W, H);
      const grad = ctx.createRadialGradient(W / 2, H / 2, 30, W / 2, H / 2, 340);
      grad.addColorStop(0, "rgba(245, 158, 11, 0.14)");
      grad.addColorStop(1, "rgba(11, 17, 32, 0)");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      ctx.fillStyle = "rgba(9, 13, 22, 0.90)";
      ctx.fillRect(0, 0, W, 38);
      ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
      ctx.fillRect(8, 7, 118, 24);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(8, 7, 118, 24);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("◀ 返回世界地圖", 67, 23);

      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 12px monospace";
      ctx.fillText("🌏 東南亞巡迴 — 4 國 24 關任選開戰！", W / 2, 23);

      ctx.fillStyle = "rgba(180, 83, 9, 0.92)";
      ctx.fillRect(518, 7, 114, 24);
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(518, 7, 114, 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText("切換 🇹🇼 台灣 ▶", 575, 23);

      const countries = [
        { label: "🇲🇾 馬來西亞", base: 301, color: "#eab308" },
        { label: "🇸🇬 新加坡", base: 401, color: "#ef4444" },
        { label: "🇹🇭 泰國", base: 501, color: "#f59e0b" },
        { label: "🇻🇳 越南", base: 601, color: "#f43f5e" },
      ];
      const tabW = (W - 24) / 4;
      countries.forEach((c, idx) => {
        const tx = 12 + idx * tabW;
        const active = idx === seaSelectedCountry;
        let clearedCnt = 0;
        for (let k = 0; k < 6; k++) if (getStageRecord(c.base + k)) clearedCnt++;
        ctx.fillStyle = active ? "rgba(30, 41, 59, 0.98)" : "rgba(15, 23, 42, 0.72)";
        ctx.fillRect(tx + 2, 44, tabW - 4, 28);
        ctx.strokeStyle = active ? c.color : "#334155";
        ctx.lineWidth = active ? 2 : 1.2;
        ctx.strokeRect(tx + 2, 44, tabW - 4, 28);
        ctx.fillStyle = active ? "#ffffff" : "#94a3b8";
        ctx.font = "bold 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${c.label} (${clearedCnt}/6)`, tx + tabW / 2, 62);
      });

      const curC = countries[seaSelectedCountry] || countries[0];
      for (let i = 0; i < 6; i++) {
        const stId = curC.base + i;
        const st = window.WorldTour ? window.WorldTour.getStage(stId) : null;
        if (st && window.sprites && window.sprites.ensureRaw) {
          window.sprites.ensureRaw(st.bgKey, st.bgSrc);
        }
        const rec = getStageRecord(stId);
        const col = i % 3;
        const row = Math.floor(i / 3);
        const sx = 18 + col * 204;
        const sy = 88 + row * 124;

        ctx.save();
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(sx, sy, 194, 112);

        // Real Scenic Stage Background Thumbnail inside each SEA Card!
        const thumb = st && window.sprites ? window.sprites.get(st.bgKey) : null;
        if (thumb && thumb.width > 0) {
          ctx.save();
          ctx.beginPath();
          ctx.rect(sx, sy, 194, 112);
          ctx.clip();
          const cropW = Math.min(thumb.width, Math.round(thumb.height * (194 / 112)));
          const cropX = Math.max(0, Math.round((thumb.width - cropW) * 0.45));
          ctx.drawImage(thumb, cropX, 0, cropW, thumb.height, sx, sy, 194, 112);
          ctx.restore();
        }

        // Rich dark gradient scrim for crisp arcade legibility
        const scrim = ctx.createLinearGradient(sx, sy, sx, sy + 112);
        scrim.addColorStop(0, "rgba(9, 13, 24, 0.28)");
        scrim.addColorStop(0.45, "rgba(9, 13, 24, 0.52)");
        scrim.addColorStop(1, "rgba(6, 10, 20, 0.92)");
        ctx.fillStyle = scrim;
        ctx.fillRect(sx, sy, 194, 112);

        ctx.strokeStyle = rec ? "#4ade80" : curC.color;
        ctx.lineWidth = rec ? 2 : 1.6;
        ctx.strokeRect(sx, sy, 194, 112);

        // Glowing stage number pill
        ctx.fillStyle = curC.color;
        ctx.fillRect(sx + 8, sy + 8, 28, 17);
        ctx.fillStyle = "#0f172a";
        ctx.font = "900 10px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`0${i + 1}`, sx + 22, sy + 20);

        if (rec) {
          ctx.fillStyle = "rgba(21, 128, 61, 0.92)";
          ctx.fillRect(sx + 138, sy + 8, 48, 17);
          ctx.fillStyle = "#fef08a";
          ctx.font = "900 9.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`✓ ${rec.bestRank}級`, sx + 162, sy + 20);
        }

        ctx.textAlign = "left";
        ctx.shadowColor = "rgba(0,0,0,0.92)";
        ctx.shadowBlur = 4;
        ctx.fillStyle = "#ffffff";
        ctx.font = "900 11.5px monospace";
        ctx.fillText(st ? st.hudName : `STAGE 0${i + 1}`, sx + 10, sy + 68);

        ctx.fillStyle = "#e2e8f0";
        ctx.font = "bold 8.5px monospace";
        const bossShort = st && st.enemies && st.enemies.boss ? st.enemies.boss.name.replace(/^.*—\s*/, "BOSS: ") : "STAGE BOSS";
        ctx.fillText(bossShort.slice(0, 18), sx + 10, sy + 84);

        ctx.fillStyle = "#fde047";
        ctx.font = "bold 9px monospace";
        ctx.fillText(rec ? `最佳 ${rec.bestScore}  ▶ 再戰` : "▶ 點擊立即開戰！", sx + 10, sy + 102);
        ctx.restore();
      }
      return;
    }

    // Full-Screen Interactive Taiwan or Japan Overworld Sub-Map!
    if (worldMapView === "taiwan" || worldMapView === "japan") {
      const isTw = worldMapView === "taiwan";
      const bg = window.sprites && window.sprites.get(isTw ? "map_taiwan_full" : "map_japan_full");
      if (bg) {
        ctx.save();
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(bg, 0, 0, W, H);
        ctx.restore();
      } else {
        ctx.fillStyle = "#0c4a6e";
        ctx.fillRect(0, 0, W, H);
      }

      const nodes = isTw ? TAIWAN_MAP_NODES : JAPAN_MAP_NODES;
      const accent = isTw ? "#f59e0b" : "#f472b6";

      // Draw interactive badges & pulsing highlight on selected landmark
      for (let i = 0; i < nodes.length; i++) {
        const n = nodes[i];
        const active = i === selectedRegionNode;
        // Draw explicit 07 badge for Dadaocheng on Taiwan map (since 01..06 are painted in art)
        if (isTw && n.num === "07") {
          ctx.save();
          ctx.fillStyle = active ? "#fcd34d" : "#fef3c7";
          ctx.fillRect(n.x - 16, n.y - 10, 32, 20);
          ctx.strokeStyle = "#1e293b";
          ctx.lineWidth = 2;
          ctx.strokeRect(n.x - 16, n.y - 10, 32, 20);
          ctx.fillStyle = "#0f172a";
          ctx.font = "900 11px monospace";
          ctx.textAlign = "center";
          ctx.fillText("07", n.x, n.y + 4);
          ctx.restore();
        }
        // Cleared checkmark & Rank badge on Taiwan / Japan map landmarks!
        const rec = getStageRecord(n.stage);
        if (rec) {
          ctx.save();
          ctx.fillStyle = "rgba(21, 128, 61, 0.92)";
          ctx.fillRect(n.x + 12, n.y - 16, 30, 14);
          ctx.strokeStyle = "#86efac";
          ctx.lineWidth = 1;
          ctx.strokeRect(n.x + 12, n.y - 16, 30, 14);
          ctx.fillStyle = "#fef08a";
          ctx.font = "900 8.5px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`✓${rec.bestRank}`, n.x + 27, n.y - 6);
          ctx.restore();
        }
        if (active) {
          const pulse = Math.sin(tick * 0.16) * 4;
          ctx.save();
          ctx.strokeStyle = accent;
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.arc(n.x, n.y, 20 + pulse, 0, Math.PI * 2);
          ctx.stroke();
          ctx.fillStyle = "rgba(10, 15, 28, 0.90)";
          const label = `${n.num} ${n.name} ▶`;
          const lw = Math.max(108, label.length * 10 + 18);
          const lx = Math.max(8, Math.min(W - lw - 8, n.x - lw / 2));
          const ly = n.y > 300 ? n.y - 42 : n.y + 24;
          ctx.fillRect(lx, ly, lw, 20);
          ctx.strokeStyle = accent;
          ctx.lineWidth = 1.6;
          ctx.strokeRect(lx, ly, lw, 20);
          ctx.fillStyle = "#ffffff";
          ctx.font = "bold 10px monospace";
          ctx.textAlign = "center";
          ctx.fillText(label, lx + lw / 2, ly + 14);
          ctx.restore();
        }
      }

      // Top Navigation Bar: Back to World Map + Title + Quick Switch Taiwan <-> Japan
      ctx.fillStyle = "rgba(9, 13, 22, 0.82)";
      ctx.fillRect(0, 0, W, 38);
      // Back button
      ctx.fillStyle = "rgba(30, 41, 59, 0.95)";
      ctx.fillRect(8, 7, 118, 24);
      ctx.strokeStyle = "#94a3b8";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(8, 7, 118, 24);
      ctx.fillStyle = "#f8fafc";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.fillText("◀ 返回世界地圖", 67, 23);

      // Center title
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 12px monospace";
      ctx.fillText(
        isTw ? "🇹🇼 台灣大地圖 — 點擊 01～07 地標直接開戰！" : "🇯🇵 日本大地圖 — 點擊 01～06 地標直接開戰！",
        W / 2,
        23
      );

      // Quick region switch pill (Taiwan -> Japan -> SEA)
      ctx.fillStyle = isTw ? "rgba(157, 23, 77, 0.92)" : "rgba(180, 83, 9, 0.92)";
      ctx.fillRect(518, 7, 114, 24);
      ctx.strokeStyle = isTw ? "#f472b6" : "#fcd34d";
      ctx.lineWidth = 1.4;
      ctx.strokeRect(518, 7, 114, 24);
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(isTw ? "切換 🇯🇵 日本 ▶" : "切換 🌏 東南亞 ▶", 575, 23);
      return;
    }

    // Smooth 3-tier vertical camera pan:
    // 0 = Row 1 (Island 1 / Bio-Island), 326 = Row 2 (Taiwan / Japan), 663 = Row 3 (Southeast Asia 4 Countries!)
    const targetMapY = selectedIsland === 4 ? 663 : (selectedIsland === 2 || selectedIsland === 3) ? 326 : 0;
    mapCameraY += (targetMapY - mapCameraY) * 0.11;

    const mapBg = window.sprites && window.sprites.get("map_island");
    if (mapBg) {
      const mapDrawH = Math.round(W * (mapBg.height / mapBg.width));
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(mapBg, 0, -mapCameraY, W, mapDrawH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#0c4a6e";
      ctx.fillRect(0, 0, W, H);
    }

    // Animated dashed sea routes (in world-map space shifted by -mapCameraY!)
    ctx.save();
    ctx.translate(0, -mapCameraY);
    ctx.strokeStyle = "rgba(252, 211, 77, 0.88)";
    ctx.lineWidth = 2.2;
    ctx.setLineDash([6, 6]);
    ctx.lineDashOffset = -tick * 0.45;
    ctx.beginPath();
    // Route 1: Island 1 -> Bio-Island
    ctx.moveTo(212, 165);
    ctx.quadraticCurveTo(328, 120, 452, 162);
    // Route 2: Island 1 -> South down to Taiwan Island
    ctx.moveTo(166, 265);
    ctx.quadraticCurveTo(156, 340, 174, 412);
    // Route 3: Taiwan Island -> East across sea to Japan Archipelago!
    ctx.moveTo(222, 474);
    ctx.quadraticCurveTo(334, 434, 452, 466);
    // Route 4: Bio-Island -> South down to Japan Archipelago!
    ctx.moveTo(486, 258);
    ctx.quadraticCurveTo(504, 336, 486, 404);
    // Route 5: Taiwan -> South down to Thailand & Malaysia!
    ctx.moveTo(174, 492);
    ctx.quadraticCurveTo(186, 628, 228, 768);
    // Route 6: Japan -> South down to Vietnam & Singapore!
    ctx.moveTo(482, 496);
    ctx.quadraticCurveTo(470, 636, 424, 776);
    // Route 7: Southeast Asia internal sea loop (Thailand -> Malaysia -> Singapore -> Vietnam)
    ctx.moveTo(228, 768);
    ctx.quadraticCurveTo(212, 828, 226, 890);
    ctx.quadraticCurveTo(336, 926, 446, 906);
    ctx.quadraticCurveTo(458, 842, 424, 776);
    ctx.stroke();

    // Glowing Map Pins anchored on all islands + 4 Southeast Asia countries in world-map space!
    const pins = [
      { idx: 0, x: 175, y: 138, color: "#f59e0b", label: "海港＆末班機" },
      { idx: 1, x: 486, y: 142, color: "#4ade80", label: "生化島研究所" },
      { idx: 2, x: 174, y: 454, color: "#ef4444", label: "🇹🇼 台灣巡迴 (7大關卡)" },
      { idx: 3, x: 482, y: 456, color: "#f472b6", label: "🇯🇵 日本巡迴 (6大關卡)" },
      { idx: 4, x: 228, y: 768, color: "#f59e0b", label: "🇹🇭 泰國 (6關)" },
      { idx: 4, x: 424, y: 776, color: "#f43f5e", label: "🇻🇳 越南 (6關)" },
      { idx: 4, x: 226, y: 890, color: "#eab308", label: "🇲🇾 馬來西亞 (6關)" },
      { idx: 4, x: 446, y: 906, color: "#38bdf8", label: "🇸🇬 新加坡 (6關)" },
    ];
    for (const pin of pins) {
      const active = selectedIsland === pin.idx;
      const bounce = active ? Math.sin(tick * 0.14) * 5 : 0;
      const py = pin.y + bounce;
      if (active) {
        ctx.strokeStyle = pin.color;
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.arc(pin.x, py, 16 + Math.sin(tick * 0.16) * 3, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = active ? pin.color : "#94a3b8";
      ctx.beginPath();
      ctx.arc(pin.x, py, active ? 10 : 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#0f172a";
      ctx.lineWidth = 2;
      ctx.stroke();

      // Floating island landmark tag when active
      if (active) {
        ctx.fillStyle = "rgba(10, 15, 28, 0.88)";
        ctx.fillRect(pin.x - 76, py - 32, 152, 18);
        ctx.strokeStyle = pin.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pin.x - 76, py - 32, 152, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(pin.label, pin.x, py - 20);
      }
    }
    ctx.restore();

    // Compact Sleek Top Header Banner + Southeast Asia 24-Stage Tour Entry Pill
    ctx.fillStyle = "rgba(10, 14, 23, 0.85)";
    ctx.fillRect(0, 0, W, 42);
    ctx.textAlign = "left";
    ctx.fillStyle = "#fcd34d";
    ctx.font = "900 13px monospace";
    ctx.fillText("🗺️ WORLD MAP — 環球巡迴大地圖", 14, 20);
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 9px monospace";
    const inheritText = unlockedUltLevel >= 1 ? `★ 已繼承 Lv.${unlockedUltLevel} 大絕招！(點卡片切換視角，再點出發)` : "提示：點卡片切換視角，再點或按 Enter 出發！";
    ctx.fillText(inheritText, 14, 35);

    // Top-right glowing pill to enter Southeast Asia 4-Country Tour (24 Stages)
    let seaCleared = 0;
    for (const base of [301, 401, 501, 601]) {
      for (let k = 0; k < 6; k++) if (getStageRecord(base + k)) seaCleared++;
    }
    ctx.fillStyle = "rgba(180, 83, 9, 0.92)";
    ctx.fillRect(488, 7, 144, 28);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(488, 7, 144, 28);
    ctx.textAlign = "center";
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`🌏 東南亞巡迴 (${seaCleared}/24) ▶`, 560, 25);

    // Five Sleek Bottom Selection Cards (Island 1, Bio-Lab, Taiwan, Japan, Southeast Asia 4 Countries)
    const islands = [
      {
        idx: 0,
        x: 8,
        y: 288,
        w: 120,
        title: "ISLAND 1",
        sub: "海港・末班機",
        color: "#f59e0b",
      },
      {
        idx: 1,
        x: 134,
        y: 288,
        w: 120,
        title: "ISLAND 2",
        sub: "生化島 3層",
        color: "#4ade80",
      },
      {
        idx: 2,
        x: 260,
        y: 288,
        w: 120,
        title: "🇹🇼 台灣 ↓",
        sub: "7大關卡",
        color: "#ef4444",
      },
      {
        idx: 3,
        x: 386,
        y: 288,
        w: 120,
        title: "🇯🇵 日本 ↓",
        sub: "6關視差",
        color: "#f472b6",
      },
      {
        idx: 4,
        x: 512,
        y: 288,
        w: 120,
        title: "🌏 東南亞 ↓↓",
        sub: "4國 24關",
        color: "#fbbf24",
      },
    ];

    for (const isl of islands) {
      const active = selectedIsland === isl.idx;
      const cardCenterX = isl.x + isl.w / 2;
      ctx.fillStyle = active ? "rgba(10, 15, 28, 0.94)" : "rgba(10, 15, 28, 0.76)";
      ctx.fillRect(isl.x, isl.y, isl.w, 60);
      ctx.strokeStyle = active ? isl.color : "#475569";
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeRect(isl.x, isl.y, isl.w, 60);

      ctx.fillStyle = active ? "#ffffff" : "#cbd5e1";
      ctx.font = "bold 10.5px monospace";
      ctx.fillText(isl.title, cardCenterX, isl.y + 20);
      ctx.fillStyle = active ? isl.color : "#94a3b8";
      ctx.font = "bold 8.5px monospace";
      ctx.fillText(isl.sub, cardCenterX, isl.y + 37);
      if (active) {
        ctx.fillStyle = "#fcd34d";
        ctx.font = "bold 8.5px monospace";
        ctx.fillText("▶ ENTER / CLICK 出發!", cardCenterX, isl.y + 53);
      }
    }
  }

  // --- Stage 1: Colorful Coastal Harbour + Castle (Multi-Segment Parallax 32-bit Pixel Art!) ---
  function drawHarbourBackground() {
    const bgSky = window.sprites && window.sprites.get("bg_harbour_sky");
    const seg1 = window.sprites && window.sprites.get("bg_harbour_seg1");
    const seg2 = window.sprites && window.sprites.get("bg_harbour_seg2");
    const seg3 = window.sprites && window.sprites.get("bg_harbour_seg3");

    if (bgSky && seg1 && seg2 && seg3) {
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      // Layer 1: Far Parallax Sky + Coastal Cliffs + Hilltop Castle (960x360)
      const maxCamX = Math.max(1, stageWidth - W);
      const camRatio = Math.max(0, Math.min(1, cameraX / maxCamX));
      const skyDrawW = Math.max(W, Math.round((bgSky.width / bgSky.height) * H));
      const skyTravel = Math.max(0, skyDrawW - W);
      const skyX = -Math.round(camRatio * skyTravel);
      ctx.drawImage(bgSky, skyX, 0, skyDrawW, H);

      // Layer 2: Multi-Segment Seamless Harbour Street (Dock Crane -> Townhouses -> Castle Gate)
      const tileW = W;
      const startTile = Math.floor(cameraX / tileW);
      // 5 tiles cover stageWidth=3200px with exact building-to-building seamless edges:
      // t=0: Dock/Crane -> t=1: Shops -> t=2: Shops (mirrored) -> t=3: Shops -> t=4: Castle Gate
      const segmentPlan = [
        { img: seg1, flip: false },
        { img: seg2, flip: false },
        { img: seg2, flip: true },
        { img: seg2, flip: false },
        { img: seg3, flip: false },
      ];
      const camInt = Math.round(cameraX);
      for (let t = startTile; t <= startTile + 1; t++) {
        const idx = Math.max(0, Math.min(segmentPlan.length - 1, t));
        const seg = segmentPlan[idx];
        const drawX = t * tileW - camInt;
        ctx.save();
        if (seg.flip) {
          ctx.translate(drawX + tileW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(seg.img, 0, 0, tileW, H);
        } else {
          ctx.drawImage(seg.img, drawX, 0, tileW, H);
        }
        ctx.restore();
      }
      ctx.restore();

      // Subtle animated water sparkle along the harbour bottom edge
      ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
      for (let i = 0; i < 12; i++) {
        const wx = ((i * 72 - cameraX + Math.sin(tick * 0.05 + i) * 7) % (W + 72) + (W + 72)) % (W + 72) - 36;
        const wy = 342 + (i % 3) * 6;
        ctx.fillRect(Math.floor(wx), wy, 20, 2);
      }
      return;
    }

    const bg = window.sprites && window.sprites.get("bg_harbour");
    if (bg) {
      const tileW = W;
      const startTile = Math.floor(cameraX / tileW);
      for (let t = startTile; t <= startTile + 1; t++) {
        const drawX = Math.floor(t * tileW - cameraX);
        ctx.save();
        if (Math.abs(t) % 2 === 1) {
          ctx.translate(drawX + tileW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bg, 0, 0, tileW, H);
        } else {
          ctx.drawImage(bg, drawX, 0, tileW, H);
        }
        ctx.restore();
      }
      // Subtle animated water sparkle along the harbour bottom
      ctx.fillStyle = "rgba(186, 230, 253, 0.55)";
      for (let i = 0; i < 12; i++) {
        const wx = ((i * 72 - cameraX + Math.sin(tick * 0.05 + i) * 7) % (W + 72) + (W + 72)) % (W + 72) - 36;
        const wy = 338 + (i % 3) * 7;
        ctx.fillRect(Math.floor(wx), wy, 22, 2);
      }
      return;
    }

    // Fallback procedural sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, 220);
    sky.addColorStop(0, "#38bdf8");
    sky.addColorStop(0.65, "#93c5fd");
    sky.addColorStop(1, "#e0f2fe");
    ctx.fillStyle = sky;
    ctx.fillRect(0, 0, W, 225);

    // Drifting clouds (parallax 0.15)
    ctx.fillStyle = "rgba(255,255,255,0.85)";
    for (let i = 0; i < 6; i++) {
      const cx = ((i * 180 + tick * 0.15 - cameraX * 0.15) % (W + 160) + (W + 160)) % (W + 160) - 80;
      const cy = 28 + (i % 3) * 24;
      ctx.fillRect(cx, cy, 52, 14);
      ctx.fillRect(cx + 10, cy - 8, 30, 10);
    }

    // Distant Jersey / Mont Orgueil Castle on grassy hill (parallax 0.3)
    const castleBaseX = 410 - cameraX * 0.25;
    // Green hill
    ctx.fillStyle = "#4d7c0f";
    ctx.beginPath();
    ctx.moveTo(castleBaseX - 110, 215);
    ctx.lineTo(castleBaseX - 30, 118);
    ctx.lineTo(castleBaseX + 160, 110);
    ctx.lineTo(castleBaseX + 260, 215);
    ctx.fill();

    // Castle stone walls & battlements
    ctx.fillStyle = "#a89882";
    ctx.fillRect(castleBaseX, 74, 130, 72);
    ctx.fillStyle = "#8c7b66";
    ctx.fillRect(castleBaseX + 18, 46, 44, 48);
    ctx.fillRect(castleBaseX + 82, 56, 38, 42);
    // Battlements
    ctx.fillStyle = "#c2b39c";
    for (let b = 0; b < 6; b++) {
      ctx.fillRect(castleBaseX + b * 22, 68, 12, 8);
    }
    ctx.fillStyle = "#451a03";
    ctx.fillRect(castleBaseX + 34, 62, 10, 16);
    ctx.fillRect(castleBaseX + 96, 70, 8, 14);

    // Colorful Rowhouses (parallax 1.0 - synced with street)
    const houses = [
      { x: 20, w: 130, h: 126, color: "#ef4444", roof: "#334155", sign: "PUB" },
      { x: 152, w: 138, h: 136, color: "#facc15", roof: "#1e293b", sign: "POST OFFICE" },
      { x: 292, w: 126, h: 122, color: "#2dd4bf", roof: "#334155", sign: "CAFE" },
      { x: 420, w: 136, h: 132, color: "#3b82f6", roof: "#1e293b", sign: "" },
      { x: 560, w: 150, h: 112, color: "#eab308", roof: "#475569", sign: "HARBOUR" },
      { x: 740, w: 130, h: 138, color: "#fb923c", roof: "#334155", sign: "BAKERY" },
      { x: 874, w: 144, h: 126, color: "#38bdf8", roof: "#1e293b", sign: "POST OFFICE" },
      { x: 1022, w: 132, h: 134, color: "#f43f5e", roof: "#334155", sign: "" },
      { x: 1160, w: 156, h: 116, color: "#fde047", roof: "#475569", sign: "SMOKEHOUSE" },
      { x: 1340, w: 140, h: 132, color: "#60a5fa", roof: "#1e293b", sign: "CAFE" },
      { x: 1484, w: 148, h: 124, color: "#34d399", roof: "#334155", sign: "" },
      { x: 1636, w: 140, h: 136, color: "#f59e0b", roof: "#1e293b", sign: "DOCKS" },
    ];

    const streetTop = 216;
    for (const hs of houses) {
      const sx = Math.floor(hs.x - cameraX);
      if (sx + hs.w < -20 || sx > W + 20) continue;

      const topY = streetTop - hs.h;
      // Building body
      ctx.fillStyle = hs.color;
      ctx.fillRect(sx, topY, hs.w, hs.h);
      // Outline
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 2;
      ctx.strokeRect(sx + 1, topY + 1, hs.w - 2, hs.h - 2);

      // Pitched Roof
      ctx.fillStyle = hs.roof;
      ctx.beginPath();
      ctx.moveTo(sx - 6, topY + 2);
      ctx.lineTo(sx + hs.w / 2, topY - 26);
      ctx.lineTo(sx + hs.w + 6, topY + 2);
      ctx.closePath();
      ctx.fill();
      // Chimney
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(sx + hs.w - 28, topY - 24, 14, 22);

      // Windows
      for (let wy = 0; wy < 2; wy++) {
        for (let wx = 0; wx < 2; wx++) {
          const xw = sx + 18 + wx * (hs.w - 60);
          const yw = topY + 18 + wy * 44;
          if (wy === 1 && wx === 0) continue; // space for door
          ctx.fillStyle = "#1e3a5f";
          ctx.fillRect(xw, yw, 24, 28);
          ctx.fillStyle = "#bae6fd";
          ctx.fillRect(xw + 3, yw + 3, 8, 10);
          ctx.fillRect(xw + 13, yw + 3, 8, 10);
          ctx.fillRect(xw + 3, yw + 15, 8, 10);
          ctx.fillRect(xw + 13, yw + 15, 8, 10);
        }
      }

      // Door
      ctx.fillStyle = "#451a03";
      ctx.fillRect(sx + 18, streetTop - 44, 26, 44);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(sx + 38, streetTop - 22, 3, 3);

      // Shop sign
      if (hs.sign) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(sx + 14, topY + 54, hs.w - 28, 16);
        ctx.fillStyle = "#f8fafc";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(hs.sign, sx + hs.w / 2, topY + 65);
      }
    }

    // Cobblestone Street
    ctx.fillStyle = "#64748b";
    ctx.fillRect(0, streetTop, W, 106);
    ctx.fillStyle = "#94a3b8";
    ctx.fillRect(0, streetTop, W, 8);
    // Paving tile lines
    ctx.fillStyle = "#475569";
    for (let y = streetTop + 14; y < 318; y += 16) {
      ctx.fillRect(0, y, W, 2);
      const offset = ((y / 16) % 2) * 24;
      for (let x = -((cameraX + offset) % 48); x < W; x += 48) {
        ctx.fillRect(Math.floor(x), y, 2, 16);
      }
    }

    // Waterfront stone ledge + Harbour Water at bottom!
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 318, W, 12);
    ctx.fillStyle = "#64748b";
    for (let x = -(cameraX % 40); x < W; x += 40) {
      ctx.fillRect(Math.floor(x), 318, 2, 12);
    }

    // Shimmering Harbour Water
    ctx.fillStyle = "#0284c7";
    ctx.fillRect(0, 330, W, 30);
    ctx.fillStyle = "#38bdf8";
    for (let i = 0; i < 14; i++) {
      const wx = ((i * 64 - cameraX * 1.0 + Math.sin(tick * 0.06 + i) * 8) % (W + 64) + (W + 64)) % (W + 64) - 32;
      const wy = 336 + (i % 3) * 8;
      ctx.fillRect(Math.floor(wx), wy, 28, 3);
    }
  }

  // --- Stage 2: Iconic Men's Restroom (Extended HD 16-bit Corridor!) ---
  function drawRestroomBackground() {
    const bg = window.sprites && window.sprites.get("bg_restroom");
    if (bg) {
      const tileW = W;
      const startTile = Math.floor(cameraX / tileW);
      for (let t = startTile; t <= startTile + 1; t++) {
        const drawX = Math.floor(t * tileW - cameraX);
        ctx.save();
        if (Math.abs(t) % 2 === 1) {
          ctx.translate(drawX + tileW, 0);
          ctx.scale(-1, 1);
          ctx.drawImage(bg, 0, 0, tileW, H);
        } else {
          ctx.drawImage(bg, drawX, 0, tileW, H);
        }
        ctx.restore();
      }
      return;
    }

    // Fallback tiled upper wall
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(0, 0, W, 224);

    // Subtle tile grid
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1;
    for (let y = 0; y < 224; y += 16) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }
    for (let x = -(cameraX % 32); x < W; x += 32) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 224);
      ctx.stroke();
    }

    // Mirrors & Sinks on left side
    for (let i = 0; i < 3; i++) {
      const mx = Math.floor(42 + i * 96 - cameraX);
      // Mirror
      ctx.fillStyle = "#64748b";
      ctx.fillRect(mx - 2, 46, 68, 84);
      ctx.fillStyle = "#bae6fd";
      ctx.fillRect(mx, 48, 64, 80);
      // Diagonal reflection gleam
      ctx.fillStyle = "rgba(255,255,255,0.45)";
      ctx.fillRect(mx + 8, 56, 12, 64);
      // Sink basin
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(mx + 4, 148, 56, 22);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(mx + 26, 170, 12, 46);
      // Faucet
      ctx.fillStyle = "#475569";
      ctx.fillRect(mx + 30, 138, 6, 12);
    }

    // Urinals on right side (just like the video!)
    for (let i = 0; i < 4; i++) {
      const ux = Math.floor(380 + i * 84 - cameraX);
      // Chrome pipe
      ctx.fillStyle = "#64748b";
      ctx.fillRect(ux + 18, 96, 8, 22);
      ctx.fillRect(ux + 12, 102, 20, 6);
      // Porcelain urinal
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(ux + 4, 118, 36, 56);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(ux + 10, 126, 24, 38);
      ctx.strokeStyle = "#94a3b8";
      ctx.strokeRect(ux + 4, 118, 36, 56);
    }

    // Restroom checkered floor
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(0, 224, W, H - 224);
    for (let row = 0; row < 6; row++) {
      const fy = 224 + row * 24;
      for (let col = -1; col < 24; col++) {
        if ((row + col) % 2 === 0) {
          ctx.fillStyle = "#94a3b8";
          ctx.fillRect(Math.floor(col * 36 - (cameraX % 72)), fy, 36, 24);
        }
      }
    }
  }

  // --- BBQ Smoker & Juicy Smoked Brisket ---
  function drawSmoker(s) {
    const sx = Math.floor(s.x - cameraX);
    const sy = Math.floor(s.y);
    if (sx < -68 || sx > W + 68) return;

    // Soft elliptical ground shadow
    ctx.fillStyle = "rgba(0, 0, 0, 0.36)";
    ctx.beginPath();
    ctx.ellipse(sx, sy - 1, 26, 6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Warm charcoal firebox glow when full
    if (s.hasBrisket) {
      const glowPulse = 0.22 + Math.sin(tick * 0.14) * 0.08;
      ctx.fillStyle = `rgba(249, 115, 22, ${glowPulse.toFixed(2)})`;
      ctx.beginPath();
      ctx.ellipse(sx + 16, sy - 16, 14, 9, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    const smokerImg = window.sprites && window.sprites.get("prop_smoker");
    if (smokerImg) {
      const targetH = 54;
      const targetW = (smokerImg.width / smokerImg.height) * targetH;
      ctx.save();
      if (s.hitFlash > 0) {
        ctx.filter = "brightness(2.2)";
      } else if (!s.hasBrisket) {
        ctx.globalAlpha = 0.72;
      }
      ctx.drawImage(smokerImg, sx - targetW / 2, sy - targetH + 4, targetW, targetH);
      ctx.restore();
    } else {
      // Fallback procedural smoker
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(sx - 14, sy - 18, 4, 18);
      ctx.fillRect(sx + 12, sy - 18, 4, 18);
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(sx - 16, sy - 5, 8, 8);
      ctx.fillStyle = "#334155";
      ctx.fillRect(sx - 15, sy - 44, 6, 18);
      ctx.fillStyle = s.hitFlash > 0 ? "#fcd34d" : "#1e293b";
      ctx.fillRect(sx - 18, sy - 32, 38, 18);
      if (s.lidOpen) {
        ctx.fillStyle = "#334155";
        ctx.fillRect(sx - 16, sy - 42, 34, 8);
      }
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(sx - 6, sy - 25, 14, 3);
    }

    // Floating arcade BBQ hint pill if brisket is ready
    if (s.hasBrisket) {
      const bob = Math.sin(tick * 0.12) * 2;
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.fillRect(sx - 15, sy - 60 + bob, 30, 12);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1;
      ctx.strokeRect(sx - 15, sy - 60 + bob, 30, 12);
      ctx.fillStyle = "#fde047";
      ctx.font = "900 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BBQ", sx, sy - 51 + bob);
    }
  }

  function drawBrisketPickup(pk) {
    const px = Math.floor(pk.x - cameraX);
    const py = Math.floor(pk.y - pk.z - Math.sin(pk.bob) * 3);

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(px - 12, pk.y - 3, 24, 6);

    // Golden aura
    ctx.fillStyle = "rgba(251, 191, 36, 0.35)";
    ctx.beginPath();
    ctx.arc(px, py - 12, 20, 0, Math.PI * 2);
    ctx.fill();

    const brisketImg = window.sprites && window.sprites.get("prop_brisket");
    if (brisketImg) {
      const targetH = 30;
      const targetW = (brisketImg.width / brisketImg.height) * targetH;
      ctx.drawImage(brisketImg, px - targetW / 2, py - targetH + 2, targetW, targetH);
      return;
    }

    // Fallback procedural brisket
    ctx.fillStyle = "#3b1d0a";
    ctx.fillRect(px - 14, py - 16, 28, 14);
    // Juicy pink/red smoked meat interior & slices
    ctx.fillStyle = "#b91c1c";
    ctx.fillRect(px - 11, py - 13, 22, 9);
    ctx.fillStyle = "#f87171";
    ctx.fillRect(px - 9, py - 12, 5, 7);
    ctx.fillRect(px - 2, py - 12, 5, 7);
    ctx.fillRect(px + 5, py - 12, 5, 7);
    // Juicy white marbling / shine
    ctx.fillStyle = "#fef3c7";
    ctx.fillRect(px - 8, py - 11, 2, 2);
    ctx.fillRect(px + 0, py - 10, 2, 2);
    ctx.fillRect(px + 6, py - 11, 2, 2);
  }

  // --- Hero Dispatcher ---
  function drawHero(p) {
    const sx = Math.floor(p.x - cameraX);
    const sy = Math.floor(p.y);
    const buff = isBuff();

    // Blink on damage invulnerability (not during intentional skill i-frames)
    if (p.invulnTimer > 0 && p.skillActiveTimer <= 0 && Math.floor(p.invulnTimer / 3) % 2 === 0 && gameState !== STATE.RELOAD_CUTSCENE) {
      return;
    }

    const isShadowDashing = p.skillType === "shadow_dash" && p.skillActiveTimer > 4;
    if (isShadowDashing) {
      ctx.save();
      ctx.globalAlpha = 0.65;
    }

    if (buff) {
      drawUltimateAuraRing(p.charId || "mustache", sx, sy, 1.0);
    }

    if (p.charId === "fallen") {
      drawFallenSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "rose") {
      drawRoseSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "ling") {
      drawLingSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "magic") {
      drawMagicSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "nightheron") {
      drawNightHeronSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "ironfist") {
      drawIronFistSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "alice") {
      drawAliceSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "shaka") {
      drawShakaSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "raven") {
      drawRavenSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "momo") {
      drawMomoSprite(p, sx, sy, buff, 1.0);
    } else if (p.charId === "samurai") {
      drawSamuraiSprite(p, sx, sy, buff, 1.0);
    } else {
      drawMustacheSprite(p, sx, sy, buff, 1.0);
    }

    if (isShadowDashing) {
      ctx.restore();
    }

    // Golden aura ring around Mustache Hero during Ground Slam descent!
    if (p.skillType === "ground_slam" && p.skillActiveTimer > 0 && p.z > 2) {
      ctx.save();
      ctx.strokeStyle = "#fcd34d";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.arc(sx, sy - p.z - 34, 24, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  }

  // --- Rotating 2.5D Pixel-Art Ultimate Magic Aura Ring (All 10 Heroes!) ---
  function drawUltimateAuraRing(charId, sx, sy, scale = 1.0) {
    const key = `aura_${charId || "mustache"}`;
    const aura = window.sprites && window.sprites.get(key);
    const pulse = 1 + Math.sin(tick * 0.09) * 0.04;
    const angle = tick * 0.018;
    if (!aura) {
      if (charId === "ling") {
        // Four-Symbols elemental rotating ring (Teal/White/Red/Blue + Gold core)
        const r = 44 * scale * pulse;
        ctx.save();
        ctx.translate(sx, sy - 1);
        ctx.scale(1, 0.36);
        ctx.rotate(angle);
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 2.6;
        ctx.beginPath();
        ctx.arc(0, 0, r, 0, Math.PI * 2);
        ctx.stroke();
        const elemCols = ["#2dd4bf", "#f8fafc", "#ef4444", "#38bdf8"];
        for (let k = 0; k < 4; k++) {
          ctx.strokeStyle = elemCols[k];
          ctx.lineWidth = 3.2;
          ctx.beginPath();
          ctx.arc(0, 0, r * 0.78, k * (Math.PI / 2) + 0.15, (k + 1) * (Math.PI / 2) - 0.15);
          ctx.stroke();
        }
        ctx.restore();
      }
      return;
    }
    const size = 94 * scale * pulse;
    ctx.save();
    ctx.translate(sx, sy - 1);
    // 2.5D ground perspective squash (top-down circle -> isometric arcade floor ellipse!)
    ctx.scale(1, 0.36);
    ctx.rotate(angle);
    ctx.globalAlpha = 0.94;
    ctx.drawImage(aura, -size * 0.5, -size * 0.5, size, size);
    // Soft additive neon glow pass so every ring genuinely illuminates the floor!
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = 0.32 + Math.sin(tick * 0.14) * 0.10;
    ctx.drawImage(aura, -size * 0.52, -size * 0.52, size * 1.04, size * 1.04);
    ctx.restore();
  }

  // --- Fallen Angel (墮落天使: Wing Wind Pressure + Mark of Judgment + Remote Sky-Drop Skull Rain!) ---
  function drawFallenSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.42)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 25 * scale, 7.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "fallen_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "fallen_ult_awake" : "fallen_ult_idle";
    } else if (p.fallenFinisherVisual > 0) {
      spriteKey = p.fallenFinisherVisual > 20 ? "fallen_ult_lv3_charge" : "fallen_ult_lv3_finisher";
    } else if (p.skillType === "fallen_judgment" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 22
          ? "fallen_k_rise"
          : p.skillActiveTimer >= 15
          ? "fallen_k_slash"
          : p.skillActiveTimer >= 6
          ? "fallen_k_pillar"
          : "fallen_k_land";
    } else if (buff) {
      if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "fallen_ult_lv2_slam";
        } else if (unlockedUltLevel >= 2 && p.attackType === 1) {
          spriteKey = "fallen_ult_lv2_charge";
        } else if (p.attackType === 2) {
          spriteKey = "fallen_ult_lv1_wave";
        } else {
          spriteKey = "fallen_ult_lv1_slash";
        }
      } else {
        spriteKey = "fallen_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "fallen_atk1" : p.attackType === 1 ? "fallen_atk2" : "fallen_atk3";
    }

    const sprite = window.sprites && window.sprites.get(spriteKey);
    if (sprite) {
      const isColossal =
        spriteKey === "fallen_ult_lv3_charge" ||
        spriteKey === "fallen_ult_lv3_finisher" ||
        spriteKey === "fallen_ult_awake" ||
        spriteKey === "fallen_k_rise";
      const targetH = (isColossal ? 124 : 112) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = p.attackTimer > 2 || p.skillActiveTimer > 0 ? 0 : Math.abs(Math.sin(p.walkFrame)) * 3.0;
      const anchorOffsetX =
        spriteKey === "fallen_idle" ||
        spriteKey === "fallen_ult_idle" ||
        spriteKey === "fallen_ult_awake" ||
        spriteKey === "fallen_k_rise" ||
        spriteKey === "fallen_k_land"
          ? 0
          : spriteKey === "fallen_ult_lv3_finisher"
          ? 20 * scale
          : 12 * scale;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 3, targetW, targetH);
      ctx.restore();
    }
  }

  // --- Rose (蘿絲: Alice's Sister — Psychic Control + 3-Tier Inferno Fire Fist!) ---
  function drawRoseSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "rose_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "rose_ult_mass" : "rose_ult_idle";
    } else if (p.roseFinisherVisual > 0) {
      spriteKey = p.roseFinisherVisual > 18 ? "rose_ult_lv3_charge" : "rose_ult_lv3_finisher";
    } else if (p.skillType === "rose_psychic" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 21
          ? "rose_k_cast"
          : p.skillActiveTimer >= 14
          ? "rose_k_wave"
          : p.skillActiveTimer >= 6
          ? "rose_k_control"
          : "rose_k_smirk";
    } else if (buff) {
      if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "rose_ult_lv2_ring";
        } else if (unlockedUltLevel >= 2 && p.attackType === 1) {
          spriteKey = "rose_ult_lv2_charge";
        } else if (unlockedUltLevel >= 1 && p.attackType === 2) {
          spriteKey = "rose_ult_lv1_beam";
        } else {
          spriteKey = "rose_ult_lv1_flurry";
        }
      } else {
        spriteKey = "rose_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "rose_atk1" : p.attackType === 1 ? "rose_atk2" : "rose_atk3";
    }

    const sprite = window.sprites && window.sprites.get(spriteKey);
    if (sprite) {
      const isTallAura =
        spriteKey === "rose_ult_idle" ||
        spriteKey === "rose_ult_lv3_charge" ||
        spriteKey === "rose_ult_lv3_finisher";
      const targetH = (isTallAura ? 112 : 98) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = p.attackTimer > 2 || p.skillActiveTimer > 0 ? 0 : Math.abs(Math.sin(p.walkFrame)) * 3.0;
      const anchorOffsetX =
        spriteKey === "rose_idle" ||
        spriteKey === "rose_ult_idle" ||
        spriteKey === "rose_k_cast" ||
        spriteKey === "rose_k_smirk" ||
        spriteKey === "rose_ult_lv2_charge" ||
        spriteKey === "rose_ult_lv2_ring"
          ? 0
          : spriteKey === "rose_ult_lv3_finisher"
          ? 24 * scale
          : 15 * scale;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 3, targetW, targetH);
      ctx.restore();
    }
  }

  // --- Ling (鈴: Four-Symbols Summoner — White Tiger / Azure Dragon / Vermilion Bird / Black Tortoise!) ---
  function drawLingSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "ling_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "ling_ult_start" : "ling_ult_idle";
    } else if (p.lingFinisherVisual > 0) {
      spriteKey = p.lingFinisherVisual > 18 ? "ling_ult_lv3_charge" : "ling_ult_lv3_finisher";
    } else if (p.skillType === "ling_xuanwu" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 21
          ? "ling_k_cast"
          : p.skillActiveTimer >= 13
          ? "ling_k_shield"
          : p.skillActiveTimer >= 6
          ? "ling_k_push"
          : "ling_k_land";
    } else if (buff) {
      if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "ling_ult_lv2_water";
        } else if (unlockedUltLevel >= 2 && p.attackType === 1) {
          spriteKey = "ling_ult_lv2_fire";
        } else if (unlockedUltLevel >= 1 && p.attackType === 2) {
          spriteKey = "ling_ult_lv1";
        } else {
          spriteKey = "ling_ult_combo";
        }
      } else {
        spriteKey = "ling_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "ling_atk1" : p.attackType === 1 ? "ling_atk2" : "ling_atk3";
    }

    const sprite = window.sprites && window.sprites.get(spriteKey);
    if (sprite) {
      const isLargeBeast =
        spriteKey !== "ling_idle" &&
        spriteKey !== "ling_k_land";
      const targetH = (isLargeBeast ? 112 : 96) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = p.attackTimer > 2 || p.skillActiveTimer > 0 ? 0 : Math.abs(Math.sin(p.walkFrame)) * 3.0;
      const anchorOffsetX =
        spriteKey === "ling_idle" ||
        spriteKey === "ling_ult_idle" ||
        spriteKey === "ling_ult_start" ||
        spriteKey === "ling_k_cast" ||
        spriteKey === "ling_k_shield" ||
        spriteKey === "ling_k_push" ||
        spriteKey === "ling_k_land" ||
        spriteKey === "ling_ult_lv3_charge" ||
        spriteKey === "ling_ult_lv3_finisher"
          ? 0
          : 16 * scale;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 3, targetW, targetH);
      ctx.restore();
    }
  }

  // --- Magic (瑪姬: Dark Sorceress — Crowned Skulls + Dark Knight + Vortex Pull + Shadow Empress Ult!) ---
  function drawMagicSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "magic_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "magic_ult_rift" : "magic_ult_idle";
    } else if (p.magicFinisherVisual > 0) {
      spriteKey = p.magicFinisherVisual > 18 ? "magic_ult_lv3_empress" : "magic_ult_lv3_beam";
    } else if (p.skillType === "magic_vortex" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 22
          ? "magic_k_cast"
          : p.skillActiveTimer >= 16
          ? "magic_k_step"
          : p.skillActiveTimer >= 8
          ? "magic_k_pull"
          : "magic_k_burst";
    } else if (buff) {
      if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "magic_ult_lv2_vortex";
        } else if (unlockedUltLevel >= 2 && p.attackType === 1) {
          spriteKey = "magic_ult_lv2_pillars";
        } else if (unlockedUltLevel >= 1 && p.attackType === 2) {
          spriteKey = "magic_ult_lv1";
        } else {
          spriteKey = "magic_ult_skulls";
        }
      } else {
        spriteKey = "magic_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "magic_atk1" : p.attackType === 1 ? "magic_atk2" : "magic_atk3";
    }

    const sprite = window.sprites && window.sprites.get(spriteKey);
    if (sprite) {
      const isTallUlt =
        spriteKey === "magic_ult_idle" ||
        spriteKey === "magic_ult_lv3_empress" ||
        spriteKey === "magic_ult_lv3_beam";
      const targetH = (isTallUlt ? 114 : 98) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = p.attackTimer > 2 || p.skillActiveTimer > 0 ? 0 : Math.abs(Math.sin(p.walkFrame)) * 3.0;
      const anchorOffsetX =
        spriteKey === "magic_idle" || spriteKey === "magic_ult_idle"
          ? 0
          : spriteKey === "magic_ult_lv3_beam"
          ? 24 * scale
          : 14 * scale;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 3, targetW, targetH);
      ctx.restore();
    }
  }

  // --- Night Heron (長髮・夜鷺: Hands-in-Pockets Rain Kicks + Heel Tap Evade / Ultimate: Rain-Sky Blades + Team Combo!) ---
  function drawNightHeronSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "nh_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "nh_ult_tap" : "nh_ult_idle";
    } else if (p.nhFinisherVisual > 0) {
      spriteKey = p.nhFinisherVisual > 17 ? "nh_ult_lv3_launch" : "nh_ult_lv3_dive";
    } else if (p.skillType === "nh_evade_kick" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 20
          ? "nh_k_tap"
          : p.skillActiveTimer >= 12
          ? "nh_k_slide"
          : p.skillActiveTimer >= 5
          ? "nh_k_kick"
          : "nh_k_land";
    } else if (buff) {
      if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = p.attackTimer >= 8 ? "nh_ult_lv2_jump" : "nh_ult_lv2_axe";
        } else if (unlockedUltLevel >= 1 && p.attackType === 1) {
          spriteKey = "nh_ult_lv1";
        } else {
          spriteKey = "nh_ult_kick";
        }
      } else {
        spriteKey = "nh_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "nh_atk1" : p.attackType === 1 ? "nh_atk2" : "nh_atk3";
    }

    const sprite = window.sprites && (window.sprites.get(spriteKey) || window.sprites.get("nh_idle"));
    const attacking = p.attackTimer > 2;
    const walkBob = p.walkFrame > 0 && !attacking && p.skillActiveTimer <= 0 ? Math.abs(Math.sin(p.walkFrame)) * 2.8 : Math.sin(tick * 0.08) * 1.0;

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing, 1);

    if (sprite) {
      const isDuo = spriteKey === "nh_ult_lv3_launch" || spriteKey === "nh_ult_lv3_dive";
      const targetH = (isDuo ? 122 : 98) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      ctx.drawImage(sprite, -targetW * 0.5, -targetH + 6 * scale - walkBob, targetW, targetH);
    } else {
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-13 * scale, -78 * scale, 26 * scale, 76 * scale);
    }

    ctx.restore();
  }

  // --- Iron Fist (短髮・鐵拳: White-Bandage Feint Punch + Iron Shoulder Charge / Ultimate: Mountain-Shatter + Team Combo!) ---
  function drawIronFistSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "if_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "if_ult_steam" : "if_ult_idle";
    } else if (p.ifFinisherVisual > 0) {
      spriteKey = p.ifFinisherVisual > 17 ? "if_ult_lv3_launch" : "if_ult_lv3_combo";
    } else if (p.skillType === "if_shoulder" && p.skillActiveTimer > 0) {
      spriteKey =
        p.skillActiveTimer >= 19
          ? "if_k_wrap"
          : p.skillActiveTimer >= 14
          ? "if_k_guard"
          : p.skillActiveTimer >= 5
          ? "if_k_charge"
          : "if_k_slam";
    } else if (buff) {
      if (p.ifRocketTimer > 0) {
        spriteKey = p.ifRocketTimer >= 10 ? "if_ult_lv2_charge" : "if_ult_lv2_dash";
      } else if (p.attackTimer > 2) {
        spriteKey = unlockedUltLevel >= 1 && p.attackType === 1 ? "if_ult_lv1" : "if_ult_punch";
      } else {
        spriteKey = "if_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "if_atk1" : p.attackType === 1 ? "if_atk2" : "if_atk3";
    }

    const sprite = window.sprites && (window.sprites.get(spriteKey) || window.sprites.get("if_idle"));
    const attacking = p.attackTimer > 2;
    const walkBob = p.walkFrame > 0 && !attacking && p.skillActiveTimer <= 0 ? Math.abs(Math.sin(p.walkFrame)) * 3.0 : Math.sin(tick * 0.08) * 1.0;

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing, 1);

    if (sprite) {
      const isDuo = spriteKey === "if_ult_lv3_launch" || spriteKey === "if_ult_lv3_combo";
      const targetH = (isDuo ? 124 : 96) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      ctx.drawImage(sprite, -targetW * 0.5, -targetH + 6 * scale - walkBob, targetW, targetH);
    } else {
      ctx.fillStyle = "#334155";
      ctx.fillRect(-14 * scale, -76 * scale, 28 * scale, 74 * scale);
    }

    ctx.restore();
  }

  // --- Alice (愛麗絲 / The Broker: Brass Knuckles + Linguistic Armor Break / Ultimate: Linguistic Domain!) ---
  function drawAliceSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow + crimson-gold linguistic domain ring when Ultimate is active
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 20 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Select exact frame from Alice's 8-frame Normal & 8-frame Ultimate sheets!
    let spriteKey = "alice_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "alice_ult_start" : "alice_ult_idle";
    } else if (p.aliceSnapVisual > 0) {
      spriteKey = "alice_ult_lv3_snap";
    } else if (p.skillType === "alice_voice" && p.skillActiveTimer > 0) {
      if (p.skillActiveTimer >= 20) {
        spriteKey = "alice_k_touch";
      } else if (p.skillActiveTimer >= 13) {
        spriteKey = "alice_k_wave";
      } else {
        spriteKey = p.aliceCmdHit ? "alice_k_break" : "alice_k_push";
      }
    } else if (buff) {
      if (p.aliceDomainVisual > 0) {
        spriteKey = "alice_ult_lv3_domain";
      } else if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "alice_ult_lv2";
        } else if (unlockedUltLevel >= 1 && p.attackType === 1) {
          spriteKey = "alice_ult_lv1";
        } else {
          spriteKey = p.walkFrame > 0 && p.attackType === 0 ? "alice_ult_dash" : "alice_ult_punch";
        }
      } else {
        spriteKey = "alice_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "alice_atk1" : p.attackType === 1 ? "alice_atk2" : "alice_atk3";
    }

    const sprite = window.sprites && (window.sprites.get(spriteKey) || window.sprites.get("alice_idle"));
    const attacking = p.attackTimer > 2;
    const walkBob = p.walkFrame > 0 && !attacking && p.skillActiveTimer <= 0 ? Math.abs(Math.sin(p.walkFrame)) * 3.0 : Math.sin(tick * 0.08) * 1.0;
    const lungeX = attacking ? (buff ? 6 : 5) : 0;

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing, 1);

    if (sprite) {
      const isTallUlt = spriteKey === "alice_ult_lv3_domain" || spriteKey === "alice_ult_lv3_snap" || spriteKey === "alice_ult_idle";
      const targetH = (isTallUlt ? 100 : 94) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      ctx.drawImage(sprite, -targetW * 0.5 + lungeX, -targetH + 6 * scale - walkBob, targetW, targetH);
    } else {
      ctx.fillStyle = "#18181b";
      ctx.fillRect(-12 * scale, -76 * scale, 24 * scale, 74 * scale);
      ctx.fillStyle = "#e11d48";
      ctx.fillRect(-10 * scale, -64 * scale, 20 * scale, 5 * scale);
    }

    ctx.restore();
  }

  // --- Shaka (釋迦: Spectral Arm Extend + Restrain Bind / Ultimate: Thousand-Hand Multi-Control!) ---
  function drawShakaSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow + divine golden lotus aura ring when Ultimate is active
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Select exact frame from Shaka's 8-frame Normal & 8-frame Thousand-Hand Ultimate sheets!
    let spriteKey = "shaka_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey = reloadCutsceneTimer > 36 ? "shaka_ult_float" : "shaka_ult_idle";
    } else if (p.shakaFinisherVisual > 0) {
      spriteKey = "shaka_ult_lv3_finisher";
    } else if (p.skillType === "shaka_bind" && p.skillActiveTimer > 0) {
      if (p.skillActiveTimer >= 22) {
        spriteKey = "shaka_k_float";
      } else if (p.skillActiveTimer >= 16) {
        spriteKey = "shaka_k_grab";
      } else {
        spriteKey = p.shakaBindHit ? "shaka_k_bind" : "shaka_k_barrier";
      }
    } else if (buff) {
      if (p.shakaArrayVisual > 0) {
        spriteKey = "shaka_ult_lv3_array";
      } else if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = p.attackTimer >= 9 ? "shaka_ult_lv2_charge" : "shaka_ult_lv2_slam";
        } else if (unlockedUltLevel >= 1 && p.attackType === 1) {
          spriteKey = "shaka_ult_lv1";
        } else {
          spriteKey = "shaka_ult_multi";
        }
      } else {
        spriteKey = "shaka_ult_idle";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "shaka_atk1" : p.attackType === 1 ? "shaka_atk2" : "shaka_atk3";
    }

    const sprite = window.sprites && (window.sprites.get(spriteKey) || window.sprites.get("shaka_idle"));
    const attacking = p.attackTimer > 2;
    const hoverZ = buff ? 6 + Math.sin(tick * 0.1) * 3 : 0;
    const walkBob = p.walkFrame > 0 && !attacking && !buff ? Math.abs(Math.sin(p.walkFrame)) * 2.8 : Math.sin(tick * 0.08) * 1.0;

    ctx.save();
    ctx.translate(sx, sy - p.z - hoverZ);
    ctx.scale(p.facing, 1);

    if (sprite) {
      const isWideUlt =
        spriteKey === "shaka_ult_lv3_array" ||
        spriteKey === "shaka_ult_lv3_finisher" ||
        spriteKey === "shaka_ult_lv2_charge" ||
        spriteKey === "shaka_ult_lv2_slam";
      // Compensate for Shaka's overhead golden halo & towering spectral arms so his body matches the other heroes 1:1!
      const targetH = (isWideUlt ? 126 : buff ? 116 : 110) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      // Anchor slightly forward for long extending spectral arms so Shaka's body stays centered!
      const anchorOffsetX = spriteKey === "shaka_idle" || spriteKey === "shaka_k_float" || spriteKey === "shaka_ult_idle" || spriteKey === "shaka_ult_float" || spriteKey === "shaka_ult_lv3_array" ? 0 : targetW * 0.18;
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 6 * scale - walkBob, targetW, targetH);
    } else {
      ctx.fillStyle = "#f1f5f9";
      ctx.fillRect(-14 * scale, -76 * scale, 28 * scale, 74 * scale);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(-10 * scale, -82 * scale, 20 * scale, 6 * scale);
    }

    ctx.restore();
  }

  // --- Raven (暗影會・暗殺者: Assassin Dagger + Poison Knives / Ultimate: Eclipse Dual Pistols!) ---
  function drawRavenSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 20 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Select the exact frame from Raven's 8-frame Dagger & 8-frame Eclipse Dual-Pistol sheets!
    let spriteKey = "raven_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      // ① 日蝕起手 (摸後腰槍套＋金色月牙) -> ② 雙槍出鞘 (黑金日蝕光環)
      spriteKey = reloadCutsceneTimer > 36 ? "raven_ult_reach" : "raven_ult_draw";
    } else if (p.ravenFinisherVisual > 0) {
      // ⑧ Lv.3 收招・日蝕交叉處決
      spriteKey = "raven_ult_lv3_finisher";
    } else if (p.skillType === "grapple_smoke" && p.skillActiveTimer > 0) {
      if (p.skillActiveTimer >= 13) {
        spriteKey = "raven_smoke";
      } else if (p.skillActiveTimer >= 8) {
        spriteKey = "raven_grapple";
      } else {
        spriteKey = p.grappleTarget ? "raven_backstab" : "raven_evade";
      }
    } else if (buff) {
      if (p.ravenKataVisual > 0) {
        // ⑦ Lv.3 日蝕槍鬥術 (360° 彈幕)
        spriteKey = "raven_ult_lv3_kata";
      } else if (p.attackTimer > 2) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          // ⑥ Lv.2 暗器齊射 (持槍＋苦無與手裏劍)
          spriteKey = "raven_ult_lv2";
        } else if (unlockedUltLevel >= 1) {
          // ⑤ Lv.1 劇毒穿甲彈 (雙槍齊射)
          spriteKey = "raven_ult_lv1";
        } else {
          // ③ 踏步開火 <-> ④ 移動連射
          spriteKey = p.attackType % 2 === 0 ? "raven_ult_step1" : "raven_ult_step2";
        }
      } else {
        // ② 雙槍出鞘待機
        spriteKey = "raven_ult_draw";
      }
    } else if (p.attackTimer > 2) {
      spriteKey =
        p.attackType === 0 ? "raven_atk1" : p.attackType === 1 ? "raven_atk2" : "raven_atk3";
    }

    const sprite =
      window.sprites &&
      (window.sprites.get(spriteKey) || window.sprites.get("raven_idle") || window.sprites.get("hero_raven_normal"));
    const attacking = p.attackTimer > 2;
    const walkBob = p.walkFrame > 0 && !attacking && p.skillActiveTimer <= 0 ? Math.abs(Math.sin(p.walkFrame)) * 3.2 : Math.sin(tick * 0.08) * 1.0;
    const lungeX = attacking ? (buff ? 2 : 6) : 0;
    const tilt = p.walkFrame > 0 && !attacking && p.skillActiveTimer <= 0 ? Math.sin(p.walkFrame) * 0.04 : 0;

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing, 1);

    if (sprite) {
      const targetH = (spriteKey === "raven_ult_lv3_kata" || spriteKey === "raven_ult_lv3_finisher" ? 104 : 94) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      ctx.save();
      ctx.translate(lungeX, -walkBob);
      ctx.rotate(tilt);
      ctx.drawImage(sprite, -targetW / 2, -targetH + 6 * scale, targetW, targetH);
      ctx.restore();
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(-12 * scale, -72 * scale, 24 * scale, 70 * scale);
      ctx.fillStyle = "#d4af37";
      ctx.fillRect(-8 * scale, -64 * scale, 16 * scale, 5 * scale);
    }

    ctx.restore();
  }

  // --- Momo (Normal: Pepper Spray / Ultimate: Vampire Long-Claw Lifesteal Form!) ---
  function drawMomoSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.36)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 20 * scale, 6.5 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Vampire crimson blood-aura ring & orbiting bats when transformed!
    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(239, 68, 68, 0.72)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 28 * scale, 9 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    let momoKey = buff ? "momo_vamp_idle" : "momo_idle";
    if (buff) {
      if (p.skillType === "bat_blink" && p.skillActiveTimer > 0) {
        // Vampire Bat Blink: 血環聚蝠 -> 化蝠留血霧 -> 現身、吸血能量回流!
        momoKey =
          p.skillActiveTimer >= 12
            ? "momo_vamp_idle"
            : p.skillActiveTimer >= 5
            ? "momo_vamp_blink"
            : "momo_vamp_heal";
      } else if (p.attackTimer > 0) {
        if (unlockedUltLevel >= 3) {
          momoKey = "momo_vamp_lv3_true"; // Lv.3 真祖吸血長爪
        } else if (unlockedUltLevel >= 2) {
          momoKey = "momo_vamp_lv2_wave"; // Lv.2 廣域血爪波
        } else if (unlockedUltLevel >= 1) {
          momoKey = p.attackType === 2 ? "momo_vamp_lv1_wave" : "momo_vamp_lv1_claw"; // Lv.1 強化長爪 / 血爪波
        } else {
          momoKey = "momo_vamp_claw"; // 揮出三道猩紅長爪
        }
      }
    } else {
      if (p.skillType === "bat_blink" && p.skillActiveTimer > 0) {
        momoKey =
          p.skillActiveTimer >= 12
            ? "momo_blink_crouch"
            : p.skillActiveTimer >= 8
            ? "momo_blink_dissolve"
            : p.skillActiveTimer >= 4
            ? "momo_blink_swarm"
            : "momo_blink_land";
      } else if (p.attackTimer > 0) {
        momoKey =
          p.attackTimer >= 13
            ? "momo_spray_prep"
            : p.attackTimer >= 5
            ? "momo_spray_fire"
            : "momo_spray_recover";
      }
    }
    const sprite =
      window.sprites &&
      (window.sprites.get(momoKey) || window.sprites.get(buff ? "hero_momo_vampire" : "hero_momo_normal"));
    if (sprite) {
      // Match Momo's body height 1:1 between Normal (90px) and Vampire Halo frames (+8px for halo overhead!)
      const hasHalo = momoKey === "momo_vamp_idle" || momoKey === "momo_vamp_lv3_true";
      const targetH = (hasHalo ? 98 : momoKey === "momo_vamp_lv2_wave" ? 96 : 90) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const attacking = p.attackTimer > 3;
      const isBlinking = p.skillType === "bat_blink" && p.skillActiveTimer > 0;
      const walkBob = p.walkFrame > 0 && !attacking && !isBlinking ? Math.abs(Math.sin(p.walkFrame)) * 3.5 : Math.sin(tick * 0.08) * 1.1;
      const lungeX = attacking ? (buff ? 8 : 4) : 0;
      const tilt = p.walkFrame > 0 && !attacking && !isBlinking ? Math.sin(p.walkFrame) * 0.045 : 0;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.rotate(tilt);
      if (p.hurtTimer > 0 && p.hurtTimer % 4 < 2) {
        ctx.filter = "brightness(2.4)";
      }
      ctx.drawImage(sprite, -targetW * 0.5 + lungeX, -targetH + 4, targetW, targetH);

      // Draw Momo's 32-bit spicy pepper spray cone straight from her spray nozzle!
      if (attacking && !buff) {
        const pepperImg = window.sprites && window.sprites.get("vfx_momo_pepper");
        if (pepperImg) {
          ctx.save();
          ctx.imageSmoothingEnabled = false;
          const pulse = 0.92 + Math.sin(tick * 0.8) * 0.08;
          const ph = 44 * scale * pulse;
          const pw = (pepperImg.width / pepperImg.height) * ph;
          ctx.globalAlpha = Math.min(1, p.attackTimer / 6);
          ctx.drawImage(pepperImg, 18 * scale + lungeX, -56 * scale - ph * 0.5, pw, ph);
          ctx.restore();
        } else if (!window.sprites.get("momo_spray_fire")) {
          const coneGrad = ctx.createLinearGradient(14, -44, 86, -44);
          coneGrad.addColorStop(0, "rgba(253, 224, 71, 0.78)");
          coneGrad.addColorStop(0.5, "rgba(251, 146, 60, 0.45)");
          coneGrad.addColorStop(1, "rgba(251, 146, 60, 0)");
          ctx.fillStyle = coneGrad;
          ctx.beginPath();
          ctx.moveTo(14, -45);
          ctx.lineTo(86, -64);
          ctx.lineTo(86, -24);
          ctx.closePath();
          ctx.fill();
        }
      }
      ctx.restore();
    }

    // Orbiting crimson vampire bats around Momo in Vampire Form!
    if (buff) {
      for (let b = 0; b < 3; b++) {
        const ang = tick * 0.12 + (b * Math.PI * 2) / 3;
        const bx = sx + Math.cos(ang) * 34 * scale;
        const by = sy - p.z - 46 * scale + Math.sin(ang * 2) * 12;
        const flap = Math.sin(tick * 0.35 + b) * 4;
        ctx.save();
        ctx.translate(bx, by);
        ctx.fillStyle = "#18181b";
        ctx.strokeStyle = "#ef4444";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(0, 0);
        ctx.lineTo(-7, -4 + flap);
        ctx.lineTo(-4, 2);
        ctx.lineTo(0, 1);
        ctx.lineTo(4, 2);
        ctx.lineTo(7, -4 + flap);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // --- Street Samurai (HD 16-bit Pixel Art Sprite + Orbiting Sword Aura!) ---
  function drawSamuraiSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 22 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Back-layer Sword Aura (劍氣傍身) orbiting behind character
    if (buff) {
      drawSamuraiSwordAura(sx, sy - p.z - 38 * scale, scale, false);
    }

    const slashing = p.attackTimer > 2 || p.autoSlashVisual > 0;
    const ultActive = gameState === STATE.RELOAD_CUTSCENE && p === player && p.charId === "samurai";

    // Select the exact frame from Street Samurai's 16-frame Normal & Ultimate sheets!
    let spriteKey = "sam_idle";
    if (ultActive) {
      spriteKey = unlockedUltLevel >= 3 ? "sam_dual_idle" : "sam_ult_draw";
    } else if (p.skillType === "shadow_dash" && p.skillActiveTimer > 0) {
      // 《殘影瞬步・居合》: 壓低重心 -> 青紫殘影穿越 -> 銀白刀痕 -> 刀痕延遲爆開!
      spriteKey =
        p.skillActiveTimer >= 14
          ? "sam_k_crouch"
          : p.skillActiveTimer >= 6
          ? "sam_k_dash"
          : p.skillActiveTimer >= 3
          ? "sam_k_trail"
          : "sam_k_burst";
    } else if (buff) {
      if (unlockedUltLevel >= 3) {
        // Lv.3 雙刀模式: 喚出紫柄雙刀 -> 雙刀突進 -> 交叉成 X -> 藍紫兩道劍氣波!
        if (p.dualDashTimer >= 11) {
          spriteKey = "sam_dual_dash";
        } else if (p.dualDashTimer >= 6) {
          spriteKey = "sam_dual_cross";
        } else if (p.dualDashTimer > 0 || p.autoSlashVisual > 0) {
          spriteKey = "sam_dual_waves";
        } else {
          spriteKey = "sam_dual_idle";
        }
      } else if (slashing) {
        spriteKey = unlockedUltLevel >= 2 ? "sam_ult_lv2" : unlockedUltLevel >= 1 ? "sam_ult_lv1" : "sam_ult_wave";
      } else {
        spriteKey = "sam_ult_draw";
      }
    } else if (p.attackTimer > 2) {
      // 平A 居合三連斬: 起手斜斬 -> 反手橫斬 -> 猩紅重斬擊飛!
      spriteKey = p.attackType === 0 ? "sam_atk1" : p.attackType === 1 ? "sam_atk2" : "sam_atk3";
    }

    const sprite =
      (window.sprites && window.sprites.get(spriteKey)) ||
      (window.sprites && window.sprites.get("sam_idle")) ||
      (window.sprites && window.sprites.get(slashing ? "hero_samurai_slash" : "hero_samurai_idle"));

    if (sprite) {
      const isCross = spriteKey === "sam_dual_cross" || spriteKey === "sam_dual_waves";
      const isDash = spriteKey === "sam_dual_dash" || spriteKey === "sam_k_dash";
      const isWideSlash = spriteKey === "sam_ult_lv2" || spriteKey === "sam_atk3";
      const targetH = (isWideSlash ? 98 : isCross ? 94 : 92) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = isDash || isCross || slashing ? 0 : p.walkFrame > 0 ? Math.abs(Math.sin(p.walkFrame)) * 3.2 : Math.sin(tick * 0.08) * 1.1;
      const lungeX = isCross ? 10 : isDash ? 8 : slashing ? 6 : 0;
      const tilt = isDash || isCross || slashing ? 0 : p.walkFrame > 0 ? Math.sin(p.walkFrame) * 0.045 : 0;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.rotate(tilt);
      if (p.hurtTimer > 0 && p.hurtTimer % 4 < 2) {
        ctx.filter = "brightness(2.4)";
      }
      ctx.drawImage(sprite, -targetW * (isCross ? 0.38 : 0.48) + lungeX, -targetH + 3, targetW, targetH);
      ctx.restore();

      if (buff) {
        drawSamuraiSwordAura(sx, sy - p.z - 38 * scale, scale, true);
      }
      return;
    }

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing * scale, scale);

    const walk = Math.sin(p.walkFrame) * 4;

    // Chunky Balenciaga-style platform black sneakers
    ctx.fillStyle = "#09090b";
    ctx.fillRect(-13, -7 + walk * 0.45, 12, 7);
    ctx.fillRect(2, -7 - walk * 0.45, 12, 7);
    // Chunky sculpted sole ridges & tiny white logo accent
    ctx.fillStyle = "#27272a";
    ctx.fillRect(-14, -3 + walk * 0.45, 14, 3);
    ctx.fillRect(1, -3 - walk * 0.45, 14, 3);
    ctx.fillStyle = "#e2e8f0";
    ctx.fillRect(-9, -6 + walk * 0.45, 4, 1);
    ctx.fillRect(6, -6 - walk * 0.45, 4, 1);

    // Baggy Black Cargo Pants (wide-leg silhouette!)
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-12, -23 + walk * 0.4, 11, 17);
    ctx.fillRect(1, -23 - walk * 0.4, 11, 17);
    // Cargo side pockets
    ctx.fillStyle = "#27272a";
    ctx.fillRect(-13, -17 + walk * 0.4, 4, 7);
    ctx.fillRect(9, -17 - walk * 0.4, 4, 7);
    ctx.fillStyle = "#3f3f46";
    ctx.fillRect(-13, -17 + walk * 0.4, 4, 2);
    ctx.fillRect(9, -17 - walk * 0.4, 4, 2);

    // Silver Wallet Chain hanging on the hip
    ctx.strokeStyle = "#cbd5e1";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.moveTo(-7, -23);
    ctx.quadraticCurveTo(-2, -16, 4, -22);
    ctx.stroke();

    // Sheathed Katana at waist (scabbard stays at hip; handle/blade drawn when slashing!)
    ctx.save();
    ctx.translate(-2, -23);
    ctx.rotate(-0.22);
    // Black scabbard (saya) extending behind hip
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-20, -2, 24, 4);
    ctx.fillStyle = "#dc2626"; // crimson sageo cord wrap
    ctx.fillRect(-6, -2, 5, 4);
    ctx.fillStyle = "#fbbf24"; // gold end cap
    ctx.fillRect(-21, -2, 2, 4);
    if (!slashing && !ultActive) {
      // Gold tsuba guard & hilt when sheathed
      ctx.fillStyle = "#f59e0b";
      ctx.fillRect(4, -4, 2, 8);
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(6, -2, 8, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(8, -1, 4, 2);
    }
    ctx.restore();

    // Puffy Quilted Black Streetwear Puffer Jacket
    ctx.fillStyle = "#18181b";
    ctx.fillRect(-14, -44, 28, 22);
    // Quilted horizontal puff segments
    ctx.fillStyle = "#27272a";
    ctx.fillRect(-13, -43, 26, 5);
    ctx.fillRect(-14, -36, 28, 6);
    ctx.fillRect(-13, -29, 26, 6);
    // Dark puffer hood behind neck
    ctx.fillStyle = "#09090b";
    ctx.fillRect(-12, -47, 24, 5);

    // Diagonal Crossbody Sling Bag + Silver Buckles
    ctx.strokeStyle = "#09090b";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-9, -43);
    ctx.lineTo(8, -28);
    ctx.stroke();
    ctx.fillStyle = "#94a3b8"; // silver strap buckles
    ctx.fillRect(-5, -39, 3, 2);
    ctx.fillRect(-1, -35, 3, 2);
    // Small black sling pouch on chest/side
    ctx.fillStyle = "#09090b";
    ctx.fillRect(4, -34, 8, 9);
    ctx.fillStyle = "#52525b";
    ctx.fillRect(5, -33, 6, 3);

    // Puffy Sleeves + Arms + Drawn Katana!
    ctx.fillStyle = "#18181b";
    // Back puffy sleeve
    ctx.fillRect(-17, -41, 7, 15);
    ctx.fillStyle = "#27272a";
    ctx.fillRect(-17, -36, 7, 5);

    if (slashing || ultActive) {
      // Front arm swinging forward horizontally with katana drawn!
      const swingProg = ultActive ? Math.sin(tick * 0.8) : (p.attackTimer - 3) / 11;
      const bladeAngle = ultActive
        ? Math.sin(tick * 0.9) * 0.9
        : p.attackType === 1
        ? -0.35 + (1 - swingProg) * 0.55
        : 0.25 - (1 - swingProg) * 0.5;

      ctx.fillStyle = "#18181b";
      ctx.fillRect(6, -38, 12, 8);
      ctx.fillStyle = "#f5c29b"; // hand
      ctx.fillRect(16, -37, 5, 5);

      // Drawn Katana!
      ctx.save();
      ctx.translate(18, -34);
      ctx.rotate(bladeAngle);
      // Hilt & Gold Tsuba
      ctx.fillStyle = "#1e293b";
      ctx.fillRect(-6, -2, 8, 4);
      ctx.fillStyle = "#fbbf24";
      ctx.fillRect(2, -5, 3, 10);
      // Gleaming Steel Katana Blade (glowing cyan in Sword Aura mode!)
      ctx.fillStyle = buff ? "#38bdf8" : "#f8fafc";
      ctx.fillRect(5, -2, 34, 3);
      ctx.fillStyle = buff ? "#e0f2fe" : "#94a3b8";
      ctx.fillRect(5, 0, 32, 1);
      // Curved tip
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(38, -2, 4, 2);
      ctx.restore();
    } else {
      // Cool hands-in-pocket puffy sleeve stance
      ctx.fillStyle = "#18181b";
      ctx.fillRect(10, -41 - walk * 0.3, 7, 15);
      ctx.fillStyle = "#27272a";
      ctx.fillRect(10, -36 - walk * 0.3, 7, 5);
    }

    // Neck & Head
    ctx.fillStyle = "#e8b08a";
    ctx.fillRect(-3, -47, 6, 4);
    ctx.fillStyle = "#f5c29b";
    ctx.fillRect(-8, -61, 16, 15);

    // Voluminous Fluffy Dark Brown Curly Hair!
    ctx.fillStyle = "#3e2723";
    // Top curls
    ctx.fillRect(-11, -67, 22, 8);
    ctx.fillRect(-7, -70, 14, 4);
    // Side fluffy curls puffing out left & right
    ctx.fillRect(-14, -63, 7, 11);
    ctx.fillRect(7, -63, 7, 10);
    ctx.fillRect(-12, -53, 5, 5);
    // Lighter brown curl highlights
    ctx.fillStyle = "#5d4037";
    ctx.fillRect(-9, -68, 5, 3);
    ctx.fillRect(1, -69, 6, 3);
    ctx.fillRect(-13, -61, 3, 4);
    ctx.fillRect(9, -61, 3, 4);

    // Thick Black Square-Framed Glasses!
    ctx.fillStyle = "#09090b";
    ctx.fillRect(-7, -57, 7, 6); // left lens frame
    ctx.fillRect(2, -57, 7, 6);  // right lens frame
    ctx.fillRect(0, -55, 2, 2);  // bridge
    // Lenses & cool blue half-lidded eyes
    ctx.fillStyle = "#e0f2fe";
    ctx.fillRect(-6, -56, 5, 4);
    ctx.fillRect(3, -56, 5, 4);
    ctx.fillStyle = "#0284c7"; // bright blue irises
    ctx.fillRect(-4, -55, 2, 2);
    ctx.fillRect(5, -55, 2, 2);
    // Cool relaxed eyelids
    ctx.fillStyle = "#f5c29b";
    ctx.fillRect(-6, -56, 5, 1);
    ctx.fillRect(3, -56, 5, 1);

    // Confident little smirk
    ctx.fillStyle = "#7c2d12";
    ctx.fillRect(-1, -49, 5, 1);
    ctx.fillRect(3, -50, 2, 1);

    // Eating brisket visual
    if (p.eatTimer > 0) {
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(5, -50, 8, 5);
    }

    ctx.restore();

    // Front-layer Sword Aura (劍氣傍身) orbiting in front of character!
    if (buff) {
      drawSamuraiSwordAura(sx, sy - p.z - 32 * scale, scale, true);
    }
  }

  // Orbiting glowing Sword-Qi blades & crescent rings around the Samurai!
  function drawSamuraiSwordAura(cx, cy, scale, frontLayer) {
    const auraBoost = unlockedUltLevel >= 1 ? 1.45 : 1.0;
    const bladeCount = unlockedUltLevel >= 1 ? 6 : 4;
    ctx.save();
    ctx.translate(cx, cy);

    // Swirling horizontal energy ring
    if (!frontLayer) {
      ctx.strokeStyle = "rgba(56, 189, 248, 0.65)";
      ctx.lineWidth = unlockedUltLevel >= 1 ? 3 : 2;
      ctx.beginPath();
      ctx.ellipse(0, 22 * scale, 28 * scale * auraBoost, 9 * scale * auraBoost, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Orbiting sword-qi crescents
    for (let i = 0; i < bladeCount; i++) {
      const ang = tick * 0.16 + (i * Math.PI * 2) / bladeCount;
      const depth = Math.sin(ang);
      if ((frontLayer && depth < 0) || (!frontLayer && depth >= 0)) continue;

      const ox = Math.cos(ang) * 32 * scale * auraBoost;
      const oy = depth * 12 * scale * auraBoost + Math.sin(tick * 0.1 + i) * 6;
      ctx.save();
      ctx.translate(ox, oy);
      ctx.rotate(ang + Math.PI / 2);
      ctx.fillStyle = i % 2 === 0 ? "#38bdf8" : "#c084fc";
      ctx.beginPath();
      ctx.moveTo(-10 * scale, 0);
      ctx.quadraticCurveTo(0, -6 * scale, 10 * scale, 0);
      ctx.quadraticCurveTo(0, -2 * scale, -10 * scale, 0);
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.fillRect(-5 * scale, -3 * scale, 10 * scale, 1.5);
      ctx.restore();
    }
    ctx.restore();
  }

  // --- Mustache Hero (Full 20-Frame 32-bit Remaster: Normal 8 + Buff 8 + Buff Ground-Slam 4!) ---
  function drawMustacheSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, (buff ? 25 : 21) * scale, (buff ? 8 : 6.8) * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    let spriteKey = "must_idle";
    if (gameState === STATE.RELOAD_CUTSCENE && p === player) {
      spriteKey =
        reloadCutsceneTimer > 52
          ? "must_ult_prep"
          : reloadCutsceneTimer > 30
          ? "must_ult_reload"
          : "must_ult_buff1";
    } else if (p.skillType === "ground_slam" && p.skillActiveTimer > 0) {
      const prefix = buff ? "must_bk" : "must_k";
      if (p.skillActiveTimer >= 30) {
        spriteKey = `${prefix}_crouch`;
      } else if (p.z > 2 || !p.skillImpactDone) {
        spriteKey = `${prefix}_jump`;
      } else if (p.skillActiveTimer >= 4) {
        spriteKey = `${prefix}_slam`;
      } else {
        spriteKey = `${prefix}_ring`;
      }
    } else if (buff) {
      if (p.attackTimer > 2 || p.flurryHitsLeft > 0) {
        if (unlockedUltLevel >= 2 && p.attackType === 2) {
          spriteKey = "must_ult_lv3";
        } else if (unlockedUltLevel >= 1 && p.attackType >= 1) {
          spriteKey = "must_ult_lv1";
        } else {
          spriteKey = "must_ult_punch1";
        }
      } else {
        spriteKey = Math.floor(tick / 12) % 2 === 0 ? "must_ult_buff1" : "must_ult_buff2";
      }
    } else if (p.attackTimer > 2) {
      spriteKey = p.attackType === 0 ? "must_atk1" : p.attackType === 1 ? "must_atk2" : "must_atk3";
    }

    const sprite =
      (window.sprites && window.sprites.get(spriteKey)) ||
      (window.sprites && window.sprites.get(buff ? "hero_mustache_buff" : "hero_mustache_normal"));
    if (sprite) {
      const isBuffFrame =
        spriteKey.startsWith("must_ult_buff") ||
        spriteKey.startsWith("must_ult_punch") ||
        spriteKey.startsWith("must_ult_lv") ||
        spriteKey.startsWith("must_bk_");
      const isJumpSlam = spriteKey.endsWith("_jump");
      const targetH = (isBuffFrame ? (isJumpSlam ? 114 : 106) : (isJumpSlam ? 98 : 92)) * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const punching = p.attackTimer > 2 || p.skillActiveTimer > 0;
      const walkBob = punching ? 0 : Math.abs(Math.sin(p.walkFrame)) * 3.2;
      const anchorOffsetX =
        spriteKey === "must_atk1" ||
        spriteKey === "must_atk2" ||
        spriteKey === "must_atk3" ||
        spriteKey === "must_ult_punch1" ||
        spriteKey === "must_ult_lv1" ||
        spriteKey === "must_ult_lv3"
          ? 12 * scale
          : 0;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      if (p.hurtTimer > 0 && p.hurtTimer % 4 < 2) {
        ctx.filter = "brightness(2.4)";
      }
      ctx.drawImage(sprite, -targetW * 0.5 + anchorOffsetX, -targetH + 3, targetW, targetH);
      ctx.restore();
      return;
    }

    ctx.save();
    ctx.translate(sx, sy - p.z);
    ctx.scale(p.facing * scale, scale);

    const walk = Math.sin(p.walkFrame) * 4;
    const punching = p.attackTimer > 4;
    const reloading = gameState === STATE.RELOAD_CUTSCENE;
    const armCock = reloading ? Math.sin(reloadCutsceneTimer * 0.55) * 7 : 0;

    // Legs (golden-orange armor)
    ctx.fillStyle = "#b45309";
    ctx.fillRect(-10, -18 + walk * 0.5, 8, 18);
    ctx.fillRect(2, -18 - walk * 0.5, 8, 18);
    // Boots
    ctx.fillStyle = "#78350f";
    ctx.fillRect(-11, -5 + walk * 0.5, 10, 6);
    ctx.fillRect(2, -5 - walk * 0.5, 10, 6);

    // Torso (golden-orange space-marine armor)
    const torsoW = buff ? 30 : 24;
    ctx.fillStyle = "#ea580c";
    ctx.fillRect(-torsoW / 2, -44, torsoW, 27);
    // Chest armor plates
    ctx.fillStyle = "#f59e0b";
    ctx.fillRect(-torsoW / 2 + 2, -42, torsoW - 4, 14);
    // Belt
    ctx.fillStyle = "#451a03";
    ctx.fillRect(-torsoW / 2, -21, torsoW, 4);
    ctx.fillStyle = "#fcd34d";
    ctx.fillRect(-3, -21, 6, 4);

    // THE LITTLE POCKET! (Only in Buff / Reload Mode — "If you know, you know.")
    if (buff) {
      ctx.fillStyle = "#9a3412";
      ctx.fillRect(3, -38, 8, 8);
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 1;
      ctx.strokeRect(3.5, -37.5, 7, 7);
      // Pocket sparkle glint
      if (Math.floor(tick / 12) % 3 === 0) {
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(6, -36, 2, 2);
      }
    }

    // Massive Shoulder Pauldrons
    ctx.fillStyle = "#fbbf24";
    ctx.fillRect(-torsoW / 2 - 5, -45, 9, 11);
    ctx.fillRect(torsoW / 2 - 4, -45, 9, 11);

    // Back Arm
    ctx.fillStyle = "#d97706";
    ctx.fillRect(-torsoW / 2 - 6, -35 + armCock, 7, 15);

    // Front Arm / Punch!
    ctx.fillStyle = "#f59e0b";
    if (punching) {
      const ext = p.attackType === 2 ? 26 : 19;
      ctx.fillRect(4, -38, ext, 9);
      // Glowing fist
      ctx.fillStyle = buff ? "#38bdf8" : "#fcd34d";
      ctx.fillRect(4 + ext - 4, -40, 11, 13);
    } else if (reloading) {
      // Iconic forearm pump!
      ctx.fillRect(6, -36 + armCock, 10, 14);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(8, -24 + armCock, 8, 8);
    } else {
      ctx.fillRect(torsoW / 2 - 2, -35 - walk * 0.4, 8, 15);
      ctx.fillStyle = "#fde68a";
      ctx.fillRect(torsoW / 2 - 1, -21 - walk * 0.4, 7, 6);
    }

    // Head
    ctx.fillStyle = "#fdba74"; // skin
    ctx.fillRect(-8, -60, 16, 16);
    // Classic dark swept hair
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(-9, -63, 18, 6);
    ctx.fillRect(-10, -59, 4, 8);
    // Determined Eyes
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(-2, -55, 3, 3);
    ctx.fillRect(4, -55, 3, 3);
    // Eyebrows
    ctx.fillStyle = "#1c1917";
    ctx.fillRect(-3, -57, 4, 2);
    ctx.fillRect(3, -57, 5, 2);

    // GLORIOUS HANDLEBAR MUSTACHE! (Bigger in Buff Mode!)
    ctx.fillStyle = "#29150b";
    if (buff) {
      // Oversized glorious handlebar mustache
      ctx.fillRect(-7, -49, 17, 4);
      ctx.fillRect(-10, -47, 5, 5);
      ctx.fillRect(8, -47, 5, 5);
    } else {
      ctx.fillRect(-4, -49, 12, 3);
      ctx.fillRect(-6, -48, 3, 3);
      ctx.fillRect(6, -48, 3, 3);
    }

    // Eating brisket visual
    if (p.eatTimer > 0) {
      ctx.fillStyle = "#7f1d1d";
      ctx.fillRect(6, -48, 9, 6);
    }

    ctx.restore();
  }

  // --- Enemies (Suit Agents, Heavy Bouncers, Restroom Boss, Bio-Mutants, Airport Dual Bosses) ---
  function drawEnemy(e) {
    if (e.hidden) return;
    const sx = Math.floor(e.x - cameraX);
    const sy = Math.floor(e.y);
    if (sx < -60 || sx > W + 60) return;

    const scale = e.type === "genex_boss" ? 1.3 : e.type === "boss" ? 1.25 : e.type === "miniboss" ? 1.18 : e.type === "heavy" ? 1.12 : 1.0;

    ctx.save();
    if (e.dead) {
      ctx.globalAlpha = Math.max(0, e.fadeTimer / 46);
    }

    // Enemy Attack Telegraph Warning Flash (!) right before strike — cue for [K] JUST DODGE!
    if (!e.dead && e.attackTimer >= 11 && e.attackTimer <= 24) {
      const pulse = Math.sin(tick * 0.65) * 0.5 + 0.5;
      const warnY = sy - e.z - (e.type === "genex_boss" ? 96 : e.type === "boss" || e.type === "wt_boss" ? 84 : 74);
      ctx.save();
      ctx.fillStyle = pulse > 0.4 ? "#ef4444" : "#facc15";
      ctx.beginPath();
      ctx.arc(sx, warnY, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 1.5;
      ctx.stroke();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("!", sx, warnY + 4);
      ctx.restore();
    }

    // Mini-Boss / Boss ground aura ring
    if ((e.type === "miniboss" || e.type === "boss" || e.type === "genex_boss") && !e.dead) {
      ctx.strokeStyle =
        e.type === "genex_boss"
          ? e.bossPhase === 3
            ? "rgba(239, 68, 68, 0.9)"
            : "rgba(168, 85, 247, 0.9)"
          : e.type === "miniboss"
          ? "rgba(251, 191, 36, 0.85)"
          : "rgba(168, 85, 247, 0.85)";
      ctx.lineWidth = 2.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy, 26 * scale, 9 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.35)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 19 * scale, 6 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    // Resolve HD AI 32-bit Pixel Art Sprite first!
    const isWtEnemy = e.type === "wt_scout" || e.type === "wt_guard" || e.type === "wt_boss";
    const wtStageForDraw = isWtEnemy && window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
    const isTrainCrew =
      isWtEnemy || e.type === "train_ticket" || e.type === "train_porter" || e.type === "boss_train_mechanic";
    const spriteName =
      e.type === "wt_boss" && wtStageForDraw
        ? wtStageForDraw.enemies.boss.key
        : e.type === "wt_guard" && wtStageForDraw
        ? wtStageForDraw.enemies.guard.key
        : e.type === "wt_scout" && wtStageForDraw
        ? wtStageForDraw.enemies.scout.key
        : e.type === "boss_train_mechanic"
        ? "boss_train_mechanic"
        : e.type === "train_porter"
        ? "enemy_train_porter"
        : e.type === "train_ticket"
        ? "enemy_train_ticket"
        : e.type === "boss_89_king"
        ? "boss_89_king"
        : e.type === "thug_knife"
        ? "enemy_89_knife"
        : e.type === "thug_bat"
        ? "enemy_89_bat"
        : e.type === "boss_ironfist"
        ? (e.aiState === "punch1"
            ? "if_atk1"
            : e.aiState === "punch2"
            ? "if_atk2"
            : e.aiState === "feint_pause"
            ? "if_k_wrap"
            : e.aiState === "punch3"
            ? "if_atk3"
            : e.aiState === "team" && window.AirportStage && window.AirportStage.teamCombo
            ? window.AirportStage.teamCombo.phase === "iron_dash"
              ? "if_ult_lv2_dash"
              : window.AirportStage.teamCombo.phase === "setup" || window.AirportStage.teamCombo.phase === "launch"
              ? "if_ult_lv2_charge"
              : "if_idle"
            : "if_idle")
        : e.type === "boss_nightheron"
        ? (e.aiState === "tap"
            ? "nh_k_tap"
            : e.aiState === "sweep"
            ? "nh_atk3"
            : e.aiState === "team" && window.AirportStage && window.AirportStage.teamCombo
            ? window.AirportStage.teamCombo.phase === "heron_dive"
              ? "nh_ult_lv3_dive"
              : window.AirportStage.teamCombo.phase === "launch"
              ? "nh_ult_lv2_jump"
              : "nh_idle"
            : "nh_idle")
        : e.type === "genex_boss"
        ? `boss_genex_p${e.bossPhase || 1}`
        : e.type === "mutant_dog"
        ? "enemy_mutant_dog"
        : e.type === "mutant_brute"
        ? "enemy_mutant_brute"
        : e.type === "skull_human"
        ? "enemy_skull_human"
        : e.type === "boss" || e.type === "miniboss"
        ? (currentStage === 7 ? "enemy_89_bat" : "enemy_boss")
        : "enemy_agent";
    const sprite = window.sprites && window.sprites.get(spriteName);
    if (sprite) {
      const targetH =
        e.type === "boss_train_mechanic" || e.type === "wt_boss"
          ? 142
          : e.type === "train_porter" || e.type === "wt_guard"
          ? 128
          : e.type === "train_ticket" || e.type === "wt_scout"
          ? 128
          : e.type === "boss_89_king"
          ? 104
          : e.type === "boss_ironfist"
          ? 94
          : e.type === "boss_nightheron"
          ? 96
          : e.type === "genex_boss"
          ? (e.bossPhase === 3 ? 116 : e.bossPhase === 2 ? 106 : 98)
          : e.type === "mutant_dog"
          ? 54
          : e.type === "mutant_brute" || e.type === "thug_bat"
          ? 86
          : 80 * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const walkBob = Math.abs(Math.sin(e.walkFrame)) * 3;
      const attacking = (e.attackTimer > 6 && e.attackTimer < 16) || e.kickAnimTimer > 0;
      const lungeX = attacking ? (e.type === "genex_boss" || e.type === "boss_train_mechanic" ? 14 : 9) : 0;
      const flash = e.hurtTimer > 0 && e.hurtTimer % 4 < 2;

      ctx.translate(sx, sy - e.z - walkBob);
      if (e.knockdownTimer > 0 || e.dead) {
        ctx.rotate(e.facing * -0.55);
      }
      ctx.scale(isTrainCrew ? -e.facing : e.facing, 1);
      if (isTrainCrew) {
        ctx.imageSmoothingEnabled = false;
      }
      if (flash) {
        ctx.filter = "brightness(2.5)";
      }
      if (isTrainCrew) {
        ctx.drawImage(sprite, -targetW * 0.5 - lungeX, -targetH + 6, targetW, targetH);
      } else {
        ctx.drawImage(sprite, -targetW * 0.5 + lungeX, -targetH + 3, targetW, targetH);
      }
      ctx.restore();

      // Mini HP bar above damaged enemy (Bosses use the bottom bar)
      if (!e.dead && e.hp < e.maxHp && e.type !== "genex_boss") {
        const bw = 38 * scale;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(sx - bw / 2, sy - (targetH + 8) - e.z, bw, 5);
        ctx.fillStyle = e.type === "boss" ? "#a855f7" : e.type === "miniboss" ? "#f59e0b" : "#ef4444";
        ctx.fillRect(sx - bw / 2 + 1, sy - (targetH + 7) - e.z, (bw - 2) * (e.hp / e.maxHp), 3);
      }
      return;
    }

    // Fallback to detailed BioArt Canvas sprites while images load
    if (window.BioArt && window.BioArt.drawBioEnemySprite(ctx, e, sx, sy, tick)) {
      ctx.restore();
      if (!e.dead && e.hp < e.maxHp && e.type !== "genex_boss") {
        const bw = 38 * scale;
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(sx - bw / 2, sy - 78 * scale - e.z, bw, 5);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(sx - bw / 2 + 1, sy - 77 * scale - e.z, (bw - 2) * (e.hp / e.maxHp), 3);
      }
      return;
    }

    ctx.translate(sx, sy - e.z);
    if (e.knockdownTimer > 0 || e.dead) {
      ctx.rotate(e.facing * -0.45);
    }
    ctx.scale(e.facing * scale, scale);

    const walk = Math.sin(e.walkFrame) * 3.5;
    const flash = e.hurtTimer > 0 && e.hurtTimer % 4 < 2;

    // Legs
    ctx.fillStyle = flash ? "#fff" : "#0f172a";
    ctx.fillRect(-8, -18 + walk * 0.5, 6, 18);
    ctx.fillRect(2, -18 - walk * 0.5, 6, 18);

    // Suit jacket
    ctx.fillStyle = flash ? "#fff" : e.suitColor;
    ctx.fillRect(-11, -43, 22, 26);
    // White shirt V & tie
    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(-3, -43, 6, 12);
    ctx.fillStyle = e.tieColor;
    ctx.fillRect(-1, -41, 3, 12);

    // Punching arm
    ctx.fillStyle = flash ? "#fff" : e.suitColor;
    if (e.attackTimer > 6 && e.attackTimer < 16) {
      ctx.fillRect(4, -37, 19, 7);
      ctx.fillStyle = "#fdba74";
      ctx.fillRect(21, -37, 6, 7);
    } else {
      ctx.fillRect(8, -36 - walk * 0.4, 6, 14);
    }

    // Head
    ctx.fillStyle = flash ? "#fff" : "#fed7aa";
    ctx.fillRect(-7, -58, 14, 15);
    // Hair
    ctx.fillStyle = e.type === "boss" ? "#475569" : "#1e293b";
    ctx.fillRect(-8, -60, 16, 5);
    // Sunglasses
    ctx.fillStyle = "#020617";
    ctx.fillRect(-2, -54, 10, 4);

    ctx.restore();

    // Mini HP bar above damaged enemy
    if (!e.dead && e.hp < e.maxHp) {
      const bw = 34 * scale;
      ctx.fillStyle = "rgba(0,0,0,0.65)";
      ctx.fillRect(sx - bw / 2, sy - 72 * scale - e.z, bw, 5);
      ctx.fillStyle = e.type === "boss" ? "#a855f7" : "#ef4444";
      ctx.fillRect(sx - bw / 2 + 1, sy - 71 * scale - e.z, (bw - 2) * (e.hp / e.maxHp), 3);
    }
  }

  // --- Katana Horizontal Slash Arcs & Flying Sword-Qi Waves ---
  function drawSlashEffectsAndWaves() {
    for (const sl of slashEffects) {
      const alpha = Math.max(0, sl.life / sl.maxLife);
      const sx = Math.floor(sl.x - cameraX);
      const sy = Math.floor(sl.y - sl.z);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx, sy);
      ctx.scale(sl.facing, 1);
      ctx.rotate(sl.angle);
      // Outer glowing crescent arc (horizontal katana slash!)
      ctx.strokeStyle = sl.color;
      ctx.lineWidth = 6 * alpha + 2;
      ctx.beginPath();
      ctx.arc(0, 0, sl.radius, -0.78, 0.78);
      ctx.stroke();
      // Razor-sharp bright white core
      ctx.strokeStyle = "#ffffff";
      ctx.lineWidth = 2.5 * alpha + 1;
      ctx.beginPath();
      ctx.arc(2, 0, sl.radius - 2, -0.65, 0.65);
      ctx.stroke();
      ctx.restore();
    }

    for (const w of swordWaves) {
      const alpha = Math.max(0, Math.min(1, (w.life / w.maxLife) * 1.25));
      const sx = Math.floor(w.x - cameraX);
      const sy = Math.floor(w.y - w.z);
      const col = (w.color || "#38bdf8").toLowerCase();
      const slashKey =
        w.spriteKey ||
        (col.includes("c084") || col.includes("a855") || col.includes("9333") || col.includes("e9d5")
          ? "vfx_slash_purple"
          : col.includes("f973") || col.includes("ef44") || col.includes("fb92") || col.includes("f43f") || col.includes("e11d")
          ? "vfx_slash_fire"
          : col.includes("fbbf") || col.includes("fde0") || col.includes("fcd3") || col.includes("d4af") || col.includes("f59e")
          ? "vfx_slash_gold"
          : "vfx_slash_cyan");
      const slashImg = window.sprites && window.sprites.get(slashKey);
      const isFist = Boolean(w.spriteKey && w.spriteKey.startsWith("vfx_firefist"));
      const isCustomProj = isFist || Boolean(w.spriteKey && w.spriteKey.startsWith("vfx_proj_"));

      ctx.save();
      ctx.translate(sx, sy);
      ctx.scale(w.facing, 1);
      if (slashImg) {
        const projHeightMap = {
          vfx_firefist_lv3: 74,
          vfx_firefist_lv2: 54,
          vfx_firefist_lv1: 38,
          vfx_proj_magic: w.heavy ? 62 : 50,
          vfx_proj_raven: w.heavy ? 46 : 36,
          vfx_proj_momo: w.heavy ? 66 : 56,
          vfx_proj_nightheron: w.heavy ? 70 : 58,
          vfx_proj_fallen: w.heavy ? 76 : 64,
          vfx_proj_ling: w.heavy ? 74 : 60,
          vfx_proj_ironfist: w.heavy ? 68 : 54,
          vfx_proj_shaka: w.heavy ? 74 : 62,
          vfx_proj_alice: w.heavy ? 66 : 52,
          vfx_proj_mustache: w.heavy ? 68 : 54,
        };
        const targetH = projHeightMap[w.spriteKey] || (w.heavy ? 88 : 74);
        const targetW = (slashImg.width / slashImg.height) * targetH;
        if (isCustomProj) {
          ctx.imageSmoothingEnabled = false;
          // Subtle luminous motion trail + crisp alpha-cutout 32-bit projectile!
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = alpha * 0.30;
          ctx.drawImage(slashImg, -targetW * 0.55 - 12, -targetH * 0.5, targetW, targetH);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = alpha;
          ctx.drawImage(slashImg, -targetW * 0.45, -targetH * 0.5, targetW, targetH);
        } else {
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = alpha * 0.42;
          ctx.drawImage(slashImg, -targetW * 0.5 - 16, -targetH * 0.5, targetW, targetH);
          ctx.globalAlpha = alpha;
          ctx.drawImage(slashImg, -targetW * 0.5 + 4, -targetH * 0.5, targetW, targetH);
        }
      } else {
        ctx.globalAlpha = alpha;
        ctx.fillStyle = w.color || "#38bdf8";
        ctx.beginPath();
        ctx.moveTo(-6, -24);
        ctx.quadraticCurveTo(18, 0, -6, 24);
        ctx.quadraticCurveTo(6, 0, -6, -24);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(-2, -18);
        ctx.quadraticCurveTo(12, 0, -2, 18);
        ctx.quadraticCurveTo(4, 0, -2, -18);
        ctx.fill();
      }
      ctx.restore();
    }

    // --- Small Skill VFX (Ground Slam Shockwave, Shadow Dash Afterimages & Iaido Line, Bat Swarm & Mist) ---
    for (const fx of skillEffects) {
      const alpha = Math.max(0, fx.life / fx.maxLife);
      if (fx.type === "sky_drop_skull") {
        if (fx.delay > 0) continue;
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y);
        if (sx < -140 || sx > W + 140) continue;
        const pl = fx.life; // 44 down to 0
        const st = REMOTE_AOE_STYLES[fx.style] || REMOTE_AOE_STYLES.fallen;
        ctx.save();
        ctx.globalCompositeOperation = "lighter";

        const sigilImg = window.sprites && window.sprites.get(st.sigil);
        const strikeImg = window.sprites && window.sprites.get(st.strike);
        const pillarImg = window.sprites && window.sprites.get(st.pillar);
        const burstImg = window.sprites && window.sprites.get(st.burst);

        // Phase 1 & 2 (44..18): Glowing ground lock-on sigil under distant enemy!
        if (pl >= 18) {
          const sAlpha = pl > 36 ? (44 - pl) / 8 : pl < 22 ? (pl - 18) / 4 : 1;
          ctx.globalAlpha = Math.max(0, Math.min(1, sAlpha * 0.95));
          if (sigilImg) {
            const pulse = 1 + Math.sin(tick * 0.45) * 0.08;
            const sw = 104 * pulse;
            const sh = (sigilImg.height / sigilImg.width) * sw;
            ctx.drawImage(sigilImg, sx - sw / 2, sy - sh * 0.55, sw, sh);
          } else {
            ctx.strokeStyle = st.color;
            ctx.lineWidth = 2.5;
            ctx.beginPath();
            ctx.ellipse(sx, sy, 48, 16, 0, 0, Math.PI * 2);
            ctx.stroke();
          }
        }

        // Phase 2 (31..20): Either Sky-Drop (Fallen/Shaka/Ling) OR Ground-Up Eruption (Magic Claw / Rose Inferno Tornado)!
        if (pl <= 31 && pl >= 20) {
          const t = (31 - pl) / 11; // 0 -> 1
          ctx.globalAlpha = 1;
          if (strikeImg) {
            if (st.motion === "erupt") {
              const kh = 52 + t * 88;
              const kw = (strikeImg.width / strikeImg.height) * kh;
              ctx.drawImage(strikeImg, sx - kw / 2, sy - kh + 10, kw, kh);
            } else {
              const kh = 104;
              const kw = (strikeImg.width / strikeImg.height) * kh;
              const dropY = sy - 245 * (1 - t * t) - 24;
              ctx.drawImage(strikeImg, sx - kw / 2, dropY - kh / 2, kw, kh);
            }
          }
        }

        // Phase 3 (21..9): Massive vertical elemental/spectral pillar erupting from impact!
        if (pl <= 21 && pl >= 9) {
          const pAlpha = pl < 13 ? (pl - 9) / 4 : 1;
          ctx.globalAlpha = Math.max(0, Math.min(1, pAlpha));
          if (pillarImg) {
            const ph = 248;
            const pw = (pillarImg.width / pillarImg.height) * ph;
            ctx.drawImage(pillarImg, sx - pw / 2, sy - ph + 16, pw, ph);
          }
        }

        // Phase 4 (16..1): Expanding elemental shockwave ring!
        if (pl <= 16) {
          const bT = 1 - pl / 16;
          ctx.globalAlpha = Math.max(0, 1 - bT);
          if (burstImg) {
            const bw = 96 + bT * 92;
            const bh = (burstImg.height / burstImg.width) * bw;
            ctx.drawImage(burstImg, sx - bw / 2, sy - bh * 0.65, bw, bh);
          }
        }
        ctx.restore();
      } else if (fx.type === "shockwave") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y);
        ctx.save();
        ctx.globalAlpha = alpha;
        // Outer golden 360° shockwave ellipse
        ctx.strokeStyle = fx.color || "#fbbf24";
        ctx.lineWidth = 6 * alpha + 2;
        ctx.beginPath();
        ctx.ellipse(sx, sy, fx.radius, fx.radius * 0.42, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Bright white inner ring
        ctx.strokeStyle = "#ffffff";
        ctx.lineWidth = 2.5 * alpha + 1;
        ctx.beginPath();
        ctx.ellipse(sx, sy, fx.radius * 0.78, fx.radius * 0.32, 0, 0, Math.PI * 2);
        ctx.stroke();
        // Seismic ground crack lines radiating outward
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2;
        for (let k = 0; k < 8; k++) {
          const a = (k / 8) * Math.PI * 2;
          ctx.beginPath();
          ctx.moveTo(sx + Math.cos(a) * 14, sy + Math.sin(a) * 6);
          ctx.lineTo(sx + Math.cos(a) * fx.radius * 0.92, sy + Math.sin(a) * fx.radius * 0.38);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.type === "afterimage") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y - fx.z);
        const sprite = window.sprites && window.sprites.get("hero_samurai_slash");
        ctx.save();
        ctx.globalAlpha = alpha * 0.52;
        ctx.translate(sx, sy);
        ctx.scale(fx.facing, 1);
        if (sprite) {
          const targetH = 88;
          const targetW = (sprite.width / sprite.height) * targetH;
          ctx.filter = "hue-rotate(190deg) saturate(2.4) brightness(1.35)";
          ctx.drawImage(sprite, -targetW / 2, -targetH + 6, targetW, targetH);
        } else {
          ctx.fillStyle = "#38bdf8";
          ctx.fillRect(-14, -64, 28, 60);
        }
        ctx.restore();
      } else if (fx.type === "delayed_iaido") {
        const sx1 = Math.floor(fx.x1 - cameraX);
        const sy1 = Math.floor(fx.y1 - 32);
        const sx2 = Math.floor(fx.x2 - cameraX);
        const sy2 = Math.floor(fx.y2 - 32);
        ctx.save();
        if (!fx.detonated) {
          // Thin glowing cyan-violet telegraph thread before detonation
          ctx.globalAlpha = 0.85;
          ctx.strokeStyle = "#a855f7";
          ctx.lineWidth = 3;
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
          ctx.stroke();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 1.2;
          ctx.beginPath();
          ctx.moveTo(sx1, sy1);
          ctx.lineTo(sx2, sy2);
          ctx.stroke();
        } else {
          // Explosive silver-white Iaido blade flash!
          const burstAlpha = Math.max(0, fx.life / 15);
          ctx.globalAlpha = burstAlpha;
          ctx.strokeStyle = "#38bdf8";
          ctx.lineWidth = 14 * burstAlpha + 3;
          ctx.beginPath();
          ctx.moveTo(sx1 - fx.facing * 12, sy1);
          ctx.lineTo(sx2 + fx.facing * 16, sy2);
          ctx.stroke();
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 6 * burstAlpha + 1.5;
          ctx.beginPath();
          ctx.moveTo(sx1 - fx.facing * 12, sy1);
          ctx.lineTo(sx2 + fx.facing * 16, sy2);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.type === "bat_swarm") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y - fx.z);
        const batImg = window.sprites && window.sprites.get("vfx_momo_bats");
        ctx.save();
        ctx.globalAlpha = alpha;
        if (batImg) {
          const bob = Math.sin(fx.phase) * 3.5;
          ctx.translate(sx, sy + bob);
          ctx.scale(fx.vx < 0 ? -1 : 1, 1);
          ctx.imageSmoothingEnabled = false;
          const bh = 34;
          const bw = (batImg.width / batImg.height) * bh;
          ctx.drawImage(batImg, -bw * 0.5, -bh * 0.5, bw, bh);
        } else {
          const wingY = Math.sin(fx.phase) * 5;
          // Black body + crimson wing outline
          ctx.fillStyle = "#111827";
          ctx.strokeStyle = "#ef4444";
          ctx.lineWidth = 1.4;
          ctx.beginPath();
          ctx.moveTo(sx, sy);
          ctx.lineTo(sx - 8, sy - 3 + wingY);
          ctx.lineTo(sx - 4, sy + 3);
          ctx.lineTo(sx, sy + 1);
          ctx.lineTo(sx + 4, sy + 3);
          ctx.lineTo(sx + 8, sy - 3 + wingY);
          ctx.closePath();
          ctx.fill();
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.type === "mist_cloud") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y);
        const fadeOut = Math.min(1, fx.life / 28);
        const fadeIn = Math.min(1, (fx.maxLife - fx.life) / 8);
        const fade = fadeIn * fadeOut;
        const sc = fx.scale || 1.0;
        const mistKey = fx.isShadow ? "vfx_mist_poison" : fx.isBlood ? "vfx_mist_blood" : "vfx_mist_pepper";
        const mistImg = window.sprites && window.sprites.get(mistKey);
        ctx.save();
        if (mistImg) {
          const breatheX = 1 + Math.sin(tick * 0.08 + fx.x * 0.04) * 0.05;
          const breatheY = 1 + Math.cos(tick * 0.1 + fx.y * 0.04) * 0.06;
          const targetW = 166 * sc * breatheX;
          const targetH = (mistImg.height / mistImg.width) * 166 * sc * breatheY;
          const driftX = Math.sin(tick * 0.05 + fx.x * 0.03) * 3.5;
          ctx.imageSmoothingEnabled = false;
          ctx.globalAlpha = fade * 0.92;
          ctx.drawImage(mistImg, sx - targetW * 0.5 + driftX, sy - targetH + 14 * sc, targetW, targetH);
          // Subtle soft ground glow under the billowing cloud
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = fade * 0.22;
          ctx.drawImage(mistImg, sx - targetW * 0.48 - driftX * 0.5, sy - targetH + 12 * sc, targetW * 0.96, targetH * 0.96);
        } else {
          ctx.globalAlpha = fade * 0.55;
          const grad = ctx.createRadialGradient(sx, sy - 10, 8, sx, sy - 10, 74 * sc);
          if (fx.isShadow) {
            grad.addColorStop(0, "rgba(30, 41, 59, 0.90)");
            grad.addColorStop(0.55, "rgba(88, 28, 135, 0.52)");
            grad.addColorStop(1, "rgba(15, 23, 42, 0)");
          } else if (fx.isBlood) {
            grad.addColorStop(0, "rgba(220, 38, 38, 0.85)");
            grad.addColorStop(0.55, "rgba(153, 27, 27, 0.55)");
            grad.addColorStop(1, "rgba(127, 29, 29, 0)");
          } else {
            grad.addColorStop(0, "rgba(249, 115, 22, 0.85)");
            grad.addColorStop(0.55, "rgba(234, 88, 12, 0.5)");
            grad.addColorStop(1, "rgba(251, 146, 60, 0)");
          }
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(sx, sy - 12, 74 * sc, 34 * sc, 0, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.restore();
      } else if (fx.type === "grapple_line") {
        const sx1 = Math.floor(fx.x1 - cameraX);
        const sy1 = Math.floor(fx.y1 - 32);
        const sx2 = Math.floor(fx.x2 - cameraX);
        const sy2 = Math.floor(fx.y2 - 32);
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.strokeStyle = "#cbd5e1";
        ctx.lineWidth = 2.2;
        ctx.beginPath();
        ctx.moveTo(sx1, sy1);
        ctx.lineTo(sx2, sy2);
        ctx.stroke();
        // Golden grappling hook tip
        ctx.fillStyle = "#d4af37";
        ctx.beginPath();
        ctx.arc(sx2, sy2, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (fx.type === "raven_proj") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y - fx.z);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.4);
        ctx.translate(sx, sy);
        if (fx.kind === "bullet") {
          const bulletImg = window.sprites && window.sprites.get("vfx_raven_bullet");
          ctx.scale(fx.facing, 1);
          if (bulletImg) {
            ctx.imageSmoothingEnabled = false;
            const bh = fx.poison ? 26 : 22;
            const bw = (bulletImg.width / bulletImg.height) * bh;
            ctx.drawImage(bulletImg, -bw * 0.62, -bh * 0.5, bw, bh);
          } else {
            ctx.fillStyle = fx.poison ? "#a855f7" : "#d4af37";
            ctx.fillRect(-16, -2.5, 22, 5);
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-4, -1.2, 12, 2.4);
          }
        } else if (fx.kind === "shuriken") {
          const shurikenImg = window.sprites && window.sprites.get("vfx_raven_shuriken");
          ctx.rotate(tick * 0.55);
          if (shurikenImg) {
            ctx.imageSmoothingEnabled = false;
            const sh = 34;
            const sw = (shurikenImg.width / shurikenImg.height) * sh;
            ctx.drawImage(shurikenImg, -sw * 0.5, -sh * 0.5, sw, sh);
          } else {
            ctx.fillStyle = "#e2e8f0";
            ctx.strokeStyle = "#a855f7";
            ctx.lineWidth = 1.4;
            ctx.beginPath();
            for (let k = 0; k < 4; k++) {
              const a = (k * Math.PI) / 2;
              ctx.lineTo(Math.cos(a) * 9, Math.sin(a) * 9);
              ctx.lineTo(Math.cos(a + Math.PI / 4) * 3, Math.sin(a + Math.PI / 4) * 3);
            }
            ctx.closePath();
            ctx.fill();
            ctx.stroke();
          }
        } else {
          // Throwing Poison Kunai Barrage sprite (from Pack A)!
          const kunaiImg = window.sprites && window.sprites.get("vfx_proj_raven");
          ctx.scale(fx.facing, 1);
          if (fx.vy) ctx.rotate(Math.atan2(fx.vy, Math.abs(fx.vx) || 10) * 0.45);
          if (kunaiImg) {
            ctx.imageSmoothingEnabled = false;
            const kh = 32;
            const kw = (kunaiImg.width / kunaiImg.height) * kh;
            ctx.drawImage(kunaiImg, -kw * 0.48, -kh * 0.5, kw, kh);
          } else {
            ctx.fillStyle = "#c084fc";
            ctx.beginPath();
            ctx.moveTo(-10, -2);
            ctx.lineTo(12, 0);
            ctx.lineTo(-10, 2);
            ctx.closePath();
            ctx.fill();
            ctx.fillStyle = "#ffffff";
            ctx.fillRect(-2, -1, 10, 2);
          }
        }
        ctx.restore();
      } else if (fx.type === "eclipse_x_finisher") {
        // Lv.3 Finisher: Full-Screen Golden-Violet Eclipse X-Cross Slash!
        const cx = Math.floor(fx.x - cameraX);
        const cy = Math.floor(fx.y - 52);
        const xImg = window.sprites && window.sprites.get("vfx_raven_eclipse_x");
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.4);
        // Subtle dark eclipse flash vignette
        ctx.fillStyle = `rgba(10, 8, 18, ${alpha * 0.35})`;
        ctx.fillRect(0, 0, W, H);
        if (xImg) {
          const burstScale = 0.85 + (1 - alpha) * 0.38;
          const xh = 340 * burstScale;
          const xw = (xImg.width / xImg.height) * xh;
          ctx.imageSmoothingEnabled = false;
          ctx.globalCompositeOperation = "lighter";
          ctx.globalAlpha = Math.min(1, alpha * 0.55);
          ctx.drawImage(xImg, cx - xw * 0.55, cy - xh * 0.55, xw * 1.1, xh * 1.1);
          ctx.globalCompositeOperation = "source-over";
          ctx.globalAlpha = Math.min(1, alpha * 1.35);
          ctx.drawImage(xImg, cx - xw * 0.5, cy - xh * 0.5, xw, xh);
        } else {
          // Giant golden outer X beams
          ctx.strokeStyle = "#fcd34d";
          ctx.lineWidth = 18 * alpha + 4;
          ctx.beginPath();
          ctx.moveTo(cx - 420, cy - 260);
          ctx.lineTo(cx + 420, cy + 260);
          ctx.moveTo(cx + 420, cy - 260);
          ctx.lineTo(cx - 420, cy + 260);
          ctx.stroke();
          // Razor-bright white core X beams
          ctx.strokeStyle = "#ffffff";
          ctx.lineWidth = 6 * alpha + 1.5;
          ctx.beginPath();
          ctx.moveTo(cx - 420, cy - 260);
          ctx.lineTo(cx + 420, cy + 260);
          ctx.moveTo(cx + 420, cy - 260);
          ctx.lineTo(cx - 420, cy + 260);
          ctx.stroke();
        }
        ctx.restore();
      } else if (fx.type === "shaka_heaven_pillar") {
        // Shaka Lv.3 Finisher: 《萬臂合一・金光天墜》 Golden Sky Pillar!
        const cx = Math.floor(fx.x - cameraX);
        const cy = Math.floor(fx.y);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.4);
        const beamW = 140 * alpha + 30;
        const grad = ctx.createLinearGradient(cx - beamW / 2, 0, cx + beamW / 2, 0);
        grad.addColorStop(0, "rgba(251, 191, 36, 0)");
        grad.addColorStop(0.5, "rgba(254, 240, 138, 0.85)");
        grad.addColorStop(1, "rgba(251, 191, 36, 0)");
        ctx.fillStyle = grad;
        ctx.fillRect(cx - beamW / 2, 0, beamW, cy + 16);
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 5 * alpha + 2;
        ctx.beginPath();
        ctx.ellipse(cx, cy, 180 * (1 - alpha * 0.6), 54 * (1 - alpha * 0.6), 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (fx.type === "alice_snap_wave") {
        // Alice Lv.3 Finisher: Full-Screen Crimson Linguistic Soundwave Snap!
        const cx = Math.floor(fx.x - cameraX);
        const cy = Math.floor(fx.y - 44);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.4);
        ctx.fillStyle = `rgba(136, 19, 55, ${alpha * 0.36})`;
        ctx.fillRect(0, 0, W, H);
        // Horizontal crimson-gold soundwave spectrum bars across screen!
        ctx.strokeStyle = "#e11d48";
        ctx.lineWidth = 4;
        ctx.beginPath();
        for (let x = 0; x <= W; x += 10) {
          const amp = (1 - Math.abs(x - cx) / W) * 68 * alpha * Math.sin(x * 0.25 + tick * 0.8);
          if (x === 0) ctx.moveTo(x, cy + amp);
          else ctx.lineTo(x, cy + amp);
        }
        ctx.stroke();
        ctx.strokeStyle = "#fde68a";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(0, cy);
        ctx.lineTo(W, cy);
        ctx.stroke();
        ctx.restore();
      }
    }
  }

  // --- Arcade Super-Art Cut-in & Expanding 3x3 Aura Burst Overlay (All 9 Heroes!) ---
  function drawReloadLightningOverlay() {
    const cid = (player && player.charId) || "mustache";
    const prog = Math.max(0, Math.min(1, 1 - reloadCutsceneTimer / 72)); // 0 -> 1 over 1.2s
    const sx = player.x - cameraX;
    const sy = player.y - 38;

    const cutinThemes = {
      fallen: {
        primary: "#e9d5ff",
        glow: "#a855f7",
        bgDark: "rgba(30, 16, 48, 0.94)",
        title: "🪽 審判之痕！三階骸靈斬擊解放",
        sub: "MARK OF JUDGMENT • FALLEN ANGEL",
        portrait: "hero_fallen_portrait",
      },
      rose: {
        primary: "#fb923c",
        glow: "#ec4899",
        bgDark: "rgba(58, 12, 28, 0.92)",
        title: "🔥 群體暗示！三階煉獄火拳解放",
        sub: "PSYCHIC DOMINION • INFERNO FIST",
        portrait: "hero_rose_portrait",
      },
      ling: {
        primary: "#2dd4bf",
        glow: "#fbbf24",
        bgDark: "rgba(10, 38, 42, 0.92)",
        title: "🏮 四象靈契！青龍白虎朱雀玄武降臨",
        sub: "FOUR SYMBOLS • DIVINE BEASTS",
        portrait: "hero_ling_portrait",
      },
      magic: {
        primary: "#c084fc",
        glow: "#a855f7",
        bgDark: "rgba(38, 12, 68, 0.92)",
        title: "🔮 開門・裂界！暗影女皇降臨",
        sub: "UMBRAL SOVEREIGN AWAKENING",
        portrait: "hero_magic_portrait",
      },
      nightheron: {
        primary: "#7dd3fc",
        glow: "#0284c7",
        bgDark: "rgba(10, 32, 66, 0.92)",
        title: "👞 末班起飛！雨夜天翔水刃全開",
        sub: "MIDNIGHT FLIGHT • RAIN BLADE",
        portrait: "hero_nightheron_portrait",
      },
      ironfist: {
        primary: "#fcd34d",
        glow: "#f59e0b",
        bgDark: "rgba(56, 26, 8, 0.92)",
        title: "🥊 末班起飛！崩山轟拳解放",
        sub: "MOUNTAIN SHATTER • OVERDRIVE",
        portrait: "hero_ironfist_portrait",
      },
      alice: {
        primary: "#fb7185",
        glow: "#e11d48",
        bgDark: "rgba(62, 10, 26, 0.92)",
        title: "🌹 絕對契約！言靈領域展開",
        sub: "LINGUISTIC DOMAIN • SUBMIT",
        portrait: "hero_alice_portrait",
      },
      shaka: {
        primary: "#fde68a",
        glow: "#f59e0b",
        bgDark: "rgba(48, 32, 8, 0.92)",
        title: "☸ 千手觀音！萬臂群控覺醒",
        sub: "THOUSAND-ARM DHARMA AWAKENING",
        portrait: "hero_shaka_portrait",
      },
      raven: {
        primary: "#fcd34d",
        glow: "#d4af37",
        bgDark: "rgba(24, 18, 36, 0.92)",
        title: "🐦‍⬛ 日蝕處決！雙槍槍鬥術",
        sub: "ECLIPSE AKIMBO • GUN KATA",
        portrait: "hero_raven_portrait",
      },
      momo: {
        primary: "#fb7185",
        glow: "#dc2626",
        bgDark: "rgba(64, 10, 18, 0.92)",
        title: "🦇 血月覺醒！吸血鬼型態解放",
        sub: "CRIMSON VAMPIRE AWAKENING",
        portrait: "hero_momo_vampire_portrait",
      },
      samurai: {
        primary: hasSamuraiDualMode() ? "#c084fc" : "#38bdf8",
        glow: hasSamuraiDualMode() ? "#9333ea" : "#0284c7",
        bgDark: "rgba(12, 28, 52, 0.92)",
        title: hasSamuraiDualMode() ? "⚔️ 雙刀模式・交叉突進！" : "⚔️ 武士刀亂舞！劍氣傍身",
        sub: hasSamuraiDualMode() ? "DUAL KATANA • X-CROSS STORM" : "BLADE STORM • SWORD AURA",
        portrait: "hero_samurai_portrait",
      },
      mustache: {
        primary: "#fcd34d",
        glow: "#38bdf8",
        bgDark: "rgba(18, 32, 56, 0.92)",
        title: "👨🏻 手臂上膛！爆氣重拳解放",
        sub: "ARM RELOAD • OVERCLOCKED",
        portrait: "hero_mustache_portrait",
      },
    };
    const theme = cutinThemes[cid] || cutinThemes.mustache;

    // 1. Cinematic Dark Backdrop + Brief Impact Flash
    ctx.save();
    ctx.fillStyle = "rgba(8, 12, 24, 0.48)";
    ctx.fillRect(0, 0, W, H);
    if (prog < 0.14) {
      ctx.fillStyle = `rgba(255, 255, 255, ${(1 - prog / 0.14) * 0.42})`;
      ctx.fillRect(0, 0, W, H);
    }

    // 2. Vertical Sky Energy Pillar shooting through the Hero
    const pillarAlpha = prog < 0.15 ? prog / 0.15 : Math.max(0, 1 - (prog - 0.15) / 0.85);
    const pillarW = 54 + Math.sin(tick * 0.35) * 8;
    const pGrad = ctx.createLinearGradient(sx - pillarW, 0, sx + pillarW, 0);
    pGrad.addColorStop(0, "rgba(255,255,255,0)");
    pGrad.addColorStop(0.32, theme.glow);
    pGrad.addColorStop(0.5, "#ffffff");
    pGrad.addColorStop(0.68, theme.glow);
    pGrad.addColorStop(1, "rgba(255,255,255,0)");
    ctx.globalCompositeOperation = "lighter";
    ctx.globalAlpha = pillarAlpha * 0.46;
    ctx.fillStyle = pGrad;
    ctx.fillRect(sx - pillarW, 0, pillarW * 2, player.y + 8);

    // 3. Expanding & Spinning 3x3 Character-Exclusive Magic Aura Burst!
    const aura = window.sprites && window.sprites.get(`aura_${cid}`);
    if (aura) {
      const burstSize = 68 + prog * 138;
      const burstAlpha = prog < 0.18 ? prog / 0.18 : Math.max(0, 1 - (prog - 0.18) / 0.82);
      ctx.save();
      ctx.translate(sx, sy);
      ctx.rotate(prog * Math.PI * 1.4);
      ctx.globalCompositeOperation = "lighter";
      ctx.globalAlpha = burstAlpha * 0.88;
      ctx.drawImage(aura, -burstSize * 0.5, -burstSize * 0.5, burstSize, burstSize);
      ctx.restore();
    }
    ctx.restore();

    // 4. Arcade Fighting-Game Super-Art Cut-in Banner (Slides in fast -> holds -> zips out!)
    let slideX = 0;
    if (prog < 0.16) {
      const t = 1 - prog / 0.16;
      slideX = -W * t * t;
    } else if (prog > 0.82) {
      const t = (prog - 0.82) / 0.18;
      slideX = W * t * t;
    }

    const bandY = 66;
    const bandH = 62;
    ctx.save();
    ctx.translate(Math.round(slideX), 0);

    // Main dark slanted banner strip
    ctx.fillStyle = theme.bgDark;
    ctx.fillRect(0, bandY, W, bandH);

    // Animated diagonal anime speed lines inside banner
    ctx.save();
    ctx.beginPath();
    ctx.rect(0, bandY, W, bandH);
    ctx.clip();
    ctx.strokeStyle = theme.primary;
    ctx.globalAlpha = 0.24;
    ctx.lineWidth = 2;
    for (let i = -2; i < 14; i++) {
      const lx = ((i * 58 + tick * 14) % (W + 120)) - 60;
      ctx.beginPath();
      ctx.moveTo(lx, bandY + bandH);
      ctx.lineTo(lx + 26, bandY);
      ctx.stroke();
    }
    ctx.restore();

    // Glowing top & bottom neon trim bars
    ctx.fillStyle = theme.primary;
    ctx.fillRect(0, bandY, W, 3);
    ctx.fillRect(0, bandY + bandH - 3, W, 3);

    // Slanted Hero Portrait Cut-in Box on left side
    const pImg = window.sprites && window.sprites.get(theme.portrait);
    if (pImg) {
      const px = 44;
      const py = bandY - 8;
      const pw = 82;
      const ph = bandH + 16;
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(px + 14, py);
      ctx.lineTo(px + pw + 14, py);
      ctx.lineTo(px + pw, py + ph);
      ctx.lineTo(px, py + ph);
      ctx.closePath();
      ctx.fillStyle = "#090d16";
      ctx.fill();
      ctx.save();
      ctx.clip();
      ctx.drawImage(pImg, 0, 0, pImg.width, pImg.height, px, py, pw + 14, ph);
      ctx.restore();
      ctx.strokeStyle = theme.primary;
      ctx.lineWidth = 2.5;
      ctx.stroke();
      ctx.restore();
    }

    // Crisp Super-Art Title + English Subtitle
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
    ctx.shadowBlur = 8;
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 21px monospace";
    ctx.fillText(theme.title, 152, bandY + 32);

    ctx.shadowBlur = 4;
    ctx.fillStyle = theme.primary;
    ctx.font = "bold 10px monospace";
    ctx.fillText(`⚡ ${theme.sub} ⚡`, 154, bandY + 50);

    ctx.restore();
  }

  // --- Cinematic Glassmorphism Comms Subtitle Bar (Never obstructs battlefield!) ---
  function drawSpeechBubble(p) {
    const text = p.speechText;
    if (!text) return;
    ctx.save();
    ctx.font = "bold 10.5px monospace";
    const textW = ctx.measureText(text).width;
    const barW = Math.min(430, Math.max(210, textW + 58));
    const barH = 30;
    const bx = Math.round((W - barW) / 2);
    const by = 52;
    const alpha = p.speechTimer < 16 ? p.speechTimer / 16 : 1;
    ctx.globalAlpha = Math.max(0, Math.min(1, alpha));

    // Dark frosted glass backdrop with subtle top highlight
    const bgGrad = ctx.createLinearGradient(bx, by, bx, by + barH);
    bgGrad.addColorStop(0, "rgba(15, 23, 42, 0.90)");
    bgGrad.addColorStop(1, "rgba(9, 13, 24, 0.84)");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(bx, by, barW, barH);

    // Accent bar on left + crisp metallic border
    const accentCol = isFallen() ? "#c084fc" : isRose() ? "#fb923c" : isLing() ? "#2dd4bf" : isMagic() ? "#c084fc" : isAlice() ? "#fb7185" : isShaka() ? "#fde047" : isSamurai() ? "#38bdf8" : "#f59e0b";
    ctx.fillStyle = accentCol;
    ctx.fillRect(bx, by, 3, barH);
    ctx.strokeStyle = "rgba(148, 163, 184, 0.35)";
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, barW, barH);

    // Mini hero portrait inside comms bar
    const pKey =
      isFallen() ? "hero_fallen_portrait" :
      isRose() ? "hero_rose_portrait" :
      isLing() ? "hero_ling_portrait" :
      isMagic() ? "hero_magic_portrait" :
      isNightHeronHero() ? "hero_nightheron_portrait" :
      isIronFistHero() ? "hero_ironfist_portrait" :
      isAlice() ? "hero_alice_portrait" :
      isShaka() ? "hero_shaka_portrait" :
      isRaven() ? "hero_raven_portrait" :
      isMomo() ? (isBuff() ? "hero_momo_vampire_portrait" : "hero_momo_portrait") :
      isSamurai() ? "hero_samurai_portrait" :
      "hero_mustache_portrait";
    const pImg = window.sprites && window.sprites.get(pKey);
    if (pImg) {
      ctx.drawImage(pImg, 0, 0, pImg.width, pImg.height, bx + 7, by + 3, 24, 24);
      ctx.strokeStyle = accentCol;
      ctx.lineWidth = 1;
      ctx.strokeRect(bx + 7, by + 3, 24, 24);
    }

    ctx.fillStyle = "#f8fafc";
    ctx.textAlign = "left";
    ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
    ctx.shadowBlur = 4;
    ctx.fillText(text, bx + 38, by + 19);
    ctx.restore();
  }

  function drawParticles() {
    for (const pt of particles) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
      ctx.fillStyle = pt.color;
      ctx.fillRect(Math.floor(pt.x - cameraX), Math.floor(pt.y - pt.z), pt.size, pt.size);
      ctx.restore();
    }
  }

  function drawFloatingTexts() {
    for (const ft of floatingTexts) {
      ctx.save();
      ctx.globalAlpha = Math.max(0, ft.life / ft.maxLife);
      ctx.font = `900 ${Math.floor(13 * ft.scale)}px monospace`;
      ctx.textAlign = "center";
      ctx.fillStyle = "#0f172a";
      ctx.fillText(ft.text, Math.floor(ft.x - cameraX) + 1, Math.floor(ft.y) + 1);
      ctx.fillStyle = ft.color;
      ctx.fillText(ft.text, Math.floor(ft.x - cameraX), Math.floor(ft.y));
      ctx.restore();
    }
  }

  // --- Beveled Gunmetal-Steel Arcade HUD (Matches AAA Fighting-Game Steel Frame!) ---
  function drawSlantedRect(x, y, w, h, slant = 7) {
    ctx.beginPath();
    ctx.moveTo(x + slant, y);
    ctx.lineTo(x + w + slant, y);
    ctx.lineTo(x + w, y + h);
    ctx.lineTo(x, y + h);
    ctx.closePath();
  }

  function drawChamferedOctagon(x, y, w, h, cut = 7) {
    ctx.beginPath();
    ctx.moveTo(x + cut, y);
    ctx.lineTo(x + w - cut, y);
    ctx.lineTo(x + w, y + cut);
    ctx.lineTo(x + w, y + h - cut);
    ctx.lineTo(x + w - cut, y + h);
    ctx.lineTo(x + cut, y + h);
    ctx.lineTo(x, y + h - cut);
    ctx.lineTo(x, y + cut);
    ctx.closePath();
  }

  function drawHUD() {
    if (!player) return;

    // 1. Welded Gunmetal-Steel Outer Gauge Housing (slanted right edge + metallic bevel)
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.72)";
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 3;
    ctx.beginPath();
    ctx.moveTo(54, 12);
    ctx.lineTo(256, 12);
    ctx.lineTo(260, 16);
    ctx.lineTo(247, 54);
    ctx.lineTo(242, 57);
    ctx.lineTo(54, 57);
    ctx.closePath();
    const steelOuter = ctx.createLinearGradient(54, 12, 54, 57);
    steelOuter.addColorStop(0, "#cbd5e1");
    steelOuter.addColorStop(0.18, "#475569");
    steelOuter.addColorStop(0.55, "#1e293b");
    steelOuter.addColorStop(0.88, "#334155");
    steelOuter.addColorStop(1, "#0f172a");
    ctx.fillStyle = steelOuter;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    ctx.strokeStyle = isBuff() ? "#7dd3fc" : "#94a3b8";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner recessed dark metallic trough
    ctx.beginPath();
    ctx.moveTo(57, 15);
    ctx.lineTo(254, 15);
    ctx.lineTo(243, 53);
    ctx.lineTo(57, 53);
    ctx.closePath();
    ctx.fillStyle = "#0b1120";
    ctx.fill();
    ctx.restore();

    // 2. Left Chamfered Octagonal Brushed-Steel Portrait Frame (50x50)
    const portraitImg = window.sprites && window.sprites.get(
      isFallen()
        ? "hero_fallen_portrait"
        : isRose()
        ? "hero_rose_portrait"
        : isLing()
        ? "hero_ling_portrait"
        : isMagic()
        ? "hero_magic_portrait"
        : isNightHeronHero()
        ? "hero_nightheron_portrait"
        : isIronFistHero()
        ? "hero_ironfist_portrait"
        : isAlice()
        ? "hero_alice_portrait"
        : isShaka()
        ? "hero_shaka_portrait"
        : isRaven()
        ? "hero_raven_portrait"
        : isMomo()
        ? (isBuff() ? "hero_momo_vampire_portrait" : "hero_momo_portrait")
        : isSamurai()
        ? "hero_samurai_portrait"
        : "hero_mustache_portrait"
    );
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.78)";
    ctx.shadowBlur = 8;
    drawChamferedOctagon(9, 8, 52, 52, 7);
    const pBevel = ctx.createLinearGradient(9, 8, 9, 60);
    pBevel.addColorStop(0, "#e2e8f0");
    pBevel.addColorStop(0.25, "#64748b");
    pBevel.addColorStop(0.7, "#1e293b");
    pBevel.addColorStop(1, "#94a3b8");
    ctx.fillStyle = pBevel;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 1.2;
    ctx.stroke();

    // Inner portrait clip
    drawChamferedOctagon(13, 12, 44, 44, 5);
    ctx.fillStyle = "#090d16";
    ctx.fill();
    ctx.save();
    ctx.clip();
    if (portraitImg) {
      ctx.drawImage(portraitImg, 0, 0, portraitImg.width, portraitImg.height, 13, 12, 44, 44);
    }
    ctx.restore();
    ctx.strokeStyle = isBuff() ? "#38bdf8" : "rgba(226, 232, 240, 0.45)";
    ctx.lineWidth = 1.2;
    ctx.stroke();
    ctx.restore();

    // 3. 3D Glossy Emerald HP Bar with Delayed Red Damage Trail & 4 Clean Segments
    const barX = 64;
    const barW = 180;
    ctx.save();
    drawSlantedRect(barX, 18, barW, 14, 5);
    ctx.fillStyle = "#090f1d";
    ctx.fill();
    ctx.save();
    ctx.clip();
    const trailRatio = Math.max(0, Math.min(1, displayHp / player.maxHp));
    const hpRatio = Math.max(0, player.hp / player.maxHp);
    if (trailRatio > hpRatio) {
      ctx.fillStyle = "#f43f5e";
      ctx.fillRect(barX, 18, Math.floor((barW + 6) * trailRatio), 14);
    }
    const hpGrad = ctx.createLinearGradient(barX, 18, barX, 32);
    if (hpRatio > 0.35) {
      hpGrad.addColorStop(0, "#86efac");
      hpGrad.addColorStop(0.32, "#22c55e");
      hpGrad.addColorStop(0.78, "#16a34a");
      hpGrad.addColorStop(1, "#14532d");
    } else {
      hpGrad.addColorStop(0, Math.floor(tick / 8) % 2 === 0 ? "#fda4af" : "#fdba74");
      hpGrad.addColorStop(0.45, "#ef4444");
      hpGrad.addColorStop(1, "#7f1d1d");
    }
    ctx.fillStyle = hpGrad;
    ctx.fillRect(barX, 18, Math.floor((barW + 6) * hpRatio), 14);
    // Crisp top glass highlight + 4 segment lines
    ctx.fillStyle = "rgba(255, 255, 255, 0.30)";
    ctx.fillRect(barX, 18, Math.floor((barW + 6) * hpRatio), 3);
    ctx.fillStyle = "rgba(15, 23, 42, 0.28)";
    for (let s = 1; s < 4; s++) {
      ctx.fillRect(barX + Math.round((barW * s) / 4), 18, 1, 14);
    }
    ctx.restore();
    ctx.strokeStyle = "rgba(148, 163, 184, 0.55)";
    ctx.lineWidth = 1;
    ctx.stroke();

    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
    ctx.shadowBlur = 3;
    ctx.font = "900 9.5px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, barX + 7, 29);
    ctx.restore();

    // 4. 3D Glossy Golden Ultimate Bar — Preserving EVERY Hero's Full Ultimate Text + Beveled Silver [R] Keycap!
    ctx.save();
    drawSlantedRect(barX - 3, 36, barW - 2, 14, 5);
    ctx.fillStyle = "#090f1d";
    ctx.fill();
    ctx.save();
    ctx.clip();
    const ultFill = isBuff() ? player.buffTimer / player.buffMax : player.reloadGauge / 100;
    const isFull = isBuff() || player.reloadGauge >= 100;
    const ultGrad = ctx.createLinearGradient(barX - 3, 36, barX - 3, 50);
    if (isBuff()) {
      const bCol = isRose() ? "#f97316" : isLing() ? "#2dd4bf" : isMagic() ? "#c084fc" : isNightHeronHero() ? "#38bdf8" : isIronFistHero() ? "#f59e0b" : isAlice() ? "#e11d48" : isShaka() ? "#fde68a" : isRaven() ? "#d4af37" : isMomo() ? "#f43f5e" : isFallen() ? "#c084fc" : "#38bdf8";
      ultGrad.addColorStop(0, "#ffffff");
      ultGrad.addColorStop(0.32, bCol);
      ultGrad.addColorStop(1, bCol);
    } else {
      ultGrad.addColorStop(0, "#fef9c3");
      ultGrad.addColorStop(0.35, "#fbbf24");
      ultGrad.addColorStop(0.8, "#f59e0b");
      ultGrad.addColorStop(1, "#b45309");
    }
    ctx.fillStyle = ultGrad;
    ctx.fillRect(barX - 3, 36, Math.floor((barW + 4) * Math.max(0, Math.min(1, ultFill))), 14);
    ctx.fillStyle = "rgba(255, 255, 255, 0.28)";
    ctx.fillRect(barX - 3, 36, Math.floor((barW + 4) * Math.max(0, Math.min(1, ultFill))), 3);
    // Shimmer light sweep when READY or BUFF!
    if (isFull) {
      const sweepX = ((tick * 4) % (barW + 60)) - 30;
      const shGrad = ctx.createLinearGradient(barX + sweepX - 18, 36, barX + sweepX + 18, 36);
      shGrad.addColorStop(0, "rgba(255,255,255,0)");
      shGrad.addColorStop(0.5, "rgba(255,255,255,0.72)");
      shGrad.addColorStop(1, "rgba(255,255,255,0)");
      ctx.fillStyle = shGrad;
      ctx.fillRect(barX - 3, 36, barW + 4, 14);
    }
    ctx.restore();
    ctx.strokeStyle = isFull ? "#fef08a" : "rgba(148, 163, 184, 0.45)";
    ctx.lineWidth = isFull ? 1.3 : 1;
    ctx.stroke();

    ctx.font = "900 9px monospace";
    ctx.textAlign = "left";
    ctx.fillStyle = isBuff() ? (isAlice() ? "#ffffff" : "#0f172a") : isFull ? "#0f172a" : "#fefce8";
    const ultLabel = isBuff()
      ? (isFallen()
          ? (unlockedUltLevel >= 3 ? "🪽 Lv.3 終末宣告・萬骸審判!" : unlockedUltLevel >= 2 ? "🪽 Lv.2 懲罪斬・天降骸靈!" : "🪽 Lv.1 裁決斬・裂風巨劍!")
          : isRose()
          ? (unlockedUltLevel >= 3 ? "🔥 Lv.3 煉獄拳・熾焰焚盡!" : unlockedUltLevel >= 2 ? "🔥 Lv.2 爆炎拳・火環衝擊!" : "🔥 Lv.1 燃炎拳・精神支配!")
          : isLing()
          ? (unlockedUltLevel >= 3 ? "🏮 四象歸一・聖獸齊衝!" : "🏮 四象靈契・聖獸降臨!")
          : isMagic()
          ? (unlockedUltLevel >= 3 ? "🔮 暗影女皇・深淵降臨!" : "🔮 裂界開啟・亡靈全開!")
          : isNightHeronHero()
          ? (unlockedUltLevel >= 3 ? "👞 末班起飛・天翔準備!" : "👞 雨夜天翔・水刃全開!")
          : isIronFistHero()
          ? (unlockedUltLevel >= 3 ? "🥊 末班起飛・合體準備!" : "🥊 崩山轟拳・蒸氣全開!")
          : isAlice()
          ? (unlockedUltLevel >= 3 ? "🌹 最高指令：「臣服」!" : "🌹 絕對契約・言靈領域!")
          : isShaka()
          ? (unlockedUltLevel >= 3 ? "☸ 天地鎮壓! 360°千手陣" : "☸ 千手觀音・萬臂群控!")
          : isRaven()
          ? (unlockedUltLevel >= 3 ? "🐦‍⬛ 日蝕槍鬥術! GUN KATA" : "🐦‍⬛ 日蝕雙槍處決!")
          : isMomo()
          ? "🦇 吸血鬼型態! 長爪吸血"
          : hasSamuraiDualMode()
          ? "⚔️ 雙刀模式・交叉突進!"
          : isSamurai()
          ? "劍氣傍身! SWORD AURA"
          : "BUFF MODE! +POCKET")
      : player.reloadGauge >= 100
      ? (isFallen() ? "審判之痕 READY!" : isRose() ? "煉獄火拳 READY!" : isLing() ? "四象降臨 READY!" : isMagic() ? "暗影女皇 READY!" : isNightHeronHero() ? "雨夜天翔 READY!" : isIronFistHero() ? "崩山轟拳 READY!" : isAlice() ? "言靈領域 READY!" : isShaka() ? "萬臂群控 READY!" : isRaven() ? "日蝕雙槍 READY!" : isMomo() ? "吸血鬼變身 READY!" : isSamurai() ? "武士刀亂舞 READY!" : "RELOAD READY!")
      : (isFallen() ? `JUDGMENT ${player.reloadGauge}%` : isRose() ? `INFERNO ${player.reloadGauge}%` : isLing() ? `BEASTS ${player.reloadGauge}%` : isMagic() ? `MAGIC ${player.reloadGauge}%` : isNightHeronHero() ? `RAIN ${player.reloadGauge}%` : isIronFistHero() ? `STEAM ${player.reloadGauge}%` : isAlice() ? `VOICE ${player.reloadGauge}%` : isShaka() ? `DHARMA ${player.reloadGauge}%` : isRaven() ? `ECLIPSE ${player.reloadGauge}%` : isMomo() ? `BLOOD ${player.reloadGauge}%` : isSamurai() ? `SWORD QI ${player.reloadGauge}%` : `RELOAD ${player.reloadGauge}%`);
    ctx.fillText(ultLabel, barX + 5, 46);

    // Beveled metallic silver [R] keycap badge when Ultimate is READY!
    if (!isBuff() && player.reloadGauge >= 100) {
      const kx = barX + barW - 22;
      const ky = 37.5;
      drawSlantedRect(kx, ky, 15, 11, 2);
      const kGrad = ctx.createLinearGradient(kx, ky, kx, ky + 11);
      kGrad.addColorStop(0, "#f8fafc");
      kGrad.addColorStop(0.55, "#cbd5e1");
      kGrad.addColorStop(1, "#64748b");
      ctx.fillStyle = kGrad;
      ctx.fill();
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.fillStyle = "#0f172a";
      ctx.font = "900 8.5px monospace";
      ctx.textAlign = "center";
      ctx.fillText("R", kx + 8.5, ky + 8.5);
    }
    ctx.restore();

    // Sleek Frameless High-Contrast Floating Score & Stage Badge (top-right)
    ctx.save();
    ctx.textAlign = "right";
    ctx.shadowColor = "rgba(0, 0, 0, 0.92)";
    ctx.shadowBlur = 6;
    ctx.fillStyle = "#fde047";
    ctx.font = "900 14.5px monospace";
    ctx.fillText(`SCORE ${String(score).padStart(6, "0")}`, W - 16, 26);
    // Subtle glowing gold underline
    const uGrad = ctx.createLinearGradient(W - 156, 31, W - 16, 31);
    uGrad.addColorStop(0, "rgba(253, 224, 71, 0)");
    uGrad.addColorStop(1, "rgba(253, 224, 71, 0.78)");
    ctx.fillStyle = uGrad;
    ctx.fillRect(W - 156, 30, 140, 1.5);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 10px monospace";
    const trainZone =
      player.x < 640
        ? "車尾行李車"
        : player.x < 1280
        ? "旅客車廂"
        : player.x < 1920
        ? "餐車"
        : "駕駛室";
    const stageNames = {
      1: "STAGE 1: HARBOUR",
      2: "STAGE 2: RESTROOM",
      6: "STAGE 3: 末班機 (AIRPORT)",
      3: "BIO-LAB 1F: 研究所一層",
      4: "BIO-LAB B1: 毒沼氣層",
      5: "BIO-LAB 3F: 基因研究者",
      7: "台灣・大稻埕 (迪化街)",
      8: `🚂 山線特快・${trainZone}`,
    };
    const wtHudStage = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
    ctx.fillText((wtHudStage && wtHudStage.hudName) || stageNames[currentStage] || "STAGE", W - 16, 44);
    ctx.restore();

    // Bouncing Arcade Combo Counter + Dynamic Style Rank Badge (C -> B -> A -> S -> SS -> SSS)
    if (combo >= 2) {
      const rank =
        combo >= 30 ? { g: "SSS", c: "#f43f5e" } :
        combo >= 20 ? { g: "SS", c: "#fb923c" } :
        combo >= 12 ? { g: "S", c: "#fde047" } :
        combo >= 7 ? { g: "A", c: "#38bdf8" } :
        combo >= 4 ? { g: "B", c: "#4ade80" } :
        { g: "C", c: "#cbd5e1" };
      const pop = Math.min(1.22, 1 + Math.max(0, comboTimer - 120) * 0.014);
      ctx.save();
      ctx.translate(W - 18, 76);
      ctx.scale(pop, pop);
      ctx.textAlign = "right";
      ctx.shadowColor = "rgba(0,0,0,0.85)";
      ctx.shadowBlur = 6;
      ctx.fillStyle = rank.c;
      ctx.font = "900 20px monospace";
      ctx.fillText(`${rank.g}  ${combo} HIT!`, 0, 0);
      ctx.restore();
    }

    // Dramatic Arcade BOSS WARNING Banner!
    if (bossWarningTimer > 0) {
      const flash = Math.sin(tick * 0.45) * 0.5 + 0.5;
      ctx.save();
      ctx.fillStyle = `rgba(127, 29, 29, ${0.42 + flash * 0.32})`;
      ctx.fillRect(0, 128, W, 62);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(0, 128, W, 3);
      ctx.fillRect(0, 187, W, 3);
      ctx.textAlign = "center";
      ctx.shadowColor = "rgba(0,0,0,0.9)";
      ctx.shadowBlur = 8;
      ctx.fillStyle = flash > 0.5 ? "#fef08a" : "#ffffff";
      ctx.font = "900 22px monospace";
      ctx.fillText("⚠  WARNING — BOSS APPROACHING  ⚠", W / 2, 156);
      ctx.fillStyle = "#fecaca";
      ctx.font = "bold 11px monospace";
      ctx.fillText(bossWarningName || "強敵現身！準備迎戰！", W / 2, 177);
      ctx.restore();
    }

    // GO! Arrow after wave clear
    if (goArrowTimer > 0 && Math.floor(tick / 12) % 2 === 0) {
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 22px monospace";
      ctx.textAlign = "right";
      ctx.fillText("GO! >>>", W - 20, 118);
    }

    // Welded Gunmetal Bottom Sub-Tab for Unlocked Lv.1-3 Ultimate Badge
    if (unlockedUltLevel >= 1) {
      ctx.save();
      ctx.beginPath();
      ctx.moveTo(56, 56);
      ctx.lineTo(222, 56);
      ctx.lineTo(214, 71);
      ctx.lineTo(52, 71);
      ctx.closePath();
      ctx.fillStyle = "rgba(15, 23, 42, 0.94)";
      ctx.fill();
      ctx.strokeStyle = "#64748b";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "#fde047";
      ctx.font = "900 8.5px monospace";
      ctx.textAlign = "left";
      const badgeLabel = isNightHeronHero()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 合體技「末班起飛」高空斜踢!"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 高空殘影下劈踢"
          : "★ Lv.1: 雙重交叉水刃波"
        : isIronFistHero()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 合體技「末班起飛」爆裂收招!"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 火箭超長距衝拳"
          : "★ Lv.1: 碎地二次震波"
        : isAlice()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 最高指令「臣服」彈指處決!"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 指虎殘影狂潮連打"
          : "★ Lv.1: 言靈混亂破甲指令"
        : isShaka()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 360°千手陣＋金光天墜!"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 如來掌壓震波"
          : "★ Lv.1: 萬臂束縛定身"
        : isRaven()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 日蝕槍鬥術 (360° 彈幕!)"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 雙槍＋苦無齊射"
          : "★ Lv.1: 劇毒穿甲雙槍"
        : isSamurai()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 雙刀模式・交叉突進!"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 14秒亂舞 (再贏1小王解鎖雙刀)"
          : "★ Lv.1: 大範圍12秒亂舞"
        : isMomo()
        ? unlockedUltLevel >= 3
          ? "★★★ MAX: 真祖吸血長爪"
          : unlockedUltLevel >= 2
          ? "★★ Lv.2: 廣域血爪波"
          : "★ Lv.1: 強化吸血長爪"
        : unlockedUltLevel >= 3
        ? "★★★ MAX: 極限4連重擊"
        : unlockedUltLevel >= 2
        ? "★★ Lv.2: 超廣域4連擊"
        : "★ Lv.1: 大範圍3連擊";
      ctx.fillText(badgeLabel, 60, 66.5);
      ctx.restore();
    }

    // Celebratory Skill Unlock Banner
    if (unlockBannerTimer > 0) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)";
      ctx.fillRect(60, 86, W - 120, 44);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.strokeRect(60, 86, W - 120, 44);
      ctx.textAlign = "center";
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 13px monospace";
      ctx.fillText(unlockBannerTitle, W / 2, 105);
      ctx.fillStyle = "#e0f2fe";
      ctx.font = "bold 10px monospace";
      ctx.fillText(unlockBannerSub, W / 2, 121);
    }

    // Stage 6 《末班機》: Dual Split Boss HP Bars (鐵拳 + 夜鷺)
    if (currentStage === 6) {
      const iron = enemies.find((e) => e.type === "boss_ironfist" && !e.dead);
      const heron = enemies.find((e) => e.type === "boss_nightheron" && !e.dead);
      if (iron) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
        ctx.fillRect(28, H - 30, 276, 20);
        ctx.fillStyle = "#b91c1c";
        ctx.fillRect(30, H - 28, Math.floor(272 * Math.max(0, iron.hp / iron.maxHp)), 16);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${iron.name}  [🛡️45%護甲]`, 166, H - 17);
      }
      if (heron) {
        ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
        ctx.fillRect(336, H - 30, 276, 20);
        ctx.fillStyle = "#1d4ed8";
        ctx.fillRect(338, H - 28, Math.floor(272 * Math.max(0, heron.hp / heron.maxHp)), 16);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 9.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`${heron.name}  [🛡️45%護甲]`, 474, H - 17);
      }
    }

    // Boss, Dr. Genex, 8+9 King Boss, Train Mechanic Boss, World Tour Boss, or Mini-Boss Health Bar at bottom if alive
    const boss = enemies.find(
      (e) =>
        (e.type === "wt_boss" ||
          e.type === "boss_train_mechanic" ||
          e.type === "boss_89_king" ||
          e.type === "genex_boss" ||
          e.type === "boss" ||
          e.type === "miniboss") &&
        !e.dead
    );
    if (boss) {
      const wtBossStage = boss.type === "wt_boss" && window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
      ctx.fillStyle = "rgba(15, 23, 42, 0.90)";
      ctx.fillRect(100, H - 30, 440, 20);
      ctx.fillStyle =
        wtBossStage
          ? wtBossStage.bossBarColor
          : boss.type === "boss_train_mechanic"
          ? "#d97706"
          : boss.type === "boss_89_king"
          ? "#dc2626"
          : boss.type === "genex_boss"
          ? boss.bossPhase === 3
            ? "#dc2626"
            : boss.bossPhase === 2
            ? "#9333ea"
            : "#16a34a"
          : boss.type === "miniboss"
          ? "#f59e0b"
          : "#a855f7";
      ctx.fillRect(102, H - 28, Math.floor(436 * Math.max(0, boss.hp / boss.maxHp)), 16);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      const defPct = Math.round((boss.defense || 0) * 100);
      ctx.fillText(defPct > 0 ? `${boss.name}  [🛡️${defPct}%護甲]` : boss.name, W / 2, H - 17);
    }
  }

  function drawTitleOverlay() {
    // Full-Screen Bespoke AAA Character Select Artwork for all 12 Heroes!
    const selectImg = window.sprites && window.sprites.get(`select_${selectedChar}`);
    if (selectImg && selectImg.width > 0) {
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(selectImg, 0, 0, W, H);
      // Subtle pulsing ENTER / CLICK deploy prompt above the roster bar on right side
      if (Math.floor(tick / 26) % 2 === 0) {
        ctx.textAlign = "center";
        ctx.shadowColor = "rgba(0, 0, 0, 0.95)";
        ctx.shadowBlur = 8;
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 10.5px monospace";
        ctx.fillText("▶ PRESS ENTER / CLICK 出戰世界地圖", 514, 266);
      }
      ctx.restore();
      return;
    }

    // Fallback: Rich dark atmospheric tint over the live Harbour backdrop
    ctx.fillStyle = "rgba(8, 11, 22, 0.68)";
    ctx.fillRect(0, 0, W, H);

    const roster = [
      { id: "mustache", cn: "八字鬍英雄", en: "M U S T A C H E   H E R O", tagline: "雙拳震碎大地，手臂上膛爆氣連打。", j: "重拳三連擊", k: "重裝震地槌", r: "手臂上膛・爆氣", color: "#f59e0b", skillKey: "ground_slam" },
      { id: "samurai", cn: "街頭武士", en: "S T R E E T   S A M U R A I", tagline: "殘影居合瞬斬，雙刀劍氣橫掃全場。", j: "武士刀三連斬", k: "殘影瞬步居合", r: "劍氣亂舞・雙刀", color: "#38bdf8", skillKey: "shadow_dash" },
      { id: "momo", cn: "莫莫", en: "M O M O", tagline: "血蝠瞬閃控場，真祖覺醒長爪吸血。", j: "防狼噴霧控場", k: "血蝠瞬閃血霧", r: "吸血鬼真祖覺醒", color: "#f43f5e", skillKey: "bat_blink" },
      { id: "raven", cn: "烏鴉", en: "R A V E N", tagline: "暗影毒刃背刺，日蝕雙槍全場處決。", j: "暗殺短刃毒刀", k: "煙霧鉤爪影遁", r: "日蝕雙槍處決", color: "#d4af37", skillKey: "grapple_smoke" },
      { id: "shaka", cn: "釋迦", en: "S H A K A", tagline: "靈臂金剛鎖敵，如來神掌金光天墜。", j: "靈臂三連聚敵", k: "金剛鎖・如來掌", r: "千手觀音天墜", color: "#fde68a", skillKey: "shaka_bind" },
      { id: "alice", cn: "愛麗絲", en: "A L I C E", tagline: "黃銅指虎破甲，言靈契約絕對臣服。", j: "薔薇指虎連打", k: "言靈・跪下破甲", r: "絕對契約領域", color: "#fb7185", skillKey: "alice_voice" },
      { id: "ironfist", cn: "鐵拳", en: "I R O N   F I S T", tagline: "白繃帶剛猛重拳，鐵山靠崩山裂地。", j: "白繃帶剛拳三連", k: "鐵壁・鐵山靠", r: "蒸氣崩山轟拳", color: "#fb923c", skillKey: "if_shoulder" },
      { id: "nightheron", cn: "夜鷺", en: "N I G H T   H E R O N", tagline: "雙手插袋旋踢，雨幕水刃天翔制空。", j: "插袋旋風三連踢", k: "踏影迴避旋踢", r: "雨夜天翔水刃", color: "#60a5fa", skillKey: "nh_evade_kick" },
      { id: "magic", cn: "瑪姬", en: "M A G I C", tagline: "深淵裂縫牽引，暗影魔爪破土吞噬。", j: "黑魔法飛彈連射", k: "能量牽引・深淵爪", r: "暗影女皇降臨", color: "#c084fc", skillKey: "magic_vortex" },
      { id: "ling", cn: "鈴", en: "L I N G", tagline: "四象靈契輪轉，八卦落雷火鳳天降。", j: "三聖獸輪轉連擊", k: "玄武印・四象雷", r: "四象靈契齊衝", color: "#2dd4bf", skillKey: "ling_xuanwu" },
      { id: "rose", cn: "蘿絲", en: "R O S E", tagline: "桃紅腦波支配，煉獄火柱焚盡一切。", j: "烈焰火拳三連轟", k: "精神支配・煉獄焰", r: "群體暗示・煉獄拳", color: "#fb923c", skillKey: "rose_psychic" },
      { id: "fallen", cn: "墮落天使", en: "F A L L E N   A N G E L", tagline: "雙翼擊飛敵群，舉劍召下骸靈。", j: "羽翼風壓", k: "審判降臨", r: "審判之痕", color: "#e9d5ff", skillKey: "fallen_judgment" },
    ];

    const activeIdx = Math.max(0, roster.findIndex((r) => r.id === selectedChar));
    const cur = roster[activeIdx];

    // === 1. LEFT 35%: GIANT HERO SPLASH PORTRAIT WITH SEAMLESS CINEMATIC FADE ===
    const splashImg = window.sprites && window.sprites.get(`hero_${cur.id}_portrait`);
    if (splashImg) {
      ctx.save();
      ctx.beginPath();
      ctx.rect(0, 0, 248, 290);
      ctx.clip();
      ctx.drawImage(splashImg, 0, 0, splashImg.width, splashImg.height, -12, -4, 266, 266);
      const rightFade = ctx.createLinearGradient(118, 0, 248, 0);
      rightFade.addColorStop(0, "rgba(8, 11, 22, 0)");
      rightFade.addColorStop(0.65, "rgba(8, 11, 22, 0.78)");
      rightFade.addColorStop(1, "rgba(8, 11, 22, 1)");
      ctx.fillStyle = rightFade;
      ctx.fillRect(118, 0, 130, 290);
      const botFade = ctx.createLinearGradient(0, 210, 0, 290);
      botFade.addColorStop(0, "rgba(8, 11, 22, 0)");
      botFade.addColorStop(1, "rgba(8, 11, 22, 0.96)");
      ctx.fillStyle = botFade;
      ctx.fillRect(0, 210, 248, 80);
      ctx.restore();
    }

    // === 2. CENTER: LIVE ANIMATED HERO SPRITE ON 2.5D ROTATING MAGIC AURA PEDESTAL ===
    const heroX = 314;
    const heroY = 236;
    if (window.sprites && window.sprites.get(`aura_${cur.id}`)) {
      drawUltimateAuraRing(cur.id, heroX, heroY + 6, 1.24);
    } else {
      ctx.save();
      ctx.strokeStyle = cur.color;
      ctx.globalAlpha = 0.65;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.ellipse(heroX, heroY + 6, 48, 13, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

    // Live interactive preview animation driven by selected J / K / R skill row!
    const cycleTick = tick % 48;
    const isPrevJ = titlePreviewMode === 0;
    const isPrevK = titlePreviewMode === 1;
    const isPrevR = titlePreviewMode === 2;
    const previewDummy = {
      charId: cur.id,
      z: isPrevK && (cur.id === "fallen" || cur.id === "shaka") ? 6 + Math.sin(tick * 0.14) * 3 : 0,
      facing: 1,
      walkFrame: tick * 0.08,
      attackTimer: isPrevJ || isPrevR ? (cycleTick < 26 ? 12 : 0) : 0,
      attackType: Math.floor(tick / 48) % 3,
      skillType: isPrevK ? cur.skillKey : "",
      skillActiveTimer: isPrevK ? (cycleTick < 30 ? Math.max(1, 28 - Math.floor(cycleTick * 0.9)) : 0) : 0,
      eatTimer: 0,
      fallenFinisherVisual: isPrevR && cur.id === "fallen" && cycleTick > 28 ? 24 : 0,
      roseFinisherVisual: isPrevR && cur.id === "rose" && cycleTick > 28 ? 20 : 0,
      lingFinisherVisual: isPrevR && cur.id === "ling" && cycleTick > 28 ? 20 : 0,
      magicFinisherVisual: isPrevR && cur.id === "magic" && cycleTick > 28 ? 20 : 0,
      shakaFinisherVisual: isPrevR && cur.id === "shaka" && cycleTick > 28 ? 20 : 0,
    };

    const previewBuff = isPrevR;
    if (cur.id === "fallen") {
      drawFallenSprite(previewDummy, heroX, heroY, previewBuff, 1.08);
    } else if (cur.id === "rose") {
      drawRoseSprite(previewDummy, heroX, heroY, previewBuff, 1.14);
    } else if (cur.id === "ling") {
      drawLingSprite(previewDummy, heroX, heroY, previewBuff, 1.14);
    } else if (cur.id === "magic") {
      drawMagicSprite(previewDummy, heroX, heroY, previewBuff, 1.12);
    } else if (cur.id === "nightheron") {
      drawNightHeronSprite(previewDummy, heroX, heroY, true, 1.14);
    } else if (cur.id === "ironfist") {
      drawIronFistSprite(previewDummy, heroX, heroY, true, 1.14);
    } else if (cur.id === "alice") {
      drawAliceSprite(previewDummy, heroX, heroY, true, 1.14);
    } else if (cur.id === "shaka") {
      drawShakaSprite(previewDummy, heroX, heroY, previewBuff, 1.08);
    } else if (cur.id === "raven") {
      drawRavenSprite(previewDummy, heroX, heroY, previewBuff || true, 1.14);
    } else if (cur.id === "momo") {
      drawMomoSprite(previewDummy, heroX, heroY, previewBuff, 1.16);
    } else if (cur.id === "samurai") {
      drawSamuraiSprite(previewDummy, heroX, heroY, previewBuff || true, 1.16);
    } else {
      drawMustacheSprite(previewDummy, heroX, heroY, previewBuff, 1.16);
    }

    // === 3. RIGHT 40%: SLEEK EDITORIAL CHARACTER PROFILE & J / K / R SKILL BARS ===
    ctx.save();
    ctx.strokeStyle = "rgba(253, 224, 71, 0.45)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(414, 30);
    ctx.lineTo(448, 30);
    ctx.moveTo(548, 30);
    ctx.lineTo(576, 30);
    ctx.stroke();

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde68a";
    ctx.font = "bold 9px monospace";
    ctx.fillText("P R O T O C O L", 498, 33);

    ctx.textAlign = "right";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`${activeIdx + 1} / ${roster.length}`, 622, 33);

    ctx.textAlign = "center";
    ctx.font = "900 28px Georgia, \x27Noto Serif TC\x27, serif";
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 10;
    const nameGrad = ctx.createLinearGradient(0, 48, 0, 86);
    nameGrad.addColorStop(0, "#ffffff");
    nameGrad.addColorStop(0.55, "#fef3c7");
    nameGrad.addColorStop(1, "#eab308");
    ctx.fillStyle = nameGrad;
    ctx.fillText(cur.cn, 514, 78);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 9px monospace";
    ctx.fillText(cur.en, 514, 98);

    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 10.5px monospace";
    ctx.fillText(cur.tagline, 514, 124);

    const divGrad = ctx.createLinearGradient(414, 136, 616, 136);
    divGrad.addColorStop(0, "rgba(253, 224, 71, 0)");
    divGrad.addColorStop(0.5, "rgba(253, 224, 71, 0.65)");
    divGrad.addColorStop(1, "rgba(253, 224, 71, 0)");
    ctx.fillStyle = divGrad;
    ctx.fillRect(414, 136, 202, 1);

    const skillRows = [
      { key: "J", name: cur.j, bg: "rgba(127, 29, 29, 0.85)", accent: "#f87171", glow: "rgba(248, 113, 113, 0.25)" },
      { key: "K", name: cur.k, bg: "rgba(12, 74, 110, 0.92)", accent: "#38bdf8", glow: "rgba(56, 189, 248, 0.30)" },
      { key: "R", name: cur.r, bg: "rgba(113, 63, 18, 0.88)", accent: "#fde047", glow: "rgba(253, 224, 71, 0.25)" },
    ];
    skillRows.forEach((row, rIdx) => {
      const ry = 152 + rIdx * 32;
      const rx = 418;
      const rw = 194;
      const rh = 24;
      const activeRow = titlePreviewMode === rIdx;

      ctx.save();
      drawSlantedRect(rx, ry, rw, rh, 6);
      if (activeRow) {
        const rg = ctx.createLinearGradient(rx, ry, rx + rw, ry);
        rg.addColorStop(0, row.glow);
        rg.addColorStop(0.6, "rgba(15, 23, 42, 0.85)");
        rg.addColorStop(1, "rgba(15, 23, 42, 0.35)");
        ctx.fillStyle = rg;
        ctx.fill();
        ctx.shadowColor = row.accent;
        ctx.shadowBlur = 10;
        ctx.strokeStyle = row.accent;
        ctx.lineWidth = 1.6;
        ctx.stroke();
      } else {
        ctx.fillStyle = "rgba(15, 23, 42, 0.56)";
        ctx.fill();
        ctx.strokeStyle = "rgba(148, 163, 184, 0.20)";
        ctx.lineWidth = 1;
        ctx.stroke();
      }
      ctx.shadowBlur = 0;

      drawSlantedRect(rx, ry, 34, rh, 6);
      ctx.fillStyle = row.bg;
      ctx.fill();
      ctx.fillStyle = "#ffffff";
      ctx.font = "900 12px Georgia, serif";
      ctx.textAlign = "center";
      ctx.fillText(row.key, rx + 20, ry + 16);

      ctx.fillStyle = "rgba(226, 232, 240, 0.35)";
      ctx.fillRect(rx + 44, ry + 5, 1, 14);
      ctx.fillStyle = activeRow ? "#ffffff" : "#cbd5e1";
      ctx.font = "bold 11.5px monospace";
      ctx.textAlign = "left";
      ctx.fillText(row.name, rx + 54, ry + 16);

      if (activeRow) {
        ctx.fillStyle = row.accent;
        ctx.textAlign = "right";
        ctx.font = "900 12px monospace";
        ctx.fillText("›", rx + rw - 6, ry + 16);
      }
      ctx.restore();
    });

    ctx.textAlign = "center";
    if (Math.floor(tick / 24) % 2 === 0) {
      ctx.fillStyle = "#fde047";
      ctx.font = "bold 10.5px monospace";
      ctx.fillText("▶ PRESS ENTER / CLICK 出戰世界地圖", 514, 266);
    }
    ctx.restore();

    // === 4. BOTTOM ROSTER BAR: GOLD DIAMOND RULE + ◀ + 12 PORTRAITS + ▶ ===
    ctx.save();
    ctx.fillStyle = "rgba(7, 10, 20, 0.90)";
    ctx.fillRect(0, 282, W, 78);

    const topLine = ctx.createLinearGradient(0, 282, W, 282);
    topLine.addColorStop(0, "rgba(253, 224, 71, 0.08)");
    topLine.addColorStop(0.5, "rgba(253, 224, 71, 0.72)");
    topLine.addColorStop(1, "rgba(253, 224, 71, 0.08)");
    ctx.fillStyle = topLine;
    ctx.fillRect(0, 282, W, 1.2);
    ctx.fillStyle = "#fde047";
    ctx.beginPath();
    ctx.moveTo(W / 2, 277);
    ctx.lineTo(W / 2 + 5, 282.5);
    ctx.lineTo(W / 2, 288);
    ctx.lineTo(W / 2 - 5, 282.5);
    ctx.closePath();
    ctx.fill();

    const pulse = Math.sin(tick * 0.12) * 1.8;
    ctx.fillStyle = "#c084fc";
    ctx.font = "900 16px monospace";
    ctx.textAlign = "center";
    ctx.fillText("◀", 24 - pulse, 326);
    ctx.fillText("▶", W - 24 + pulse, 326);

    const slotW = 45;
    const stripStartX = W / 2 - (roster.length * slotW) / 2;
    for (let i = 0; i < roster.length; i++) {
      const r = roster[i];
      const isAct = i === activeIdx;
      const sz = isAct ? 42 : 38;
      const px = Math.round(stripStartX + i * slotW + (slotW - sz) / 2);
      const py = isAct ? 298 : 300;
      const pImg = window.sprites && window.sprites.get(`hero_${r.id}_portrait`);

      ctx.save();
      if (!isAct) ctx.globalAlpha = 0.74;
      ctx.fillStyle = "#0b1120";
      ctx.fillRect(px, py, sz, sz);
      if (pImg) {
        ctx.drawImage(pImg, 0, 0, pImg.width, pImg.height, px, py, sz, sz);
      }
      ctx.strokeStyle = isAct ? "#fde047" : "rgba(148, 163, 184, 0.35)";
      ctx.lineWidth = isAct ? 2 : 1;
      ctx.strokeRect(px, py, sz, sz);

      if (isAct) {
        ctx.shadowColor = "#fde047";
        ctx.shadowBlur = 8;
        ctx.strokeStyle = "#fef08a";
        ctx.lineWidth = 2;
        const b = 7;
        const o = 3;
        ctx.beginPath();
        ctx.moveTo(px - o, py - o + b); ctx.lineTo(px - o, py - o); ctx.lineTo(px - o + b, py - o);
        ctx.moveTo(px + sz + o - b, py - o); ctx.lineTo(px + sz + o, py - o); ctx.lineTo(px + sz + o, py - o + b);
        ctx.moveTo(px - o, py + sz + o - b); ctx.lineTo(px - o, py + sz + o); ctx.lineTo(px - o + b, py + sz + o);
        ctx.moveTo(px + sz + o - b, py + sz + o); ctx.lineTo(px + sz + o, py + sz + o); ctx.lineTo(px + sz + o, py + sz + o - b);
        ctx.stroke();
      }
      ctx.restore();
    }
    ctx.restore();
  }

  function drawStageClearOverlay() {
    const sum = stageClearSummary;
    if (!sum) return;
    ctx.save();
    ctx.fillStyle = "rgba(6, 10, 20, 0.78)";
    ctx.fillRect(0, 0, W, H);

    // Glossy Arcade Summary Card
    const cx = 110, cy = 54, cw = 420, ch = 248;
    ctx.fillStyle = "rgba(15, 23, 42, 0.96)";
    ctx.fillRect(cx, cy, cw, ch);
    ctx.strokeStyle = sum.rank === "S" ? "#fde047" : "#38bdf8";
    ctx.lineWidth = 2.5;
    ctx.strokeRect(cx, cy, cw, ch);

    ctx.textAlign = "center";
    ctx.fillStyle = "#fde047";
    ctx.font = "900 18px monospace";
    ctx.fillText("✦ STAGE CLEAR ✦", W / 2, cy + 30);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11.5px monospace";
    ctx.fillText(sum.title, W / 2, cy + 50);

    ctx.fillStyle = "rgba(255,255,255,0.14)";
    ctx.fillRect(cx + 22, cy + 62, cw - 44, 1);

    // Left stats column
    ctx.textAlign = "left";
    const rows = [
      ["通關時間", `${sum.timeSec} 秒`, "#f8fafc"],
      ["最高連段", `${sum.maxCombo} HIT`, "#38bdf8"],
      ["享用烤肉", `${sum.briskets} 塊`, "#fb923c"],
      ["無傷獎勵", sum.noDamageBonus > 0 ? `+${sum.noDamageBonus} PERFECT!` : "+0", sum.noDamageBonus > 0 ? "#4ade80" : "#94a3b8"],
      ["總分紀錄", `${score}`, "#fde047"],
    ];
    rows.forEach(([label, val, col], idx) => {
      const ry = cy + 88 + idx * 22;
      ctx.fillStyle = "#94a3b8";
      ctx.font = "bold 11px monospace";
      ctx.fillText(label, cx + 28, ry);
      ctx.fillStyle = col;
      ctx.fillText(val, cx + 116, ry);
    });

    // Right Rank Stamp
    const rankColors = { S: "#fde047", A: "#38bdf8", B: "#4ade80", C: "#cbd5e1" };
    ctx.textAlign = "center";
    ctx.fillStyle = "#94a3b8";
    ctx.font = "bold 10px monospace";
    ctx.fillText("CLEAR RANK", cx + cw - 78, cy + 92);
    ctx.shadowColor = rankColors[sum.rank] || "#fde047";
    ctx.shadowBlur = 14;
    ctx.fillStyle = rankColors[sum.rank] || "#fde047";
    ctx.font = "900 62px monospace";
    ctx.fillText(sum.rank, cx + cw - 78, cy + 158);
    ctx.shadowBlur = 0;

    // Bottom Action Buttons
    ctx.fillStyle = "rgba(234, 88, 12, 0.94)";
    ctx.fillRect(144, 248, 168, 36);
    ctx.strokeStyle = "#fde047";
    ctx.lineWidth = 1.8;
    ctx.strokeRect(144, 248, 168, 36);
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 12px monospace";
    ctx.fillText(sum.hasNext ? "▶ 下一關 (ENTER)" : "🏆 結算畫面 (ENTER)", 228, 270);

    ctx.fillStyle = "rgba(30, 41, 59, 0.94)";
    ctx.fillRect(332, 248, 164, 36);
    ctx.strokeStyle = "#94a3b8";
    ctx.lineWidth = 1.6;
    ctx.strokeRect(332, 248, 164, 36);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 11.5px monospace";
    ctx.fillText("🗺️ 回世界地圖", 414, 270);
    ctx.restore();
  }

  function drawCenterBanner(title, sub) {
    ctx.fillStyle = "rgba(10, 14, 23, 0.72)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fcd34d";
    ctx.font = "900 34px monospace";
    ctx.fillText(title, W / 2, H / 2 - 8);
    ctx.fillStyle = "#e2e8f0";
    ctx.font = "bold 14px monospace";
    ctx.fillText(sub, W / 2, H / 2 + 24);
  }

  function drawVictoryOverlay() {
    ctx.fillStyle = "rgba(10, 14, 23, 0.82)";
    ctx.fillRect(0, 0, W, H);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fcd34d";
    ctx.font = "900 30px monospace";
    ctx.fillText("GAME OF THE YEAR!", W / 2, 128);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 15px monospace";
    ctx.fillText(`FINAL SCORE: ${score}`, W / 2, 168);
    ctx.fillStyle = "#38bdf8";
    ctx.font = "13px monospace";
    ctx.fillText(`Oak-Smoked Briskets Eaten: ${brisketEatenCount}`, W / 2, 198);
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 13px monospace";
    ctx.fillText("Press ENTER or Click to play again", W / 2, 248);
  }

  // --- Main Loop ---
  function loop() {
    update();
    render();
    requestAnimationFrame(loop);
  }

  // Initialize title background preview & character button skin
  syncCharButtons();
  player = createPlayer();
  smokers = [createSmoker(470, 236)];
  loop();
})();
