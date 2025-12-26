'use client'

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface WeightEntry {
  id: string
  kg: number
  date: string
}

interface WeightChartProps {
  weights: WeightEntry[]
}

interface ChartDataPoint {
  date: string
  displayDate: string
  kg: number
}

export default function WeightChart({ weights }: WeightChartProps) {
  // Transform and sort data for chart
  const chartData = prepareChartData(weights)

  if (chartData.length === 0) {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
        <h3 className="text-sm font-bold mb-3">Weight Trend</h3>
        <div className="h-44 flex items-center justify-center text-zinc-500">
          <div className="text-center">
            <div className="text-3xl mb-2">📈</div>
            <p className="text-sm">Log your weight to see trends</p>
          </div>
        </div>
      </div>
    )
  }

  // Calculate Y-axis domain with padding
  const minWeight = Math.min(...chartData.map(d => d.kg))
  const maxWeight = Math.max(...chartData.map(d => d.kg))
  const padding = Math.max(2, (maxWeight - minWeight) * 0.1)

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4">
      <h3 className="text-sm font-bold mb-3">Weight Trend</h3>
      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#333" />
          <XAxis 
            dataKey="displayDate" 
            stroke="#666" 
            fontSize={11}
            tick={{ fill: '#666' }}
          />
          <YAxis 
            stroke="#666" 
            fontSize={11}
            tick={{ fill: '#666' }}
            domain={[Math.floor(minWeight - padding), Math.ceil(maxWeight + padding)]}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
              fontSize: '12px',
            }}
            labelStyle={{ color: '#888' }}
            itemStyle={{ color: '#f97316' }}
            formatter={(value) => value !== undefined ? [`${value} kg`, 'Weight'] : ['N/A', 'Weight']}
          />
          <Line
            type="monotone"
            dataKey="kg"
            stroke="#f97316"
            strokeWidth={2}
            dot={{ fill: '#f97316', r: 4 }}
            activeDot={{ r: 6, fill: '#f97316' }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}

function prepareChartData(weights: WeightEntry[]): ChartDataPoint[] {
  // Sort by date ascending
  const sorted = [...weights].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  )

  // Take last 10 entries for cleaner chart
  const recent = sorted.slice(-10)

  return recent.map(w => ({
    date: w.date,
    displayDate: formatDateShort(w.date),
    kg: w.kg,
  }))
}

function formatDateShort(dateStr: string): string {
  const date = new Date(dateStr)
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}