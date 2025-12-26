/**
 * Normalize Kenyan phone number to 254XXXXXXXXX format
 * Accepts: 0712345678, +254712345678, 254712345678, 712345678
 */
export function formatKenyanPhone(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '');
  
  if (cleaned.startsWith('254')) {
    return cleaned;
  } else if (cleaned.startsWith('0')) {
    return '254' + cleaned.slice(1);
  } else if (cleaned.startsWith('7') || cleaned.startsWith('1')) {
    return '254' + cleaned;
  }
  
  return cleaned;
}

/**
 * Validate if phone is a valid Kenyan number
 */
export function isValidKenyanPhone(phone: string): boolean {
  const formatted = formatKenyanPhone(phone);
  return /^254[17]\d{8}$/.test(formatted);
}