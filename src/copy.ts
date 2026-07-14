export const metaCopy = {
	title: "Obsolete — Creative technology for interesting ideas",
	description:
		"Obsolete is a creative technology studio designing and building ambitious digital experiences for creative companies.",
} as const;

export const accessibilityCopy = {
	skipLink: "Skip to content",
} as const;

export const headerCopy = {
	ariaLabel: "Site header",
	wordmark: "OBSOLETE",
	wordmarkAriaLabel: "Obsolete home",
	descriptor: "Creative technology studio",
	navAriaLabel: "Primary navigation",
	navItems: [
		{ label: "Work", href: "#work" },
		{ label: "Services", href: "#services" },
		{ label: "About", href: "#about" },
		{ label: "Notes", href: "#notes" },
		{ label: "Contact", href: "#contact" },
	],
} as const;

export const heroCopy = {
	title: {
		firstLine: "The internet",
		secondLine: "could be more interesting",
		punctuation: ".",
	},
	lead: "Obsolete is a creative technology studio for creative companies. We combine good taste with serious engineering to build ambitious digital experiences people actually want to spend time with.",
	actionsAriaLabel: "Hero actions",
	actions: {
		primary: {
			label: "Bring us an idea",
			href: "#contact",
			suffix: "→",
		},
		secondary: {
			label: "See our work",
			href: "#work",
		},
	},
	visualAriaLabel: "Animated Obsolete mark",
} as const;
