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
				display: "grid",
				inset: 0,
				minHeight: 0,
				minWidth: 0,
				overflow: "hidden",
				placeItems: "center",
				position: "absolute",
			}}
		>
			<div
				style={{
					aspectRatio: `${COMPOSITION_WIDTH} / ${COMPOSITION_HEIGHT}`,
					maxHeight: "100%",
					maxWidth: "100%",
					overflow: "hidden",
					width: "100%",
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
					style={{
						display: "block",
						height: "100%",
						maxHeight: "100%",
						maxWidth: "100%",
						overflow: "hidden",
						width: "100%",
					}}
				/>
			</div>
		</div>
	);
}
