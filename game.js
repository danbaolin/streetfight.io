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
  let selectedChar = "mustache"; // "mustache" | "samurai" | "momo" | "raven" | "shaka" | "alice" | "ironfist" | "nightheron"
  let selectedIsland = 0; // 0 = Jersey Harbour, 1 = Bio-Island Lab, 2 = Taiwan Island (pans camera down!)
  let mapCameraY = 0;
  let tick = 0;
  let cameraX = 0;
  let stageWidth = 1800;
  let shakeTime = 0;
  let shakeMag = 0;
  let hitstop = 0;
  let score = 0;
  let combo = 0;
  let comboTimer = 0;
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
      const order = ["mustache", "samurai", "momo", "raven", "shaka", "alice", "ironfist", "nightheron"];
      const idx = order.indexOf(selectedChar);
      const dir = (code === "ArrowRight" || code === "KeyD") ? 1 : -1;
      selectedChar = order[(idx + dir + order.length) % order.length];
      syncCharButtons();
      if (player) player.charId = selectedChar;
      window.sound.init();
      window.sound.playTone(selectedChar === "nightheron" ? 987 : selectedChar === "ironfist" ? 440 : selectedChar === "alice" ? 1397 : selectedChar === "shaka" ? 1318 : selectedChar === "raven" ? 1175 : selectedChar === "momo" ? 1046 : selectedChar === "samurai" ? 880 : 520, 0.06, "triangle", 0.08);
    }
    if (gameState === STATE.WORLD_MAP) {
      if (code === "ArrowDown" || code === "KeyS") {
        selectedIsland = 2; // Pan camera DOWN to Taiwan Island!
        window.sound.init();
        window.sound.playTone(784, 0.07, "triangle", 0.09);
      } else if (code === "ArrowUp" || code === "KeyW") {
        if (selectedIsland === 2) selectedIsland = 0; // Pan camera UP to Island 1!
        window.sound.init();
        window.sound.playTone(520, 0.07, "triangle", 0.09);
      } else if (code === "ArrowLeft" || code === "KeyA" || code === "ArrowRight" || code === "KeyD") {
        const order = [0, 2, 1]; // Left -> Center(Taiwan) -> Right
        const idx = order.indexOf(selectedIsland);
        const dir = (code === "ArrowRight" || code === "KeyD") ? 1 : -1;
        selectedIsland = order[(idx + dir + 3) % 3];
        window.sound.init();
        window.sound.playTone(selectedIsland === 2 ? 784 : selectedIsland === 1 ? 660 : 440, 0.07, "triangle", 0.09);
      }
    }
    if ((code === "Enter" || code === "Space") && gameState === STATE.WORLD_MAP) {
      window.sound.init();
      window.sound.startBgm();
      startStage(selectedIsland === 0 ? 1 : selectedIsland === 1 ? 3 : 7);
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
      const order = ["mustache", "samurai", "momo", "raven", "shaka", "alice", "ironfist", "nightheron"];
      const idx = order.indexOf(selectedChar);
      const toneMap = { mustache: 520, samurai: 880, momo: 1046, raven: 1175, shaka: 1318, alice: 1397, ironfist: 440, nightheron: 987 };

      // Left arrow button (◀) -> previous fighter
      if (cx >= 52 && cx <= 128 && cy >= 146 && cy <= 244) {
        selectedChar = order[(idx - 1 + order.length) % order.length];
        syncCharButtons();
        if (player) player.charId = selectedChar;
        window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
        return;
      }
      // Right arrow button (▶) -> next fighter
      if (cx >= 512 && cx <= 588 && cy >= 146 && cy <= 244) {
        selectedChar = order[(idx + 1) % order.length];
        syncCharButtons();
        if (player) player.charId = selectedChar;
        window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
        return;
      }
      // Pagination dots click
      if (cy >= 278 && cy <= 302) {
        const dotStartX = W / 2 - ((order.length - 1) * 18) / 2;
        for (let i = 0; i < order.length; i++) {
          if (Math.abs(cx - (dotStartX + i * 18)) <= 9) {
            selectedChar = order[i];
            syncCharButtons();
            if (player) player.charId = selectedChar;
            window.sound.playTone(toneMap[selectedChar] || 660, 0.06, "triangle", 0.08);
            return;
          }
        }
      }
      window.sound.startBgm();
      openWorldMap();
    } else if (gameState === STATE.WORLD_MAP) {
      const rect = canvas.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * W;
      const cy = ((e.clientY - rect.top) / rect.height) * H;
      if (cy >= 46 && cy <= 355) {
        if (cy >= 286) {
          // Bottom cards: First click selects & smoothly pans camera; clicking active card deploys!
          const clicked = cx < W / 3 ? 0 : cx < (W * 2) / 3 ? 2 : 1;
          if (selectedIsland !== clicked) {
            selectedIsland = clicked;
            window.sound.playTone(clicked === 2 ? 784 : clicked === 1 ? 660 : 440, 0.07, "triangle", 0.09);
            return;
          }
          window.sound.startBgm();
          startStage(clicked === 0 ? 1 : clicked === 1 ? 3 : 7);
        } else if (selectedIsland === 2 && mapCameraY > 180) {
          // Currently panned down on Taiwan Island -> click anywhere on Taiwan deploys!
          window.sound.startBgm();
          startStage(7);
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
  const btnStage1 = document.getElementById("btn-stage-1");
  const btnStage2 = document.getElementById("btn-stage-2");
  const btnStageAirport = document.getElementById("btn-stage-airport");
  const btnStageDadaocheng = document.getElementById("btn-stage-dadaocheng");
  const btnStageTrain = document.getElementById("btn-stage-train");
  const wtStageBtns = Array.from(document.querySelectorAll(".wt-stage-btn"));
  const btnMap = document.getElementById("btn-map");
  const btnMute = document.getElementById("btn-mute");
  const btnBgm = document.getElementById("btn-bgm");
  const btnFullscreen = document.getElementById("btn-fullscreen");
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
    document.body.classList.toggle("char-mustache", selectedChar === "mustache");
    document.body.classList.toggle("char-samurai", selectedChar === "samurai");
    document.body.classList.toggle("char-momo", selectedChar === "momo");
    document.body.classList.toggle("char-raven", selectedChar === "raven");
    document.body.classList.toggle("char-shaka", selectedChar === "shaka");
    document.body.classList.toggle("char-alice", selectedChar === "alice");
    document.body.classList.toggle("char-ironfist", selectedChar === "ironfist");
    document.body.classList.toggle("char-nightheron", selectedChar === "nightheron");
    const skillLabelEl = document.getElementById("tbtn-skill-label");
    if (skillLabelEl) {
      skillLabelEl.textContent =
        selectedChar === "nightheron"
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
          charId === "nightheron"
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
    selectedIsland = 0;
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

  // --- Mobile Touch Controls (Virtual Joystick + Multi-Touch Action Buttons) ---
  let touchAtkHeld = false;
  const btnTouchToggle = document.getElementById("btn-touch-toggle");
  const joyZone = document.getElementById("joy-zone");
  const joyKnob = document.getElementById("joy-knob");
  const tbtnAtk = document.getElementById("tbtn-atk");
  const tbtnJump = document.getElementById("tbtn-jump");
  const tbtnUlt = document.getElementById("tbtn-ult");
  const tbtnSkillMask = document.getElementById("tbtn-skill-mask");
  const tbtnSkillNum = document.getElementById("tbtn-skill-num");

  if (btnTouchToggle) {
    btnTouchToggle.addEventListener("click", () => {
      const enabled = document.body.classList.toggle("touch-enabled");
      btnTouchToggle.classList.toggle("active", enabled);
    });
  }

  if (joyZone && joyKnob) {
    let joyPointerId = null;
    const maxRadius = 34;

    const resetJoy = () => {
      joyPointerId = null;
      joyKnob.style.transform = "translate(0px, 0px)";
      keys["ArrowLeft"] = false;
      keys["ArrowRight"] = false;
      keys["ArrowUp"] = false;
      keys["ArrowDown"] = false;
    };

    const updateJoy = (clientX, clientY) => {
      const rect = joyZone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = clientX - cx;
      let dy = clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist > maxRadius) {
        dx = (dx / dist) * maxRadius;
        dy = (dy / dist) * maxRadius;
      }
      joyKnob.style.transform = `translate(${dx}px, ${dy}px)`;
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
    score += e.type === "genex_boss" ? 5000 : e.type === "boss" ? 2000 : e.type === "miniboss" ? 1000 : e.type === "heavy" || e.type === "mutant_brute" ? 350 : 180;
    window.sound.enemyKo();

    // Defeating a Mini-Boss unlocks/upgrades the Ultimate Move (Lv.1 -> Lv.2 -> Lv.3 Dual-Katana!)
    if (e.type === "miniboss") {
      unlockedUltLevel = Math.min(3, unlockedUltLevel + 1);
      player.hp = Math.min(player.maxHp, player.hp + 35);
      player.reloadGauge = 100;
      window.sound.skillUnlock();
      triggerShake(18, 5);
      spawnParticles(e.x, e.y, 34, unlockedUltLevel >= 3 ? "#c084fc" : "#fcd34d", 26, 4.5, 32);
      unlockBannerTimer = 250;
      if (unlockedUltLevel === 1) {
        unlockBannerTitle = "★ Lv.1 新招式解鎖！NEW MOVE UNLOCKED! ★";
        unlockBannerSub = "大絕範圍加大！鬍子超連擊 ／ 武士12秒持續亂舞！(已滿能量，快按 R!)";
        showSpeech(
          isSamurai() ? "Lv.1 解鎖！12秒大範圍持續亂舞！" : "新招式解鎖！超大範圍超連擊！",
          210
        );
      } else if (unlockedUltLevel === 2) {
        unlockBannerTitle = "★★ Lv.2 奧義強化！SUPER ULTIMATE! ★★";
        unlockBannerSub = "威力再提升！武士14秒超廣域亂舞（再打倒第3隻小魔王解鎖雙刀模式！）";
        showSpeech(
          isSamurai() ? "Lv.2 強化！再打贏第3隻小魔王就能解鎖雙刀模式！" : "奧義強化！超廣域 4 連擊！",
          210
        );
      } else {
        unlockBannerTitle = "★★★ 終極解鎖！《雙刀模式・交叉突進》★★★";
        unlockBannerSub = "街頭武士召喚紫柄第二把武士刀！開大按攻擊發動【X 交叉突進】！(快按 R!)";
        showSpeech(
          isSamurai() ? "雙刀模式解鎖！深藍＋紫柄武士刀【交叉突進】！" : "終極奧義 MAX！全開突破！",
          230
        );
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
    hitstop = 0;
    shakeTime = 0;
    goArrowTimer = 0;
    window.sound.isBuff = false;

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
        createSmoker(Math.round(stageWidth * 0.36), 236),
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
    player.reloadGauge = 0;
    // Unlocked New Move extends Ultimate duration to 12s (720f) or 14s (840f) — guaranteed > 10s!
    player.buffMax = unlockedUltLevel >= 2 ? 840 : unlockedUltLevel >= 1 ? 720 : 600;
    player.buffTimer = player.buffMax;
    player.invulnTimer = 80;
    gameState = STATE.RELOAD_CUTSCENE;
    reloadCutsceneTimer = 72;
    if (isNightHeronHero()) {
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

  function spawnSwordWave(x, y, z, facing, color = "#38bdf8", lifesteal = false) {
    swordWaves.push({
      x,
      y,
      z,
      vx: facing * 6.8,
      facing,
      color,
      lifesteal,
      life: 28,
      maxLife: 28,
      hitIds: new Set(),
    });
  }

  // --- Update ---
  function update() {
    tick++;

    if (shakeTime > 0) shakeTime--;
    if (hitstop > 0) {
      hitstop--;
      clearJustPressed();
      return;
    }

    if (gameState === STATE.RELOAD_CUTSCENE) {
      reloadCutsceneTimer--;
      if (isNightHeronHero()) {
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
      updateFloatingTexts();
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
              x: p.x,
              y: p.y,
              z: p.z + 32,
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
          isNightHeronHero() ? "雨幕消散" : isIronFistHero() ? "蒸氣收斂" : isAlice() ? "言靈領域消散" : isShaka() ? "千手收斂" : isRaven() ? "雙槍收鞘" : isMomo() ? "變回普通型態" : isSamurai() ? "劍氣消散" : "RELOAD READY TO CHARGE",
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
      } else {
        p.walkFrame = 0;
      }
    }

    // Small Skill (Replaces Jump on K / X / #tbtn-jump)
    if ((justPressed["KeyK"] || justPressed["KeyX"]) && p.skillCd <= 0 && p.skillActiveTimer <= 0 && p.hurtTimer <= 0) {
      if (isNightHeronHero()) {
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
      if (p.skillType === "ground_slam") {
        // Slight forward arc while airborne, then heavy seismic slam!
        if (p.z > 0) {
          p.x += p.facing * 1.8;
        }
        if (p.z <= 0 && !p.skillImpactDone && p.skillActiveTimer < 30) {
          p.skillImpactDone = true;
          p.skillActiveTimer = Math.min(p.skillActiveTimer, 6);
          window.sound.groundSlam();
          triggerShake(12, 5);
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
    if ((justPressed["KeyJ"] || justPressed["KeyZ"] || justPressed["Space"] || touchAtkHeld) && p.attackTimer <= ((samurai || momo || raven || shaka || alice || ironfist || nightheron) && isBuff() ? 5 : 3) && p.hurtTimer <= 0) {
      p.attackTimer = nightheron ? (isBuff() ? 11 : 13) : ironfist ? (isBuff() ? 12 : 14) : alice ? (isBuff() ? 10 : 12) : shaka ? (isBuff() ? 13 : 15) : raven ? (isBuff() ? 10 : 12) : momo ? (isBuff() ? 12 : 16) : samurai ? (isBuff() ? 11 : 14) : (isBuff() ? 15 : 14);
      p.attackType = (p.attackType + 1) % 3;
      p.attackHitDone = false;
      if (nightheron) {
        if (isBuff()) {
          window.sound.waterSweep();
          spawnSwordWave(p.x + p.facing * 36, p.y, p.z + 28, p.facing, "#38bdf8", false);
          if (unlockedUltLevel >= 1) {
            spawnSwordWave(p.x + p.facing * 26, p.y - 8, p.z + 34, p.facing, "#e0f2fe", false);
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
            spawnSwordWave(p.x + p.facing * 32, p.y, 12, p.facing, "#38bdf8", false);
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
          spawnSwordWave(p.x + p.facing * 36, p.y, p.z + 30, p.facing, "#f59e0b", false);
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
            // Signature lunging white-bandage 3rd punch!
            p.x += p.facing * 14;
            spawnParticles(p.x + p.facing * 28, p.y, 32, "#f8fafc", 10, 3.2, 14);
          }
        }
      } else if (alice) {
        const heavy = p.attackType === 2 || isBuff();
        window.sound.alicePunch(heavy);
        if (isBuff()) {
          // Crimson-Gold Soundwave Punch Pressure!
          spawnSlashEffect(p.x + p.facing * 32, p.y, p.z + 32, p.facing, 0, 52, "#e11d48", 10);
          spawnSwordWave(p.x + p.facing * 34, p.y, p.z + 30, p.facing, "#e11d48", false);
        } else if (p.attackType === 2) {
          spawnSlashEffect(p.x + p.facing * 26, p.y, p.z + 30, p.facing, 0, 44, "#d4af37", 10);
          spawnParticles(p.x + p.facing * 32, p.y, p.z + 30, "#e11d48", 10, 3.0, 14);
        }
      } else if (shaka) {
        if (p.attackType === 2) {
          window.sound.shakaClap();
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
              x: p.x + p.facing * (24 + b * 10),
              y: p.y + (b === 0 ? -5 : 5),
              z: p.z + (b === 0 ? 36 : 30),
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
          spawnParticles(p.x + p.facing * 30, p.y, p.z + 34, "#fcd34d", 6, 3.0, 10);
          // Lv.2+: Every 2nd volley also unleashes twin angled Kunai!
          if (unlockedUltLevel >= 2 && p.attackType === 2) {
            window.sound.throwingKnife();
            for (const vyOff of [-2.4, 2.4]) {
              skillEffects.push({
                type: "raven_proj",
                kind: "knife",
                x: p.x + p.facing * 22,
                y: p.y,
                z: p.z + 32,
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
          // 3rd Hit Finisher: Twin Thigh Throwing Knives (with Poison!)
          p.attackHitDone = true;
          window.sound.throwingKnife();
          for (const vyOff of [-1.2, 1.2]) {
            skillEffects.push({
              type: "raven_proj",
              kind: "knife",
              x: p.x + p.facing * 20,
              y: p.y + vyOff * 3,
              z: p.z + 32,
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
          spawnSlashEffect(p.x + p.facing * 20, p.y, p.z + 32, p.facing, 0, 36, "#a855f7", 9);
        } else {
          // 1st & 2nd Hit: Fast Assassin Dagger Slashes!
          window.sound.daggerSlash();
          const ang = p.attackType === 0 ? -0.25 : 0.25;
          spawnSlashEffect(p.x + p.facing * 22, p.y, p.z + 32, p.facing, ang, 40, p.attackType === 0 ? "#e2e8f0" : "#d4af37", 9);
        }
      } else if (momo) {
        if (isBuff()) {
          // VAMPIRE LONG-CLAW SLASH! (3 parallel crimson fingernail rake arcs!)
          window.sound.vampireClaw();
          const clawR = unlockedUltLevel >= 1 ? 62 : 48;
          spawnSlashEffect(p.x + p.facing * 24, p.y - 6, p.z + 36, p.facing, -0.22, clawR, "#ef4444", 11);
          spawnSlashEffect(p.x + p.facing * 28, p.y, p.z + 30, p.facing, 0, clawR + 4, "#fb7185", 11);
          spawnSlashEffect(p.x + p.facing * 24, p.y + 6, p.z + 24, p.facing, 0.22, clawR, "#dc2626", 11);
          if (unlockedUltLevel >= 1) {
            spawnSwordWave(p.x + p.facing * 32, p.y, p.z + 28, p.facing, "#ef4444", true);
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
    // Unlocked New Move massively expands Ultimate AoE reach!
    const ultRangeBoostX = buff && unlockedUltLevel >= 1 ? (unlockedUltLevel >= 2 ? 54 : 38) : 0;
    const ultRangeBoostY = buff && unlockedUltLevel >= 1 ? (unlockedUltLevel >= 2 ? 22 : 16) : 0;
    const reachX = (nightheron ? (buff ? 104 : 76) : ironfist ? (buff ? 102 : 70) : alice ? (buff ? 92 : 66) : shaka ? (buff ? 168 : 118) : raven ? 60 : momo ? (buff ? 84 : 88) : samurai ? (buff ? 84 : 66) : (buff ? 68 : 48)) + ultRangeBoostX;
    const reachY = (nightheron ? (buff ? 40 : 30) : ironfist ? (buff ? 40 : 30) : alice ? (buff ? 38 : 28) : shaka ? (buff ? 52 : 36) : raven ? 28 : momo ? (buff ? 36 : 32) : samurai ? (buff ? 34 : 28) : (buff ? 30 : 24)) + ultRangeBoostY;
    let hitAnything = false;

    // Trigger Mustache's automatic rapid multi-hit punch combo (or Alice Lv.2 Brass Knuckle Flurry!)
    if ((!samurai && !momo && !raven && !shaka && !alice && !ironfist && !nightheron && buff && unlockedUltLevel >= 1) || (alice && buff && unlockedUltLevel >= 2)) {
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
          spawnParticles(e.x, e.y, 28, w.color || "#38bdf8", 7, 3, 14);
          spawnText(w.lifesteal ? "血爪波 14" : "劍氣 14", e.x, e.y - 52, w.color || "#38bdf8", 0.95);
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
      if (fx.type === "shockwave") {
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
          for (const e of enemies) {
            if (e.dead) continue;
            if (Math.abs(e.x - fx.x) < 72 && Math.abs(e.y - fx.y) < 38) {
              const dmg = fx.isBlood ? 8 : 5;
              dealEnemyDamage(e, dmg);
              e.hurtTimer = Math.max(e.hurtTimer, 18);
              combo++;
              comboTimer = 135;
              score += dmg * 10;
              spawnParticles(e.x, e.y, 26, fx.isBlood ? "#ef4444" : "#fb923c", 4, 2.0, 14);
              spawnText(fx.isBlood ? `血霧 ${dmg}` : `防狼霧 ${dmg}`, e.x, e.y - 52, fx.isBlood ? "#fb7185" : "#fdba74", 0.9);
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
      if (wave.list.some((i) => i.type === "wt_boss")) {
        const wt = window.WorldTour ? window.WorldTour.getStage(currentStage) : null;
        spawnText((wt && wt.bossBanner) || "STAGE BOSS 登場！", cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "boss_train_mechanic")) {
        spawnText("山線特快 BOSS「緩衝拳機兵」啟動！全車警戒！", cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "boss_89_king")) {
        spawnText("大稻埕 8+9 角頭老大登場！支援輸贏啦！", cameraLockX + W / 2, 128, "#f59e0b", 1.2);
      } else if (wave.list.some((i) => i.type === "genex_boss")) {
        spawnText("基因研究者 DR. GENEX 降臨!", cameraLockX + W / 2, 128, "#ef4444", 1.3);
      } else if (wave.list.some((i) => i.type === "boss")) {
        spawnText("FINAL BOSS FIGHT!", cameraLockX + W / 2, 130, "#ef4444", 1.4);
      } else if (wave.list.some((i) => i.type === "miniboss")) {
        spawnText("MINI-BOSS APPEARS!", cameraLockX + W / 2, 130, "#fbbf24", 1.35);
      }
    }

    if (wave.spawned && !wave.cleared) {
      const alive = enemies.some((e) => !e.dead);
      if (!alive) {
        wave.cleared = true;
        cameraLocked = false;
        activeWaveIndex++;
        if (activeWaveIndex >= waves.length) {
          // Stage Clear!
          gameState = STATE.STAGE_CLEAR;
          stageClearTimer = 150;
          window.sound.stageClear();
          const clearLabels = {
            1: "HARBOUR CLEARED!",
            2: "RESTROOM CLEARED! 前往機場《末班機》!",
            6: "《末班機》突破！解鎖島嶼世界地圖!",
            3: "研究所第一層突破！前往地下一層!",
            4: "地下一層突破！逃離沼氣前往第三層!",
            5: "基因研究者擊破！生化島解放!",
            7: "大稻埕角頭擊破！迪化街恢復和平!",
          };
          spawnText(
            clearLabels[currentStage] || "STAGE CLEARED!",
            cameraX + W / 2,
            150,
            "#fcd34d",
            1.25
          );
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
    drawFloatingTexts();

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
    if (gameState === STATE.PAUSED) drawCenterBanner("PAUSED", "Press P to resume");
    if (gameState === STATE.GAME_OVER) drawCenterBanner("GAME OVER", "Press ENTER or Click to retry");
    if (gameState === STATE.VICTORY) drawVictoryOverlay();

    ctx.restore();
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
    // Smooth vertical camera pan: 0 for Island 1 / Bio-Island, 326 when selecting Taiwan Island below!
    const targetMapY = selectedIsland === 2 ? 326 : 0;
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
    // Route 2: Island 1 -> South down to BIG Taiwan Island!
    ctx.moveTo(166, 265);
    ctx.quadraticCurveTo(156, 340, 174, 412);
    ctx.stroke();

    // Glowing Map Pins anchored on the 3 full-size islands in world-map space!
    const pins = [
      { idx: 0, x: 175, y: 138, color: "#f59e0b", label: "海港＆機場" },
      { idx: 1, x: 486, y: 142, color: "#4ade80", label: "生化島研究所" },
      { idx: 2, x: 174, y: 454, color: "#ef4444", label: "台北・大稻埕 (台灣島)" },
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
        ctx.fillStyle = "rgba(10, 15, 28, 0.85)";
        ctx.fillRect(pin.x - 66, py - 32, 132, 18);
        ctx.strokeStyle = pin.color;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(pin.x - 66, py - 32, 132, 18);
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9.5px monospace";
        ctx.textAlign = "center";
        ctx.fillText(pin.label, pin.x, py - 20);
      }
    }
    ctx.restore();

    // Compact Sleek Top Header Banner
    ctx.fillStyle = "rgba(10, 14, 23, 0.80)";
    ctx.fillRect(0, 0, W, 42);
    ctx.textAlign = "center";
    ctx.fillStyle = "#fcd34d";
    ctx.font = "900 14px monospace";
    ctx.fillText("🗺️ WORLD MAP — 選擇目標島嶼 (方向鍵或點擊卡片，選台灣島鏡頭往下！)", W / 2, 20);
    ctx.fillStyle = "#86efac";
    ctx.font = "bold 9.5px monospace";
    const inheritText = unlockedUltLevel >= 1 ? "★ 已繼承解鎖大絕招！" : "提示：點一下卡片切換視角，再點一下或按 Enter 立即出發！";
    ctx.fillText(inheritText, W / 2, 35);

    // Three Sleek Bottom Selection Cards
    const islands = [
      {
        idx: 0,
        x: 12,
        y: 288,
        w: 198,
        title: "ISLAND 1: 海港＆機場",
        sub: "海港 ＋ 廁所 ＋ 《末班機》",
        color: "#f59e0b",
      },
      {
        idx: 2,
        x: 221,
        y: 288,
        w: 198,
        title: "🏮 TAIWAN: 台灣島 ↓",
        sub: "大稻埕 8+9 (更多場景預備中)",
        color: "#ef4444",
      },
      {
        idx: 1,
        x: 430,
        y: 288,
        w: 198,
        title: "ISLAND 2: 生化島研究所",
        sub: "3層實驗室 ＋ 基因研究者",
        color: "#4ade80",
      },
    ];

    for (const isl of islands) {
      const active = selectedIsland === isl.idx;
      const cardCenterX = isl.x + isl.w / 2;
      ctx.fillStyle = active ? "rgba(10, 15, 28, 0.92)" : "rgba(10, 15, 28, 0.74)";
      ctx.fillRect(isl.x, isl.y, isl.w, 60);
      ctx.strokeStyle = active ? isl.color : "#475569";
      ctx.lineWidth = active ? 2.5 : 1.5;
      ctx.strokeRect(isl.x, isl.y, isl.w, 60);

      ctx.fillStyle = active ? "#ffffff" : "#cbd5e1";
      ctx.font = "bold 11.5px monospace";
      ctx.fillText(isl.title, cardCenterX, isl.y + 20);
      ctx.fillStyle = active ? isl.color : "#94a3b8";
      ctx.font = "bold 9.5px monospace";
      ctx.fillText(isl.sub, cardCenterX, isl.y + 37);
      if (active) {
        ctx.fillStyle = "#fcd34d";
        ctx.font = "bold 9px monospace";
        ctx.fillText("▶ PRESS ENTER OR CLICK TO DEPLOY!", cardCenterX, isl.y + 53);
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
    if (sx < -60 || sx > W + 60) return;

    // Shadow
    ctx.fillStyle = "rgba(0,0,0,0.3)";
    ctx.fillRect(sx - 20, sy - 4, 42, 8);

    // Legs
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(sx - 14, sy - 18, 4, 18);
    ctx.fillRect(sx + 12, sy - 18, 4, 18);
    // Wheels
    ctx.fillStyle = "#0f172a";
    ctx.fillRect(sx - 16, sy - 5, 8, 8);

    // Chimney stack
    ctx.fillStyle = "#334155";
    ctx.fillRect(sx - 15, sy - 44, 6, 18);

    // Barrel body
    ctx.fillStyle = s.hitFlash > 0 ? "#fcd34d" : "#1e293b";
    ctx.fillRect(sx - 18, sy - 32, 38, 18);
    // Open lid if brisket popped
    if (s.lidOpen) {
      ctx.fillStyle = "#334155";
      ctx.fillRect(sx - 16, sy - 42, 34, 8);
    }
    // Silver handle
    ctx.fillStyle = "#cbd5e1";
    ctx.fillRect(sx - 6, sy - 25, 14, 3);

    // Hint glow if full
    if (s.hasBrisket) {
      ctx.fillStyle = "#fbbf24";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "center";
      ctx.fillText("BBQ", sx + 1, sy - 36);
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

    if (p.charId === "nightheron") {
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

  // --- Night Heron (長髮・夜鷺: Hands-in-Pockets Rain Kicks + Heel Tap Evade / Ultimate: Rain-Sky Blades + Team Combo!) ---
  function drawNightHeronSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = baseScale;

    ctx.fillStyle = "rgba(0,0,0,0.40)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 6.8 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(56, 189, 248, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 34 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(245, 158, 11, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 34 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(225, 29, 72, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 34 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.72)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 42 * scale, 14 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(253, 230, 138, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 34 * scale, 11 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

    // Eclipse Society black-gold aura ring when Dual-Pistol Ultimate is active!
    if (buff) {
      ctx.save();
      ctx.strokeStyle = "rgba(212, 175, 55, 0.85)";
      ctx.lineWidth = 2.2;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 30 * scale, 10 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.strokeStyle = "rgba(168, 85, 247, 0.55)";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.ellipse(sx, sy - 2, 36 * scale, 12 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }

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

      // Only draw fallback procedural cone if the 8-frame spray sprite isn't loaded
      if (attacking && !buff && !window.sprites.get("momo_spray_fire")) {
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

  // --- Mustache Hero (HD 16-bit Pixel Art Normal + BUFF MODE with Little Pocket!) ---
  function drawMustacheSprite(p, sx, sy, buff, baseScale = 1.0) {
    const scale = (buff ? 1.22 : 1.0) * baseScale;

    // Ground shadow
    ctx.fillStyle = "rgba(0,0,0,0.38)";
    ctx.beginPath();
    ctx.ellipse(sx, sy, 21 * scale, 7 * scale, 0, 0, Math.PI * 2);
    ctx.fill();

    const sprite = window.sprites && window.sprites.get(buff ? "hero_mustache_buff" : "hero_mustache_normal");
    if (sprite) {
      const targetH = 82 * scale;
      const targetW = (sprite.width / sprite.height) * targetH;
      const punching = p.attackTimer > 4;
      const reloading = gameState === STATE.RELOAD_CUTSCENE && p.charId === "mustache";
      const walkBob = reloading
        ? Math.abs(Math.sin(reloadCutsceneTimer * 0.5)) * 5
        : p.walkFrame > 0
        ? Math.abs(Math.sin(p.walkFrame)) * 3.5
        : Math.sin(tick * 0.08) * 1.2;
      const lungeX = punching ? (p.attackType === 2 ? 15 : 10) : 0;
      const lean = punching ? 0.08 : p.walkFrame > 0 ? Math.sin(p.walkFrame) * 0.05 : 0;

      ctx.save();
      ctx.translate(sx, sy - p.z - walkBob);
      ctx.scale(p.facing, 1);
      ctx.rotate(lean);
      if (p.hurtTimer > 0 && p.hurtTimer % 4 < 2) {
        ctx.filter = "brightness(2.4)";
      }
      ctx.drawImage(sprite, -targetW * 0.5 + lungeX, -targetH + 3, targetW, targetH);

      // Dynamic Punch Energy Fist Flash!
      if (punching) {
        ctx.fillStyle = buff ? "rgba(56, 189, 248, 0.78)" : "rgba(252, 211, 77, 0.75)";
        ctx.beginPath();
        ctx.arc(targetW * 0.42 + lungeX, -targetH * 0.56, buff ? 16 : 11, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.beginPath();
        ctx.arc(targetW * 0.45 + lungeX, -targetH * 0.56, buff ? 8 : 5, 0, Math.PI * 2);
        ctx.fill();
      }
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
      const alpha = Math.max(0, w.life / w.maxLife);
      const sx = Math.floor(w.x - cameraX);
      const sy = Math.floor(w.y - w.z);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.translate(sx, sy);
      ctx.scale(w.facing, 1);
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
      ctx.restore();
    }

    // --- Small Skill VFX (Ground Slam Shockwave, Shadow Dash Afterimages & Iaido Line, Bat Swarm & Mist) ---
    for (const fx of skillEffects) {
      const alpha = Math.max(0, fx.life / fx.maxLife);
      if (fx.type === "shockwave") {
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
        const wingY = Math.sin(fx.phase) * 5;
        ctx.save();
        ctx.globalAlpha = alpha;
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
        ctx.restore();
      } else if (fx.type === "mist_cloud") {
        const sx = Math.floor(fx.x - cameraX);
        const sy = Math.floor(fx.y);
        const fade = Math.min(1, fx.life / 28);
        ctx.save();
        ctx.globalAlpha = fade * 0.55;
        const grad = ctx.createRadialGradient(sx, sy - 10, 8, sx, sy - 10, 74);
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
        ctx.ellipse(sx, sy - 12, 74, 34, 0, 0, Math.PI * 2);
        ctx.fill();
        // Swirling mist puffs
        for (let m = 0; m < 5; m++) {
          const ang = tick * 0.06 + m * 1.25;
          const mx = sx + Math.cos(ang) * 34;
          const my = sy - 14 + Math.sin(ang) * 14;
          ctx.fillStyle = fx.isShadow
            ? "rgba(148, 163, 184, 0.42)"
            : fx.isBlood
            ? "rgba(251, 113, 133, 0.45)"
            : "rgba(253, 186, 116, 0.45)";
          ctx.beginPath();
          ctx.arc(mx, my, 12 + Math.sin(ang * 2) * 3, 0, Math.PI * 2);
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
          ctx.scale(fx.facing, 1);
          // Sleek Eclipse golden-white piercing bullet tracer!
          ctx.fillStyle = fx.poison ? "#a855f7" : "#d4af37";
          ctx.fillRect(-16, -2.5, 22, 5);
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(-4, -1.2, 12, 2.4);
        } else if (fx.kind === "shuriken") {
          ctx.rotate(tick * 0.55);
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
        } else {
          // Throwing Knife with violet poison glow!
          ctx.scale(fx.facing, 1);
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
        ctx.restore();
      } else if (fx.type === "eclipse_x_finisher") {
        // Lv.3 Finisher: Full-Screen Golden X-Cross Snipe beams!
        const cx = Math.floor(fx.x - cameraX);
        const cy = Math.floor(fx.y - 44);
        ctx.save();
        ctx.globalAlpha = Math.min(1, alpha * 1.4);
        // Subtle dark eclipse flash vignette
        ctx.fillStyle = `rgba(10, 8, 18, ${alpha * 0.35})`;
        ctx.fillRect(0, 0, W, H);
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

  // --- Ultimate Cutscene Overlay ---
  function drawReloadLightningOverlay() {
    ctx.fillStyle = "rgba(15, 23, 42, 0.38)";
    ctx.fillRect(0, 0, W, H);

    const sx = player.x - cameraX;
    const sy = player.y - 36;

    if (isNightHeronHero()) {
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 36 + i * 24 + Math.sin(tick * 0.28 + i) * 7;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#7dd3fc";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("👞 末班起飛! 雨夜天翔水刃全開!", W / 2, 74);
    } else if (isIronFistHero()) {
      ctx.strokeStyle = "#f59e0b";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 36 + i * 24 + Math.sin(tick * 0.28 + i) * 7;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("🥊 末班起飛! 崩山轟拳解放!", W / 2, 74);
    } else if (isAlice()) {
      // Alice Crimson-Gold Linguistic Domain Cutscene Rings!
      ctx.strokeStyle = "#e11d48";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 36 + i * 24 + Math.sin(tick * 0.28 + i) * 7;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.36, 0, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fb7185";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("🌹 絕對契約! 言靈領域展開!", W / 2, 74);
    } else if (isShaka()) {
      // Shaka Divine Golden Dharma Wheel & Thousand-Hand Awakening Rings!
      ctx.strokeStyle = "#fde68a";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 38 + i * 24 + Math.sin(tick * 0.25 + i) * 6;
        ctx.beginPath();
        ctx.arc(sx, sy - 6, r, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fde68a";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("☸ 千手觀音! 萬臂群控覺醒!", W / 2, 74);
    } else if (isRaven()) {
      // Raven Eclipse Society Golden-Obsidian Dual-Pistol Awakening Rings!
      ctx.strokeStyle = "#d4af37";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 34 + i * 22 + Math.sin(tick * 0.25 + i) * 6;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.38, (tick * 0.08 + i) * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("🐦‍⬛ 日蝕處決! ECLIPSE AKIMBO!", W / 2, 74);
    } else if (isMomo()) {
      // Crimson Vampire Awakening Bat-Swarm Rings!
      ctx.strokeStyle = "#ef4444";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 34 + i * 22 + Math.sin(tick * 0.25 + i) * 6;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.38, -(tick * 0.08 + i) * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = "#fb7185";
      ctx.font = "900 24px monospace";
      ctx.textAlign = "center";
      ctx.fillText("🦇 吸血鬼覺醒! VAMPIRE MODE!", W / 2, 74);
    } else if (isSamurai()) {
      // Swirling sword-qi rings & dramatic blade-storm lines!
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 2.5;
      for (let i = 0; i < 3; i++) {
        const r = 34 + i * 22 + Math.sin(tick * 0.25 + i) * 6;
        ctx.beginPath();
        ctx.ellipse(sx, sy + 6, r, r * 0.38, (tick * 0.08 + i) * 0.4, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.fillStyle = hasSamuraiDualMode() ? "#c084fc" : "#38bdf8";
      ctx.font = "900 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText(hasSamuraiDualMode() ? "⚔️ 雙刀模式・交叉突進! DUAL BLADE!" : "武士刀亂舞! BLADE STORM!", W / 2, 74);
    } else {
      // Jagged electric arcs shooting into Mustache Hero!
      ctx.strokeStyle = "#38bdf8";
      ctx.lineWidth = 3;
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2 + tick * 0.2;
        ctx.beginPath();
        ctx.moveTo(sx, sy);
        let cx = sx;
        let cy = sy;
        for (let step = 1; step <= 4; step++) {
          cx += Math.cos(angle) * 28 + (Math.random() - 0.5) * 18;
          cy += Math.sin(angle) * 24 + (Math.random() - 0.5) * 18;
          ctx.lineTo(cx, cy);
        }
        ctx.stroke();
      }

      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 22px monospace";
      ctx.textAlign = "center";
      ctx.fillText("ARM RELOAD!", W / 2, 74);
    }
  }

  // --- Comic Speech Bubble (For Brisket quote!) ---
  function drawSpeechBubble(p) {
    const text = p.speechText;
    ctx.font = "bold 11px monospace";
    const tw = Math.min(260, ctx.measureText(text).width + 20);
    const bx = Math.max(12, Math.min(W - tw - 12, p.x - cameraX - tw / 2));
    const by = Math.max(54, p.y - (isBuff() ? 116 : 96) - p.z);

    ctx.fillStyle = "#ffffff";
    ctx.strokeStyle = "#0f172a";
    ctx.lineWidth = 2;
    ctx.fillRect(bx, by, tw, 26);
    ctx.strokeRect(bx, by, tw, 26);

    // Little tail
    const tx = Math.max(bx + 12, Math.min(bx + tw - 12, p.x - cameraX));
    ctx.beginPath();
    ctx.moveTo(tx - 5, by + 26);
    ctx.lineTo(tx, by + 33);
    ctx.lineTo(tx + 5, by + 26);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#0f172a";
    ctx.textAlign = "center";
    ctx.fillText(text, bx + tw / 2, by + 17);
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

  // --- Arcade HUD ---
  function drawHUD() {
    if (!player) return;

    // Top-left panel
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(10, 10, 214, 48);
    ctx.strokeStyle = isBuff() ? "#38bdf8" : "#f59e0b";
    ctx.lineWidth = 2;
    ctx.strokeRect(10, 10, 214, 48);

    // Portrait icon (HD Sprite Headshot for Mustache Hero / Street Samurai / Momo / Raven!)
    const portraitImg = window.sprites && window.sprites.get(
      isNightHeronHero()
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
        : isBuff()
        ? "hero_mustache_buff"
        : "hero_mustache_normal"
    );
    if (portraitImg) {
      ctx.fillStyle = isNightHeronHero() ? "#0c1b36" : isIronFistHero() ? "#0c1e3d" : isAlice() ? "#3f0917" : isShaka() ? "#0b2e33" : isRaven() ? "#111827" : isMomo() ? (isBuff() ? "#450a0a" : "#0b3b3e") : isSamurai() ? "#0b313a" : "#7c2d12";
      ctx.fillRect(16, 16, 36, 36);
      if (isNightHeronHero() || isIronFistHero() || isAlice() || isShaka() || isRaven() || isMomo() || isSamurai()) {
        ctx.drawImage(portraitImg, 0, 0, portraitImg.width, portraitImg.height, 16, 16, 36, 36);
      } else {
        const cropH = portraitImg.height * 0.40;
        const cropW = Math.min(portraitImg.width, cropH);
        const cropX = (portraitImg.width - cropW) / 2;
        ctx.drawImage(portraitImg, cropX, 0, cropW, cropH, 16, 16, 36, 36);
      }
    } else if (isSamurai()) {
      ctx.fillStyle = "#18181b";
      ctx.fillRect(16, 16, 36, 36);
      // Curly brown hair
      ctx.fillStyle = "#3e2723";
      ctx.fillRect(20, 18, 28, 12);
      ctx.fillRect(18, 22, 6, 12);
      ctx.fillRect(44, 22, 6, 12);
      // Face
      ctx.fillStyle = "#f5c29b";
      ctx.fillRect(24, 24, 20, 17);
      // Thick black glasses + blue eyes
      ctx.fillStyle = "#09090b";
      ctx.fillRect(25, 28, 8, 6);
      ctx.fillRect(35, 28, 8, 6);
      ctx.fillRect(33, 30, 2, 2);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(27, 30, 4, 2);
      ctx.fillRect(37, 30, 4, 2);
    } else {
      ctx.fillStyle = "#ea580c";
      ctx.fillRect(16, 16, 36, 36);
      ctx.fillStyle = "#fdba74";
      ctx.fillRect(24, 22, 20, 18);
      ctx.fillStyle = "#1c1917";
      ctx.fillRect(23, 19, 22, 5);
      // Mustache in portrait
      ctx.fillStyle = "#29150b";
      ctx.fillRect(26, 33, 16, 4);
    }

    // HP Bar
    ctx.fillStyle = "#334155";
    ctx.fillRect(58, 18, 156, 12);
    const hpRatio = player.hp / player.maxHp;
    ctx.fillStyle = hpRatio > 0.35 ? "#22c55e" : "#ef4444";
    ctx.fillRect(58, 18, Math.floor(156 * hpRatio), 12);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`HP ${player.hp}/${player.maxHp}`, 62, 27);

    // Reload / Sword Aura / Vampire Bar
    ctx.fillStyle = "#334155";
    ctx.fillRect(58, 36, 156, 12);
    if (isBuff()) {
      const bRatio = player.buffTimer / player.buffMax;
      ctx.fillStyle = isNightHeronHero() ? "#38bdf8" : isIronFistHero() ? "#f59e0b" : isAlice() ? "#e11d48" : isShaka() ? "#fde68a" : isRaven() ? "#d4af37" : isMomo() ? "#f43f5e" : "#38bdf8";
      ctx.fillRect(58, 36, Math.floor(156 * bRatio), 12);
      ctx.fillStyle = isAlice() ? "#fff" : "#0f172a";
      ctx.fillText(
        isNightHeronHero()
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
          : "BUFF MODE! +POCKET",
        62,
        45
      );
    } else {
      const rRatio = player.reloadGauge / 100;
      ctx.fillStyle = rRatio >= 1 ? (Math.floor(tick / 10) % 2 === 0 ? "#fcd34d" : "#f59e0b") : "#eab308";
      ctx.fillRect(58, 36, Math.floor(156 * rRatio), 12);
      ctx.fillStyle = "#0f172a";
      ctx.fillText(
        rRatio >= 1
          ? (isNightHeronHero() ? "雨夜天翔 READY! [R]" : isIronFistHero() ? "崩山轟拳 READY! [R]" : isAlice() ? "言靈領域 READY! [R]" : isShaka() ? "萬臂群控 READY! [R]" : isRaven() ? "日蝕雙槍 READY! [R]" : isMomo() ? "吸血鬼變身 READY! [R]" : isSamurai() ? "武士刀亂舞 READY! [R]" : "RELOAD READY! [R]")
          : (isNightHeronHero() ? `RAIN ${player.reloadGauge}%` : isIronFistHero() ? `STEAM ${player.reloadGauge}%` : isAlice() ? `VOICE ${player.reloadGauge}%` : isShaka() ? `DHARMA ${player.reloadGauge}%` : isRaven() ? `ECLIPSE ${player.reloadGauge}%` : isMomo() ? `BLOOD ${player.reloadGauge}%` : isSamurai() ? `SWORD QI ${player.reloadGauge}%` : `RELOAD ${player.reloadGauge}%`),
        62,
        45
      );
    }

    // Small Skill Cooldown Pill (Right next to Top-Left HUD, shows [K] skill name & CD)
    const skillName = isNightHeronHero() ? "雨燕迴避" : isIronFistHero() ? "鐵山靠" : isAlice() ? "言靈支配" : isShaka() ? "金剛鎖" : isRaven() ? "煙霧鉤爪" : isSamurai() ? "瞬步居合" : isMomo() ? "血蝠瞬閃" : "重裝震地";
    const cdReady = player.skillCd <= 0;
    const cdPct = cdReady ? 1 : 1 - player.skillCd / (player.skillMaxCd || 180);
    ctx.fillStyle = "rgba(15, 23, 42, 0.80)";
    ctx.fillRect(230, 10, 122, 48);
    ctx.strokeStyle = cdReady ? "#38bdf8" : "#475569";
    ctx.lineWidth = 1.5;
    ctx.strokeRect(230, 10, 122, 48);
    ctx.fillStyle = cdReady ? "#7dd3fc" : "#94a3b8";
    ctx.font = "bold 9px monospace";
    ctx.textAlign = "left";
    ctx.fillText(`[K] ${skillName}`, 237, 25);
    ctx.fillStyle = "#334155";
    ctx.fillRect(237, 33, 108, 13);
    ctx.fillStyle = cdReady ? "#38bdf8" : "#64748b";
    ctx.fillRect(237, 33, Math.floor(108 * cdPct), 13);
    ctx.fillStyle = cdReady ? "#0f172a" : "#f8fafc";
    ctx.font = "bold 9px monospace";
    ctx.fillText(cdReady ? "READY!" : `CD ${(player.skillCd / 60).toFixed(1)}s`, 243, 43);

    // Score & Stage (top-right)
    ctx.fillStyle = "rgba(15, 23, 42, 0.78)";
    ctx.fillRect(W - 186, 10, 176, 40);
    ctx.strokeStyle = "#334155";
    ctx.strokeRect(W - 186, 10, 176, 40);
    ctx.fillStyle = "#fcd34d";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`SCORE ${String(score).padStart(6, "0")}`, W - 18, 27);
    ctx.fillStyle = "#94a3b8";
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
    ctx.fillText((wtHudStage && wtHudStage.hudName) || stageNames[currentStage] || "STAGE", W - 18, 42);

    // Combo counter
    if (combo >= 2) {
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 18px monospace";
      ctx.textAlign = "right";
      ctx.fillText(`${combo} HIT COMBO!`, W - 18, 76);
    }

    // GO! Arrow after wave clear
    if (goArrowTimer > 0 && Math.floor(tick / 12) % 2 === 0) {
      ctx.fillStyle = "#fcd34d";
      ctx.font = "900 22px monospace";
      ctx.textAlign = "right";
      ctx.fillText("GO! >>>", W - 20, 118);
    }

    // Unlocked New Move Badge under HUD
    if (unlockedUltLevel >= 1) {
      ctx.fillStyle = "rgba(15, 23, 42, 0.82)";
      ctx.fillRect(10, 62, 214, 18);
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(10, 62, 214, 18);
      ctx.fillStyle = "#fcd34d";
      ctx.font = "bold 9px monospace";
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
      ctx.fillText(badgeLabel, 16, 74);
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
    ctx.fillStyle = "rgba(10, 14, 23, 0.80)";
    ctx.fillRect(0, 0, W, H);

    ctx.textAlign = "center";
    ctx.fillStyle = "#f59e0b";
    ctx.font = "bold 11px monospace";
    ctx.fillText("TEST EDITION  •  SELECT YOUR FIGHTER (← / →)", W / 2, 46);

    ctx.fillStyle = "#ffffff";
    ctx.font = "900 30px monospace";
    ctx.fillText("PROTOCOL", W / 2, 82);

    // Single-Fighter Spotlight Carousel (1 hero at a time with ◀ / ▶ arrow buttons!)
    const roster = [
      {
        id: "mustache",
        title: "MUSTACHE HERO",
        role: "重裝近戰力量型",
        atk: "J  重拳三連擊",
        skill: "K  重裝震地槌 (360° 擊飛)",
        ult: "R  手臂上膛・爆氣連打",
        color: "#f59e0b",
      },
      {
        id: "samurai",
        title: "STREET SAMURAI",
        role: "高機動居合劍客",
        atk: "J  武士刀三連橫砍",
        skill: "K  殘影瞬步・居合斬",
        ult: "R  劍氣亂舞 / Lv.3 雙刀突進",
        color: "#38bdf8",
      },
      {
        id: "momo",
        title: "MOMO 🦇",
        role: "中距控場・吸血續戰",
        atk: "J  防狼噴霧 (長硬直控場)",
        skill: "K  血蝠瞬閃 (留霧 / 血霧吸血)",
        ult: "R  吸血鬼覺醒・長爪吸血",
        color: "#f43f5e",
      },
      {
        id: "raven",
        title: "RAVEN 🐦‍⬛",
        role: "暗影會・遠近毒刃刺客",
        atk: "J  暗殺短刃 + 雙毒飛刀",
        skill: "K  煙霧鉤爪 (背刺 / 影遁)",
        ult: "R  日蝕雙槍 / Lv.3 交叉處決",
        color: "#d4af37",
      },
      {
        id: "shaka",
        title: "釋迦 SHAKA ☸️",
        role: "超長距靈臂・束縛群控",
        atk: "J  靈臂延伸・三連掌聚敵",
        skill: "K  金剛鎖 (1.5秒定身 / 護障)",
        ult: "R  千手萬臂群控 / 金光天墜",
        color: "#fde68a",
      },
      {
        id: "alice",
        title: "ALICE 愛麗絲 🌹",
        role: "言靈支配・破甲指虎格鬥",
        atk: "J  黃銅指虎・破甲薔薇連打",
        skill: "K  言靈「跪下！」(2.5秒破甲)",
        ult: "R  絕對契約・言靈領域 / 彈指臣服",
        color: "#e11d48",
      },
      {
        id: "ironfist",
        title: "鐵拳 IRON FIST 🥊",
        role: "末班機反派・崩山重拳型",
        atk: "J  白繃帶三段・半拍突進重拳",
        skill: "K  繃帶緊束・鐵山靠衝撞",
        ult: "R  崩山轟拳 / Lv.3 末班起飛合體",
        color: "#f59e0b",
      },
      {
        id: "nightheron",
        title: "夜鷺 NIGHT HERON 👞",
        role: "末班機反派・雨幕插袋腿技",
        atk: "J  插袋連踢・水花月牙低掃",
        skill: "K  鞋跟輕叩・雨燕迴避反踢",
        ult: "R  雨夜天翔 / Lv.3 末班起飛斜踢",
        color: "#38bdf8",
      },
    ];

    const activeIdx = Math.max(0, roster.findIndex((r) => r.id === selectedChar));
    const cur = roster[activeIdx];

    // Left & Right Floating Transparent Arrow Buttons (◀ / ▶)
    const pulse = Math.sin(tick * 0.12) * 2.5;
    const drawArrowBtn = (bx, by, bw, bh, dir) => {
      ctx.save();
      ctx.shadowColor = "rgba(0, 0, 0, 0.85)";
      ctx.shadowBlur = 10;
      ctx.fillStyle = cur.color;
      ctx.font = "900 28px monospace";
      ctx.textAlign = "center";
      ctx.fillText(dir < 0 ? "◀" : "▶", bx + bw / 2 + dir * pulse * 0.6, by + bh / 2 + 10);
      ctx.restore();
    };
    drawArrowBtn(64, 166, 52, 58, -1);
    drawArrowBtn(524, 166, 52, 58, 1);

    // Center Transparent Spotlight Showcase (no opaque card box!)
    const cardX = 136;
    const cardY = 110;
    const cardW = 368;
    const cardH = 162;

    // Subtle colored spotlight pedestal on left half
    const heroX = cardX + 86;
    const heroY = cardY + 136;
    ctx.save();
    ctx.strokeStyle = cur.color;
    ctx.globalAlpha = 0.65;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(heroX, heroY, 44, 12, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();

    const previewDummy = {
      z: 0,
      facing: 1,
      walkFrame: tick * 0.08,
      attackTimer: 0,
      attackType: 0,
      eatTimer: 0,
    };

    if (cur.id === "nightheron") {
      drawNightHeronSprite({ ...previewDummy, charId: "nightheron" }, heroX, heroY, true, 1.12);
    } else if (cur.id === "ironfist") {
      drawIronFistSprite({ ...previewDummy, charId: "ironfist" }, heroX, heroY, true, 1.12);
    } else if (cur.id === "alice") {
      drawAliceSprite({ ...previewDummy, charId: "alice" }, heroX, heroY, true, 1.12);
    } else if (cur.id === "shaka") {
      drawShakaSprite({ ...previewDummy, charId: "shaka" }, heroX, heroY, false, 1.05);
    } else if (cur.id === "raven") {
      drawRavenSprite({ ...previewDummy, charId: "raven" }, heroX, heroY, true, 1.12);
    } else if (cur.id === "momo") {
      drawMomoSprite({ ...previewDummy, charId: "momo" }, heroX, heroY, false, 1.15);
    } else if (cur.id === "samurai") {
      drawSamuraiSprite({ ...previewDummy, charId: "samurai" }, heroX, heroY, true, 1.15);
    } else {
      drawMustacheSprite({ ...previewDummy, charId: "mustache" }, heroX, heroY, false, 1.15);
    }

    // Right-side Fighter Profile & Move List (clean floating typography with soft shadow)
    const infoX = cardX + 162;
    ctx.save();
    ctx.shadowColor = "rgba(0, 0, 0, 0.9)";
    ctx.shadowBlur = 8;
    ctx.textAlign = "right";
    ctx.fillStyle = "#cbd5e1";
    ctx.font = "bold 10px monospace";
    ctx.fillText(`${activeIdx + 1} / ${roster.length}`, cardX + cardW - 12, cardY + 18);

    ctx.textAlign = "left";
    ctx.fillStyle = "#ffffff";
    ctx.font = "900 18px monospace";
    ctx.fillText(cur.title, infoX, cardY + 38);

    ctx.fillStyle = cur.color;
    ctx.font = "bold 10.5px monospace";
    ctx.fillText(cur.role, infoX, cardY + 56);

    ctx.fillStyle = "rgba(255, 255, 255, 0.25)";
    ctx.fillRect(infoX, cardY + 66, cardW - 178, 1);

    ctx.fillStyle = "#f1f5f9";
    ctx.font = "bold 10.5px monospace";
    ctx.fillText(cur.atk, infoX, cardY + 88);
    ctx.fillStyle = "#7dd3fc";
    ctx.fillText(cur.skill, infoX, cardY + 110);
    ctx.fillStyle = "#fcd34d";
    ctx.fillText(cur.ult, infoX, cardY + 132);
    ctx.restore();

    // Pagination Dots (● ○ ○ ○ ○)
    const dotStartX = W / 2 - ((roster.length - 1) * 18) / 2;
    for (let i = 0; i < roster.length; i++) {
      ctx.beginPath();
      ctx.arc(dotStartX + i * 18, 289, i === activeIdx ? 4.5 : 3, 0, Math.PI * 2);
      ctx.fillStyle = i === activeIdx ? cur.color : "#475569";
      ctx.fill();
    }

    ctx.textAlign = "center";
    if (Math.floor(tick / 24) % 2 === 0) {
      ctx.fillStyle = "#fcd34d";
      ctx.font = "bold 13.5px monospace";
      ctx.fillText("[ PRESS ENTER OR CLICK CARD — 前往世界地圖選擇關卡 ]", W / 2, 326);
    }
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
