import { CodiconOption, ExpiryCalculation, Subscription } from './types';

/**
 * Meaningful category names mapped to each Codicon symbol.
 */
export const CODICON_GROUP_NAMES: Record<string, string> = {
  'sparkle': 'AI & Assistants',
  'hubot': 'AI Platforms & LLMs',
  'key': 'API Keys & Secrets',
  'server': 'Hosting & VPS',
  'globe': 'Domains & Web',
  'book': 'Documentation & Books',
  'mortar-board': 'Courses & Learning',
  'broadcast': 'Audio & Media Feeds',
  'radio-tower': 'Feeds & Streams',
  'library': 'Articles & Research',
  'package': 'Tools & Dependencies',
  'calendar': 'Calendar & Events',
  'clock': 'Time-Sensitive',
  'shield': 'VPN & Security',
  'credit-card': 'Software Licenses',
};

/**
 * Returns a human-friendly meaningful group name for a given Codicon.
 */
export function getGroupNameForIcon(iconId: string): string {
  if (CODICON_GROUP_NAMES[iconId]) {
    return CODICON_GROUP_NAMES[iconId];
  }
  return iconId
    .split('-')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Calculates remaining time and human-friendly countdown string.
 */
export function calculateExpiry(expiryDateStr: string, now: Date = new Date()): ExpiryCalculation {
  const expiryDate = new Date(expiryDateStr);
  const diffMs = expiryDate.getTime() - now.getTime();

  if (isNaN(diffMs)) {
    return {
      formattedRemaining: 'Invalid date',
      remainingMs: -Infinity,
      daysRemaining: -Infinity,
      isExpired: true,
    };
  }

  const DAY_MS = 24 * 60 * 60 * 1000;
  const daysRemaining = diffMs / DAY_MS;

  // Expired
  if (diffMs <= 0) {
    const elapsedMs = Math.abs(diffMs);
    const elapsedHours = Math.floor(elapsedMs / (1000 * 60 * 60));
    const elapsedDays = Math.floor(elapsedMs / DAY_MS);

    const formatted = elapsedDays >= 1
      ? `Expired ${elapsedDays}d ago`
      : `Expired ${Math.max(1, elapsedHours)}h ago`;

    return {
      formattedRemaining: formatted,
      remainingMs: diffMs,
      daysRemaining,
      isExpired: true,
    };
  }

  // Not expired
  const hoursLeft = Math.floor(diffMs / (1000 * 60 * 60));
  const daysLeft = Math.floor(daysRemaining);

  let formattedRemaining: string;
  if (hoursLeft <= 48) {
    formattedRemaining = `${Math.max(1, hoursLeft)}h left`;
  } else {
    formattedRemaining = `${daysLeft} days left`;
  }

  return {
    formattedRemaining,
    remainingMs: diffMs,
    daysRemaining,
    isExpired: false,
  };
}

/**
 * Standard Codicons with meaningful labels for QuickPick selection.
 */
export const CURATED_CODICONS: CodiconOption[] = [
  { id: 'sparkle', label: '$(sparkle) AI & Assistants', description: 'sparkle' },
  { id: 'hubot', label: '$(hubot) AI Platforms & LLMs', description: 'hubot' },
  { id: 'key', label: '$(key) API Keys & Secrets', description: 'key' },
  { id: 'server', label: '$(server) Hosting & VPS', description: 'server' },
  { id: 'globe', label: '$(globe) Domains & Web', description: 'globe' },
  { id: 'book', label: '$(book) Documentation & Books', description: 'book' },
  { id: 'mortar-board', label: '$(mortar-board) Courses & Learning', description: 'mortar-board' },
  { id: 'broadcast', label: '$(broadcast) Audio & Media Feeds', description: 'broadcast' },
  { id: 'radio-tower', label: '$(radio-tower) Feeds & Streams', description: 'radio-tower' },
  { id: 'library', label: '$(library) Articles & Research', description: 'library' },
  { id: 'package', label: '$(package) Tools & Dependencies', description: 'package' },
  { id: 'calendar', label: '$(calendar) Calendar & Events', description: 'calendar' },
  { id: 'clock', label: '$(clock) Time-Sensitive', description: 'clock' },
  { id: 'shield', label: '$(shield) VPN & Security', description: 'shield' },
  { id: 'credit-card', label: '$(credit-card) Software Licenses', description: 'credit-card' },
];

/**
 * Clean, generic developer sample subscriptions (Zero personal data).
 */
export function generateSampleSubscriptions(): Subscription[] {
  const now = Date.now();
  const DAY_MS = 24 * 60 * 60 * 1000;
  const HOUR_MS = 60 * 60 * 1000;

  const samples: Array<{
    name: string;
    offsetMs: number;
    icon: string;
    account?: string;
  }> = [
    { name: 'GitHub Copilot', offsetMs: 5 * DAY_MS, icon: 'sparkle', account: 'dev@github.com' },
    { name: 'OpenAI API Credit', offsetMs: 36 * HOUR_MS, icon: 'key', account: 'team@openai.com' },
    { name: 'AWS Cloud VPS', offsetMs: 14 * DAY_MS, icon: 'server', account: 'prod-cluster-us' },
    { name: 'Domain (myproject.dev)', offsetMs: 45 * DAY_MS, icon: 'globe' },
    { name: 'JetBrains All Products', offsetMs: 120 * DAY_MS, icon: 'credit-card', account: 'license-corp' },
    { name: 'Figma Organization', offsetMs: 210 * DAY_MS, icon: 'package' },
    { name: 'Claude Pro Team', offsetMs: 18 * DAY_MS, icon: 'hubot', account: 'ai-workspace' },
    { name: 'Vercel Pro Team', offsetMs: 60 * DAY_MS, icon: 'server' },
  ];

  return samples.map((item, idx) => ({
    id: `sub_${now}_${idx}`,
    name: item.name,
    expiryDate: new Date(now + item.offsetMs).toISOString(),
    icon: item.icon,
    account: item.account,
  }));
}
