// Tests for BandModal component
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import BandModal from './BandModal'
import { useBand } from '../../hooks/useBand'

// Mock the useBand hook
vi.mock('../../hooks/useBand', () => ({
  useBand: vi.fn()
}))

describe('BandModal', () => {
  const mockUseBand = {
    bands: [
      { id: 'band-1', name: 'Band 1' },
      { id: 'band-2', name: 'Band 2' }
    ],
    currentBand: { id: 'band-1', name: 'Band 1' },
    createBand: vi.fn().mockResolvedValue({ success: true }),
    switchBand: vi.fn(),
    inviteMember: vi.fn().mockResolvedValue({ success: true }),
    getBandMembers: vi.fn().mockResolvedValue({
      success: true,
      members: [
        {
          id: 'member-1',
          role: 'owner',
          users: { email: 'owner@example.com', display_name: 'Owner' }
        }
      ]
    })
  }

  beforeEach(() => {
    vi.clearAllMocks()
    useBand.mockReturnValue(mockUseBand)
  })

  it('should render band selection mode by default', () => {
    render(<BandModal onClose={vi.fn()} />)

    expect(screen.getByText('Your Bands')).toBeInTheDocument()
    expect(screen.getByText('Band 1')).toBeInTheDocument()
    expect(screen.getByText('Band 2')).toBeInTheDocument()
  })

  it('should show create band form when clicking "New Band"', async () => {
    const user = userEvent.setup()
    render(<BandModal onClose={vi.fn()} />)

    const newBandButton = screen.getByText('+ New Band')
    await user.click(newBandButton)

    expect(screen.getByText('Create New Band')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('The Rockers')).toBeInTheDocument()
  })

  it('should show invite form when clicking "Invite Member"', async () => {
    const user = userEvent.setup()
    render(<BandModal onClose={vi.fn()} />)

    const inviteButton = screen.getByText('Invite Member')
    await user.click(inviteButton)

    expect(screen.getByText(/Invite to Band 1/)).toBeInTheDocument()
    expect(screen.getByPlaceholderText('bandmate@example.com')).toBeInTheDocument()
  })

  it('should create a band successfully', async () => {
    const user = userEvent.setup()
    const onClose = vi.fn()
    render(<BandModal onClose={onClose} />)

    // Navigate to create mode
    await user.click(screen.getByText('+ New Band'))

    // Fill in form
    const input = screen.getByPlaceholderText('The Rockers')
    await user.type(input, 'New Band Name')

    // Submit
    const submitButton = screen.getByText('Create Band')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseBand.createBand).toHaveBeenCalledWith('New Band Name')
    })
  })

  it('should invite a member successfully', async () => {
    const user = userEvent.setup()
    render(<BandModal onClose={vi.fn()} />)

    // Navigate to invite mode
    await user.click(screen.getByText('Invite Member'))

    // Fill in email
    const emailInput = screen.getByPlaceholderText('bandmate@example.com')
    await user.type(emailInput, 'newmember@example.com')

    // Submit
    const submitButton = screen.getByText('Send Invite')
    await user.click(submitButton)

    await waitFor(() => {
      expect(mockUseBand.inviteMember).toHaveBeenCalledWith('band-1', 'newmember@example.com')
    })
  })

  it('should show error message when invite fails', async () => {
    const user = userEvent.setup()
    mockUseBand.inviteMember.mockResolvedValueOnce({
      success: false,
      error: 'User not found'
    })

    render(<BandModal onClose={vi.fn()} />)

    await user.click(screen.getByText('Invite Member'))
    await user.type(screen.getByPlaceholderText('bandmate@example.com'), 'bad@email.com')
    await user.click(screen.getByText('Send Invite'))

    await waitFor(() => {
      expect(screen.getByText('User not found')).toBeInTheDocument()
    })
  })

  it('should show success message when invite succeeds', async () => {
    const user = userEvent.setup()
    render(<BandModal onClose={vi.fn()} />)

    await user.click(screen.getByText('Invite Member'))
    await user.type(screen.getByPlaceholderText('bandmate@example.com'), 'member@example.com')
    await user.click(screen.getByText('Send Invite'))

    await waitFor(() => {
      expect(screen.getByText(/has been added to Band 1/)).toBeInTheDocument()
    })
  })
})

