import { SYMBOL_CONTRAST_WAVE_PROFILE } from './symbol-contrast-wave';

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
  uniform sampler2D uVelocity;
  uniform vec2 uCeremonyOrigin;
  uniform vec2 uCssResolution;
  uniform vec2 uDyeTexelSize;
  uniform vec2 uQuietPointer;
  uniform float uCeremonyImpulse;
  uniform float uCeremonyIntensity;
  uniform float uCeremonyProgress;
  uniform float uContrastWavePhase;
  uniform float uQuietPointerStrength;
  uniform float uTime;

  float hash21(vec2 point) {
    point = fract(point * vec2(123.34, 456.21));
    point += dot(point, point + 45.32);
    return fract(point.x * point.y);
  }

  float box(vec2 point, vec2 halfSize) {
    float distanceToEdge = max(abs(point.x) - halfSize.x, abs(point.y) - halfSize.y);
    float softEdgeStart = mix(-0.45 - 0.8 * uCeremonyIntensity, -0.45, uCeremonyProgress);
    float softEdgeEnd = mix(0.55 + 0.7 * uCeremonyIntensity, 0.55, uCeremonyProgress);
    return 1.0 - smoothstep(softEdgeStart, softEdgeEnd, distanceToEdge);
  }

  float symbol(vec2 pixel, float cellSize) {
    vec2 cell = floor(pixel / cellSize);
    vec2 local = mod(pixel, cellSize) - cellSize * 0.5;
    float variant = hash21(cell);
    float offset = cellSize * 0.19;
    float unit = max(cellSize * 0.105, 0.72);
    float mark = 0.0;

    if (variant < 0.24) {
      mark = max(
        box(local - vec2(offset), vec2(unit)),
        box(local + vec2(offset), vec2(unit))
      );
    } else if (variant < 0.48) {
      mark = max(
        box(local - vec2(offset, -offset), vec2(unit)),
        box(local + vec2(offset, -offset), vec2(unit))
      );
    } else if (variant < 0.72) {
      mark = max(
        box(local, vec2(unit * 2.45, unit * 0.58)),
        box(local, vec2(unit * 0.58, unit * 2.45))
      );
    } else {
      mark = max(
        max(box(local - vec2(offset), vec2(unit * 0.72)), box(local + vec2(offset), vec2(unit * 0.72))),
        max(box(local - vec2(offset, -offset), vec2(unit * 0.72)), box(local + vec2(offset, -offset), vec2(unit * 0.72)))
      );
    }

    return mark;
  }

  void main() {
    float fieldScale = 1.0 + (1.0 - uCeremonyProgress) * 0.065 * uCeremonyIntensity;
    vec2 ceremonyUv = 0.5 + (vUv - 0.5) / fieldScale;
    vec2 pixel = ceremonyUv * uCssResolution;
    float aspect = uCssResolution.x / max(uCssResolution.y, 1.0);
    vec2 centered = ceremonyUv - 0.5;
    centered.x *= aspect;

    vec2 impulseOffset = vUv - uCeremonyOrigin;
    impulseOffset.x *= aspect;
    float impulseDistance = length(impulseOffset);
    float pressureFront = mix(0.04, 1.3, uCeremonyProgress);
    float pressureResponse = exp(-abs(impulseDistance - pressureFront) * 7.5);
    pressureResponse += exp(-impulseDistance * 2.6) * 0.22;
    pressureResponse *= uCeremonyImpulse;

    vec2 quietPointerOffset = vUv - uQuietPointer;
    quietPointerOffset.x *= aspect;
    float quietPointerDistance = length(quietPointerOffset);
    float quietPointerResponse = exp(-dot(quietPointerOffset, quietPointerOffset) / 0.012);
    quietPointerResponse *= uQuietPointerStrength;

    float slowTime = uTime * 0.115;
    vec2 ambientOffset = vec2(
      sin(centered.y * 5.2 + slowTime) + sin(centered.x * 2.3 - slowTime * 0.61),
      cos(centered.x * 4.1 - slowTime * 0.83) + sin(centered.y * 2.7 + slowTime * 0.47)
    ) * 1.15;

    vec2 velocity = texture2D(uVelocity, vUv).xy;
    float dye = clamp(texture2D(uDye, vUv).r, 0.0, 1.0);
    float dyeLeft = texture2D(uDye, vUv - vec2(uDyeTexelSize.x, 0.0)).r;
    float dyeRight = texture2D(uDye, vUv + vec2(uDyeTexelSize.x, 0.0)).r;
    float dyeBottom = texture2D(uDye, vUv - vec2(0.0, uDyeTexelSize.y)).r;
    float dyeTop = texture2D(uDye, vUv + vec2(0.0, uDyeTexelSize.y)).r;
    float interaction = smoothstep(0.004, 0.085, dye);
    vec2 dyeGradient = vec2(dyeRight - dyeLeft, dyeTop - dyeBottom);
    vec2 trailDrift = vec2(
      sin(pixel.y * 0.018 + slowTime),
      cos(pixel.x * 0.016 - slowTime * 0.8)
    ) * interaction * 1.8;
    vec2 interactiveOffset = velocity * vec2(28.0, -28.0);
    interactiveOffset += dyeGradient * vec2(22.0, -22.0) + trailDrift;
    vec2 pressureDirection = impulseOffset / max(impulseDistance, 0.001);
    interactiveOffset += pressureDirection * pressureResponse * 5.5;
    vec2 quietPointerDirection = quietPointerOffset / max(quietPointerDistance, 0.001);
    interactiveOffset += quietPointerDirection * quietPointerResponse * 3.2;
    vec2 warpedPixel = pixel + ambientOffset + interactiveOffset;

    vec2 field = centered;
    field += vec2(
      sin(field.y * 3.1 + slowTime * 0.52),
      cos(field.x * 2.6 - slowTime * 0.37)
    ) * 0.08;
    float wave = sin(field.x * 5.4 + field.y * 2.7 + slowTime * 0.74);
    wave += sin(field.y * 6.2 - field.x * 1.8 - slowTime * 0.43) * 0.72;
    wave += cos((field.x + field.y) * 3.4 + slowTime * 0.29) * 0.46;
    wave = wave / 2.18 * 0.5 + 0.5;

    float contrastWaveTravel = min(
      uContrastWavePhase / ${SYMBOL_CONTRAST_WAVE_PROFILE.travelFraction},
      1.0
    );
    float contrastWaveCurveEnvelope = sin(3.14159265 * contrastWaveTravel);
    float contrastWaveCurve = (
      sin(vUv.y * 6.2831853 + uContrastWavePhase * 6.2831853) * 0.018 +
      sin(vUv.y * 12.566371 - uContrastWavePhase * 4.3982297) * 0.008
    ) * contrastWaveCurveEnvelope;
    float contrastWaveCenter = mix(
      -${SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2 + SYMBOL_CONTRAST_WAVE_PROFILE.leadingEdgeWidth},
      ${1 + SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2 + SYMBOL_CONTRAST_WAVE_PROFILE.trailingEdgeWidth},
      contrastWaveTravel
    );
    float contrastWaveOffset = vUv.x - (contrastWaveCenter + contrastWaveCurve);
    float contrastWave = smoothstep(
      -${SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2 + SYMBOL_CONTRAST_WAVE_PROFILE.trailingEdgeWidth},
      -${SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2},
      contrastWaveOffset
    );
    contrastWave *= 1.0 - smoothstep(
      ${SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2},
      ${SYMBOL_CONTRAST_WAVE_PROFILE.coreWidth / 2 + SYMBOL_CONTRAST_WAVE_PROFILE.leadingEdgeWidth},
      contrastWaveOffset
    );
    contrastWave *= 1.0 - step(
      ${SYMBOL_CONTRAST_WAVE_PROFILE.travelFraction},
      uContrastWavePhase
    );

    float cellSize = mix(7.2, 8.2, smoothstep(700.0, 1400.0, uCssResolution.x));
    float mark = symbol(warpedPixel, cellSize);
    float restingDensity = mix(0.42, 0.88, smoothstep(0.16, 0.86, wave));
    float awakening = max(uCeremonyProgress, pressureResponse * 0.72);
    float latentDensity = 1.0 - 0.54 * uCeremonyIntensity;
    float density = restingDensity * mix(latentDensity, 1.0, awakening);
    float trailDensity = mix(density, 0.98, interaction * 0.72);
    float keep = step(hash21(floor(warpedPixel / cellSize) + 17.0), trailDensity);

    float centerDistance = length(centered * vec2(0.82, 1.0));
    float contentQuiet = mix(0.62, 1.0, smoothstep(0.15, 0.58, centerDistance));
    float strength = mark * keep * (0.1 + wave * 0.07) * contentQuiet;
    float latentStrength = 1.0 - 0.66 * uCeremonyIntensity;
    strength *= mix(latentStrength, 1.0, awakening);
    strength *= 1.0 + interaction * 1.15;
    float trailAlpha = interaction * mix(0.12, 0.76, mark * keep);
    float punctuationOrange = exp(-dot(impulseOffset, impulseOffset) / 0.0025);
    punctuationOrange *= uCeremonyImpulse * mix(0.26, 0.72, mark * keep);
    float orangeAmount = max(trailAlpha, punctuationOrange);
    float graphiteOnlyMask = orangeAmount > 0.0 ? 0.0 : 1.0;
    float contrastWaveLift = mix(
      ${SYMBOL_CONTRAST_WAVE_PROFILE.mobileLift},
      ${SYMBOL_CONTRAST_WAVE_PROFILE.desktopLift},
      smoothstep(700.0, 900.0, uCssResolution.x)
    );
    float contrastWaveGain = contrastWaveLift * ${SYMBOL_CONTRAST_WAVE_PROFILE.perceptualGain.toFixed(1)};
    strength *= 1.0 + contrastWave * contrastWaveGain * graphiteOnlyMask;

    const vec3 paper = vec3(0.957, 0.945, 0.918);
    const vec3 graphite = vec3(0.37, 0.385, 0.39);
    const vec3 orange = vec3(1.0, 0.294, 0.122);
    vec3 color = mix(paper, graphite, clamp(strength, 0.0, 0.24));
    color = mix(color, orange, orangeAmount);

    gl_FragColor = vec4(color, 1.0);
  }
`;
