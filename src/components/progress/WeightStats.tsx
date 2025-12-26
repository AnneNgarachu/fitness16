interface WeightEntry {
  id: string
  kg: number
  date: string
  notes?: string
}

interface WeightStatsProps {
  weights: WeightEntry[]
  goalWeight?: number
}

interface StatCard {
  label: string
  value: string
  color: string
}

export default function WeightStats({ weights, goalWeight }: WeightStatsProps) {
  // Calculate stats from weight history
  const stats = calculateStats(weights, goalWeight)

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-center"
        >
          <div className="text-zinc-500 text-[10px] uppercase tracking-wide">
            {stat.label}
          </div>
          <div 
            className="text-2xl font-black mt-1"
            style={{ color: stat.color }}
          >
            {stat.value}
          </div>
          <div className="text-zinc-500 text-xs">kg</div>
        </div>
      ))}
    </div>
  )
}

function calculateStats(weights: WeightEntry[], goalWeight?: number): StatCard[] {
  if (weights.length === 0) {
    return [
      { label: 'Start', value: '--', color: '#666' },
      { label: 'Current', value: '--', color: '#fff' },
      { label: 'Lost', value: '--', color: '#22c55e' },
      { label: 'Goal', value: goalWeight?.toString() || '--', color: '#f97316' },
    ]
  }

  // Sort by date ascending to get chronological order
  const sorted = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  const startWeight = sorted[0].kg
  const currentWeight = sorted[sorted.length - 1].kg
  const weightLost = startWeight - currentWeight

  return [
    { label: 'Start', value: startWeight.toFixed(1), color: '#666' },
    { label: 'Current', value: currentWeight.toFixed(1), color: '#fff' },
    { 
      label: weightLost >= 0 ? 'Lost' : 'Gained', 
      value: Math.abs(weightLost).toFixed(1), 
      color: weightLost >= 0 ? '#22c55e' : '#ef4444' 
    },
    { label: 'Goal', value: goalWeight?.toString() || '--', color: '#f97316' },
  ]
}