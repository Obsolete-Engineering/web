export const SYMBOL_CONTRAST_WAVE_PROFILE = {
  coreWidth: 0.12,
  desktopLift: 0.225,
  durationMs: 16_000,
  envelopeWidth: 0.38,
  leadingEdgeWidth: 0.12,
  mobileLift: 0.175,
  trailingEdgeWidth: 0.14,
  travelFraction: 0.88,
} as const;

export const advanceSymbolContrastWavePhase = (
  phase: number,
  elapsedMs: number,
  isActive: boolean,
) => {
  if (!isActive || elapsedMs <= 0) return phase;
  return (phase + elapsedMs / SYMBOL_CONTRAST_WAVE_PROFILE.durationMs) % 1;
};
