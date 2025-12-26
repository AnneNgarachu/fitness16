'use client';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  home_location?: string;
  location?: string;
  plan_type: string | null;
  status: 'active' | 'expiring' | 'expired' | 'none';
  days_remaining: number | null;
}

interface MembersTableProps {
  members: Member[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  locationFilter: string;
  onLocationChange: (location: string) => void;
  statusFilter: string;
  onStatusChange: (status: string) => void;
}

export function MembersTable({
  members,
  searchQuery,
  onSearchChange,
  locationFilter,
  onLocationChange,
  statusFilter,
  onStatusChange,
}: MembersTableProps) {
  const getStatusBadge = (status: string, daysRemaining: number | null) => {
    if (status === 'active' && daysRemaining && daysRemaining > 7) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">Active</span>;
    }
    if (status === 'active' || status === 'expiring') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400">Expiring</span>;
    }
    if (status === 'expired') {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">Expired</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-zinc-500/20 text-zinc-400">No Plan</span>;
  };

  // Helper to get location from either field
  const getMemberLocation = (member: Member): string => {
    return (member.home_location || member.location || '').toLowerCase();
  };

  // Filter members based on location and status
  const filteredMembers = members.filter((member) => {
    const memberLoc = getMemberLocation(member);
    const filterLoc = locationFilter.toLowerCase();
    
    const matchesLocation = locationFilter === 'all' || memberLoc === filterLoc;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    
    return matchesLocation && matchesStatus;
  });

  return (
    <div>
      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or phone..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="flex-1 min-w-52 px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500"
        />
        <select
          value={locationFilter}
          onChange={(e) => onLocationChange(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">All Locations</option>
          <option value="juja">Juja</option>
          <option value="ruaka">Ruaka</option>
        </select>
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="px-4 py-2 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="expiring">Expiring Soon</option>
          <option value="expired">Expired</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-zinc-800">
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Member</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Phone</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Location</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Plan</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Status</th>
              <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Days Left</th>
            </tr>
          </thead>
          <tbody>
            {filteredMembers.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                  No members found
                </td>
              </tr>
            ) : (
              filteredMembers.map((member) => (
                <tr key={member.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-sm">
                        {member.first_name?.[0] || '?'}
                      </div>
                      <div className="font-semibold text-white">
                        {member.first_name} {member.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">{member.phone}</td>
                  <td className="px-4 py-3 text-zinc-300 text-sm capitalize">
                    {member.home_location || member.location || '-'}
                  </td>
                  <td className="px-4 py-3 text-zinc-300 text-sm capitalize">{member.plan_type || '-'}</td>
                  <td className="px-4 py-3">{getStatusBadge(member.status, member.days_remaining)}</td>
                  <td className="px-4 py-3 text-zinc-300 text-sm">
                    {member.days_remaining !== null ? member.days_remaining : '-'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}