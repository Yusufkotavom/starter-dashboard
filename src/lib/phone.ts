export function normalizePhoneNumber(
  value?: string | null,
  defaultCountryCode = '62'
): string | null {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  let normalized = trimmed.replace(/[^\d+]/g, '');
  if (!normalized) {
    return null;
  }

  if (normalized.startsWith('00')) {
    normalized = `+${normalized.slice(2)}`;
  }

  if (normalized.startsWith('+')) {
    normalized = normalized.slice(1);
  } else if (normalized.startsWith('0')) {
    normalized = `${defaultCountryCode}${normalized.slice(1)}`;
  }

  normalized = normalized.replace(/\D/g, '');
  return normalized || null;
}

export function formatPhoneDisplay(value?: string | null): string | null {
  const normalized = normalizePhoneNumber(value);
  return normalized ? `+${normalized}` : null;
}
