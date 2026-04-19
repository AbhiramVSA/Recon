/* ── WebGL2 dithered noise background — dark recon theme ────── */

const VERT = `#version 300 es
precision mediump float;
in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }`;

const FRAG = `#version 300 es
precision mediump float;
uniform float u_time;
uniform vec2  u_res;
out vec4 fragColor;

float hash(vec2 p){
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
}

float noise(vec2 p){
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));
  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

// Ridge noise — creates crease/fold lines
float ridge(float v){
  return 1.0 - abs(v * 2.0 - 1.0);
}

// Directional FBM with slight stretch for cloth-fold creases
float fbmFold(vec2 p){
  float v = 0.0, a = 0.55;
  // Stretch x more than y to get directional folds
  mat2 rot = mat2(0.8, -0.6, 0.6, 0.8);
  for(int i = 0; i < 6; i++){
    v += a * ridge(noise(p));
    p = rot * p * 1.9 + vec2(1.7, 3.2);
    a *= 0.5;
  }
  return v;
}

float fbm(vec2 p){
  float v = 0.0, a = 0.5;
  for(int i = 0; i < 5; i++){
    v += a * noise(p);
    p *= 2.0;
    a *= 0.5;
  }
  return v;
}

float bayer4(vec2 p){
  vec2 c = mod(floor(p), 4.0);
  int idx = int(c.x) + int(c.y) * 4;
  float m[16] = float[16](
    0.0,8.0,2.0,10.0,
    12.0,4.0,14.0,6.0,
    3.0,11.0,1.0,9.0,
    15.0,7.0,13.0,5.0
  );
  return m[idx] / 16.0;
}

void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float asp = u_res.x / u_res.y;
  vec2 st = vec2(uv.x * asp, uv.y);
  float t = u_time * 0.18;

  // Slow domain warp — cloth being dragged/pushed
  vec2 warp = st;
  warp += 0.12 * vec2(
    fbm(st * 2.5 + t * 0.6 + 0.0),
    fbm(st * 2.5 + t * 0.5 + 5.0)
  );

  // Primary fold pattern — directional ridges
  float folds = fbmFold(warp * 3.0 + t * 0.3);
  // Secondary smaller creases
  float micro = fbmFold(warp * 6.0 - t * 0.2 + 8.0);
  float combined = folds * 0.65 + micro * 0.35;

  float d = bayer4(gl_FragCoord.xy);

  // Cool near-black palette — minimal warmth, deep void feel
  vec3 deep   = vec3(0.018, 0.018, 0.020);
  vec3 mid    = vec3(0.032, 0.032, 0.036);
  vec3 bright = vec3(0.046, 0.046, 0.050);
  vec3 peak   = vec3(0.056, 0.056, 0.062);

  // Dithered base
  vec3 color = mix(deep, mid, step(d, combined));
  // Fold highlights — reduced density
  color = mix(color, bright, smoothstep(0.4, 0.7, combined) * 0.055);
  // Sharp crease peaks — reduced density
  color = mix(color, peak, smoothstep(0.65, 0.85, combined) * 0.055);

  // Subtle cool ambient — removed warm glow entirely
  float gn = noise(warp * 8.0 + t * 0.5);
  vec3 coolGlow = vec3(0.05, 0.052, 0.060);
  color = mix(color, coolGlow, smoothstep(0.6, 0.8, gn) * 0.04);

  fragColor = vec4(color, 1.0);
}`;

export function initShader(canvas: HTMLCanvasElement): (() => void) | null {
  const gl = canvas.getContext('webgl2', { alpha: false, antialias: false });
  if (!gl) return null;

  function compile(type: number, src: string): WebGLShader | null {
    const s = gl!.createShader(type);
    if (!s) return null;
    gl!.shaderSource(s, src);
    gl!.compileShader(s);
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) {
      console.error(gl!.getShaderInfoLog(s));
      gl!.deleteShader(s);
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return null;

  const pgm = gl.createProgram()!;
  gl.attachShader(pgm, vs);
  gl.attachShader(pgm, fs);
  gl.linkProgram(pgm);
  if (!gl.getProgramParameter(pgm, gl.LINK_STATUS)) {
    console.error(gl.getProgramInfoLog(pgm));
    return null;
  }
  gl.useProgram(pgm);

  const buf = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buf);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

  const aPos = gl.getAttribLocation(pgm, 'a_pos');
  gl.enableVertexAttribArray(aPos);
  gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

  const uTime = gl.getUniformLocation(pgm, 'u_time');
  const uRes = gl.getUniformLocation(pgm, 'u_res');

  let raf = 0;
  let running = true;

  function resize() {
    const dpr = Math.min(window.devicePixelRatio, 1.5);
    canvas.width = canvas.clientWidth * dpr;
    canvas.height = canvas.clientHeight * dpr;
    gl!.viewport(0, 0, canvas.width, canvas.height);
  }

  function frame(t: number) {
    if (!running) return;
    resize();
    gl!.uniform1f(uTime, t * 0.001);
    gl!.uniform2f(uRes, canvas.width, canvas.height);
    gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    raf = requestAnimationFrame(frame);
  }

  raf = requestAnimationFrame(frame);

  return () => {
    running = false;
    cancelAnimationFrame(raf);
  };
}
