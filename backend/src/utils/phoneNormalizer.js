/**
 * Normalize Indian phone numbers to canonical 10-digit string
 * Handles +91, 91, leading 0, spaces, dashes, parentheses
 */
function normalizePhoneNumber(phone) {
  if (!phone) return null;
  // Convert to string and remove all non-digits
  const cleaned = String(phone).replace(/\D/g, '');

  if (!cleaned) return null;

  // Handle +91 or 91 prefix on 12-digit number (e.g. 919876543210 -> 9876543210)
  if (cleaned.length === 12 && cleaned.startsWith('91')) {
    return cleaned.slice(2);
  }

  // Handle 0 prefix on 11-digit number (e.g. 09876543210 -> 9876543210)
  if (cleaned.length === 11 && cleaned.startsWith('0')) {
    return cleaned.slice(1);
  }

  // Standard 10-digit number
  if (cleaned.length === 10) {
    return cleaned;
  }

  // If it's a valid landline or other length, return cleaned
  return cleaned;
}

/**
 * Normalizes an array of phone numbers, removing nulls and duplicates
 */
function normalizePhoneNumbers(phones) {
  if (!phones) return [];
  const list = Array.isArray(phones) ? phones : [phones];
  const normalizedSet = new Set();

  for (const p of list) {
    const norm = normalizePhoneNumber(p);
    if (norm && norm.length >= 7) {
      normalizedSet.add(norm);
    }
  }

  return Array.from(normalizedSet);
}

/**
 * Validates whether a normalized phone number is a valid 10-digit mobile number
 */
function isValidIndianMobile(phone) {
  const norm = normalizePhoneNumber(phone);
  if (!norm) return false;
  // Valid Indian mobile begins with 6, 7, 8, or 9 and has 10 digits
  return /^[6-9]\d{9}$/.test(norm);
}

module.exports = {
  normalizePhoneNumber,
  normalizePhoneNumbers,
  isValidIndianMobile
};
