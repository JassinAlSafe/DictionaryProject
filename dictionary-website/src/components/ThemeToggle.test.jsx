import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'

vi.mock('next-themes', () => ({
  useTheme: vi.fn(),
}))

//Mock the button component
vi.mock('./ui/button.jsx', () => ({
  Button: ({ children, ...props }) => <button {...props}>{children}</button>,
}))

vi.mock('lucide-react', () => ({
  Moon: () => <div data-testid="moon-icon">Moon</div>,
  Sun: () => <div data-testid="sun-icon">Sun</div>,
}))

import { useTheme } from 'next-themes'

describe('ThemeToggle', () => {
  it('renders without crashing', () => {
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
    render(<ThemeToggle />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })

  it('displays sun and moon icons', () => {
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
    render(<ThemeToggle />)
    expect(screen.getByTestId('moon-icon')).toBeInTheDocument()
    expect(screen.getByTestId('sun-icon')).toBeInTheDocument()
  })

  it('toggles from light to dark theme', () => {
    const setThemeMock = vi.fn()
    useTheme.mockReturnValue({ theme: 'light', setTheme: setThemeMock })
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button'))
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('toggles from dark to light theme', () => {
    const setThemeMock = vi.fn()
    useTheme.mockReturnValue({ theme: 'dark', setTheme: setThemeMock })
    render(<ThemeToggle />)

    fireEvent.click(screen.getByRole('button'))
    expect(setThemeMock).toHaveBeenCalledWith('light')
  })
})

export default function Component() {
  return <ThemeToggle />
}
