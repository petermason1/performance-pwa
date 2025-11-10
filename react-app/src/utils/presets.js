// Preset System - Global and Per-Song Presets
import Dexie from 'dexie'

export const BUILT_IN_PRESETS = [
  {
    id: 'rock-backbeat',
    name: 'Rock Backbeat',
    description: 'Accent the backbeat (2 & 4) for straight rock and pop tunes.',
    pattern: [false, true, false, true],
    timeSignature: 4,
    scope: 'global',
    type: 'accent',
    tags: ['rock', 'pop'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'none',
      soundPreset: 'click',
      countIn: 0,
      volumes: {
        accent: 0.85,
        regular: 0.45,
        subdivision: 0.3,
        master: 0.32
      }
    }
  },
  {
    id: 'jazz-swing',
    name: 'Jazz Swing',
    description: 'Beat 1 stays strong while the ride pattern fills the space.',
    pattern: [true, false, false, false],
    timeSignature: 4,
    scope: 'global',
    type: 'accent',
    tags: ['jazz', 'swing'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'triplet',
      soundPreset: 'tick',
      countIn: 2,
      volumes: {
        accent: 0.75,
        regular: 0.4,
        subdivision: 0.28,
        master: 0.3
      }
    }
  },
  {
    id: 'latin-clave-3-2',
    name: 'Latin Clave (3-2)',
    description: 'Three-side on top, two-side follow-up. Ideal for salsa intros.',
    pattern: [true, false, false, true, false, false, true, false],
    timeSignature: 8,
    scope: 'global',
    type: 'accent',
    tags: ['latin'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'sixteenth',
      soundPreset: 'wood',
      countIn: 2,
      volumes: {
        accent: 0.9,
        regular: 0.35,
        subdivision: 0.3,
        master: 0.32
      }
    }
  },
  {
    id: 'waltz-basic',
    name: 'Waltz Basic',
    description: 'Strong beat 1 with light follow-through beats (3/4).',
    pattern: [true, false, false],
    timeSignature: 3,
    scope: 'global',
    type: 'accent',
    tags: ['waltz'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'eighth',
      soundPreset: 'beep',
      countIn: 2,
      volumes: {
        accent: 0.8,
        regular: 0.5,
        subdivision: 0.25,
        master: 0.28
      }
    }
  },
  {
    id: 'march-duple',
    name: 'March Duple',
    description: 'Classic two-step march pulse.',
    pattern: [true, false],
    timeSignature: 2,
    scope: 'global',
    type: 'accent',
    tags: ['march'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'none',
      soundPreset: 'click',
      countIn: 0,
      volumes: {
        accent: 0.9,
        regular: 0.55,
        subdivision: 0.3,
        master: 0.33
      }
    }
  },
  {
    id: 'ballad-3-4',
    name: 'Ballad Waltz',
    description: 'Beat 1 strong, 2 and 3 gentle. Ideal for slow 3/4 ballads.',
    pattern: [true, false, false],
    timeSignature: 3,
    scope: 'global',
    type: 'accent',
    tags: ['ballad', 'worship'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'eighth',
      soundPreset: 'beep',
      countIn: 2,
      volumes: {
        accent: 0.8,
        regular: 0.48,
        subdivision: 0.22,
        master: 0.26
      }
    }
  },
  {
    id: 'latin-songo',
    name: 'Latin Songo',
    description: 'Accent pattern for contemporary Latin pop with dotted-eighth feel.',
    pattern: [true, false, false, true, false, true, false, false],
    timeSignature: 8,
    scope: 'global',
    type: 'accent',
    tags: ['latin', 'pop'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: {
      subdivision: 'sixteenth',
      soundPreset: 'wood',
      countIn: 2,
      volumes: {
        accent: 0.92,
        regular: 0.4,
        subdivision: 0.35,
        master: 0.32
      }
    }
  }
]

class PresetDB extends Dexie {
  constructor() {
    super('PresetsDB')

    this.version(1).stores({
      presets: 'id, scope, name, createdAt'
    })

    this.version(2).stores({
      presets: 'id, scope, songId, type, timeSignature, name, createdAt'
    }).upgrade(async (transaction) => {
      await transaction.table('presets').toCollection().modify((preset) => {
        if (!preset.type) preset.type = 'accent'
        if (!preset.scope) preset.scope = 'global'
        if (preset.scope !== 'song') {
          delete preset.songId
        }
        if (!preset.tags) preset.tags = []
        if (!preset.timeSignature && Array.isArray(preset.pattern)) {
          preset.timeSignature = preset.pattern.length
        }
      })
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

function toBooleanPattern(pattern) {
  if (!pattern || !Array.isArray(pattern)) {
    throw new Error('Preset requires an accent pattern array.')
  }
  return pattern.map((value) => value === true || value === 1)
}

function clamp(value, min, max, fallback) {
  const numeric = Number(value)
  if (Number.isFinite(numeric)) {
    return Math.min(Math.max(numeric, min), max)
  }
  return fallback
}

function normalizeSettings(settings, { patternLength, timeSignature }) {
  if (!settings) return null

  const subdivision = settings.subdivision || 'none'
  const soundPreset = settings.soundPreset || 'click'
  const countIn = clamp(settings.countIn, 0, 4, 0)
  const visualEnabled = settings.visualEnabled === false ? false : true
  const bpm = settings.bpm ? clamp(settings.bpm, 40, 300, null) : null

  const volumes = {
    accent: clamp(settings?.volumes?.accent, 0, 1, 0.8),
    regular: clamp(settings?.volumes?.regular, 0, 1, 0.5),
    subdivision: clamp(settings?.volumes?.subdivision, 0, 1, 0.3),
    master: clamp(settings?.volumes?.master, 0, 1, 0.3)
  }

  return {
    bpm,
    subdivision,
    soundPreset,
    countIn,
    visualEnabled,
    volumes,
    timeSignature: timeSignature || patternLength
  }
}

function normalizePresetInput(preset) {
  if (!preset) throw new Error('Preset payload missing.')
  if (!preset.name || typeof preset.name !== 'string') throw new Error('Preset name is required.')

  const normalizedPattern = toBooleanPattern(preset.pattern)
  const timeSignature = Number(preset.timeSignature || normalizedPattern.length)
  if (!timeSignature || Number.isNaN(timeSignature)) {
    throw new Error('Preset time signature is required.')
  }

  const scope = preset.scope === 'song' && preset.songId ? 'song' : 'global'
  const type = preset.type || 'accent'
  const settings = normalizeSettings(preset.settings, { patternLength: normalizedPattern.length, timeSignature })

  return {
    ...preset,
    pattern: normalizedPattern,
    timeSignature,
    scope,
    songId: scope === 'song' ? preset.songId : null,
    type,
    tags: Array.isArray(preset.tags) ? preset.tags : [],
    createdAt: preset.createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings
  }
}

function generatePresetId(name, scope, songId) {
  const slug = name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
  const suffix = Date.now().toString(36)
  if (scope === 'song' && songId) {
    return `${slug}-${songId}-${suffix}`
  }
  return `${slug}-${suffix}`
}

async function ensureBuiltIns() {
  const db = getPresetDB()
  await db.open()
  const existing = await db.table('presets').toArray()
  const existingIds = new Set(existing.map((preset) => preset.id))

  for (const preset of BUILT_IN_PRESETS) {
    if (!existingIds.has(preset.id)) {
      await db.table('presets').add({ ...preset })
    }
  }
}

export async function initPresets() {
  await ensureBuiltIns()
}

export async function getAllPresets() {
  await ensureBuiltIns()
  return getPresetDB().table('presets').toArray()
}

export async function listPresets(filters = {}) {
  await ensureBuiltIns()
  const { scope, songId, type, timeSignature } = filters
  const table = getPresetDB().table('presets')
  let collection = table.toCollection()

  if (scope) {
    collection = collection.filter((preset) => preset.scope === scope)
  }
  if (songId) {
    collection = collection.filter((preset) => preset.songId === songId)
  }
  if (type) {
    collection = collection.filter((preset) => preset.type === type)
  }
  if (timeSignature) {
    collection = collection.filter((preset) => Number(preset.timeSignature) === Number(timeSignature))
  }

  return collection.sortBy('name')
}

export async function getPreset(id) {
  await ensureBuiltIns()
  return getPresetDB().table('presets').get(id)
}

export async function savePreset(preset) {
  await ensureBuiltIns()
  const db = getPresetDB()
  const normalized = normalizePresetInput(preset)
  const record = {
    ...normalized,
    id: normalized.id || generatePresetId(normalized.name, normalized.scope, normalized.songId)
  }
  await db.table('presets').put(record)
  return record
}

export async function saveAccentPreset({ name, pattern, timeSignature, scope = 'global', songId, description, tags }) {
  return savePreset({
    name,
    pattern,
    timeSignature,
    scope,
    songId,
    description,
    tags,
    type: 'accent'
  })
}

export async function deletePreset(id) {
  const db = getPresetDB()
  const builtInIds = new Set(BUILT_IN_PRESETS.map((preset) => preset.id))
  if (builtInIds.has(id)) {
    throw new Error('Cannot delete built-in preset')
  }
  await db.table('presets').delete(id)
}

export async function getPresetsByScope(scope, options = {}) {
  return listPresets({ scope, ...options })
}

export async function getPresetsBySong(songId) {
  if (!songId) return []
  return listPresets({ scope: 'song', songId })
}

export async function getAccentPresets() {
  return listPresets({ type: 'accent' })
}

export async function getAccentPresetsForSignature(timeSignature, { songId, includeGlobal = true } = {}) {
  const result = []
  if (includeGlobal) {
    result.push(...await listPresets({ type: 'accent', scope: 'global', timeSignature }))
  }
  if (songId) {
    result.push(...await listPresets({ type: 'accent', scope: 'song', songId, timeSignature }))
  }
  return result
}

export async function getPolyrhythmPresets() {
  return listPresets({ type: 'polyrhythm' })
}

export function createPresetPayloadFromMetronome({
  name,
  description,
  tags,
  scope = 'global',
  songId,
  metronome,
  bpm,
  timeSignature,
  accentPattern,
  settings
}) {
  if (!name) {
    throw new Error('Preset name is required')
  }

  const pattern = accentPattern && accentPattern.length > 0
    ? accentPattern
    : new Array(timeSignature || metronome?.timeSignature || 4).fill(false)

  const payloadSettings = settings || {
    bpm: bpm ?? metronome?.bpm,
    subdivision: metronome?.subdivision,
    soundPreset: metronome?.soundEngine?.config?.preset,
    countIn: metronome?.countInBeats,
    visualEnabled: true,
    volumes: {
      accent: metronome?.soundEngine?.config?.accentVolume,
      regular: metronome?.soundEngine?.config?.regularVolume,
      subdivision: metronome?.soundEngine?.config?.subdivisionVolume,
      master: metronome?.gainNode?.gain?.value
    }
  }

  return {
    name,
    description,
    tags,
    pattern,
    scope,
    songId,
    timeSignature: timeSignature || metronome?.timeSignature || pattern.length,
    settings: payloadSettings,
    type: 'accent'
  }
}

export async function saveMetronomePresetFromState(options) {
  const payload = createPresetPayloadFromMetronome(options)
  return savePreset(payload)
}
