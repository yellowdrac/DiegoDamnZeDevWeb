import * as THREE from "three";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";

// Use authored colors verbatim (no linear/sRGB shift) so the accent hex maps exactly.
THREE.ColorManagement.enabled = false;

/* ===========================================================================
 * Doom energy portal — rebuilt from scratch.
 *
 * Four layered systems, all driven by the single user accent color:
 *   1. ARENA  — ~11k GPU-animated micro-particles orbiting in spirals (the
 *               "fine sand" / contained energy). Motion lives entirely in the
 *               vertex shader, so the count is basically free.
 *   2. RAYS   — thin procedural lightning arcs on the inner ring (LineSegments).
 *   3. SPARKS — CPU fire embers thrown outward from the outer ring, with drag,
 *               a little gravity and a fade-out.
 *   4. RINGS  — concentric glowing torus rings with a fresnel edge + pulse.
 *
 * The whole scene is rendered to an OPAQUE BLACK buffer and bloomed with a real
 * UnrealBloomPass. The canvas is composited with `mix-blend-mode: screen`, so on
 * the near-black hero the black drops out and only the glow adds over the page —
 * giving genuine bloom without the post-pass destroying the transparent overlay.
 *
 * Color model: the accent is DOMINANT. `palette()` derives a 4-stop ramp
 * dark-accent → accent → bright(+slight hue lift) → white. Particles map their
 * radial position onto this ramp (outer = dark/fiery, center = white-hot).
 * ======================================================================== */

const RING_R = 1.05; // base world radius of the portal ring
const BASE_TILT = -0.16;
const BURST_DUR = 700; // ms

const clamp = (v: number, a: number, b: number) => (v < a ? a : v > b ? b : v);
const frac = (v: number) => v - Math.floor(v);
const rand = (a: number, b: number) => a + Math.random() * (b - a);

// --- Color helpers ---------------------------------------------------------
function hexToHsl(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  const full = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const n = parseInt(full, 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  let s = 0;
  let hue = 0;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    if (max === r) hue = (g - b) / d + (g < b ? 6 : 0);
    else if (max === g) hue = (b - r) / d + 2;
    else hue = (r - g) / d + 4;
    hue /= 6;
  }
  return [hue, s, l];
}
const hsl = (h: number, s: number, l: number) =>
  new THREE.Color().setHSL(frac(h), clamp(s, 0, 1), clamp(l, 0, 1));

/**
 * 4-stop ramp from the accent: dark accent → accent → bright (slight hue lift) →
 * near-white. The accent stays dominant; e.g. red → dark red → red → white;
 * blue → dark blue → blue → bluish-white.
 */
function palette(hex: string): [THREE.Color, THREE.Color, THREE.Color, THREE.Color] {
  const [h, s, l] = hexToHsl(hex);
  return [
    hsl(h, clamp(s * 1.05, 0, 1), clamp(l * 0.45, 0.1, 0.4)), // c0 outer / dark
    hsl(h, clamp(s + 0.08, 0, 1), clamp(l + 0.02, 0.42, 0.62)), // c1 accent
    hsl(h + 0.04, clamp(s * 0.85, 0, 1), clamp(l + 0.32, 0.62, 0.85)), // c2 bright
    new THREE.Color(0xffffff).lerp(hsl(h + 0.04, 0.4, 0.85), 0.18), // c3 white-hot
  ];
}

export function createPortal(
  canvas: HTMLCanvasElement,
  accentHex: string,
  target?: HTMLElement | null
) {
  const mobile = window.innerWidth < 760;

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    preserveDrawingBuffer: true,
    powerPreference: "high-performance",
  });
  renderer.setClearColor(0x000000, 1); // opaque black — bloom-friendly
  // Composite the (black) buffer additively over the near-black hero: black
  // disappears, glow adds. This is what makes real bloom work as an overlay.
  canvas.style.mixBlendMode = "screen";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100);
  camera.position.set(0, 0, 3.6);

  const group = new THREE.Group();
  group.rotation.x = BASE_TILT;
  scene.add(group);

  let cols = palette(accentHex);
  let intensity = 1;

  // ---- Post-processing: real UnrealBloomPass (conservative: enhance, not blur)
  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(
    new THREE.Vector2(1, 1),
    1.0, // strength
    0.4, // radius
    0.5 // threshold
  );
  composer.addPass(bloom);

  /* ====================================================================
   * 1) ARENA — GPU-animated orbiting micro-particles
   * ================================================================== */
  const ARENA = mobile ? 2250 : 5500;
  const aPos = new Float32Array(ARENA * 3);
  const aRadius = new Float32Array(ARENA);
  const aAngle = new Float32Array(ARENA);
  const aSpeed = new Float32Array(ARENA);
  const aZ = new Float32Array(ARENA);
  const aPhase = new Float32Array(ARENA);
  const aWob = new Float32Array(ARENA);
  const aSize = new Float32Array(ARENA);
  const aT = new Float32Array(ARENA); // 0 outer .. 1 center (color ramp coord)

  // Inner radius = the logo's circumscribed-circle radius (group-local units, ring
  // at RING_R=1.05). Leaves a clean central hole so the dust orbits AROUND the logo
  // instead of behind it. ~0.68 = logo art (~0.27·wrap-width) over the ring mapping
  // (0.42·wrap-width); rounded up slightly for a small safety gap.
  const R_MIN = 0.7;
  const R_MAX = 1.5;
  for (let i = 0; i < ARENA; i++) {
    // bias slightly outward so the rim band reads denser, like the reference
    const r = R_MIN + (R_MAX - R_MIN) * Math.pow(Math.random(), 0.7);
    const ang = Math.random() * Math.PI * 2;
    aRadius[i] = r;
    aAngle[i] = ang;
    aSpeed[i] = (0.15 + Math.random() * 0.5) * (Math.random() < 0.5 ? 1 : -1);
    aZ[i] = (Math.random() - 0.5) * 0.5;
    aPhase[i] = Math.random() * Math.PI * 2;
    aWob[i] = 0.4 + Math.random() * 1.4;
    // power dist: mostly micro dust (≈1px), a few brighter specks
    aSize[i] = 0.25 + 1.4 * Math.pow(Math.random(), 3.0);
    aT[i] = clamp(1 - (r - R_MIN) / (R_MAX - R_MIN), 0, 1);
    aPos[i * 3] = Math.cos(ang) * r;
    aPos[i * 3 + 1] = Math.sin(ang) * r;
    aPos[i * 3 + 2] = aZ[i];
  }

  const arenaGeo = new THREE.BufferGeometry();
  arenaGeo.setAttribute("position", new THREE.BufferAttribute(aPos, 3));
  arenaGeo.setAttribute("aRadius", new THREE.BufferAttribute(aRadius, 1));
  arenaGeo.setAttribute("aAngle", new THREE.BufferAttribute(aAngle, 1));
  arenaGeo.setAttribute("aSpeed", new THREE.BufferAttribute(aSpeed, 1));
  arenaGeo.setAttribute("aZ", new THREE.BufferAttribute(aZ, 1));
  arenaGeo.setAttribute("aPhase", new THREE.BufferAttribute(aPhase, 1));
  arenaGeo.setAttribute("aWob", new THREE.BufferAttribute(aWob, 1));
  arenaGeo.setAttribute("aSize", new THREE.BufferAttribute(aSize, 1));
  arenaGeo.setAttribute("aT", new THREE.BufferAttribute(aT, 1));

  const arenaMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uTime: { value: 0 },
      uBurst: { value: 0 },
      uPix: { value: 30 },
      uMaxPix: { value: 5 },
      uIntensity: { value: intensity },
      uC0: { value: cols[0].clone() },
      uC1: { value: cols[1].clone() },
      uC2: { value: cols[2].clone() },
      uC3: { value: cols[3].clone() },
    },
    vertexShader: `
      uniform float uTime; uniform float uBurst; uniform float uPix; uniform float uMaxPix;
      attribute float aRadius; attribute float aAngle; attribute float aSpeed;
      attribute float aZ; attribute float aPhase; attribute float aWob;
      attribute float aSize; attribute float aT;
      varying float vT; varying float vTw;
      void main(){
        float t = uTime;
        // angular speed scales ~1/radius: inner dust whirls faster than the rim
        float ang = aAngle + t * aSpeed * (0.55 / (aRadius + 0.25));
        // pure rotation: constant radius/depth per particle — no radial breathing
        // and no burst push-in/out. Particles only orbit; variety comes from each
        // one's radius, speed and direction, not from pulsing.
        float r = aRadius;
        float z = aZ;
        vec3 pos = vec3(cos(ang) * r, sin(ang) * r, z);
        vec4 mv = modelViewMatrix * vec4(pos, 1.0);
        gl_Position = projectionMatrix * mv;
        float ps = clamp(aSize * uPix / -mv.z, 1.0, uMaxPix);
        gl_PointSize = ps;
        vT = aT;
        vTw = 0.55 + 0.45 * sin(t * 3.0 + aPhase * 5.0); // twinkle
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uC0; uniform vec3 uC1; uniform vec3 uC2; uniform vec3 uC3;
      uniform float uIntensity;
      varying float vT; varying float vTw;
      void main(){
        // crisp tiny dot (points are only a few px, so a short AA edge is enough)
        float d = length(gl_PointCoord - 0.5);
        float mask = 1.0 - smoothstep(0.38, 0.5, d);
        if (mask <= 0.0) discard;
        float core = 1.0 - smoothstep(0.0, 0.34, d);
        // radial color ramp: outer dark → accent → bright → white-hot core
        vec3 col;
        if (vT < 0.5)       col = mix(uC0, uC1, vT / 0.5);
        else if (vT < 0.85) col = mix(uC1, uC2, (vT - 0.5) / 0.35);
        else                col = mix(uC2, uC3, (vT - 0.85) / 0.15);
        col = mix(col, vec3(1.0), core * 0.45);
        float a = mask * (0.85 + 0.15 * core) * vTw * uIntensity;
        gl_FragColor = vec4(col, a); // AdditiveBlending(SrcAlpha,One)
      }
    `,
  });
  const arena = new THREE.Points(arenaGeo, arenaMat);
  arena.frustumCulled = false; // positions are computed in the shader
  group.add(arena);

  /* ====================================================================
   * 2) RAYS — thin procedural lightning arcs on the inner ring
   * ================================================================== */
  const RAY_COUNT = mobile ? 5 : 9;
  const RAY_PTS = 11; // points per bolt
  const RAY_SEG = RAY_PTS - 1;
  const rayVerts = RAY_COUNT * RAY_SEG * 2; // LineSegments draws disjoint pairs
  const rayPos = new Float32Array(rayVerts * 3);
  const rayAlpha = new Float32Array(rayVerts);
  type Bolt = { on: boolean; born: number; dur: number; a0: number; sweep: number; jag: number[] };
  const bolts: Bolt[] = [];
  for (let k = 0; k < RAY_COUNT; k++) {
    bolts.push({ on: false, born: 0, dur: 0, a0: 0, sweep: 0, jag: new Array(RAY_PTS).fill(0) });
  }
  const rayGeo = new THREE.BufferGeometry();
  rayGeo.setAttribute("position", new THREE.BufferAttribute(rayPos, 3));
  rayGeo.setAttribute("aAlpha", new THREE.BufferAttribute(rayAlpha, 1));
  const rayMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    uniforms: { uColor: { value: cols[3].clone() }, uIntensity: { value: intensity } },
    vertexShader: `
      attribute float aAlpha; varying float vA;
      void main(){
        vA = aAlpha;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uColor; uniform float uIntensity; varying float vA;
      void main(){
        float a = vA * uIntensity;
        if (a <= 0.002) discard;
        gl_FragColor = vec4(uColor, a);
      }
    `,
  });
  const rays = new THREE.LineSegments(rayGeo, rayMat);
  rays.frustumCulled = false;
  group.add(rays);

  /* ====================================================================
   * 3) SPARKS — CPU fire embers flung out from the outer ring
   * ================================================================== */
  const SPARKS = mobile ? 120 : 280;
  const sPos = new Float32Array(SPARKS * 3);
  const sSize = new Float32Array(SPARKS);
  const sAlpha = new Float32Array(SPARKS);
  type Spark = { x: number; y: number; z: number; vx: number; vy: number; life: number; max: number; sz: number };
  const sparks: Spark[] = [];
  for (let i = 0; i < SPARKS; i++) {
    sparks.push({ x: 0, y: 0, z: 0, vx: 0, vy: 0, life: 0, max: 1, sz: 1 });
  }
  const spawnSpark = (s: Spark, strong: boolean) => {
    const ang = Math.random() * Math.PI * 2;
    const r = RING_R + rand(-0.02, 0.06);
    const spd = rand(0.25, 0.7) * (strong ? 1.5 : 1);
    s.x = Math.cos(ang) * r;
    s.y = Math.sin(ang) * r;
    s.z = rand(-0.1, 0.1);
    s.vx = Math.cos(ang) * spd + rand(-0.15, 0.15);
    s.vy = Math.sin(ang) * spd + rand(-0.15, 0.15);
    s.max = rand(0.5, 1.2);
    s.life = s.max;
    s.sz = rand(0.6, 1.7);
  };
  const sparkGeo = new THREE.BufferGeometry();
  sparkGeo.setAttribute("position", new THREE.BufferAttribute(sPos, 3));
  sparkGeo.setAttribute("aSize", new THREE.BufferAttribute(sSize, 1));
  sparkGeo.setAttribute("aAlpha", new THREE.BufferAttribute(sAlpha, 1));
  const sparkMat = new THREE.ShaderMaterial({
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: false,
    uniforms: {
      uPix: { value: 40 },
      uMaxPix: { value: 14 },
      uIntensity: { value: intensity },
      uColA: { value: cols[1].clone() }, // ember body
      uColB: { value: cols[2].clone() }, // ember hot tip
    },
    vertexShader: `
      uniform float uPix; uniform float uMaxPix;
      attribute float aSize; attribute float aAlpha;
      varying float vA;
      void main(){
        vA = aAlpha;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aSize * uPix / -mv.z, 1.0, uMaxPix);
      }
    `,
    fragmentShader: `
      precision mediump float;
      uniform vec3 uColA; uniform vec3 uColB; uniform float uIntensity;
      varying float vA;
      void main(){
        float d = length(gl_PointCoord - 0.5);
        float disc = 1.0 - smoothstep(0.34, 0.5, d);
        if (disc <= 0.0) discard;
        float core = 1.0 - smoothstep(0.0, 0.3, d);
        vec3 col = mix(uColA, mix(uColB, vec3(1.0), 0.3), core); // hot core
        float a = disc * vA * uIntensity;
        gl_FragColor = vec4(col, a);
      }
    `,
  });
  const sparkPts = new THREE.Points(sparkGeo, sparkMat);
  sparkPts.frustumCulled = false;
  group.add(sparkPts);

  /* ====================================================================
   * 4) RINGS — concentric glowing torus rings (fresnel edge + pulse)
   * ================================================================== */
  const ringMats: THREE.ShaderMaterial[] = [];
  const ringMeshes: THREE.Mesh[] = [];
  const ringGeos: THREE.TorusGeometry[] = [];
  const makeRing = (color: THREE.Color, radius: number, tube: number, phase: number) => {
    const geo = new THREE.TorusGeometry(radius, tube, 12, 220);
    const mat = new THREE.ShaderMaterial({
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      uniforms: {
        uColor: { value: color.clone() },
        uPulse: { value: 1 },
        uIntensity: { value: intensity },
        uPhase: { value: phase },
      },
      vertexShader: `
        varying vec3 vN; varying vec3 vV;
        void main(){
          vec4 wp = modelMatrix * vec4(position, 1.0);
          vN = normalize(mat3(modelMatrix) * normal);
          vV = normalize(cameraPosition - wp.xyz);
          gl_Position = projectionMatrix * viewMatrix * wp;
        }
      `,
      fragmentShader: `
        precision mediump float;
        uniform vec3 uColor; uniform float uPulse; uniform float uIntensity;
        varying vec3 vN; varying vec3 vV;
        void main(){
          float fres = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
          vec3 col = mix(uColor, vec3(1.0), fres * 0.6); // bright near-white rim
          float a = fres * uPulse * uIntensity;
          if (a <= 0.002) discard;
          gl_FragColor = vec4(col, a);
        }
      `,
    });
    const mesh = new THREE.Mesh(geo, mat);
    group.add(mesh);
    ringGeos.push(geo);
    ringMats.push(mat);
    ringMeshes.push(mesh);
  };
  makeRing(cols[2], RING_R - 0.16, 0.012, 0); // inner bright
  makeRing(cols[1], RING_R + 0.02, 0.016, 1.6); // mid accent
  makeRing(cols[0], RING_R + 0.22, 0.022, 3.0); // outer dark/fiery

  // ---- shared material lists for bulk uniform updates ----------------------
  const allIntensity = (v: number) => {
    arenaMat.uniforms.uIntensity.value = v;
    rayMat.uniforms.uIntensity.value = v;
    sparkMat.uniforms.uIntensity.value = v;
    for (const m of ringMats) m.uniforms.uIntensity.value = v;
  };
  const applyColors = () => {
    arenaMat.uniforms.uC0.value.copy(cols[0]);
    arenaMat.uniforms.uC1.value.copy(cols[1]);
    arenaMat.uniforms.uC2.value.copy(cols[2]);
    arenaMat.uniforms.uC3.value.copy(cols[3]);
    rayMat.uniforms.uColor.value.copy(cols[3]);
    sparkMat.uniforms.uColA.value.copy(cols[1]);
    sparkMat.uniforms.uColB.value.copy(cols[2]);
    ringMats[0].uniforms.uColor.value.copy(cols[2]);
    ringMats[1].uniforms.uColor.value.copy(cols[1]);
    ringMats[2].uniforms.uColor.value.copy(cols[0]);
  };

  // ---- state ---------------------------------------------------------------
  let pointerX = 0;
  let pointerY = 0;
  let burstStart = -1e9;
  let w = 0;
  let h = 0;
  let raf = 0;
  let reduced = false;
  const t0 = performance.now();
  let lastT = t0;

  // ---- per-frame updates ---------------------------------------------------
  const updateRays = (timeSec: number, now: number) => {
    const innerR = RING_R - 0.16;
    let vi = 0;
    for (let k = 0; k < bolts.length; k++) {
      const b = bolts[k];
      if (!b.on && Math.random() < 0.03) {
        b.on = true;
        b.born = now;
        b.dur = 90 + Math.random() * 150;
        b.a0 = Math.random() * Math.PI * 2;
        b.sweep = (0.3 + Math.random() * 0.6) * (Math.random() < 0.5 ? 1 : -1);
        for (let j = 0; j < RAY_PTS; j++) b.jag[j] = (Math.random() - 0.5) * 0.09;
      }
      let life = 0;
      if (b.on) {
        const st = (now - b.born) / b.dur;
        if (st >= 1) b.on = false;
        else life = Math.sin(st * Math.PI);
      }
      let px = 0, py = 0, pz = 0;
      for (let j = 0; j < RAY_PTS; j++) {
        const f = j / (RAY_PTS - 1);
        const ang = b.a0 + b.sweep * f;
        const r = innerR + b.jag[j] + Math.sin(timeSec * 38 + j) * 0.015 * life;
        const x = Math.cos(ang) * r;
        const y = Math.sin(ang) * r;
        const z = 0.02;
        if (j > 0) {
          rayPos[vi * 3] = px; rayPos[vi * 3 + 1] = py; rayPos[vi * 3 + 2] = pz; rayAlpha[vi] = life; vi++;
          rayPos[vi * 3] = x; rayPos[vi * 3 + 1] = y; rayPos[vi * 3 + 2] = z; rayAlpha[vi] = life; vi++;
        }
        px = x; py = y; pz = z;
      }
    }
    rayGeo.attributes.position.needsUpdate = true;
    rayGeo.attributes.aAlpha.needsUpdate = true;
  };

  const updateSparks = (dt: number, burstEnv: number) => {
    for (let i = 0; i < SPARKS; i++) {
      const s = sparks[i];
      if (s.life <= 0) {
        // steady trickle of embers, plus a gush during a burst
        if (Math.random() < dt * (1.5 + burstEnv * 40)) spawnSpark(s, burstEnv > 0.2);
        else { sAlpha[i] = 0; sSize[i] = 0; continue; }
      }
      s.vx *= 0.965; // drag
      s.vy = s.vy * 0.965 - 0.25 * dt; // drag + gentle gravity
      s.x += s.vx * dt;
      s.y += s.vy * dt;
      s.life -= dt;
      const lt = clamp(s.life / s.max, 0, 1);
      sPos[i * 3] = s.x; sPos[i * 3 + 1] = s.y; sPos[i * 3 + 2] = s.z;
      sSize[i] = s.sz * (0.4 + 0.6 * lt);
      sAlpha[i] = lt * lt; // ease-out fade
    }
    sparkGeo.attributes.position.needsUpdate = true;
    sparkGeo.attributes.aSize.needsUpdate = true;
    sparkGeo.attributes.aAlpha.needsUpdate = true;
  };

  const updateRings = (timeSec: number, burstEnv: number) => {
    for (const m of ringMats) {
      const ph = m.uniforms.uPhase.value as number;
      m.uniforms.uPulse.value = 0.65 + 0.35 * Math.sin(timeSec * 1.3 + ph) + burstEnv * 0.6;
    }
  };

  const render = () => composer.render();

  const renderOnce = () => {
    group.updateMatrixWorld();
    arenaMat.uniforms.uTime.value = 3;
    updateRings(3, 0);
    render();
  };

  const frame = () => {
    const now = performance.now();
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const ms = now - t0;
    const timeSec = ms / 1000;

    // Track the target every frame so the portal follows the logo live while it
    // slides/grows in focus mode (getBoundingClientRect already includes CSS transforms).
    align();

    // parallax tilt toward the pointer (4× stronger) + slow auto-sway/spin
    const tx = BASE_TILT + clamp(pointerY, -1.2, 1.2) * 0.72;
    const ty = Math.sin(ms * 0.00022) * 0.1 + clamp(pointerX, -1.2, 1.2) * 1.12;
    group.rotation.x += (tx - group.rotation.x) * 0.07;
    group.rotation.y += (ty - group.rotation.y) * 0.07;
    group.rotation.z = ms * 0.00004;
    group.updateMatrixWorld();

    const bt = (now - burstStart) / BURST_DUR;
    const burstEnv = bt >= 0 && bt < 1 ? Math.sin(bt * Math.PI) : 0;

    arenaMat.uniforms.uTime.value = timeSec;
    arenaMat.uniforms.uBurst.value = burstEnv;
    updateRays(timeSec, now);
    updateSparks(dt, burstEnv);
    updateRings(timeSec, burstEnv);

    render();
    raf = requestAnimationFrame(frame);
  };

  // ---- layout: frame `target` (the logo card) even though the canvas is full-hero
  const align = () => {
    const cr = canvas.getBoundingClientRect();
    const tr = target ? target.getBoundingClientRect() : cr;
    if (!cr.width || !cr.height) return;
    const cx = tr.left + tr.width / 2 - cr.left;
    const cy = tr.top + tr.height / 2 - cr.top;
    const ndcx = (cx / cr.width) * 2 - 1;
    const ndcy = -((cy / cr.height) * 2 - 1);
    const fovY = (camera.fov * Math.PI) / 180;
    const halfH = Math.tan(fovY / 2) * camera.position.z;
    const halfW = halfH * camera.aspect;
    group.position.x = ndcx * halfW;
    group.position.y = ndcy * halfH;
    const worldPerPx = (2 * halfW) / cr.width;
    const radiusPx = Math.min(tr.width, tr.height) * 0.42;
    group.scale.setScalar((radiusPx * worldPerPx) / RING_R || 1);
  };

  const resize = () => {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.75);
    w = canvas.clientWidth || 1;
    h = canvas.clientHeight || 1;
    renderer.setPixelRatio(dpr);
    renderer.setSize(w, h, false);
    composer.setPixelRatio(dpr);
    composer.setSize(w, h);
    bloom.setSize(w, h);
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    const minDim = Math.min(w, h);
    arenaMat.uniforms.uPix.value = minDim * 0.045 * dpr;
    arenaMat.uniforms.uMaxPix.value = 5 * dpr;
    sparkMat.uniforms.uPix.value = minDim * 0.06 * dpr;
    sparkMat.uniforms.uMaxPix.value = 14 * dpr;
    align();
    if (reduced) renderOnce();
  };

  applyColors();

  return {
    resize,
    start(reduce: boolean) {
      reduced = reduce;
      resize();
      if (reduce) {
        renderOnce();
        return;
      }
      cancelAnimationFrame(raf);
      lastT = performance.now();
      frame();
    },
    stop() {
      cancelAnimationFrame(raf);
    },
    /** ndc of the pointer over this canvas (x,y in -1..1) — drives parallax tilt. */
    setPointer(nx: number, ny: number) {
      pointerX = nx;
      pointerY = ny;
    },
    /** kick the portal: push the arena out + gush of sparks (call on logo morph). */
    burst() {
      burstStart = performance.now();
    },
    /** Re-frame the portal onto its target now (use while the logo animates in
     *  reduced-motion mode, where the per-frame loop isn't running). */
    realign() {
      align();
      if (reduced) renderOnce();
    },
    /** Rebuild the whole palette from one accent hex. */
    setColor(hex: string) {
      cols = palette(hex);
      applyColors();
      if (reduced) renderOnce();
    },
    /** Global brightness multiplier (0 = off, 1 = default, up to ~3). */
    setIntensity(v: number) {
      intensity = clamp(v, 0, 3);
      allIntensity(intensity);
      if (reduced) renderOnce();
    },
    dispose() {
      cancelAnimationFrame(raf);
      arenaGeo.dispose();
      arenaMat.dispose();
      rayGeo.dispose();
      rayMat.dispose();
      sparkGeo.dispose();
      sparkMat.dispose();
      for (const g of ringGeos) g.dispose();
      for (const m of ringMats) m.dispose();
      bloom.dispose();
      composer.dispose();
      renderer.dispose();
    },
  };
}
