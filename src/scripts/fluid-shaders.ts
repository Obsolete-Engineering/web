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
  uniform float uClamp;

  void main() {
    vec2 offset = vUv - uPoint;
    offset.x *= uAspect;
    float influence = exp(-dot(offset, offset) / max(uRadius, 0.0001));
    vec3 value = texture2D(uTarget, vUv).rgb + uValue * influence;
    value = mix(value, clamp(value, 0.0, 1.0), uClamp);
    gl_FragColor = vec4(value, 1.0);
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

  void main() {
    float wake = clamp(texture2D(uDye, vUv).r, 0.0, 1.0);
    float softWake = smoothstep(0.004, 0.16, wake);
    float strongWake = smoothstep(0.035, 0.42, wake);
    float threshold = (orderedDither(vUv * uCssResolution) + 0.5) / 16.0;
    float density = mix(0.18, 0.72, strongWake);
    float printDot = step(threshold, density);

    const vec3 paper = vec3(0.957, 0.945, 0.918);
    const vec3 ink = vec3(0.067);
    const vec3 orange = vec3(1.0, 0.294, 0.122);

    float wakePrint = softWake * mix(0.5, 0.96, printDot);
    vec3 color = mix(paper, orange, wakePrint);

    float textMask = texture2D(uTextMask, vUv).a;
    vec3 textColor = mix(ink, orange, softWake * mix(0.62, 1.0, printDot));
    color = mix(color, textColor, textMask);

    gl_FragColor = vec4(color, 1.0);
  }
`;
