interface ProfileHeaderProps {
  firstName: string
  lastName: string
  phone: string
  memberSince: string
  membership: {
    plan_type: string
    days_remaining: number
    expiry_date?: string
  } | null
}

export default function ProfileHeader({
  firstName,
  lastName,
  phone,
  memberSince,
  membership,
}: ProfileHeaderProps) {
  const initials = `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase()
  
  // Determine status color based on days remaining
  const getDaysColor = (days: number) => {
    if (days <= 3) return 'text-red-500'
    if (days <= 7) return 'text-orange-500'
    return 'text-green-500'
  }
  
  return (
    <div className="bg-zinc-900 rounded-2xl p-5 mb-4">
      {/* Avatar & Name */}
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 rounded-full bg-linear-to-br from-orange-500 to-pink-500 flex items-center justify-center text-xl font-bold">
          {initials}
        </div>
        <div>
          <h2 className="text-xl font-bold">{firstName} {lastName}</h2>
          <p className="text-zinc-500 text-sm">{formatPhone(phone)}</p>
        </div>
      </div>

      {/* Membership Status */}
      {membership ? (
        <div className="bg-zinc-800 rounded-xl p-3">
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-xs text-zinc-500">Membership</p>
              <p className="font-semibold capitalize">{membership.plan_type}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-zinc-500">Days Left</p>
              <p className={`font-semibold ${getDaysColor(membership.days_remaining)}`}>
                {membership.days_remaining}
              </p>
            </div>
          </div>
          {membership.expiry_date && (
            <div className="border-t border-zinc-700 pt-2 mt-2">
              <p className="text-xs text-zinc-500 text-center">
                Expires on {formatExpiryDate(membership.expiry_date)}
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between bg-zinc-800 rounded-xl p-3">
          <div>
            <p className="text-xs text-zinc-500">Membership</p>
            <p className="font-semibold">No active plan</p>
          </div>
          <span className="text-orange-500 text-sm font-medium">Upgrade →</span>
        </div>
      )}

      {/* Member Since */}
      <p className="text-xs text-zinc-600 text-center mt-3">
        Member since {formatDate(memberSince)}
      </p>
    </div>
  )
}

function formatPhone(phone: string): string {
  if (phone.length === 12 && phone.startsWith('254')) {
    return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`
  }
  return phone
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
}

function formatExpiryDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { 
    weekday: 'short',
    month: 'short', 
    day: 'numeric',
    year: 'numeric'
  })
}