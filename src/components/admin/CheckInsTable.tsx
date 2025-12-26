'use client';

interface CheckIn {
  id: string;
  member_name: string;
  location: string;
  type: string;
  timestamp: string;
}

interface CheckInsTableProps {
  checkIns: CheckIn[];
  locationFilter: string;
  onLocationChange: (location: string) => void;
}

export function CheckInsTable({ checkIns, locationFilter, onLocationChange }: CheckInsTableProps) {
  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatType = (type: string) => {
    switch (type) {
      case 'facial': return '✨ Auto';
      case 'manual': return '✓ Member';
      case 'walkin': return '🚶 Walk-in';
      default: return type;
    }
  };

  const filteredCheckIns = locationFilter === 'all' 
    ? checkIns 
    : checkIns.filter(c => c.location?.toLowerCase() === locationFilter);

  return (
    <div>
      {/* Location Filter */}
      <div className="flex gap-2 mb-6">
        {['all', 'juja', 'ruaka'].map((loc) => (
          <button
            key={loc}
            onClick={() => onLocationChange(loc)}
            className={`px-4 py-2 rounded-xl font-semibold text-sm transition-colors ${
              locationFilter === loc
                ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {loc === 'all' ? 'All Locations' : loc.charAt(0).toUpperCase() + loc.slice(1)}
          </button>
        ))}
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Member</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Time</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Location</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Type</th>
            </tr>
          </thead>
          <tbody>
            {filteredCheckIns.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-zinc-500">
                  No check-ins today
                </td>
              </tr>
            ) : (
              filteredCheckIns.map((checkIn) => (
                <tr key={checkIn.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
                        {checkIn.member_name?.[0] || '?'}
                      </div>
                      <span className="font-medium text-white">{checkIn.member_name}</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{formatTime(checkIn.timestamp)}</td>
                  <td className="px-4 py-3">
                    <span className="px-2 py-1 rounded-lg text-xs font-medium bg-zinc-800 text-zinc-300 capitalize">
                      📍 {checkIn.location}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-zinc-400 text-sm">{formatType(checkIn.type)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}