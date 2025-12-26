interface StatsCardProps {
  label: string;
  value: string | number;
  icon: string;
  color?: string;
}

export function StatsCard({ label, value, icon, color = 'text-white' }: StatsCardProps) {
  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5">
      <div className="flex justify-between items-start mb-3">
        <span className="text-3xl">{icon}</span>
      </div>
      <div className={`text-3xl font-black ${color}`}>{value}</div>
      <div className="text-zinc-500 text-sm mt-1">{label}</div>
    </div>
  );
}