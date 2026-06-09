export type ContentKind = "cause" | "epitaph";

export type SafetyResult = {
  ok: boolean;
  reason?: string;
};

const blockedPatterns = [
  /\b(kill yourself|kys|suicide|terrorist|nazi|genocide)\b/i,
  /\b(retard|retarded|tranny|fag|faggot|chink|spic|nigger|nigga)\b/i,
  /\b(hitler|stalin|putin|trump|biden|xi jinping)\b/i,
  /\b(rape|rapist|pedo|pedophile)\b/i,
];

const realPersonAttackPatterns = [
  /\b(?:messi|ronaldo|mbappe|kane|neymar|vinicius|bellingham|haaland|pulisic|son)\b.*\b(?:trash|fraud|dead|washed|clown|idiot)\b/i,
  /\b(?:trash|fraud|dead|washed|clown|idiot)\b.*\b(?:messi|ronaldo|mbappe|kane|neymar|vinicius|bellingham|haaland|pulisic|son)\b/i,
];

function normalizeText(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenSimilarity(a: string, b: string) {
  const left = new Set(normalizeText(a).split(" ").filter(Boolean));
  const right = new Set(normalizeText(b).split(" ").filter(Boolean));
  if (!left.size || !right.size) return 0;
  const intersection = [...left].filter((token) => right.has(token)).length;
  const union = new Set([...left, ...right]).size;
  return intersection / union;
}

export function validateGeneratedLine({
  text,
  kind,
  existing,
}: {
  text: string;
  kind: ContentKind;
  existing: string[];
}): SafetyResult {
  const trimmed = text.trim();
  const maxLength = kind === "cause" ? 80 : 120;

  if (!trimmed) return { ok: false, reason: "Empty content." };
  if (trimmed.length > maxLength) {
    return { ok: false, reason: `${kind} is longer than ${maxLength} characters.` };
  }
  if (/https?:\/\/|www\.|[@#][\w-]+/.test(trimmed)) {
    return { ok: false, reason: "Links, handles, and hashtags are not allowed." };
  }
  if (blockedPatterns.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, reason: "Blocked unsafe language." };
  }
  if (realPersonAttackPatterns.some((pattern) => pattern.test(trimmed))) {
    return { ok: false, reason: "Direct attacks on real people are not allowed." };
  }
  if (!/\b(football|goal|goals|scoreboard|match|bracket|tournament|penalty|var|fans|flag|campaign|knockout|stoppage|extra time|qualifier|pitch|team|hope|final whistle)\b/i.test(trimmed)) {
    return { ok: false, reason: "Content must stay about football." };
  }

  const normalized = normalizeText(trimmed);
  for (const item of existing) {
    if (normalizeText(item) === normalized || tokenSimilarity(item, trimmed) >= 0.82) {
      return { ok: false, reason: "Duplicate or near-duplicate content." };
    }
  }

  return { ok: true };
}

export function filterGeneratedLines({
  causes,
  epitaphs,
  existingCauses,
  existingEpitaphs,
}: {
  causes: string[];
  epitaphs: string[];
  existingCauses: string[];
  existingEpitaphs: string[];
}) {
  const acceptedCauses: string[] = [];
  const acceptedEpitaphs: string[] = [];
  const rejected: { kind: ContentKind; text: string; reason: string }[] = [];

  for (const text of causes) {
    const result = validateGeneratedLine({
      text,
      kind: "cause",
      existing: [...existingCauses, ...acceptedCauses],
    });
    if (result.ok) acceptedCauses.push(text.trim());
    else rejected.push({ kind: "cause", text, reason: result.reason ?? "Rejected." });
  }

  for (const text of epitaphs) {
    const result = validateGeneratedLine({
      text,
      kind: "epitaph",
      existing: [...existingEpitaphs, ...acceptedEpitaphs],
    });
    if (result.ok) acceptedEpitaphs.push(text.trim());
    else rejected.push({ kind: "epitaph", text, reason: result.reason ?? "Rejected." });
  }

  return { causes: acceptedCauses, epitaphs: acceptedEpitaphs, rejected };
}
