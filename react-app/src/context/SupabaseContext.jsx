import { createContext, useContext, useEffect, useState } from 'react'
import { supabase, isSupabaseAvailable } from '../lib/supabase'

const SupabaseContext = createContext({})

export function SupabaseProvider({ children }) {
  const [session, setSession] = useState(null)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isOnline, setIsOnline] = useState(isSupabaseAvailable())

  useEffect(() => {
    if (!supabase) {
      console.log('📴 Supabase not configured - running in offline mode')
      setLoading(false)
      return
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ?? null)
      setLoading(false)
      console.log('👤 User session:', session ? 'logged in' : 'logged out')
    })

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        console.log('🔐 Auth event:', event)
        setSession(session)
        setUser(session?.user ?? null)
      }
    )

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email, password, displayName) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') }
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName
        }
      }
    })
    
    if (error) {
      console.error('❌ Sign up error:', error)
    } else {
      console.log('✅ Sign up successful:', data)
    }
    
    return { data, error }
  }

  const signIn = async (email, password) => {
    if (!supabase) {
      return { data: null, error: new Error('Supabase not configured') }
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    })
    
    if (error) {
      console.error('❌ Sign in error:', error)
    } else {
      console.log('✅ Sign in successful:', data)
    }
    
    return { data, error }
  }

  const signOut = async () => {
    if (!supabase) {
      return { error: new Error('Supabase not configured') }
    }

    const { error } = await supabase.auth.signOut()
    
    if (error) {
      console.error('❌ Sign out error:', error)
    } else {
      console.log('✅ Signed out')
    }
    
    return { error }
  }

  const value = {
    session,
    user,
    loading,
    isOnline,
    signUp,
    signIn,
    signOut,
    supabase
  }

  return (
    <SupabaseContext.Provider value={value}>
      {children}
    </SupabaseContext.Provider>
  )
}

export const useSupabase = () => {
  const context = useContext(SupabaseContext)
  if (!context) {
    throw new Error('useSupabase must be used within SupabaseProvider')
  }
  return context
}

