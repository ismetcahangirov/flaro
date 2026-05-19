import React, { useEffect, useRef, useLayoutEffect } from 'react'
import { useCanvasStore } from '@/store/canvasStore'

const FONT_FAMILIES: Record<string, string> = {
  hand:   'Caveat, cursive',
  normal: 'Inter, sans-serif',
  code:   'JetBrains Mono, monospace',
}

// Canvas-da mətni ölçür
const measureText = (
  text:       string,
  fontSize:   number,
  fontFamily: string
): { width: number; height: number } => {
  const lines = text.split('\n')
  const lineH = fontSize * 1.4
  const height = lines.length * lineH

  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')
  let maxWidth = 0
  if (ctx) {
    ctx.font = `${fontSize}px ${FONT_FAMILIES[fontFamily] ?? FONT_FAMILIES.hand}`
    for (const line of lines) {
      const w = ctx.measureText(line || ' ').width
      if (w > maxWidth) maxWidth = w
    }
  }
  return {
    width:  Math.max(maxWidth + 4, 20),   // 4px sağ boşluq — kəsilməsin
    height: Math.max(height, lineH),
  }
}

export function TextEditor() {
  const store = useCanvasStore()
  const { elements, editingId, updateElement, deleteElements, setEditingId, saveHistory, appState } = store

  const textareaRef    = useRef<HTMLTextAreaElement>(null)
  const anchorXRef     = useRef<number | null>(null)
  const anchorYRef     = useRef<number | null>(null)
  const isFinishingRef = useRef(false)   // blur loop-unun qarşısını alır

  const editingEl = elements.find(el => el.id === editingId)

  // Düzəliş başlayanda anchor nöqtəsini kilit
  useEffect(() => {
    if (!editingEl) {
      anchorXRef.current = null
      anchorYRef.current = null
      return
    }
    const align = editingEl.textAlign ?? 'left'
    const w     = editingEl.width ?? 0
    if (align === 'center') {
      anchorXRef.current = editingEl.x + w / 2
    } else if (align === 'right') {
      anchorXRef.current = editingEl.x + w
    } else {
      anchorXRef.current = editingEl.x
    }
    anchorYRef.current = editingEl.y
    isFinishingRef.current = false
  }, [editingId]) // yalnız editingId dəyişdikdə

  // Textarea-ya fokus ver (layout-dan sonra, daha etibarlıdır)
  useLayoutEffect(() => {
    if (!editingId) return
    const ta = textareaRef.current
    if (!ta) return
    ta.focus()
    const len = ta.value.length
    ta.setSelectionRange(len, len)
  }, [editingId])

  if (!editingEl || editingEl.type !== 'text') return null

  // ── Hesablamalar ─────────────────────────────────────────────────────────
  const { zoom, scrollX, scrollY } = appState
  const fontSize   = editingEl.fontSize   ?? 20
  const fontFamily = editingEl.fontFamily ?? 'hand'
  const color      = editingEl.strokeColor ?? '#1e1e1e'
  const opacity    = (editingEl.opacity ?? 100) / 100

  // Textarea solunun ekran koordinatı
  const screenLeft = editingEl.x * zoom + scrollX
  const screenTop  = editingEl.y * zoom + scrollY

  // Geniş minimum en ki kursor görünsün
  const minW = Math.max(editingEl.width * zoom, 2)
  // Ən azı bir sətir hündürlüyü
  const minH = Math.ceil(fontSize * 1.4 * zoom)

  // ── onChange ─────────────────────────────────────────────────────────────
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val      = e.target.value
    const measured = measureText(val, fontSize, fontFamily)

    let newX = editingEl.x
    const align = editingEl.textAlign ?? 'left'
    if (anchorXRef.current !== null) {
      if (align === 'center') {
        newX = anchorXRef.current - measured.width / 2
      } else if (align === 'right') {
        newX = anchorXRef.current - measured.width
      } else {
        newX = anchorXRef.current
      }
    }

    const newY = anchorYRef.current !== null ? anchorYRef.current : editingEl.y

    updateElement(editingEl.id, {
      text:   val,
      x:      newX,
      y:      newY,
      width:  measured.width,
      height: measured.height,
    })
  }

  // ── Klaviatura ──────────────────────────────────────────────────────────
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    e.stopPropagation()   // canvas shortcut-ları işə düşməsin

    if (e.key === 'Escape') {
      e.preventDefault()
      finish()
      return
    }
    // Ctrl+Enter — tamamla
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      e.preventDefault()
      finish()
    }
  }

  // ── Finish ───────────────────────────────────────────────────────────────
  const finish = () => {
    if (isFinishingRef.current) return
    isFinishingRef.current = true

    const val = textareaRef.current?.value ?? editingEl.text ?? ''
    if (!val.trim()) {
      // Boş qaldısa elementi sil
      saveHistory()
      deleteElements([editingEl.id])
    }
    setEditingId(null)
  }

  const handleBlur = () => {
    // Blur-u qısa gecikdiririk — başqa textarea-ya fokus keçidsə (nadir hal)
    // yanlış finish çağırılmasın
    requestAnimationFrame(() => {
      if (isFinishingRef.current) return
      finish()
    })
  }

  // ── Style ────────────────────────────────────────────────────────────────
  const style: React.CSSProperties = {
    position:       'absolute',
    left:           `${screenLeft}px`,
    top:            `${screenTop}px`,
    minWidth:       `${minW}px`,
    minHeight:      `${minH}px`,
    width:          'auto',       // məzmuna görə böyüyür
    height:         'auto',
    fontSize:       `${fontSize * zoom}px`,
    fontFamily:     FONT_FAMILIES[fontFamily] ?? FONT_FAMILIES.hand,
    color,
    opacity,
    background:     'transparent',
    border:         'none',
    outline:        'none',
    resize:         'none',
    overflow:       'visible',    // kəsilməsin!
    whiteSpace:     'pre',        // \n-lər saxlanılsın
    lineHeight:     1.4,
    margin:         0,
    padding:        0,
    zIndex:         200,
    textAlign:      (editingEl.textAlign ?? 'left') as CanvasTextAlign,
    caretColor:     color,        // kursor görünsün
    boxSizing:      'content-box',
    wordBreak:      'keep-all',
    userSelect:     'text',
    pointerEvents:  'auto',
  }

  return (
    <textarea
      ref={textareaRef}
      style={style}
      value={editingEl.text ?? ''}
      onChange={handleChange}
      onKeyDown={handleKeyDown}
      onBlur={handleBlur}
      autoFocus
      spellCheck={false}
      autoComplete="off"
      autoCorrect="off"
      rows={1}
    />
  )
}
