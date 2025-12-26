'use client';

import { useState } from 'react';

interface Member {
  id: string;
  first_name: string;
  last_name: string;
  phone: string;
  membership_status: string;
  days_remaining: number | null;
}

interface MemberSearchProps {
  onSelectMember: (member: Member) => void;
}

export function MemberSearch({ onSelectMember }: MemberSearchProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Member[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (searchQuery.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    try {
      const res = await fetch(`/api/reception/members/search?q=${encodeURIComponent(searchQuery)}`);
      if (res.ok) {
        const data = await res.json();
        setResults(data.members || []);
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500/20 text-green-400';
      case 'expiring': return 'bg-yellow-500/20 text-yellow-400';
      case 'expired': return 'bg-red-500/20 text-red-400';
      default: return 'bg-zinc-500/20 text-zinc-400';
    }
  };

  return (
    <div>
      {/* Search Input */}
      <div className="relative mb-4">
        <input
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name or phone..."
          className="w-full px-4 py-4 bg-zinc-800 border border-zinc-700 rounded-xl text-white text-lg focus:outline-none focus:border-orange-500 pl-12"
        />
        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-500 text-xl">
          🔍
        </span>
        {isSearching && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {results.map((member) => (
            <button
              key={member.id}
              onClick={() => {
                onSelectMember(member);
                setQuery('');
                setResults([]);
              }}
              className="w-full flex items-center justify-between p-4 hover:bg-zinc-800 transition-colors border-b border-zinc-800 last:border-b-0"
            >
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-zinc-700 flex items-center justify-center font-bold text-lg">
                  {member.first_name[0]}
                </div>
                <div className="text-left">
                  <div className="font-semibold text-white">
                    {member.first_name} {member.last_name}
                  </div>
                  <div className="text-zinc-500 text-sm">{member.phone}</div>
                </div>
              </div>
              <div className="text-right">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(member.membership_status)}`}>
                  {member.membership_status}
                </span>
                {member.days_remaining !== null && (
                  <div className="text-zinc-500 text-xs mt-1">
                    {member.days_remaining} days left
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
      )}

      {query.length >= 2 && results.length === 0 && !isSearching && (
        <div className="text-center py-8 text-zinc-500">
          No members found
        </div>
      )}
    </div>
  );
}