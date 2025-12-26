/**
 * ReceptionHeader Component
 * Location: src/components/reception/ReceptionHeader.tsx
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface ReceptionHeaderProps {
  staffName?: string;
  location?: string;
}

export function ReceptionHeader({ staffName, location }: ReceptionHeaderProps) {
  const router = useRouter();
  
  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/reception/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Title */}
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Fitness 16"
              width={44}
              height={44}
              className="rounded-xl"
            />
            <div>
              <h1 className="font-bold text-lg">Fitness 16</h1>
              <p className="text-xs text-zinc-500 capitalize">
                {location ? `${location} Reception` : 'Reception'}
              </p>
            </div>
          </div>

          {/* Date - center on desktop */}
          <div className="hidden md:block text-center">
            <p className="text-sm text-zinc-400">📅 {today}</p>
          </div>

          {/* Staff name + Logout */}
          <div className="flex items-center gap-3">
            {staffName && (
              <span className="text-sm text-zinc-400 hidden sm:inline">
                {staffName}
              </span>
            )}
            <button
              onClick={handleLogout}
              className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
        
        {/* Date - mobile */}
        <p className="md:hidden text-xs text-zinc-500 mt-2">📅 {today}</p>
      </div>
    </header>
  );
}