import { calculateExpiry, generateSampleSubscriptions, getGroupNameForIcon } from '../src/utils';
import { Subscription } from '../src/types';

function assert(condition: boolean, msg: string) {
  if (!condition) {
    throw new Error(`FAIL: ${msg}`);
  }
  console.log(`PASS: ${msg}`);
}

console.log('--- Running SubTrack Unit Tests ---');

// 1. Test getGroupNameForIcon
assert(getGroupNameForIcon('sparkle') === 'AI & Assistants', 'sparkle maps to AI & Assistants');
assert(getGroupNameForIcon('server') === 'Hosting & VPS', 'server maps to Hosting & VPS');
assert(getGroupNameForIcon('book') === 'Documentation & Books', 'book maps to Documentation & Books');
assert(getGroupNameForIcon('custom-tag') === 'Custom Tag', 'fallback title cases custom-tag');

// 2. Test calculateExpiry formatting
const now = new Date();
const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;

// <= 48 hours: should be "Xh left"
const exp24h = new Date(now.getTime() + 24 * hourMs).toISOString();
assert(calculateExpiry(exp24h, now).formattedRemaining === '24h left', '24h displays as "24h left"');

const exp48h = new Date(now.getTime() + 48 * hourMs).toISOString();
assert(calculateExpiry(exp48h, now).formattedRemaining === '48h left', '48h displays as "48h left"');

// > 48 hours: should be "X days left"
const exp7d = new Date(now.getTime() + 7 * dayMs).toISOString();
assert(calculateExpiry(exp7d, now).formattedRemaining === '7 days left', '7 days displays as "7 days left"');

const exp597d = new Date(now.getTime() + 597 * dayMs).toISOString();
assert(calculateExpiry(exp597d, now).formattedRemaining === '597 days left', '597 days displays as "597 days left"');

// Expired: should be "Expired Xd ago" or "Expired Xh ago"
const expExpired2d = new Date(now.getTime() - 2 * dayMs).toISOString();
assert(calculateExpiry(expExpired2d, now).isExpired === true, 'Past date is marked as isExpired=true');
assert(calculateExpiry(expExpired2d, now).formattedRemaining === 'Expired 2d ago', 'Expired 2 days displays as "Expired 2d ago"');

// 3. Test Sample Data Generation & Sorting
const samples = generateSampleSubscriptions();
assert(samples.length === 8, '8 generic developer sample subscriptions generated');

for (const sub of samples) {
  assert(!/\(.*?\)\s*\(.*?\)/.test(sub.name), `Subscription name "${sub.name}" has no duplicate parentheses`);
}

// 4. Test Sorting by Shortest Remaining
const sorted = [...samples].sort((a, b) => {
  const calcA = calculateExpiry(a.expiryDate, now);
  const calcB = calculateExpiry(b.expiryDate, now);
  return calcA.remainingMs - calcB.remainingMs;
});

assert(sorted[0].name === 'OpenAI API Credit', 'Shortest remaining subscription (36h) is at top of sorted list');

console.log('--- All Unit Tests Passed Successfully! ---');
