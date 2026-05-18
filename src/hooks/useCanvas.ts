import {
  useRef, useEffect, useCallback
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

export function useCanvas(canvasRef: React.RefObject<HTMLCanvasElement>) {
  const store    = useCanvasStore()
  const rafRef   = useRef<number>(0)

  // ── Mouse state ───────────────────────────────────────────────────────────
  const isDrawing    = useRef(false)
  const isPanning    = useRef(false)
  const isDragging   = useRef(false)
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
  const handleMouseUp = useCallback(() => {
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
  }, [handleMouseDown, handleMouseMove, handleMouseUp, handleWheel, canvasRef])

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
