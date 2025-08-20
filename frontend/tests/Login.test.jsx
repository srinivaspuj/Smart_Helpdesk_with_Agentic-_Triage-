import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { BrowserRouter } from 'react-router-dom'
import Login from '../src/pages/Login'
import * as api from '../src/api/client'

// Mock the API client
jest.mock('../src/api/client')
jest.mock('../src/hooks/useAuth', () => ({
  useAuth: () => ({
    login: jest.fn()
  })
}))

const renderWithRouter = (component) => {
  return render(
    <BrowserRouter>
      {component}
    </BrowserRouter>
  )
}

describe('Login Component', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('renders login form', () => {
    renderWithRouter(<Login />)
    
    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Email')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Password')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Login' })).toBeInTheDocument()
  })

  test('validates required fields', async () => {
    renderWithRouter(<Login />)
    
    const submitButton = screen.getByRole('button', { name: 'Login' })
    fireEvent.click(submitButton)
    
    // HTML5 validation should prevent submission
    const emailInput = screen.getByPlaceholderText('Email')
    const passwordInput = screen.getByPlaceholderText('Password')
    
    expect(emailInput).toBeRequired()
    expect(passwordInput).toBeRequired()
  })

  test('submits form with valid data', async () => {
    const mockLogin = jest.fn()
    api.auth.login.mockResolvedValue({
      data: {
        token: 'fake-token',
        user: { id: '1', email: 'test@example.com', name: 'Test User', role: 'user' }
      }
    })

    renderWithRouter(<Login />)
    
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'password123' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    
    await waitFor(() => {
      expect(api.auth.login).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123'
      })
    })
  })

  test('displays error message on login failure', async () => {
    api.auth.login.mockRejectedValue({
      response: {
        data: { error: 'Invalid credentials' }
      }
    })

    renderWithRouter(<Login />)
    
    fireEvent.change(screen.getByPlaceholderText('Email'), {
      target: { value: 'test@example.com' }
    })
    fireEvent.change(screen.getByPlaceholderText('Password'), {
      target: { value: 'wrongpassword' }
    })
    
    fireEvent.click(screen.getByRole('button', { name: 'Login' }))
    
    await waitFor(() => {
      expect(screen.getByText('Invalid credentials')).toBeInTheDocument()
    })
  })
})