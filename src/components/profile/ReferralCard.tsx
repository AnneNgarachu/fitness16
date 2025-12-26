'use client'

import { useState } from 'react'

interface ReferralCardProps {
  referralCode: string
}

export default function ReferralCard({ referralCode }: ReferralCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralCode)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy:', err)
    }
  }

  return (
    <div className="bg-zinc-900 rounded-2xl p-5 mb-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">🎁</span>
        <h3 className="font-bold">Refer a Friend</h3>
      </div>
      <p className="text-zinc-500 text-sm mb-4">
        Share your code and both get rewards when they join!
      </p>
      
      <div className="flex items-center gap-3">
        <div className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 font-mono text-lg tracking-wider">
          {referralCode}
        </div>
        <button
          onClick={handleCopy}
          className={`px-4 py-3 rounded-xl font-bold transition-colors ${
            copied 
              ? 'bg-green-600 text-white' 
              : 'bg-orange-500 hover:bg-orange-600 text-white'
          }`}
        >
          {copied ? '✓ Copied' : 'Copy'}
        </button>
      </div>
    </div>
  )
}