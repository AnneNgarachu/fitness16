export function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString()
}

export function maskPhone(phone: string): string {
  if (phone.length < 8) return phone
  return phone.slice(0, 6) + '****' + phone.slice(-2)
}