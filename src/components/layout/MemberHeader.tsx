'use client';

import { useRouter } from 'next/navigation';

interface MemberHeaderProps {
  memberName?: string;
  showLogout?: boolean;
}

export function MemberHeader({ memberName, showLogout = true }: MemberHeaderProps) {
  const router = useRouter();

  // Format today's date
  const today = new Date();
  const dateString = today.toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/');
  };

  return (
    <header className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-zinc-800 px-5 py-4 z-50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-black text-sm">
            F16
          </div>
          <div>
            {memberName ? (
              <>
                <div className="font-bold text-lg">Hi, {memberName} 👋</div>
                <div className="text-zinc-500 text-xs">{dateString}</div>
              </>
            ) : (
              <>
                <div className="font-bold text-lg">Fitness 16</div>
                <div className="text-zinc-500 text-xs">{dateString}</div>
              </>
            )}
          </div>
        </div>

        {showLogout && (
          <button 
            onClick={handleLogout} 
            className="text-zinc-500 hover:text-white transition-colors text-sm"
          >
            Logout
          </button>
        )}
      </div>
    </header>
  );
}

export default MemberHeader;