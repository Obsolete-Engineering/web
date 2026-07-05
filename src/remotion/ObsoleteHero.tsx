import type {ReactNode} from "react";
import {
  AbsoluteFill,
  Easing,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";

export type ObsoleteHeroProps = {
  showLabels?: boolean;
  reducedMotion?: boolean;
};

const colors = {
  paper: "#F4F1EA",
  ink: "#111111",
  muted: "#6F6A61",
  line: "#D8D2C7",
  softLine: "#BEB7AA",
  panel: "#FFFDF8",
  panelAlt: "#EBE6DC",
  signal: "#FF4B1F",
  green: "#1F8F4D",
};

const CLAMP = {extrapolateLeft: "clamp" as const, extrapolateRight: "clamp" as const};
const easeOut = Easing.bezier(0.16, 1, 0.3, 1);
const easeInOut = Easing.bezier(0.65, 0, 0.35, 1);
const mono = "'SFMono-Regular', 'Roboto Mono', 'Menlo', monospace";

const loopFrame = (frame: number, duration: number) =>
  ((frame % duration) + duration) % duration;

const panelPoints = (width: number, height: number, slant: number) =>
  `${slant},0 ${width},0 ${width - slant},${height} 0,${height}`;

const drift = (frame: number, amount: number, phase: number) =>
  Math.sin((frame + phase) / 28) * amount;

type FloatingPanelProps = {
  x: number;
  y: number;
  width: number;
  height: number;
  slant?: number;
  fill?: string;
  stroke?: string;
  opacity?: number;
  depth?: number;
  rotate?: number;
  scale?: number;
  children?: ReactNode;
};

const FloatingPanel = ({
  x,
  y,
  width,
  height,
  slant = 28,
  fill = colors.panel,
  stroke = colors.ink,
  opacity = 1,
  depth = 12,
  rotate = 0,
  scale = 1,
  children,
}: FloatingPanelProps) => {
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotate}) scale(${scale})`} opacity={opacity}>
      <polygon
        points={panelPoints(width, height, slant)}
        transform={`translate(${depth} ${depth})`}
        fill="none"
        stroke={colors.softLine}
        strokeWidth={1.2}
        opacity={0.45}
      />
      <polygon
        points={panelPoints(width, height, slant)}
        fill={fill}
        stroke={stroke}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      {children}
    </g>
  );
};

const StatusLight = ({
  x,
  y,
  color,
  frame,
  delay = 0,
  label,
}: {
  x: number;
  y: number;
  color: string;
  frame: number;
  delay?: number;
  label?: string;
}) => {
  const pulse = 0.55 + Math.sin((frame - delay) / 12) * 0.18;
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={7} fill={color} opacity={pulse} />
      <circle r={13} fill="none" stroke={color} strokeWidth={1} opacity={0.22 + pulse * 0.2} />
      {label ? (
        <text x={18} y={4} fill={colors.muted} fontFamily={mono} fontSize={12} letterSpacing={0.8}>
          {label}
        </text>
      ) : null}
    </g>
  );
};

const MicroLabel = ({
  x,
  y,
  text,
  opacity,
}: {
  x: number;
  y: number;
  text: string;
  opacity: number;
}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <rect x={-10} y={-15} width={text.length * 8 + 20} height={26} rx={13} fill={colors.panel} />
    <rect
      x={-10}
      y={-15}
      width={text.length * 8 + 20}
      height={26}
      rx={13}
      fill="none"
      stroke={colors.line}
      strokeWidth={1}
    />
    <text fill={colors.muted} fontFamily={mono} fontSize={11} letterSpacing={0.9}>
      {text}
    </text>
  </g>
);

const DottedGrid = ({frame}: {frame: number}) => {
  const opacity = interpolate(frame, [0, 55, 140, 250, 360], [0.2, 0.72, 0.92, 0.58, 0.2], CLAMP);
  const guideOpacity = interpolate(frame, [60, 120, 180, 310], [0.18, 0.72, 0.36, 0.18], CLAMP);
  const guideShift = drift(frame, 4, 0);

  return (
    <g opacity={opacity}>
      <defs>
        <pattern id="obsolete-dot-grid" width="30" height="30" patternUnits="userSpaceOnUse">
          <circle cx="1.4" cy="1.4" r="1.4" fill={colors.softLine} opacity="0.58" />
        </pattern>
      </defs>
      <rect x="72" y="72" width="1056" height="756" fill="url(#obsolete-dot-grid)" opacity={0.52} />
      <g opacity={0.38} stroke={colors.line} strokeWidth={1} strokeDasharray="2 14">
        {Array.from({length: 10}).map((_, index) => (
          <line
            key={`iso-a-${index}`}
            x1={190 + index * 84 + guideShift}
            y1={740}
            x2={510 + index * 84 + guideShift}
            y2={330}
          />
        ))}
        {Array.from({length: 9}).map((_, index) => (
          <line
            key={`iso-b-${index}`}
            x1={180 + index * 94 - guideShift}
            y1={342}
            x2={515 + index * 94 - guideShift}
            y2={742}
          />
        ))}
      </g>
      <g opacity={guideOpacity} stroke={colors.softLine} strokeWidth={1} fill="none">
        <rect x="244" y="172" width="710" height="520" rx="24" strokeDasharray="8 14" />
        <rect x="332" y="244" width="536" height="376" rx="18" strokeDasharray="4 18" />
        {[374, 474, 574, 674, 774].map((x) => (
          <g key={`tick-${x}`}>
            <line x1={x} y1={174} x2={x} y2={194} />
            <line x1={x} y1={672} x2={x} y2={692} />
          </g>
        ))}
        {[262, 352, 442, 532, 622].map((y) => (
          <g key={`side-tick-${y}`}>
            <line x1={244} y1={y} x2={266} y2={y} />
            <line x1={932} y1={y} x2={954} y2={y} />
          </g>
        ))}
      </g>
    </g>
  );
};

const RetiredMarker = ({x, y, opacity}: {x: number; y: number; opacity: number}) => (
  <g transform={`translate(${x} ${y})`} opacity={opacity}>
    <circle r="11" fill={colors.panel} stroke={colors.signal} strokeWidth="1.2" />
    <path d="M-4 -4 L4 4 M4 -4 L-4 4" stroke={colors.signal} strokeWidth="1.4" strokeLinecap="round" />
  </g>
);

type FragmentKind = "spreadsheet" | "form" | "chart" | "workflow" | "error";

type OldSystemFragmentProps = {
  frame: number;
  scanX: number;
  kind: FragmentKind;
  x: number;
  y: number;
  delay: number;
  disorder: number;
  marker?: boolean;
};

const OldSystemFragment = ({
  frame,
  scanX,
  kind,
  x,
  y,
  delay,
  disorder,
  marker = false,
}: OldSystemFragmentProps) => {
  const driftIn = interpolate(frame, [0, 70, 150, 215, 240, 310, 360], [-72 + delay * 0.7, 0, 18, 330, 330, -72 + delay * 0.7, -72 + delay * 0.7], {
    ...CLAMP,
    easing: easeInOut,
  });
  const pullY = interpolate(frame, [145 + delay * 0.25, 225 + delay * 0.25], [0, 44 - y * 0.08], {
    ...CLAMP,
    easing: easeInOut,
  });
  const opacity = interpolate(frame, [0, 58, 150, 225, 270, 310, 360], [0.34, 0.96, 1, 0.48, 0.03, 0.02, 0.34], CLAMP);
  const scale = interpolate(frame, [150 + delay * 0.2, 230 + delay * 0.2, 310, 360], [1, 0.38, 0.8, 1], CLAMP);
  const rotation = interpolate(frame, [0, 125, 225, 360], [disorder, disorder * 0.52, 0, disorder], CLAMP);
  const highlight = Math.max(0, 1 - Math.abs(scanX - (x + driftIn + 65)) / 86) * interpolate(frame, [70, 90, 155, 180], [0, 1, 1, 0], CLAMP);
  const markerOpacity = marker
    ? interpolate(frame, [94 + delay * 0.3, 118 + delay * 0.3, 170, 218], [0, 1, 1, 0], CLAMP)
    : 0;

  return (
    <g transform={`translate(${x + driftIn} ${y + pullY + drift(frame, 5, delay)}) rotate(${rotation}) scale(${scale})`} opacity={opacity}>
      <FloatingPanel x={0} y={0} width={150} height={86} slant={18} fill={colors.panel} stroke={highlight > 0.12 ? colors.signal : colors.ink} opacity={1} depth={8}>
        <rect x={16} y={13} width={116} height={7} rx={3.5} fill={colors.line} opacity={0.8} />
        {kind === "spreadsheet" ? <SpreadsheetMess /> : null}
        {kind === "form" ? <FormMess /> : null}
        {kind === "chart" ? <ChartMess /> : null}
        {kind === "workflow" ? <WorkflowMess /> : null}
        {kind === "error" ? <ErrorMess /> : null}
        <rect x={10} y={8} width={128} height={68} rx={8} fill={colors.signal} opacity={highlight * 0.08} />
      </FloatingPanel>
      <RetiredMarker x={134} y={13} opacity={markerOpacity} />
    </g>
  );
};

const SpreadsheetMess = () => (
  <g stroke={colors.softLine} strokeWidth={1} opacity={0.92}>
    {[29, 43, 57, 71].map((row) => (
      <line key={`row-${row}`} x1={18} y1={row} x2={128} y2={row} />
    ))}
    {[38, 65, 86, 112].map((col) => (
      <line key={`col-${col}`} x1={col} y1={25} x2={col} y2={76} />
    ))}
    <rect x={42} y={45} width={38} height={10} fill={colors.signal} opacity={0.12} />
    <rect x={86} y={31} width={29} height={10} fill={colors.line} opacity={0.8} />
  </g>
);

const FormMess = () => (
  <g>
    {[30, 45, 60].map((row, index) => (
      <g key={`field-${row}`} opacity={0.95}>
        <rect x={19 + index * 7} y={row} width={84 - index * 4} height={8} rx={4} fill={colors.line} />
        <rect x={109 - index * 7} y={row - 1} width={22} height={10} rx={5} fill={colors.panelAlt} stroke={colors.softLine} />
      </g>
    ))}
    <path d="M24 72 H66 M54 72 H118" stroke={colors.signal} strokeWidth={1.2} strokeLinecap="round" opacity={0.55} />
  </g>
);

const ChartMess = () => (
  <g>
    <path d="M22 68 C40 34 50 78 67 46 S91 30 122 58" fill="none" stroke={colors.ink} strokeWidth={1.4} opacity={0.76} />
    <path d="M22 58 C40 72 47 38 70 58 S94 70 126 34" fill="none" stroke={colors.signal} strokeWidth={1.1} opacity={0.44} />
    {[30, 54, 83, 111].map((bar, index) => (
      <rect key={`bar-${bar}`} x={bar} y={64 - index * 7} width={10} height={9 + index * 8} fill={colors.line} opacity={0.75} />
    ))}
  </g>
);

const WorkflowMess = () => (
  <g fill="none" strokeLinecap="round" strokeLinejoin="round">
    <path d="M24 54 C42 22 69 79 88 38 S112 46 124 25" stroke={colors.ink} strokeWidth={1.3} opacity={0.75} />
    <path d="M28 30 C47 72 75 20 112 66" stroke={colors.signal} strokeWidth={1.1} opacity={0.42} />
    {[24, 63, 92, 123].map((dot) => (
      <circle key={`node-${dot}`} cx={dot} cy={dot === 63 ? 64 : 40} r={4} fill={colors.panel} stroke={colors.softLine} />
    ))}
  </g>
);

const ErrorMess = () => (
  <g>
    <rect x={19} y={30} width={82} height={31} rx={6} fill={colors.signal} opacity={0.1} stroke={colors.signal} />
    <path d="M30 45 H72 M30 54 H92" stroke={colors.signal} strokeWidth={1.4} opacity={0.72} />
    <rect x={106} y={49} width={23} height={16} rx={8} fill={colors.ink} opacity={0.9} />
    <path d="M113 57 H123" stroke={colors.paper} strokeWidth={1.2} />
  </g>
);

const InterfaceLayer = ({
  frame,
  kind,
  x,
  y,
  width,
  height,
  openOffset,
  index,
}: {
  frame: number;
  kind: "glass" | "grid" | "logic" | "base";
  x: number;
  y: number;
  width: number;
  height: number;
  openOffset: number;
  index: number;
}) => {
  const open = interpolate(frame, [0, 68, 130, 220, 310, 360], [0.42, 0.5, 1, 0.23, 0.42, 0.42], {
    ...CLAMP,
    easing: easeInOut,
  });
  const layerY = y + openOffset * open + drift(frame, 3.5, index * 41);
  const layerX = x + interpolate(frame, [70, 150, 240, 360], [0, index % 2 === 0 ? -10 : 10, 0, 0], CLAMP);
  const repairGlow = interpolate(frame, [145, 185, 235], [0, 0.18, 0], CLAMP);

  return (
    <FloatingPanel
      x={layerX}
      y={layerY}
      width={width}
      height={height}
      slant={34}
      fill={kind === "glass" ? colors.panel : kind === "base" ? colors.panelAlt : colors.panel}
      stroke={kind === "base" ? colors.ink : colors.softLine}
      opacity={kind === "glass" ? 0.78 : 0.94}
      depth={14 + index * 2}
    >
      {kind === "glass" ? <GlassLayerContent repairGlow={repairGlow} /> : null}
      {kind === "grid" ? <GridLayerContent /> : null}
      {kind === "logic" ? <LogicLayerContent frame={frame} /> : null}
      {kind === "base" ? <BaseLayerContent frame={frame} /> : null}
    </FloatingPanel>
  );
};

const GlassLayerContent = ({repairGlow}: {repairGlow: number}) => (
  <g>
    <rect x="36" y="22" width="220" height="22" rx="11" fill={colors.panelAlt} opacity="0.78" />
    <rect x="38" y="58" width="86" height="50" rx="10" fill="none" stroke={colors.line} />
    <rect x="141" y="58" width="126" height="16" rx="8" fill={colors.line} opacity="0.75" />
    <rect x="141" y="84" width="76" height="12" rx="6" fill={colors.softLine} opacity="0.55" />
    <circle cx="249" cy="33" r="5" fill={colors.signal} opacity={0.42 + repairGlow * 2} />
    <rect x="16" y="10" width="282" height="118" rx="14" fill={colors.signal} opacity={repairGlow} />
  </g>
);

const GridLayerContent = () => (
  <g opacity="0.88">
    {[31, 53, 75, 97, 119].map((row) => (
      <line key={`mid-row-${row}`} x1="28" y1={row} x2="294" y2={row} stroke={colors.line} />
    ))}
    {[61, 112, 172, 231].map((col) => (
      <line key={`mid-col-${col}`} x1={col} y1="24" x2={col} y2="128" stroke={colors.softLine} />
    ))}
    <rect x="37" y="37" width="66" height="11" rx="5.5" fill={colors.ink} opacity="0.72" />
    <rect x="122" y="81" width="92" height="11" rx="5.5" fill={colors.green} opacity="0.18" />
    <rect x="236" y="103" width="30" height="11" rx="5.5" fill={colors.signal} opacity="0.18" />
  </g>
);

const LogicLayerContent = ({frame}: {frame: number}) => {
  const draw = interpolate(frame, [122, 190, 260], [42, 0, 10], CLAMP);
  return (
    <g opacity="0.86">
      <path d="M54 34 H122 V56 H185 V38 H250" fill="none" stroke={colors.ink} strokeWidth="1.3" strokeDasharray="72" strokeDashoffset={draw} />
      <path d="M58 101 H110 V78 H170 V104 H258" fill="none" stroke={colors.softLine} strokeWidth="1.2" strokeDasharray="7 8" />
      {[54, 122, 185, 250, 110, 170].map((cx, index) => (
        <circle key={`logic-node-${cx}-${index}`} cx={cx} cy={index < 4 ? (index === 2 ? 56 : 34 + (index % 2) * 22) : index === 4 ? 78 : 104} r="7" fill={colors.panel} stroke={index === 5 ? colors.green : colors.softLine} />
      ))}
      <rect x="30" y="118" width="238" height="8" rx="4" fill={colors.line} opacity="0.72" />
    </g>
  );
};

const BaseLayerContent = ({frame}: {frame: number}) => {
  const active = interpolate(frame, [150, 210, 270], [0, 1, 0.35], CLAMP);
  return (
    <g>
      <rect x="36" y="31" width="276" height="78" rx="16" fill="none" stroke={colors.ink} strokeWidth="1.2" opacity="0.66" />
      <rect x="57" y="53" width="92" height="13" rx="6.5" fill={colors.ink} opacity="0.82" />
      <rect x="165" y="53" width="103" height="13" rx="6.5" fill={colors.line} />
      <rect x="57" y="81" width="210" height="10" rx="5" fill={colors.signal} opacity={0.12 + active * 0.22} />
      <circle cx="298" cy="68" r="7" fill={colors.green} opacity={0.18 + active * 0.4} />
      <circle cx="298" cy="88" r="7" fill={colors.signal} opacity={0.22} />
    </g>
  );
};

const ReplacementEngine = ({frame}: {frame: number}) => {
  const {fps} = useVideoConfig();
  const pulse = spring({frame: frame - 150, fps, config: {damping: 24, mass: 0.7, stiffness: 90}});
  const settlePulse = spring({frame: frame - 226, fps, config: {damping: 28, mass: 0.55, stiffness: 120}});
  const engineScale = 1 + Math.min(pulse, 1) * 0.012 - Math.min(settlePulse, 1) * 0.008;
  const engineY = drift(frame, 4, 12);
  const slotOpacity = interpolate(frame, [150, 186, 245, 300], [0, 1, 0.9, 0.25], CLAMP);

  return (
    <g transform={`translate(416 ${258 + engineY}) scale(${engineScale})`}>
      <g opacity="0.38" stroke={colors.softLine} strokeWidth="1.1" strokeDasharray="5 9">
        <line x1="11" y1="20" x2="389" y2="20" />
        <line x1="-12" y1="314" x2="364" y2="314" />
        <line x1="30" y1="-12" x2="30" y2="342" />
        <line x1="342" y1="-4" x2="342" y2="330" />
      </g>
      <InterfaceLayer frame={frame} kind="base" x={26} y={178} width={370} height={146} openOffset={42} index={3} />
      <InterfaceLayer frame={frame} kind="logic" x={42} y={112} width={338} height={138} openOffset={14} index={2} />
      <InterfaceLayer frame={frame} kind="grid" x={30} y={52} width={358} height={146} openOffset={-18} index={1} />
      <InterfaceLayer frame={frame} kind="glass" x={53} y={-10} width={330} height={138} openOffset={-58} index={0} />
      <SideModules frame={frame} />
      <g opacity={slotOpacity} transform="translate(18 304)">
        <rect x="0" y="0" width="116" height="38" rx="12" fill={colors.panel} stroke={colors.softLine} />
        <text x="18" y="24" fill={colors.muted} fontFamily={mono} fontSize="10" letterSpacing="1">
          retired slot
        </text>
        {[0, 1, 2].map((item) => (
          <rect key={`archive-${item}`} x={88 + item * 10} y={11 + item * 2} width="16" height="12" rx="3" fill={item === 1 ? colors.signal : colors.line} opacity={item === 1 ? 0.35 : 0.8} />
        ))}
      </g>
    </g>
  );
};

const SideModules = ({frame}: {frame: number}) => {
  const open = interpolate(frame, [70, 135, 230, 360], [0, 1, 0.25, 0], CLAMP);
  return (
    <g>
      <FloatingPanel x={-42 - open * 22} y={98} width={92} height={74} slant={14} fill={colors.panelAlt} stroke={colors.softLine} opacity={0.86} depth={6}>
        <rect x="17" y="21" width="41" height="8" rx="4" fill={colors.ink} opacity="0.72" />
        <rect x="17" y="41" width="56" height="8" rx="4" fill={colors.line} />
        <circle cx="75" cy="25" r="4" fill={colors.signal} opacity="0.62" />
      </FloatingPanel>
      <FloatingPanel x={342 + open * 20} y={133} width={102} height={86} slant={16} fill={colors.panel} stroke={colors.softLine} opacity={0.9} depth={7}>
        <rect x="20" y="21" width="54" height="10" rx="5" fill={colors.green} opacity="0.18" />
        <rect x="20" y="45" width="68" height="9" rx="4.5" fill={colors.line} />
        <rect x="20" y="62" width="38" height="8" rx="4" fill={colors.softLine} opacity="0.72" />
      </FloatingPanel>
    </g>
  );
};

const ScanBeam = ({frame}: {frame: number}) => {
  const x = interpolate(frame, [70, 150, 225, 270], [260, 880, 620, 620], {
    ...CLAMP,
    easing: easeInOut,
  });
  const opacity = interpolate(frame, [58, 74, 145, 185, 230, 270], [0, 1, 1, 0.58, 0.36, 0], CLAMP);
  const tickOpacity = interpolate(frame, [72, 110, 165, 230], [0, 1, 0.44, 0], CLAMP);

  return (
    <g opacity={opacity}>
      <line x1={x} y1="138" x2={x - 56} y2="716" stroke={colors.signal} strokeWidth="2" strokeLinecap="round" />
      <line x1={x + 10} y1="164" x2={x - 45} y2="690" stroke={colors.signal} strokeWidth="0.8" opacity="0.38" />
      <g opacity={tickOpacity} stroke={colors.signal} strokeWidth="1" strokeLinecap="round">
        {Array.from({length: 11}).map((_, index) => {
          const y = 170 + index * 48;
          return <line key={`scan-tick-${index}`} x1={x - 26 - index * 4} y1={y} x2={x - 8 - index * 4} y2={y - 8} />;
        })}
      </g>
    </g>
  );
};

const scanPosition = (frame: number) =>
  interpolate(frame, [70, 150, 225, 270], [260, 880, 620, 620], {
    ...CLAMP,
    easing: easeInOut,
  });

const CleanSystemPanel = ({
  frame,
  x,
  y,
  delay,
  kind,
}: {
  frame: number;
  x: number;
  y: number;
  delay: number;
  kind: "dashboard" | "table" | "approval" | "nav";
}) => {
  const progress = interpolate(frame, [178 + delay, 238 + delay], [0, 1], {
    ...CLAMP,
    easing: easeOut,
  });
  const resetFade = interpolate(frame, [306, 360], [1, 0.18], CLAMP);
  const initialGhost = interpolate(frame, [0, 60], [0.18, 0.05], CLAMP);
  const opacity = Math.max(initialGhost, progress * resetFade);
  const slide = (1 - progress) * 92;
  const snap = Math.sin(progress * Math.PI) * 4;

  return (
    <g transform={`translate(${x + slide} ${y + snap + drift(frame, 2.4, delay * 9)})`} opacity={opacity}>
      <FloatingPanel width={kind === "nav" ? 84 : 210} height={kind === "table" ? 112 : 92} x={0} y={0} slant={18} fill={colors.panel} stroke={colors.ink} depth={8}>
        {kind === "dashboard" ? <CleanDashboard /> : null}
        {kind === "table" ? <CleanTable /> : null}
        {kind === "approval" ? <CleanApproval /> : null}
        {kind === "nav" ? <CleanNav /> : null}
      </FloatingPanel>
    </g>
  );
};

const CleanDashboard = () => (
  <g>
    <rect x="22" y="20" width="72" height="12" rx="6" fill={colors.ink} opacity="0.84" />
    <rect x="22" y="46" width="56" height="26" rx="8" fill={colors.green} opacity="0.14" stroke={colors.green} />
    <rect x="93" y="46" width="76" height="8" rx="4" fill={colors.line} />
    <rect x="93" y="64" width="52" height="8" rx="4" fill={colors.softLine} opacity="0.68" />
    <circle cx="174" cy="27" r="7" fill={colors.green} opacity="0.5" />
  </g>
);

const CleanTable = () => (
  <g stroke={colors.line} strokeWidth="1">
    <rect x="22" y="19" width="146" height="14" rx="7" fill={colors.ink} opacity="0.78" stroke="none" />
    {[50, 72, 94].map((row) => (
      <line key={`clean-row-${row}`} x1="24" y1={row} x2="176" y2={row} />
    ))}
    {[70, 123].map((col) => (
      <line key={`clean-col-${col}`} x1={col} y1="42" x2={col} y2="100" />
    ))}
    <rect x="135" y="57" width="28" height="8" rx="4" fill={colors.green} opacity="0.24" stroke="none" />
    <rect x="34" y="80" width="66" height="8" rx="4" fill={colors.softLine} opacity="0.62" stroke="none" />
  </g>
);

const CleanApproval = () => (
  <g>
    <rect x="23" y="20" width="118" height="13" rx="6.5" fill={colors.ink} opacity="0.8" />
    <rect x="23" y="48" width="75" height="20" rx="10" fill={colors.green} opacity="0.14" stroke={colors.green} />
    <path d="M41 58 L49 65 L64 50" fill="none" stroke={colors.green} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    <rect x="110" y="53" width="52" height="8" rx="4" fill={colors.line} />
  </g>
);

const CleanNav = () => (
  <g>
    <circle cx="24" cy="22" r="6" fill={colors.ink} opacity="0.82" />
    {[40, 55, 70].map((y, index) => (
      <rect key={`nav-${y}`} x="19" y={y} width={36 + index * 8} height="7" rx="3.5" fill={index === 1 ? colors.green : colors.line} opacity={index === 1 ? 0.26 : 0.82} />
    ))}
  </g>
);

const OldSystemCluster = ({frame}: {frame: number}) => {
  const scanX = scanPosition(frame);
  return (
    <g>
      <OldSystemFragment frame={frame} scanX={scanX} kind="spreadsheet" x={106} y={224} delay={0} disorder={-5} marker />
      <OldSystemFragment frame={frame} scanX={scanX} kind="form" x={164} y={348} delay={18} disorder={7} marker />
      <OldSystemFragment frame={frame} scanX={scanX} kind="chart" x={72} y={470} delay={32} disorder={-9} />
      <OldSystemFragment frame={frame} scanX={scanX} kind="workflow" x={214} y={530} delay={46} disorder={6} marker />
      <OldSystemFragment frame={frame} scanX={scanX} kind="error" x={118} y={612} delay={64} disorder={-4} />
    </g>
  );
};

const CleanSystemOutput = ({frame}: {frame: number}) => (
  <g>
    <CleanSystemPanel frame={frame} x={842} y={247} delay={0} kind="dashboard" />
    <CleanSystemPanel frame={frame} x={795} y={372} delay={12} kind="table" />
    <CleanSystemPanel frame={frame} x={887} y={522} delay={24} kind="approval" />
    <CleanSystemPanel frame={frame} x={760} y={514} delay={34} kind="nav" />
  </g>
);

const Labels = ({frame, showLabels}: {frame: number; showLabels: boolean}) => {
  if (!showLabels) {
    return null;
  }

  return (
    <g>
      <MicroLabel
        x={212}
        y={190}
        text="old way detected"
        opacity={interpolate(frame, [0, 34, 95, 130], [0, 1, 1, 0], CLAMP)}
      />
      <MicroLabel
        x={498}
        y={162}
        text="repairing interface"
        opacity={interpolate(frame, [92, 124, 210, 250], [0, 1, 1, 0], CLAMP)}
      />
      <MicroLabel
        x={812}
        y={202}
        text="replacement aligned"
        opacity={interpolate(frame, [218, 248, 320, 360], [0, 1, 1, 0], CLAMP)}
      />
    </g>
  );
};

export const ObsoleteHero = ({showLabels = true, reducedMotion = false}: ObsoleteHeroProps) => {
  const rawFrame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const frame = reducedMotion ? 220 : loopFrame(rawFrame, durationInFrames);
  const orangeStatusOpacity = interpolate(frame, [0, 30, 145, 210, 360], [0.25, 1, 1, 0.25, 0.25], CLAMP);
  const greenStatusOpacity = interpolate(frame, [220, 255, 330, 360], [0, 0.75, 0.75, 0], CLAMP);

  return (
    <AbsoluteFill style={{backgroundColor: colors.paper}}>
      <svg viewBox="0 0 1200 900" width="100%" height="100%" role="img" aria-label="Obsolete replacement engine hero animation">
        <rect width="1200" height="900" fill={colors.paper} />
        <g transform="translate(600 450) scale(1.16) translate(-600 -450)">
        <DottedGrid frame={frame} />
        <g opacity="0.56" stroke={colors.line} strokeWidth="1" fill="none">
          <path d="M285 728 C420 785 714 790 909 717" strokeDasharray="5 12" />
          <path d="M339 192 C485 118 726 116 864 186" strokeDasharray="3 14" />
        </g>
        <OldSystemCluster frame={frame} />
        <CleanSystemOutput frame={frame} />
        <ReplacementEngine frame={frame} />
        <ScanBeam frame={frame} />
        <g opacity={orangeStatusOpacity}>
          <StatusLight x={232} y={167} color={colors.signal} frame={frame} />
        </g>
        <g opacity={greenStatusOpacity}>
          <StatusLight x={902} y={183} color={colors.green} frame={frame} />
        </g>
        <Labels frame={frame} showLabels={showLabels} />
        </g>
      </svg>
    </AbsoluteFill>
  );
};
