// Preset Names Utility - Store and retrieve custom names for Helix presets (0-127)

const STORAGE_KEY = 'helixPresetNames'

/**
 * Get all preset names from storage
 * @returns {Object} Map of preset number to name, e.g. { "0": "Acoustic", "23": "Sweet Child Lead" }
 */
export function getPresetNames() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return {}
    const parsed = JSON.parse(stored)
    // Validate structure
    if (typeof parsed !== 'object' || parsed === null) return {}
    return parsed
  } catch (error) {
    console.error('Error loading preset names:', error)
    return {}
  }
}

/**
 * Get name for a specific preset number
 * @param {number} presetNumber - Preset number (0-127)
 * @returns {string|null} Preset name or null if not set
 */
export function getPresetName(presetNumber) {
  if (presetNumber === null || presetNumber === undefined) return null
  const names = getPresetNames()
  return names[String(presetNumber)] || null
}

/**
 * Set name for a preset number
 * @param {number} presetNumber - Preset number (0-127)
 * @param {string} name - Custom name for the preset
 */
export function setPresetName(presetNumber, name) {
  if (presetNumber < 0 || presetNumber > 127) {
    throw new Error('Preset number must be between 0 and 127')
  }
  
  const names = getPresetNames()
  if (name && name.trim()) {
    names[String(presetNumber)] = name.trim()
  } else {
    // Remove if empty
    delete names[String(presetNumber)]
  }
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  } catch (error) {
    console.error('Error saving preset names:', error)
    throw error
  }
}

/**
 * Set multiple preset names at once
 * @param {Object} namesMap - Object mapping preset numbers to names
 */
export function setPresetNames(namesMap) {
  const current = getPresetNames()
  const updated = { ...current }
  
  Object.entries(namesMap).forEach(([presetNumber, name]) => {
    const num = Number.parseInt(presetNumber, 10)
    if (num >= 0 && num <= 127) {
      if (name && name.trim()) {
        updated[String(presetNumber)] = name.trim()
      } else {
        delete updated[String(presetNumber)]
      }
    }
  })
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch (error) {
    console.error('Error saving preset names:', error)
    throw error
  }
}

/**
 * Delete a preset name
 * @param {number} presetNumber - Preset number to delete
 */
export function deletePresetName(presetNumber) {
  const names = getPresetNames()
  delete names[String(presetNumber)]
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(names))
  } catch (error) {
    console.error('Error deleting preset name:', error)
    throw error
  }
}

/**
 * Get formatted display string for a preset (number + name if available)
 * @param {number} presetNumber - Preset number
 * @returns {string} Display string like "23" or "23 - Sweet Child Lead"
 */
export function getPresetDisplay(presetNumber) {
  if (presetNumber === null || presetNumber === undefined) return ''
  const name = getPresetName(presetNumber)
  return name ? `${presetNumber} - ${name}` : String(presetNumber)
}

/**
 * Clear all preset names
 */
export function clearPresetNames() {
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch (error) {
    console.error('Error clearing preset names:', error)
    throw error
  }
}

