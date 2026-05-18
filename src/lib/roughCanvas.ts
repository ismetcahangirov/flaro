import rough from 'roughjs'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { Options as RoughOptions } from 'roughjs/bin/core'
import type { CanvasElement, Point } from '@/types/canvas.types'

function getRoughOptions(el: CanvasElement): RoughOptions {
  return {
    seed:                el.seed,
    roughness:           el.roughness,          // 0 = hamar, 3 = çox kobud
    stroke:              el.strokeColor,
    strokeWidth:         el.strokeWidth,
    fill:                el.fillColor === 'transparent' ? undefined : el.fillColor,
    fillStyle:           el.fillStyle === 'none' ? undefined : el.fillStyle,
    strokeLineDash:      getLineDash(el.strokeStyle, el.strokeWidth),
    disableMultiStroke:  false,
    preserveVertices:    false,
  }
}

function getLineDash(style: string, width: number): number[] | undefined {
  switch (style) {
    case 'dashed':  return [width * 4, width * 3]
    case 'dotted':  return [width,     width * 2]
    default:        return undefined
  }
}

// ── Element çiz ──────────────────────────────────────────────────────────────

export function drawRoughElement(
  rc:  RoughCanvas,
  ctx: CanvasRenderingContext2D,
  el:  CanvasElement
): void {
  ctx.save()
  ctx.globalAlpha = el.opacity / 100

  // Element mərkəzinə görə döndər
  if (el.angle !== 0) {
    const cx = el.x + el.width  / 2
    const cy = el.y + el.height / 2
    ctx.translate(cx, cy)
    ctx.rotate(el.angle)
    ctx.translate(-cx, -cy)
  }

  const opts = getRoughOptions(el)

  switch (el.type) {
    case 'rectangle':
      rc.rectangle(el.x, el.y, el.width, el.height, opts)
      break

    case 'ellipse':
      rc.ellipse(
        el.x + el.width  / 2,
        el.y + el.height / 2,
        Math.abs(el.width),
        Math.abs(el.height),
        opts
      )
      break

    case 'diamond': {
      const cx = el.x + el.width  / 2
      const cy = el.y + el.height / 2
      rc.polygon([
        [cx,          el.y         ],
        [el.x + el.width, cy       ],
        [cx,          el.y + el.height],
        [el.x,        cy           ],
      ], opts)
      break
    }

    case 'line':
      if (el.points && el.points.length >= 2) {
        const pts = el.points.map(p => [el.x + p.x, el.y + p.y] as [number, number])
        rc.linearPath(pts, opts)
      }
      break

    case 'arrow': {
      if (el.points && el.points.length >= 2) {
        const pts = el.points.map(p => [el.x + p.x, el.y + p.y] as [number, number])
        rc.linearPath(pts, opts)
        // Ox başlıqları
        drawArrowhead(ctx, pts, el.strokeColor, el.strokeWidth)
      }
      break
    }

    case 'freedraw':
      if (el.points && el.points.length >= 2) {
        drawFreedraw(ctx, el)
      }
      break

    case 'text':
      drawText(ctx, el)
      break

    case 'image':
      // Image-lər ayrı idarə olunur
      break
  }

  ctx.restore()
}

// ── Ox başlığı ───────────────────────────────────────────────────────────────

function drawArrowhead(
  ctx:    CanvasRenderingContext2D,
  points: [number, number][],
  color:  string,
  width:  number
): void {
  const last = points[points.length - 1]
  const prev = points[points.length - 2]

  const angle  = Math.atan2(last[1] - prev[1], last[0] - prev[0])
  const size   = width * 4 + 8
  const spread = Math.PI / 6  // 30 dərəcə

  ctx.save()
  ctx.strokeStyle = color
  ctx.fillStyle   = color
  ctx.lineWidth   = width
  ctx.beginPath()
  ctx.moveTo(last[0], last[1])
  ctx.lineTo(
    last[0] - size * Math.cos(angle - spread),
    last[1] - size * Math.sin(angle - spread)
  )
  ctx.moveTo(last[0], last[1])
  ctx.lineTo(
    last[0] - size * Math.cos(angle + spread),
    last[1] - size * Math.sin(angle + spread)
  )
  ctx.stroke()
  ctx.restore()
}

// ── Sərbəst çizim ─────────────────────────────────────────────────────────────

function drawFreedraw(
  ctx: CanvasRenderingContext2D,
  el:  CanvasElement
): void {
  if (!el.points || el.points.length < 2) return

  ctx.save()
  ctx.strokeStyle  = el.strokeColor
  ctx.lineWidth    = el.strokeWidth
  ctx.lineCap      = 'round'
  ctx.lineJoin     = 'round'
  ctx.globalAlpha  = el.opacity / 100

  ctx.beginPath()
  ctx.moveTo(el.x + el.points[0].x, el.y + el.points[0].y)

  // Smooth curves — Catmull-Rom spline
  for (let i = 1; i < el.points.length - 1; i++) {
    const p1 = el.points[i]
    const p2 = el.points[i + 1]

    const mx = (el.x + p1.x + el.x + p2.x) / 2
    const my = (el.y + p1.y + el.y + p2.y) / 2

    ctx.quadraticCurveTo(el.x + p1.x, el.y + p1.y, mx, my)
  }

  const last = el.points[el.points.length - 1]
  ctx.lineTo(el.x + last.x, el.y + last.y)
  ctx.stroke()
  ctx.restore()
}

// ── Text render ───────────────────────────────────────────────────────────────

const FONT_FAMILIES: Record<string, string> = {
  hand:   'Caveat, cursive',
  normal: 'Inter, sans-serif',
  code:   'JetBrains Mono, monospace',
}

export function drawText(
  ctx: CanvasRenderingContext2D,
  el:  CanvasElement
): void {
  if (!el.text) return

  ctx.save()
  ctx.globalAlpha  = el.opacity / 100
  ctx.fillStyle    = el.strokeColor
  ctx.font         = `${el.fontSize ?? 20}px ${FONT_FAMILIES[el.fontFamily ?? 'hand']}`
  ctx.textAlign    = (el.textAlign ?? 'left') as CanvasTextAlign
  ctx.textBaseline = 'top'

  const lines = el.text.split('\n')
  const lineH = (el.fontSize ?? 20) * 1.4

  lines.forEach((line, i) => {
    const x = el.textAlign === 'center'
      ? el.x + el.width / 2
      : el.textAlign === 'right'
        ? el.x + el.width
        : el.x

    ctx.fillText(line, x, el.y + i * lineH)
  })

  ctx.restore()
}

// ── Seçim çərçivəsi ───────────────────────────────────────────────────────────

export function drawSelectionBox(
  ctx:    CanvasRenderingContext2D,
  el:     CanvasElement,
  zoom:   number,
  color = '#F97316'  // Brand orange
): void {
  const PAD = 6 / zoom

  ctx.save()
  ctx.strokeStyle     = color
  ctx.lineWidth       = 1.5 / zoom
  ctx.setLineDash     ([4 / zoom, 2 / zoom])
  ctx.strokeRect(
    el.x - PAD,
    el.y - PAD,
    el.width  + PAD * 2,
    el.height + PAD * 2
  )
  ctx.setLineDash([])

  // Künc tutacaqları
  drawHandles(ctx, el, zoom, color)
  ctx.restore()
}

function drawHandles(
  ctx:   CanvasRenderingContext2D,
  el:    CanvasElement,
  zoom:  number,
  color: string
): void {
  const PAD  = 6  / zoom
  const SIZE = 8  / zoom
  const HALF = SIZE / 2

  const handles: [number, number][] = [
    [el.x - PAD - HALF,              el.y - PAD - HALF],               // TL
    [el.x + el.width / 2 - HALF,     el.y - PAD - HALF],               // TM
    [el.x + el.width + PAD - HALF,   el.y - PAD - HALF],               // TR
    [el.x + el.width + PAD - HALF,   el.y + el.height / 2 - HALF],     // MR
    [el.x + el.width + PAD - HALF,   el.y + el.height + PAD - HALF],   // BR
    [el.x + el.width / 2 - HALF,     el.y + el.height + PAD - HALF],   // BM
    [el.x - PAD - HALF,              el.y + el.height + PAD - HALF],   // BL
    [el.x - PAD - HALF,              el.y + el.height / 2 - HALF],     // ML
  ]

  handles.forEach(([hx, hy]) => {
    ctx.fillStyle   = '#fff'
    ctx.strokeStyle = color
    ctx.lineWidth   = 1.5 / zoom
    ctx.fillRect   (hx, hy, SIZE, SIZE)
    ctx.strokeRect (hx, hy, SIZE, SIZE)
  })
}

// ── Lasso seçim xətti ────────────────────────────────────────────────────────

export function drawLasso(
  ctx:   CanvasRenderingContext2D,
  start: Point,
  end:   Point,
  zoom:  number
): void {
  ctx.save()
  ctx.strokeStyle = '#F97316'
  ctx.fillStyle   = 'rgba(249, 115, 22, 0.08)'
  ctx.lineWidth   = 1.5 / zoom
  ctx.setLineDash ([4 / zoom, 2 / zoom])

  const x = Math.min(start.x, end.x)
  const y = Math.min(start.y, end.y)
  const w = Math.abs(end.x - start.x)
  const h = Math.abs(end.y - start.y)

  ctx.fillRect  (x, y, w, h)
  ctx.strokeRect(x, y, w, h)
  ctx.setLineDash([])
  ctx.restore()
}
