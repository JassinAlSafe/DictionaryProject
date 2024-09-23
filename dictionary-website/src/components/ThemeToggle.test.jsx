import { render, screen, fireEvent } from '@testing-library/react'
import { describe, it, expect, vi } from 'vitest'
import { ThemeToggle } from './ThemeToggle'
import userEvent from '@testing-library/user-event'
import { useTheme } from 'next-themes'

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

describe('ThemeToggle', () => {
  it('renders without crashing', () => {
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
    render(<ThemeToggle />)
    expect(screen.getByRole('button', { name: /toggle theme/i })).toBeInTheDocument()
  })

  it('displays the sun icon in light mode'),
    () => {
      useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
      render(<ThemeToggle />)
      const sunIcon = screen.getByTestId('sun-icon')
      const moonIcon = screen.queryByTestId('moon-icon')

      expect(sunIcon).toHaveClass('rotate-0 scale-100')
      expect(moonIcon).toHaveClass('rotate-90 scale-0')
    }

  it('displays the moon icon in dark mode'),
    () => {
      useTheme.mockReturnValue({ theme: 'dark', setTheme: vi.fn() })
      render(<ThemeToggle />)
      const sunIcon = screen.queryByTestId('sun-icon')
      const moonIcon = screen.getByTestId('moon-icon')

      expect(sunIcon).toHaveClass('dark:-rotate-90 dark:scale-0')
      expect(moonIcon).toHaveClass('dark:rotate-0 dark:scale-100')
    }

  it('toggles from light to dark theme', async () => {
    const user = userEvent.setup()
    const setThemeMock = vi.fn()
    useTheme.mockReturnValue({ theme: 'light', setTheme: setThemeMock })
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(setThemeMock).toHaveBeenCalledWith('dark')
  })

  it('toggles from dark to light theme', async () => {
    const user = userEvent.setup()
    const setThemeMock = vi.fn()
    useTheme.mockReturnValue({ theme: 'dark', setTheme: setThemeMock })
    render(<ThemeToggle />)

    await user.click(screen.getByRole('button', { name: /toggle theme/i }))
    expect(setThemeMock).toHaveBeenCalledWith('light')
  })

  it('applies correct classes for light theme', () => {
    useTheme.mockReturnValue({ theme: 'light', setTheme: vi.fn() })
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })

    expect(button).toHaveClass('text-primary-foreground')
    expect(button).not.toHaveClass('dark:text-primary-foreground')
  })

  it('applies correct classes for dark theme', () => {
    useTheme.mockReturnValue({ theme: 'dark', setTheme: vi.fn() })
    render(<ThemeToggle />)
    const button = screen.getByRole('button', { name: /toggle theme/i })

    expect(button).toHaveClass('text-primary-foreground')
  })
})

export default function Component() {
  return <ThemeToggle />
}
