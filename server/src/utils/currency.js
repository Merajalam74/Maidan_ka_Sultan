/**
 * Currency utilities for Indian Rupee (INR) representation
 */

const inrFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
});

/**
 * Format integer rupees into standard Indian currency string:
 * e.g., 5000000 -> ₹50,00,000
 */
export function formatINR(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  return inrFormatter.format(Math.round(amount));
}

/**
 * Short representation for displays:
 * e.g., 10000000 -> "₹1.0 Cr", 5000000 -> "₹50.0 L", 25000 -> "₹25 K"
 */
export function formatINRCompact(amount) {
  if (amount === null || amount === undefined || isNaN(amount)) {
    return '₹0';
  }
  const val = Math.round(amount);
  if (val >= 10000000) {
    const cr = val / 10000000;
    return `₹${cr % 1 === 0 ? cr.toFixed(0) : cr.toFixed(2)} Cr`;
  }
  if (val >= 100000) {
    const lk = val / 100000;
    return `₹${lk % 1 === 0 ? lk.toFixed(0) : lk.toFixed(1)} L`;
  }
  if (val >= 1000) {
    const k = val / 1000;
    return `₹${k % 1 === 0 ? k.toFixed(0) : k.toFixed(0)} K`;
  }
  return `₹${val}`;
}
