// High-Detail 16-bit/32-bit Pixel Art Asset Loader with Chroma-Key & Edge Despill
class SpriteBank {
  constructor() {
    this.images = {};
    this.readyCount = 0;
    this.totalCount = 0;

    this.loadRaw("bg_harbour", "assets/bg_harbour.jpg");
    this.loadRaw("bg_harbour_sky", "assets/bg_harbour_sky.jpg?v=34");
    this.loadRaw("bg_harbour_seg1", "assets/bg_harbour_seg1.png?v=34");
    this.loadRaw("bg_harbour_seg2", "assets/bg_harbour_seg2.png?v=34");
    this.loadRaw("bg_harbour_seg3", "assets/bg_harbour_seg3.png?v=34");
    this.loadRaw("bg_restroom", "assets/bg_restroom.jpg");
    this.loadRaw("bg_airport_tarmac", "assets/bg_airport_tarmac.jpg");
    this.loadRaw("bg_dadaocheng", "assets/bg_dadaocheng.jpg");
    this.loadRaw("bg_train", "assets/bg_train.png?v=36");
    this.loadRaw("enemy_train_ticket", "assets/enemy_train_ticket.png?v=36");
    this.loadRaw("enemy_train_porter", "assets/enemy_train_porter.png?v=36");
    this.loadRaw("boss_train_mechanic", "assets/boss_train_mechanic.png?v=36");
    this.loadRaw("bg_lab_f1", "assets/bg_lab_f1.jpg");
    this.loadRaw("bg_lab_b1", "assets/bg_lab_b1.jpg");
    this.loadRaw("bg_lab_b2", "assets/bg_lab_b2.jpg");
    this.loadTallScrollableWorldMap("assets/map_world_top.jpg?v=10", "assets/map_island.jpg?v=10");

    this.loadSprite("hero_mustache_normal", "assets/hero_mustache_normal.jpg");
    this.loadSprite("hero_mustache_buff", "assets/hero_mustache_buff.jpg");
    this.loadSprite("hero_samurai_idle", "assets/hero_samurai_idle.jpg");
    this.loadSprite("hero_samurai_slash", "assets/hero_samurai_slash.jpg");
    this.loadDualSamuraiSheet("assets/hero_samurai_dual_sheet.jpg?v=11");
    this.loadRaw("hero_samurai_portrait", "assets/hero_samurai_portrait.jpg?v=30");
    this.loadRaven2x4Sheet(
      "assets/hero_samurai_normal_sheet.png?v=30",
      ["sam_idle", "sam_atk1", "sam_atk2", "sam_atk3"],
      ["sam_k_crouch", "sam_k_dash", "sam_k_trail", "sam_k_burst"],
      [[0, 0.22], [0.22, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.20], [0.20, 0.44], [0.44, 0.72], [0.72, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_samurai_ult_sheet.png?v=30",
      ["sam_ult_draw", "sam_ult_wave", "sam_ult_lv1", "sam_ult_lv2"],
      ["sam_dual_idle", "sam_dual_dash", "sam_dual_cross", "sam_dual_waves"],
      [[0, 0.21], [0.21, 0.49], [0.49, 0.73], [0.73, 1.0]],
      [[0, 0.21], [0.21, 0.46], [0.46, 0.70], [0.70, 1.0]]
    );
    this.loadSprite("hero_momo_normal", "assets/hero_momo_normal.jpg");
    this.loadSprite("hero_momo_vampire", "assets/hero_momo_vampire.jpg");
    this.loadRaw("hero_momo_portrait", "assets/hero_momo_portrait.jpg?v=18");
    this.loadRaw("hero_momo_vampire_portrait", "assets/hero_momo_vampire_portrait.jpg?v=20");
    this.loadRaven2x4Sheet(
      "assets/hero_momo_normal_sheet.png?v=18",
      ["momo_idle", "momo_spray_prep", "momo_spray_fire", "momo_spray_recover"],
      ["momo_blink_crouch", "momo_blink_dissolve", "momo_blink_swarm", "momo_blink_land"],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.465], [0.465, 0.74], [0.74, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_momo_vampire_sheet.png?v=20",
      ["momo_vamp_idle", "momo_vamp_claw", "momo_vamp_blink", "momo_vamp_heal"],
      ["momo_vamp_lv1_claw", "momo_vamp_lv1_wave", "momo_vamp_lv2_wave", "momo_vamp_lv3_true"],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.25], [0.25, 0.50], [0.50, 0.75], [0.75, 1.0]]
    );
    this.loadRaw("hero_raven_portrait", "assets/hero_raven_portrait.jpg?v=16");
    this.loadRaven2x4Sheet(
      "assets/hero_raven_dagger_sheet.png?v=16",
      ["raven_idle", "raven_atk1", "raven_atk2", "raven_atk3"],
      ["raven_smoke", "raven_grapple", "raven_backstab", "raven_evade"]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_raven_ult_sheet.png?v=17",
      ["raven_ult_reach", "raven_ult_draw", "raven_ult_step1", "raven_ult_step2"],
      ["raven_ult_lv1", "raven_ult_lv2", "raven_ult_lv3_kata", "raven_ult_lv3_finisher"]
    );
    this.loadRaw("hero_shaka_portrait", "assets/hero_shaka_portrait.jpg?v=21");
    this.loadRaven2x4Sheet(
      "assets/hero_shaka_normal_sheet.png?v=39",
      ["shaka_idle", "shaka_atk1", "shaka_atk2", "shaka_atk3"],
      ["shaka_k_float", "shaka_k_grab", "shaka_k_bind", "shaka_k_barrier"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.74], [0.74, 1.0]],
      [[0, 0.23], [0.23, 0.47], [0.47, 0.73], [0.73, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_shaka_ult_sheet.png?v=21",
      ["shaka_ult_float", "shaka_ult_idle", "shaka_ult_multi", "shaka_ult_lv1"],
      ["shaka_ult_lv2_charge", "shaka_ult_lv2_slam", "shaka_ult_lv3_array", "shaka_ult_lv3_finisher"],
      [[0, 0.23], [0.23, 0.48], [0.48, 0.74], [0.74, 1.0]],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.73], [0.73, 1.0]]
    );
    this.loadRaw("hero_alice_portrait", "assets/hero_alice_portrait.jpg?v=28");
    this.loadRaven2x4Sheet(
      "assets/hero_alice_normal_sheet.png?v=28",
      ["alice_idle", "alice_atk1", "alice_atk2", "alice_atk3"],
      ["alice_k_touch", "alice_k_wave", "alice_k_break", "alice_k_push"],
      [[0, 0.23], [0.23, 0.50], [0.50, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.48], [0.48, 0.73], [0.73, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_alice_ult_sheet.png?v=28",
      ["alice_ult_start", "alice_ult_idle", "alice_ult_dash", "alice_ult_lv1"],
      ["alice_ult_punch", "alice_ult_lv2", "alice_ult_lv3_domain", "alice_ult_lv3_snap"],
      [[0, 0.23], [0.23, 0.49], [0.49, 0.76], [0.76, 1.0]],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.75], [0.75, 1.0]]
    );
    this.loadRaw("hero_ironfist_portrait", "assets/hero_ironfist_portrait.jpg?v=32");
    this.loadRaven2x4Sheet(
      "assets/hero_ironfist_normal_sheet.png?v=32",
      ["if_idle", "if_atk1", "if_atk2", "if_atk3"],
      ["if_k_wrap", "if_k_guard", "if_k_charge", "if_k_slam"],
      [[0, 0.22], [0.22, 0.47], [0.47, 0.71], [0.71, 1.0]],
      [[0, 0.21], [0.21, 0.43], [0.43, 0.71], [0.71, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_ironfist_ult_sheet.png?v=32",
      ["if_ult_steam", "if_ult_idle", "if_ult_punch", "if_ult_lv1"],
      ["if_ult_lv2_charge", "if_ult_lv2_dash", "if_ult_lv3_launch", "if_ult_lv3_combo"],
      [[0, 0.22], [0.22, 0.46], [0.46, 0.74], [0.74, 1.0]],
      [[0, 0.20], [0.20, 0.48], [0.48, 0.70], [0.70, 1.0]]
    );
    this.loadRaw("hero_nightheron_portrait", "assets/hero_nightheron_portrait.jpg?v=33");
    this.loadRaven2x4Sheet(
      "assets/hero_nightheron_normal_sheet.png?v=33",
      ["nh_idle", "nh_atk1", "nh_atk2", "nh_atk3"],
      ["nh_k_tap", "nh_k_slide", "nh_k_kick", "nh_k_land"],
      [[0, 0.22], [0.22, 0.49], [0.49, 0.75], [0.75, 1.0]],
      [[0, 0.22], [0.22, 0.50], [0.50, 0.76], [0.76, 1.0]]
    );
    this.loadRaven2x4Sheet(
      "assets/hero_nightheron_ult_sheet.png?v=33",
      ["nh_ult_tap", "nh_ult_idle", "nh_ult_kick", "nh_ult_lv1"],
      ["nh_ult_lv2_jump", "nh_ult_lv2_axe", "nh_ult_lv3_launch", "nh_ult_lv3_dive"],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.75], [0.75, 1.0]],
      [[0, 0.24], [0.24, 0.49], [0.49, 0.73], [0.73, 1.0]]
    );
    this.loadSprite("enemy_agent", "assets/enemy_agent.jpg");
    this.loadSprite("enemy_boss", "assets/enemy_boss.jpg");
    this.loadSprite("enemy_mutant_dog", "assets/enemy_mutant_dog.jpg");
    this.loadSprite("enemy_mutant_brute", "assets/enemy_mutant_brute.jpg");
    this.loadSprite("enemy_skull_human", "assets/enemy_skull_human.jpg");
    this.loadSprite("boss_genex_p1", "assets/boss_genex_p1.jpg");
    this.loadSprite("boss_genex_p2", "assets/boss_genex_p2.jpg");
    this.loadSprite("boss_genex_p3", "assets/boss_genex_p3.jpg");
    this.loadSprite("boss_ironfist", "assets/boss_ironfist.jpg");
    this.loadSprite("boss_nightheron", "assets/boss_nightheron.jpg");
    this.loadSprite("enemy_89_knife", "assets/enemy_89_knife.jpg");
    this.loadSprite("enemy_89_bat", "assets/enemy_89_bat.jpg");
    this.loadSprite("boss_89_king", "assets/boss_89_king.jpg");
    this.loadSprite("prop_brisket", "assets/prop_brisket.jpg");

    this.loadPixelButtonSheet("momo", "assets/momo_buttons_sheet.jpg?v=3");
    this.loadSinglePixelButton("samurai", "ult", "assets/samurai_btn_ult.jpg?v=30");
    this.loadSinglePixelButton("samurai", "jump", "assets/samurai_btn_jump.jpg?v=31");
    this.loadSinglePixelButton("samurai", "atk", "assets/samurai_btn_atk.jpg?v=30");
    this.loadPixelButtonSheet("mustache", "assets/mustache_buttons_sheet.jpg?v=3");
    this.loadPixelButtonSheet("raven", "assets/raven_buttons_sheet.jpg?v=16");
    this.loadSinglePixelButton("shaka", "ult", "assets/shaka_btn_ult.jpg?v=21");
    this.loadSinglePixelButton("shaka", "jump", "assets/shaka_btn_jump.jpg?v=22");
    this.loadSinglePixelButton("shaka", "atk", "assets/shaka_btn_atk.jpg?v=21");
    this.loadPixelButtonSheet("alice", "assets/alice_buttons_sheet.jpg?v=28");
    this.loadPixelButtonSheet("ironfist", "assets/ironfist_buttons_sheet.jpg?v=32");
    this.loadPixelButtonSheet("nightheron", "assets/nightheron_buttons_sheet.jpg?v=33");
  }

  // Slice & pixelate a 2x2 character skill button sheet (TR=ult, BL=jump, BR=atk) into crisp 32-bit pixel art!
  loadPixelButtonSheet(prefix, src) {
    const img = new Image();
    img.onload = () => {
      const halfW = img.width / 2;
      const halfH = img.height / 2;
      const slices = [
        { id: "ult", sx: halfW, sy: 0, sw: halfW, sh: halfH },
        { id: "jump", sx: 0, sy: halfH, sw: halfW, sh: halfH },
        { id: "atk", sx: halfW, sy: halfH, sw: halfW, sh: halfH },
      ];
      for (const s of slices) {
        const pSize = 52;
        const small = document.createElement("canvas");
        small.width = pSize;
        small.height = pSize;
        const sctx = small.getContext("2d", { willReadFrequently: true });
        sctx.imageSmoothingEnabled = true;
        sctx.imageSmoothingQuality = "high";
        sctx.drawImage(img, s.sx, s.sy, s.sw, s.sh, 0, 0, pSize, pSize);

        const idata = sctx.getImageData(0, 0, pSize, pSize);
        const d = idata.data;
        const cx = pSize / 2;
        const cy = pSize / 2;
        const maxR = pSize * 0.49;
        for (let y = 0; y < pSize; y++) {
          for (let x = 0; x < pSize; x++) {
            const idx = (y * pSize + x) * 4;
            if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
              d[idx + 3] = 0;
              continue;
            }
            d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
            d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
            d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
          }
        }
        sctx.putImageData(idata, 0, 0);

        const out = document.createElement("canvas");
        out.width = pSize * 3;
        out.height = pSize * 3;
        const octx = out.getContext("2d");
        octx.imageSmoothingEnabled = false;
        octx.drawImage(small, 0, 0, out.width, out.height);

        const dataUrl = out.toDataURL("image/png");
        document.documentElement.style.setProperty(`--${prefix}-btn-${s.id}`, `url(${dataUrl})`);
      }
    };
    img.src = src;
  }

  get(name) {
    return this.images[name] || null;
  }

  // Load a single square circular skill button image & pixelate into crisp 32-bit arcade icon
  loadSinglePixelButton(prefix, id, src) {
    const img = new Image();
    img.onload = () => {
      const pSize = 52;
      const small = document.createElement("canvas");
      small.width = pSize;
      small.height = pSize;
      const sctx = small.getContext("2d", { willReadFrequently: true });
      sctx.imageSmoothingEnabled = true;
      sctx.imageSmoothingQuality = "high";
      sctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, pSize, pSize);
      const idata = sctx.getImageData(0, 0, pSize, pSize);
      const d = idata.data;
      const cx = pSize / 2, cy = pSize / 2, maxR = pSize * 0.49;
      for (let y = 0; y < pSize; y++) {
        for (let x = 0; x < pSize; x++) {
          const idx = (y * pSize + x) * 4;
          if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
            d[idx + 3] = 0;
            continue;
          }
          d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
          d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
          d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
        }
      }
      sctx.putImageData(idata, 0, 0);
      const out = document.createElement("canvas");
      out.width = pSize * 3;
      out.height = pSize * 3;
      const octx = out.getContext("2d");
      octx.imageSmoothingEnabled = false;
      octx.drawImage(small, 0, 0, out.width, out.height);
      document.documentElement.style.setProperty(`--${prefix}-btn-${id}`, `url(${out.toDataURL("image/png")})`);
    };
    img.src = src;
  }

  // Slice & chroma-key Shaka's 2x4 Normal Sheet (soft neutral-grey smoky background -> transparent!)
  loadShakaGrey2x4Sheet(src, row0Names, row1Names) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const cellW = Math.floor(w / 4);
      const halfH = Math.floor(h / 2);
      const rows = [
        { y0: 0, y1: halfH, names: row0Names },
        { y0: halfH, y1: h, names: row1Names },
      ];

      for (const row of rows) {
        for (let col = 0; col < 4; col++) {
          const x0 = col * cellW;
          const cw = col === 3 ? w - x0 : cellW;
          const ch = row.y1 - row.y0;
          const off = document.createElement("canvas");
          off.width = cw;
          off.height = ch;
          const octx = off.getContext("2d", { willReadFrequently: true });
          octx.drawImage(img, x0, row.y0, cw, ch, 0, 0, cw, ch);
          const id = octx.getImageData(0, 0, cw, ch);
          const d = id.data;

          // Neutral smoky grey background detection (low saturation, cool/neutral tint; preserves warm cream/gold robes)
          const isGreyBg = (idx) => {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            const maxC = Math.max(r, g, b);
            const minC = Math.min(r, g, b);
            const lum = (r + g + b) / 3;
            return (maxC - minC) <= 22 && lum >= 82 && lum <= 232 && (r - b) <= 13;
          };

          const visited = new Uint8Array(cw * ch);
          const q = new Int32Array(cw * ch);
          let qh = 0, qt = 0;
          const enq = (x, y) => {
            if (x < 0 || y < 0 || x >= cw || y >= ch) return;
            const p = y * cw + x;
            if (visited[p]) return;
            if (isGreyBg(p * 4)) {
              visited[p] = 1;
              d[p * 4 + 3] = 0;
              q[qt++] = p;
            }
          };
          for (let x = 0; x < cw; x++) { enq(x, 0); enq(x, ch - 1); }
          for (let y = 0; y < ch; y++) { enq(0, y); enq(cw - 1, y); }
          while (qh < qt) {
            const p = q[qh++];
            const x = p % cw, y = (p - x) / cw;
            enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
          }

          // Clear enclosed neutral grey pockets (inside golden halo, between spectral arms, between ankles)
          // Seed from strictly neutral grey interior pixels and flood-fill to clean the pocket cleanly up to outlines
          qh = 0; qt = 0;
          for (let p = 0; p < cw * ch; p++) {
            if (!visited[p]) {
              const idx = p * 4;
              const r = d[idx], g = d[idx + 1], b = d[idx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              const lum = (r + g + b) / 3;
              if ((maxC - minC) <= 14 && lum >= 108 && lum <= 228 && Math.abs(r - b) <= 9) {
                visited[p] = 1;
                d[idx + 3] = 0;
                q[qt++] = p;
              }
            }
          }
          while (qh < qt) {
            const p = q[qh++];
            const x = p % cw, y = (p - x) / cw;
            const nbrs = [[x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]];
            for (const [nx, ny] of nbrs) {
              if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
              const np = ny * cw + nx;
              if (visited[np]) continue;
              const nidx = np * 4;
              const r = d[nidx], g = d[nidx + 1], b = d[nidx + 2];
              const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
              const lum = (r + g + b) / 3;
              if ((maxC - minC) <= 20 && lum >= 92 && lum <= 234 && (r - b) <= 12) {
                visited[np] = 1;
                d[nidx + 3] = 0;
                q[qt++] = np;
              }
            }
          }

          // 1-pass grey-fringe despill on edge pixels touching transparency
          for (let y = 1; y < ch - 1; y++) {
            for (let x = 1; x < cw - 1; x++) {
              const p = y * cw + x;
              const idx = p * 4;
              if (d[idx + 3] === 0) continue;
              const touchesBg =
                d[((y - 1) * cw + x) * 4 + 3] === 0 ||
                d[((y + 1) * cw + x) * 4 + 3] === 0 ||
                d[(y * cw + (x - 1)) * 4 + 3] === 0 ||
                d[(y * cw + (x + 1)) * 4 + 3] === 0;
              if (touchesBg) {
                const r = d[idx], g = d[idx + 1], b = d[idx + 2];
                const maxC = Math.max(r, g, b), minC = Math.min(r, g, b);
                const lum = (r + g + b) / 3;
                if ((maxC - minC) <= 18 && lum >= 100 && (r - b) <= 12) {
                  d[idx + 3] = 0;
                }
              }
            }
          }

          // Remove tiny disconnected floating specks (e.g. shadow dots below feet or stray aura dust)
          const compSeen = new Uint8Array(cw * ch);
          const compBuf = new Int32Array(cw * ch);
          for (let p = 0; p < cw * ch; p++) {
            if (compSeen[p] || d[p * 4 + 3] <= 24) continue;
            let chHead = 0, chTail = 0;
            compSeen[p] = 1;
            compBuf[chTail++] = p;
            while (chHead < chTail) {
              const cp = compBuf[chHead++];
              const cx = cp % cw, cy = (cp - cx) / cw;
              const nbrs = [[cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]];
              for (const [nx, ny] of nbrs) {
                if (nx < 0 || ny < 0 || nx >= cw || ny >= ch) continue;
                const np = ny * cw + nx;
                if (compSeen[np] || d[np * 4 + 3] <= 24) continue;
                compSeen[np] = 1;
                compBuf[chTail++] = np;
              }
            }
            if (chTail < 45) {
              for (let k = 0; k < chTail; k++) {
                d[compBuf[k] * 4 + 3] = 0;
              }
            }
          }
          octx.putImageData(id, 0, 0);

          let minX = cw, maxX = 0, minY = ch, maxY = 0;
          for (let y = 0; y < ch; y++) {
            for (let x = 0; x < cw; x++) {
              if (d[(y * cw + x) * 4 + 3] > 24) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX <= minX || maxY <= minY) continue;
          const tw = maxX - minX + 1;
          const th = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = tw;
          out.height = th;
          out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
          this.images[row.names[col]] = out;
        }
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }

  // Slice & chroma-key 2x4 (8-frame) White-Background Sprite Sheets (Raven / Momo)!
  loadRaven2x4Sheet(src, row0Names, row1Names, row0Ratios = null, row1Ratios = null) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, w, h);
      const d = id.data;

      // Remove pure/near-white background via BFS from borders & interior pure-white gaps
      const isWhiteBg = (idx) => {
        const a = d[idx + 3];
        if (a < 20) return true;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return r > 236 && g > 236 && b > 236 && Math.max(r, g, b) - Math.min(r, g, b) < 16;
      };

      const visited = new Uint8Array(w * h);
      const q = new Int32Array(w * h);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        if (isWhiteBg(p * 4)) {
          visited[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < w; x++) { enq(x, 0); enq(x, h - 1); }
      for (let y = 0; y < h; y++) { enq(0, y); enq(w - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % w, y = (p - x) / w;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }

      // Also clear enclosed pure-white gaps between legs/arms/braids (tight threshold so white shirt collar stays intact!)
      for (let p = 0; p < w * h; p++) {
        if (!visited[p]) {
          const idx = p * 4;
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          if (r > 248 && g > 248 && b > 248) {
            d[idx + 3] = 0;
          }
        }
      }
      octx.putImageData(id, 0, 0);

      const halfH = Math.floor(h / 2);
      const rows = [
        { y0: 0, y1: halfH, names: row0Names, ratios: row0Ratios },
        { y0: halfH, y1: h, names: row1Names, ratios: row1Ratios },
      ];

      for (const row of rows) {
        let finalSpans;
        if (row.ratios) {
          finalSpans = row.ratios.map(([r0, r1]) => [Math.floor(w * r0), Math.min(w - 1, Math.floor(w * r1) - 1)]);
        } else {
          // Auto-detect 4 horizontal spans in this row so wide frames never clip!
          const colHasPx = new Uint8Array(w);
          for (let x = 0; x < w; x++) {
            let cnt = 0;
            for (let y = row.y0; y < row.y1; y++) {
              if (d[(y * w + x) * 4 + 3] > 24) cnt++;
            }
            if (cnt >= 3) colHasPx[x] = 1;
          }
          const spans = [];
          let inSpan = false, sStart = 0;
          for (let x = 0; x < w; x++) {
            if (colHasPx[x] && !inSpan) {
              inSpan = true;
              sStart = x;
            } else if (!colHasPx[x] && inSpan) {
              inSpan = false;
              if (x - sStart > 24) spans.push([sStart, x - 1]);
            }
          }
          if (inSpan && w - sStart > 24) spans.push([sStart, w - 1]);

          const cellW = Math.floor(w / 4);
          finalSpans =
            spans.length === 4
              ? spans
              : [
                  [0, cellW - 1],
                  [cellW, cellW * 2 - 1],
                  [cellW * 2, cellW * 3 - 1],
                  [cellW * 3, w - 1],
                ];
        }

        finalSpans.forEach(([x0, x1], idx) => {
          let minX = x1, maxX = x0, minY = row.y1 - 1, maxY = row.y0;
          for (let y = row.y0; y < row.y1; y++) {
            for (let x = x0; x <= x1; x++) {
              if (d[(y * w + x) * 4 + 3] > 24) {
                if (x < minX) minX = x;
                if (x > maxX) maxX = x;
                if (y < minY) minY = y;
                if (y > maxY) maxY = y;
              }
            }
          }
          if (maxX <= minX || maxY <= minY) return;
          const tw = maxX - minX + 1;
          const th = maxY - minY + 1;
          const out = document.createElement("canvas");
          out.width = tw;
          out.height = th;
          out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
          this.images[row.names[idx]] = out;
        });
      }

      // Default alias for fallback references
      if (this.images["raven_idle"]) {
        this.images["hero_raven_normal"] = this.images["raven_idle"];
      }
      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }

  // Extract Raven (暗影會・暗殺者) sprites, portrait & custom skill buttons directly from her character sheet!
  loadRavenSheet(src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;

      const extractCutout = (rx, ry, rw, rh) => {
        const cw = Math.max(1, Math.floor(w * rw));
        const ch = Math.max(1, Math.floor(h * rh));
        const sx = Math.floor(w * rx);
        const sy = Math.floor(h * ry);
        const off = document.createElement("canvas");
        off.width = cw;
        off.height = ch;
        const octx = off.getContext("2d", { willReadFrequently: true });
        octx.drawImage(img, sx, sy, cw, ch, 0, 0, cw, ch);
        const id = octx.getImageData(0, 0, cw, ch);
        const d = id.data;

        const bgR = d[0], bgG = d[1], bgB = d[2];
        const isBg = (idx) => {
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 42;
        };

        const visited = new Uint8Array(cw * ch);
        const q = new Int32Array(cw * ch);
        let qh = 0, qt = 0;
        const enq = (x, y) => {
          if (x < 0 || y < 0 || x >= cw || y >= ch) return;
          const p = y * cw + x;
          if (visited[p]) return;
          if (isBg(p * 4)) {
            visited[p] = 1;
            d[p * 4 + 3] = 0;
            q[qt++] = p;
          }
        };
        for (let x = 0; x < cw; x++) { enq(x, 0); enq(x, ch - 1); }
        for (let y = 0; y < ch; y++) { enq(0, y); enq(cw - 1, y); }
        while (qh < qt) {
          const p = q[qh++];
          const x = p % cw, y = (p - x) / cw;
          enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
        }

        // Clean enclosed dark-teal gaps between legs/skirt
        for (let p = 0; p < cw * ch; p++) {
          if (!visited[p]) {
            const idx = p * 4;
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            if (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 22) {
              d[idx + 3] = 0;
            }
          }
        }
        octx.putImageData(id, 0, 0);

        // Tight auto-crop
        let minX = cw, maxX = 0, minY = ch, maxY = 0;
        for (let y = 0; y < ch; y++) {
          for (let x = 0; x < cw; x++) {
            if (d[(y * cw + x) * 4 + 3] > 20) {
              if (x < minX) minX = x;
              if (x > maxX) maxX = x;
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        if (maxX <= minX || maxY <= minY) return off;
        const tw = maxX - minX + 1;
        const th = maxY - minY + 1;
        const out = document.createElement("canvas");
        out.width = tw;
        out.height = th;
        out.getContext("2d").drawImage(off, minX, minY, tw, th, 0, 0, tw, th);
        return out;
      };

      // Right-facing 3/4 combat sprite & Front pose sprite
      this.images["hero_raven_normal"] = extractCutout(0.34, 0.008, 0.135, 0.568);
      this.images["hero_raven_front"] = extractCutout(0.145, 0.008, 0.165, 0.568);

      // Top-right close-up portrait for HUD headshot
      const pCanvas = document.createElement("canvas");
      pCanvas.width = 128;
      pCanvas.height = 128;
      pCanvas.getContext("2d").drawImage(img, w * 0.855, h * 0.012, w * 0.132, h * 0.185, 0, 0, 128, 128);
      this.images["hero_raven_portrait"] = pCanvas;

      // Pixelated custom circular touch buttons (ult=portrait/eclipse, jump=grapple, atk=dagger/knives)
      const btnSpecs = [
        { id: "ult", rx: 0.855, ry: 0.012, rw: 0.132, rh: 0.185 },
        { id: "jump", rx: 0.675, ry: 0.79, rw: 0.115, rh: 0.145 },
        { id: "atk", rx: 0.255, ry: 0.79, rw: 0.115, rh: 0.145 },
      ];
      for (const s of btnSpecs) {
        const pSize = 52;
        const small = document.createElement("canvas");
        small.width = pSize;
        small.height = pSize;
        const sctx = small.getContext("2d", { willReadFrequently: true });
        sctx.fillStyle = "#090d16";
        sctx.fillRect(0, 0, pSize, pSize);
        sctx.drawImage(img, w * s.rx, h * s.ry, w * s.rw, h * s.rh, 0, 0, pSize, pSize);
        const idata = sctx.getImageData(0, 0, pSize, pSize);
        const bd = idata.data;
        const cx = pSize / 2, cy = pSize / 2, maxR = pSize * 0.49;
        for (let y = 0; y < pSize; y++) {
          for (let x = 0; x < pSize; x++) {
            const idx = (y * pSize + x) * 4;
            if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
              bd[idx + 3] = 0;
              continue;
            }
            bd[idx] = Math.min(255, Math.round(bd[idx] / 16) * 16);
            bd[idx + 1] = Math.min(255, Math.round(bd[idx + 1] / 16) * 16);
            bd[idx + 2] = Math.min(255, Math.round(bd[idx + 2] / 16) * 16);
          }
        }
        sctx.putImageData(idata, 0, 0);
        const out = document.createElement("canvas");
        out.width = pSize * 3;
        out.height = pSize * 3;
        const octx = out.getContext("2d");
        octx.imageSmoothingEnabled = false;
        octx.drawImage(small, 0, 0, out.width, out.height);
        document.documentElement.style.setProperty(`--raven-btn-${s.id}`, `url(${out.toDataURL("image/png")})`);
      }

      this.readyCount++;
    };
    img.onerror = () => {
      this.readyCount++;
    };
    img.src = src;
  }

  // Slice & chroma-key the 3-frame Dual-Katana Samurai sheet (Idle, Forward Dash, X-Cross Slash!)
  loadDualSamuraiSheet(src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      const w = img.width;
      const h = img.height;
      const off = document.createElement("canvas");
      off.width = w;
      off.height = h;
      const octx = off.getContext("2d", { willReadFrequently: true });
      octx.drawImage(img, 0, 0);
      const id = octx.getImageData(0, 0, w, h);
      const d = id.data;

      // Sample solid dark-teal background color from top-left corner
      const bgR = d[0], bgG = d[1], bgB = d[2];
      const isBg = (idx) => {
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 42;
      };

      // BFS flood-fill from borders to remove dark-teal background cleanly
      const visited = new Uint8Array(w * h);
      const removed = new Uint8Array(w * h);
      const q = new Int32Array(w * h);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= w || y >= h) return;
        const p = y * w + x;
        if (visited[p]) return;
        if (isBg(p * 4)) {
          visited[p] = 1;
          removed[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < w; x++) { enq(x, 0); enq(x, h - 1); }
      for (let y = 0; y < h; y++) { enq(0, y); enq(w - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % w, y = (p - x) / w;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }

      // Remove enclosed interior teal gaps (between legs / arms / blades)
      for (let p = 0; p < w * h; p++) {
        if (!removed[p]) {
          const idx = p * 4;
          const r = d[idx], g = d[idx + 1], b = d[idx + 2];
          if (Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB) < 28) {
            d[idx + 3] = 0;
            removed[p] = 1;
          }
        }
      }
      octx.putImageData(id, 0, 0);

      // Auto-detect the 3 horizontal sprite segments so zero blade tips get clipped!
      const colHasPx = new Uint8Array(w);
      for (let x = 0; x < w; x++) {
        let count = 0;
        for (let y = 0; y < h; y++) {
          if (d[(y * w + x) * 4 + 3] > 20) count++;
        }
        if (count >= 4) colHasPx[x] = 1;
      }

      const spans = [];
      let inSpan = false, sStart = 0;
      for (let x = 0; x < w; x++) {
        if (colHasPx[x] && !inSpan) {
          inSpan = true;
          sStart = x;
        } else if (!colHasPx[x] && inSpan) {
          inSpan = false;
          if (x - sStart > 30) spans.push([sStart, x - 1]);
        }
      }
      if (inSpan && w - sStart > 30) spans.push([sStart, w - 1]);

      // Fallback splits if spans weren't cleanly separated
      const finalSpans =
        spans.length >= 3
          ? [spans[0], spans[1], spans[spans.length - 1]]
          : [
              [0, Math.floor(w * 0.21)],
              [Math.floor(w * 0.21), Math.floor(w * 0.52)],
              [Math.floor(w * 0.52), w - 1],
            ];

      const names = ["samurai_dual_idle", "samurai_dual_dash", "samurai_dual_cross"];
      finalSpans.forEach(([x0, x1], i) => {
        let minY = h, maxY = 0;
        for (let y = 0; y < h; y++) {
          for (let x = x0; x <= x1; x++) {
            if (d[(y * w + x) * 4 + 3] > 20) {
              if (y < minY) minY = y;
              if (y > maxY) maxY = y;
            }
          }
        }
        const cw = x1 - x0 + 1;
        const ch = Math.max(1, maxY - minY + 1);
        const c = document.createElement("canvas");
        c.width = cw;
        c.height = ch;
        c.getContext("2d").drawImage(off, x0, minY, cw, ch, 0, 0, cw, ch);
        this.images[names[i]] = c;
      });
      this.readyCount++;
    };
    img.src = src;
  }

  loadRaw(name, src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      this.images[name] = img;
      this.readyCount++;
    };
    img.src = src;
  }

  ensureRaw(name, src) {
    if (!this._loadingKeys) this._loadingKeys = new Set();
    if (this.images[name] || this._loadingKeys.has(name)) return;
    this._loadingKeys.add(name);
    const img = new Image();
    img.onload = () => {
      this.images[name] = img;
    };
    img.src = src;
  }

  // Build a Tall Scrollable World Map (1376x1480):
  // Top half (0..768) = 100% untouched original 2-island map (Island 1 Left, Bio-Island Right)
  // Bottom half (768..1480) = Seamless ocean continuation + HUGE clean Taiwan Island below Island 1!
  loadTallScrollableWorldMap(topSrc, taiwanSrc) {
    this.totalCount++;
    const topImg = new Image();
    const twImg = new Image();
    let loaded = 0;

    const onBothLoaded = () => {
      loaded++;
      if (loaded < 2) return;

      const W = 1376;
      const topH = 768;
      const H = 1480;

      // Sample exact bottom-edge ocean color of topImg for a 100% invisible transition!
      const tmp = document.createElement("canvas");
      tmp.width = topImg.width;
      tmp.height = topImg.height;
      const tctx = tmp.getContext("2d", { willReadFrequently: true });
      tctx.drawImage(topImg, 0, 0);
      const sample = tctx.getImageData(Math.floor(topImg.width * 0.5), topImg.height - 6, 1, 1).data;
      const ocR = sample[0], ocG = sample[1], ocB = sample[2];

      const out = document.createElement("canvas");
      out.width = W;
      out.height = H;
      const ctx = out.getContext("2d");

      // 1. Seamless ocean base for full tall map
      ctx.fillStyle = `rgb(${ocR}, ${ocG}, ${ocB})`;
      ctx.fillRect(0, 0, W, H);

      // 2. Top half: 100% untouched original 2-island World Map!
      ctx.drawImage(topImg, 0, 0, W, topH);

      // Scatter matching pixel wave crests across the southern ocean below y = 768
      ctx.fillStyle = "rgba(186, 230, 253, 0.58)";
      for (let i = 0; i < 85; i++) {
        const wx = ((i * 211 + 37) % (W - 40)) + 20;
        const wy = topH + 18 + ((i * 97 + 29) % (H - topH - 40));
        ctx.fillRect(wx, wy, 10, 3);
        ctx.fillRect(wx + 12, wy + 2, 6, 3);
      }

      // 3. Extract ONLY Taiwan Island cleanly via BFS ocean removal (zero Island-1 corner!)
      const sx = 548, sy = 404, sw = 224, sh = 356;
      const buf = document.createElement("canvas");
      buf.width = sw;
      buf.height = sh;
      const bctx = buf.getContext("2d", { willReadFrequently: true });
      bctx.drawImage(twImg, sx, sy, sw, sh, 0, 0, sw, sh);
      const id = bctx.getImageData(0, 0, sw, sh);
      const d = id.data;

      // Clear top-left triangle where Island 1's coast slightly overlapped the crop box
      for (let y = 0; y < 145; y++) {
        for (let x = 0; x < 105 - y * 0.7; x++) {
          d[(y * sw + Math.floor(x)) * 4 + 3] = 0;
        }
      }

      const isOcean = (idx) => {
        if (d[idx + 3] === 0) return true;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        return Math.abs(r - ocR) + Math.abs(g - ocG) + Math.abs(b - ocB) < 68;
      };
      const visited = new Uint8Array(sw * sh);
      const q = new Int32Array(sw * sh);
      let qh = 0, qt = 0;
      const enq = (x, y) => {
        if (x < 0 || y < 0 || x >= sw || y >= sh) return;
        const p = y * sw + x;
        if (visited[p]) return;
        if (isOcean(p * 4)) {
          visited[p] = 1;
          d[p * 4 + 3] = 0;
          q[qt++] = p;
        }
      };
      for (let x = 0; x < sw; x++) { enq(x, 0); enq(x, sh - 1); }
      for (let y = 0; y < sh; y++) { enq(0, y); enq(sw - 1, y); }
      while (qh < qt) {
        const p = q[qh++];
        const x = p % sw, y = (p - x) / sw;
        enq(x + 1, y); enq(x - 1, y); enq(x, y + 1); enq(x, y - 1);
      }
      bctx.putImageData(id, 0, 0);

      // Draw HUGE, CLEAN Taiwan Island right below Island 1 in the southern ocean!
      ctx.save();
      ctx.translate(360, 1085);
      ctx.drawImage(buf, -185, -280, 370, 560);
      ctx.restore();

      this.images["map_island"] = out;
      this.readyCount++;
    };

    topImg.onload = onBothLoaded;
    twImg.onload = onBothLoaded;
    topImg.src = topSrc;
    twImg.src = taiwanSrc;
  }

  loadSprite(name, src) {
    this.totalCount++;
    const img = new Image();
    img.onload = () => {
      this.images[name] = this.processChromaKey(img);
      this.readyCount++;
    };
    img.src = src;
  }

  // Helper: Render a 52x52 native 32-bit pixelated circular button icon & export crisp 3x DataURL
  makePixelButtonIcon(drawFn) {
    const pSize = 52;
    const small = document.createElement("canvas");
    small.width = pSize;
    small.height = pSize;
    const sctx = small.getContext("2d", { willReadFrequently: true });
    sctx.imageSmoothingEnabled = false;
    drawFn(sctx, pSize);

    // Circular mask + crisp 32-bit color quantization
    const idata = sctx.getImageData(0, 0, pSize, pSize);
    const d = idata.data;
    const cx = pSize / 2;
    const cy = pSize / 2;
    const maxR = pSize * 0.49;
    for (let y = 0; y < pSize; y++) {
      for (let x = 0; x < pSize; x++) {
        const idx = (y * pSize + x) * 4;
        if (Math.hypot(x + 0.5 - cx, y + 0.5 - cy) > maxR) {
          d[idx + 3] = 0;
          continue;
        }
        d[idx] = Math.min(255, Math.round(d[idx] / 16) * 16);
        d[idx + 1] = Math.min(255, Math.round(d[idx + 1] / 16) * 16);
        d[idx + 2] = Math.min(255, Math.round(d[idx + 2] / 16) * 16);
      }
    }
    sctx.putImageData(idata, 0, 0);

    const out = document.createElement("canvas");
    out.width = pSize * 3;
    out.height = pSize * 3;
    const octx = out.getContext("2d");
    octx.imageSmoothingEnabled = false;
    octx.drawImage(small, 0, 0, out.width, out.height);
    return out.toDataURL("image/png");
  }

  drawJumpArrows(ctx, pSize) {
    // Deep electric blue speed background + two bright cyan upward arrows (matches Momo's Jump style!)
    const bg = ctx.createLinearGradient(0, pSize, pSize, 0);
    bg.addColorStop(0, "#041226");
    bg.addColorStop(0.55, "#0b3a66");
    bg.addColorStop(1, "#0284c7");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, pSize, pSize);

    // Glowing diagonal speed lines
    ctx.strokeStyle = "rgba(125, 211, 252, 0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(6, 46); ctx.lineTo(26, 22);
    ctx.moveTo(18, 48); ctx.lineTo(44, 16);
    ctx.stroke();

    // Two crisp upward arrows on right side
    const drawArrow = (x, y, s) => {
      ctx.fillStyle = "#e0f2fe";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + s, y + s);
      ctx.lineTo(x + s * 0.42, y + s);
      ctx.lineTo(x + s * 0.42, y + s * 2.5);
      ctx.lineTo(x - s * 0.42, y + s * 2.5);
      ctx.lineTo(x - s * 0.42, y + s);
      ctx.lineTo(x - s, y + s);
      ctx.closePath();
      ctx.fill();
    };
    drawArrow(38, 12, 6);
    drawArrow(43, 24, 5);
  }

  tryBuildMustacheButtons() {
    const norm = this.images["hero_mustache_normal"];
    const buff = this.images["hero_mustache_buff"];
    if (!norm || !buff) return;

    // 1. MUSTACHE ULT: Gold Lightning Aura + Buff Mustache Close-Up!
    const ultUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#f59e0b");
      bg.addColorStop(0.6, "#78350f");
      bg.addColorStop(1, "#1c1917");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Electric blue-gold lightning bolts behind hero
      c.strokeStyle = "#38bdf8";
      c.lineWidth = 2;
      c.beginPath();
      c.moveTo(6, 12); c.lineTo(16, 20); c.lineTo(10, 28); c.lineTo(20, 38);
      c.moveTo(46, 10); c.lineTo(36, 20); c.lineTo(42, 28); c.lineTo(32, 38);
      c.stroke();
      // Buff hero upper body & mustache portrait
      const cropH = buff.height * 0.62;
      const cropW = Math.min(buff.width, cropH * 1.05);
      const cropX = (buff.width - cropW) / 2;
      c.drawImage(buff, cropX, 0, cropW, cropH, 5, 4, 42, 44);
    });

    // 2. MUSTACHE JUMP: Cyan Speed Arrows + Leaping Mustache Hero!
    const jumpUrl = this.makePixelButtonIcon((c, s) => {
      this.drawJumpArrows(c, s);
      c.save();
      c.translate(22, 27);
      c.rotate(-0.18);
      const th = 38;
      const tw = (norm.width / norm.height) * th;
      c.drawImage(norm, -tw / 2, -th / 2, tw, th);
      c.restore();
    });

    // 3. MUSTACHE ATTACK: Crimson/Gold Impact Burst + Armored Power Punch!
    const atkUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(34, 24, 3, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#fef08a");
      bg.addColorStop(0.35, "#dc2626");
      bg.addColorStop(1, "#2a0808");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Impact shockwave rings
      c.strokeStyle = "#fde047";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(35, 24, 12, 0, Math.PI * 2);
      c.stroke();
      // Hero punching silhouette + glowing golden fist
      const cropH = buff.height * 0.68;
      c.drawImage(buff, 0, buff.height * 0.08, buff.width, cropH, 2, 7, 44, 40);
      // Extra glowing punch flare
      c.fillStyle = "rgba(254, 240, 138, 0.85)";
      c.fillRect(34, 20, 8, 8);
      c.fillStyle = "#ffffff";
      c.fillRect(36, 22, 4, 4);
    });

    document.documentElement.style.setProperty("--mustache-btn-ult", `url(${ultUrl})`);
    document.documentElement.style.setProperty("--mustache-btn-jump", `url(${jumpUrl})`);
    document.documentElement.style.setProperty("--mustache-btn-atk", `url(${atkUrl})`);
  }

  tryBuildSamuraiButtons() {
    const idle = this.images["hero_samurai_idle"];
    const slash = this.images["hero_samurai_slash"];
    if (!idle || !slash) return;

    // 1. SAMURAI ULT: Swirling Cyan/Gold Sword-Qi Vortex + Street Samurai Portrait!
    const ultUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(s / 2, s / 2, 4, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#0ea5e9");
      bg.addColorStop(0.55, "#1e1b4b");
      bg.addColorStop(1, "#090d16");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Swirling sword-qi crescent arcs
      c.strokeStyle = "#fde047";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(s / 2, s / 2, 20, -2.5, -0.4);
      c.stroke();
      c.strokeStyle = "#38bdf8";
      c.beginPath();
      c.arc(s / 2, s / 2, 18, 0.5, 2.6);
      c.stroke();
      // Samurai close-up headshot (curly hair + black glasses)
      const cropH = idle.height * 0.56;
      const cropW = Math.min(idle.width, cropH * 1.05);
      const cropX = (idle.width - cropW) / 2;
      c.drawImage(idle, cropX, 0, cropW, cropH, 5, 5, 42, 43);
    });

    // 2. SAMURAI JUMP: Cyan Speed Arrows + Leaping Street Samurai!
    const jumpUrl = this.makePixelButtonIcon((c, s) => {
      this.drawJumpArrows(c, s);
      c.save();
      c.translate(22, 27);
      c.rotate(-0.18);
      const th = 38;
      const tw = (idle.width / idle.height) * th;
      c.drawImage(idle, -tw / 2, -th / 2, tw, th);
      c.restore();
    });

    // 3. SAMURAI ATTACK: Crimson Slash Backdrop + Katana Horizontal Slash!
    const atkUrl = this.makePixelButtonIcon((c, s) => {
      const bg = c.createRadialGradient(34, 24, 3, s / 2, s / 2, s * 0.55);
      bg.addColorStop(0, "#fb7185");
      bg.addColorStop(0.45, "#881337");
      bg.addColorStop(1, "#18050d");
      c.fillStyle = bg;
      c.fillRect(0, 0, s, s);
      // Samurai slashing sprite
      const th = 42;
      const tw = (slash.width / slash.height) * th;
      c.drawImage(slash, 24 - tw * 0.5, 6, tw, th);
      // Blazing white-cyan katana crescent slash arc across button!
      c.strokeStyle = "#fda4af";
      c.lineWidth = 4;
      c.beginPath();
      c.arc(24, 26, 20, -1.0, 0.85);
      c.stroke();
      c.strokeStyle = "#ffffff";
      c.lineWidth = 2;
      c.beginPath();
      c.arc(25, 26, 19, -0.9, 0.75);
      c.stroke();
    });

    document.documentElement.style.setProperty("--samurai-btn-ult", `url(${ultUrl})`);
    document.documentElement.style.setProperty("--samurai-btn-jump", `url(${jumpUrl})`);
    document.documentElement.style.setProperty("--samurai-btn-atk", `url(${atkUrl})`);
  }

  // BFS Flood-Fill Magenta (#FF00FF) removal + Edge Despill + Tight Auto-Crop
  processChromaKey(img) {
    const maxDim = 320;
    const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));

    const off = document.createElement("canvas");
    off.width = w;
    off.height = h;
    const octx = off.getContext("2d", { willReadFrequently: true });
    octx.drawImage(img, 0, 0, w, h);

    const imgData = octx.getImageData(0, 0, w, h);
    const d = imgData.data;

    // Sample corner color as reference background
    const bgR = d[0], bgG = d[1], bgB = d[2];

    const isMagentaBg = (idx) => {
      const r = d[idx], g = d[idx + 1], b = d[idx + 2];
      // Strong magenta chroma-key check OR close to sampled corner color
      const magentaScore = (r - g) + (b - g);
      if (r > 120 && b > 120 && g < 135 && magentaScore > 95) return true;
      const distCorner = Math.abs(r - bgR) + Math.abs(g - bgG) + Math.abs(b - bgB);
      return distCorner < 72 && r > g + 30 && b > g + 30;
    };

    const visited = new Uint8Array(w * h);
    const removed = new Uint8Array(w * h);
    const queue = new Int32Array(w * h);
    let qHead = 0;
    let qTail = 0;

    const tryEnqueue = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (visited[p]) return;
      if (isMagentaBg(p * 4)) {
        visited[p] = 1;
        removed[p] = 1;
        queue[qTail++] = p;
      }
    };

    // Seed flood-fill from all 4 edges
    for (let x = 0; x < w; x++) {
      tryEnqueue(x, 0);
      tryEnqueue(x, h - 1);
    }
    for (let y = 0; y < h; y++) {
      tryEnqueue(0, y);
      tryEnqueue(w - 1, y);
    }

    while (qHead < qTail) {
      const p = queue[qHead++];
      const x = p % w;
      const y = (p - x) / w;
      tryEnqueue(x + 1, y);
      tryEnqueue(x - 1, y);
      tryEnqueue(x, y + 1);
      tryEnqueue(x, y - 1);
    }

    // Also remove any enclosed interior magenta pockets (e.g. between legs/arms)
    for (let p = 0; p < w * h; p++) {
      if (!removed[p]) {
        const idx = p * 4;
        const r = d[idx], g = d[idx + 1], b = d[idx + 2];
        if (r > 180 && b > 180 && g < 85 && (r - g) > 110 && (b - g) > 110) {
          removed[p] = 1;
        }
      }
    }

    // Apply alpha removal + 1px edge despill to eliminate any pink fringe
    let minX = w, minY = h, maxX = 0, maxY = 0;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const p = y * w + x;
        const idx = p * 4;
        if (removed[p]) {
          d[idx + 3] = 0;
        } else {
          // Check if adjacent to removed pixel
          const nearBg =
            (x > 0 && removed[p - 1]) ||
            (x < w - 1 && removed[p + 1]) ||
            (y > 0 && removed[p - w]) ||
            (y < h - 1 && removed[p + w]);
          if (nearBg) {
            const r = d[idx], g = d[idx + 1], b = d[idx + 2];
            if (r > g + 22 && b > g + 22) {
              // Soften & neutralize magenta fringe
              const excess = Math.min(r - g, b - g);
              if (excess > 55) {
                d[idx + 3] = 0;
                continue;
              }
              d[idx] = Math.max(0, r - excess);
              d[idx + 2] = Math.max(0, b - excess);
              d[idx + 3] = 210;
            }
          }
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }

    octx.putImageData(imgData, 0, 0);

    // Tight crop to opaque bounding box
    if (maxX <= minX || maxY <= minY) return off;
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const cropped = document.createElement("canvas");
    cropped.width = cw;
    cropped.height = ch;
    cropped.getContext("2d").drawImage(off, minX, minY, cw, ch, 0, 0, cw, ch);
    return cropped;
  }
}

window.sprites = new SpriteBank();
