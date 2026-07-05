export const metaCopy = {
  title: "Obsolete — Beautiful software for retiring bad systems",
  description:
    "A design-led software house for replacing outdated tools, workflows, and badly designed software.",
} as const;

export const accessibilityCopy = {
  skipLink: "Skip to content",
} as const;

export const headerCopy = {
  ariaLabel: "Site header",
  identityAriaLabel: "Obsolete status",
  wordmark: "OBSOLETE",
  wordmarkAriaLabel: "Obsolete home",
  statusAriaLabel: "Systems, interfaces and processes ready for retirement",
  statusLines: ["Ready for retirement"],
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
  status: "status: old way detected",
  title: {
    firstLine: "Progressively",
    secondLine: "obsolete",
    punctuation: ".",
  },
  lead: "Obsolete is a design-led software house creating digital products, platforms, and internal tools for teams ready to replace clunky workflows, ageing systems, and badly designed software.",
  actionsAriaLabel: "Hero actions",
  actions: {
    primary: {
      label: "Show us the old way",
      href: "#contact",
      suffix: "→",
    },
    secondary: {
      label: "View what we replace",
      href: "#work",
    },
  },
  visualAriaLabel: "Obsolete build summary",
  facts: [
    { label: "Build", value: "useful software" },
    { label: "Approach", value: "design-led engineering" },
    { label: "Focus", value: "systems that matter" },
    { label: "Outcome", value: "built properly, used daily" },
  ],
  version: "v 1.0.0",
  signalStripAriaLabel: "System status",
  signalStrip: {
    prefix: "// Signal:",
    signal: "replace",
    latency: "Latency: low",
    statement: "No bloat. Just what works.",
  },
} as const;
