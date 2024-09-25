import React from 'react'
import { ThemeProvider as NextThemesProvider } from 'next-themes'

// ThemeProvider component to wrap the app/children with NextThemesProvider
export function ThemeProvider({ children, ...props }) {
  // Spread any additional props to NextThemesProvider and render children
  return <NextThemesProvider {...props}>{children}</NextThemesProvider>
}
