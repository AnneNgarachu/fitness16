interface WeightEntry {
  id: string
  kg: number
  date: string
  notes?: string
}

interface WeightLogProps {
  weights: WeightEntry[]
}

export default function WeightLog({ weights }: WeightLogProps) {
  if (weights.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
        <h3 className="text-sm font-bold mb-3">Weight Log</h3>
        <div className="text-center py-6 text-zinc-500">
          <div className="text-3xl mb-2">⚖️</div>
          <p className="text-sm">No weight entries yet</p>
          <p className="text-xs mt-1">Start tracking your progress!</p>
        </div>
      </div>
    )
  }

  // Sort by date descending (most recent first)
  const sortedWeights = [...weights].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  )

  // Calculate change between consecutive entries
  const entriesWithChange = sortedWeights.map((entry, index) => {
    const prevEntry = sortedWeights[index + 1]
    const change = prevEntry ? entry.kg - prevEntry.kg : null
    return { ...entry, change }
  })

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4">
      <h3 className="text-sm font-bold mb-3">Weight Log</h3>
      <div className="space-y-2">
        {entriesWithChange.map((entry) => (
          <div
            key={entry.id}
            className="flex items-center justify-between bg-zinc-800/50 rounded-lg p-3"
          >
            <div className="flex-1">
              <div className="text-zinc-400 text-xs">
                {formatDate(entry.date)}
              </div>
              {entry.notes && (
                <div className="text-zinc-500 text-xs mt-0.5 truncate max-w-36">
                  {entry.notes}
                </div>
              )}
            </div>
            <div className="flex items-center gap-3">
              {entry.change !== null && (
                <span className={`text-xs font-medium ${getChangeColor(entry.change)}`}>
                  {formatChange(entry.change)}
                </span>
              )}
              <span className="text-lg font-bold">{entry.kg} kg</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}

function formatChange(change: number): string {
  if (change === 0) return '0'
  const sign = change > 0 ? '+' : ''
  return `${sign}${change.toFixed(1)}`
}

function getChangeColor(change: number): string {
  if (change < 0) return 'text-green-500' // Lost weight
  if (change > 0) return 'text-red-400'   // Gained weight
  return 'text-zinc-500'                   // No change
}