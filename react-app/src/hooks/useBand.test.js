// Tests for useBand hook
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, waitFor } from '@testing-library/react'
import { useBand } from './useBand'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../context/SupabaseContext'

// Mock dependencies
vi.mock('../lib/supabase', () => ({
  supabase: {
    from: vi.fn()
  }
}))

vi.mock('../context/SupabaseContext', () => ({
  useSupabase: vi.fn(() => ({
    user: {
      id: 'user-123',
      email: 'test@example.com'
    }
  }))
}))

describe('useBand', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('createBand', () => {
    it('should create a band successfully', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: { id: 'band-123', name: 'Test Band', created_by: 'user-123' },
            error: null
          })
        })
      })

      supabase.from = vi.fn((table) => {
        if (table === 'bands') {
          return { insert: mockInsert }
        }
        return { select: vi.fn() }
      })

      const { result } = renderHook(() => useBand())

      await waitFor(() => {
        expect(result.current.createBand).toBeDefined()
      })

      const response = await result.current.createBand('Test Band')

      expect(response.success).toBe(true)
      expect(response.band.name).toBe('Test Band')
    })

    it('should handle errors when creating a band', async () => {
      const mockInsert = vi.fn().mockReturnValue({
        select: vi.fn().mockReturnValue({
          single: vi.fn().mockResolvedValue({
            data: null,
            error: { message: 'Failed to create band' }
          })
        })
      })

      supabase.from = vi.fn((table) => {
        if (table === 'bands') {
          return { insert: mockInsert }
        }
        return { select: vi.fn() }
      })

      const { result } = renderHook(() => useBand())

      await waitFor(() => {
        expect(result.current.createBand).toBeDefined()
      })

      const response = await result.current.createBand('Test Band')

      expect(response.success).toBe(false)
      expect(response.error).toBe('Failed to create band')
    })
  })

  describe('inviteMember', () => {
    it('should invite a member successfully', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { success: true, message: 'Member added successfully' },
        error: null
      })

      supabase.rpc = mockRpc

      const { result } = renderHook(() => useBand())

      await waitFor(() => {
        expect(result.current.inviteMember).toBeDefined()
      })

      const response = await result.current.inviteMember('band-123', 'member@example.com')

      expect(response.success).toBe(true)
      expect(mockRpc).toHaveBeenCalledWith('invite_band_member', {
        p_band_id: 'band-123',
        p_email: 'member@example.com'
      })
    })

    it('should handle user not found error', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: { success: false, error: 'User not found with that email' },
        error: null
      })

      supabase.rpc = mockRpc

      const { result } = renderHook(() => useBand())

      await waitFor(() => {
        expect(result.current.inviteMember).toBeDefined()
      })

      const response = await result.current.inviteMember('band-123', 'nonexistent@example.com')

      expect(response.success).toBe(false)
      expect(response.error).toBe('User not found with that email')
    })

    it('should handle function not found error', async () => {
      const mockRpc = vi.fn().mockResolvedValue({
        data: null,
        error: { code: 'PGRST202', message: 'Could not find the function' }
      })

      supabase.rpc = mockRpc

      const { result } = renderHook(() => useBand())

      await waitFor(() => {
        expect(result.current.inviteMember).toBeDefined()
      })

      const response = await result.current.inviteMember('band-123', 'member@example.com')

      expect(response.success).toBe(false)
      expect(response.error).toContain('Database function not found')
    })
  })

  describe('switchBand', () => {
    it('should switch to a different band', () => {
      const { result } = renderHook(() => useBand())

      const band = { id: 'band-123', name: 'Test Band' }
      result.current.switchBand(band)

      expect(result.current.currentBand).toEqual(band)
      expect(localStorage.getItem('currentBandId')).toBe('band-123')
    })
  })
})

