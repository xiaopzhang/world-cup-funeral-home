const linkPattern = /(https?:\/\/|www\.|[a-z0-9-]+\.(com|net|org|io|gg|co)\b)/i;
const blockedPatterns = [
  /\b(real[-\s]?world\s+tragedy|tragedy\s+comparison)\b/i,
  /\b(kill yourself|kys|doxx|doxxing)\b/i,
  /\b(racist|ethnic slur|nazi)\b/i,
];

export type ValidationResult = { ok: true } | { ok: false; message: string };

export function validateUserText(value: string, maxLength: number): ValidationResult {
  const text = value.trim();

  if (text.length > maxLength) {
    return { ok: false, message: `Keep it under ${maxLength} characters.` };
  }

  if (linkPattern.test(text)) {
    return { ok: false, message: "Links are not accepted in funeral paperwork." };
  }

  if (blockedPatterns.some((pattern) => pattern.test(text))) {
    return {
      ok: false,
      message: "Keep it about football trauma. Do not attack real people.",
    };
  }

  return { ok: true };
}

export function validateRequiredSignature(value: string, maxLength: number): ValidationResult {
  if (!value.trim()) {
    return { ok: false, message: "Buried by is required." };
  }

  return validateUserText(value, maxLength);
}

export function cleanSignature(value: string): string {
  const cleaned = value.trim().replace(/\s+/g, " ");
  return (cleaned || "Anonymous Fan").slice(0, 30);
}
