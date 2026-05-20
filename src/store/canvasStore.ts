import { create } from 'zustand'
import { devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'
import { nanoid } from 'nanoid'
import type {
  CanvasElement,
  AppState,
  ToolType,
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
  fontWeight:    number

  // ── App state ─────────────────────────────────────────────────────────────
  appState:      AppState

  // ── History ───────────────────────────────────────────────────────────────
  undoStack:     CanvasElement[][]
  redoStack:     CanvasElement[][]

  // ── UI ────────────────────────────────────────────────────────────────────
  changeCounter: number     // Hər mutasiyada artır — autosave dinləyir
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
  selectElements:   (ids: string[]) => void
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
  setFontSize:      (size: number) => void
  setFontWeight:    (weight: number) => void

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

export function getGroupBoundingBox(elements: CanvasElement[], selectedIds: Set<string>) {
  const selected = elements.filter(el => selectedIds.has(el.id) && !el.isDeleted)
  if (selected.length === 0) return null

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity
  for (const el of selected) {
    minX = Math.min(minX, el.x)
    minY = Math.min(minY, el.y)
    maxX = Math.max(maxX, el.x + Math.abs(el.width))
    maxY = Math.max(maxY, el.y + Math.abs(el.height))
  }
  return { x: minX, y: minY, width: maxX - minX, height: maxY - minY }
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
        fontWeight:  400,

        appState:      { ...DEFAULT_APP_STATE },
        undoStack:     [[]],
        redoStack:     [],
        changeCounter: 0,
        isDirty:       false,
        isReadOnly:    false,

        // ── Element actions ──────────────────────────────────────────────────
        addElement: (el) => set((state) => {
          state.elements.push(el)
          state.isDirty = true
          state.changeCounter++
        }),

        updateElement: (id, updates) => set((state) => {
          const idx = state.elements.findIndex(e => e.id === id)
          if (idx !== -1) {
            Object.assign(state.elements[idx] as any, updates)
            state.isDirty = true
          state.changeCounter++
          }
        }),

        updateElements: (ids, updates) => set((state) => {
          state.elements.forEach(el => {
            if (ids.includes(el.id)) Object.assign(el, updates)
          })
          state.isDirty = true
          state.changeCounter++
        }),

        deleteElements: (ids) => set((state) => {
          state.elements = state.elements.filter(e => !ids.includes(e.id))
          ids.forEach(id => state.selectedIds.delete(id))
          state.isDirty = true
          state.changeCounter++
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
          state.changeCounter++
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

        selectElements: (ids) => set((state) => {
          ids.forEach(id => state.selectedIds.add(id))
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
        setFontSize:    (size)      => set((s) => { s.fontSize    = size     }),
        setFontWeight:  (weight)    => set((s) => { s.fontWeight  = weight   }),

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

          const canvas = document.getElementById('main-canvas')
          const rect = canvas ? canvas.getBoundingClientRect() : null
          const W = rect ? rect.width : window.innerWidth
          const H = rect ? rect.height : window.innerHeight
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
          s.elements     = s.undoStack[s.undoStack.length - 1] ?? []
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
