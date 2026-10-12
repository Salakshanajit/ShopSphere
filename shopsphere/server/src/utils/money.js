// Money is calculated in whole cents to avoid floating point mistakes.
const toCents = (amount) => Math.round(Number(amount) * 100);
const fromCents = (cents) => cents / 100;

module.exports = { toCents, fromCents };
