'use client'

import { InputHTMLAttributes, forwardRef } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className = '', label, error, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block text-zinc-400 text-sm mb-2">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`w-full px-4 py-4 bg-zinc-900 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors ${error ? 'border-red-500' : ''} ${className}`}
          {...props}
        />
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    )
  }
)

Input.displayName = 'Input'