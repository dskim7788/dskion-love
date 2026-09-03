// Picks the correct Korean particle depending on whether a word ends in a
// consonant (받침 있음) or a vowel (받침 없음) — e.g. "하은" + 이/가 → "하은이",
// but "소이" + 이/가 → "소이가". Needed anywhere a persona/character name is
// interpolated into a sentence, since names vary (built-in and user-created).

function hasBatchim(word: string): boolean {
  const trimmed = word.trim();
  const lastChar = trimmed.charAt(trimmed.length - 1);
  const code = lastChar.charCodeAt(0);
  // Outside the precomposed Hangul syllable block (AC00–D7A3): can't
  // determine batchim, so assume none (matches how loanwords/English read).
  if (code < 0xac00 || code > 0xd7a3) return false;
  return (code - 0xac00) % 28 !== 0;
}

/** "하은" -> "하은이", "소이" -> "소이가" (subject marker 이/가) */
export function withSubjectParticle(word: string): string {
  return `${word}${hasBatchim(word) ? "이" : "가"}`;
}

/** "하은" -> "하은은", "소이" -> "소이는" (topic marker 은/는) */
export function withTopicParticle(word: string): string {
  return `${word}${hasBatchim(word) ? "은" : "는"}`;
}

/** "하은" -> "하은과", "소이" -> "소이와" (conjunction 과/와, "and"/"with") */
export function withConjunctionParticle(word: string): string {
  return `${word}${hasBatchim(word) ? "과" : "와"}`;
}

/** "하은" -> "하은이야", "소이" -> "소이야" (casual copula 이야/야, "I'm X") */
export function withCopula(word: string): string {
  return `${word}${hasBatchim(word) ? "이야" : "야"}`;
}
