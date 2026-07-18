export const metaCopy = {
  siteName: 'Obsolete',
  title: 'Obsolete | Custom websites and digital products',
  description:
    'Obsolete is a creative technology studio designing and building custom websites and digital products for creative companies.',
  imageAlt: 'Obsolete, creative technology studio.',
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
  metaTitle: 'Work | Obsolete',
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
    imageAlt: 'The Craft Applied homepage with cream typography on a deep green background.',
    href: '/work/craft-applied',
    action: 'Read case study',
  },
} as const;

export const contactPageCopy = {
  metaTitle: 'Contact | Obsolete',
  metaDescription:
    'Contact Obsolete to discuss an ambitious digital experience, creative technology project, or complex idea.',
  eyebrow: 'Contact',
  title: 'Bring us an idea.',
  body: 'Early sketch, complicated brief, or fully formed plan. Tell us what makes it interesting.',
  imageAlt:
    'An abstract architectural composition in warm stone, black, and orange with precise geometric markings.',
  formAction: {
    label: 'Start the inquiry',
    href: '#project-inquiry',
    suffix: '↓',
  },
  form: {
    eyebrow: 'Project inquiry / 01',
    title: 'Give us the shape of it.',
    introduction:
      'A few useful details help us understand the idea, where you need support, and whether we are the right fit.',
    requiredLabel: 'Required',
    optionalLabel: 'Optional',
    fields: {
      name: {
        label: 'Your name',
        autocomplete: 'name',
      },
      email: {
        label: 'Email',
        autocomplete: 'email',
      },
      organization: {
        label: 'Company / organization',
        autocomplete: 'organization',
      },
      capabilities: {
        label: 'What do you need?',
        help: 'Choose as many as apply.',
        options: [
          {
            value: 'direction',
            label: 'Direction',
            description: 'Clarify the creative and technical direction.',
          },
          {
            value: 'design',
            label: 'Design',
            description: 'Shape the interface, system, and interaction.',
          },
          {
            value: 'engineering',
            label: 'Engineering',
            description: 'Build the difficult part properly.',
          },
          {
            value: 'not-sure',
            label: 'Not sure yet',
            description: 'We can work it out together.',
          },
        ],
      },
      idea: {
        label: 'Tell us about the idea',
        help: 'What are you hoping to make, who is it for, and why does it matter?',
      },
      budget: {
        label: 'Indicative investment',
        placeholder: 'Choose a range',
        options: [
          { value: 'under-5k', label: 'Under £5k' },
          { value: '5k-10k', label: '£5–10k' },
          { value: '10k-25k', label: '£10–25k' },
          { value: '25k-50k', label: '£25–50k' },
          { value: '50k-plus', label: '£50k+' },
          { value: 'not-sure', label: 'Not sure yet' },
        ],
      },
      startWindow: {
        label: 'When would you like to begin?',
        placeholder: 'Choose a window',
        options: [
          { value: 'asap', label: 'As soon as possible' },
          { value: '1-3-months', label: 'In 1–3 months' },
          { value: '3-6-months', label: 'In 3–6 months' },
          { value: '6-plus-months', label: 'In 6+ months' },
          { value: 'flexible', label: 'Flexible' },
        ],
      },
    },
    submitLabel: 'Send the idea',
    validation: {
      summary: 'Check the highlighted fields and try again.',
      name: 'Tell us your name.',
      emailRequired: 'Tell us where we can reply.',
      emailInvalid: 'Enter a valid email address.',
      capabilities: 'Choose at least one area, or select Not sure yet.',
      idea: 'Give us a little context about the idea.',
    },
    prototypeNotice: {
      title: 'Prototype only.',
      body: 'This form is a preview. Nothing has been sent or stored.',
    },
  },
} as const;

export const featuredWorkCopy = {
  eyebrow: 'Featured work / 01',
  status: {
    desktop: 'Design + development / Live',
    mobile: 'Live',
  },
  title: {
    accessible: 'Craft Applied',
    firstLine: 'Craft',
    secondLine: ' Applied',
  },
  statement: 'A complex offer, made clear.',
  summary:
    'We organized six disciplines into a clear service model, then designed and engineered a live, content-rich website with reusable work and editorial publishing patterns and an accessible, responsive interface.',
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

const startConversationActionCopy = {
  label: 'Start a conversation',
  href: '/contact#project-inquiry',
  suffix: '↗',
} as const;

export const pricingEstimatorCopy = {
  ariaLabel: 'Project pricing estimator',
  eyebrow: 'Project pricing / Indicative',
  title: 'A useful range, before the brief.',
  introduction:
    'Choose the engagement closest to what you are making. Every range assumes a defined scope, one feedback lead, and two revision rounds.',
  optionsLabel: 'Engagement options',
  neutral: {
    eyebrow: 'Your estimate',
    title: 'Choose an engagement',
    body: 'We will show the likely investment, where it fits, and the boundary that keeps the work focused.',
  },
  resultLabel: 'Estimate result',
  resultEyebrow: 'Indicative estimate',
  announcement: {
    estimate: 'Indicative estimate',
    vat: 'including VAT',
  },
  noScriptTitle: 'Indicative ranges',
  detailLabels: {
    fit: 'Best fit',
    boundary: 'Scope boundary',
    assumptions: 'Every range assumes',
  },
  serviceScope:
    'The range covers creative direction, design, and engineering through one continuous, tightly bounded process.',
  assumptions: [
    'Final content and core assets are supplied by the client.',
    'One feedback lead consolidates decisions.',
    'Two revision rounds are included.',
  ],
  qualifier:
    'Indicative, includes VAT, and confirmed through a scoped proposal once the outcome and final deliverables are understood.',
  action: startConversationActionCopy,
  engagements: [
    {
      id: 'campaign-launch',
      index: '01',
      label: 'Campaign / launch',
      range: '£5–10k',
      fit: 'A focused launch or campaign experience for one important moment.',
      boundary:
        'One clear outcome, shaped through a tightly bounded process rather than an open-ended programme of work.',
    },
    {
      id: 'studio-brand-site',
      index: '02',
      label: 'Studio / brand site',
      range: '£10–20k',
      fit: 'A compact custom marketing, portfolio, or brand website for a creative company.',
      boundary:
        'A coherent custom site built around a focused story and content journey, not an unlimited digital estate.',
    },
    {
      id: 'editorial-platform',
      index: '03',
      label: 'Editorial platform',
      range: '£15–30k',
      fit: 'A content-rich publishing experience for an editorial team with a clear point of view.',
      boundary:
        'A focused content model and limited reusable publishing system, designed around the material that matters most.',
    },
    {
      id: 'digital-product',
      index: '04',
      label: 'Digital product',
      range: '£25–50k',
      fit: 'A focused product concept or one core MVP workflow for a product team ready to learn by making.',
      boundary:
        'Discovery and delivery stay centred on the product’s essential job rather than a broad platform or expanding feature list.',
    },
  ],
} as const;

export const craftAppliedCaseStudyCopy = {
  metaTitle: 'Craft Applied case study | Obsolete',
  metaDescription:
    'How Obsolete turned Craft Applied’s broad multidisciplinary offer into a clear, accessible digital system.',
  eyebrow: 'Case study / 01',
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
    body: 'The result is a content-rich website with a clear service model, reusable publishing patterns, and an accessible responsive interface built to hold new work and thinking without losing the structure that makes it useful.',
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
      href: '/contact#project-inquiry',
      suffix: '↗',
    },
  },
} as const;

export const aiProductDeliveryCopy = {
  eyebrow: 'Specialist engagement / AI product delivery',
  audience: 'For creative product teams',
  title: 'AI should earn its place.',
  introduction:
    'We start with a specific user outcome: helping someone find the right information, make a complex decision, or create something useful. Then we establish AI fit and design, engineer, launch, and improve the AI-enabled product for real-world use.',
  principle:
    'Sometimes the most useful answer is not to use AI. We test that before asking anyone to invest in it.',
  outcomesLabel: 'AI product outcomes',
  outcomes: [
    {
      index: '01',
      id: 'find',
      label: 'Find',
      title: 'Make the right thing easier to discover.',
      description:
        'Help people find the right information, idea, or next step inside material too large or complex to navigate alone.',
    },
    {
      index: '02',
      id: 'decide',
      label: 'Decide',
      title: 'Turn complexity into useful choices.',
      description:
        'Bring scattered signals into clear context while keeping judgment with the person making the decision.',
    },
    {
      index: '03',
      id: 'create',
      label: 'Create',
      title: 'Give people better ways to make.',
      description:
        'Build purposeful tools for drafting, adapting, and exploring without reducing the product to a content machine.',
    },
  ],
  outcomeAction: 'Through the judgment loop',
  process: {
    eyebrow: 'AI product judgment loop',
    title: 'From useful idea to production-ready AI product.',
    steps: [
      {
        index: '01',
        title: 'Establish the fit',
        description:
          'Start with the user outcome. Test whether AI improves it enough to justify the added uncertainty.',
      },
      {
        index: '02',
        title: 'Prove the behavior',
        description:
          'Prototype with real users and representative data. Learn where the experience helps, fails, and needs human control.',
      },
      {
        index: '03',
        title: 'Engineer dependable use',
        description:
          'Build the interface, evaluations, safeguards, privacy boundaries, and failure handling around the intended use.',
      },
      {
        index: '04',
        title: 'Launch and improve',
        description:
          'Observe real use, then refine the product’s value, behavior, and safeguards as evidence accumulates.',
      },
    ],
  },
  scope:
    'AI product engagements are scoped after we understand the opportunity, data, risk, and operating needs.',
  action: startConversationActionCopy,
} as const;

export const capabilitiesCopy = {
  eyebrow: 'What we make',
  title: 'From first thought to finished thing.',
  introduction:
    'Creative direction, design, and engineering stay connected from the first decision through launch, so every choice strengthens the same idea instead of pulling it apart.',
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
        'We shape interfaces, systems, and interactions that feel distinctive to the idea, not borrowed from the category.',
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
  body: 'An unfinished brief is welcome. Bring the rough idea and tell us what you want to make, who it is for, and what is getting in the way.',
  goodFit: {
    label: 'Good fit',
    body: 'A distinctive idea, complex story, or product interaction that a template will not solve well.',
  },
  nonFit: {
    label: 'Likely not a fit',
    body: 'Commodity production, an unlimited brief, or AI added without a clear user outcome.',
  },
  action: {
    label: 'Start a project inquiry',
    href: '/contact#project-inquiry',
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
  lead: 'Obsolete designs and builds custom websites and digital products for creative companies, with creative direction, design, and engineering held by one team from idea to launch.',
  actionsAriaLabel: 'Hero actions',
  actions: {
    primary: {
      label: 'Bring us an idea',
      href: '/contact#project-inquiry',
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
