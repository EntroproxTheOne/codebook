'use client'

import * as React from 'react'
import { cn } from '@/lib/utils'

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  glow?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'default', size = 'default', glow = false, ...props }, ref) => {
    return (
      <button
        className={cn(
          'inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50',
          {
            'bg-[var(--accent)] text-[var(--bg)] hover:bg-[var(--accent-hover)]': variant === 'default',
            'bg-[var(--error)] text-white hover:bg-[var(--error)]/90': variant === 'destructive',
            'border border-[var(--border)] bg-transparent hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]': variant === 'outline',
            'bg-[var(--bg-secondary)] text-[var(--text)] hover:bg-[var(--bg-tertiary)]': variant === 'secondary',
            'hover:bg-[var(--bg-secondary)] hover:text-[var(--accent)]': variant === 'ghost',
            'text-[var(--accent)] underline-offset-4 hover:underline': variant === 'link',
          },
          {
            'h-10 px-4 py-2': size === 'default',
            'h-9 rounded-md px-3': size === 'sm',
            'h-11 rounded-md px-8': size === 'lg',
            'h-10 w-10': size === 'icon',
          },
          glow && 'glow-button',
          className
        )}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = 'Button'

export { Button }
