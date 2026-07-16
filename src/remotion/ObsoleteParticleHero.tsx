import { useLayoutEffect, useMemo, useRef } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig } from 'remotion';

export type ObsoleteParticleHeroProps = {
  reducedMotion?: boolean;
};

const colors = {
  paper: '#F4F1EA',
  ink: '#111111',
  muted: '#6F6A61',
  signal: '#FF4B1F',
};

type Particle = {
  id: number;
  homeX: number;
  homeY: number;
  pyramidX: number;
  pyramidY: number;
  logoX: number;
  logoY: number;
  disperseX: number;
  disperseY: number;
  pyramidDisperseX: number;
  pyramidDisperseY: number;
  logoDisperseX: number;
  logoDisperseY: number;
  size: number;
  depth: number;
  delay: number;
  phase: number;
  color: string;
  opacity: number;
  homeZ: number;
  pyramidZ: number;
  logoZ: number;
  disperseZ: number;
  pyramidDisperseZ: number;
  logoDisperseZ: number;
  disperseDepth: number;
  pyramidDepth: number;
  logoDepth: number;
  pyramidDisperseDepth: number;
  logoDisperseDepth: number;
  logoTone: number;
  face: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'edge' | 'signal';
  mobility: number;
  shape: 'circle' | 'square';
};

const WIDTH = 1200;
const HEIGHT = 900;
const DURATION = 960;
const LAST_FRAME = DURATION - 1;
const TAU = Math.PI * 2;
const CENTER_X = WIDTH / 2;
const CENTER_Y = HEIGHT / 2;
const SCALE = 205;
const CAMERA_ROTATE_Y = -Math.PI / 4;
const CAMERA_ROTATE_X = Math.PI / 6;

type ProjectedPoint = {
  x: number;
  y: number;
  z: number;
};

const clamp = (value: number, min = 0, max = 1) => Math.min(max, Math.max(min, value));

const lerp = (from: number, to: number, amount: number) => from + (to - from) * amount;

const smoothstep = (edge0: number, edge1: number, value: number) => {
  const x = clamp((value - edge0) / (edge1 - edge0));
  return x * x * (3 - 2 * x);
};

const seededRandom = (seed: number) => {
  let state = seed >>> 0;

  return () => {
    state += 0x6d2b79f5;
    let result = state;
    result = Math.imul(result ^ (result >>> 15), result | 1);
    result ^= result + Math.imul(result ^ (result >>> 7), result | 61);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

const project = (x: number, y: number, z: number): ProjectedPoint => {
  const cosY = Math.cos(CAMERA_ROTATE_Y);
  const sinY = Math.sin(CAMERA_ROTATE_Y);
  const cosX = Math.cos(CAMERA_ROTATE_X);
  const sinX = Math.sin(CAMERA_ROTATE_X);

  const x1 = x * cosY + z * sinY;
  const z1 = -x * sinY + z * cosY;
  const y1 = y * cosX - z1 * sinX;
  const z2 = y * sinX + z1 * cosX;

  return {
    x: CENTER_X + x1 * SCALE,
    y: CENTER_Y - y1 * SCALE,
    z: z2,
  };
};

const normalise3D = (x: number, y: number, z: number) => {
  const length = Math.sqrt(x * x + y * y + z * z) || 1;

  return {
    x: x / length,
    y: y / length,
    z: z / length,
  };
};

const addParticle = (
  particles: Particle[],
  random: () => number,
  x: number,
  y: number,
  z: number,
  face: Particle['face'],
  options: Partial<Particle> = {},
) => {
  const id = particles.length;
  const projectedHome = project(x, y, z);
  const edgeAmount = Math.max(Math.abs(x), Math.abs(y), Math.abs(z));
  const edgeBias = clamp((edgeAmount - 0.72) / 0.28);
  const direction = normalise3D(
    x * 0.9 + (random() - 0.5) * 0.55,
    y * 0.9 + (random() - 0.5) * 0.55 + 0.15,
    z * 0.9 + (random() - 0.5) * 0.55,
  );
  const mobility = options.mobility ?? clamp(0.38 + edgeBias * 0.46 + random() * 0.26);
  const distance = face === 'signal' ? 1.42 : 0.82 + mobility * 1.28 + random() * 0.62;
  const driftX = 0.16 + random() * 0.22;
  const driftY = 0.08 + random() * 0.18;
  const disperseX = x + direction.x * distance + driftX;
  const disperseY = y + direction.y * distance + driftY;
  const disperseZ = z + direction.z * distance + (random() - 0.5) * 0.2;
  const projectedDisperse = project(disperseX, disperseY, disperseZ);
  const isSignal = face === 'signal';
  const isEdge = face === 'edge';
  const isDimFace = face === 'back' || face === 'left' || face === 'bottom';

  particles.push({
    id,
    homeX: projectedHome.x,
    homeY: projectedHome.y,
    pyramidX: projectedHome.x,
    pyramidY: projectedHome.y,
    logoX: projectedHome.x,
    logoY: projectedHome.y,
    disperseX: projectedDisperse.x,
    disperseY: projectedDisperse.y,
    pyramidDisperseX: projectedDisperse.x,
    pyramidDisperseY: projectedDisperse.y,
    logoDisperseX: projectedDisperse.x,
    logoDisperseY: projectedDisperse.y,
    size:
      options.size ??
      (isSignal ? 3.1 + random() * 1.35 : isEdge ? 2.1 + random() * 1.05 : 1.45 + random() * 0.95),
    depth: projectedHome.z,
    delay: options.delay ?? clamp((1 - edgeBias) * 0.28 + random() * 0.28),
    phase: options.phase ?? random() * TAU,
    color:
      options.color ??
      (isSignal
        ? colors.signal
        : isEdge
          ? colors.ink
          : random() < 0.28
            ? colors.ink
            : colors.muted),
    opacity:
      options.opacity ??
      (isSignal
        ? 0.84
        : isEdge
          ? 0.78
          : isDimFace
            ? 0.32 + random() * 0.18
            : 0.5 + random() * 0.28),
    homeZ: z,
    pyramidZ: z,
    logoZ: z,
    disperseZ,
    pyramidDisperseZ: disperseZ,
    logoDisperseZ: disperseZ,
    disperseDepth: projectedDisperse.z,
    pyramidDepth: projectedHome.z,
    logoDepth: projectedHome.z,
    pyramidDisperseDepth: projectedDisperse.z,
    logoDisperseDepth: projectedDisperse.z,
    logoTone: 0,
    face,
    mobility,
    shape: options.shape ?? (random() > 0.52 ? 'square' : 'circle'),
  });
};

const addFaceParticles = (
  particles: Particle[],
  random: () => number,
  face: Particle['face'],
  spacing: number,
) => {
  const density = face === 'back' || face === 'left' || face === 'bottom' ? 0.42 : 0.72;

  for (let a = -1; a <= 1.001; a += spacing) {
    for (let b = -1; b <= 1.001; b += spacing) {
      if (random() > density) {
        continue;
      }

      const jA = (random() - 0.5) * spacing * 0.32;
      const jB = (random() - 0.5) * spacing * 0.32;
      const u = clamp(a + jA, -1, 1);
      const v = clamp(b + jB, -1, 1);

      if (face === 'front') {
        addParticle(particles, random, u, v, 1, face);
      }

      if (face === 'back') {
        addParticle(particles, random, u, v, -1, face);
      }

      if (face === 'right') {
        addParticle(particles, random, 1, u, v, face);
      }

      if (face === 'left') {
        addParticle(particles, random, -1, u, v, face);
      }

      if (face === 'top') {
        addParticle(particles, random, u, 1, v, face);
      }

      if (face === 'bottom') {
        addParticle(particles, random, u, -1, v, face);
      }
    }
  }
};

const addLine3D = (
  particles: Particle[],
  random: () => number,
  from: [number, number, number],
  to: [number, number, number],
  count: number,
  face: Particle['face'],
  options: Partial<Particle> = {},
) => {
  for (let index = 0; index <= count; index++) {
    const progress = index / count;
    addParticle(
      particles,
      random,
      lerp(from[0], to[0], progress),
      lerp(from[1], to[1], progress),
      lerp(from[2], to[2], progress),
      face,
      options,
    );
  }
};

const addCubeEdges = (particles: Particle[], random: () => number) => {
  const corners = [-1, 1] as const;

  corners.forEach((y) => {
    corners.forEach((z) => {
      addLine3D(particles, random, [-1, y, z], [1, y, z], 54, 'edge', {
        delay: 0.02,
      });
    });
  });

  corners.forEach((x) => {
    corners.forEach((z) => {
      addLine3D(particles, random, [x, -1, z], [x, 1, z], 54, 'edge', {
        delay: 0.02,
      });
    });
  });

  corners.forEach((x) => {
    corners.forEach((y) => {
      addLine3D(particles, random, [x, y, -1], [x, y, 1], 54, 'edge', {
        delay: 0.02,
      });
    });
  });
};

type Point3D = {
  x: number;
  y: number;
  z: number;
};

const pyramidApex: Point3D = { x: 0, y: 1.22, z: 0 };
const pyramidBase = [
  { x: -1.05, y: -1.02, z: 1.05 },
  { x: 1.05, y: -1.02, z: 1.05 },
  { x: 1.05, y: -1.02, z: -1.05 },
  { x: -1.05, y: -1.02, z: -1.05 },
] as const;

const pyramidFaces: Array<[Point3D, Point3D, Point3D]> = [
  [pyramidApex, pyramidBase[0], pyramidBase[1]],
  [pyramidApex, pyramidBase[1], pyramidBase[2]],
  [pyramidApex, pyramidBase[2], pyramidBase[3]],
  [pyramidApex, pyramidBase[3], pyramidBase[0]],
  [pyramidBase[0], pyramidBase[1], pyramidBase[2]],
  [pyramidBase[0], pyramidBase[2], pyramidBase[3]],
];

const pyramidEdges: Array<[Point3D, Point3D]> = [
  [pyramidBase[0], pyramidBase[1]],
  [pyramidBase[1], pyramidBase[2]],
  [pyramidBase[2], pyramidBase[3]],
  [pyramidBase[3], pyramidBase[0]],
  [pyramidApex, pyramidBase[0]],
  [pyramidApex, pyramidBase[1]],
  [pyramidApex, pyramidBase[2]],
  [pyramidApex, pyramidBase[3]],
];

const mixPoint = (from: Point3D, to: Point3D, amount: number): Point3D => ({
  x: lerp(from.x, to.x, amount),
  y: lerp(from.y, to.y, amount),
  z: lerp(from.z, to.z, amount),
});

const sampleTriangle = (a: Point3D, b: Point3D, c: Point3D, random: () => number): Point3D => {
  let u = random();
  let v = random();

  if (u + v > 1) {
    u = 1 - u;
    v = 1 - v;
  }

  return {
    x: a.x + (b.x - a.x) * u + (c.x - a.x) * v,
    y: a.y + (b.y - a.y) * u + (c.y - a.y) * v,
    z: a.z + (b.z - a.z) * u + (c.z - a.z) * v,
  };
};

const createPyramidTarget = (particle: Particle, index: number, random: () => number): Point3D => {
  if (particle.face === 'edge') {
    const [from, to] = pyramidEdges[index % pyramidEdges.length];
    const edgeProgress = (index * 0.61803398875) % 1;
    return mixPoint(from, to, edgeProgress);
  }

  if (particle.face === 'signal') {
    const signalProgress = (index * 0.38196601125) % 1;
    return {
      x: lerp(0.18, 0.58, signalProgress),
      y: lerp(-0.02, -0.28, signalProgress),
      z: 1.08,
    };
  }

  const faceIndex = Math.floor(random() * pyramidFaces.length);
  const face = pyramidFaces[faceIndex];
  return sampleTriangle(face[0], face[1], face[2], random);
};

const assignPyramidTargets = (particles: Particle[]) => {
  const random = seededRandom(33811);

  particles.forEach((particle, index) => {
    const pyramidTarget = createPyramidTarget(particle, index, random);
    const projectedPyramid = project(pyramidTarget.x, pyramidTarget.y, pyramidTarget.z);
    const direction = normalise3D(
      pyramidTarget.x * 0.9 + (random() - 0.5) * 0.38,
      pyramidTarget.y * 0.9 + 0.18 + (random() - 0.5) * 0.28,
      pyramidTarget.z * 0.9 + (random() - 0.5) * 0.38,
    );
    const distance =
      particle.face === 'signal' ? 1.35 : 0.86 + particle.mobility * 1.34 + random() * 0.5;
    const pyramidDisperse = {
      x: pyramidTarget.x + direction.x * distance + 0.12 + random() * 0.22,
      y: pyramidTarget.y + direction.y * distance + 0.08 + random() * 0.16,
      z: pyramidTarget.z + direction.z * distance + (random() - 0.5) * 0.24,
    };
    const projectedDisperse = project(pyramidDisperse.x, pyramidDisperse.y, pyramidDisperse.z);

    particle.pyramidX = projectedPyramid.x;
    particle.pyramidY = projectedPyramid.y;
    particle.pyramidZ = pyramidTarget.z;
    particle.pyramidDepth = projectedPyramid.z;
    particle.pyramidDisperseX = projectedDisperse.x;
    particle.pyramidDisperseY = projectedDisperse.y;
    particle.pyramidDisperseZ = pyramidDisperse.z;
    particle.pyramidDisperseDepth = projectedDisperse.z;
  });
};

type Point2D = {
  x: number;
  y: number;
};

type LogoTarget = Point3D & {
  tone: number;
};

const logoOuterContour: Point2D[] = [
  { x: -0.8, y: -0.8 },
  { x: -1.06, y: -0.73 },
  { x: -1.29, y: -0.5 },
  { x: -1.42, y: -0.2 },
  { x: -1.36, y: 0.1 },
  { x: -1.16, y: 0.34 },
  { x: -0.9, y: 0.52 },
  { x: -0.69, y: 0.77 },
  { x: -0.48, y: 1.02 },
  { x: -0.18, y: 1.19 },
  { x: 0.18, y: 1.27 },
  { x: 0.52, y: 1.24 },
  { x: 0.79, y: 1.08 },
  { x: 0.98, y: 0.82 },
  { x: 1.11, y: 0.49 },
  { x: 1.25, y: 0.25 },
  { x: 1.5, y: 0.08 },
  { x: 1.66, y: -0.17 },
  { x: 1.69, y: -0.42 },
  { x: 1.56, y: -0.63 },
  { x: 1.31, y: -0.75 },
  { x: 1.02, y: -0.72 },
  { x: 0.72, y: -0.57 },
  { x: 0.41, y: -0.34 },
  { x: 0.13, y: -0.13 },
  { x: -0.15, y: 0.05 },
  { x: -0.43, y: 0.12 },
  { x: -0.63, y: 0.04 },
  { x: -0.75, y: -0.14 },
  { x: -0.72, y: -0.34 },
  { x: -0.58, y: -0.52 },
  { x: -0.53, y: -0.66 },
  { x: -0.6, y: -0.77 },
];

const logoHole = { x: 0.28, y: 0.56, radiusX: 0.44, radiusY: 0.52 };
const logoBounds = { minX: -1.44, maxX: 1.7, minY: -0.82, maxY: 1.28 };
const LOGO_SCALE_X = 1.22;
const LOGO_SCALE_Y = 1.03;
const LOGO_Y_OFFSET = -0.18;
const LOGO_FACE_SCALE = 205;
const LOGO_FACE_CENTER_X = ((logoBounds.minX + logoBounds.maxX) / 2) * LOGO_SCALE_X;
const LOGO_FACE_CENTER_Y = ((logoBounds.minY + logoBounds.maxY) / 2 + LOGO_Y_OFFSET) * LOGO_SCALE_Y;

const pointInPolygon = (point: Point2D, polygon: Point2D[]) => {
  let inside = false;

  for (let index = 0, previous = polygon.length - 1; index < polygon.length; previous = index++) {
    const currentPoint = polygon[index];
    const previousPoint = polygon[previous];
    const intersects =
      currentPoint.y > point.y !== previousPoint.y > point.y &&
      point.x <
        ((previousPoint.x - currentPoint.x) * (point.y - currentPoint.y)) /
          (previousPoint.y - currentPoint.y) +
          currentPoint.x;

    if (intersects) {
      inside = !inside;
    }
  }

  return inside;
};

const isInsideLogo2D = (point: Point2D) => {
  const holeDistance = Math.hypot(
    (point.x - logoHole.x) / logoHole.radiusX,
    (point.y - logoHole.y) / logoHole.radiusY,
  );

  return pointInPolygon(point, logoOuterContour) && holeDistance > 1;
};

const sampleClosedPolyline = (points: Point2D[], progress: number): Point2D => {
  const wrappedProgress = ((progress % 1) + 1) % 1;
  const segmentLengths = points.map((point, index) => {
    const nextPoint = points[(index + 1) % points.length];
    return Math.hypot(nextPoint.x - point.x, nextPoint.y - point.y);
  });
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  let targetLength = wrappedProgress * totalLength;

  for (let index = 0; index < points.length; index++) {
    const length = segmentLengths[index];

    if (targetLength <= length) {
      const point = points[index];
      const nextPoint = points[(index + 1) % points.length];
      const amount = length === 0 ? 0 : targetLength / length;

      return {
        x: lerp(point.x, nextPoint.x, amount),
        y: lerp(point.y, nextPoint.y, amount),
      };
    }

    targetLength -= length;
  }

  return points[0];
};

const sampleLogoBoundary = (index: number, random: () => number): Point2D => {
  const progress = (index * 0.61803398875 + random() * 0.018) % 1;
  const useHole = index % 5 === 0 || (index % 13 === 0 && random() > 0.35);

  if (useHole) {
    const angle = progress * TAU;

    return {
      x: logoHole.x + Math.cos(angle) * logoHole.radiusX,
      y: logoHole.y + Math.sin(angle) * logoHole.radiusY,
    };
  }

  return sampleClosedPolyline(logoOuterContour, progress);
};

const sampleLogoFill = (index: number, random: () => number): Point2D => {
  for (let attempt = 0; attempt < 360; attempt++) {
    const u = (index * 0.754877666 + attempt * 0.381966011 + random() * 0.024) % 1;
    const v = (index * 0.569840296 + attempt * 0.618033989 + random() * 0.024) % 1;
    const point = {
      x: lerp(logoBounds.minX, logoBounds.maxX, u),
      y: lerp(logoBounds.minY, logoBounds.maxY, v),
    };

    if (isInsideLogo2D(point)) {
      return point;
    }
  }

  return sampleLogoBoundary(index, random);
};

const createLogoTarget = (particle: Particle, index: number, random: () => number): LogoTarget => {
  const traceEdge = particle.face === 'edge' || particle.face === 'signal' || random() < 0.1;
  const logoPoint = traceEdge ? sampleLogoBoundary(index, random) : sampleLogoFill(index, random);
  const backLayer =
    (particle.face === 'back' || particle.face === 'left' || particle.face === 'bottom') &&
    random() < 0.72;
  const bevelDepth = traceEdge ? (index % 2 === 0 ? 0.07 : -0.02) : 0;

  return {
    x: logoPoint.x * LOGO_SCALE_X,
    y: (logoPoint.y + LOGO_Y_OFFSET) * LOGO_SCALE_Y,
    z: backLayer ? 0.62 + random() * 0.18 : 0.96 + random() * 0.08 + bevelDepth,
    tone: traceEdge ? 1 : backLayer ? 0.42 + random() * 0.24 : 0.68 + random() * 0.28,
  };
};

const projectLogoFaceOn = (point: Point3D): ProjectedPoint => ({
  x: CENTER_X + (point.x - LOGO_FACE_CENTER_X) * LOGO_FACE_SCALE,
  y: CENTER_Y - (point.y - LOGO_FACE_CENTER_Y) * LOGO_FACE_SCALE,
  z: point.z,
});

const assignLogoTargets = (particles: Particle[]) => {
  const random = seededRandom(91577);

  particles.forEach((particle, index) => {
    const logoTarget = createLogoTarget(particle, index, random);
    const projectedLogo = projectLogoFaceOn(logoTarget);
    const direction = normalise3D(
      logoTarget.x * 0.82 + (random() - 0.5) * 0.38,
      logoTarget.y * 0.96 + 0.16 + (random() - 0.5) * 0.3,
      logoTarget.z * 0.72 + (random() - 0.5) * 0.34,
    );
    const distance =
      particle.face === 'signal' ? 1.34 : 0.82 + particle.mobility * 1.26 + random() * 0.48;
    const logoDisperse = {
      x: logoTarget.x + direction.x * distance + 0.1 + random() * 0.2,
      y: logoTarget.y + direction.y * distance + 0.06 + random() * 0.16,
      z: logoTarget.z + direction.z * distance + (random() - 0.5) * 0.22,
    };
    const projectedDisperse = projectLogoFaceOn(logoDisperse);

    particle.logoX = projectedLogo.x;
    particle.logoY = projectedLogo.y;
    particle.logoZ = logoTarget.z;
    particle.logoDepth = projectedLogo.z;
    particle.logoDisperseX = projectedDisperse.x;
    particle.logoDisperseY = projectedDisperse.y;
    particle.logoDisperseZ = logoDisperse.z;
    particle.logoDisperseDepth = projectedDisperse.z;
    particle.logoTone = logoTarget.tone;
  });
};

const createParticles = () => {
  const random = seededRandom(71987);
  const particles: Particle[] = [];

  (['front', 'right', 'top', 'back', 'left', 'bottom'] as const).forEach((face) => {
    addFaceParticles(particles, random, face, 0.102);
  });
  addCubeEdges(particles, random);
  assignPyramidTargets(particles);
  assignLogoTargets(particles);

  return particles;
};

const delayedFrame = (frame: number, delay: number, stagger: number) =>
  (frame + delay * stagger) / LAST_FRAME;

const transitionBump = (
  t: number,
  startFrame: number,
  peakFrame: number,
  endFrame: number,
  delay: number,
) => {
  const start = delayedFrame(startFrame, delay, 22);
  const peak = delayedFrame(peakFrame, delay, 8);
  const end = delayedFrame(endFrame, delay, 18);
  const rise = smoothstep(start, peak, t);
  const fall = 1 - smoothstep(peak, end, t);

  return clamp(rise * fall);
};

const getMorphState = (t: number, delay: number) => {
  const pyramid = smoothstep(delayedFrame(124, delay, 16), delayedFrame(226, delay, 10), t);
  const logo = smoothstep(delayedFrame(418, delay, 16), delayedFrame(528, delay, 12), t);
  const cube = smoothstep(delayedFrame(724, delay, 18), delayedFrame(850, delay, 14), t);
  const cubeToPyramid = transitionBump(t, 82, 156, 244, delay);
  const pyramidToLogo = transitionBump(t, 370, 462, 556, delay);
  const logoToCube = transitionBump(t, 650, 766, 880, delay);

  return {
    pyramid,
    logo,
    cube,
    explode: Math.max(cubeToPyramid, pyramidToLogo, logoToCube),
  };
};

const mixHexColor = (from: string, to: string, amount: number) => {
  const normalise = (color: string) => color.replace('#', '');
  const source = normalise(from);
  const target = normalise(to);
  const sourceRed = parseInt(source.slice(0, 2), 16);
  const sourceGreen = parseInt(source.slice(2, 4), 16);
  const sourceBlue = parseInt(source.slice(4, 6), 16);
  const targetRed = parseInt(target.slice(0, 2), 16);
  const targetGreen = parseInt(target.slice(2, 4), 16);
  const targetBlue = parseInt(target.slice(4, 6), 16);
  const blend = clamp(amount);

  return `rgb(${Math.round(lerp(sourceRed, targetRed, blend))}, ${Math.round(
    lerp(sourceGreen, targetGreen, blend),
  )}, ${Math.round(lerp(sourceBlue, targetBlue, blend))})`;
};

type RenderedParticle = Particle & {
  x: number;
  y: number;
  z: number;
  alpha: number;
  renderSize: number;
  renderColor: string;
};

const getParticleFrameState = (
  particle: Particle,
  frame: number,
  reducedMotion: boolean,
): RenderedParticle => {
  const t = reducedMotion ? 0 : clamp(frame / LAST_FRAME);
  const loop = Math.sin(t * TAU);
  const loop01 = (1 - Math.cos(t * TAU)) / 2;
  const { pyramid, logo, cube, explode } = reducedMotion
    ? { pyramid: 0, logo: 1, cube: 0, explode: 0 }
    : getMorphState(t, particle.delay);
  const easedExplode = explode * explode * (3 - 2 * explode);
  const logoWeight = logo * (1 - cube);
  const afterPyramidX = lerp(particle.homeX, particle.pyramidX, pyramid);
  const afterPyramidY = lerp(particle.homeY, particle.pyramidY, pyramid);
  const afterPyramidDepth = lerp(particle.depth, particle.pyramidDepth, pyramid);
  const afterLogoX = lerp(afterPyramidX, particle.logoX, logo);
  const afterLogoY = lerp(afterPyramidY, particle.logoY, logo);
  const afterLogoDepth = lerp(afterPyramidDepth, particle.logoDepth, logo);
  const baseX = lerp(afterLogoX, particle.homeX, cube);
  const baseY = lerp(afterLogoY, particle.homeY, cube);
  const baseDepth = lerp(afterLogoDepth, particle.depth, cube);
  const afterPyramidBurstX = lerp(particle.disperseX, particle.pyramidDisperseX, pyramid);
  const afterPyramidBurstY = lerp(particle.disperseY, particle.pyramidDisperseY, pyramid);
  const afterPyramidBurstDepth = lerp(
    particle.disperseDepth,
    particle.pyramidDisperseDepth,
    pyramid,
  );
  const afterLogoBurstX = lerp(afterPyramidBurstX, particle.logoDisperseX, logo);
  const afterLogoBurstY = lerp(afterPyramidBurstY, particle.logoDisperseY, logo);
  const afterLogoBurstDepth = lerp(afterPyramidBurstDepth, particle.logoDisperseDepth, logo);
  const burstX = lerp(afterLogoBurstX, particle.disperseX, cube);
  const burstY = lerp(afterLogoBurstY, particle.disperseY, cube);
  const burstDepth = lerp(afterLogoBurstDepth, particle.disperseDepth, cube);
  const sway = explode;
  const logoStillness = 1 - logoWeight * 0.42;
  const waveAmount = reducedMotion ? 0 : (5.8 + sway * 5.4) * (1 - logoWeight * 0.38);
  const depthBreath = reducedMotion ? 0 : loop01 * 0.018;
  const idleScale =
    (particle.face === 'signal' ? 10 : particle.face === 'edge' ? 6.4 : 8.2) * logoStillness;
  const fieldPhase = baseX * 0.018 + baseY * 0.014 + baseDepth * 1.5;
  const idleFloatX = reducedMotion
    ? 0
    : (Math.sin(t * TAU * 2 + particle.phase * 1.7 + fieldPhase) * 0.86 +
        Math.sin(t * TAU * 5 + particle.phase * 0.6 + baseDepth) * 0.28) *
      idleScale *
      (0.65 + particle.mobility);
  const idleFloatY = reducedMotion
    ? 0
    : (Math.cos(t * TAU * 2 + particle.phase * 1.3 + fieldPhase * 0.8) * 0.78 +
        Math.cos(t * TAU * 4 + particle.phase * 0.8 - baseDepth) * 0.24) *
      idleScale *
      (0.65 + particle.mobility);
  const surfaceRipple = reducedMotion
    ? 0
    : Math.sin(t * TAU * 3 + baseX * 0.035 + baseY * 0.024 + particle.phase) *
      4.8 *
      (0.5 + particle.mobility) *
      (1 - logoWeight * 0.46);

  const homeX = baseX + baseDepth * (depthBreath * SCALE + loop * 0.4);
  const homeY = baseY - baseDepth * (depthBreath * SCALE * 0.28 - loop * 0.18);
  const waveX = Math.sin(t * TAU + particle.phase + baseY * 0.012) * waveAmount * particle.mobility;
  const waveY =
    Math.cos(t * TAU + particle.phase + baseX * 0.009) * waveAmount * 0.72 * particle.mobility;
  const swayX =
    Math.sin(t * Math.PI + particle.phase * 0.8 + baseY * 0.004) * sway * 8 * particle.mobility;
  const swayY =
    Math.cos(t * Math.PI + particle.phase * 0.7 + baseX * 0.004) * sway * 6 * particle.mobility;
  const curveX =
    Math.sin(easedExplode * Math.PI + particle.phase) * 28 * explode * particle.mobility;
  const curveY =
    -Math.cos(easedExplode * Math.PI + particle.phase * 0.7) * 18 * explode * particle.mobility;
  const firstSignal =
    smoothstep(104 / LAST_FRAME, 154 / LAST_FRAME, t) *
    (1 - smoothstep(204 / LAST_FRAME, 252 / LAST_FRAME, t));
  const secondSignal =
    smoothstep(398 / LAST_FRAME, 456 / LAST_FRAME, t) *
    (1 - smoothstep(508 / LAST_FRAME, 560 / LAST_FRAME, t));
  const thirdSignal =
    smoothstep(692 / LAST_FRAME, 760 / LAST_FRAME, t) *
    (1 - smoothstep(826 / LAST_FRAME, 888 / LAST_FRAME, t));
  const signalPeak =
    particle.face === 'signal' ? Math.max(firstSignal, secondSignal, thirdSignal) : 0;
  const x =
    homeX + idleFloatX + waveX + surfaceRipple + swayX + curveX + (burstX - baseX) * easedExplode;
  const y =
    homeY +
    idleFloatY +
    waveY -
    surfaceRipple * 0.42 +
    swayY +
    curveY +
    (burstY - baseY) * easedExplode;
  const movingAlpha = clamp(
    particle.opacity *
      (1 - easedExplode * (particle.face === 'edge' ? 0.18 : 0.34)) *
      (particle.face === 'signal' ? 1 + signalPeak * 0.62 : 1),
  );
  const logoAlpha = particle.face === 'edge' ? 0.92 : 0.66 + particle.logoTone * 0.25;
  const alpha = clamp(lerp(movingAlpha, logoAlpha * (1 - easedExplode * 0.2), logoWeight));
  const renderColor = mixHexColor(
    particle.color,
    colors.ink,
    logoWeight * (0.82 + particle.logoTone * 0.18),
  );

  return {
    ...particle,
    x,
    y,
    z: lerp(baseDepth, burstDepth, easedExplode),
    alpha,
    renderSize:
      particle.size *
      (1 + signalPeak * 0.42 + loop01 * 0.04 + logoWeight * (0.18 + particle.logoTone * 0.24)),
    renderColor,
  };
};

const drawParticle = (context: CanvasRenderingContext2D, particle: RenderedParticle) => {
  context.globalAlpha = particle.alpha;
  context.fillStyle = particle.renderColor;

  if (particle.shape === 'square') {
    context.save();
    context.translate(particle.x, particle.y);
    context.rotate(Math.sin(particle.phase + particle.z) * 0.18);
    context.fillRect(
      -particle.renderSize / 2,
      -particle.renderSize / 2,
      particle.renderSize,
      particle.renderSize,
    );
    context.restore();
    return;
  }

  context.beginPath();
  context.arc(particle.x, particle.y, particle.renderSize / 2, 0, TAU);
  context.fill();
};

const drawScene = (
  context: CanvasRenderingContext2D,
  particles: Particle[],
  frame: number,
  reducedMotion: boolean,
) => {
  context.clearRect(0, 0, WIDTH, HEIGHT);
  context.fillStyle = colors.paper;
  context.fillRect(0, 0, WIDTH, HEIGHT);

  const rendered = particles
    .map((particle) => getParticleFrameState(particle, frame, reducedMotion))
    .sort((a, b) => a.z - b.z);

  rendered.forEach((particle) => drawParticle(context, particle));
  context.globalAlpha = 1;
};

const ParticleCanvas = ({ reducedMotion }: { reducedMotion: boolean }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frame = useCurrentFrame();
  const particles = useMemo(createParticles, []);

  useLayoutEffect(() => {
    const canvas = canvasRef.current;

    if (!canvas) {
      return;
    }

    const context = canvas.getContext('2d');

    if (!context) {
      return;
    }

    const dpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1;
    canvas.width = WIDTH * dpr;
    canvas.height = HEIGHT * dpr;
    canvas.style.width = `${WIDTH}px`;
    canvas.style.height = `${HEIGHT}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);

    drawScene(context, particles, reducedMotion ? 0 : frame % DURATION, reducedMotion);
  }, [frame, particles, reducedMotion]);

  return (
    <canvas
      ref={canvasRef}
      width={WIDTH}
      height={HEIGHT}
      style={{
        width: '100%',
        height: '100%',
        display: 'block',
      }}
    />
  );
};

export const ObsoleteParticleHero = ({ reducedMotion = false }: ObsoleteParticleHeroProps) => {
  const { width, height } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.paper,
        width,
        height,
        overflow: 'hidden',
      }}
    >
      <ParticleCanvas reducedMotion={reducedMotion} />
    </AbsoluteFill>
  );
};
