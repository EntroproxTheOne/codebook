import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
// Removed react-hot-toast import

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'CodeNote - Hacker-Style Note Taking',
  description: 'A paste-bin style note taking app with room keys, no login required',
  keywords: ['notes', 'paste-bin', 'code', 'hacker', 'terminal', 'vim'],
  authors: [{ name: 'CodeNote Team' }],
}

export const viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
          {/* Custom toast implementation in lib/toast.ts */}
        </ThemeProvider>
      </body>
    </html>
  )
}
