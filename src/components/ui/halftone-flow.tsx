import { useEffect, useRef, type CSSProperties } from "react";

type EffectMode = "dark" | "light";

export type HalftoneFlowProps = {
  mode?: EffectMode;
  hue?: number;
  saturation?: number;
  brightness?: number;
  className?: string;
  style?: CSSProperties;
};

function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(maximum, Math.max(minimum, value));
}

const vertexShaderSource = `
  attribute vec2 a_position;
  void main() {
    gl_Position = vec4(a_position, 0.0, 1.0);
  }
`;

const fragmentShaderSource = `
  precision highp float;
  uniform vec2 u_resolution;
  uniform float u_time;
  uniform float u_light;

  mat2 rotate2d(float angle) {
    float sine = sin(angle);
    float cosine = cos(angle);
    return mat2(cosine, -sine, sine, cosine);
  }

  void main() {
    vec2 point = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / min(u_resolution.x, u_resolution.y);
    vec2 flow = point;
    float time = u_time * 0.34;

    for (float index = 1.0; index < 4.0; index++) {
      flow *= rotate2d(time * 0.08);
      flow.x += sin(flow.y * 2.1 * index + time) * 0.46;
      flow.y += cos(flow.x * 1.55 * index - time * 0.75) * 0.46;
    }

    float intensity = sin(flow.x * 2.0 + flow.y * 3.0) * 0.5 + 0.5;
    vec3 nearBlack = vec3(0.015, 0.012, 0.01);
    vec3 turboOrange = vec3(1.0, 0.302, 0.0);
    vec3 hotOrange = vec3(1.0, 0.58, 0.18);
    vec3 fluid = mix(nearBlack, turboOrange, smoothstep(0.18, 0.68, intensity));
    fluid = mix(fluid, hotOrange, smoothstep(0.76, 1.0, intensity));

    float gridSize = 6.2;
    vec2 cell = fract(gl_FragCoord.xy / gridSize) - 0.5;
    float radius = intensity * 0.43;
    float dots = smoothstep(radius, radius - 0.095, length(cell));
    vec3 darkResult = mix(vec3(0.0), fluid, dots) + fluid * 0.08;
    vec3 lightResult = mix(vec3(0.96), fluid, dots * 0.75);
    gl_FragColor = vec4(mix(darkResult, lightResult, u_light), 1.0);
  }
`;

function compileShader(gl: WebGLRenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) return null;
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }
  return shader;
}

export function HalftoneFlow({
  mode = "dark",
  hue = 0,
  saturation = 1,
  brightness = 1,
  className,
  style,
}: HalftoneFlowProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const safeHue = clamp(hue, -180, 180);
  const safeSaturation = clamp(saturation, 0, 2);
  const safeBrightness = clamp(brightness, 0.35, 1.65);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl", { alpha: false, antialias: false });
    if (!gl) return;

    const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexShaderSource);
    const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentShaderSource);
    if (!vertexShader || !fragmentShader) return;

    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertexShader);
    gl.attachShader(program, fragmentShader);
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) return;
    gl.useProgram(program);

    const buffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, 1, 1, 1, -1, -1, 1, -1]),
      gl.STATIC_DRAW,
    );
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const resolution = gl.getUniformLocation(program, "u_resolution");
    const time = gl.getUniformLocation(program, "u_time");
    const light = gl.getUniformLocation(program, "u_light");
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const startedAt = performance.now();
    let frame = 0;

    function resize() {
      if (!canvas) return;
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(canvas.clientWidth * ratio));
      const height = Math.max(1, Math.round(canvas.clientHeight * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
        gl?.viewport(0, 0, width, height);
      }
    }

    function render(now: number) {
      resize();
      gl?.uniform2f(resolution, canvas?.width ?? 1, canvas?.height ?? 1);
      gl?.uniform1f(time, reducedMotion ? 4.5 : (now - startedAt) / 1000);
      gl?.uniform1f(light, mode === "light" ? 1 : 0);
      gl?.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      if (!reducedMotion) frame = requestAnimationFrame(render);
    }

    render(performance.now());
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      gl.deleteProgram(program);
      gl.deleteShader(vertexShader);
      gl.deleteShader(fragmentShader);
      gl.deleteBuffer(buffer);
    };
  }, [mode]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className={className}
      style={{
        display: "block",
        width: "100%",
        height: "100%",
        background: "var(--surface-dark)",
        filter: `hue-rotate(${safeHue}deg) saturate(${safeSaturation}) brightness(${safeBrightness})`,
        ...style,
      }}
    />
  );
}

export default HalftoneFlow;