/**
 * Tournament Credits & Display Formatters
 * Formats values into tournament credits (e.g. 100 Credits / 100 CR)
 */

export function formatCredits(amount, compact = false) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return compact ? '0 CR' : '0 Credits';
  }
  const val = Number(amount);
  const formatted = val % 1 === 0 ? val : val.toFixed(1);
  if (compact) {
    return `${formatted} CR`;
  }
  return `${formatted} ${val === 1 ? 'Credit' : 'Credits'}`;
}

// Backward-compatible aliases so all existing page components render credits seamlessly
export function formatINR(amount) {
  return formatCredits(amount, false);
}

export function formatINRCompact(amount) {
  return formatCredits(amount, true);
}

export function formatSeconds(sec) {
  const s = Math.max(0, Math.floor(sec || 0));
  const mins = Math.floor(s / 60);
  const remainingSecs = s % 60;
  return `${String(mins).padStart(2, '0')}:${String(remainingSecs).padStart(2, '0')}`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: true,
  });
}
