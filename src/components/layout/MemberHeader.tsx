/**
 * MemberHeader Component
 * Location: src/components/layout/MemberHeader.tsx
 */
'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';

interface MemberHeaderProps {
  memberName?: string;
}

export function MemberHeader({ memberName }: MemberHeaderProps) {
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
      router.push('/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-black/80 backdrop-blur-lg border-b border-zinc-800">
      <div className="max-w-lg mx-auto px-4 py-3">
        {/* Top row: Logo + Logout */}
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-3">
            <Image
              src="/logo.png"
              alt="Fitness 16"
              width={40}
              height={40}
              className="rounded-xl"
            />
            <div>
              <h1 className="font-bold text-lg">Fitness 16</h1>
              {memberName && (
                <p className="text-sm text-zinc-400">Hi, {memberName}!</p>
              )}
            </div>
          </div>
          
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium transition-colors"
          >
            Logout
          </button>
        </div>
        
        {/* Date */}
        <p className="text-xs text-zinc-500">{today}</p>
      </div>
    </header>
  );
}