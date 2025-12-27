'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { WalkInModal } from './WalkInModal';

interface AdminHeaderProps {
  onWalkInClick?: () => void;
}

export function AdminHeader({ onWalkInClick }: AdminHeaderProps) {
  const router = useRouter();
  const [showWalkInModal, setShowWalkInModal] = useState(false);
  
  const today = new Date().toLocaleDateString('en-KE', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
      router.push('/admin/login');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const handleWalkInClick = () => {
    if (onWalkInClick) {
      onWalkInClick();
    } else {
      setShowWalkInModal(true);
    }
  };

  const handleWalkInSubmit = async (data: { name: string; phone: string; location: string; plan_type: string }) => {
    try {
      const res = await fetch('/api/reception/walkin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShowWalkInModal(false);
        window.location.reload();
      }
    } catch (e) {
      console.error('Walk-in error:', e);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 bg-black/90 backdrop-blur-lg border-b border-zinc-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Fitness 16"
                width={44}
                height={44}
                className="rounded-xl"
              />
              <div>
                <h1 className="font-bold text-lg text-white">Fitness 16</h1>
                <p className="text-xs text-zinc-500">Admin Dashboard</p>
              </div>
            </div>

            <div className="hidden md:block text-center">
              <p className="text-sm text-zinc-400">📅 {today}</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleWalkInClick}
                className="px-4 py-2 bg-linear-to-r from-orange-500 to-pink-500 rounded-lg text-sm font-semibold text-white hover:opacity-90 transition-opacity"
              >
                + Walk-in
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-sm font-medium text-white transition-colors"
              >
                Logout
              </button>
            </div>
          </div>
          
          <p className="md:hidden text-xs text-zinc-500 mt-2">📅 {today}</p>
        </div>
      </header>

      {showWalkInModal && (
        <WalkInModal 
          onClose={() => setShowWalkInModal(false)} 
          onSubmit={handleWalkInSubmit} 
        />
      )}
    </>
  );
}