'use client';

interface CheckIn {
  id: string;
  member_name: string;
  timestamp: string;
  type: string;
  location: string;
}

interface TodayCheckInsListProps {
  checkIns: CheckIn[];
  onClose: () => void;
}

export function TodayCheckInsList({ checkIns, onClose }: TodayCheckInsListProps) {
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-KE', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
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

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h2 className="text-xl font-bold">Today&apos;s Check-ins</h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-zinc-800 hover:bg-zinc-700 flex items-center justify-center text-xl"
          >
            ✕
          </button>
        </div>

        {/* List */}
        <div className="overflow-y-auto max-h-[60vh]">
          {checkIns.length === 0 ? (
            <div className="p-8 text-center text-zinc-500">
              No check-ins yet today
            </div>
          ) : (
            <div className="divide-y divide-zinc-800">
              {checkIns.map((checkIn) => (
                <div
                  key={checkIn.id}
                  className="flex items-center justify-between p-4 hover:bg-zinc-800/50"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center font-bold">
                      {checkIn.member_name?.[0] || '?'}
                    </div>
                    <div>
                      <div className="font-semibold text-white">
                        {checkIn.member_name}
                      </div>
                      <div className="text-sm text-zinc-500">
                        {formatType(checkIn.type)}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-orange-400">
                      {formatTime(checkIn.timestamp)}
                    </div>
                    <div className="text-xs text-zinc-500 capitalize">
                      📍 {checkIn.location}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950">
          <div className="text-center text-zinc-500 text-sm">
            Total: <span className="text-white font-bold">{checkIns.length}</span> check-ins today
          </div>
        </div>
      </div>
    </div>
  );
}