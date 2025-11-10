import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useSupabase } from '../context/SupabaseContext'

export function useBand() {
  const { user } = useSupabase()
  const [bands, setBands] = useState([])
  const [currentBand, setCurrentBand] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (user && supabase) {
      loadBands()
    } else {
      setLoading(false)
    }
  }, [user])

  const loadBands = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get bands where user is a member
      const { data: memberships, error: membershipsError } = await supabase
        .from('band_members')
        .select('*, bands(*)')
        .eq('user_id', user.id)

      if (membershipsError) throw membershipsError

      const userBands = memberships.map(m => m.bands)
      setBands(userBands)

      // Load last active band or first band
      const lastBandId = localStorage.getItem('currentBandId')
      const activeBand = userBands.find(b => b.id === lastBandId) || userBands[0] || null
      setCurrentBand(activeBand)

      console.log('🎸 Loaded bands:', userBands.length, 'Current:', activeBand?.name)
    } catch (err) {
      console.error('❌ Failed to load bands:', err)
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const createBand = async (name) => {
    if (!user || !supabase) {
      return { success: false, error: 'Not authenticated' }
    }

    try {
      const { data, error } = await supabase
        .from('bands')
        .insert({ 
          name, 
          created_by: user.id 
        })
        .select()
        .single()

      if (error) throw error

      console.log('✅ Band created:', data.name)
      
      // Reload bands to include the new one (with auto-added membership)
      await loadBands()
      
      // Auto-select the new band
      switchBand(data)

      return { success: true, band: data }
    } catch (err) {
      console.error('❌ Failed to create band:', err)
      return { success: false, error: err.message }
    }
  }

  const switchBand = (band) => {
    setCurrentBand(band)
    localStorage.setItem('currentBandId', band.id)
    console.log('🔄 Switched to band:', band.name)
  }

  const inviteMember = async (bandId, email) => {
    try {
      const normalizedEmail = email.toLowerCase().trim()
      
      // Try using the database function first (if it exists)
      const { data, error } = await supabase
        .rpc('invite_band_member', {
          p_band_id: bandId,
          p_email: normalizedEmail
        })

      // If function doesn't exist (404), provide helpful error
      if (error) {
        if (error.code === 'PGRST202' || error.message?.includes('schema cache')) {
          return { 
            success: false, 
            error: 'Database function not found. Please run the SQL in docs/supabase/009_invite_member_function.sql in Supabase SQL Editor, then wait 10 seconds and try again.' 
          }
        }
        throw error
      }

      if (data && !data.success) {
        return { success: false, error: data.error || 'Failed to invite member' }
      }

      console.log('✅ Member invited:', normalizedEmail)
      
      // Reload bands to refresh member list
      await loadBands()
      
      return { success: true }
    } catch (err) {
      console.error('❌ Failed to invite member:', err)
      return { success: false, error: err.message || 'Failed to invite member. Make sure they have signed up.' }
    }
  }

  const getBandMembers = async (bandId) => {
    try {
      const { data, error } = await supabase
        .from('band_members')
        .select('*, users(email, display_name, instrument)')
        .eq('band_id', bandId)

      if (error) throw error

      return { success: true, members: data }
    } catch (err) {
      console.error('❌ Failed to get band members:', err)
      return { success: false, error: err.message }
    }
  }

  return {
    bands,
    currentBand,
    loading,
    error,
    createBand,
    switchBand,
    inviteMember,
    getBandMembers,
    reloadBands: loadBands
  }
}

