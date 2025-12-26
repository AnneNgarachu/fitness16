'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface RevenueChartProps {
  data: { month: string; revenue: number }[];
}

export default function RevenueChart({ data }: RevenueChartProps) {
  if (!data.length || data.every(d => d.revenue === 0)) {
    return (
      <div className="h-64 flex items-center justify-center text-zinc-500">
        No payment data available
      </div>
    );
  }

  // Calculate max and round up to nearest 10k
  const maxRevenue = Math.max(...data.map(d => d.revenue));
  const roundedMax = Math.ceil(maxRevenue / 10000) * 10000;
  
  // Generate clean 10k interval ticks: 0, 10k, 20k, 30k...
  const ticks: number[] = [];
  for (let i = 0; i <= roundedMax; i += 10000) {
    ticks.push(i);
  }

  return (
    <ResponsiveContainer width="100%" height={250}>
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="#333" />
        <XAxis dataKey="month" stroke="#888" fontSize={12} />
        <YAxis
          stroke="#888"
          fontSize={12}
          tickFormatter={(v) => v === 0 ? '0' : `${v / 1000}k`}
          domain={[0, roundedMax]}
          ticks={ticks}
        />
        <Tooltip
          contentStyle={{
            backgroundColor: '#1a1a1a',
            border: '1px solid #333',
            borderRadius: '8px',
          }}
          formatter={(value) => [`KES ${Number(value).toLocaleString()}`, 'Revenue']}
        />
        <Bar dataKey="revenue" fill="#f97316" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}