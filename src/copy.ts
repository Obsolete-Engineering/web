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

export const workPageCopy = {
  metaTitle: 'Work — Obsolete',
  metaDescription:
    'Selected digital work by Obsolete, a creative technology studio designing and engineering ambitious digital experiences.',
  eyebrow: 'Selected work',
  title: 'Work worth spending time with.',
  introduction:
    'A closer look at how we turn complex ideas into clear, useful digital experiences.',
  project: {
    index: '01',
    title: 'Craft Applied',
    statement: 'A complex offer, made clear.',
    summary:
      'Strategy, UX/UI, content architecture, and engineering for a multidisciplinary digital studio.',
    href: '/work/craft-applied',
    action: 'Read case study',
  },
} as const;

export const contactPageCopy = {
  metaTitle: 'Contact — Obsolete',
  eyebrow: 'Contact',
  title: 'Bring us an idea.',
  body: 'Our contact details are being prepared for publication.',
  returnHome: {
    label: 'Return home',
    href: '/',
    suffix: '→',
  },
} as const;

export const featuredWorkCopy = {
  eyebrow: 'Featured work — 01',
  status: {
    desktop: 'Design + development / Live',
    mobile: 'Live',
  },
  title: {
    accessible: 'Craft Applied',
    firstLine: 'Craft',
    secondLine: ' Applied',
  },
  statement: 'A clearer, faster home for a multidisciplinary digital studio.',
  summary:
    'We designed and developed a content-rich website that turns a broad service offering into a clear journey—from capabilities and technology to selected work, editorial thinking, and contact.',
  imageAlt:
    'The Craft Applied homepage, with cream typography on a deep green background describing its website and application work.',
  captions: {
    desktop: 'Live project view / Desktop',
    mobile: 'Responsive proof',
    site: 'craftapplied.com',
    width: '390 px',
  },
  facts: [
    [
      ['Client', 'Craft Applied'],
      ['Role', 'Design + development'],
    ],
    [
      ['Focus', 'Strategy, UX/UI, content architecture, engineering'],
      ['Platform', 'Astro, SolidJS, TailwindCSS, Plausible'],
    ],
  ],
  actions: {
    primary: {
      label: 'View case study',
      href: '/work/craft-applied',
      suffix: '→',
    },
    secondary: {
      label: 'Visit live site',
      ariaLabel: 'Visit Craft Applied (external site)',
      href: 'https://craftapplied.com',
      suffix: '↗',
    },
  },
} as const;

export const craftAppliedCaseStudyCopy = {
  metaTitle: 'Craft Applied case study — Obsolete',
  metaDescription:
    'How Obsolete turned Craft Applied’s broad multidisciplinary offer into a clear, accessible digital system.',
  eyebrow: 'Case study — 01',
  status: 'Design + development / Live',
  title: 'Craft Applied',
  headline: 'A complex offer, made clear.',
  introduction:
    'Craft Applied works across product design, development, communications, cloud, and marketing. We created a clear digital system that makes that breadth easier to understand without flattening the expertise behind it.',
  imageAlt: 'The Craft Applied homepage with cream typography on a deep green background.',
  facts: [
    ['Client', 'Craft Applied'],
    ['Role', 'Design + development'],
    ['Focus', 'Strategy, UX/UI, content architecture, engineering'],
    ['Platform', 'Astro, SolidJS, TailwindCSS, Plausible'],
  ],
  actions: {
    live: {
      label: 'Visit live site',
      ariaLabel: 'Visit Craft Applied (external site)',
      href: 'https://craftapplied.com',
      suffix: '↗',
    },
    back: {
      label: 'All work',
      href: '/work',
      suffix: '←',
    },
  },
  challenge: {
    index: '01',
    eyebrow: 'The challenge',
    title: 'Depth was the strength. It was also the problem.',
    body: 'Craft Applied’s offer reaches from product thinking and interface design to software, cloud systems, communications, and marketing. Presented as one long list, that range was difficult to scan and even harder to remember.',
    principle: 'The job was not to reduce the offer. It was to make the depth legible.',
  },
  system: {
    index: '02',
    eyebrow: 'The clarity system',
    title: 'Six disciplines. One coherent way in.',
    body: 'We organized the offer into six distinct disciplines, then gave every detailed capability a clear home. Visitors can understand the whole practice quickly and still move into the depth that matters to them.',
    imageAlt:
      'Craft Applied service overview showing six illustrated disciplines and their capabilities.',
    disciplines: [
      ['Product Design', 'Competitive analysis, user experience, interface design, accessibility'],
      [
        'Web Development',
        'Frontend and backend development, content systems, ecommerce, multimedia',
      ],
      ['App Development', 'Web and mobile applications, APIs, databases, file storage'],
      ['Visual Communications', 'Brand application, documents, print, illustration'],
      ['Business & Cloud', 'Cloud platforms, workspace systems, payments, project management'],
      ['Digital Marketing', 'Search, email, events, copywriting'],
    ],
  },
  proof: {
    index: '03',
    eyebrow: 'Work + proof',
    title: 'Let the work do the explaining.',
    body: 'The service system sets expectations; the work makes those capabilities tangible. Project stories connect disciplines to real engagements, helping visitors move from “what they do” to “what that looks like in practice.”',
    imageAlt:
      'A row of selected Craft Applied projects spanning renewable energy, STEM education, and commercial property.',
  },
  editorial: {
    index: '04',
    eyebrow: 'Editorial depth',
    title: 'A site built to keep thinking.',
    body: 'Editorial content gives Craft Applied room to explain its point of view beyond project launches. The same hierarchy and restrained visual language carry through to a publishing system designed for clarity over time.',
    imageAlt: 'The Craft Applied blog index with article dates, summaries, and topic labels.',
  },
  accessibility: {
    index: '05',
    eyebrow: 'Accessible execution',
    title: 'Clarity has to work for everyone.',
    body: 'Accessibility shaped the interface rather than arriving as a final checklist. Clear hierarchy, readable type, semantic structure, keyboard-aware navigation, and responsive layouts keep the experience understandable across devices and ways of browsing.',
    imageAlt:
      'The responsive Craft Applied homepage showing its navigation and opening statement on a mobile screen.',
    details: ['Readable hierarchy', 'Keyboard-aware interaction', 'Responsive by default'],
  },
  shipped: {
    index: '06',
    eyebrow: 'What shipped',
    title: 'A durable platform, not a finished poster.',
    body: 'The result is a content-rich website with a clear service model, reusable publishing patterns, and an accessible responsive interface—built to hold new work and thinking without losing the structure that makes it useful.',
    items: [
      ['Strategy', 'Offer hierarchy and content architecture'],
      ['Experience', 'Responsive UX/UI and visual system'],
      ['Engineering', 'Astro, SolidJS, and reusable components'],
      ['Publishing', 'Work, editorial, and structured content patterns'],
    ],
  },
  cta: {
    eyebrow: 'Have a complex story?',
    title: 'Let’s make it clear.',
    body: 'Bring us the offer, platform, or idea that has outgrown the way it is currently explained.',
    action: {
      label: 'Start a project',
      href: '/contact',
      suffix: '↗',
    },
  },
} as const;

export const capabilitiesCopy = {
  eyebrow: 'What we make',
  title: 'From first thought to finished thing.',
  introduction:
    'We join creative direction, design, and engineering in one continuous process—so the idea stays intact all the way to launch.',
  navigationAriaLabel: 'Capability sections',
  capabilities: [
    {
      index: '01',
      id: 'direction',
      label: 'Direction',
      title: 'Find the idea worth building.',
      description:
        'We turn an ambitious starting point into a clear creative and technical direction before complexity takes over.',
      detailsAriaLabel: 'Direction services',
      details: ['Creative direction', 'Experience strategy', 'Rapid prototyping'],
    },
    {
      index: '02',
      id: 'design',
      label: 'Design',
      title: 'Make it feel inevitable.',
      description:
        'We shape interfaces, systems, and interactions that feel distinctive to the idea—not borrowed from the category.',
      detailsAriaLabel: 'Design services',
      details: ['Art direction', 'UX + UI systems', 'Interaction + motion'],
    },
    {
      index: '03',
      id: 'engineering',
      label: 'Engineering',
      title: 'Build the difficult part properly.',
      description:
        'We engineer fast, accessible digital experiences with enough care beneath the surface to keep them useful after launch.',
      detailsAriaLabel: 'Engineering services',
      details: ['Creative development', 'Web platforms', 'Performance + accessibility'],
    },
  ],
} as const;

export const contactCtaCopy = {
  eyebrow: 'Have something in mind?',
  title: 'Bring us the idea you cannot stop thinking about.',
  body: 'Early sketch, complicated brief, or fully formed plan—we would like to hear what makes it interesting.',
  action: {
    label: 'Start a conversation',
    href: '/contact',
    suffix: '↗',
  },
} as const;

export const obsoleteHeroAnimationCopy = {
  slotLabel: 'retired slot',
  labels: {
    oldWay: 'old way detected',
    repairing: 'repairing interface',
    aligned: 'replacement aligned',
  },
  ariaLabel: 'Obsolete replacement engine hero animation',
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
