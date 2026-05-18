import type { CanvasElement, Point } from '@/types/canvas.types'

const HIT_PAD = 8

export function getElementAtPoint(
  elements: CanvasElement[],
  point:    Point,
  zoom:     number
): CanvasElement | null {
  const pad = HIT_PAD / zoom

  // Üstdən aşağı axtarış (son çizilən üstdə olur)
  for (let i = elements.length - 1; i >= 0; i--) {
    const el = elements[i] as CanvasElement
    if (!el || el.isDeleted) continue

    if (isPointInElement(el, point, pad)) return el
  }

  return null
}

export function getElementsInRect(
  elements: CanvasElement[],
  p1:       Point,
  p2:       Point
): CanvasElement[] {
  const minX = Math.min(p1.x, p2.x)
  const minY = Math.min(p1.y, p2.y)
  const maxX = Math.max(p1.x, p2.x)
  const maxY = Math.max(p1.y, p2.y)

  return elements.filter(el => {
    if (!el || el.isDeleted) return false
    return (
      el.x >= minX &&
      el.y >= minY &&
      el.x + el.width  <= maxX &&
      el.y + el.height <= maxY
    )
  })
}

function isPointInElement(
  el:    CanvasElement,
  point: Point,
  pad:   number
): boolean {
  const { x, y, width, height, type } = el

  // Bounding box normallaşdırmaq
  const minX = Math.min(x, x + width)  - pad
  const minY = Math.min(y, y + height) - pad
  const maxX = Math.max(x, x + width)  + pad
  const maxY = Math.max(y, y + height) + pad

  if (point.x < minX || point.x > maxX) return false
  if (point.y < minY || point.y > maxY) return false

  // Ellipse — daha dəqiq hit test
  if (type === 'ellipse') {
    const cx = x + width  / 2
    const cy = y + height / 2
    const rx = Math.abs(width)  / 2 + pad
    const ry = Math.abs(height) / 2 + pad
    return ((point.x - cx) ** 2 / rx ** 2) +
           ((point.y - cy) ** 2 / ry ** 2) <= 1
  }

  return true
}
