// Hər istifadəçiyə unikal rəng — orange ailəsi + digər canlı rənglər
const COLLAB_COLORS = [
  '#F97316',  // Orange (brand)
  '#3B82F6',  // Blue
  '#10B981',  // Emerald
  '#8B5CF6',  // Violet
  '#EF4444',  // Red
  '#F59E0B',  // Amber
  '#06B6D4',  // Cyan
  '#EC4899',  // Pink
  '#84CC16',  // Lime
  '#6366F1',  // Indigo
] as const

// UserId-dən deterministik rəng seç (eyni user həmişə eyni rəng)
export function getUserColor(userId: string): string {
  let hash = 0
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash)
  }
  return COLLAB_COLORS[Math.abs(hash) % COLLAB_COLORS.length]!
}

// Rəngi yarı şəffaf et (seçim overlay üçün)
export function colorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}
