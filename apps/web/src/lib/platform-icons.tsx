import { ReactNode } from "react";

// SVG icons for each platform
const icons: Record<string, ReactNode> = {
  // Symfony - SF stylized
  symfony: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1.5 14.5c-1.5 0-2.5-1-2.5-2.5h1.5c0 .83.67 1.5 1.5 1.5s1.5-.67 1.5-1.5c0-.5-.5-1-1.5-1.5-1.5-.5-2.5-1.5-2.5-3 0-1.5 1-2.5 2.5-2.5 1.5 0 2.5 1 2.5 2.5h-1.5c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5c0 .5.5 1 1.5 1.5 1.5.5 2.5 1.5 2.5 3 0 1.5-1 2.5-2.5 2.5z"/>
    </svg>
  ),
  // Laravel - L stylized
  laravel: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M21.7 6.53c.01.02.01.05.01.08v6.14c0 .09-.05.18-.14.23l-5.17 2.98v5.9c0 .09-.05.18-.14.23l-10.82 6.23c-.02.01-.05.02-.07.03-.01 0-.02.01-.04.01-.02.01-.04.01-.07.01s-.05 0-.07-.01c-.01 0-.03-.01-.04-.01-.02-.01-.05-.02-.07-.03L.14 16.09C.05 16.04 0 15.95 0 15.86V3.69c0-.03 0-.05.01-.08.01-.01.01-.03.02-.04.01-.02.02-.03.03-.05.01-.01.02-.02.03-.03l.03-.03 5.42-3.12c.09-.05.2-.05.29 0l5.42 3.12c.01.01.03.02.03.03.01.01.02.02.03.03.01.02.02.03.03.05.01.01.01.03.02.04.01.03.01.05.01.08v11.47l4.5-2.59V6.61c0-.03 0-.05.01-.08.01-.01.01-.03.02-.04.01-.02.02-.03.03-.05.01-.01.02-.02.03-.03.01-.01.02-.02.03-.03l5.42-3.12c.09-.05.2-.05.29 0l5.42 3.12c.01.01.02.02.03.03l.03.03c.01.02.02.03.03.05.01.01.01.03.02.04z"/>
    </svg>
  ),
  // React - Atom
  react: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <circle cx="12" cy="12" r="2.5"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(60 12 12)"/>
      <ellipse cx="12" cy="12" rx="10" ry="4" fill="none" stroke="currentColor" strokeWidth="1.5" transform="rotate(120 12 12)"/>
    </svg>
  ),
  // Vue - V shape
  vuejs: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M2 3h4l6 10.5L18 3h4L12 21 2 3zm6.5 0L12 9l3.5-6h-3L12 4.5 11.5 3h-3z"/>
    </svg>
  ),
  vue: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M2 3h4l6 10.5L18 3h4L12 21 2 3zm6.5 0L12 9l3.5-6h-3L12 4.5 11.5 3h-3z"/>
    </svg>
  ),
  // Next.js - N
  nextjs: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l8 10h-2l-6-7.5V17H8z"/>
    </svg>
  ),
  next: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15V7l8 10h-2l-6-7.5V17H8z"/>
    </svg>
  ),
  // Nuxt - N with gradient feel
  nuxtjs: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M9 17.25L3.5 8.5c-.5-.85.1-1.9 1.1-1.9h5.3l4.1 7.15-3.5 6.1c-.3.5-.9.5-1.2 0l-.3-.6zM14.5 17.25l6-10.4c.5-.85-.1-1.9-1.1-1.9h-3.3l5.4 9.35-2.5 4.35c-.3.5-.9.5-1.2 0l-3.3-1.4z"/>
    </svg>
  ),
  nuxt: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M9 17.25L3.5 8.5c-.5-.85.1-1.9 1.1-1.9h5.3l4.1 7.15-3.5 6.1c-.3.5-.9.5-1.2 0l-.3-.6zM14.5 17.25l6-10.4c.5-.85-.1-1.9-1.1-1.9h-3.3l5.4 9.35-2.5 4.35c-.3.5-.9.5-1.2 0l-3.3-1.4z"/>
    </svg>
  ),
  // Node.js - Hexagon
  nodejs: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l6.5 3.64v7.36L12 18.82l-6.5-3.64V7.82L12 4.18zM12 8a4 4 0 100 8 4 4 0 000-8z"/>
    </svg>
  ),
  node: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2L3 7v10l9 5 9-5V7l-9-5zm0 2.18l6.5 3.64v7.36L12 18.82l-6.5-3.64V7.82L12 4.18zM12 8a4 4 0 100 8 4 4 0 000-8z"/>
    </svg>
  ),
  // Hono - Fire/Flame
  hono: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2c-1 4-4 6-4 10 0 3 2.5 5.5 5.5 5.5 1.5 0 3-.5 4-1.5-1 .5-2 .5-3 0-2-1-3-3-2-5 .5-1 1.5-2 2.5-2.5-1 2 0 4 1.5 5 1 .5 2 0 2.5-1 .5-1 .5-2 0-3-.5-1.5-2-2.5-3.5-3C14 5 13 3.5 12 2z"/>
    </svg>
  ),
  // Fastify - Lightning bolt
  fastify: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M13 2L4 14h7l-2 8 9-12h-7l2-8z"/>
    </svg>
  ),
  // PHP - Elephant simplified
  php: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <ellipse cx="12" cy="12" rx="10" ry="6"/>
      <text x="12" y="14" textAnchor="middle" fontSize="7" fill="white" fontWeight="bold">PHP</text>
    </svg>
  ),
  // Python - Two snakes
  python: (
    <svg viewBox="0 0 24 24" fill="currentColor" className="h-3.5 w-3.5">
      <path d="M12 2c-1.5 0-3 .5-3 2v2h6v1H7c-2 0-3 1.5-3 3.5S5 14 7 14h2v-2c0-1 1-2 2-2h4c1 0 2-1 2-2V4c0-1-1-2-3-2h-2zm-1 1.5a.75.75 0 110 1.5.75.75 0 010-1.5z"/>
      <path d="M12 22c1.5 0 3-.5 3-2v-2H9v-1h8c2 0 3-1.5 3-3.5S19 10 17 10h-2v2c0 1-1 2-2 2H9c-1 0-2 1-2 2v4c0 1 1 2 3 2h2zm1-1.5a.75.75 0 110-1.5.75.75 0 010 1.5z"/>
    </svg>
  ),
};

// Fallback: 2-letter abbreviations
const abbreviations: Record<string, string> = {
  angular: "AN",
  svelte: "SV",
  express: "EX",
  django: "DJ",
  flask: "FL",
  ruby: "RB",
  rails: "RA",
  go: "GO",
  rust: "RS",
  java: "JA",
  spring: "SP",
  dotnet: ".N",
  csharp: "C#",
};

/**
 * Returns platform icon as SVG or 2-letter abbreviation
 */
export function getPlatformIcon(platform: string | null | undefined): ReactNode | null {
  if (!platform) return null;

  const platformLower = platform.toLowerCase();

  // Check for SVG icon first
  if (icons[platformLower]) {
    return icons[platformLower];
  }

  // Fallback to abbreviation
  if (abbreviations[platformLower]) {
    return <span className="text-[8px] font-bold">{abbreviations[platformLower]}</span>;
  }

  // Default: first 2 letters uppercase
  return <span className="text-[8px] font-bold">{platform.substring(0, 2).toUpperCase()}</span>;
}

/**
 * Get platform display name
 */
export function getPlatformName(platform: string | null | undefined): string {
  if (!platform) return "Unknown";

  const names: Record<string, string> = {
    symfony: "Symfony",
    laravel: "Laravel",
    react: "React",
    vue: "Vue.js",
    vuejs: "Vue.js",
    nextjs: "Next.js",
    next: "Next.js",
    nuxtjs: "Nuxt",
    nuxt: "Nuxt",
    nodejs: "Node.js",
    node: "Node.js",
    hono: "Hono",
    fastify: "Fastify",
    php: "PHP",
    python: "Python",
    angular: "Angular",
    svelte: "Svelte",
    express: "Express",
    django: "Django",
    flask: "Flask",
    ruby: "Ruby",
    rails: "Rails",
    go: "Go",
    rust: "Rust",
    java: "Java",
    spring: "Spring",
    dotnet: ".NET",
    csharp: "C#",
  };

  return names[platform.toLowerCase()] || platform;
}
