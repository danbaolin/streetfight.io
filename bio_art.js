// Ultra-Detailed 16-bit/32-bit HD Canvas Art Engine for Bio-Island Lab Stages & Bio-Mutant/Boss Sprites
window.BioArt = {
  // Helper: Rounded rectangle path
  rrect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
  },

  // =========================================================================
  // STAGE 3: LAB FLOOR 1 — High-Detail Resident Evil Biotech Laboratory
  // =========================================================================
  drawLabFloor1Bg(ctx, W, H, cameraX, tick) {
    // Deep metallic bulkhead wall base
    const wallGrad = ctx.createLinearGradient(0, 0, 0, 224);
    wallGrad.addColorStop(0, "#070b14");
    wallGrad.addColorStop(0.35, "#111a2c");
    wallGrad.addColorStop(0.85, "#1e293b");
    wallGrad.addColorStop(1, "#0f172a");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, 224);

    // Overhead structural I-beam & pipe network
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, W, 26);
    ctx.fillStyle = "#1e293b";
    ctx.fillRect(0, 22, W, 5);
    // Horizontal copper/steel overhead conduit pipes
    const pipeGrad = ctx.createLinearGradient(0, 6, 0, 14);
    pipeGrad.addColorStop(0, "#475569");
    pipeGrad.addColorStop(0.5, "#94a3b8");
    pipeGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = pipeGrad;
    ctx.fillRect(0, 7, W, 6);

    // Repeating High-Detail Lab Bays (Cloning Cylinders + Consoles + Bio-Equipment)
    const modW = 300;
    const startMod = Math.floor(cameraX / modW) - 1;
    const endMod = startMod + Math.ceil(W / modW) + 2;

    for (let m = startMod; m <= endMod; m++) {
      const mx = Math.floor(m * modW - cameraX);

      // Heavy riveted vertical steel pillar between bays
      const pilGrad = ctx.createLinearGradient(mx - 8, 0, mx + 14, 0);
      pilGrad.addColorStop(0, "#0f172a");
      pilGrad.addColorStop(0.35, "#334155");
      pilGrad.addColorStop(0.65, "#475569");
      pilGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = pilGrad;
      ctx.fillRect(mx - 8, 22, 22, 196);
      // Rivets
      ctx.fillStyle = "#94a3b8";
      for (let ry = 34; ry < 206; ry += 24) {
        ctx.fillRect(mx - 4, ry, 2, 2);
        ctx.fillRect(mx + 8, ry, 2, 2);
      }

      // Recessed bay wall panel with subtle grid & sector label
      ctx.fillStyle = "#0d1524";
      ctx.fillRect(mx + 18, 32, modW - 30, 180);
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let gx = mx + 36; gx < mx + modW - 14; gx += 28) {
        ctx.beginPath();
        ctx.moveTo(gx, 32);
        ctx.lineTo(gx, 212);
        ctx.stroke();
      }
      ctx.fillStyle = "rgba(148, 163, 184, 0.35)";
      ctx.font = "bold 8px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`BIO-LAB // SEC-0${(Math.abs(m) % 4) + 1}`, mx + 24, 43);

      // Overhead fluorescent lamp casting volumetric glow
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(mx + 100, 23, 100, 4);
      const beam = ctx.createLinearGradient(0, 27, 0, 170);
      beam.addColorStop(0, "rgba(186, 230, 253, 0.16)");
      beam.addColorStop(1, "rgba(186, 230, 253, 0)");
      ctx.fillStyle = beam;
      ctx.beginPath();
      ctx.moveTo(mx + 100, 27);
      ctx.lineTo(mx + 200, 27);
      ctx.lineTo(mx + 245, 190);
      ctx.lineTo(mx + 55, 190);
      ctx.closePath();
      ctx.fill();

      // --- TWO 3D-SHADED GLOWING GREEN CLONING CYLINDERS ---
      for (let v = 0; v < 2; v++) {
        const vx = mx + 26 + v * 84;
        const vw = 58;
        const vh = 132;
        const vy = 56;

        // Ambient emerald wall glow behind cylinder
        const aura = ctx.createRadialGradient(vx + vw / 2, vy + vh / 2, 12, vx + vw / 2, vy + vh / 2, 68);
        aura.addColorStop(0, "rgba(34, 197, 94, 0.30)");
        aura.addColorStop(1, "rgba(34, 197, 94, 0)");
        ctx.fillStyle = aura;
        ctx.fillRect(vx - 30, vy - 14, vw + 60, vh + 28);

        // Curved 3D metallic top & bottom tank caps
        const capGrad = ctx.createLinearGradient(vx - 4, 0, vx + vw + 4, 0);
        capGrad.addColorStop(0, "#0f172a");
        capGrad.addColorStop(0.3, "#64748b");
        capGrad.addColorStop(0.7, "#334155");
        capGrad.addColorStop(1, "#0f172a");
        ctx.fillStyle = capGrad;
        this.rrect(ctx, vx - 4, vy - 12, vw + 8, 14, 3);
        ctx.fill();
        this.rrect(ctx, vx - 5, vy + vh - 2, vw + 10, 24, 3);
        ctx.fill();
        // Blinking status LEDs on base
        ctx.fillStyle = (Math.floor(tick / 18) + v) % 2 === 0 ? "#4ade80" : "#166534";
        ctx.fillRect(vx + 6, vy + vh + 6, 6, 4);
        ctx.fillStyle = "#ef4444";
        ctx.fillRect(vx + 16, vy + vh + 6, 4, 4);
        ctx.fillStyle = "#38bdf8";
        ctx.fillRect(vx + 24, vy + vh + 6, 18, 4);

        // Glowing cylindrical green fluid
        const liqGrad = ctx.createLinearGradient(vx, vy, vx + vw, vy);
        liqGrad.addColorStop(0, "#052e16");
        liqGrad.addColorStop(0.25, "#15803d");
        liqGrad.addColorStop(0.5, "#4ade80");
        liqGrad.addColorStop(0.8, "#16a34a");
        liqGrad.addColorStop(1, "#052e16");
        ctx.fillStyle = liqGrad;
        ctx.fillRect(vx, vy, vw, vh);

        // Suspended Umbilical Tubes from top cap
        const bob = Math.sin(tick * 0.045 + m * 1.7 + v * 2.6) * 4.5;
        ctx.strokeStyle = "#064e3b";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(vx + 20, vy);
        ctx.quadraticCurveTo(vx + 16, vy + 24, vx + 25, vy + 38 + bob);
        ctx.moveTo(vx + 38, vy);
        ctx.quadraticCurveTo(vx + 42, vy + 22, vx + 33, vy + 42 + bob);
        ctx.stroke();

        // Detailed Anatomical Mutant Silhouette floating inside cloning vat!
        ctx.save();
        ctx.translate(vx + vw / 2, vy + 42 + bob);
        ctx.fillStyle = "rgba(4, 35, 18, 0.84)";
        // Cranium & jaw
        ctx.beginPath();
        ctx.ellipse(0, 0, 9, 10, 0, 0, Math.PI * 2);
        ctx.fill();
        // Muscular shoulders & tapered mutant torso
        ctx.beginPath();
        ctx.moveTo(-14, 12);
        ctx.lineTo(14, 12);
        ctx.lineTo(9, 44);
        ctx.lineTo(-9, 44);
        ctx.closePath();
        ctx.fill();
        // Curled mutant arms & claws
        ctx.lineWidth = 5;
        ctx.strokeStyle = "rgba(4, 35, 18, 0.84)";
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(-12, 16);
        ctx.quadraticCurveTo(-20, 30, -11, 40);
        ctx.moveTo(12, 16);
        ctx.quadraticCurveTo(20, 30, 11, 40);
        // Bent suspended legs
        ctx.moveTo(-6, 44);
        ctx.quadraticCurveTo(-11, 58, -5, 70);
        ctx.moveTo(6, 44);
        ctx.quadraticCurveTo(11, 58, 5, 70);
        ctx.stroke();
        // Glowing yellow-white eyes & spine nodes inside vat
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(-4, -2, 2.5, 2.5);
        ctx.fillRect(2, -2, 2.5, 2.5);
        ctx.fillStyle = "rgba(134, 239, 172, 0.65)";
        ctx.fillRect(-1.5, 16, 3, 3);
        ctx.fillRect(-1.5, 24, 3, 3);
        ctx.fillRect(-1.5, 32, 3, 3);
        ctx.restore();

        // Rising fluid bubbles
        ctx.fillStyle = "rgba(220, 252, 231, 0.8)";
        for (let b = 0; b < 6; b++) {
          const by = vy + vh - 6 - ((tick * (0.9 + (b % 3) * 0.3) + b * 23 + v * 19) % (vh - 12));
          const bx = vx + 8 + ((b * 9 + v * 11) % (vw - 16)) + Math.sin(tick * 0.08 + b) * 2;
          const br = b % 2 === 0 ? 2.2 : 1.4;
          ctx.beginPath();
          ctx.arc(bx, by, br, 0, Math.PI * 2);
          ctx.fill();
        }

        // Curved Glass Specular Highlights & Edge Reflections
        ctx.fillStyle = "rgba(255, 255, 255, 0.24)";
        ctx.fillRect(vx + 6, vy + 2, 5, vh - 4);
        ctx.fillStyle = "rgba(255, 255, 255, 0.10)";
        ctx.fillRect(vx + vw - 9, vy + 2, 3, vh - 4);
        ctx.strokeStyle = "rgba(187, 247, 208, 0.55)";
        ctx.lineWidth = 1.2;
        ctx.strokeRect(vx, vy, vw, vh);
      }

      // --- HIGH-TECH BIO-CONSOLE, HOLOGRAPHIC DNA MONITOR & MICROSCOPE BENCH ---
      const cx = mx + 196;
      // Dual-bezel wall monitor
      ctx.fillStyle = "#090d16";
      this.rrect(ctx, cx, 58, 86, 54, 4);
      ctx.fill();
      ctx.strokeStyle = "#475569";
      ctx.lineWidth = 2;
      ctx.stroke();
      // Screen scanline tint
      ctx.fillStyle = "rgba(14, 165, 233, 0.12)";
      ctx.fillRect(cx + 4, 62, 78, 46);
      // Animated Double Helix DNA readout
      for (let strand = 0; strand < 2; strand++) {
        ctx.strokeStyle = strand === 0 ? "#4ade80" : "#38bdf8";
        ctx.lineWidth = 1.6;
        ctx.beginPath();
        for (let i = 0; i <= 70; i += 3) {
          const dy = Math.sin((i + tick * 1.8) * 0.14 + strand * Math.PI) * 11;
          if (i === 0) ctx.moveTo(cx + 8 + i, 84 + dy);
          else ctx.lineTo(cx + 8 + i, 84 + dy);
        }
        ctx.stroke();
      }
      // Mini status bars on monitor
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(cx + 8, 100, 26, 3);
      ctx.fillStyle = "#4ade80";
      ctx.fillRect(cx + 38, 100, 38, 3);

      // Stainless Steel Workbench + Glass Vials & Microscope
      const deskGrad = ctx.createLinearGradient(0, 146, 0, 212);
      deskGrad.addColorStop(0, "#64748b");
      deskGrad.addColorStop(0.18, "#334155");
      deskGrad.addColorStop(1, "#1e293b");
      ctx.fillStyle = deskGrad;
      ctx.fillRect(cx - 4, 148, 94, 64);
      ctx.fillStyle = "#94a3b8";
      ctx.fillRect(cx - 6, 145, 98, 5);
      // Glowing Bio-Vials Rack
      const vialColors = ["#4ade80", "#22d3ee", "#c084fc", "#f43f5e"];
      vialColors.forEach((col, vi) => {
        const vx = cx + 4 + vi * 11;
        ctx.fillStyle = "rgba(255,255,255,0.28)";
        ctx.fillRect(vx, 126, 6, 19);
        ctx.fillStyle = col;
        ctx.fillRect(vx + 1, 132, 4, 12);
      });
      // Pixel Microscope silhouette on right side of bench
      ctx.fillStyle = "#e2e8f0";
      ctx.fillRect(cx + 62, 138, 16, 7);
      ctx.fillRect(cx + 71, 124, 5, 16);
      ctx.save();
      ctx.translate(cx + 68, 126);
      ctx.rotate(-0.4);
      ctx.fillStyle = "#cbd5e1";
      ctx.fillRect(-3, -10, 6, 14);
      ctx.fillStyle = "#38bdf8";
      ctx.fillRect(-2, -12, 4, 3);
      ctx.restore();
    }

    // Bold Biohazard Caution Trim
    ctx.fillStyle = "#facc15";
    ctx.fillRect(0, 214, W, 10);
    ctx.fillStyle = "#090d16";
    for (let x = -(cameraX % 24); x < W + 24; x += 24) {
      ctx.beginPath();
      ctx.moveTo(x, 214);
      ctx.lineTo(x + 11, 214);
      ctx.lineTo(x + 4, 224);
      ctx.lineTo(x - 7, 224);
      ctx.fill();
    }

    // Walkable Industrial Grated Steel Floor with Ambient Reflections
    const floorGrad = ctx.createLinearGradient(0, 224, 0, H);
    floorGrad.addColorStop(0, "#1e293b");
    floorGrad.addColorStop(0.45, "#334155");
    floorGrad.addColorStop(1, "#1e293b");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 224, W, H - 224);

    // Metallic floor panel seams & specular edge highlights
    for (let y = 246; y < H; y += 26) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, y, W, 2);
      ctx.fillStyle = "rgba(148, 163, 184, 0.16)";
      ctx.fillRect(0, y + 2, W, 1);
    }
    for (let x = -(cameraX % 80); x < W + 80; x += 80) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(Math.floor(x), 224, 2, H - 224);
      ctx.fillStyle = "rgba(148, 163, 184, 0.12)";
      ctx.fillRect(Math.floor(x) + 2, 224, 1, H - 224);
    }
    // Soft green glow reflected from cloning vats onto the steel floor
    const refl = ctx.createLinearGradient(0, 224, 0, 290);
    refl.addColorStop(0, "rgba(74, 222, 128, 0.22)");
    refl.addColorStop(1, "rgba(74, 222, 128, 0)");
    ctx.fillStyle = refl;
    ctx.fillRect(0, 224, W, 66);
  },

  // =========================================================================
  // STAGE 5: LAB FLOOR 3 — Subterranean Bio-Reactor Core Boss Arena
  // =========================================================================
  drawLabFloor3Bg(ctx, W, H, cameraX, tick) {
    const grad = ctx.createLinearGradient(0, 0, 0, 224);
    grad.addColorStop(0, "#05020a");
    grad.addColorStop(0.5, "#170924");
    grad.addColorStop(1, "#270d1e");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, 224);

    // Sweeping Red Emergency Alarm Beacons
    const strobe = (Math.sin(tick * 0.08) + 1) * 0.5;
    ctx.fillStyle = `rgba(220, 38, 38, ${0.05 + strobe * 0.10})`;
    ctx.fillRect(0, 0, W, 224);

    // Towering 3D Central Bio-Reactor Core (parallax 0.35)
    const coreX = Math.floor(380 - cameraX * 0.35);
    // Reactor ambient halo
    const coreHalo = ctx.createRadialGradient(coreX, 115, 20, coreX, 115, 165);
    coreHalo.addColorStop(0, "rgba(239, 68, 68, 0.42)");
    coreHalo.addColorStop(0.5, "rgba(147, 51, 234, 0.24)");
    coreHalo.addColorStop(1, "rgba(147, 51, 234, 0)");
    ctx.fillStyle = coreHalo;
    ctx.fillRect(coreX - 165, 0, 330, 224);

    // Outer Steel Reactor Casing
    const casingGrad = ctx.createLinearGradient(coreX - 78, 0, coreX + 78, 0);
    casingGrad.addColorStop(0, "#09090b");
    casingGrad.addColorStop(0.25, "#3f3f46");
    casingGrad.addColorStop(0.5, "#18181b");
    casingGrad.addColorStop(0.75, "#3f3f46");
    casingGrad.addColorStop(1, "#09090b");
    ctx.fillStyle = casingGrad;
    ctx.fillRect(coreX - 78, 8, 156, 214);

    // Glowing Plasma Core Column
    const plasmaGrad = ctx.createLinearGradient(coreX - 46, 0, coreX + 46, 0);
    plasmaGrad.addColorStop(0, "#4c1d95");
    plasmaGrad.addColorStop(0.35, "#dc2626");
    plasmaGrad.addColorStop(0.5, "#fef08a");
    plasmaGrad.addColorStop(0.65, "#dc2626");
    plasmaGrad.addColorStop(1, "#4c1d95");
    ctx.fillStyle = plasmaGrad;
    ctx.fillRect(coreX - 46, 22, 92, 188);

    // Animated Containment Rings & Plasma Arcs
    for (let r = 0; r < 5; r++) {
      const ry = 42 + r * 36 + Math.sin(tick * 0.09 + r) * 5;
      ctx.fillStyle = "#18181b";
      ctx.fillRect(coreX - 54, ry - 4, 108, 7);
      ctx.fillStyle = "#fca5a5";
      ctx.fillRect(coreX - 46, ry - 1, 92, 2);
    }

    // Heavy Armored Pillars & Shattered Mutagen Pods
    const modW = 240;
    const startM = Math.floor(cameraX / modW) - 1;
    const endM = startM + Math.ceil(W / modW) + 2;
    for (let m = startM; m <= endM; m++) {
      const px = Math.floor(m * modW - cameraX);
      const pGrad = ctx.createLinearGradient(px, 0, px + 38, 0);
      pGrad.addColorStop(0, "#09090b");
      pGrad.addColorStop(0.4, "#3f3f46");
      pGrad.addColorStop(0.7, "#27272a");
      pGrad.addColorStop(1, "#09090b");
      ctx.fillStyle = pGrad;
      ctx.fillRect(px, 0, 38, 224);

      // Emergency strobe box on pillar
      ctx.fillStyle = strobe > 0.5 ? "#ef4444" : "#7f1d1d";
      ctx.fillRect(px + 10, 32, 18, 8);
      if (strobe > 0.5) {
        ctx.fillStyle = "rgba(239, 68, 68, 0.22)";
        ctx.beginPath();
        ctx.arc(px + 19, 36, 26, 0, Math.PI * 2);
        ctx.fill();
      }

      // Shattered Giant Containment Pod with glowing spilled serum
      const podX = px + 88;
      ctx.fillStyle = "#27272a";
      ctx.fillRect(podX - 4, 56, 66, 14);
      ctx.fillRect(podX - 4, 192, 66, 28);
      ctx.fillStyle = "rgba(34, 197, 94, 0.16)";
      ctx.fillRect(podX, 70, 58, 122);
      // Jagged cracked glass edges
      ctx.strokeStyle = "#dcfce7";
      ctx.lineWidth = 1.6;
      ctx.beginPath();
      ctx.moveTo(podX, 92);
      ctx.lineTo(podX + 26, 128);
      ctx.lineTo(podX + 58, 108);
      ctx.moveTo(podX + 26, 128);
      ctx.lineTo(podX + 18, 178);
      ctx.stroke();
      // Hanging severed cables
      ctx.strokeStyle = "#18181b";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(podX + 18, 70);
      ctx.quadraticCurveTo(podX + 12, 102, podX + 24, 114);
      ctx.stroke();
    }

    // Reinforced Dark Steel Boss Floor with Glowing Reactor Reflection
    const floorGrad = ctx.createLinearGradient(0, 224, 0, H);
    floorGrad.addColorStop(0, "#181322");
    floorGrad.addColorStop(0.5, "#1f2433");
    floorGrad.addColorStop(1, "#0f121a");
    ctx.fillStyle = floorGrad;
    ctx.fillRect(0, 224, W, H - 224);
    ctx.fillStyle = "#ef4444";
    ctx.fillRect(0, 221, W, 3);
    for (let y = 246; y < H; y += 26) {
      ctx.fillStyle = "#090b10";
      ctx.fillRect(0, y, W, 2);
      ctx.fillStyle = "rgba(239, 68, 68, 0.12)";
      ctx.fillRect(0, y + 2, W, 1);
    }
    for (let x = -(cameraX % 76); x < W + 76; x += 76) {
      ctx.fillStyle = "#090b10";
      ctx.fillRect(Math.floor(x), 224, 2, H - 224);
    }
  },

  // =========================================================================
  // STAGE 4: SWIRLING TOXIC SWAMP GAS OVERLAY (沼氣毒霧)
  // =========================================================================
  drawToxicGasOverlay(ctx, W, H, tick) {
    // Darker underground atmosphere
    ctx.fillStyle = "rgba(3, 16, 9, 0.36)";
    ctx.fillRect(0, 0, W, H);

    // Volumetric drifting green toxic miasma plumes
    for (let i = 0; i < 9; i++) {
      const gx = ((i * 112 - tick * 0.72) % (W + 180) + (W + 180)) % (W + 180) - 90;
      const gy = 248 + (i % 3) * 34 + Math.sin(tick * 0.045 + i) * 9;
      const grad = ctx.createRadialGradient(gx, gy, 10, gx, gy, 78);
      grad.addColorStop(0, "rgba(74, 222, 128, 0.32)");
      grad.addColorStop(0.55, "rgba(22, 163, 74, 0.16)");
      grad.addColorStop(1, "rgba(22, 163, 74, 0)");
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(gx, gy, 78, 0, Math.PI * 2);
      ctx.fill();
    }

    // Pulsing warning strip
    if (Math.floor(tick / 28) % 2 === 0) {
      ctx.fillStyle = "rgba(15, 65, 35, 0.88)";
      ctx.fillRect(W / 2 - 144, 56, 288, 18);
      ctx.strokeStyle = "#4ade80";
      ctx.lineWidth = 1.5;
      ctx.strokeRect(W / 2 - 144, 56, 288, 18);
      ctx.fillStyle = "#bbf7d0";
      ctx.font = "bold 9px monospace";
      ctx.textAlign = "center";
      ctx.fillText("☠ 沼氣毒霧持續扣血！快擊敗小魔王通往第三層！", W / 2, 68);
    }
  },

  // =========================================================================
  // HIGH-DETAIL SHADED & OUTLINED BIO-ENEMY & 3-PHASE BOSS SPRITES
  // =========================================================================
  drawBioEnemySprite(ctx, e, sx, sy, tick) {
    const walk = Math.sin(e.walkFrame) * 4;
    const flash = e.hurtTimer > 0 && e.hurtTimer % 4 < 2;
    const attacking = e.attackTimer > 6 && e.attackTimer < 18;

    // -----------------------------------------------------------------------
    // 1. MUTANT BRUTE (變種人 — Detailed Hulking Bio-Monster with Outlines!)
    // -----------------------------------------------------------------------
    if (e.type === "mutant_brute") {
      const scale = 1.15;
      ctx.save();
      ctx.translate(sx, sy - e.z);
      if (e.knockdownTimer > 0 || e.dead) ctx.rotate(e.facing * -0.5);
      ctx.scale(e.facing * scale, scale);
      if (flash) ctx.filter = "brightness(2.4)";

      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 1.8;

      // Back muscular leg & torn cargo pants
      ctx.fillStyle = "#1e293b";
      this.rrect(ctx, -12, -26 + walk * 0.45, 10, 22, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#365314"; // mutated bare clawed foot
      this.rrect(ctx, -13, -7 + walk * 0.45, 13, 7, 2);
      ctx.fill();
      ctx.stroke();

      // Front muscular leg
      ctx.fillStyle = "#334155";
      this.rrect(ctx, 2, -26 - walk * 0.45, 11, 22, 3);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#4d7c0f";
      this.rrect(ctx, 2, -7 - walk * 0.45, 14, 7, 2);
      ctx.fill();
      ctx.stroke();

      // Back Clawed Arm
      ctx.fillStyle = "#365314";
      this.rrect(ctx, -20, -48 + walk * 0.35, 10, 24, 4);
      ctx.fill();
      ctx.stroke();

      // Hunched Shaded Muscular Bio-Torso
      const torsoGrad = ctx.createLinearGradient(-16, -58, 18, -24);
      torsoGrad.addColorStop(0, "#84cc16");
      torsoGrad.addColorStop(0.5, "#4d7c0f");
      torsoGrad.addColorStop(1, "#1a2e05");
      ctx.fillStyle = torsoGrad;
      this.rrect(ctx, -16, -56, 32, 33, 8);
      ctx.fill();
      ctx.stroke();

      // Sculpted pectoral / rib shadows + glowing neon-green pulsing bio-veins
      ctx.strokeStyle = "#86efac";
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(-6, -50);
      ctx.lineTo(-2, -40);
      ctx.lineTo(-8, -32);
      ctx.moveTo(6, -48);
      ctx.lineTo(10, -38);
      ctx.stroke();

      // Tattered white lab coat scraps hanging from waist
      ctx.fillStyle = "#cbd5e1";
      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(-14, -27);
      ctx.lineTo(-4, -27);
      ctx.lineTo(-7, -14);
      ctx.lineTo(-15, -18);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();

      // Front Massive Clawed Arm
      ctx.fillStyle = "#65a30d";
      ctx.lineWidth = 1.8;
      if (attacking) {
        this.rrect(ctx, 6, -49, 27, 12, 5);
        ctx.fill();
        ctx.stroke();
        // Razor bone claws
        ctx.fillStyle = "#fef9c3";
        for (let c = 0; c < 3; c++) {
          ctx.beginPath();
          ctx.moveTo(31, -48 + c * 4);
          ctx.lineTo(39, -47 + c * 4);
          ctx.lineTo(31, -45 + c * 4);
          ctx.closePath();
          ctx.fill();
        }
      } else {
        this.rrect(ctx, 8, -48 - walk * 0.35, 11, 26, 4);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#bef264";
        ctx.fillRect(11, -42 - walk * 0.35, 3, 12);
      }

      // Sculpted Mutant Head (heavy brow, snarling jaw, glowing red eyes)
      ctx.fillStyle = "#65a30d";
      this.rrect(ctx, -6, -69, 19, 17, 5);
      ctx.fill();
      ctx.stroke();
      // Heavy dark brow ridge & glowing crimson eye
      ctx.fillStyle = "#1a2e05";
      ctx.fillRect(1, -64, 11, 4);
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(5, -62, 4, 3);
      ctx.fillStyle = "#fef08a";
      ctx.fillRect(7, -61.5, 1.5, 1.5);
      // Snarling jaw with jagged teeth
      ctx.fillStyle = "#450a0a";
      ctx.fillRect(2, -57, 10, 4);
      ctx.fillStyle = "#f8fafc";
      ctx.fillRect(3, -57, 2, 2);
      ctx.fillRect(7, -57, 2, 2);
      ctx.fillRect(10, -57, 2, 2);

      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 2. SKULL-FACED HUMAN (骷髏臉人類 — Detailed Undead Skull & Tattered Coat)
    // -----------------------------------------------------------------------
    if (e.type === "skull_human") {
      const scale = 1.08;
      ctx.save();
      ctx.translate(sx, sy - e.z);
      if (e.knockdownTimer > 0 || e.dead) ctx.rotate(e.facing * -0.5);
      ctx.scale(e.facing * scale, scale);
      if (flash) ctx.filter = "brightness(2.4)";

      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 1.6;

      // Dark tattered trousers & boots
      ctx.fillStyle = "#1e293b";
      this.rrect(ctx, -9, -24 + walk * 0.5, 8, 20, 2);
      ctx.fill();
      ctx.stroke();
      this.rrect(ctx, 2, -24 - walk * 0.5, 8, 20, 2);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = "#09090b";
      ctx.fillRect(-10, -5 + walk * 0.5, 10, 5);
      ctx.fillRect(2, -5 - walk * 0.5, 10, 5);

      // Tattered Dark Lab/Street Jacket with Shaded Folds
      const coatGrad = ctx.createLinearGradient(-13, -52, 13, -22);
      coatGrad.addColorStop(0, "#475569");
      coatGrad.addColorStop(0.6, "#1e293b");
      coatGrad.addColorStop(1, "#0f172a");
      ctx.fillStyle = coatGrad;
      this.rrect(ctx, -13, -52, 26, 30, 5);
      ctx.fill();
      ctx.stroke();

      // Exposed dark ribcage tee beneath open jacket
      ctx.fillStyle = "#09090b";
      ctx.fillRect(-4, -50, 9, 20);
      ctx.fillStyle = "#e2e8f0"; // bone ribs peeking through!
      for (let r = 0; r < 3; r++) {
        ctx.fillRect(-3, -46 + r * 5, 7, 2);
      }

      // Skeletal Lunging Arm
      ctx.fillStyle = "#334155";
      if (attacking) {
        this.rrect(ctx, 4, -45, 22, 8, 3);
        ctx.fill();
        ctx.stroke();
        // Detailed bone hand
        ctx.fillStyle = "#f1f5f9";
        this.rrect(ctx, 24, -46, 8, 9, 2);
        ctx.fill();
        ctx.stroke();
      } else {
        this.rrect(ctx, 7, -45 - walk * 0.4, 8, 19, 3);
        ctx.fill();
        ctx.stroke();
        ctx.fillStyle = "#f1f5f9";
        ctx.fillRect(8, -28 - walk * 0.4, 6, 5);
      }

      // SCULPTED 3D-SHADED BONE SKULL HEAD!
      const skullGrad = ctx.createRadialGradient(2, -66, 2, 0, -63, 14);
      skullGrad.addColorStop(0, "#ffffff");
      skullGrad.addColorStop(0.65, "#e2e8f0");
      skullGrad.addColorStop(1, "#94a3b8");
      ctx.fillStyle = skullGrad;
      // Rounded cranium
      ctx.beginPath();
      ctx.ellipse(0, -64, 10, 10, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.stroke();
      // Cheekbones & Jawbone
      this.rrect(ctx, -6, -58, 13, 8, 2);
      ctx.fill();
      ctx.stroke();
      // Deep black sunken eye sockets with blazing red soul embers
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.ellipse(-2.5, -63, 3.2, 3.5, 0, 0, Math.PI * 2);
      ctx.ellipse(4.5, -63, 3.2, 3.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(-2, -63, 1.5, 0, Math.PI * 2);
      ctx.arc(5, -63, 1.5, 0, Math.PI * 2);
      ctx.fill();
      // Nasal cavity & skull teeth
      ctx.fillStyle = "#09090b";
      ctx.beginPath();
      ctx.moveTo(1, -60);
      ctx.lineTo(3, -56);
      ctx.lineTo(-0.5, -56);
      ctx.closePath();
      ctx.fill();
      for (let t = 0; t < 4; t++) {
        ctx.fillRect(-4 + t * 3, -54, 1.6, 3.5);
      }

      ctx.restore();
      return true;
    }

    // -----------------------------------------------------------------------
    // 3. THREE-PHASE FINAL BOSS: DR. GENEX (基因研究者 — Ultra-Detailed!)
    // -----------------------------------------------------------------------
    if (e.type === "genex_boss") {
      const phase = e.bossPhase || 1;
      const scale = phase === 3 ? 1.42 : phase === 2 ? 1.34 : 1.28;

      ctx.save();
      ctx.translate(sx, sy - e.z);
      if (e.dead) ctx.rotate(e.facing * -0.5);
      ctx.scale(e.facing * scale, scale);
      if (flash) ctx.filter = "brightness(2.4)";

      ctx.strokeStyle = "#090d16";
      ctx.lineWidth = 1.8;

      // --- PHASE 3: MASSIVE MULTI-JOINTED TATTERED BLACK DEMON WINGS! ---
      if (phase === 3) {
        const flap = Math.sin(tick * 0.28) * 16;
        // Back Wing Membrane
        const wingGrad = ctx.createLinearGradient(-56, -90, 8, -32);
        wingGrad.addColorStop(0, "#09090b");
        wingGrad.addColorStop(0.65, "#1e1b4b");
        wingGrad.addColorStop(1, "#4c1d95");
        ctx.fillStyle = wingGrad;
        ctx.strokeStyle = "#a855f7";
        ctx.lineWidth = 1.8;
        ctx.beginPath();
        ctx.moveTo(-6, -48);
        ctx.lineTo(-54, -84 + flap);
        ctx.quadraticCurveTo(-48, -62 + flap * 0.7, -60, -44 + flap * 0.6);
        ctx.quadraticCurveTo(-40, -48 + flap * 0.4, -36, -34 + flap * 0.3);
        ctx.quadraticCurveTo(-22, -40, -14, -28);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Front Upper Wing
        ctx.beginPath();
        ctx.moveTo(2, -52);
        ctx.lineTo(-34, -96 - flap * 0.75);
        ctx.quadraticCurveTo(-16, -78 - flap * 0.5, 16, -82 - flap * 0.55);
        ctx.quadraticCurveTo(8, -64 - flap * 0.3, 18, -50);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
        ctx.strokeStyle = "#090d16";
      }

      // --- LEGS (Phase 1: Tactical Trousers / Phase 2 & 3: GIGANTIC BLADE-SPINED LEGS!) ---
      if (phase >= 2) {
        const kicking = e.kickAnimTimer > 0;
        const legGrad = ctx.createLinearGradient(-16, -32, 22, 0);
        legGrad.addColorStop(0, phase === 3 ? "#7f1d1d" : "#7e22ce");
        legGrad.addColorStop(0.55, phase === 3 ? "#3b0764" : "#4c1d95");
        legGrad.addColorStop(1, "#09090b");
        ctx.fillStyle = legGrad;

        // Back colossal leg
        this.rrect(ctx, -16, -30 + walk * 0.4, 15, 29, 5);
        ctx.fill();
        ctx.stroke();

        // Front colossal leg (or sweeping slash kick!)
        if (kicking) {
          this.rrect(ctx, -2, -32, 40, 17, 6);
          ctx.fill();
          ctx.stroke();
          // Glowing crimson kinetic blade-crest along shin!
          ctx.fillStyle = "#f43f5e";
          ctx.beginPath();
          ctx.moveTo(8, -32);
          ctx.lineTo(38, -38);
          ctx.lineTo(34, -30);
          ctx.closePath();
          ctx.fill();
        } else {
          this.rrect(ctx, 2, -30 - walk * 0.4, 16, 29, 5);
          ctx.fill();
          ctx.stroke();
          // Glowing bio-energy leg veins
          ctx.fillStyle = phase === 3 ? "#ef4444" : "#4ade80";
          ctx.fillRect(8, -24 - walk * 0.4, 3, 15);
          ctx.fillRect(-11, -24 + walk * 0.4, 3, 15);
        }
        // Clawed monster feet
        ctx.fillStyle = "#09090b";
        this.rrect(ctx, -18, -6 + walk * 0.4, 19, 6, 2);
        ctx.fill();
        if (!kicking) {
          this.rrect(ctx, 1, -6 - walk * 0.4, 20, 6, 2);
          ctx.fill();
        }
      } else {
        ctx.fillStyle = "#1e293b";
        this.rrect(ctx, -11, -26 + walk * 0.5, 9, 25, 3);
        ctx.fill();
        ctx.stroke();
        this.rrect(ctx, 2, -26 - walk * 0.5, 9, 25, 3);
        ctx.fill();
        ctx.stroke();
      }

      // --- TORSO (Tattered Billowing Lab Coat + Exposed Pulsing Bio-Core Chest) ---
      ctx.fillStyle = phase === 3 ? "#1e1b4b" : "#e2e8f0";
      this.rrect(ctx, -17, -56, 34, 32, 6);
      ctx.fill();
      ctx.stroke();
      // Exposed mutated muscular chest with glowing bio-core
      const chestGrad = ctx.createRadialGradient(0, -42, 2, 0, -42, 16);
      chestGrad.addColorStop(0, phase === 3 ? "#ef4444" : "#4ade80");
      chestGrad.addColorStop(0.55, phase === 3 ? "#7f1d1d" : "#581c87");
      chestGrad.addColorStop(1, "#09090b");
      ctx.fillStyle = chestGrad;
      this.rrect(ctx, -9, -53, 18, 25, 4);
      ctx.fill();
      ctx.stroke();

      // --- COLOSSAL SCULPTED MONSTER ARMS (All 3 Phases!) ---
      const armGrad = ctx.createLinearGradient(-30, -58, 36, -20);
      armGrad.addColorStop(0, phase === 3 ? "#991b1b" : "#9333ea");
      armGrad.addColorStop(0.55, phase === 3 ? "#450a0a" : "#581c87");
      armGrad.addColorStop(1, "#09090b");
      ctx.fillStyle = armGrad;

      // Back colossal arm
      this.rrect(ctx, -31, -56, 17, 32, 7);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = phase === 3 ? "#f43f5e" : "#4ade80";
      ctx.fillRect(-25, -48, 3.5, 16);

      // Front colossal brute arm (huge smash when attacking!)
      ctx.fillStyle = armGrad;
      if (attacking) {
        this.rrect(ctx, 8, -54, 36, 20, 7);
        ctx.fill();
        ctx.stroke();
        // Massive glowing fist impact
        ctx.fillStyle = phase === 3 ? "#ef4444" : "#4ade80";
        this.rrect(ctx, 36, -57, 18, 26, 6);
        ctx.fill();
        ctx.stroke();
      } else {
        this.rrect(ctx, 13, -55 - walk * 0.3, 20, 34, 7);
        ctx.fill();
        ctx.stroke();
        // Pulsing veins & bone-knuckles on giant fist
        ctx.fillStyle = phase === 3 ? "#ef4444" : "#4ade80";
        ctx.fillRect(20, -48 - walk * 0.3, 4, 17);
        ctx.fillStyle = "#e2e8f0";
        ctx.fillRect(15, -24 - walk * 0.3, 4, 4);
        ctx.fillRect(21, -24 - walk * 0.3, 4, 4);
        ctx.fillRect(27, -24 - walk * 0.3, 4, 4);
      }

      // --- HEAD (Phase 1 & 2: Crazed Scientist / Phase 3: SCULPTED DEMON SKULL!) ---
      if (phase === 3) {
        const sGrad = ctx.createRadialGradient(2, -70, 2, 0, -68, 16);
        sGrad.addColorStop(0, "#ffffff");
        sGrad.addColorStop(0.7, "#cbd5e1");
        sGrad.addColorStop(1, "#64748b");
        ctx.fillStyle = sGrad;
        ctx.beginPath();
        ctx.ellipse(1, -69, 12, 12, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        this.rrect(ctx, -6, -62, 15, 8, 2);
        ctx.fill();
        ctx.stroke();
        // Blazing Crimson Skull Eye Sockets
        ctx.fillStyle = "#09090b";
        ctx.beginPath();
        ctx.ellipse(-2, -68, 3.8, 4, 0, 0, Math.PI * 2);
        ctx.ellipse(6, -68, 3.8, 4, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(-1.5, -68, 2, 0, Math.PI * 2);
        ctx.arc(6.5, -68, 2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fef08a";
        ctx.fillRect(-2, -68.5, 1.5, 1.5);
        ctx.fillRect(6, -68.5, 1.5, 1.5);
        // Skull fangs
        ctx.fillStyle = "#09090b";
        for (let t = 0; t < 4; t++) {
          ctx.fillRect(-4 + t * 3.5, -59, 1.8, 4);
        }
      } else {
        // Crazed mutated Gene Researcher face
        ctx.fillStyle = "#d9f99d";
        this.rrect(ctx, -8, -74, 18, 19, 5);
        ctx.fill();
        ctx.stroke();
        // Wild silver-grey hair
        ctx.fillStyle = "#94a3b8";
        this.rrect(ctx, -11, -79, 23, 8, 3);
        ctx.fill();
        ctx.stroke();
        // Glowing emerald eyes & maniacal grin
        ctx.fillStyle = "#09090b";
        ctx.fillRect(-2, -68, 12, 5);
        ctx.fillStyle = "#4ade80";
        ctx.fillRect(0, -67, 3, 3);
        ctx.fillRect(6, -67, 3, 3);
        ctx.fillStyle = "#14532d";
        ctx.fillRect(-1, -60, 9, 2.5);
      }

      ctx.restore();
      return true;
    }

    return false;
  },
};
