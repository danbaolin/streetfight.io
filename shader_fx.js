// WebGL Post-Processing Shader Engine for PROTOCOL (Arcade Edition)
// Implements real-time GLSL screen-space shaders inspired by "3D Game Shaders For Beginners":
//  1. Selective Multi-Tap Bloom (HDR Neon Glow)
//  2. Dynamic Radial Chromatic Aberration (Impact / Ultimate / Just Dodge)
//  3. Radial Shockwave UV Distortion (Ground Slam / Ultimate / K.O.)
//  4. Regional Film Color Grading (Sakura / Jiufen / Sunset / Bio-Lab / Neon)
//  5. Cinematic Vignette & Optional Arcade CRT Curvature + Phosphor Scanlines
(function () {
  const MODE_KEY = "protocol_shader_mode_v1";
  const MODES = ["hd", "crt", "off"]; // hd = 霓虹 HD, crt = 復古 CRT, off = 原始畫質

  const VERT_SRC = `
    attribute vec2 aPos;
    varying vec2 vUv;
    void main() {
      vUv = vec2(aPos.x * 0.5 + 0.5, 0.5 - aPos.y * 0.5);
      gl_Position = vec4(aPos, 0.0, 1.0);
    }
  `;

  const FRAG_SRC = `
    precision mediump float;
    varying vec2 vUv;

    uniform sampler2D uTex;
    uniform vec2 uTexel;
    uniform float uTime;
    uniform float uMode;         // 0.0 = HD Neon, 1.0 = Retro CRT
    uniform float uAberration;   // 0.0..1.0 impact RGB split
    uniform vec2 uShockCenter;   // normalized UV center
    uniform float uShockRadius;  // 0.0..1.2 expanding wave
    uniform float uShockAmp;     // wave distortion strength
    uniform vec3 uGradeTint;     // regional color grading multiplier
    uniform float uBloomGain;    // bloom intensity

    float luma(vec3 c) {
      return dot(c, vec3(0.299, 0.587, 0.114));
    }

    vec3 sampleBright(vec2 uv) {
      vec3 c = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
      float br = max(0.0, luma(c) - 0.60);
      return c * br * 1.85;
    }

    void main() {
      vec2 uv = vUv;

      // 1. Optional gentle CRT barrel curvature
      if (uMode > 0.5) {
        vec2 centered = uv * 2.0 - 1.0;
        vec2 offset = centered.yx / 6.5;
        centered = centered + centered * offset * offset;
        uv = centered * 0.5 + 0.5;
        if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
          gl_FragColor = vec4(0.02, 0.03, 0.06, 1.0);
          return;
        }
      }

      // 2. Radial Shockwave UV Refraction (Ground Slam / Ultimate / K.O.)
      if (uShockAmp > 0.001) {
        vec2 diff = uv - uShockCenter;
        diff.x *= 1.7778; // 16:9 aspect correction
        float dist = length(diff);
        float band = dist - uShockRadius;
        if (abs(band) < 0.11) {
          float wave = sin(band * 28.5) * exp(-abs(band) * 24.0) * uShockAmp;
          vec2 dir = dist > 0.0001 ? normalize(diff) : vec2(0.0);
          dir.x /= 1.7778;
          uv -= dir * wave;
        }
      }

      // 3. Base Sample + Dynamic Chromatic Aberration (RGB Split on Heavy Hits / Ult / Just Dodge)
      float ca = uAberration * 0.011 + (uMode > 0.5 ? 0.0012 : 0.0);
      vec2 caDir = (uv - 0.5) * ca;
      vec3 col;
      if (ca > 0.0002) {
        col.r = texture2D(uTex, clamp(uv + caDir, 0.001, 0.999)).r;
        col.g = texture2D(uTex, clamp(uv, 0.001, 0.999)).g;
        col.b = texture2D(uTex, clamp(uv - caDir, 0.001, 0.999)).b;
      } else {
        col = texture2D(uTex, clamp(uv, 0.001, 0.999)).rgb;
      }

      // 4. Selective 9-Tap Star Bloom (Neon Signs, Ultimate Auras, Fire, Lightning, BBQ Embers)
      vec2 px = uTexel * 3.8;
      vec2 px2 = uTexel * 8.2;
      vec3 bloom = vec3(0.0);
      bloom += sampleBright(uv + vec2( px.x,  0.0));
      bloom += sampleBright(uv + vec2(-px.x,  0.0));
      bloom += sampleBright(uv + vec2( 0.0,  px.y));
      bloom += sampleBright(uv + vec2( 0.0, -px.y));
      bloom += sampleBright(uv + vec2( px2.x,  px2.y)) * 0.72;
      bloom += sampleBright(uv + vec2(-px2.x,  px2.y)) * 0.72;
      bloom += sampleBright(uv + vec2( px2.x, -px2.y)) * 0.72;
      bloom += sampleBright(uv + vec2(-px2.x, -px2.y)) * 0.72;
      bloom += sampleBright(uv) * 0.65;
      bloom /= 7.53;
      col += bloom * uBloomGain;

      // 5. Regional Film Color Grading + Subtle S-Curve Contrast Pop
      col *= uGradeTint;
      col = mix(col, col * col * (3.0 - 2.0 * col), 0.14);

      // 6. Optional CRT Phosphor Scanlines & Grille
      if (uMode > 0.5) {
        float scan = sin(uv.y * 720.0 * 3.14159) * 0.5 + 0.5;
        col *= mix(0.84, 1.04, scan);
        float grille = sin(uv.x * 1280.0 * 3.14159) * 0.5 + 0.5;
        col *= mix(0.95, 1.03, grille);
      }

      // 7. Soft Cinematic Vignette
      vec2 vigUv = uv * (1.0 - uv.yx);
      float vig = clamp(pow(vigUv.x * vigUv.y * 18.0, uMode > 0.5 ? 0.24 : 0.14), 0.0, 1.0);
      col *= mix(0.76, 1.0, vig);

      gl_FragColor = vec4(clamp(col, 0.0, 1.0), 1.0);
    }
  `;

  class ShaderFX {
    constructor() {
      this.srcCanvas = document.getElementById("game");
      this.glCanvas = document.getElementById("shader-canvas");
      this.gl = null;
      this.program = null;
      this.tex = null;
      this.ready = false;

      let saved = "hd";
      try {
        const s = localStorage.getItem(MODE_KEY);
        if (s && MODES.includes(s)) saved = s;
      } catch (_) {}
      this.mode = saved;

      // Dynamic runtime FX uniforms
      this.aberration = 0;
      this.shockX = 0.5;
      this.shockY = 0.5;
      this.shockRadius = 0;
      this.shockAmp = 0;
      this.time = 0;
      this.gradeTint = [1.02, 1.0, 1.03];
      this.targetTint = [1.02, 1.0, 1.03];
      this.bloomGain = 0.42;

      this.initGL();
      this.applyVisibility();
    }

    initGL() {
      if (!this.srcCanvas || !this.glCanvas) return;
      const gl =
        this.glCanvas.getContext("webgl", { alpha: false, antialias: false, preserveDrawingBuffer: false }) ||
        this.glCanvas.getContext("experimental-webgl", { alpha: false, antialias: false });
      if (!gl) {
        this.mode = "off";
        return;
      }
      this.gl = gl;

      const compile = (type, src) => {
        const sh = gl.createShader(type);
        gl.shaderSource(sh, src);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
          console.warn("Shader compile warning:", gl.getShaderInfoLog(sh));
          return null;
        }
        return sh;
      };

      const vs = compile(gl.VERTEX_SHADER, VERT_SRC);
      const fs = compile(gl.FRAGMENT_SHADER, FRAG_SRC);
      if (!vs || !fs) {
        this.mode = "off";
        return;
      }

      const prog = gl.createProgram();
      gl.attachShader(prog, vs);
      gl.attachShader(prog, fs);
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
        console.warn("Shader link warning:", gl.getProgramInfoLog(prog));
        this.mode = "off";
        return;
      }
      this.program = prog;
      gl.useProgram(prog);

      const buf = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buf);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
      const aPos = gl.getAttribLocation(prog, "aPos");
      gl.enableVertexAttribArray(aPos);
      gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

      const tex = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      this.tex = tex;

      this.u = {
        uTex: gl.getUniformLocation(prog, "uTex"),
        uTexel: gl.getUniformLocation(prog, "uTexel"),
        uTime: gl.getUniformLocation(prog, "uTime"),
        uMode: gl.getUniformLocation(prog, "uMode"),
        uAberration: gl.getUniformLocation(prog, "uAberration"),
        uShockCenter: gl.getUniformLocation(prog, "uShockCenter"),
        uShockRadius: gl.getUniformLocation(prog, "uShockRadius"),
        uShockAmp: gl.getUniformLocation(prog, "uShockAmp"),
        uGradeTint: gl.getUniformLocation(prog, "uGradeTint"),
        uBloomGain: gl.getUniformLocation(prog, "uBloomGain"),
      };
      gl.uniform1i(this.u.uTex, 0);
      this.ready = true;
    }

    applyVisibility() {
      if (!this.glCanvas) return;
      this.glCanvas.style.display = this.ready && this.mode !== "off" ? "block" : "none";
    }

    cycleMode() {
      if (!this.ready) return "off";
      const idx = MODES.indexOf(this.mode);
      this.mode = MODES[(idx + 1) % MODES.length];
      try {
        localStorage.setItem(MODE_KEY, this.mode);
      } catch (_) {}
      this.applyVisibility();
      return this.mode;
    }

    getLabel() {
      if (!this.ready || this.mode === "off") return "🖼️ 原始畫質";
      return this.mode === "crt" ? "📺 復古 CRT" : "✨ 霓虹 HD";
    }

    pulseAberration(strength = 0.6) {
      this.aberration = Math.min(1.0, Math.max(this.aberration, strength));
    }

    triggerShockwave(nx = 0.5, ny = 0.5, amp = 0.045) {
      this.shockX = Math.max(0.05, Math.min(0.95, nx));
      this.shockY = Math.max(0.05, Math.min(0.95, ny));
      this.shockRadius = 0.02;
      this.shockAmp = Math.min(0.08, Math.max(this.shockAmp, amp));
    }

    setRegionGrade(region) {
      if (region === "japan") {
        this.targetTint = [1.04, 0.99, 1.03]; // subtle sakura warmth
      } else if (region === "jiufen") {
        this.targetTint = [1.03, 0.98, 0.97]; // warm red-lantern night contrast
      } else if (region === "sea") {
        this.targetTint = [1.05, 1.01, 0.95]; // golden-hour tropical warmth
      } else if (region === "biolab") {
        this.targetTint = [0.95, 1.05, 0.99]; // cinematic emerald bio-lab
      } else {
        this.targetTint = [1.01, 1.01, 1.03]; // crisp arcade neon
      }
    }

    render(isBuffActive = false) {
      if (!this.ready || this.mode === "off") return;
      const gl = this.gl;

      this.time += 0.016;
      this.aberration *= 0.86;
      if (this.aberration < 0.005) this.aberration = 0;

      if (this.shockAmp > 0.001) {
        this.shockRadius += 0.032;
        this.shockAmp *= 0.92;
        if (this.shockRadius > 1.35 || this.shockAmp < 0.0015) {
          this.shockAmp = 0;
        }
      }

      for (let i = 0; i < 3; i++) {
        this.gradeTint[i] += (this.targetTint[i] - this.gradeTint[i]) * 0.06;
      }
      const targetBloom = isBuffActive ? 0.62 : this.mode === "crt" ? 0.50 : 0.42;
      this.bloomGain += (targetBloom - this.bloomGain) * 0.1;

      if (this.glCanvas.width !== this.srcCanvas.width || this.glCanvas.height !== this.srcCanvas.height) {
        this.glCanvas.width = this.srcCanvas.width;
        this.glCanvas.height = this.srcCanvas.height;
      }

      gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
      gl.bindTexture(gl.TEXTURE_2D, this.tex);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, this.srcCanvas);

      gl.uniform2f(this.u.uTexel, 1.0 / this.glCanvas.width, 1.0 / this.glCanvas.height);
      gl.uniform1f(this.u.uTime, this.time);
      gl.uniform1f(this.u.uMode, this.mode === "crt" ? 1.0 : 0.0);
      gl.uniform1f(this.u.uAberration, this.aberration);
      gl.uniform2f(this.u.uShockCenter, this.shockX, this.shockY);
      gl.uniform1f(this.u.uShockRadius, this.shockRadius);
      gl.uniform1f(this.u.uShockAmp, this.shockAmp);
      gl.uniform3f(this.u.uGradeTint, this.gradeTint[0], this.gradeTint[1], this.gradeTint[2]);
      gl.uniform1f(this.u.uBloomGain, this.bloomGain);

      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    }
  }

  window.shaderFX = new ShaderFX();
})();
