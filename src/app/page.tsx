import Link from 'next/link'

export default function WelcomePage() {
  return (
    <div className="min-h-screen bg-black text-white flex flex-col">
      {/* Hero */}
      <div className="flex-1 flex flex-col justify-center items-center text-center px-6 py-12">
        <div className="w-20 h-20 rounded-2xl bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center font-black text-2xl mb-6">
          F16
        </div>
        
        <h1 className="text-4xl font-black mb-2">Fitness 16</h1>
        <p className="text-zinc-500 text-lg mb-10">No Excuses. Just Work.</p>
        
        <div className="bg-linear-to-br from-orange-500 to-pink-500 rounded-2xl p-5 max-w-xs mb-10">
          <p className="text-base leading-relaxed">
            Track workouts, crush goals, and transform your body.
          </p>
        </div>
      </div>
      
      {/* Buttons */}
      <div className="p-6 space-y-3">
        <Link 
          href="/signup"
          className="block w-full py-4 bg-linear-to-r from-orange-500 to-pink-500 text-white font-bold text-center rounded-xl hover:opacity-90 transition-opacity"
        >
          Get Started
        </Link>
        
        <Link
          href="/login"
          className="block w-full py-4 bg-zinc-900 border border-zinc-700 text-white font-bold text-center rounded-xl hover:bg-zinc-800 transition-colors"
        >
          I Already Have an Account
        </Link>
      </div>
    </div>
  )
}