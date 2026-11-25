// Island 1 — Stage 3: 《末班機 (LAST FLIGHT)》 Cinematic Helicopter Intro & Dual-Boss Choreography
// Bosses: 短髮・「鐵拳」(Iron Fist) & 長髮・「夜鷺」(Night Heron) + 合體技「末班起飛」
window.AirportStage = {
  // Cutscene & Duo State
  introTimer: 0,
  heliY: -120,
  heliDoorOpen: false,
  heliDoorSlammed: false,
  heronWatching: true,
  ironFistComboCount: 0,
  teamComboDoneOnce: false,
  teamComboCooldown: 0,
  teamCombo: null, // { phase, timer, targetX, targetY, reticleR, hitHeron, hitIron }
  waterSplashes: [],
  rainDrops: [],

  init() {
    this.introTimer = 0;
    this.heliY = -115;
    this.heliDoorOpen = false;
    this.heliDoorSlammed = false;
    this.heronWatching = true;
    this.ironFistComboCount = 0;
    this.teamComboDoneOnce = false;
    this.teamComboCooldown = 0;
    this.teamCombo = null;
    this.waterSplashes = [];
    this.rainDrops = [];
    for (let i = 0; i < 42; i++) {
      this.rainDrops.push({
        x: Math.random() * 640,
        y: Math.random() * 360,
        len: 8 + Math.random() * 10,
        spd: 7 + Math.random() * 4,
      });
    }
  },

  // Update Helicopter Landing & Disembark Cutscene
  updateIntro(enemies, spawnText, triggerShake, onFinish) {
    this.introTimer++;
    const iron = enemies.find((e) => e.type === "boss_ironfist");
    const heron = enemies.find((e) => e.type === "boss_nightheron");

    // 1. Black Helicopter descends slowly from top of screen (frames 1..95)
    if (this.introTimer <= 95) {
      const t = this.introTimer / 95;
      const ease = 1 - Math.pow(1 - t, 3);
      this.heliY = -115 + ease * 255; // lands at y = 140
      if (this.introTimer % 10 === 0) {
        window.sound.heliRotorPulse();
      }
      if (iron) {
        iron.x = 435;
        iron.y = 248;
        iron.z = Math.max(0, 140 - this.heliY + 20);
        iron.hidden = true;
      }
      if (heron) {
        heron.x = 498;
        heron.y = 246;
        heron.z = Math.max(0, 140 - this.heliY + 20);
        heron.hidden = true;
      }
    }
    // 2. Cabin door slides open -> 鐵拳 drops out first tightening his white bandages (96..150)
    else if (this.introTimer <= 150) {
      if (this.introTimer === 96) {
        this.heliDoorOpen = true;
        if (iron) {
          iron.hidden = false;
          iron.z = 36;
          iron.vz = 0;
        }
        spawnText("艙門開啟...", 460, 156, "#94a3b8", 0.95);
      }
      if (iron) {
        if (iron.z > 0) iron.z = Math.max(0, iron.z - 4);
        iron.x = Math.max(385, iron.x - 1.0);
        iron.y = Math.min(278, iron.y + 0.6);
        iron.walkFrame += 0.16;
      }
      if (this.introTimer === 120) {
        spawnText("鐵拳：拉緊白繃帶...", 395, 192, "#e2e8f0", 0.95);
      }
    }
    // 3. 夜鷺 lands a beat later, hands in pockets, kicks cabin door shut with burgundy heel! (151..218)
    else if (this.introTimer <= 218) {
      if (this.introTimer === 151 && heron) {
        heron.hidden = false;
        heron.z = 36;
      }
      if (heron) {
        if (heron.z > 0) heron.z = Math.max(0, heron.z - 3.5);
        heron.x = Math.min(542, heron.x + 0.85);
        heron.y = Math.min(256, heron.y + 0.25);
        heron.walkFrame += 0.12;
      }
      // Frame 192: Night Heron kicks the cabin door shut with his burgundy heel -> "喀!" START SIGNAL!
      if (this.introTimer === 192) {
        this.heliDoorOpen = false;
        this.heliDoorSlammed = true;
        window.sound.doorSlamClick();
        triggerShake(10, 4);
        spawnText("喀！！ (開戰！)", 475, 152, "#fcd34d", 1.35);
      }
    } else {
      onFinish();
    }
  },

  // Interrupt 合體技「末班起飛」 if player hits 鐵拳 during setup!
  tryInterruptTeamCombo(hitEnemy, spawnText, spawnParticles, triggerShake) {
    if (!this.teamCombo || this.teamCombo.phase !== "setup") return false;
    if (hitEnemy.type !== "boss_ironfist") return false;

    const { iron, heron } = this.teamCombo;
    this.teamCombo = null;
    this.teamComboCooldown = 420;
    window.sound.comboBreak();
    triggerShake(16, 6);
    spawnParticles(iron.x, iron.y, 34, "#fcd34d", 22, 4.5, 24);
    spawnText("合體技打斷！BREAK!", iron.x, iron.y - 86, "#fcd34d", 1.3);
    iron.hurtTimer = 58;
    iron.knockdownTimer = 36;
    if (heron && !heron.dead) {
      heron.hurtTimer = 46;
      spawnText("嘖...被打斷了", heron.x, heron.y - 78, "#93c5fd", 0.95);
    }
    return true;
  },

  // Update Dual-Boss AI & 合體技「末班起飛」
  updateDualBosses(enemies, player, helpers) {
    const {
      isBuff,
      spawnParticles,
      spawnText,
      triggerShake,
      damagePlayer,
    } = helpers;

    // Update water splash arcs
    for (let i = this.waterSplashes.length - 1; i >= 0; i--) {
      const ws = this.waterSplashes[i];
      ws.x += ws.vx;
      ws.life--;
      if (ws.life <= 0) this.waterSplashes.splice(i, 1);
    }

    const iron = enemies.find((e) => e.type === "boss_ironfist" && !e.dead);
    const heron = enemies.find((e) => e.type === "boss_nightheron" && !e.dead);

    // If one boss dies while team combo is active, cancel team combo permanently!
    if (this.teamCombo && (!iron || !heron)) {
      this.teamCombo = null;
      if (iron) { iron.z = 0; iron.vz = 0; }
      if (heron) { heron.z = 0; heron.vz = 0; }
    }

    // Check if Night Heron stops watching and joins the fight!
    if (this.heronWatching && heron) {
      const ironHalfLost = !iron || iron.hp <= iron.maxHp - 65;
      if (this.ironFistComboCount >= 1 || ironHalfLost) {
        this.heronWatching = false;
        window.sound.heelTap();
        spawnText("叩！夜鷺：輪到我了。", heron.x, heron.y - 82, "#93c5fd", 1.1);
        this.waterSplashes.push({ x: heron.x, y: heron.y, vx: 0, r: 22, life: 18, maxLife: 18, ring: true });
      }
    }

    // Trigger 合體技「末班起飛」 when BOTH alive & either drops to <= 50% HP!
    if (iron && heron && !this.heronWatching && !this.teamCombo) {
      if (this.teamComboCooldown > 0) this.teamComboCooldown--;
      const eitherHalf = iron.hp <= iron.maxHp * 0.5 || heron.hp <= heron.maxHp * 0.5;
      if (eitherHalf && (!this.teamComboDoneOnce || this.teamComboCooldown <= 0)) {
        this.teamComboDoneOnce = true;
        this.teamComboCooldown = 660;
        this.teamCombo = {
          phase: "setup",
          timer: 62, // Generous window to either interrupt Iron Fist or prepare to dodge!
          iron,
          heron,
          targetX: player.x,
          targetY: player.y,
          reticleR: 72,
          hitHeron: false,
          hitIron: false,
        };
        iron.aiState = "team";
        heron.aiState = "team";
        window.sound.heelDoubleTap();
        spawnText("合體技【末班起飛】!", (iron.x + heron.x) * 0.5, 118, "#fcd34d", 1.3);
        spawnText("叩！叩！", heron.x, heron.y - 78, "#fda4af", 1.05);
        spawnText("蹲低交掌！(可打斷!)", iron.x, iron.y - 74, "#fbbf24", 0.95);
      }
    }

    // --- ACTIVE TEAM COMBO STATE MACHINE: 合體技「末班起飛」 ---
    if (this.teamCombo) {
      const tc = this.teamCombo;
      tc.timer--;
      const ir = tc.iron;
      const hr = tc.heron;

      if (tc.phase === "setup") {
        // Iron Fist crouches low; Night Heron steps back 2 paces
        ir.facing = player.x >= ir.x ? 1 : -1;
        hr.x += (ir.x + (ir.facing > 0 ? -56 : 56) - hr.x) * 0.1;
        hr.y += (ir.y - hr.y) * 0.1;
        hr.facing = ir.x >= hr.x ? 1 : -1;
        if (tc.timer <= 0) {
          tc.phase = "launch";
          tc.timer = 46;
          tc.targetX = player.x;
          tc.targetY = player.y;
          window.sound.jump();
          spawnText("起飛！", ir.x, ir.y - 82, "#38bdf8", 1.15);
        }
      } else if (tc.phase === "launch") {
        // Night Heron steps onto Iron Fist's palms & gets hurled sky-high!
        hr.x += (ir.x - hr.x) * 0.18;
        hr.z = Math.min(180, hr.z + 7.5);
        // Shrinking landing reticle tracks player for first half, then LOCKS!
        if (tc.timer > 18) {
          tc.targetX += (player.x - tc.targetX) * 0.16;
          tc.targetY += (player.y - tc.targetY) * 0.16;
        }
        tc.reticleR = 26 + (tc.timer / 46) * 48;
        if (tc.timer <= 0) {
          tc.phase = "heron_dive";
          tc.timer = 18;
          window.sound.bossDiveSwoop();
        }
      } else if (tc.phase === "heron_dive") {
        // Night Heron streaks down diagonally with a diving kick into the reticle!
        hr.x += (tc.targetX - hr.x) * 0.28;
        hr.y += (tc.targetY - hr.y) * 0.28;
        hr.z = Math.max(0, hr.z - 12);
        spawnParticles(hr.x, hr.y, hr.z + 20, "#38bdf8", 2, 2, 10);
        if (hr.z <= 0 || tc.timer <= 0) {
          hr.z = 0;
          hr.x = tc.targetX - 10;
          hr.y = tc.targetY;
          window.sound.waterSweep();
          triggerShake(12, 5);
          spawnParticles(tc.targetX, tc.targetY, 16, "#38bdf8", 18, 4.2, 20);
          if (!tc.hitHeron && Math.hypot(player.x - tc.targetX, (player.y - tc.targetY) * 1.6) < 56) {
            tc.hitHeron = true;
            damagePlayer(15, "夜鷺斜踢!");
          }
          // Half-beat later -> Iron Fist dash punch to the EXACT same landing center!
          tc.phase = "iron_dash";
          tc.timer = 18;
          ir.facing = tc.targetX >= ir.x ? 1 : -1;
        }
      } else if (tc.phase === "iron_dash") {
        // Iron Fist rockets straight into the landing center!
        ir.x += (tc.targetX + 12 - ir.x) * 0.28;
        ir.y += (tc.targetY - ir.y) * 0.28;
        spawnParticles(ir.x, ir.y, 26, "#f8fafc", 2, 2, 10);
        if (tc.timer <= 0 || Math.hypot(ir.x - tc.targetX, ir.y - tc.targetY) < 18) {
          ir.x = tc.targetX + 14;
          ir.y = tc.targetY;
          window.sound.bossDiveImpact();
          triggerShake(16, 6);
          spawnParticles(tc.targetX, tc.targetY, 20, "#fcd34d", 22, 4.8, 22);
          if (!tc.hitIron && Math.hypot(player.x - tc.targetX, (player.y - tc.targetY) * 1.6) < 62) {
            tc.hitIron = true;
            damagePlayer(17, "鐵拳衝拳!");
          }
          tc.phase = "recover";
          tc.timer = 64; // Big double-punish window where BOTH bosses stand right together!
          spawnText("雙人收招空檔！快反擊！", tc.targetX, tc.targetY - 88, "#4ade80", 1.1);
        }
      } else if (tc.phase === "recover") {
        // Both bosses recovering side-by-side in the landing circle!
        if (tc.timer <= 0) {
          ir.aiState = "idle";
          hr.aiState = "idle";
          this.teamCombo = null;
        }
      }
      return;
    }

    // --- INDIVIDUAL AI 1: 短髮・「鐵拳」(Iron Fist — 2 Fast Punches + Half-Beat Feint + Heavy 3rd Punch!) ---
    if (iron && iron.hurtTimer <= 0 && iron.knockdownTimer <= 0) {
      const dx = player.x - iron.x;
      const dy = player.y - iron.y;
      iron.facing = dx >= 0 ? 1 : -1;

      if (!iron.aiState || iron.aiState === "idle" || iron.aiState === "team") {
        if (iron.attackCooldown > 0) iron.attackCooldown--;
        if (Math.abs(dx) > 52 || Math.abs(dy) > 16) {
          const dist = Math.hypot(dx, dy) || 1;
          iron.x += (dx / dist) * iron.speed;
          iron.y += (dy / dist) * (iron.speed * 0.72);
          iron.walkFrame += 0.17;
        } else if (iron.attackCooldown <= 0) {
          iron.aiState = "punch1";
          iron.aiTimer = 14;
          iron.attackHitDone = false;
        }
      } else if (iron.aiState === "punch1") {
        iron.aiTimer--;
        iron.attackTimer = 10;
        if (!iron.attackHitDone && iron.aiTimer === 6) {
          window.sound.punchSwing();
          if (Math.abs(dx) < 58 && Math.abs(dy) < 24 && player.z < 20) {
            iron.attackHitDone = true;
            damagePlayer(8, "鐵拳快拳!");
          }
        }
        if (iron.aiTimer <= 0) {
          iron.aiState = "punch2";
          iron.aiTimer = 14;
          iron.attackHitDone = false;
        }
      } else if (iron.aiState === "punch2") {
        iron.aiTimer--;
        iron.attackTimer = 10;
        if (!iron.attackHitDone && iron.aiTimer === 6) {
          window.sound.punchSwing();
          if (Math.abs(dx) < 60 && Math.abs(dy) < 24 && player.z < 20) {
            iron.attackHitDone = true;
            damagePlayer(8, "鐵拳連拳!");
          }
        }
        if (iron.aiTimer <= 0) {
          // Half-beat feint pause! Pulls white-bandaged right fist to his hip to bait early punishes!
          iron.aiState = "feint_pause";
          iron.aiTimer = 28;
          iron.attackTimer = 0;
          spawnText("蓄力停頓...", iron.x, iron.y - 78, "#f8fafc", 0.9);
        }
      } else if (iron.aiState === "feint_pause") {
        iron.aiTimer--;
        if (iron.aiTimer <= 0) {
          iron.aiState = "punch3";
          iron.aiTimer = 20;
          iron.attackHitDone = false;
          iron.vx = iron.facing * 5.2; // Lunging heavy 3rd punch!
        }
      } else if (iron.aiState === "punch3") {
        iron.aiTimer--;
        iron.attackTimer = 12;
        if (!iron.attackHitDone && iron.aiTimer === 12) {
          window.sound.punchHit(true);
          spawnParticles(iron.x + iron.facing * 32, iron.y, 34, "#f8fafc", 10, 3.2, 16);
          if (Math.abs(dx) < 76 && Math.abs(dy) < 26 && player.z < 24) {
            iron.attackHitDone = true;
            damagePlayer(15, "鐵拳重擊!");
          }
        }
        if (iron.aiTimer <= 0) {
          this.ironFistComboCount++;
          iron.aiState = "recover";
          iron.aiTimer = 40; // Punish window after 3rd punch whiffs!
          iron.attackTimer = 0;
        }
      } else if (iron.aiState === "recover") {
        iron.aiTimer--;
        if (iron.aiTimer <= 0) {
          iron.aiState = "idle";
          iron.attackCooldown = 48;
        }
      }
      iron.y = Math.max(232, Math.min(312, iron.y));
    }

    // --- INDIVIDUAL AI 2: 長髮・「夜鷺」(Night Heron — Hands in Pockets, Heel Tap -> Low Water-Splash Sweep!) ---
    if (heron && heron.hurtTimer <= 0 && heron.knockdownTimer <= 0) {
      if (this.heronWatching) {
        // Coolly leaning near the luggage suitcases watching Iron Fist's first round
        heron.facing = player.x >= heron.x ? 1 : -1;
        return;
      }

      const dx = player.x - heron.x;
      const dy = player.y - heron.y;
      heron.facing = dx >= 0 ? 1 : -1;

      if (!heron.aiState || heron.aiState === "idle" || heron.aiState === "team") {
        if (heron.attackCooldown > 0) heron.attackCooldown--;
        if (Math.abs(dx) > 92 || Math.abs(dy) > 18) {
          const dist = Math.hypot(dx, dy) || 1;
          heron.x += (dx / dist) * heron.speed;
          heron.y += (dy / dist) * (heron.speed * 0.75);
          heron.walkFrame += 0.15;
        } else if (heron.attackCooldown <= 0) {
          // Telegraph: Burgundy heel tap on wet tarmac! ("叩!" -> Player hears it and JUMPS!)
          heron.aiState = "heel_tap";
          heron.aiTimer = 26;
          window.sound.heelTap();
          spawnText("叩！(快跳!)", heron.x, heron.y - 80, "#38bdf8", 1.05);
          this.waterSplashes.push({ x: heron.x, y: heron.y, vx: 0, r: 26, life: 20, maxLife: 20, ring: true });
        }
      } else if (heron.aiState === "heel_tap") {
        heron.aiTimer--;
        if (heron.aiTimer <= 0) {
          heron.aiState = "water_sweep";
          heron.aiTimer = 20;
          heron.attackHitDone = false;
          window.sound.waterSweep();
          // Kick up a glowing arc of water spray along the ground!
          for (let s = 0; s < 7; s++) {
            this.waterSplashes.push({
              x: heron.x + heron.facing * (12 + s * 14),
              y: heron.y + (Math.random() - 0.5) * 14,
              vx: heron.facing * 2.4,
              r: 10 + Math.random() * 8,
              life: 18,
              maxLife: 18,
              ring: false,
            });
          }
          spawnParticles(heron.x + heron.facing * 44, heron.y, 12, "#7dd3fc", 14, 3.8, 18);
        }
      } else if (heron.aiState === "water_sweep") {
        heron.aiTimer--;
        heron.attackTimer = 10;
        if (!heron.attackHitDone && heron.aiTimer === 13) {
          // LOW SWEEP: Only hits grounded players (player.z < 14) -> Jumping cleanly dodges!
          const inFront = (player.x - heron.x) * heron.facing;
          if (inFront > -14 && inFront < 116 && Math.abs(dy) < 32 && player.z < 14) {
            heron.attackHitDone = true;
            damagePlayer(12, "水花低掃!");
          }
        }
        if (heron.aiTimer <= 0) {
          heron.aiState = "recover";
          heron.aiTimer = 44; // Finishes spin & plants sole -> falling punish window!
          heron.attackTimer = 0;
        }
      } else if (heron.aiState === "recover") {
        heron.aiTimer--;
        if (heron.aiTimer <= 0) {
          heron.aiState = "idle";
          heron.attackCooldown = 58;
        }
      }
      heron.y = Math.max(232, Math.min(312, heron.y));
    }
  },

  // Render Rainy Airport Tarmac, Parked Black Helicopter, Water Splashes, Reticle & Rain!
  drawAirportBackground(ctx, W, H, tick) {
    const bg = window.sprites && window.sprites.get("bg_airport_tarmac");
    if (bg) {
      ctx.drawImage(bg, 0, 0, W, H);
    } else {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, W, H);
    }

    // Draw Sleek Black Tactical Helicopter (descending during intro, parked on tarmac during battle!)
    this.drawBlackHelicopter(ctx, 468, this.heliY, tick);

    // Subtle rain drizzle streaks across night airport
    ctx.strokeStyle = "rgba(186, 230, 253, 0.25)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (const r of this.rainDrops) {
      r.x -= 1.4;
      r.y += r.spd;
      if (r.y > H) { r.y = -10; r.x = Math.random() * (W + 40); }
      if (r.x < -10) r.x = W + 10;
      ctx.moveTo(r.x, r.y);
      ctx.lineTo(r.x - 2, r.y + r.len);
    }
    ctx.stroke();
  },

  // Build a crisp offscreen 16-bit/32-bit Metal-Slug-style pixel-art helicopter buffer (160x64 native pixels!)
  ensureHeliPixelCanvas() {
    if (!this._heliBuf) {
      this._heliBuf = document.createElement("canvas");
      this._heliBuf.width = 160;
      this._heliBuf.height = 68;
      this._heliCtx = this._heliBuf.getContext("2d");
      this._heliCtx.imageSmoothingEnabled = false;
    }
    return this._heliCtx;
  },

  drawBlackHelicopter(ctx, cx, cy, tick) {
    const p = this.ensureHeliPixelCanvas();
    p.clearRect(0, 0, 160, 68);

    const px = (x, y, w, h, col) => {
      p.fillStyle = col;
      p.fillRect(Math.floor(x), Math.floor(y), Math.floor(w), Math.floor(h));
    };

    // Palette matching bg_airport_tarmac.jpg & 32-bit arcade sprites
    const OUT = "#05070c";
    const BLK = "#0e131f";
    const GUN = "#1d2638";
    const MID = "#2e3c54";
    const HI = "#506485";
    const RED = "#881337";
    const GL1 = "#0f2942";
    const GL2 = "#1e4b75";
    const GL3 = "#38bdf8";
    const GL4 = "#e0f2fe";

    // --- 1. MAIN ROTOR MAST & SPINNING PIXEL BLADES ---
    px(50, 9, 6, 7, OUT);
    px(51, 10, 4, 6, MID);
    px(48, 7, 10, 3, OUT);
    px(49, 8, 8, 1, HI);
    // Red anti-collision pixel strobe
    px(52, 5, 2, 2, Math.floor(tick / 12) % 2 === 0 ? "#ef4444" : "#7f1d1d");
    // Stepped pixel-art spinning rotor blades (alternating frames for classic arcade motion!)
    const f = Math.floor(tick / 2) % 3;
    if (f === 0) {
      px(2, 7, 102, 2, "#94a3b8");
      px(10, 7, 86, 1, "#e2e8f0");
    } else if (f === 1) {
      px(14, 7, 78, 2, "#64748b");
      px(24, 7, 58, 1, "#cbd5e1");
      px(4, 8, 8, 1, "#475569");
      px(94, 8, 8, 1, "#475569");
    } else {
      px(6, 7, 94, 2, "#475569");
      px(18, 7, 70, 1, "#94a3b8");
    }

    // --- 2. TAIL BOOM & SWEPT TAIL FIN (Pixel-stepped!) ---
    px(86, 24, 58, 9, OUT);
    px(86, 25, 56, 7, BLK);
    px(86, 25, 56, 2, GUN);
    px(86, 25, 52, 1, MID);
    // Tail boom taper step
    px(110, 31, 34, 2, OUT);
    px(110, 30, 32, 1, "#090c14");
    // Pixel panel lines & rivets along tail boom
    for (let tx = 96; tx <= 132; tx += 12) {
      px(tx, 25, 1, 6, OUT);
      px(tx + 1, 26, 1, 1, HI);
    }
    // Horizontal stabilizer
    px(120, 27, 12, 3, OUT);
    px(121, 28, 10, 1, MID);
    // Vertical tail fin (stepped diagonal!)
    px(136, 12, 14, 20, OUT);
    px(138, 13, 10, 18, GUN);
    px(139, 13, 4, 16, MID);
    px(140, 10, 10, 3, OUT);
    px(141, 11, 8, 2, MID);
    px(144, 8, 2, 2, Math.floor(tick / 12) % 2 === 0 ? "#ef4444" : "#7f1d1d");
    // Shrouded tail rotor pixel cross (alternating + and x!)
    px(141, 21, 7, 7, OUT);
    px(142, 22, 5, 5, "#090d16");
    if (tick % 4 < 2) {
      px(144, 22, 1, 5, "#cbd5e1");
      px(142, 24, 5, 1, "#cbd5e1");
    } else {
      px(143, 23, 1, 1, "#cbd5e1");
      px(145, 23, 1, 1, "#cbd5e1");
      px(144, 24, 1, 1, "#ffffff");
      px(143, 25, 1, 1, "#cbd5e1");
      px(145, 25, 1, 1, "#cbd5e1");
    }

    // --- 3. TOP TURBINE ENGINE HOUSING ---
    px(36, 15, 44, 8, OUT);
    px(38, 16, 40, 6, GUN);
    px(40, 16, 34, 2, MID);
    px(42, 16, 26, 1, HI);
    // Turbine intake & exhaust louver pixels
    px(40, 18, 8, 3, OUT);
    px(41, 19, 6, 1, "#090d16");
    px(74, 17, 10, 5, OUT);
    px(75, 18, 8, 3, MID);
    px(80, 18, 3, 3, "#090d16");

    // --- 4. MAIN PIXEL-ART FUSELAGE (Stepped Tactical Silhouette!) ---
    // Outer black pixel border
    px(22, 21, 68, 26, OUT);
    px(14, 25, 12, 21, OUT);
    px(8, 31, 10, 14, OUT);
    px(5, 35, 6, 8, OUT);
    px(86, 23, 8, 20, OUT);
    // Inner matte-black/gunmetal hull fill
    px(23, 22, 65, 24, BLK);
    px(15, 26, 12, 19, BLK);
    px(9, 32, 10, 12, BLK);
    px(6, 36, 6, 6, BLK);
    px(86, 24, 6, 18, BLK);

    // Upper gunmetal bevel shading (classic 32-bit arcade 3-tone!)
    px(24, 22, 62, 6, GUN);
    px(26, 22, 58, 2, MID);
    px(30, 22, 44, 1, HI);
    // Lower chin & belly armor shading
    px(12, 41, 74, 4, GUN);
    px(16, 43, 68, 2, "#090c14");
    // Burgundy VIP pinstripe matching Bosses' ties/shoes!
    px(14, 40, 72, 2, RED);
    px(18, 40, 64, 1, "#be123c");
    // Nose spotlight pixel
    px(6, 38, 3, 2, "#fef08a");

    // --- 5. STEPPED PIXEL-ART COCKPIT CANOPY ---
    px(10, 32, 28, 7, OUT);
    px(15, 27, 23, 6, OUT);
    px(21, 23, 17, 5, OUT);
    // Glass base fill
    px(11, 33, 26, 5, GL1);
    px(16, 28, 21, 5, GL1);
    px(22, 24, 15, 4, GL2);
    // Crisp stepped pixel-art glass reflections
    px(23, 25, 4, 2, GL3);
    px(19, 28, 4, 3, GL3);
    px(15, 32, 4, 4, GL3);
    px(24, 25, 2, 1, GL4);
    px(20, 29, 2, 1, GL4);
    // Tiny glowing cockpit HUD pixels
    px(14, 36, 4, 1, "#38bdf8");
    px(20, 36, 3, 1, "#fbbf24");
    // Window mullion divider
    px(27, 24, 2, 14, OUT);

    // --- 6. SLIDING SIDE CABIN DOOR (Open Warm Interior vs Slammed Shut!) ---
    px(42, 25, 26, 18, OUT);
    if (this.heliDoorOpen) {
      // Warm amber-lit interior cabin with pixel leather seats
      px(43, 26, 24, 16, "#451a03");
      px(44, 26, 22, 6, "#92400e");
      px(45, 27, 20, 2, "#f59e0b");
      // Seat backs
      px(46, 32, 6, 9, "#1c1917");
      px(56, 32, 6, 9, "#1c1917");
      // Slid-back door panel on the right
      px(68, 25, 18, 18, OUT);
      px(69, 26, 16, 16, GUN);
      px(71, 28, 12, 6, GL1);
      px(72, 29, 4, 4, GL2);
    } else {
      // Closed armored door with tinted pixel window & chrome handle
      px(43, 26, 24, 16, GUN);
      px(43, 26, 24, 1, MID);
      px(45, 28, 20, 7, OUT);
      px(46, 29, 18, 5, GL1);
      px(48, 29, 5, 4, GL2);
      px(49, 29, 2, 2, GL3);
      // Chrome door handle
      px(45, 37, 4, 1, "#cbd5e1");
    }
    // Rear cabin porthole window
    if (!this.heliDoorOpen) {
      px(72, 28, 11, 7, OUT);
      px(73, 29, 9, 5, GL1);
      px(74, 29, 3, 3, GL2);
    }

    // --- 7. PIXEL LANDING SKIDS & STRUTS ---
    // Struts
    px(26, 46, 4, 10, OUT);
    px(27, 46, 2, 10, MID);
    px(64, 46, 4, 10, OUT);
    px(65, 46, 2, 10, MID);
    // Skid bar with upturned front toe
    px(16, 55, 62, 4, OUT);
    px(17, 56, 60, 2, MID);
    px(17, 56, 58, 1, HI);
    px(12, 52, 6, 4, OUT);
    px(13, 53, 4, 2, MID);

    // --- BLIT PIXEL-ART HELICOPTER ONTO MAIN CANVAS WITH NEAREST-NEIGHBOR CRISP PIXELS! ---
    ctx.save();
    ctx.translate(Math.floor(cx), Math.floor(cy));

    // Pixel shadow on wet tarmac
    if (cy > 50) {
      const prox = Math.min(1, Math.max(0, (cy - 50) / 100));
      ctx.fillStyle = `rgba(0, 0, 0, ${0.46 * prox})`;
      ctx.fillRect(-104, Math.floor(220 - cy), 216, 12);
      ctx.fillRect(-88, Math.floor(216 - cy), 184, 20);
    }

    // Subtle pixel-stepped headlight beam
    ctx.fillStyle = "rgba(224, 242, 254, 0.16)";
    ctx.beginPath();
    ctx.moveTo(-108, 42);
    ctx.lineTo(-220, 108);
    ctx.lineTo(-165, 134);
    ctx.closePath();
    ctx.fill();

    ctx.imageSmoothingEnabled = false;
    // Scale 160x68 native pixel buffer at exact 1.85x pixel size -> crisp 32-bit arcade pixels!
    const drawW = 296;
    const drawH = 126;
    ctx.drawImage(this._heliBuf, -120, -34, drawW, drawH);
    ctx.restore();
  },

  drawEffectsOverlay(ctx, enemies, tick) {
    // 1. Water Splash Arcs & Heel-Tap Ripples
    for (const ws of this.waterSplashes) {
      const a = Math.max(0, ws.life / ws.maxLife);
      ctx.save();
      ctx.globalAlpha = a;
      if (ws.ring) {
        ctx.strokeStyle = "#7dd3fc";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.ellipse(ws.x, ws.y, ws.r * (1.4 - a * 0.6), ws.r * 0.35, 0, 0, Math.PI * 2);
        ctx.stroke();
      } else {
        ctx.fillStyle = "#bae6fd";
        ctx.beginPath();
        ctx.arc(ws.x, ws.y - 6, ws.r * a, Math.PI, 0);
        ctx.fill();
      }
      ctx.restore();
    }

    // 2. Iron Fist Feint-Pause Glint & Team Combo Interrupt Ring
    const iron = enemies.find((e) => e.type === "boss_ironfist" && !e.dead);
    if (iron && iron.aiState === "feint_pause") {
      ctx.save();
      ctx.fillStyle = "#ffffff";
      ctx.beginPath();
      ctx.arc(iron.x - iron.facing * 12, iron.y - 38, 6 + Math.sin(tick * 0.5) * 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }

    // 3. 合體技「末班起飛」 Visuals: Interrupt Ring (setup) & Shrinking Landing Reticle (launch/dive/dash)
    if (this.teamCombo) {
      const tc = this.teamCombo;
      if (tc.phase === "setup" && tc.iron) {
        ctx.save();
        ctx.strokeStyle = "#fbbf24";
        ctx.lineWidth = 3;
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.ellipse(tc.iron.x, tc.iron.y, 38, 14, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.restore();
      } else if (tc.phase === "launch" || tc.phase === "heron_dive" || tc.phase === "iron_dash") {
        ctx.save();
        ctx.strokeStyle = tc.phase === "launch" ? "#fcd34d" : "#ef4444";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.ellipse(tc.targetX, tc.targetY, tc.reticleR, tc.reticleR * 0.38, 0, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = tc.phase === "launch" ? "rgba(252, 211, 77, 0.16)" : "rgba(239, 68, 68, 0.28)";
        ctx.fill();
        ctx.fillStyle = "#ffffff";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText("⚠ 末班起飛落點 ⚠", tc.targetX, tc.targetY + 3);
        ctx.restore();
      }
    }
  },
};
