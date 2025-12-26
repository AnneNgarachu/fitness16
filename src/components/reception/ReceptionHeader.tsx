'use client';

import { useRouter } from 'next/navigation';

interface ReceptionHeaderProps {
  staffName: string;
  location: string | null;
}

export function ReceptionHeader({ staffName, location }: ReceptionHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/reception/login');
  };

  // Format today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-KE', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-6 py-4 z-50">
      <div className="max-w-4xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-black text-sm">
            F16
          </div>
          <div>
            <div className="font-bold text-lg">Fitness 16</div>
            <div className="text-zinc-500 text-xs">
              {location ? `${location.charAt(0).toUpperCase() + location.slice(1)} Reception` : 'Reception'}
            </div>
          </div>
        </div>

        {/* Today's Date - Center */}
        <div className="hidden sm:block text-center">
          <div className="text-zinc-400 text-sm">📅 {dateString}</div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-zinc-400 text-sm hidden sm:inline">{staffName}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile: date and staff name below */}
      <div className="sm:hidden flex justify-between mt-2 text-xs text-zinc-500">
        <span>📅 {dateString}</span>
        <span>{staffName}</span>
      </div>
    </header>
  );
}