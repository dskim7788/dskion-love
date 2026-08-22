const CASUAL_CONSENT_PATTERNS = [
  /반말/,
  /말\s*놔/,
  /말\s*놓/,
  /편하게\s*해/,
  /편하게\s*말/,
  /낮춰/,
  /응[!.\s]|^응$/,
  /그래[,!.\s]|^그래$/,
  /좋아/,
  /콜\b/,
  /당연하지/,
  /어\s*그래/,
  /ㅇㅇ/,
  /^네[,!.\s]?/,
];

export function detectCasualConsent(text: string): boolean {
  const trimmed = text.trim();
  if (!trimmed) return false;
  return CASUAL_CONSENT_PATTERNS.some((pattern) => pattern.test(trimmed));
}
