// Preset System - Global and Per-Song Presets
import Dexie from 'dexie'

// Built-in global presets
export const BUILT_IN_PRESETS = [
  {
    id: 'rock-backbeat',
    name: 'Rock Backbeat',
    description: 'Accent on beats 2 and 4 - classic rock pattern',
    pattern: [false, true, false, true],
    timeSignature: 4,
    scope: 'global',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    description: 'Accent on beat 1 - swing feel',
    pattern: [true, false, false, false],
    timeSignature: 4,
    scope: 'global',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'latin-clave',
    name: 'Latin Clave (3-2)',
    description: 'Classic 3-2 clave pattern',
    pattern: [true, false, false, true, false, false, true, false],
    timeSignature: 8,
    scope: 'global',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'waltz',
    name: 'Waltz',
    description: 'Accent on beat 1 - 3/4 time',
    pattern: [true, false, false],
    timeSignature: 3,
    scope: 'global',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'march',
    name: 'March',
    description: 'Strong accent on beat 1',
    pattern: [true, false],
    timeSignature: 2,
    scope: 'global',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
]

// Preset database using Dexie
class PresetDB extends Dexie {
  constructor() {
    super('PresetsDB')
    this.version(1).stores({
      presets: 'id, scope, name, createdAt'
    })
  }
}

let presetDBInstance = null

function getPresetDB() {
  if (!presetDBInstance) {
    presetDBInstance = new PresetDB()
  }
  return presetDBInstance
}

// Initialize with built-in presets
export async function initPresets() {
  const db = getPresetDB()
  const existing = await db.presets.toArray()
  const existingIds = new Set(existing.map(p => p.id))
  
  // Add built-in presets that don't exist
  for (const preset of BUILT_IN_PRESETS) {
    if (!existingIds.has(preset.id)) {
      await db.presets.add(preset)
    }
  }
}

export async function getAllPresets() {
  await initPresets()
  const db = getPresetDB()
  return db.presets.toArray()
}

export async function getPreset(id) {
  await initPresets()
  const db = getPresetDB()
  return db.presets.get(id)
}

export async function savePreset(preset) {
  await initPresets()
  const db = getPresetDB()
  const presetWithDates = {
    ...preset,
    updatedAt: new Date().toISOString(),
    createdAt: preset.createdAt || new Date().toISOString()
  }
  await db.presets.put(presetWithDates)
}

export async function deletePreset(id) {
  const db = getPresetDB()
  // Don't delete built-in presets
  const builtInIds = new Set(BUILT_IN_PRESETS.map(p => p.id))
  if (builtInIds.has(id)) {
    throw new Error('Cannot delete built-in preset')
  }
  await db.presets.delete(id)
}

export async function getPresetsByScope(scope) {
  await initPresets()
  const db = getPresetDB()
  return db.presets.where('scope').equals(scope).toArray()
}

export async function getAccentPresets() {
  const all = await getAllPresets()
  return all.filter((p) => 
    p.pattern && Array.isArray(p.pattern) && typeof p.pattern[0] === 'boolean'
  )
}

export async function getPolyrhythmPresets() {
  const all = await getAllPresets()
  return all.filter((p) => p.patternName)
}
