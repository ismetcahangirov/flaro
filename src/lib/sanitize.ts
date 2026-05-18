// XSS qorunması üçün HTML escape
export function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g,  '&amp;')
    .replace(/</g,  '&lt;')
    .replace(/>/g,  '&gt;')
    .replace(/"/g,  '&quot;')
    .replace(/'/g,  '&#039;')
}

// Scene title sanitizasiyası
export function sanitizeTitle(title: string): string {
  return escapeHtml(title.trim()).slice(0, 100)
}

// Comment məzmunu sanitizasiyası
export function sanitizeComment(content: string): string {
  return escapeHtml(content.trim()).slice(0, 2000)
}

// Email validasiya
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email) && email.length <= 254
}

// Şifrə gücü yoxlaması
export interface PasswordStrength {
  score:    0 | 1 | 2 | 3 | 4
  feedback: string[]
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = []
  let score: 0 | 1 | 2 | 3 | 4 = 0

  if (password.length >= 8)  score++
  else feedback.push('Minimum 8 simvol olmalıdır')

  if (/[A-Z]/.test(password)) score++
  else feedback.push('Böyük hərf əlavə edin')

  if (/[0-9]/.test(password)) score++
  else feedback.push('Rəqəm əlavə edin')

  if (/[^A-Za-z0-9]/.test(password)) score++
  else feedback.push('Xüsusi simvol əlavə edin (@, #, ! və s.)')

  return { score: score as 0 | 1 | 2 | 3 | 4, feedback }
}
