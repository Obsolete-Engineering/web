export const metaCopy = {
  title: 'Obsolete — Creative technology for interesting ideas',
  description:
    'Obsolete is a creative technology studio designing and building ambitious digital experiences for creative companies.',
} as const;

export const accessibilityCopy = {
  skipLink: 'Skip to content',
} as const;

export const headerCopy = {
  ariaLabel: 'Site header',
  wordmark: 'OBSOLETE',
  wordmarkAriaLabel: 'Obsolete home',
  descriptor: 'Creative mischief. Serious engineering.',
  navAriaLabel: 'Primary navigation',
  navItems: [
    { label: 'Work', href: '/work' },
    { label: 'Contact', href: '/contact', accent: true },
  ],
} as const;

export const heroCopy = {
  eyebrow: 'Creative technology studio',
  title: {
    accessible: 'The internet could be more interesting.',
    firstLine: 'The internet',
    middleLine: 'could be more',
    lastLine: 'interesting',
    punctuation: '.',
  },
  lead: 'Obsolete is a creative technology studio for creative companies. We design and engineer ambitious digital experiences worth spending time with.',
  actionsAriaLabel: 'Hero actions',
  actions: {
    primary: {
      label: 'Bring us an idea',
      href: '/contact',
      suffix: '↗',
    },
    secondary: {
      label: 'See our work',
      href: '/work',
      suffix: '→',
    },
  },
  visualAriaLabel: 'Animated Obsolete mark formed from particles',
  visualCaption: 'Particle study / form in motion',
} as const;
