import { useEffect, useRef, useMemo, memo } from "react";
import { Renderer, Program, Mesh, Triangle, Vec2 } from "ogl";

// ── Shaders ──────────────────────────────────────────────────────────

const vertex = /* glsl */ `
  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

const fragment = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform vec2  uResolution;
  uniform vec3  uColor0;
  uniform vec3  uColor1;
  uniform vec3  uColor2;
  uniform float uBlend;
  uniform float uAmplitude;
  uniform float uSpeed;
  varying vec2  vUv;

  // Simplex-ish noise helpers
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec2 mod289(vec2 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

  float snoise(vec2 v) {
    const vec4 C = vec4(0.211324865405187, 0.366025403784439,
                        -0.577350269189626, 0.024390243902439);
    vec2 i  = floor(v + dot(v, C.yy));
    vec2 x0 = v - i + dot(i, C.xx);
    vec2 i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
    vec4 x12 = x0.xyxy + C.xxzz;
    x12.xy -= i1;
    i = mod289(i);
    vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
    vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
    m = m * m;
    m = m * m;
    vec3 x = 2.0 * fract(p * C.www) - 1.0;
    vec3 h = abs(x) - 0.5;
    vec3 ox = floor(x + 0.5);
    vec3 a0 = x - ox;
    m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
    vec3 g;
    g.x  = a0.x  * x0.x  + h.x  * x0.y;
    g.yz = a0.yz * x12.xz + h.yz * x12.yw;
    return 130.0 * dot(m, g);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * uSpeed * 0.15;

    // Three layers of animated noise
    float n0 = snoise(uv * 2.0 + vec2(t * 0.3, t * 0.2)) * uAmplitude;
    float n1 = snoise(uv * 3.0 + vec2(-t * 0.2, t * 0.4)) * uAmplitude;
    float n2 = snoise(uv * 1.5 + vec2(t * 0.15, -t * 0.3)) * uAmplitude;

    // Blend colours using noise
    float mix0 = smoothstep(-0.5, 0.5, n0 + uv.x - 0.5);
    float mix1 = smoothstep(-0.5, 0.5, n1 + uv.y - 0.5);
    float mix2 = smoothstep(-0.3, 0.7, n2);

    vec3 c = mix(uColor0, uColor1, mix0);
    c = mix(c, uColor2, mix1 * 0.6);
    c += (n2 * 0.15) * uColor2;

    // Soft vignette
    float vignette = smoothstep(0.0, 0.7, 1.0 - length(uv - 0.5) * 1.2);
    c *= 0.85 + vignette * 0.15;

    gl_FragColor = vec4(c, uBlend);
  }
`;

// ── Helper: convert hex colour to normalised [r,g,b] ────────────────
function hexToGL(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.slice(0, 2), 16) / 255,
    parseInt(h.slice(2, 4), 16) / 255,
    parseInt(h.slice(4, 6), 16) / 255,
  ];
}

// ── Props ────────────────────────────────────────────────────────────
interface AuroraProps {
  /** Three hex colour stops: [dark, primary, light] */
  colorStops: [string, string, string];
  /** Global opacity / blend amount (0–1). Default 0.3 */
  blend?: number;
  /** Noise amplitude (0–3). Default 1.0 */
  amplitude?: number;
  /** Animation speed multiplier. Default 1 */
  speed?: number;
  /** Extra CSS class on the wrapper */
  className?: string;
}

/**
 * WebGL aurora background powered by ogl.
 * Memoised — only reinitialises when colorStops reference changes.
 */
function AuroraInner({
  colorStops,
  blend = 0.3,
  amplitude = 1.0,
  speed = 1,
  className = "",
}: AuroraProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number>(0);
  const rendererRef = useRef<Renderer | null>(null);

  // Stable colour values
  const c0 = useMemo(() => hexToGL(colorStops[0]), [colorStops[0]]);
  const c1 = useMemo(() => hexToGL(colorStops[1]), [colorStops[1]]);
  const c2 = useMemo(() => hexToGL(colorStops[2]), [colorStops[2]]);

  // Store scalar props in refs so the animation loop reads the latest values
  const blendRef = useRef(blend);
  const amplitudeRef = useRef(amplitude);
  const speedRef = useRef(speed);

  useEffect(() => { blendRef.current = blend; }, [blend]);
  useEffect(() => { amplitudeRef.current = amplitude; }, [amplitude]);
  useEffect(() => { speedRef.current = speed; }, [speed]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const renderer = new Renderer({
      alpha: true,
      premultipliedAlpha: false,
      antialias: true,
      dpr: Math.min(window.devicePixelRatio, 2),
    });
    rendererRef.current = renderer;
    const gl = renderer.gl;
    gl.clearColor(0, 0, 0, 0);
    el.appendChild(gl.canvas as HTMLCanvasElement);

    const geometry = new Triangle(gl);
    const program = new Program(gl, {
      vertex,
      fragment,
      uniforms: {
        uTime: { value: 0 },
        uResolution: { value: new Vec2(el.clientWidth, el.clientHeight) },
        uColor0: { value: c0 },
        uColor1: { value: c1 },
        uColor2: { value: c2 },
        uBlend: { value: blendRef.current },
        uAmplitude: { value: amplitudeRef.current },
        uSpeed: { value: speedRef.current },
      },
      transparent: true,
      depthTest: false,
    });
    const mesh = new Mesh(gl, { geometry, program });

    const resize = () => {
      renderer.setSize(el.clientWidth, el.clientHeight);
      program.uniforms.uResolution.value.set(el.clientWidth, el.clientHeight);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(el);

    let start = performance.now();
    const loop = () => {
      program.uniforms.uTime.value = (performance.now() - start) / 1000;
      // Live-update colours & params each frame from refs (cheap)
      program.uniforms.uColor0.value = c0;
      program.uniforms.uColor1.value = c1;
      program.uniforms.uColor2.value = c2;
      program.uniforms.uBlend.value = blendRef.current;
      program.uniforms.uAmplitude.value = amplitudeRef.current;
      program.uniforms.uSpeed.value = speedRef.current;
      renderer.render({ scene: mesh });
      rafRef.current = requestAnimationFrame(loop);
    };
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      ro.disconnect();
      gl.getExtension("WEBGL_lose_context")?.loseContext();
      (gl.canvas as HTMLCanvasElement).remove();
      rendererRef.current = null;
    };
    // Only recreate the GL context when the colour stops truly change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [colorStops[0], colorStops[1], colorStops[2]]);

  // Scalar uniforms (blend, amplitude, speed) update via refs inside the animation loop

  return (
    <div
      ref={containerRef}
      className={`aurora-container ${className}`}
      style={{
        position: "absolute",
        inset: 0,
        overflow: "hidden",
        pointerEvents: "none",
      }}
    />
  );
}

const Aurora = memo(AuroraInner);
export default Aurora;
