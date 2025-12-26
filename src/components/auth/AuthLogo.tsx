/**
 * AuthLogo Component
 * Location: src/components/auth/AuthLogo.tsx
 * 
 * Reusable logo component for login/signup pages
 */
'use client';

import Image from 'next/image';

interface AuthLogoProps {
  subtitle?: string;
}

export function AuthLogo({ subtitle }: AuthLogoProps) {
  return (
    <div className="text-center mb-8">
      <div className="flex justify-center mb-4">
        <Image
          src="/logo.png"
          alt="Fitness 16"
          width={80}
          height={80}
          className="rounded-2xl"
          priority
        />
      </div>
      <h1 className="text-2xl font-bold">Fitness 16</h1>
      {subtitle && (
        <p className="text-zinc-500 text-sm mt-1">{subtitle}</p>
      )}
    </div>
  );
}