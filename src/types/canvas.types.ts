// ============================================================
// src/types/canvas.types.ts
// Flaro — Canvas Element TypeScript Tipləri
// ============================================================

import type { ElementType } from './database.types'

export type ToolType =
  | 'select' | 'hand' | 'rectangle' | 'ellipse'
  | 'diamond' | 'line' | 'arrow' | 'text'
  | 'image' | 'freedraw' | 'eraser'

export type FillStyle   = 'solid' | 'hachure' | 'cross-hatch' | 'none'
export type StrokeStyle = 'solid' | 'dashed' | 'dotted'
export type TextAlign   = 'left' | 'center' | 'right'
export type FontFamily  = 'hand' | 'normal' | 'code'

export interface Point {
  x: number
  y: number
}

export interface BoundingBox {
  x:      number
  y:      number
  width:  number
  height: number
}

export interface CanvasElement {
  id:          string
  type:        ElementType
  x:           number
  y:           number
  width:       number
  height:      number
  angle:       number           // Dönmə bucağı (radian)
  strokeColor: string
  fillColor:   string
  fillStyle:   FillStyle
  strokeWidth: number
  strokeStyle: StrokeStyle
  opacity:     number           // 0-100
  roughness:   number           // 0-3 (el çizimi səviyyəsi)
  seed:        number           // Rough.js üçün sabit seed
  version:     number
  isDeleted:   boolean

  // Text spesifik
  text?:       string
  fontSize?:   number
  fontFamily?: FontFamily
  textAlign?:  TextAlign

  // Arrow/Line spesifik
  points?:          Point[]
  startArrowhead?: 'arrow' | 'dot' | 'bar' | null
  endArrowhead?:   'arrow' | 'dot' | 'bar' | null

  // Image spesifik
  fileId?:     string
}

export interface AppState {
  zoom:            number
  scrollX:         number
  scrollY:         number
  backgroundColor: string
  gridEnabled:     boolean
  gridSize:        number
  theme:           'light' | 'dark'
}

export interface SceneData {
  elements: CanvasElement[]
  appState: AppState
}

// ── Default dəyərlər ──────────────────────────────────────────

export const DEFAULT_APP_STATE: AppState = {
  zoom:            1,
  scrollX:         0,
  scrollY:         0,
  backgroundColor: '#ffffff',
  gridEnabled:     false,
  gridSize:        20,
  theme:           'light',
}

export const DEFAULT_ELEMENT_STYLE = {
  strokeColor: '#1e1e1e',
  fillColor:   'transparent',
  fillStyle:   'hachure' as FillStyle,
  strokeWidth: 2,
  strokeStyle: 'solid' as StrokeStyle,
  opacity:     100,
  roughness:   1,
} as const
