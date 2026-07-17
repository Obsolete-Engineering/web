/* glsl */
export const fullscreenVertex = `
  precision highp float;

  attribute vec2 position;
  attribute vec2 uv;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    gl_Position = vec4(position, 0.0, 1.0);
  }
`;

/* glsl */
export const advectionFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uSource;
  uniform vec2 uTexelSize;
  uniform float uDelta;
  uniform float uDissipation;

  void main() {
    vec2 velocity = texture2D(uVelocity, vUv).xy;
    vec2 previous = clamp(vUv - velocity * uTexelSize * uDelta, 0.001, 0.999);
    gl_FragColor = texture2D(uSource, previous) * uDissipation;
  }
`;

/* glsl */
export const injectionFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uTarget;
  uniform vec2 uPoint;
  uniform vec3 uValue;
  uniform float uRadius;
  uniform float uAspect;

  void main() {
    vec2 offset = vUv - uPoint;
    offset.x *= uAspect;
    float influence = exp(-dot(offset, offset) / max(uRadius, 0.0001));
    vec4 base = texture2D(uTarget, vUv);
    gl_FragColor = base + vec4(uValue * influence, 0.0);
  }
`;

/* glsl */
export const divergenceFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform vec2 uTexelSize;

  void main() {
    float left = texture2D(uVelocity, vUv - vec2(uTexelSize.x, 0.0)).x;
    float right = texture2D(uVelocity, vUv + vec2(uTexelSize.x, 0.0)).x;
    float bottom = texture2D(uVelocity, vUv - vec2(0.0, uTexelSize.y)).y;
    float top = texture2D(uVelocity, vUv + vec2(0.0, uTexelSize.y)).y;
    gl_FragColor = vec4(0.5 * (right - left + top - bottom), 0.0, 0.0, 1.0);
  }
`;

/* glsl */
export const pressureFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uPressure;
  uniform sampler2D uDivergence;
  uniform vec2 uTexelSize;

  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    float divergence = texture2D(uDivergence, vUv).x;
    gl_FragColor = vec4((left + right + bottom + top - divergence) * 0.25, 0.0, 0.0, 1.0);
  }
`;

/* glsl */
export const gradientFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uVelocity;
  uniform sampler2D uPressure;
  uniform vec2 uTexelSize;

  void main() {
    float left = texture2D(uPressure, vUv - vec2(uTexelSize.x, 0.0)).x;
    float right = texture2D(uPressure, vUv + vec2(uTexelSize.x, 0.0)).x;
    float bottom = texture2D(uPressure, vUv - vec2(0.0, uTexelSize.y)).x;
    float top = texture2D(uPressure, vUv + vec2(0.0, uTexelSize.y)).x;
    vec2 velocity = texture2D(uVelocity, vUv).xy - 0.5 * vec2(right - left, top - bottom);
    gl_FragColor = vec4(velocity, 0.0, 1.0);
  }
`;

/* glsl */
export const displayFragment = `
  precision highp float;

  varying vec2 vUv;
  uniform sampler2D uDye;
  uniform sampler2D uTextMask;
  uniform vec2 uResolution;
  uniform vec2 uPointer;
  uniform float uPointerActive;
  uniform float uTime;

  float hash(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float noise(vec2 point) {
    vec2 cell = floor(point);
    vec2 local = fract(point);
    local = local * local * (3.0 - 2.0 * local);
    return mix(
      mix(hash(cell), hash(cell + vec2(1.0, 0.0)), local.x),
      mix(hash(cell + vec2(0.0, 1.0)), hash(cell + 1.0), local.x),
      local.y
    );
  }

  float fbm(vec2 point) {
    float value = 0.0;
    float amplitude = 0.52;
    for (int octave = 0; octave < 2; octave++) {
      value += noise(point) * amplitude;
      point = point * 2.03 + vec2(19.1, 7.7);
      amplitude *= 0.48;
    }
    return value;
  }

  vec3 palette(float heat) {
    vec3 black = vec3(0.018, 0.016, 0.016);
    vec3 charcoal = vec3(0.075, 0.061, 0.062);
    vec3 oxblood = vec3(0.29, 0.055, 0.055);
    vec3 orange = vec3(1.0, 0.225, 0.075);
    vec3 amber = vec3(1.0, 0.58, 0.19);
    vec3 color = mix(black, charcoal, smoothstep(0.06, 0.28, heat));
    color = mix(color, oxblood, smoothstep(0.2, 0.54, heat));
    color = mix(color, orange, smoothstep(0.52, 0.84, heat));
    color = mix(color, amber, smoothstep(0.88, 1.0, heat));
    return color;
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 centered = (vUv - 0.5) * vec2(aspect, 1.0);
    vec3 dye = texture2D(uDye, vUv).rgb;

    vec2 flow = vec2(dye.r - dye.b, dye.g - dye.r) * 0.035;
    vec2 foldedUv = vUv + flow;
    float broad = fbm(foldedUv * vec2(2.4, 3.3) + vec2(uTime * 0.018, -uTime * 0.012));
    float ribbons = sin(
      foldedUv.x * 17.0 + broad * 7.5 - foldedUv.y * 6.0 + sin(foldedUv.y * 8.0) * 1.4
    );
    ribbons = 1.0 - abs(ribbons);
    ribbons = pow(clamp(ribbons, 0.0, 1.0), 3.4);

    float edgeEnergy = smoothstep(0.17, 0.72, length(centered * vec2(0.72, 1.0)));
    float dyeEnergy = clamp(dot(dye, vec3(0.48, 0.36, 0.24)), 0.0, 1.0);
    float heat = clamp(broad * 0.34 + ribbons * 0.58 + dyeEnergy * 0.72, 0.0, 1.0);
    heat *= mix(0.38, 1.0, edgeEnergy);

    vec2 pointerOffset = (vUv - uPointer) * vec2(aspect, 1.0);
    float pointerLight = exp(-dot(pointerOffset, pointerOffset) * 4.8) * uPointerActive;
    heat = clamp(heat + pointerLight * 0.42, 0.0, 1.0);

    float calmZone = 1.0 - smoothstep(0.12, 0.56, length(centered * vec2(0.82, 1.16)));
    heat *= mix(1.0, 0.3, calmZone);

    vec2 textWarp = (pointerOffset / (length(pointerOffset) + 0.001) * 0.007 + flow * 0.4) * pointerLight;
    float textCore = texture2D(uTextMask, vUv).r;
    float textWarmEdge = texture2D(uTextMask, vUv + textWarp).r;
    float textDarkEdge = texture2D(uTextMask, vUv - textWarp * 1.35).r;
    vec3 displacedText =
      textWarmEdge * vec3(0.24, 0.042, 0.009) +
      textCore * vec3(0.08, 0.012, 0.004) +
      textDarkEdge * vec3(0.045, 0.004, 0.003);
    vec3 color = palette(heat);
    color += displacedText * pointerLight;
    color *= 0.92 + broad * 0.14;

    float vignette = smoothstep(1.05, 0.2, length(centered));
    color *= mix(0.63, 1.0, vignette);
    gl_FragColor = vec4(color, 1.0);
  }
`;
