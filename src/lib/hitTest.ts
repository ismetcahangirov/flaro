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
    
    // Check if any part of the element intersects the selection rectangle
    const eMinX = Math.min(el.x, el.x + el.width)
    const eMaxX = Math.max(el.x, el.x + el.width)
    const eMinY = Math.min(el.y, el.y + el.height)
    const eMaxY = Math.max(el.y, el.y + el.height)

    return !(eMaxX < minX || eMinX > maxX || eMaxY < minY || eMinY > maxY)
  })
}

function isPointInElement(
  el:    CanvasElement,
  point: Point,
  pad:   number
): boolean {
  const { x, y, width, height, type, angle } = el

  // Transform point to element local space to account for rotation
  const cx = x + width / 2
  const cy = y + height / 2
  const dx = point.x - cx
  const dy = point.y - cy
  const localAngle = -(angle || 0)
  const rotatedX = cx + dx * Math.cos(localAngle) - dy * Math.sin(localAngle)
  const rotatedY = cy + dx * Math.sin(localAngle) + dy * Math.cos(localAngle)

  // Bounding box normallaşdırmaq
  const minX = Math.min(x, x + width)  - pad
  const minY = Math.min(y, y + height) - pad
  const maxX = Math.max(x, x + width)  + pad
  const maxY = Math.max(y, y + height) + pad

  if (rotatedX < minX || rotatedX > maxX) return false
  if (rotatedY < minY || rotatedY > maxY) return false

  // Ellipse — daha dəqiq hit test
  if (type === 'ellipse') {
    const rx = Math.abs(width)  / 2 + pad
    const ry = Math.abs(height) / 2 + pad
    return ((rotatedX - cx) ** 2 / rx ** 2) +
           ((rotatedY - cy) ** 2 / ry ** 2) <= 1
  }

  // Line / Arrow / Freedraw check
  // For precise line hit testing, we would need to check distance to segments,
  // but bounding box is a good enough approximation for now.
  
  return true
}

export type HandleType = 'tl' | 'tm' | 'tr' | 'mr' | 'br' | 'bm' | 'bl' | 'ml' | 'rotate'

export function getHandleAtPoint(
  el: CanvasElement,
  point: Point,
  zoom: number
): HandleType | null {
  const PAD  = 6  / zoom
  const SIZE = 12 / zoom // Expanded hit area for easier grabbing
  const ROTATE_OFFSET = 30 / zoom

  // Define handle centers based on the element's current unrotated bounding box.
  // We need to apply the inverse rotation to the point to hit test against the unrotated handles.
  
  const cx = el.x + el.width / 2
  const cy = el.y + el.height / 2

  // Transform the mouse point back to the element's local coordinate space
  const dx = point.x - cx
  const dy = point.y - cy
  const angle = -el.angle || 0
  const rotatedX = cx + dx * Math.cos(angle) - dy * Math.sin(angle)
  const rotatedY = cy + dx * Math.sin(angle) + dy * Math.cos(angle)

  // Use the rotated point to test against the unrotated handle positions
  const px = rotatedX
  const py = rotatedY

  const hitTest = (hx: number, hy: number) => {
    return px >= hx - SIZE && px <= hx + SIZE &&
           py >= hy - SIZE && py <= hy + SIZE
  }

  const rotHitTest = (hx: number, hy: number) => {
    // Rotation handle is usually a circle, use distance
    return Math.hypot(px - hx, py - hy) <= SIZE
  }

  if (rotHitTest(el.x + el.width / 2, el.y - PAD - ROTATE_OFFSET)) return 'rotate'
  if (hitTest(el.x - PAD, el.y - PAD)) return 'tl'
  if (hitTest(el.x + el.width / 2, el.y - PAD)) return 'tm'
  if (hitTest(el.x + el.width + PAD, el.y - PAD)) return 'tr'
  if (hitTest(el.x + el.width + PAD, el.y + el.height / 2)) return 'mr'
  if (hitTest(el.x + el.width + PAD, el.y + el.height + PAD)) return 'br'
  if (hitTest(el.x + el.width / 2, el.y + el.height + PAD)) return 'bm'
  if (hitTest(el.x - PAD, el.y + el.height + PAD)) return 'bl'
  if (hitTest(el.x - PAD, el.y + el.height / 2)) return 'ml'

  return null
}

