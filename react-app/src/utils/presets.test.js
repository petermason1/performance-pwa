import { describe, it, expect, beforeEach } from 'vitest'
import { savePreset, getPreset, getAllPresets, deletePreset, getAccentPresetsForSignature } from './presets'

describe('Presets utility functions', () => {
  beforeEach(async () => {
    // Clean up database before each test
    const { initPresets } = await import('./presets')
    await initPresets()
  })

  describe('savePreset', () => {
    it('should save a new preset', async () => {
      const preset = {
        id: 'test-preset-1',
        name: 'Test Preset',
        scope: 'global',
        timeSignature: 4,
        pattern: [true, false, true, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await savePreset(preset)
      const saved = await getPreset('test-preset-1')

      expect(saved).toBeDefined()
      expect(saved.name).toBe('Test Preset')
      expect(saved.pattern).toEqual([true, false, true, false])
    })

    it('should update an existing preset', async () => {
      const preset = {
        id: 'test-preset-2',
        name: 'Original Name',
        scope: 'global',
        timeSignature: 4,
        pattern: [true, false, false, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await savePreset(preset)

      const updated = {
        ...preset,
        name: 'Updated Name',
        updatedAt: new Date().toISOString()
      }

      await savePreset(updated)
      const saved = await getPreset('test-preset-2')

      expect(saved.name).toBe('Updated Name')
    })
  })

  describe('getAllPresets', () => {
    it('should return all saved presets', async () => {
      const preset1 = {
        id: 'preset-1',
        name: 'Preset 1',
        scope: 'global',
        timeSignature: 4,
        pattern: [true, false, false, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const preset2 = {
        id: 'preset-2',
        name: 'Preset 2',
        scope: 'global',
        timeSignature: 3,
        pattern: [true, false, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await savePreset(preset1)
      await savePreset(preset2)

      const allPresets = await getAllPresets()

      // Should include built-in presets plus our custom ones
      expect(allPresets.length).toBeGreaterThanOrEqual(2)
      const customPresets = allPresets.filter(p => p.id === 'preset-1' || p.id === 'preset-2')
      expect(customPresets).toHaveLength(2)
    })
  })

  describe('deletePreset', () => {
    it('should delete a preset by ID', async () => {
      const preset = {
        id: 'test-delete',
        name: 'Delete Me',
        scope: 'global',
        timeSignature: 4,
        pattern: [true, false, true, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await savePreset(preset)
      let saved = await getPreset('test-delete')
      expect(saved).toBeDefined()

      await deletePreset('test-delete')
      saved = await getPreset('test-delete')
      expect(saved).toBeUndefined()
    })
  })

  describe('getAccentPresetsForSignature', () => {
    it('should return presets matching the time signature', async () => {
      const preset4_4 = {
        id: 'preset-4-4',
        name: '4/4 Preset',
        scope: 'global',
        timeSignature: 4,
        pattern: [true, false, true, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      const preset3_4 = {
        id: 'preset-3-4',
        name: '3/4 Preset',
        scope: 'global',
        timeSignature: 3,
        pattern: [true, false, false],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      await savePreset(preset4_4)
      await savePreset(preset3_4)

      const presets4 = await getAccentPresetsForSignature(4)
      const presets3 = await getAccentPresetsForSignature(3)

      const custom4 = presets4.find(p => p.id === 'preset-4-4')
      const custom3 = presets3.find(p => p.id === 'preset-3-4')

      expect(custom4).toBeDefined()
      expect(custom4.timeSignature).toBe(4)
      expect(custom3).toBeDefined()
      expect(custom3.timeSignature).toBe(3)
    })

    it('should include built-in presets', async () => {
      const presets = await getAccentPresetsForSignature(4)
      
      // Should have built-in presets like 'rock-backbeat', 'waltz', etc.
      expect(presets.length).toBeGreaterThan(0)
      const builtIn = presets.find(p => p.id === 'rock-backbeat')
      expect(builtIn).toBeDefined()
    })
  })
})

