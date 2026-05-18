# Flaro — Canvas Engine

> **HTML5 Canvas + Rough.js** — El çizimi efekti, Zustand state, Undo/Redo, Zoom/Pan
> TypeScript strict mode ilə tam tipləşdirilmiş

---

## 🎨 Canvas Arxitekturası

```
┌─────────────────────────────────────────────────────────────┐
│                    CANVAS PIPELINE                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  User Input (mouse/touch/keyboard)                          │
│       │                                                     │
│       ▼                                                     │
│  useCanvas Hook                                             │
│  ┌────────────────────────────────────┐                     │
│  │  Tool Handler                      │                     │
│  │  (select/draw/text/erase/pan)      │                     │
│  └────────────┬───────────────────────┘                     │
│               │                                             │
│               ▼                                             │
│  canvasStore (Zustand)                                      │
│  ┌────────────────────────────────────┐                     │
│  │  elements[]     ← CanvasElement[]  │                     │
│  │  selectedIds    ← Set<string>      │                     │
│  │  undoStack[]                       │                     │
│  │  redoStack[]                       │                     │
│  │  appState       ← zoom/pan/bg      │                     │
│  └────────────┬───────────────────────┘                     │
│               │                                             │
│               ▼                                             │
│  Render Loop (requestAnimationFrame)                        │
│  ┌────────────────────────────────────┐                     │
│  │  clearCanvas()                     │                     │
│  │  drawGrid() (optional)             │                     │
│  │  forEach element:                  │                     │
│  │    roughDraw(element) ← Rough.js   │                     │
│  │  drawSelectionHandles()            │                     │
│  │  drawCollabCursors()               │                     │
│  └────────────────────────────────────┘                     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

---

## 📦 Rough.js Wrapper

### `src/lib/roughCanvas.ts`

```typescript
import rough from 'roughjs'
import type { RoughCanvas } from 'roughjs/bin/canvas'
import type { Options as RoughOptions } from 'roughjs/bin/core'
import type { CanvasElement, Point } from '@/types/canvas.types'

// Rough.js seed-i sabit saxla — hər render-də eyni görünsün
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
    const p0 = el.points[i - 1]
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
```

---

## 🗃️ Canvas Store (Zustand)

### `src/store/canvasStore.ts`

```typescript
import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type {
  CanvasElement,
  AppState,
  ToolType,
  Point,
} from '@/types/canvas.types'

const MAX_HISTORY = 50

interface CanvasStore {
  // ── Elementlər ────────────────────────────────────────────────────────────
  elements:      CanvasElement[]
  selectedIds:   Set<string>
  editingId:     string | null      // Text edit modunda olan element

  // ── Tool ──────────────────────────────────────────────────────────────────
  activeTool:    ToolType
  strokeColor:   string
  fillColor:     string
  fillStyle:     CanvasElement['fillStyle']
  strokeWidth:   number
  strokeStyle:   CanvasElement['strokeStyle']
  roughness:     number
  opacity:       number
  fontSize:      number
  fontFamily:    CanvasElement['fontFamily']

  // ── App state ─────────────────────────────────────────────────────────────
  appState:      AppState

  // ── History ───────────────────────────────────────────────────────────────
  undoStack:     CanvasElement[][]
  redoStack:     CanvasElement[][]

  // ── UI ────────────────────────────────────────────────────────────────────
  isDirty:       boolean    // Saxlanılmamış dəyişikliklər
  isReadOnly:    boolean    // Paylaşılan view-only rejim

  // ── Actions: Elements ─────────────────────────────────────────────────────
  addElement:       (el: CanvasElement) => void
  updateElement:    (id: string, updates: Partial<CanvasElement>) => void
  updateElements:   (ids: string[], updates: Partial<CanvasElement>) => void
  deleteElements:   (ids: string[]) => void
  duplicateElements:(ids: string[]) => void
  bringToFront:     (ids: string[]) => void
  sendToBack:       (ids: string[]) => void
  setElements:      (elements: CanvasElement[]) => void

  // ── Actions: Selection ────────────────────────────────────────────────────
  selectElement:    (id: string, multi?: boolean) => void
  selectAll:        () => void
  clearSelection:   () => void
  setEditingId:     (id: string | null) => void

  // ── Actions: Tool ─────────────────────────────────────────────────────────
  setTool:          (tool: ToolType) => void
  setStrokeColor:   (color: string) => void
  setFillColor:     (color: string) => void
  setFillStyle:     (style: CanvasElement['fillStyle']) => void
  setStrokeWidth:   (width: number) => void
  setStrokeStyle:   (style: CanvasElement['strokeStyle']) => void
  setRoughness:     (roughness: number) => void
  setOpacity:       (opacity: number) => void

  // ── Actions: AppState ─────────────────────────────────────────────────────
  setZoom:          (zoom: number) => void
  setScroll:        (x: number, y: number) => void
  setBackground:    (color: string) => void
  resetView:        () => void
  zoomToFit:        () => void

  // ── Actions: History ──────────────────────────────────────────────────────
  saveHistory:      () => void
  undo:             () => void
  redo:             () => void
  canUndo:          () => boolean
  canRedo:          () => boolean

  // ── Actions: Scene ────────────────────────────────────────────────────────
  loadScene:        (elements: CanvasElement[], appState: AppState) => void
  clearCanvas:      () => void
  setDirty:         (dirty: boolean) => void
  setReadOnly:      (readOnly: boolean) => void
}

const DEFAULT_APP_STATE: AppState = {
  zoom:            1,
  scrollX:         0,
  scrollY:         0,
  backgroundColor: '#ffffff',
  gridEnabled:     false,
  gridSize:        20,
  theme:           'light',
}

export const useCanvasStore = create<CanvasStore>()(
  devtools(
    subscribeWithSelector(
      immer((set, get) => ({
        // ── Initial state ────────────────────────────────────────────────────
        elements:    [],
        selectedIds: new Set<string>(),
        editingId:   null,

        activeTool:  'select',
        strokeColor: '#1e1e1e',
        fillColor:   'transparent',
        fillStyle:   'hachure',
        strokeWidth: 2,
        strokeStyle: 'solid',
        roughness:   1,
        opacity:     100,
        fontSize:    20,
        fontFamily:  'hand',

        appState:    { ...DEFAULT_APP_STATE },
        undoStack:   [[]],
        redoStack:   [],
        isDirty:     false,
        isReadOnly:  false,

        // ── Element actions ──────────────────────────────────────────────────
        addElement: (el) => set((state) => {
          state.elements.push(el)
          state.isDirty = true
        }),

        updateElement: (id, updates) => set((state) => {
          const idx = state.elements.findIndex(e => e.id === id)
          if (idx !== -1) {
            Object.assign(state.elements[idx], updates)
            state.isDirty = true
          }
        }),

        updateElements: (ids, updates) => set((state) => {
          state.elements.forEach(el => {
            if (ids.includes(el.id)) Object.assign(el, updates)
          })
          state.isDirty = true
        }),

        deleteElements: (ids) => set((state) => {
          state.elements = state.elements.filter(e => !ids.includes(e.id))
          ids.forEach(id => state.selectedIds.delete(id))
          state.isDirty = true
        }),

        duplicateElements: (ids) => set((state) => {
          const OFFSET = 20
          const newEls: CanvasElement[] = []

          ids.forEach(id => {
            const el = state.elements.find(e => e.id === id)
            if (!el) return
            newEls.push({
              ...el,
              id:   nanoid(),
              x:    el.x + OFFSET,
              y:    el.y + OFFSET,
              seed: Math.floor(Math.random() * 100000),
            })
          })

          state.elements.push(...newEls)
          state.selectedIds = new Set(newEls.map(e => e.id))
          state.isDirty = true
        }),

        bringToFront: (ids) => set((state) => {
          const targets = state.elements.filter(e =>  ids.includes(e.id))
          const rest    = state.elements.filter(e => !ids.includes(e.id))
          state.elements = [...rest, ...targets]
        }),

        sendToBack: (ids) => set((state) => {
          const targets = state.elements.filter(e =>  ids.includes(e.id))
          const rest    = state.elements.filter(e => !ids.includes(e.id))
          state.elements = [...targets, ...rest]
        }),

        setElements: (elements) => set((state) => {
          state.elements = elements
        }),

        // ── Selection ────────────────────────────────────────────────────────
        selectElement: (id, multi = false) => set((state) => {
          if (multi) {
            if (state.selectedIds.has(id)) {
              state.selectedIds.delete(id)
            } else {
              state.selectedIds.add(id)
            }
          } else {
            state.selectedIds = new Set([id])
          }
        }),

        selectAll: () => set((state) => {
          state.selectedIds = new Set(
            state.elements.filter(e => !e.isDeleted).map(e => e.id)
          )
        }),

        clearSelection: () => set((state) => {
          state.selectedIds = new Set()
          state.editingId   = null
        }),

        setEditingId: (id) => set((state) => {
          state.editingId = id
        }),

        // ── Tool ─────────────────────────────────────────────────────────────
        setTool:        (tool)      => set((s) => { s.activeTool  = tool  }),
        setStrokeColor: (color)     => set((s) => { s.strokeColor = color }),
        setFillColor:   (color)     => set((s) => { s.fillColor   = color }),
        setFillStyle:   (style)     => set((s) => { s.fillStyle   = style }),
        setStrokeWidth: (width)     => set((s) => { s.strokeWidth = width }),
        setStrokeStyle: (style)     => set((s) => { s.strokeStyle = style }),
        setRoughness:   (roughness) => set((s) => { s.roughness   = roughness }),
        setOpacity:     (opacity)   => set((s) => { s.opacity     = opacity  }),

        // ── AppState ─────────────────────────────────────────────────────────
        setZoom: (zoom) => set((s) => {
          s.appState.zoom = Math.min(Math.max(zoom, 0.1), 30)
        }),

        setScroll: (x, y) => set((s) => {
          s.appState.scrollX = x
          s.appState.scrollY = y
        }),

        setBackground: (color) => set((s) => {
          s.appState.backgroundColor = color
          s.isDirty = true
        }),

        resetView: () => set((s) => {
          s.appState.zoom    = 1
          s.appState.scrollX = 0
          s.appState.scrollY = 0
        }),

        zoomToFit: () => set((s) => {
          if (s.elements.length === 0) return

          const xs = s.elements.flatMap(e => [e.x, e.x + e.width])
          const ys = s.elements.flatMap(e => [e.y, e.y + e.height])

          const minX = Math.min(...xs)
          const minY = Math.min(...ys)
          const maxX = Math.max(...xs)
          const maxY = Math.max(...ys)

          const W = window.innerWidth
          const H = window.innerHeight
          const PAD = 80

          const zoom = Math.min(
            (W - PAD * 2) / (maxX - minX),
            (H - PAD * 2) / (maxY - minY),
            3
          )

          s.appState.zoom    = zoom
          s.appState.scrollX = W / 2 - ((minX + maxX) / 2) * zoom
          s.appState.scrollY = H / 2 - ((minY + maxY) / 2) * zoom
        }),

        // ── History ──────────────────────────────────────────────────────────
        saveHistory: () => set((s) => {
          const snapshot = JSON.parse(JSON.stringify(s.elements))
          s.undoStack.push(snapshot)

          if (s.undoStack.length > MAX_HISTORY) {
            s.undoStack.shift()
          }

          s.redoStack = []
        }),

        undo: () => set((s) => {
          if (s.undoStack.length <= 1) return

          const current  = s.undoStack.pop()!
          s.redoStack.push(current)
          s.elements     = s.undoStack[s.undoStack.length - 1]
          s.selectedIds  = new Set()
          s.isDirty      = true
        }),

        redo: () => set((s) => {
          if (s.redoStack.length === 0) return

          const next    = s.redoStack.pop()!
          s.undoStack.push(next)
          s.elements    = next
          s.selectedIds = new Set()
          s.isDirty     = true
        }),

        canUndo: () => get().undoStack.length > 1,
        canRedo: () => get().redoStack.length > 0,

        // ── Scene ─────────────────────────────────────────────────────────────
        loadScene: (elements, appState) => set((s) => {
          s.elements    = elements
          s.appState    = appState
          s.undoStack   = [JSON.parse(JSON.stringify(elements))]
          s.redoStack   = []
          s.selectedIds = new Set()
          s.isDirty     = false
        }),

        clearCanvas: () => set((s) => {
          s.elements    = []
          s.undoStack   = [[]]
          s.redoStack   = []
          s.selectedIds = new Set()
          s.isDirty     = true
        }),

        setDirty:    (dirty)    => set((s) => { s.isDirty    = dirty    }),
        setReadOnly: (readOnly) => set((s) => { s.isReadOnly = readOnly }),
      }))
    ),
    { name: 'CanvasStore' }
  )
)
```

---

## 🪝 useCanvas Hook

### `src/hooks/useCanvas.ts`

```typescript
import {
  useRef, useEffect, useCallback, useState
} from 'react'
import rough from 'roughjs'
import { nanoid } from 'nanoid'
import { useCanvasStore } from '@/store/canvasStore'
import {
  drawRoughElement,
  drawSelectionBox,
  drawLasso,
} from '@/lib/roughCanvas'
import { getElementAtPoint, getElementsInRect } from '@/lib/hitTest'
import type { CanvasElement, Point, ToolType } from '@/types/canvas.types'

const ZOOM_STEP   = 0.1
const ZOOM_MIN    = 0.1
const ZOOM_MAX    = 30
const DRAG_THRESH = 4    // px — click vs drag ayırd etmək üçün

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const store    = useCanvasStore()
  const rafRef   = useRef<number>(0)

  // ── Mouse state ───────────────────────────────────────────────────────────
  const isDrawing    = useRef(false)
  const isPanning    = useRef(false)
  const isDragging   = useRef(false)
  const isResizing   = useRef(false)
  const mouseStart   = useRef<Point>({ x: 0, y: 0 })
  const lastMouse    = useRef<Point>({ x: 0, y: 0 })
  const currentEl    = useRef<CanvasElement | null>(null)
  const lassoStart   = useRef<Point | null>(null)
  const lassoEnd     = useRef<Point | null>(null)
  const spaceDown    = useRef(false)

  // ── Koordinat çevirmə ─────────────────────────────────────────────────────
  const toCanvas = useCallback((sx: number, sy: number): Point => {
    const { scrollX, scrollY, zoom } = store.appState
    return {
      x: (sx - scrollX) / zoom,
      y: (sy - scrollY) / zoom,
    }
  }, [store.appState])

  const toScreen = useCallback((cx: number, cy: number): Point => {
    const { scrollX, scrollY, zoom } = store.appState
    return {
      x: cx * zoom + scrollX,
      y: cy * zoom + scrollY,
    }
  }, [store.appState])

  // ── Yeni element yarat ────────────────────────────────────────────────────
  const createElement = useCallback((
    type:  CanvasElement['type'],
    start: Point
  ): CanvasElement => ({
    id:          nanoid(),
    type,
    x:           start.x,
    y:           start.y,
    width:       0,
    height:      0,
    angle:       0,
    strokeColor: store.strokeColor,
    fillColor:   store.fillColor,
    fillStyle:   store.fillStyle,
    strokeWidth: store.strokeWidth,
    strokeStyle: store.strokeStyle,
    roughness:   store.roughness,
    opacity:     store.opacity,
    seed:        Math.floor(Math.random() * 100000),
    version:     1,
    isDeleted:   false,
    points:      type === 'line' || type === 'arrow' || type === 'freedraw'
      ? [{ x: 0, y: 0 }]
      : undefined,
    text:        type === 'text' ? '' : undefined,
    fontSize:    type === 'text' ? store.fontSize : undefined,
    fontFamily:  type === 'text' ? store.fontFamily : undefined,
    textAlign:   type === 'text' ? 'left' : undefined,
  }), [store])

  // ── Mouse Down ───────────────────────────────────────────────────────────
  const handleMouseDown = useCallback((e: MouseEvent) => {
    if (e.button === 1 || spaceDown.current) {
      // Orta düymə və ya Space — pan
      isPanning.current  = true
      lastMouse.current  = { x: e.clientX, y: e.clientY }
      return
    }

    const canvasPoint = toCanvas(e.clientX, e.clientY)
    mouseStart.current = canvasPoint

    const { activeTool, elements, selectedIds, isReadOnly } = store

    if (isReadOnly && activeTool !== 'hand') return

    switch (activeTool) {
      case 'select': {
        const hit = getElementAtPoint(elements, canvasPoint, store.appState.zoom)

        if (hit) {
          if (!selectedIds.has(hit.id)) {
            store.selectElement(hit.id, e.shiftKey || e.metaKey)
          }
          isDragging.current = true
          lastMouse.current  = canvasPoint
        } else {
          if (!e.shiftKey) store.clearSelection()
          lassoStart.current = canvasPoint
          lassoEnd.current   = canvasPoint
        }
        break
      }

      case 'hand':
        isPanning.current = true
        lastMouse.current = { x: e.clientX, y: e.clientY }
        break

      case 'eraser': {
        const hit = getElementAtPoint(elements, canvasPoint, store.appState.zoom)
        if (hit) {
          store.saveHistory()
          store.deleteElements([hit.id])
        }
        break
      }

      case 'text': {
        const hit = getElementAtPoint(elements, canvasPoint, store.appState.zoom)
        if (hit?.type === 'text') {
          store.setEditingId(hit.id)
          store.selectElement(hit.id)
        } else {
          const el = createElement('text', canvasPoint)
          store.saveHistory()
          store.addElement(el)
          store.selectElement(el.id)
          store.setEditingId(el.id)
        }
        break
      }

      default: {
        // Shape tool-ları
        const toolToType: Partial<Record<ToolType, CanvasElement['type']>> = {
          rectangle: 'rectangle',
          ellipse:   'ellipse',
          diamond:   'diamond',
          line:      'line',
          arrow:     'arrow',
          freedraw:  'freedraw',
        }

        const elType = toolToType[activeTool]
        if (!elType) break

        isDrawing.current  = true
        const el = createElement(elType, canvasPoint)
        currentEl.current  = el
        store.saveHistory()
        store.addElement(el)
        store.selectElement(el.id)
      }
    }
  }, [store, toCanvas, createElement])

  // ── Mouse Move ───────────────────────────────────────────────────────────
  const handleMouseMove = useCallback((e: MouseEvent) => {
    const canvasPoint = toCanvas(e.clientX, e.clientY)

    // Pan
    if (isPanning.current) {
      const dx = e.clientX - lastMouse.current.x
      const dy = e.clientY - lastMouse.current.y
      store.setScroll(
        store.appState.scrollX + dx,
        store.appState.scrollY + dy
      )
      lastMouse.current = { x: e.clientX, y: e.clientY }
      return
    }

    // Drag seçilmiş elementlər
    if (isDragging.current && store.selectedIds.size > 0) {
      const dx = canvasPoint.x - lastMouse.current.x
      const dy = canvasPoint.y - lastMouse.current.y

      store.updateElements(
        Array.from(store.selectedIds),
        {} // immer update aşağıda
      )

      // Hər seçilmiş elementi yenilə
      store.elements.forEach(el => {
        if (store.selectedIds.has(el.id)) {
          store.updateElement(el.id, {
            x: el.x + dx,
            y: el.y + dy,
          })
        }
      })

      lastMouse.current = canvasPoint
      return
    }

    // Lasso
    if (lassoStart.current) {
      lassoEnd.current = canvasPoint

      // Lasso içindəki elementləri seç
      const inRect = getElementsInRect(
        store.elements,
        lassoStart.current,
        canvasPoint
      )
      store.setElements(
        store.elements.map(el => el) // redraw trigger
      )
      return
    }

    // Aktiv çizim
    if (isDrawing.current && currentEl.current) {
      const start = mouseStart.current
      const el    = currentEl.current

      const dx = canvasPoint.x - start.x
      const dy = canvasPoint.y - start.y

      // Shift: mütənasib ölçü
      const w = e.shiftKey && el.type !== 'line' && el.type !== 'arrow'
        ? Math.sign(dx) * Math.max(Math.abs(dx), Math.abs(dy))
        : dx
      const h = e.shiftKey && el.type !== 'line' && el.type !== 'arrow'
        ? Math.sign(dy) * Math.max(Math.abs(dx), Math.abs(dy))
        : dy

      if (el.type === 'line' || el.type === 'arrow') {
        store.updateElement(el.id, {
          points: [{ x: 0, y: 0 }, { x: dx, y: dy }],
          width:  Math.abs(dx),
          height: Math.abs(dy),
        })
      } else if (el.type === 'freedraw') {
        const newPoint: Point = {
          x: canvasPoint.x - el.x,
          y: canvasPoint.y - el.y,
        }
        const points = [...(el.points ?? []), newPoint]
        store.updateElement(el.id, { points })
      } else {
        store.updateElement(el.id, { width: w, height: h })
      }
    }
  }, [store, toCanvas])

  // ── Mouse Up ─────────────────────────────────────────────────────────────
  const handleMouseUp = useCallback((e: MouseEvent) => {
    // Lasso seçimi tamamla
    if (lassoStart.current && lassoEnd.current) {
      const inRect = getElementsInRect(
        store.elements,
        lassoStart.current,
        lassoEnd.current
      )

      if (inRect.length > 0) {
        inRect.forEach(el => store.selectElement(el.id, true))
      }

      lassoStart.current = null
      lassoEnd.current   = null
    }

    // Boş element-ləri sil (çizilməmiş)
    if (isDrawing.current && currentEl.current) {
      const el = currentEl.current
      const isEmpty =
        (el.type !== 'freedraw' && Math.abs(el.width) < 2 && Math.abs(el.height) < 2) ||
        (el.type === 'text' && !el.text?.trim())

      if (isEmpty && el.type !== 'text') {
        store.deleteElements([el.id])
      }

      // Bir kliklə shape: default ölçü ver
      if (Math.abs(el.width) < 4 && Math.abs(el.height) < 4 &&
          el.type !== 'freedraw' && el.type !== 'line' && el.type !== 'arrow') {
        store.updateElement(el.id, { width: 100, height: 100 })
      }
    }

    isDrawing.current  = false
    isPanning.current  = false
    isDragging.current = false
    currentEl.current  = null

    // Əgər element çizilibsə növbəti üçün select tooluna keç
    if (store.activeTool !== 'freedraw' &&
        store.activeTool !== 'eraser'   &&
        store.activeTool !== 'hand'     &&
        store.activeTool !== 'select'   &&
        store.activeTool !== 'text') {
      // Seçim alətinə qayıt (Excalidraw davranışı)
      // store.setTool('select')  // İstəyə görə aktiv et
    }
  }, [store])

  // ── Mouse Wheel (zoom) ───────────────────────────────────────────────────
  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault()

    const { zoom, scrollX, scrollY } = store.appState

    if (e.ctrlKey || e.metaKey) {
      // Zoom — mouse mərkəzinə görə
      const zoomDelta = e.deltaY < 0 ? ZOOM_STEP : -ZOOM_STEP
      const newZoom   = Math.min(Math.max(zoom + zoomDelta * zoom, ZOOM_MIN), ZOOM_MAX)
      const ratio     = newZoom / zoom

      store.setZoom(newZoom)
      store.setScroll(
        e.clientX - (e.clientX - scrollX) * ratio,
        e.clientY - (e.clientY - scrollY) * ratio
      )
    } else {
      // Scroll / pan
      store.setScroll(
        scrollX - e.deltaX,
        scrollY - e.deltaY
      )
    }
  }, [store])

  // ── Keyboard shortcuts ───────────────────────────────────────────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !store.editingId) {
        spaceDown.current = true
        e.preventDefault()
      }

      // Undo / Redo
      if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
        e.preventDefault()
        if (store.canUndo()) store.undo()
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
        e.preventDefault()
        if (store.canRedo()) store.redo()
      }

      // Select all
      if ((e.ctrlKey || e.metaKey) && e.key === 'a') {
        e.preventDefault()
        store.selectAll()
      }

      // Delete
      if ((e.key === 'Delete' || e.key === 'Backspace') && !store.editingId) {
        if (store.selectedIds.size > 0) {
          store.saveHistory()
          store.deleteElements(Array.from(store.selectedIds))
        }
      }

      // Duplicate
      if ((e.ctrlKey || e.metaKey) && e.key === 'd') {
        e.preventDefault()
        if (store.selectedIds.size > 0) {
          store.saveHistory()
          store.duplicateElements(Array.from(store.selectedIds))
        }
      }

      // Escape — seçimi ləğv et
      if (e.key === 'Escape') {
        store.clearSelection()
        store.setEditingId(null)
      }

      // Tool shortcuts
      const TOOL_KEYS: Record<string, ToolType> = {
        'v': 'select', 'h': 'hand',   'r': 'rectangle',
        'o': 'ellipse', 'd': 'diamond', 'l': 'line',
        'a': 'arrow',   't': 'text',    'p': 'freedraw',
        'e': 'eraser',
      }

      if (!e.ctrlKey && !e.metaKey && !store.editingId) {
        const tool = TOOL_KEYS[e.key.toLowerCase()]
        if (tool) store.setTool(tool)
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') spaceDown.current = false
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup',   onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup',   onKeyUp)
    }
  }, [store])

  // ── Render loop ───────────────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')!
    const rc  = rough.canvas(canvas)

    const render = () => {
      const { elements, selectedIds, appState } = store
      const { zoom, scrollX, scrollY, backgroundColor, gridEnabled, gridSize } = appState

      // Canvas boyutunu yenilə
      canvas.width  = window.innerWidth
      canvas.height = window.innerHeight

      // Arxa plan
      ctx.fillStyle = backgroundColor
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // Grid
      if (gridEnabled) drawGrid(ctx, zoom, scrollX, scrollY, gridSize)

      // Transform
      ctx.save()
      ctx.translate(scrollX, scrollY)
      ctx.scale(zoom, zoom)

      // Elementlər
      elements
        .filter(el => !el.isDeleted)
        .forEach(el => {
          drawRoughElement(rc, ctx, el)

          if (selectedIds.has(el.id)) {
            drawSelectionBox(ctx, el, zoom)
          }
        })

      // Lasso
      if (lassoStart.current && lassoEnd.current) {
        drawLasso(ctx, lassoStart.current, lassoEnd.current, zoom)
      }

      ctx.restore()

      rafRef.current = requestAnimationFrame(render)
    }

    rafRef.current = requestAnimationFrame(render)

    return () => cancelAnimationFrame(rafRef.current)
  }, [store, canvasRef])

  // ── Event listener-lər ───────────────────────────────────────────────────
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    canvas.addEventListener('mousedown', handleMouseDown)
    canvas.addEventListener('mousemove', handleMouseMove)
    canvas.addEventListener('mouseup',   handleMouseUp)
    canvas.addEventListener('wheel',     handleWheel, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', handleMouseDown)
      canvas.removeEventListener('mousemove', handleMouseMove)
      canvas.removeEventListener('mouseup',   handleMouseUp)
      canvas.removeEventListener('wheel',     handleWheel)
    }
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel])

  return { toCanvas, toScreen }
}

// ── Grid çizimi ───────────────────────────────────────────────────────────────

function drawGrid(
  ctx:     CanvasRenderingContext2D,
  zoom:    number,
  scrollX: number,
  scrollY: number,
  size:    number
): void {
  const W = ctx.canvas.width
  const H = ctx.canvas.height

  const gridSize = size * zoom
  const offsetX  = ((scrollX % gridSize) + gridSize) % gridSize
  const offsetY  = ((scrollY % gridSize) + gridSize) % gridSize

  ctx.save()
  ctx.strokeStyle = 'rgba(0,0,0,0.06)'
  ctx.lineWidth   = 1

  for (let x = offsetX; x < W; x += gridSize) {
    ctx.beginPath()
    ctx.moveTo(x, 0)
    ctx.lineTo(x, H)
    ctx.stroke()
  }

  for (let y = offsetY; y < H; y += gridSize) {
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(W, y)
    ctx.stroke()
  }

  ctx.restore()
}
```

---

## 🎯 Hit Test Utility

### `src/lib/hitTest.ts`

```typescript
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
    const el = elements[i]
    if (el.isDeleted) continue

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
    if (el.isDeleted) return false
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

  // Normallaşdırılmış bounding box
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
```

---

## ✅ Canvas Engine Xülasəsi

| Modul | Fayllar | Məzmun |
|-------|---------|--------|
| **Rough.js** | `roughCanvas.ts` | Rectangle, ellipse, diamond, line, arrow, freedraw, text |
| **Store** | `canvasStore.ts` | Elements, selection, tool state, history (50 addım) |
| **Hook** | `useCanvas.ts` | Mouse/keyboard events, render loop, zoom/pan |
| **Hit Test** | `hitTest.ts` | Point-in-element, lasso selection |
| **Shortcuts** | `useCanvas.ts` | V/H/R/O/D/L/A/T/P/E tool keys, Ctrl+Z/Y/A/D |

---

*Növbəti: `05_COLLABORATION.md` — Supabase Realtime, cursor sync, conflict resolution*
