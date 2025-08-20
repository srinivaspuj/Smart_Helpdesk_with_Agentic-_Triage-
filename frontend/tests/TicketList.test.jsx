import { render, screen, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import TicketList from '../src/pages/TicketList'
import { AuthProvider } from '../src/contexts/AuthContext'
import * as client from '../src/api/client'

// Mock the API client
vi.mock('../src/api/client', () => ({
  tickets: {
    getAll: vi.fn()
  }
}))

const mockUser = {
  id: '1',
  name: 'Test User',
  email: 'test@example.com',
  role: 'user'
}

const mockTickets = [
  {
    _id: '1',
    title: 'Test Ticket 1',
    description: 'Test description 1',
    status: 'open',
    category: 'billing',
    createdBy: { name: 'Test User' },
    createdAt: '2024-01-01T00:00:00Z'
  },
  {
    _id: '2',
    title: 'Test Ticket 2',
    description: 'Test description 2',
    status: 'resolved',
    category: 'tech',
    createdBy: { name: 'Test User' },
    createdAt: '2024-01-02T00:00:00Z'
  }
]

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <AuthProvider>
        {component}
      </AuthProvider>
    </BrowserRouter>
  )
}

describe('TicketList', () => {
  beforeEach(() => {
    // Mock localStorage
    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn(() => JSON.stringify(mockUser)),
        setItem: vi.fn(),
        removeItem: vi.fn()
      }
    })
  })

  test('renders ticket list', async () => {
    client.tickets.getAll.mockResolvedValue({ data: mockTickets })

    renderWithProviders(<TicketList />)

    expect(screen.getByText('Support Tickets')).toBeInTheDocument()
    
    await waitFor(() => {
      expect(screen.getByText('Test Ticket 1')).toBeInTheDocument()
      expect(screen.getByText('Test Ticket 2')).toBeInTheDocument()
    })
  })

  test('shows create ticket button for users', async () => {
    client.tickets.getAll.mockResolvedValue({ data: [] })

    renderWithProviders(<TicketList />)

    await waitFor(() => {
      expect(screen.getByText('+ New Ticket')).toBeInTheDocument()
    })
  })

  test('shows empty state when no tickets', async () => {
    client.tickets.getAll.mockResolvedValue({ data: [] })

    renderWithProviders(<TicketList />)

    await waitFor(() => {
      expect(screen.getByText('No tickets found')).toBeInTheDocument()
    })
  })
})