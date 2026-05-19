/**
 * Normalize an email address for duplicate-detection purposes.
 * The normalization:
 *   1. Strips the "+" alias from the local part when "+" is not the first character
 *      (e.g., `aaa+1@aaa.com` → `aaa@aaa.com`; but `+alias@example.com` is unchanged)
 *   2. Lowercases both the local part and the domain
 *
 * This is used to detect duplicate registrations where users exploit "+" addressing
 * (e.g., aaa+1@aaa.com and aaa@aaa.com are treated as the same address).
 *
 * @param email - Email address to normalize
 * @returns Normalized email with the "+" alias stripped and the address lowercased
 * @example normalizeEmail("aaa+1@aaa.com")       // => "aaa@aaa.com"
 * @example normalizeEmail("aaa@aaa.com")          // => "aaa@aaa.com"
 * @example normalizeEmail("User@Example.COM")     // => "user@example.com"
 * @example normalizeEmail("+alias@example.com")   // => "+alias@example.com"
 */
export function normalizeEmail(email: string): string {
  const atIndex = email.indexOf("@");
  if (atIndex === -1) {
    return email.toLowerCase();
  }
  const localPart = email.slice(0, atIndex);
  const domain = email.slice(atIndex + 1);
  const plusIndex = localPart.indexOf("+");
  const normalizedLocal =
    plusIndex > 0 ? localPart.slice(0, plusIndex) : localPart;
  return `${normalizedLocal.toLowerCase()}@${domain.toLowerCase()}`;
}
