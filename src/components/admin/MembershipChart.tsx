'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';

interface MembershipData {
  name: string;
  value: number;
  color: string;
}

interface MembershipChartProps {
  data: MembershipData[];
}

export default function MembershipChart({ data }: MembershipChartProps) {
  if (!data.length || data.every(d => d.value === 0)) {
    return (
      <div className="h-44 flex items-center justify-center text-zinc-500">
        No members yet
      </div>
    );
  }

  const chartData = data.map(item => ({
    name: item.name,
    value: item.value,
    color: item.color,
  }));

  return (
    <>
      <ResponsiveContainer width="100%" height={180}>
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            cx="50%"
            cy="50%"
            innerRadius={50}
            outerRadius={70}
            paddingAngle={4}
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333',
              borderRadius: '8px',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex justify-center gap-4 mt-4">
        {data.map((item, i) => (
          <div key={i} className="flex items-center gap-2 text-sm">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-zinc-400">{item.name}</span>
            <span className="font-semibold">{item.value}</span>
          </div>
        ))}
      </div>
    </>
  );
}