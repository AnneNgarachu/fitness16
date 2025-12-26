/**
 * Homepage / Landing Page
 * Location: src/app/page.tsx
 */
import Image from 'next/image';
import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-black text-white">
      {/* Hero Section */}
      <div className="relative min-h-screen flex flex-col">
        {/* Background gradient */}
        <div className="absolute inset-0 bg-linear-to-br from-orange-900/20 via-black to-pink-900/20" />
        
        {/* Decorative elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-20 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center flex-1 px-6 py-12 text-center">
          {/* Logo */}
          <div className="mb-8 animate-fade-in">
            <Image
              src="/logo.png"
              alt="Fitness 16"
              width={120}
              height={120}
              className="rounded-3xl shadow-2xl shadow-orange-500/20"
              priority
            />
          </div>

          {/* Title */}
          <h1 className="text-5xl md:text-7xl font-black mb-4 bg-linear-to-r from-white via-orange-200 to-white bg-clip-text text-transparent">
            Fitness 16
          </h1>

          {/* Tagline */}
          <p className="text-xl md:text-2xl text-zinc-400 mb-4">
            No Excuses. Just Work.
          </p>

          {/* Description */}
          <p className="max-w-md text-zinc-500 mb-12">
            A proper gym in your neighborhood. Quality equipment, clean space, friendly staff.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 mb-16">
            <Link
              href="/login"
              className="px-8 py-4 bg-linear-to-r from-orange-500 to-pink-500 rounded-2xl font-bold text-lg hover:from-orange-600 hover:to-pink-600 transition-all transform hover:scale-105 shadow-lg shadow-orange-500/25"
            >
              Member Login
            </Link>
            <Link
              href="/signup"
              className="px-8 py-4 bg-zinc-800 border border-zinc-700 rounded-2xl font-bold text-lg hover:bg-zinc-700 transition-all"
            >
              Join Now
            </Link>
          </div>

          {/* Features */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full">
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-left hover:border-orange-500/50 transition-colors">
              <div className="text-3xl mb-4">🏠</div>
              <h3 className="font-bold text-lg mb-2">Your Neighborhood Gym</h3>
              <p className="text-zinc-500 text-sm">
                Right in Juja & Ruaka. No long commutes - just walk in and work out.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-left hover:border-orange-500/50 transition-colors">
              <div className="text-3xl mb-4">🏋️</div>
              <h3 className="font-bold text-lg mb-2">Quality Equipment</h3>
              <p className="text-zinc-500 text-sm">
                Well-maintained machines and free weights. Everything you need to train properly.
              </p>
            </div>
            <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-left hover:border-orange-500/50 transition-colors">
              <div className="text-3xl mb-4">✨</div>
              <h3 className="font-bold text-lg mb-2">Clean & Professional</h3>
              <p className="text-zinc-500 text-sm">
                A gym you can feel good about. Clean facilities, friendly staff.
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="relative z-10 border-t border-zinc-800 py-6 px-6">
          <div className="max-w-4xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <Image
                src="/logo.png"
                alt="Fitness 16"
                width={32}
                height={32}
                className="rounded-lg"
              />
              <span className="text-zinc-500 text-sm">© 2025 Fitness 16</span>
            </div>
            <div className="flex gap-6 text-sm text-zinc-500">
              <Link href="/admin/login" className="hover:text-orange-500 transition-colors">
                Admin
              </Link>
              <Link href="/reception/login" className="hover:text-orange-500 transition-colors">
                Reception
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}