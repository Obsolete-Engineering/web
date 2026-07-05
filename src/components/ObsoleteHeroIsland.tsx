import { Player } from "@remotion/player";
import { useEffect, useState } from "react";
import { ObsoleteParticleHero } from "../remotion/ObsoleteParticleHero";

const DURATION_IN_FRAMES = 960;
const FPS = 30;
const COMPOSITION_WIDTH = 1200;
const COMPOSITION_HEIGHT = 900;

const getPrefersReducedMotion = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function ObsoleteHeroIsland() {
  const [reducedMotion, setReducedMotion] = useState(getPrefersReducedMotion);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const handleChange = () => setReducedMotion(mediaQuery.matches);

    handleChange();
    mediaQuery.addEventListener("change", handleChange);

    return () => mediaQuery.removeEventListener("change", handleChange);
  }, []);

  return (
    <div
      className="obsolete-hero-island"
      style={{
        background: "#f4f1ea",
        inset: 0,
        overflow: "hidden",
        position: "absolute",
      }}
    >
      <div
        style={{
          aspectRatio: `${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT}`,
          height: "100%",
          left: "50%",
          position: "absolute",
          top: 0,
          transform: "translateX(-50%)",
        }}
      >
        <Player
          autoPlay={!reducedMotion}
          loop={!reducedMotion}
          initiallyMuted
          controls={false}
          clickToPlay={false}
          component={ObsoleteParticleHero}
          durationInFrames={DURATION_IN_FRAMES}
          fps={FPS}
          compositionWidth={COMPOSITION_WIDTH}
          compositionHeight={COMPOSITION_HEIGHT}
          inputProps={{ reducedMotion }}
          style={{ height: "100%", width: "100%" }}
        />
      </div>
    </div>
  );
}
