import { render, screen, fireEvent } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import { vi } from 'vitest'
import NavBar from '../src/components/NavBar'
import { AuthProvider } from '../src/contexts/AuthContext'

const mockLogout = vi.fn()

// Mock the useAuth hook
vi.mock('../src/contexts/AuthContext', async () => {
  const actual = await vi.importActual('../src/contexts/AuthContext')
  return {
    ...actual,
    useAuth: () => ({
      user: {
        id: '1',
        name: 'Test User',
        email: 'test@example.com',
        role: 'user'
      },
      logout: mockLogout
    })
  }
})

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('NavBar', () => {
  test('renders navigation links for authenticated user', () => {
    renderWithRouter(<NavBar />)

    expect(screen.getByText('Smart Helpdesk')).toBeInTheDocument()
    expect(screen.getByText('Tickets')).toBeInTheDocument()
    expect(screen.getByText('Knowledge Base')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Sign Out')).toBeInTheDocument()
  })

  test('shows user role badge', () => {
    renderWithRouter(<NavBar />)

    expect(screen.getByText('user')).toBeInTheDocument()
  })

  test('calls logout when sign out clicked', () => {
    renderWithRouter(<NavBar />)

    const signOutButton = screen.getByText('Sign Out')
    fireEvent.click(signOutButton)

    expect(mockLogout).toHaveBeenCalled()
  })
})