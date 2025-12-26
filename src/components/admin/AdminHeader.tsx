'use client';

import { useRouter } from 'next/navigation';

interface AdminHeaderProps {
  onWalkInClick: () => void;
}

export function AdminHeader({ onWalkInClick }: AdminHeaderProps) {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/admin/login');
  };

  // Format today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  return (
    <header className="sticky top-0 bg-zinc-950 border-b border-zinc-800 px-6 py-4 z-50">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-black text-sm">
            F16
          </div>
          <div>
            <div className="font-bold text-lg">Fitness 16</div>
            <div className="text-zinc-500 text-xs">Admin Dashboard</div>
          </div>
        </div>

        {/* Today's Date - Center */}
        <div className="hidden md:block text-center">
          <div className="text-zinc-400 text-sm">{dateString}</div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={onWalkInClick}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-linear-to-r from-orange-500 to-pink-500"
          >
            + Walk-in
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 rounded-xl font-bold text-sm bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>
      
      {/* Mobile date - below header content */}
      <div className="md:hidden text-center mt-2 text-zinc-500 text-xs">
        {dateString}
      </div>
    </header>
  );
}