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
  uniform vec2 uCssResolution;
  uniform vec2 uResolution;
  uniform float uTime;

  float orderedDither(vec2 pixel) {
    vec2 cell = mod(floor(pixel), 4.0);
    float index = cell.x + cell.y * 4.0;
    if (index < 0.5) return 0.0;
    if (index < 1.5) return 8.0;
    if (index < 2.5) return 2.0;
    if (index < 3.5) return 10.0;
    if (index < 4.5) return 12.0;
    if (index < 5.5) return 4.0;
    if (index < 6.5) return 14.0;
    if (index < 7.5) return 6.0;
    if (index < 8.5) return 3.0;
    if (index < 9.5) return 11.0;
    if (index < 10.5) return 1.0;
    if (index < 11.5) return 9.0;
    if (index < 12.5) return 15.0;
    if (index < 13.5) return 7.0;
    if (index < 14.5) return 13.0;
    return 5.0;
  }

  float lobe(vec2 point, vec2 center, vec2 scale) {
    vec2 offset = (point - center) / scale;
    return exp(-dot(offset, offset) * 2.2);
  }

  void main() {
    float aspect = uResolution.x / max(uResolution.y, 1.0);
    vec2 paperUv = (vUv - 0.5) * vec2(aspect, 1.0);
    vec3 dye = texture2D(uDye, vUv).rgb;
    float wake = clamp(dye.r, 0.0, 1.0);
    vec2 wakeFlow = vec2(dye.r - dye.g, dye.g - dye.b) * 0.018;
    vec2 drift = vec2(sin(uTime * 0.035), cos(uTime * 0.029)) * 0.006;
    vec2 fieldUv = paperUv + wakeFlow + drift;

    vec2 markCenter = vec2(0.04, 0.05);
    float mark = lobe(fieldUv, markCenter + vec2(-0.22, 0.04), vec2(0.34, 0.27));
    mark += lobe(fieldUv, markCenter + vec2(0.2, 0.05), vec2(0.34, 0.27));
    mark += lobe(fieldUv, markCenter + vec2(0.0, -0.2), vec2(0.31, 0.3));
    float markContour = smoothstep(0.43, 0.49, mark) - smoothstep(0.58, 0.64, mark);

    float paperWave = sin(fieldUv.x * 5.1 + sin(fieldUv.y * 3.7) * 0.7) * 0.5 + 0.5;
    float density = 0.11 + markContour * 0.19 + paperWave * 0.025;
    density += wake * 0.12;
    float threshold = (orderedDither(gl_FragCoord.xy) + 0.5) / 16.0;
    float printDot = step(threshold, density);

    const vec3 paper = vec3(0.957, 0.945, 0.918);
    const vec3 surface = vec3(0.922, 0.902, 0.863);
    const vec3 inkGrey = vec3(0.435, 0.416, 0.38);
    const vec3 orange = vec3(1.0, 0.294, 0.122);
    vec3 color = mix(paper, surface, mark * 0.045 + paperWave * 0.012);
    color = mix(color, inkGrey, printDot * (0.075 + markContour * 0.035));

    float softWake = smoothstep(0.006, 0.18, wake);
    color = mix(color, orange, softWake * 0.48);
    color = mix(color, paper, smoothstep(0.38, 0.8, wake) * 0.06);

    float edgeUv = 2.0 / max(uCssResolution.x, 1.0);
    float textCore = texture2D(uTextMask, vUv).r;
    float textLeft = texture2D(uTextMask, vUv - vec2(edgeUv, 0.0)).r;
    float textRight = texture2D(uTextMask, vUv + vec2(edgeUv, 0.0)).r;
    float orangeEdge = max(textLeft - textCore, 0.0) * softWake;
    float inkEdge = max(textRight - textCore, 0.0) * softWake;
    color = mix(color, orange, orangeEdge * 0.32);
    color = mix(color, vec3(0.067), inkEdge * 0.18);

    gl_FragColor = vec4(color, 1.0);
  }
`;
