// World Tour Expansion Pack: Taiwan (7 Stages, 21 Enemies) + Japan (6 Parallax Stages, 18 Enemies)
(function () {
  const V = "v=37";

  const STAGES = {
    // ======================== 🇹🇼 TAIWAN TOUR (101 - 107) ========================
    101: {
      id: 101,
      nextId: 102,
      region: "taiwan",
      hudName: "🇹🇼 信義・台北 101",
      intro: "台北信義商圈！突破藍線快遞與霓虹盾衛，擊敗黑曜執行長！",
      bossBanner: "信義區 BOSS「黑曜執行長」降臨！",
      bossBarColor: "#2563eb",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_01",
      bgSrc: `assets/taiwan/stages/01-taipei101.png?${V}`,
      enemies: {
        scout: { key: "tw_01_scout", name: "藍線快遞", src: `assets/taiwan/enemies/01-taipei101/scout.png?${V}` },
        guard: { key: "tw_01_guard", name: "霓虹盾衛", src: `assets/taiwan/enemies/01-taipei101/guard.png?${V}` },
        boss: { key: "tw_01_boss", name: "台北 101 BOSS — 黑曜執行長", src: `assets/taiwan/enemies/01-taipei101/boss.png?${V}` },
      },
    },
    102: {
      id: 102,
      nextId: 103,
      region: "taiwan",
      hudName: "🏮 九份老街",
      intro: "霧雨紅燈籠・九份山城！小心暗巷裡的燈影客與石階扛夫！",
      bossBanner: "九份 BOSS「霧燈掌櫃」現身！",
      bossBarColor: "#dc2626",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_02",
      bgSrc: `assets/taiwan/stages/02-jiufen.png?${V}`,
      enemies: {
        scout: { key: "tw_02_scout", name: "燈影客", src: `assets/taiwan/enemies/02-jiufen/scout.png?${V}` },
        guard: { key: "tw_02_guard", name: "石階扛夫", src: `assets/taiwan/enemies/02-jiufen/guard.png?${V}` },
        boss: { key: "tw_02_boss", name: "九份 BOSS — 霧燈掌櫃", src: `assets/taiwan/enemies/02-jiufen/boss.png?${V}` },
      },
    },
    103: {
      id: 103,
      nextId: 104,
      region: "taiwan",
      hudName: "🌊 日月潭",
      intro: "日月潭湖畔碼頭！湖霧斥候與逆潮船長正在前方埋伏！",
      bossBanner: "日月潭 BOSS「逆潮船長」出擊！",
      bossBarColor: "#0284c7",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_03",
      bgSrc: `assets/taiwan/stages/03-sunmoonlake.png?${V}`,
      enemies: {
        scout: { key: "tw_03_scout", name: "湖霧斥候", src: `assets/taiwan/enemies/03-sunmoonlake/scout.png?${V}` },
        guard: { key: "tw_03_guard", name: "浮標守衛", src: `assets/taiwan/enemies/03-sunmoonlake/guard.png?${V}` },
        boss: { key: "tw_03_boss", name: "日月潭 BOSS — 逆潮船長", src: `assets/taiwan/enemies/03-sunmoonlake/boss.png?${V}` },
      },
    },
    104: {
      id: 104,
      nextId: 105,
      region: "taiwan",
      hudName: "🌲 阿里山森林鐵路",
      intro: "阿里山神木與森林鐵道！突破鐵軌巡兵，迎戰赤爐車長！",
      bossBanner: "阿里山 BOSS「赤爐車長」全速進逼！",
      bossBarColor: "#b45309",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_04",
      bgSrc: `assets/taiwan/stages/04-alishan.png?${V}`,
      enemies: {
        scout: { key: "tw_04_scout", name: "煤灰跑腿", src: `assets/taiwan/enemies/04-alishan/scout.png?${V}` },
        guard: { key: "tw_04_guard", name: "鐵軌巡兵", src: `assets/taiwan/enemies/04-alishan/guard.png?${V}` },
        boss: { key: "tw_04_boss", name: "阿里山 BOSS — 赤爐車長", src: `assets/taiwan/enemies/04-alishan/boss.png?${V}` },
      },
    },
    105: {
      id: 105,
      nextId: 106,
      region: "taiwan",
      hudName: "🧱 安平古堡",
      intro: "台南安平紅磚古堡！擊破堡壘盾兵防線，挑戰赤磚堡主！",
      bossBanner: "安平 BOSS「赤磚堡主」鎮守城門！",
      bossBarColor: "#c2410c",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_05",
      bgSrc: `assets/taiwan/stages/05-anping.png?${V}`,
      enemies: {
        scout: { key: "tw_05_scout", name: "磚巷探子", src: `assets/taiwan/enemies/05-anping/scout.png?${V}` },
        guard: { key: "tw_05_guard", name: "堡壘盾兵", src: `assets/taiwan/enemies/05-anping/guard.png?${V}` },
        boss: { key: "tw_05_boss", name: "安平 BOSS — 赤磚堡主", src: `assets/taiwan/enemies/05-anping/boss.png?${V}` },
      },
    },
    106: {
      id: 106,
      nextId: 107,
      region: "taiwan",
      hudName: "⚓ 高雄港",
      intro: "高雄貨櫃碼頭激戰！小心貨櫃重工兵與鋼鉤領班的重擊！",
      bossBanner: "高雄港 BOSS「鋼鉤領班」登場！",
      bossBarColor: "#d97706",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_06",
      bgSrc: `assets/taiwan/stages/06-kaohsiung.png?${V}`,
      enemies: {
        scout: { key: "tw_06_scout", name: "碼頭滑輪手", src: `assets/taiwan/enemies/06-kaohsiung/scout.png?${V}` },
        guard: { key: "tw_06_guard", name: "貨櫃重工兵", src: `assets/taiwan/enemies/06-kaohsiung/guard.png?${V}` },
        boss: { key: "tw_06_boss", name: "高雄港 BOSS — 鋼鉤領班", src: `assets/taiwan/enemies/06-kaohsiung/boss.png?${V}` },
      },
    },
    107: {
      id: 107,
      nextId: null,
      region: "taiwan",
      hudName: "🏮 大稻埕・霞海城隍廟",
      intro: "大稻埕迪化街終點戰！茶箱壯漢與藍白拖角頭正面迎擊！",
      bossBanner: "大稻埕 BOSS「藍白拖角頭」霸氣登場！",
      bossBarColor: "#dc2626",
      bgType: "panorama",
      stageWidth: 1800,
      bgKey: "tw_bg_07",
      bgSrc: `assets/taiwan/stages/07-dadaocheng.png?${V}`,
      enemies: {
        scout: { key: "tw_07_scout", name: "赤巾探子", src: `assets/taiwan/enemies/07-dadaocheng/scout.png?${V}` },
        guard: { key: "tw_07_guard", name: "茶箱壯漢", src: `assets/taiwan/enemies/07-dadaocheng/guard.png?${V}` },
        boss: { key: "tw_07_boss", name: "大稻埕 BOSS — 藍白拖角頭", src: `assets/taiwan/enemies/07-dadaocheng/boss.png?${V}` },
      },
    },

    // ======================== 🇯🇵 JAPAN TOUR (201 - 206) ========================
    201: {
      id: 201,
      nextId: 202,
      region: "japan",
      hudName: "⛩️ 淺草雷門",
      intro: "東京淺草雷門參道！突破赤幡跑手與祭鼓力士，直取雷燈座長！",
      bossBanner: "淺草 BOSS「雷燈座長」參見！",
      bossBarColor: "#dc2626",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_01",
      farSrc: `assets/japan/stages/asakusa/far.png?${V}`,
      streetKey: "jp_street_01",
      streetSrc: `assets/japan/stages/asakusa/street.png?${V}`,
      enemies: {
        scout: { key: "jp_01_scout", name: "赤幡跑手", src: `assets/japan/enemies/01-asakusa/scout.png?${V}` },
        guard: { key: "jp_01_guard", name: "祭鼓力士", src: `assets/japan/enemies/01-asakusa/guard.png?${V}` },
        boss: { key: "jp_01_boss", name: "淺草 BOSS — 雷燈座長", src: `assets/japan/enemies/01-asakusa/boss.png?${V}` },
      },
    },
    202: {
      id: 202,
      nextId: 203,
      region: "japan",
      hudName: "🗼 晴空塔與隅田川",
      intro: "晴空塔河岸步道！銀橋信使與鋼樑守衛已封鎖橋頭！",
      bossBanner: "隅田川 BOSS「天線指揮官」啟動！",
      bossBarColor: "#0284c7",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_02",
      farSrc: `assets/japan/stages/sumida/far.png?${V}`,
      streetKey: "jp_street_02",
      streetSrc: `assets/japan/stages/sumida/street.png?${V}`,
      enemies: {
        scout: { key: "jp_02_scout", name: "銀橋信使", src: `assets/japan/enemies/02-sumida/scout.png?${V}` },
        guard: { key: "jp_02_guard", name: "鋼樑守衛", src: `assets/japan/enemies/02-sumida/guard.png?${V}` },
        boss: { key: "jp_02_boss", name: "隅田川 BOSS — 天線指揮官", src: `assets/japan/enemies/02-sumida/boss.png?${V}` },
      },
    },
    203: {
      id: 203,
      nextId: 204,
      region: "japan",
      hudName: "🗻 富士山與河口湖",
      intro: "富士山河口湖晨霧棧道！迎戰浮筒重兵與霜冠舵主！",
      bossBanner: "河口湖 BOSS「霜冠舵主」現身！",
      bossBarColor: "#2563eb",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_03",
      farSrc: `assets/japan/stages/fuji/far.png?${V}`,
      streetKey: "jp_street_03",
      streetSrc: `assets/japan/stages/fuji/street.png?${V}`,
      enemies: {
        scout: { key: "jp_03_scout", name: "晨霧探子", src: `assets/japan/enemies/03-fuji/scout.png?${V}` },
        guard: { key: "jp_03_guard", name: "浮筒重兵", src: `assets/japan/enemies/03-fuji/guard.png?${V}` },
        boss: { key: "jp_03_boss", name: "河口湖 BOSS — 霜冠舵主", src: `assets/japan/enemies/03-fuji/boss.png?${V}` },
      },
    },
    204: {
      id: 204,
      nextId: 205,
      region: "japan",
      hudName: "🦊 伏見稻荷",
      intro: "京都伏見稻荷千本鳥居！小心狐影疾足與千門幻主的奇襲！",
      bossBanner: "伏見稻荷 BOSS「千門幻主」降臨！",
      bossBarColor: "#ea580c",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_04",
      farSrc: `assets/japan/stages/inari/far.png?${V}`,
      streetKey: "jp_street_04",
      streetSrc: `assets/japan/stages/inari/street.png?${V}`,
      enemies: {
        scout: { key: "jp_04_scout", name: "狐影疾足", src: `assets/japan/enemies/04-inari/scout.png?${V}` },
        guard: { key: "jp_04_guard", name: "朱柱門衛", src: `assets/japan/enemies/04-inari/guard.png?${V}` },
        boss: { key: "jp_04_boss", name: "伏見稻荷 BOSS — 千門幻主", src: `assets/japan/enemies/04-inari/boss.png?${V}` },
      },
    },
    205: {
      id: 205,
      nextId: 206,
      region: "japan",
      hudName: "🦀 大阪道頓堀",
      intro: "大阪道頓堀霓虹夜景！突破蟹鉗重兵，擊倒電光看板王！",
      bossBanner: "道頓堀 BOSS「電光看板王」閃耀登場！",
      bossBarColor: "#db2777",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_05",
      farSrc: `assets/japan/stages/osaka/far.png?${V}`,
      streetKey: "jp_street_05",
      streetSrc: `assets/japan/stages/osaka/street.png?${V}`,
      enemies: {
        scout: { key: "jp_05_scout", name: "霓虹溜手", src: `assets/japan/enemies/05-osaka/scout.png?${V}` },
        guard: { key: "jp_05_guard", name: "蟹鉗重兵", src: `assets/japan/enemies/05-osaka/guard.png?${V}` },
        boss: { key: "jp_05_boss", name: "道頓堀 BOSS — 電光看板王", src: `assets/japan/enemies/05-osaka/boss.png?${V}` },
      },
    },
    206: {
      id: 206,
      nextId: null,
      region: "japan",
      hudName: "⛩️ 宮島海上大鳥居",
      intro: "廣島宮島嚴島海岸終點戰！擊退繫纜壯士，決戰赤潮渡守！",
      bossBanner: "宮島 BOSS「赤潮渡守」決戰開啟！",
      bossBarColor: "#b91c1c",
      bgType: "japan_parallax",
      stageWidth: 1280,
      farKey: "jp_far_06",
      farSrc: `assets/japan/stages/miyajima/far.png?${V}`,
      streetKey: "jp_street_06",
      streetSrc: `assets/japan/stages/miyajima/street.png?${V}`,
      enemies: {
        scout: { key: "jp_06_scout", name: "潮行斥候", src: `assets/japan/enemies/06-miyajima/scout.png?${V}` },
        guard: { key: "jp_06_guard", name: "繫纜壯士", src: `assets/japan/enemies/06-miyajima/guard.png?${V}` },
        boss: { key: "jp_06_boss", name: "宮島 BOSS — 赤潮渡守", src: `assets/japan/enemies/06-miyajima/boss.png?${V}` },
      },
    },
  };

  function getStage(id) {
    return STAGES[id] || null;
  }

  function preloadStage(id) {
    const cfg = STAGES[id];
    if (!cfg || !window.sprites || !window.sprites.ensureRaw) return;
    if (cfg.bgType === "panorama") {
      window.sprites.ensureRaw(cfg.bgKey, cfg.bgSrc);
    } else if (cfg.bgType === "japan_parallax") {
      window.sprites.ensureRaw(cfg.farKey, cfg.farSrc);
      window.sprites.ensureRaw(cfg.streetKey, cfg.streetSrc);
    }
    window.sprites.ensureRaw(cfg.enemies.scout.key, cfg.enemies.scout.src);
    window.sprites.ensureRaw(cfg.enemies.guard.key, cfg.enemies.guard.src);
    window.sprites.ensureRaw(cfg.enemies.boss.key, cfg.enemies.boss.src);
  }

  function buildWaves(id) {
    const cfg = STAGES[id];
    if (!cfg) return [];
    if (cfg.stageWidth <= 1280) {
      // Japan 1280px 2-layer parallax stages: 3 crisp waves
      return [
        {
          triggerX: 60,
          lockX: 0,
          spawned: false,
          cleared: false,
          list: [
            { type: "wt_scout", x: 460, y: 256 },
            { type: "wt_guard", x: 540, y: 288 },
            { type: "wt_scout", x: 590, y: 270 },
          ],
        },
        {
          triggerX: 460,
          lockX: 320,
          spawned: false,
          cleared: false,
          list: [
            { type: "wt_scout", x: 280, y: 274 },
            { type: "wt_guard", x: 880, y: 262 },
            { type: "wt_scout", x: 930, y: 294 },
            { type: "wt_guard", x: 960, y: 276 },
          ],
        },
        {
          triggerX: 840,
          lockX: 640,
          spawned: false,
          cleared: false,
          list: [
            { type: "wt_boss", x: 1180, y: 274 },
            { type: "wt_scout", x: 610, y: 258 },
            { type: "wt_guard", x: 1220, y: 296 },
          ],
        },
      ];
    }
    // Taiwan 1800px panoramic stages: 3 scenic waves
    return [
      {
        triggerX: 90,
        lockX: 0,
        spawned: false,
        cleared: false,
        list: [
          { type: "wt_scout", x: 480, y: 256 },
          { type: "wt_guard", x: 560, y: 288 },
          { type: "wt_scout", x: 610, y: 270 },
        ],
      },
      {
        triggerX: 680,
        lockX: 560,
        spawned: false,
        cleared: false,
        list: [
          { type: "wt_scout", x: 520, y: 276 },
          { type: "wt_guard", x: 1120, y: 262 },
          { type: "wt_scout", x: 1180, y: 296 },
          { type: "wt_guard", x: 1220, y: 278 },
        ],
      },
      {
        triggerX: 1280,
        lockX: 1160,
        spawned: false,
        cleared: false,
        list: [
          { type: "wt_boss", x: 1690, y: 274 },
          { type: "wt_scout", x: 1130, y: 258 },
          { type: "wt_guard", x: 1730, y: 296 },
        ],
      },
    ];
  }

  function drawBackground(ctx, id, cameraX, stageWidth, W, H) {
    const cfg = STAGES[id];
    if (!cfg || !window.sprites) return false;
    if (cfg.bgType === "japan_parallax") {
      const far = window.sprites.get(cfg.farKey);
      const street = window.sprites.get(cfg.streetKey);
      if (!far || !street) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        return true;
      }
      const x = Math.max(0, Math.min(street.width - W, Math.round(cameraX)));
      ctx.save();
      ctx.imageSmoothingEnabled = false;
      ctx.drawImage(far, -Math.round(x / 4), 0);
      ctx.drawImage(street, -x, 0);
      ctx.restore();
      return true;
    }
    if (cfg.bgType === "panorama") {
      const bg = window.sprites.get(cfg.bgKey);
      if (!bg) {
        ctx.fillStyle = "#0f172a";
        ctx.fillRect(0, 0, W, H);
        return true;
      }
      const drawW = Math.max(W, Math.round((bg.width / bg.height) * H));
      const maxCam = Math.max(1, stageWidth - W);
      const ratio = Math.max(0, Math.min(1, cameraX / maxCam));
      const scrollX = Math.round(ratio * Math.max(0, drawW - W));
      ctx.save();
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = "high";
      ctx.drawImage(bg, -scrollX, 0, drawW, H);
      ctx.restore();
      return true;
    }
    return false;
  }

  window.WorldTour = {
    STAGES,
    getStage,
    preloadStage,
    buildWaves,
    drawBackground,
  };
})();
