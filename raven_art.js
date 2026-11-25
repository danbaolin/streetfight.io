// Bespoke 32-Bit Arcade Pixel-Art Sprite & Portrait Generator for RAVEN (暗影會・暗殺者)
// Renders crisp pixel-grid sprites (Portrait, Normal Assassin Combat Stance, Ultimate Dual-Pistol Eclipse Stance)
// matching the chunky, readable 32-bit beat-'em-up aesthetic of Mustache Hero, Street Samurai & Momo.
(function () {
  function makePixelCanvas(w, h) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d");
    g.imageSmoothingEnabled = false;
    return { c, g };
  }

  function upscaleCrisp(src, factor = 3) {
    const out = document.createElement("canvas");
    out.width = src.width * factor;
    out.height = src.height * factor;
    const ctx = out.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(src, 0, 0, out.width, out.height);
    return out;
  }

  // Helper to draw crisp pixel rectangles
  function px(g, x, y, w, h, color) {
    g.fillStyle = color;
    g.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  // Helper to draw a pixel line (Bresenham-style) for sharp blades, braids & straps
  function pline(g, x0, y0, x1, y1, color, thickness = 1) {
    g.fillStyle = color;
    x0 = Math.round(x0);
    y0 = Math.round(y0);
    x1 = Math.round(x1);
    y1 = Math.round(y1);
    const dx = Math.abs(x1 - x0);
    const dy = Math.abs(y1 - y0);
    const sx = x0 < x1 ? 1 : -1;
    const sy = y0 < y1 ? 1 : -1;
    let err = dx - dy;
    while (true) {
      g.fillRect(x0, y0, thickness, thickness);
      if (x0 === x1 && y0 === y1) break;
      const e2 = 2 * err;
      if (e2 > -dy) { err -= dy; x0 += sx; }
      if (e2 < dx) { err += dx; y0 += sy; }
    }
  }

  // =========================================================================
  // 1. REDESIGNED 32-BIT PIXEL FACE PORTRAIT (48x48 native -> 144x144 crisp)
  // =========================================================================
  function buildRavenPortrait(isUlt = false) {
    const { c, g } = makePixelCanvas(48, 48);

    // Eclipse Society dark obsidian + golden eclipse halo backdrop
    px(g, 0, 0, 48, 48, isUlt ? "#160d1f" : "#0b111d");
    px(g, 2, 2, 44, 44, isUlt ? "#21122e" : "#111a2b");
    // Subtle Eclipse golden crescent behind head
    g.strokeStyle = isUlt ? "#fcd34d" : "#d4af37";
    g.lineWidth = 2;
    g.beginPath();
    g.arc(24, 20, 17, 0, Math.PI * 2);
    g.stroke();
    px(g, 9, 5, 28, 28, isUlt ? "#1c1028" : "#0f1726");
    if (isUlt) {
      // Glowing purple-gold energy sparks in background
      px(g, 5, 9, 2, 2, "#fcd34d");
      px(g, 41, 12, 2, 2, "#c084fc");
      px(g, 7, 30, 2, 2, "#a855f7");
      px(g, 40, 29, 2, 2, "#fcd34d");
    }

    // Shoulders & Cropped Gothic Jacket with White Shirt Collar + Black Tie
    px(g, 6, 37, 36, 11, "#090b10"); // dark outline
    px(g, 8, 38, 32, 10, "#1c202a"); // jacket base
    px(g, 10, 39, 8, 8, "#292f3d");  // left shoulder highlight
    px(g, 30, 39, 8, 8, "#292f3d");  // right shoulder highlight
    // White shirt collar & crisp black tie
    px(g, 17, 36, 14, 7, "#e2e8f0");
    px(g, 19, 37, 10, 5, "#f8fafc");
    px(g, 22, 38, 4, 10, "#090b10"); // tie
    px(g, 23, 39, 2, 8, "#1e293b");
    px(g, 22, 38, 4, 2, "#d4af37");  // gold tie clip

    // Neck
    px(g, 20, 31, 8, 6, "#d9a88c");
    px(g, 20, 31, 8, 2, "#b58165"); // chin shadow

    // Twin Black Braided Pigtails (hanging cleanly on left & right)
    const drawBraid = (bx) => {
      px(g, bx - 1, 14, 7, 33, "#06080c");
      for (let by = 16; by < 45; by += 4) {
        px(g, bx, by, 5, 3, "#1a1e28");
        px(g, bx + 1, by, 3, 1, "#333b4d"); // braid highlight
        px(g, bx + 1, by + 3, 3, 1, "#090b10"); // braid notch
      }
      // Subtle gold hair tie band
      px(g, bx, 38, 5, 2, "#d4af37");
    };
    drawBraid(8);
    drawBraid(35);

    // Hair Crown (center-parted sleek obsidian hair)
    px(g, 11, 5, 26, 16, "#06080c");
    px(g, 13, 6, 22, 12, "#151922");
    px(g, 15, 7, 7, 3, "#2f3749"); // left sheen
    px(g, 26, 7, 7, 3, "#2f3749"); // right sheen
    px(g, 23, 6, 2, 7, "#06080c"); // center part

    // Face (sharp, confident 32-bit anime/arcade proportions)
    px(g, 14, 13, 20, 19, "#06080c"); // head outline
    px(g, 15, 13, 18, 17, "#f0c7ab"); // warm porcelain skin
    px(g, 15, 13, 18, 3, "#d9a88c");  // forehead hairline shadow
    px(g, 15, 16, 2, 10, "#e3b394");  // cheek shading
    px(g, 31, 16, 2, 10, "#e3b394");

    // Framing Hair Strands & Ears
    px(g, 13, 12, 3, 14, "#0b0e14");
    px(g, 32, 12, 3, 14, "#0b0e14");
    px(g, 15, 12, 4, 4, "#151922"); // left bang
    px(g, 29, 12, 4, 4, "#151922"); // right bang
    px(g, 12, 20, 2, 4, "#d9a88c"); // ears
    px(g, 34, 20, 2, 4, "#d9a88c");

    // Sharp Fierce Eyebrows (slightly furrowed assassin gaze)
    px(g, 16, 17, 6, 1, "#090b10");
    px(g, 20, 18, 2, 1, "#090b10");
    px(g, 26, 17, 6, 1, "#090b10");
    px(g, 26, 18, 2, 1, "#090b10");

    // Eyes (sharp cat-eye liner + glowing amber/eclipse-gold iris!)
    const irisColor = isUlt ? "#fcd34d" : "#d4af37";
    const irisBright = isUlt ? "#ffffff" : "#fef08a";
    // Left eye
    px(g, 16, 19, 6, 3, "#090b10"); // upper liner
    px(g, 17, 20, 5, 2, "#f8fafc"); // sclera
    px(g, 18, 20, 3, 2, irisColor);
    px(g, 19, 20, 1, 1, irisBright);
    px(g, 16, 19, 1, 1, "#090b10"); // wing
    // Right eye
    px(g, 26, 19, 6, 3, "#090b10");
    px(g, 26, 20, 5, 2, "#f8fafc");
    px(g, 27, 20, 3, 2, irisColor);
    px(g, 28, 20, 1, 1, irisBright);
    // Subtle Eclipse Society under-eye shadow tattoo marks
    px(g, 16, 22, 2, 1, "#4c1d95");
    px(g, 30, 22, 2, 1, "#4c1d95");

    // Iconic Black & Gold Tactical Half-Face Mask (covers nose bridge & lower face!)
    px(g, 14, 23, 20, 10, "#06080c"); // mask outer border
    px(g, 15, 24, 18, 8, "#171b24");  // matte black leather
    px(g, 17, 25, 14, 6, "#222836");  // sculpted center plate
    px(g, 22, 24, 4, 8, "#2c3445");   // center nose/chin ridge highlight
    // Gold trim along top V-edge & tactical rivets!
    px(g, 15, 24, 4, 1, "#d4af37");
    px(g, 19, 23, 10, 1, "#fcd34d");
    px(g, 29, 24, 4, 1, "#d4af37");
    px(g, 16, 28, 2, 1, "#d4af37");   // left rivet
    px(g, 30, 28, 2, 1, "#d4af37");   // right rivet
    // Bottom chin contour
    px(g, 17, 32, 14, 2, "#06080c");
    px(g, 20, 33, 8, 1, "#171b24");

    return upscaleCrisp(c, 3);
  }

  // =========================================================================
  // 2. REDESIGNED IN-GAME NORMAL COMBAT STANCE (64x80 native -> 192x240 crisp)
  //    Chunky 32-bit arcade proportions, low assassin guard, dagger ready!
  // =========================================================================
  function buildRavenNormalStance() {
    const { c, g } = makePixelCanvas(64, 80);

    // --- Flowing Twin Black Braided Pigtails (back braid trailing left) ---
    for (let i = 0; i < 9; i++) {
      const bx = 21 - Math.floor(i * 0.7);
      const by = 18 + i * 3;
      px(g, bx - 1, by - 1, 5, 4, "#06080c");
      px(g, bx, by, 3, 2, "#1c2230");
      px(g, bx + 1, by, 1, 1, "#3b455e");
    }
    px(g, 15, 43, 4, 2, "#d4af37"); // gold braid clasp

    // --- Back Leg (Left thigh with twin throwing knives strapped!) ---
    // Thigh
    px(g, 21, 47, 8, 12, "#06080c");
    px(g, 22, 48, 6, 10, "#e8bc9f");
    px(g, 22, 48, 2, 10, "#c99679"); // thigh shadow
    // Twin black leather thigh straps + 2 silver throwing knives!
    px(g, 21, 51, 8, 2, "#11141c");
    px(g, 21, 55, 8, 2, "#11141c");
    pline(g, 23, 50, 23, 58, "#e2e8f0", 1); // knife 1
    pline(g, 26, 50, 26, 58, "#cbd5e1", 1); // knife 2
    px(g, 23, 49, 1, 2, "#d4af37");
    px(g, 26, 49, 1, 2, "#d4af37");
    // Back Tactical Chunky Boot
    px(g, 18, 58, 11, 19, "#06080c");
    px(g, 19, 59, 8, 14, "#1b202b");
    px(g, 21, 60, 4, 11, "#2a3142"); // shin highlight
    px(g, 20, 62, 5, 1, "#d4af37");  // buckle
    px(g, 20, 66, 5, 1, "#d4af37");
    px(g, 17, 73, 13, 5, "#06080c"); // chunky platform sole
    px(g, 18, 74, 11, 2, "#272d3b");

    // --- Front Leg (Lunging forward right in low combat guard) ---
    px(g, 33, 47, 9, 12, "#06080c");
    px(g, 34, 48, 7, 10, "#f0c7ab");
    px(g, 34, 48, 2, 10, "#d9a88c");
    // Front Tactical Chunky Boot
    px(g, 35, 58, 11, 19, "#06080c");
    px(g, 36, 59, 8, 14, "#1e2430");
    px(g, 38, 60, 4, 11, "#333c50");
    px(g, 37, 62, 5, 1, "#d4af37");
    px(g, 37, 66, 5, 1, "#d4af37");
    px(g, 35, 73, 14, 5, "#06080c");
    px(g, 36, 74, 12, 2, "#2b3242");

    // --- Multi-Layered Asymmetric Black Gothic Skirt ---
    // Back flowing skirt tail
    px(g, 14, 40, 14, 24, "#06080c");
    px(g, 15, 41, 12, 21, "#161a24");
    px(g, 17, 42, 4, 18, "#252b3b");
    px(g, 15, 58, 10, 4, "#0d1017");
    // Mid skirt tiers & tactical belt pouches
    px(g, 21, 38, 20, 14, "#06080c");
    px(g, 22, 39, 18, 12, "#1c212d");
    px(g, 24, 40, 5, 10, "#2d3547");
    px(g, 32, 40, 6, 10, "#272e3e");
    // Tactical waist belt + holstered rear-waist pistol hilt + gold buckle!
    px(g, 21, 36, 20, 4, "#090b10");
    px(g, 22, 37, 18, 2, "#2c241b");
    px(g, 29, 36, 4, 4, "#d4af37");  // gold belt buckle
    px(g, 19, 35, 5, 6, "#1f2430");  // rear holstered pistol grip
    px(g, 20, 36, 3, 2, "#475569");

    // --- Back Arm (Poised with Throwing Knife ready) ---
    px(g, 16, 26, 8, 12, "#06080c");
    px(g, 17, 27, 6, 10, "#1d222e");
    px(g, 18, 28, 3, 7, "#2e3648");
    px(g, 15, 36, 5, 4, "#f0c7ab"); // hand
    // Ready throwing knife in back hand
    pline(g, 15, 38, 10, 42, "#e2e8f0", 2);
    px(g, 14, 37, 2, 2, "#a855f7"); // poison glint

    // --- Torso: Cropped Gothic Tactical Jacket + White Shirt Collar + Black Tie ---
    px(g, 22, 24, 18, 13, "#06080c");
    px(g, 23, 25, 16, 11, "#1b202b");
    px(g, 25, 26, 6, 9, "#2a3244");
    // White shirt collar & black tie
    px(g, 28, 24, 8, 6, "#f1f5f9");
    px(g, 31, 25, 3, 9, "#090b10");
    px(g, 31, 26, 3, 1, "#d4af37"); // gold tie pin

    // --- Head (Chunky, expressive 32-bit arcade proportions facing RIGHT!) ---
    px(g, 23, 6, 18, 19, "#06080c");  // head outline
    px(g, 24, 7, 16, 17, "#161a24");  // black hair volume
    px(g, 26, 8, 8, 3, "#313a4e");    // hair crown sheen
    // Face (3/4 right profile)
    px(g, 29, 12, 11, 12, "#f0c7ab");
    px(g, 29, 12, 11, 2, "#d9a88c");  // brow shadow
    // Fierce Eye facing right (golden iris!)
    px(g, 34, 15, 5, 2, "#090b10");   // brow/liner
    px(g, 35, 16, 4, 2, "#f8fafc");
    px(g, 36, 16, 2, 2, "#d4af37");   // golden iris
    px(g, 37, 16, 1, 1, "#fef08a");   // eye sparkle
    // Black & Gold Tactical Half-Face Mask
    px(g, 30, 19, 11, 6, "#06080c");
    px(g, 31, 20, 9, 4, "#1e2432");
    px(g, 31, 19, 9, 1, "#d4af37");   // gold top trim
    px(g, 35, 21, 3, 2, "#323b50");   // mask highlight

    // Front Braided Pigtail (draping cleanly over chest)
    for (let i = 0; i < 6; i++) {
      const bx = 25 + Math.floor(i * 0.4);
      const by = 18 + i * 3;
      px(g, bx - 1, by - 1, 5, 4, "#06080c");
      px(g, bx, by, 3, 2, "#1f2534");
      px(g, bx + 1, by, 1, 1, "#3b455e");
    }
    px(g, 26, 35, 4, 2, "#d4af37");

    // --- Front Arm + Glinting Silver-Black Assassin Dagger (Guard Forward!) ---
    px(g, 34, 27, 11, 7, "#06080c");
    px(g, 35, 28, 9, 5, "#222836");
    px(g, 36, 28, 6, 2, "#374157");
    px(g, 43, 28, 5, 5, "#06080c");
    px(g, 44, 29, 3, 3, "#f0c7ab"); // gloved/hand grip
    // Sleek Assassin Dagger pointing forward-up!
    pline(g, 46, 30, 59, 23, "#06080c", 4);
    pline(g, 47, 30, 58, 24, "#cbd5e1", 2);
    pline(g, 49, 29, 59, 23, "#ffffff", 1); // razor edge highlight
    px(g, 45, 28, 3, 5, "#d4af37"); // golden crossguard

    return upscaleCrisp(c, 3);
  }

  // =========================================================================
  // 3. REDESIGNED ULTIMATE DUAL-PISTOL ECLIPSE STANCE (72x80 native -> 216x240)
  //    Dynamic Gun-Kata wide stance, flowing coat/braids, TWIN BLACK-GOLD PISTOLS!
  // =========================================================================
  function buildRavenUltStance() {
    const { c, g } = makePixelCanvas(72, 80);

    // --- Subtle Golden-Purple Eclipse Energy Sparks behind silhouette ---
    px(g, 10, 18, 2, 2, "#fcd34d");
    px(g, 14, 34, 2, 2, "#c084fc");
    px(g, 58, 16, 2, 2, "#fcd34d");
    px(g, 62, 42, 2, 2, "#a855f7");

    // --- Wind-Swept Twin Black Braided Pigtails (streaming dramatically back!) ---
    for (let i = 0; i < 10; i++) {
      const bx = 24 - Math.floor(i * 1.5);
      const by = 15 + Math.floor(i * 2.0);
      px(g, bx - 1, by - 1, 5, 4, "#06080c");
      px(g, bx, by, 3, 2, "#1c2230");
      px(g, bx + 1, by, 1, 1, "#4c1d95"); // purple eclipse sheen
    }
    px(g, 9, 34, 4, 2, "#fcd34d");

    // --- Wide Gun-Kata Action Stance Legs ---
    // Back Leg braced wide left
    px(g, 18, 48, 9, 11, "#06080c");
    px(g, 19, 49, 7, 9, "#e8bc9f");
    px(g, 19, 52, 7, 2, "#11141c"); // thigh knife strap
    px(g, 19, 55, 7, 2, "#11141c");
    pline(g, 21, 51, 20, 58, "#e2e8f0", 1);
    pline(g, 24, 51, 23, 58, "#cbd5e1", 1);
    // Back Boot
    px(g, 12, 58, 12, 19, "#06080c");
    px(g, 13, 59, 9, 14, "#1b202b");
    px(g, 15, 60, 4, 11, "#313a4e");
    px(g, 14, 63, 6, 1, "#fcd34d");
    px(g, 11, 73, 14, 5, "#06080c");
    px(g, 12, 74, 12, 2, "#2b3242");

    // Front Leg braced wide right
    px(g, 37, 48, 9, 11, "#06080c");
    px(g, 38, 49, 7, 9, "#f0c7ab");
    // Front Boot
    px(g, 40, 58, 12, 19, "#06080c");
    px(g, 41, 59, 9, 14, "#1e2430");
    px(g, 43, 60, 4, 11, "#384359");
    px(g, 42, 63, 6, 1, "#fcd34d");
    px(g, 40, 73, 15, 5, "#06080c");
    px(g, 41, 74, 13, 2, "#313a4e");

    // --- Billowing Multi-Layered Asymmetric Black Skirt (blown back by Eclipse aura!) ---
    px(g, 9, 40, 20, 22, "#06080c");
    px(g, 10, 41, 18, 19, "#161a24");
    px(g, 12, 43, 6, 15, "#262d3e");
    px(g, 10, 58, 12, 3, "#a855f7"); // subtle violet energy rim on flowing hem!
    px(g, 24, 38, 22, 14, "#06080c");
    px(g, 25, 39, 20, 12, "#1c212d");
    px(g, 28, 40, 6, 10, "#2f384c");
    // Tactical Gold Belt
    px(g, 24, 36, 20, 4, "#090b10");
    px(g, 25, 37, 18, 2, "#3b2f1e");
    px(g, 33, 36, 4, 4, "#fcd34d");

    // --- Torso leaning slightly forward into Gun-Kata ---
    px(g, 25, 24, 18, 13, "#06080c");
    px(g, 26, 25, 16, 11, "#1b202b");
    px(g, 28, 26, 6, 9, "#2d364a");
    px(g, 32, 24, 8, 6, "#f8fafc"); // white collar
    px(g, 35, 25, 3, 9, "#090b10"); // black tie
    px(g, 35, 26, 3, 1, "#fcd34d"); // gold pin

    // --- Head (Fierce Glowing Eclipse Gold Eye!) ---
    px(g, 26, 6, 18, 19, "#06080c");
    px(g, 27, 7, 16, 17, "#161a24");
    px(g, 29, 8, 8, 3, "#384359");
    px(g, 32, 12, 11, 12, "#f0c7ab");
    // Glowing Eclipse Eye!
    px(g, 37, 15, 5, 2, "#090b10");
    px(g, 38, 16, 4, 2, "#fcd34d"); // full golden glow!
    px(g, 39, 16, 2, 1, "#ffffff"); // blazing glint
    // Black & Gold Half-Face Mask
    px(g, 33, 19, 11, 6, "#06080c");
    px(g, 34, 20, 9, 4, "#1e2432");
    px(g, 34, 19, 9, 1, "#fcd34d");

    // Front Braid sweeping forward
    for (let i = 0; i < 5; i++) {
      const bx = 27 - Math.floor(i * 0.5);
      const by = 18 + i * 3;
      px(g, bx - 1, by - 1, 5, 4, "#06080c");
      px(g, bx, by, 3, 2, "#222836");
    }

    // --- OFF-HAND PISTOL (Extended High-Forward!) ---
    px(g, 38, 24, 12, 5, "#06080c");
    px(g, 39, 25, 10, 3, "#252b3b");
    px(g, 48, 24, 4, 4, "#f0c7ab"); // hand
    // Upper Black-Gold Tactical Pistol
    px(g, 50, 21, 17, 6, "#06080c"); // slide outline
    px(g, 51, 22, 15, 4, "#272e3d"); // gunmetal slide
    px(g, 52, 22, 13, 1, "#fcd34d"); // golden top rail!
    px(g, 50, 26, 5, 6, "#06080c");  // grip
    px(g, 51, 27, 3, 4, "#1b202b");
    // Eclipse muzzle glint
    px(g, 67, 22, 3, 3, "#fcd34d");
    px(g, 68, 23, 2, 1, "#ffffff");

    // --- MAIN-HAND PISTOL (Extended Mid-Forward, Dual Akimbo!) ---
    px(g, 35, 30, 12, 6, "#06080c");
    px(g, 36, 31, 10, 4, "#2c3447");
    px(g, 45, 31, 4, 4, "#f0c7ab"); // hand
    // Lower Black-Gold Tactical Pistol
    px(g, 47, 29, 18, 6, "#06080c");
    px(g, 48, 30, 16, 4, "#313a4e");
    px(g, 49, 30, 14, 1, "#fcd34d"); // golden top rail!
    px(g, 47, 34, 5, 6, "#06080c");
    px(g, 48, 35, 3, 4, "#1b202b");
    // Eclipse muzzle glint
    px(g, 65, 30, 3, 3, "#a855f7");
    px(g, 66, 31, 2, 1, "#ffffff");

    return upscaleCrisp(c, 3);
  }

  // =========================================================================
  // 4. CUSTOM 32-BIT PIXEL CIRCULAR SKILL BUTTONS FOR RAVEN
  // =========================================================================
  function buildCircleBtn(drawFn) {
    const { c, g } = makePixelCanvas(48, 48);
    drawFn(g);
    // Circular mask
    const id = g.getImageData(0, 0, 48, 48);
    const d = id.data;
    for (let y = 0; y < 48; y++) {
      for (let x = 0; x < 48; x++) {
        if (Math.hypot(x + 0.5 - 24, y + 0.5 - 24) > 23.5) {
          d[(y * 48 + x) * 4 + 3] = 0;
        }
      }
    }
    g.putImageData(id, 0, 0);
    return upscaleCrisp(c, 3).toDataURL("image/png");
  }

  window.RavenArt = {
    install(spriteBank) {
      const portrait = buildRavenPortrait(false);
      const portraitUlt = buildRavenPortrait(true);
      const normalStance = buildRavenNormalStance();
      const ultStance = buildRavenUltStance();

      spriteBank.images["hero_raven_portrait"] = portrait;
      spriteBank.images["hero_raven_portrait_ult"] = portraitUlt;
      spriteBank.images["hero_raven_normal"] = normalStance;
      spriteBank.images["hero_raven_ult"] = ultStance;

      // Update mobile touch circular buttons to match the redesigned 32-bit pixel art!
      const ultBtnUrl = buildCircleBtn((g) => {
        g.drawImage(portraitUlt, 0, 0, 48, 48);
      });
      const atkBtnUrl = buildCircleBtn((g) => {
        px(g, 0, 0, 48, 48, "#111623");
        // Glowing crossed assassin dagger & violet poison knife
        pline(g, 10, 36, 38, 10, "#06080c", 6);
        pline(g, 12, 34, 37, 11, "#cbd5e1", 3);
        pline(g, 14, 33, 38, 10, "#ffffff", 1);
        px(g, 13, 29, 7, 7, "#d4af37");
        pline(g, 36, 34, 14, 14, "#a855f7", 3);
        pline(g, 35, 33, 15, 15, "#e9d5ff", 1);
      });
      const jumpBtnUrl = buildCircleBtn((g) => {
        px(g, 0, 0, 48, 48, "#141022");
        // Purple shadow smoke + golden grappling hook!
        px(g, 8, 24, 24, 14, "#3b0764");
        px(g, 12, 20, 20, 12, "#581c87");
        pline(g, 10, 36, 34, 14, "#cbd5e1", 2);
        px(g, 31, 10, 8, 8, "#d4af37");
        px(g, 33, 12, 4, 4, "#fef08a");
      });

      document.documentElement.style.setProperty("--raven-btn-ult", `url(${ultBtnUrl})`);
      document.documentElement.style.setProperty("--raven-btn-atk", `url(${atkBtnUrl})`);
      document.documentElement.style.setProperty("--raven-btn-jump", `url(${jumpBtnUrl})`);
    },
  };
})();
