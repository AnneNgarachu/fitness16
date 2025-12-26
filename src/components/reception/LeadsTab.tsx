/**
 * RECEPTION LeadsTab Component
 * Location: src/components/reception/LeadsTab.tsx
 * 
 * Features:
 * - Receives props from parent (reception/page.tsx)
 * - Shows only leads for assigned location (Juja OR Ruaka)
 * - Filter tabs with counts
 * - Click lead → Modal to update
 */
'use client';

import { useState } from 'react';

interface Lead {
  id: string;
  name: string;
  phone: string;
  source: string;
  status: string;
  notes: string | null;
  follow_up_date: string | null;
}

interface Props {
  leads: Lead[];
  loading: boolean;
  filter: string;
  onFilterChange: (val: string) => void;
  onAddLead: () => void;
  onUpdateStatus: (id: string, status: string) => void;
}

const SOURCE_CONFIG: Record<string, { icon: string; label: string }> = {
  physical_visit: { icon: '🚶', label: 'Walk-in' },
  walkin: { icon: '🚶', label: 'Walk-in' },
  whatsapp: { icon: '💬', label: 'WhatsApp' },
  instagram: { icon: '📸', label: 'Instagram' },
  referral: { icon: '👥', label: 'Referral' },
  phone_call: { icon: '📞', label: 'Phone' },
  website: { icon: '🌐', label: 'Website' },
};

const STATUS_CONFIG: Record<string, { icon: string; label: string; bg: string }> = {
  new: { icon: '🆕', label: 'New', bg: 'bg-blue-500/20 text-blue-400' },
  contacted: { icon: '📞', label: 'Contacted', bg: 'bg-yellow-500/20 text-yellow-400' },
  follow_up: { icon: '📅', label: 'Follow Up', bg: 'bg-purple-500/20 text-purple-400' },
  converted: { icon: '✅', label: 'Converted', bg: 'bg-green-500/20 text-green-400' },
  lost: { icon: '❌', label: 'Lost', bg: 'bg-zinc-500/20 text-zinc-400' },
};

export function LeadsTab({ leads, loading, filter, onFilterChange, onAddLead, onUpdateStatus }: Props) {
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState<string>('');
  const [followUpDate, setFollowUpDate] = useState<string>('');

  const formatPhone = (phone: string) => {
    const cleaned = phone.replace(/\D/g, '');
    if (cleaned.startsWith('254') && cleaned.length === 12) {
      return `+${cleaned.slice(0, 3)} ${cleaned.slice(3, 6)} ${cleaned.slice(6, 9)} ${cleaned.slice(9)}`;
    }
    return phone;
  };

  const handleOpenModal = (lead: Lead) => {
    setSelectedLead(lead);
    setNewStatus(lead.status);
    setFollowUpDate(lead.follow_up_date || '');
  };

  const handleSave = async () => {
    if (!selectedLead) {
      setSelectedLead(null);
      return;
    }

    // Check if anything changed
    const statusChanged = newStatus !== selectedLead.status;
    const followUpChanged = followUpDate !== (selectedLead.follow_up_date || '');
    
    if (!statusChanged && !followUpChanged) {
      setSelectedLead(null);
      return;
    }
    
    setUpdating(true);
    try {
      // Call API directly to include follow_up_date
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: selectedLead.id,
          status: newStatus,
          follow_up_date: followUpDate || null,
        }),
      });
      
      if (!res.ok) {
        throw new Error('Failed to update lead');
      }
      
      // Trigger refresh via parent
      onUpdateStatus(selectedLead.id, newStatus);
      setSelectedLead(null);
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setUpdating(false);
    }
  };

  const filtered = filter === 'all' ? leads : leads.filter((l) => l.status === filter);
  const newCount = leads.filter((l) => l.status === 'new').length;
  const contactedCount = leads.filter((l) => l.status === 'contacted').length;
  const followUpCount = leads.filter((l) => l.status === 'follow_up').length;
  const convertedCount = leads.filter((l) => l.status === 'converted').length;
  const lostCount = leads.filter((l) => l.status === 'lost').length;

  const filterCounts: Record<string, number> = {
    all: leads.length,
    new: newCount,
    contacted: contactedCount,
    follow_up: followUpCount,
    converted: convertedCount,
    lost: lostCount,
  };

  return (
    <>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold">
          Leads 
          {newCount > 0 && (
            <span className="text-sm bg-red-500 text-white px-2 py-0.5 rounded-full ml-2">
              {newCount} new
            </span>
          )}
        </h2>
        <button 
          onClick={onAddLead} 
          className="px-4 py-2 rounded-xl font-semibold text-sm bg-linear-to-r from-orange-500 to-pink-500 text-white"
        >
          + Add Lead
        </button>
      </div>

      {/* Filter tabs with counts */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-2">
        {['all', 'new', 'contacted', 'follow_up', 'converted', 'lost'].map((s) => (
          <button 
            key={s} 
            onClick={() => onFilterChange(s)} 
            className={`px-3 py-1 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-1 ${
              filter === s 
                ? 'bg-orange-500 text-white' 
                : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
            }`}
          >
            {s === 'all' ? 'All' : s === 'follow_up' ? 'Follow Up' : s.charAt(0).toUpperCase() + s.slice(1)}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              filter === s ? 'bg-white/20' : 'bg-zinc-700'
            }`}>
              {filterCounts[s]}
            </span>
          </button>
        ))}
      </div>

      {/* Leads list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="p-8 text-center text-zinc-500">No leads found</div>
        ) : (
          <div className="divide-y divide-zinc-800">
            {filtered.map((lead) => {
              const src = SOURCE_CONFIG[lead.source] || { icon: '❓', label: lead.source };
              const status = STATUS_CONFIG[lead.status] || STATUS_CONFIG.new;
              
              return (
                <div 
                  key={lead.id} 
                  onClick={() => handleOpenModal(lead)}
                  className="p-4 hover:bg-zinc-800/50 cursor-pointer transition-colors"
                >
                  {/* Lead card - click to edit */}
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-zinc-700 flex items-center justify-center text-lg font-bold">
                        {lead.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="font-semibold">{lead.name}</div>
                        <div className="text-sm text-zinc-400">{formatPhone(lead.phone)}</div>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${status.bg}`}>
                      {status.icon} {status.label}
                    </span>
                  </div>
                  
                  {/* Source and notes */}
                  <div className="flex items-center gap-3 text-xs text-zinc-500 pl-13">
                    <span className="bg-zinc-800 px-2 py-1 rounded">{src.icon} {src.label}</span>
                    {lead.notes && <span className="truncate max-w-40">{lead.notes}</span>}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedLead && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
          <div className="bg-zinc-900 rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Modal header */}
            <div className="p-4 border-b border-zinc-800">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-bold">Lead Details</h3>
                <button 
                  onClick={() => setSelectedLead(null)}
                  className="text-zinc-500 hover:text-white text-xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal content */}
            <div className="p-4 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs text-zinc-500 uppercase">Name</label>
                <div className="text-lg font-semibold">{selectedLead.name}</div>
              </div>

              {/* Phone */}
              <div>
                <label className="text-xs text-zinc-500 uppercase">Phone</label>
                <div className="text-lg text-orange-400">{formatPhone(selectedLead.phone)}</div>
              </div>

              {/* Source */}
              <div>
                <label className="text-xs text-zinc-500 uppercase">Source</label>
                <div className="flex items-center gap-2 mt-1">
                  <span className="bg-zinc-800 px-3 py-1 rounded-lg">
                    {SOURCE_CONFIG[selectedLead.source]?.icon} {SOURCE_CONFIG[selectedLead.source]?.label || selectedLead.source}
                  </span>
                </div>
              </div>

              {/* Notes */}
              {selectedLead.notes && (
                <div>
                  <label className="text-xs text-zinc-500 uppercase">Notes</label>
                  <div className="text-sm text-zinc-400 bg-zinc-800 rounded-lg p-3 mt-1">
                    {selectedLead.notes}
                  </div>
                </div>
              )}

              {/* Status selection */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-2 block">Update Status</label>
                <div className="grid grid-cols-2 gap-2">
                  {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <button
                      key={key}
                      onClick={() => setNewStatus(key)}
                      className={`p-3 rounded-xl text-sm font-medium transition-all border-2 ${
                        newStatus === key
                          ? 'border-orange-500 bg-orange-500/20'
                          : 'border-zinc-700 bg-zinc-800 hover:border-zinc-600'
                      }`}
                    >
                      {config.icon} {config.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Follow-up Date - always visible, optional */}
              <div>
                <label className="text-xs text-zinc-500 uppercase mb-2 block">
                  📅 Follow-up Date (optional)
                </label>
                <input
                  type="date"
                  value={followUpDate}
                  onChange={(e) => setFollowUpDate(e.target.value)}
                  min={new Date().toISOString().split('T')[0]}
                  className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
                />
                {followUpDate && (
                  <button
                    type="button"
                    onClick={() => setFollowUpDate('')}
                    className="text-xs text-zinc-500 hover:text-red-400 mt-1"
                  >
                    ✕ Clear date
                  </button>
                )}
              </div>

              {/* Quick contact buttons */}
              <div className="flex gap-2 pt-2">
                <a
                  href={`tel:${selectedLead.phone}`}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-colors"
                >
                  📞 Call
                </a>
                <a
                  href={`https://wa.me/${selectedLead.phone}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-colors"
                >
                  💬 WhatsApp
                </a>
              </div>
            </div>

            {/* Modal footer */}
            <div className="p-4 border-t border-zinc-800 flex gap-3">
              <button
                onClick={() => setSelectedLead(null)}
                className="flex-1 px-4 py-3 bg-zinc-800 rounded-lg font-semibold hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={updating || newStatus === selectedLead.status}
                className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-pink-500 rounded-lg font-semibold transition-opacity disabled:opacity-50"
              >
                {updating ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}