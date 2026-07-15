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
					height: "100%",
					overflow: "hidden",
					position: "relative",
					width: "100%",
				}}
			>
				<Player
					autoPlay={!reducedMotion}
					initialFrame={560}
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
						overflow: "hidden",
						width: "100%",
					}}
				/>
				<div
					aria-hidden="true"
					style={{
						background:
							"linear-gradient(to right, #f4f1ea 0%, rgba(244, 241, 234, 0) 14%, rgba(244, 241, 234, 0) 86%, #f4f1ea 100%), linear-gradient(to bottom, #f4f1ea 0%, rgba(244, 241, 234, 0) 18%, rgba(244, 241, 234, 0) 82%, #f4f1ea 100%)",
						inset: 0,
						pointerEvents: "none",
						position: "absolute",
					}}
				/>
			</div>
		</div>
	);
}
