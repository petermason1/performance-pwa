import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import SongModal from './SongModal'
import { AppProvider } from '../AppContext'
import { useApp } from '../hooks/useApp'

// Mock formatLyrics since it's used in the component
vi.mock('../models.js', async () => {
  const actual = await vi.importActual('../models.js')
  return {
    ...actual,
    formatLyrics: (lyrics) => {
      if (!lyrics || lyrics.length === 0) return ''
      return lyrics.map(l => {
        const minutes = Math.floor(l.time / 60)
        const seconds = Math.floor(l.time % 60)
        const centiseconds = Math.floor((l.time % 1) * 100)
        return `[${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}] ${l.text}`
      }).join('\n')
    }
  }
})

const renderWithProvider = (component) => {
  return render(<AppProvider>{component}</AppProvider>)
}

describe('SongModal', () => {
  const mockOnClose = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  it('should render new song form when song is null', () => {
    renderWithProvider(<SongModal song={null} onClose={mockOnClose} />)
    
    expect(screen.getByText('New Song')).toBeInTheDocument()
    expect(screen.getByLabelText(/song name/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/bpm/i)).toBeInTheDocument()
  })

  it('should render edit form when song is provided', () => {
    const song = {
      id: '1',
      name: 'Test Song',
      artist: 'Test Artist',
      bpm: 120,
      timeSignature: 4
    }
    
    renderWithProvider(<SongModal song={song} onClose={mockOnClose} />)
    
    expect(screen.getByText('Edit Song')).toBeInTheDocument()
    expect(screen.getByDisplayValue('Test Song')).toBeInTheDocument()
    expect(screen.getByDisplayValue('120')).toBeInTheDocument()
  })

  it('should call onClose when close button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<SongModal song={null} onClose={mockOnClose} />)
    
    const closeButton = screen.getByText('×')
    await user.click(closeButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should call onClose when cancel button is clicked', async () => {
    const user = userEvent.setup()
    renderWithProvider(<SongModal song={null} onClose={mockOnClose} />)
    
    const cancelButton = screen.getByRole('button', { name: /cancel/i })
    await user.click(cancelButton)
    expect(mockOnClose).toHaveBeenCalled()
  })

  it('should save a new song when form is submitted', async () => {
    const user = userEvent.setup()
    renderWithProvider(<SongModal song={null} onClose={mockOnClose} />)
    
    await user.type(screen.getByLabelText(/song name/i), 'Test Song')
    await user.clear(screen.getByLabelText(/bpm/i))
    await user.type(screen.getByLabelText(/bpm/i), '140')
    
    const submitButton = screen.getByRole('button', { name: /save/i })
    await user.click(submitButton)
    
    // Form submission should call onClose
    expect(mockOnClose).toHaveBeenCalled()
  })
})

