/**
 * ADMIN LeadsTab Component
 * Location: src/components/admin/LeadsTab.tsx
 * 
 * Features:
 * - Self-contained (fetches own data from /api/leads)
 * - Shows ALL leads from both locations (Juja + Ruaka)
 * - Location filter dropdown
 * - Status count cards (clickable)
 * - Click lead → Modal to update
 */
'use client';

import { useState, useEffect, useCallback } from 'react';

// Types
interface Lead {
  id: string;
  name: string;
  phone: string;
  email?: string;
  source: 'physical_visit' | 'walkin' | 'whatsapp' | 'instagram' | 'referral' | 'phone_call' | 'website';
  location: 'juja' | 'ruaka';
  status: 'new' | 'contacted' | 'follow_up' | 'converted' | 'lost';
  notes?: string;
  follow_up_date?: string;
  created_at: string;
}

interface LeadCounts {
  total: number;
  new: number;
  contacted: number;
  follow_up: number;
  converted: number;
  lost: number;
}

// Constants
const STATUS_CONFIG = {
  new: { label: 'New', icon: '🆕', color: 'bg-blue-500' },
  contacted: { label: 'Contacted', icon: '📞', color: 'bg-yellow-500' },
  follow_up: { label: 'Follow Up', icon: '📅', color: 'bg-purple-500' },
  converted: { label: 'Converted', icon: '✅', color: 'bg-green-500' },
  lost: { label: 'Lost', icon: '❌', color: 'bg-red-500' },
} as const;

const SOURCE_CONFIG = {
  physical_visit: { label: 'Walk-in', icon: '🚶' },
  walkin: { label: 'Walk-in', icon: '🚶' },
  whatsapp: { label: 'WhatsApp', icon: '💬' },
  instagram: { label: 'Instagram', icon: '📸' },
  referral: { label: 'Referral', icon: '👥' },
  phone_call: { label: 'Phone', icon: '📞' },
  website: { label: 'Website', icon: '🌐' },
} as const;

export default function LeadsTab() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [counts, setCounts] = useState<LeadCounts>({
    total: 0, new: 0, contacted: 0, follow_up: 0, converted: 0, lost: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // Filters
  const [locationFilter, setLocationFilter] = useState<'all' | 'juja' | 'ruaka'>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  
  // Modal state
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [updating, setUpdating] = useState(false);

  // Fetch leads
  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      const params = new URLSearchParams();
      // Always send location (API may require it)
      params.set('location', locationFilter);
      if (statusFilter !== 'all') params.set('status', statusFilter);
      
      const res = await fetch(`/api/leads?${params.toString()}`);
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        console.error('Leads API error:', res.status, errorData);
        throw new Error(errorData.error || 'Failed to fetch leads');
      }
      
      const data = await res.json();
      setLeads(data.leads || []);
      setCounts(data.counts || { total: 0, new: 0, contacted: 0, follow_up: 0, converted: 0, lost: 0 });
    } catch (err) {
      setError('Failed to load leads');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [locationFilter, statusFilter]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  // Update lead status
  const updateLeadStatus = async (leadId: string, newStatus: string, notes?: string, followUpDate?: string) => {
    try {
      setUpdating(true);
      const res = await fetch('/api/leads', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_id: leadId,
          status: newStatus,
          notes: notes,
          follow_up_date: followUpDate || null,
        }),
      });
      
      if (!res.ok) throw new Error('Failed to update lead');
      
      await fetchLeads();
      setSelectedLead(null);
    } catch (err) {
      console.error(err);
      alert('Failed to update lead status');
    } finally {
      setUpdating(false);
    }
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
  };

  // Format phone for display
  const formatPhone = (phone: string) => {
    if (phone.startsWith('254')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  return (
    <div>
      {/* Header with filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h2 className="text-xl font-bold">All Leads</h2>
        
        <div className="flex flex-wrap gap-3">
          {/* Location filter */}
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value as 'all' | 'juja' | 'ruaka')}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Locations</option>
            <option value="juja">📍 Juja</option>
            <option value="ruaka">📍 Ruaka</option>
          </select>
          
          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="all">All Statuses</option>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>
                {config.icon} {config.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Status counts */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
        <button
          onClick={() => setStatusFilter('all')}
          className={`bg-zinc-900 border rounded-xl p-4 text-left transition-all ${
            statusFilter === 'all'
              ? 'border-orange-500 ring-1 ring-orange-500'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <div className="text-2xl font-bold">{counts.total}</div>
          <div className="text-xs text-zinc-500">Total</div>
        </button>
        {Object.entries(STATUS_CONFIG).map(([key, config]) => (
          <button
            key={key}
            onClick={() => setStatusFilter(statusFilter === key ? 'all' : key)}
            className={`bg-zinc-900 border rounded-xl p-4 text-left transition-all ${
              statusFilter === key 
                ? 'border-orange-500 ring-1 ring-orange-500' 
                : 'border-zinc-800 hover:border-zinc-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <span className="text-lg">{config.icon}</span>
              <span className="text-2xl font-bold">{counts[key as keyof LeadCounts]}</span>
            </div>
            <div className="text-xs text-zinc-500">{config.label}</div>
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 mb-6">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-orange-500 border-t-transparent" />
        </div>
      ) : leads.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center text-zinc-500">
          No leads found
        </div>
      ) : (
        /* Leads list */
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          {/* Desktop table header - hidden on mobile */}
          <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-3 bg-zinc-800/50 border-b border-zinc-800 text-xs font-semibold text-zinc-400 uppercase">
            <span className="col-span-1">Lead</span>
            <span className="col-span-1">Contact</span>
            <span className="col-span-1">Source</span>
            <span className="col-span-1">Location</span>
            <span className="col-span-1">Status</span>
            <span className="col-span-1">Added</span>
          </div>
          
          {/* Leads - Card on mobile, Table row on desktop */}
          {leads.map((lead) => (
            <div
              key={lead.id}
              onClick={() => setSelectedLead(lead)}
              className="border-b border-zinc-800 hover:bg-zinc-800/50 cursor-pointer transition-colors"
            >
              {/* Mobile Card Layout */}
              <div className="md:hidden p-4">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <div className="font-semibold text-lg">{lead.name}</div>
                    <div className="text-sm text-zinc-400">{formatPhone(lead.phone)}</div>
                  </div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                    lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                    lead.status === 'follow_up' ? 'bg-purple-500/20 text-purple-400' :
                    lead.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {STATUS_CONFIG[lead.status]?.icon} {STATUS_CONFIG[lead.status]?.label}
                  </span>
                </div>
                <div className="flex flex-wrap gap-3 text-xs text-zinc-500">
                  <span>{SOURCE_CONFIG[lead.source]?.icon} {SOURCE_CONFIG[lead.source]?.label}</span>
                  <span>📍 {lead.location}</span>
                  <span>{formatDate(lead.created_at)}</span>
                </div>
                {lead.notes && (
                  <div className="mt-2 text-xs text-zinc-500 truncate">{lead.notes}</div>
                )}
              </div>

              {/* Desktop Table Row */}
              <div className="hidden md:grid md:grid-cols-6 gap-4 px-4 py-4 items-center">
                {/* Name + notes preview */}
                <div>
                  <div className="font-semibold">{lead.name}</div>
                  {lead.notes && (
                    <div className="text-xs text-zinc-500 truncate max-w-48">
                      {lead.notes}
                    </div>
                  )}
                </div>
                
                {/* Contact */}
                <div className="text-sm">
                  <div className="text-zinc-300">{formatPhone(lead.phone)}</div>
                  {lead.email && (
                    <div className="text-xs text-zinc-500 truncate">{lead.email}</div>
                  )}
                </div>
                
                {/* Source */}
                <div className="text-sm">
                  <span className="mr-1">{SOURCE_CONFIG[lead.source]?.icon}</span>
                  <span className="text-zinc-400">{SOURCE_CONFIG[lead.source]?.label}</span>
                </div>
                
                {/* Location */}
                <div className="text-sm">
                  <span className="capitalize">{lead.location}</span>
                </div>
                
                {/* Status */}
                <div>
                  <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                    lead.status === 'new' ? 'bg-blue-500/20 text-blue-400' :
                    lead.status === 'contacted' ? 'bg-yellow-500/20 text-yellow-400' :
                    lead.status === 'follow_up' ? 'bg-purple-500/20 text-purple-400' :
                    lead.status === 'converted' ? 'bg-green-500/20 text-green-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {STATUS_CONFIG[lead.status]?.icon} {STATUS_CONFIG[lead.status]?.label}
                  </span>
                </div>
                
                {/* Date */}
                <div className="text-sm text-zinc-500">
                  {formatDate(lead.created_at)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lead detail modal */}
      {selectedLead && (
        <LeadDetailModal
          lead={selectedLead}
          onClose={() => setSelectedLead(null)}
          onUpdateStatus={updateLeadStatus}
          updating={updating}
        />
      )}
    </div>
  );
}

// Lead detail modal component
interface LeadDetailModalProps {
  lead: Lead;
  onClose: () => void;
  onUpdateStatus: (id: string, status: string, notes?: string, followUpDate?: string) => void;
  updating: boolean;
}

function LeadDetailModal({ lead, onClose, onUpdateStatus, updating }: LeadDetailModalProps) {
  const [newStatus, setNewStatus] = useState(lead.status);
  const [notes, setNotes] = useState(lead.notes || '');
  const [followUpDate, setFollowUpDate] = useState(lead.follow_up_date || '');

  const formatPhone = (phone: string) => {
    if (phone.startsWith('254')) {
      return `+${phone.slice(0, 3)} ${phone.slice(3, 6)} ${phone.slice(6, 9)} ${phone.slice(9)}`;
    }
    return phone;
  };

  const handleSave = () => {
    const statusChanged = newStatus !== lead.status;
    const notesChanged = notes !== (lead.notes || '');
    const dateChanged = followUpDate !== (lead.follow_up_date || '');
    
    if (statusChanged || notesChanged || dateChanged) {
      onUpdateStatus(lead.id, newStatus, notes, followUpDate);
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-50">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-800">
          <h3 className="text-lg font-bold">Lead Details</h3>
          <button
            onClick={onClose}
            className="text-zinc-500 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {/* Lead info */}
          <div className="bg-zinc-800/50 rounded-xl p-4 space-y-3">
            <div>
              <div className="text-xs text-zinc-500 mb-1">Name</div>
              <div className="font-semibold text-lg">{lead.name}</div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Phone</div>
                <a 
                  href={`tel:${lead.phone}`}
                  className="text-orange-400 hover:underline"
                >
                  {formatPhone(lead.phone)}
                </a>
              </div>
              {lead.email && (
                <div>
                  <div className="text-xs text-zinc-500 mb-1">Email</div>
                  <a 
                    href={`mailto:${lead.email}`}
                    className="text-orange-400 hover:underline text-sm"
                  >
                    {lead.email}
                  </a>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-xs text-zinc-500 mb-1">Source</div>
                <div>
                  {SOURCE_CONFIG[lead.source]?.icon} {SOURCE_CONFIG[lead.source]?.label}
                </div>
              </div>
              <div>
                <div className="text-xs text-zinc-500 mb-1">Location</div>
                <div className="capitalize">📍 {lead.location}</div>
              </div>
            </div>

            {lead.follow_up_date && (
              <div>
                <div className="text-xs text-zinc-500 mb-1">Follow-up Date</div>
                <div>📅 {new Date(lead.follow_up_date).toLocaleDateString('en-GB', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}</div>
              </div>
            )}
          </div>

          {/* Status update */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Update Status</label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setNewStatus(key as Lead['status'])}
                  className={`flex items-center gap-2 p-3 rounded-lg border transition-all ${
                    newStatus === key
                      ? 'border-orange-500 bg-orange-500/10'
                      : 'border-zinc-700 hover:border-zinc-600'
                  }`}
                >
                  <span>{config.icon}</span>
                  <span className="text-sm font-medium">{config.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">Notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Add notes about this lead..."
            />
          </div>

          {/* Follow-up Date - always visible, optional */}
          <div>
            <label className="block text-xs text-zinc-500 mb-2">📅 Follow-up Date (optional)</label>
            <input
              type="date"
              value={followUpDate}
              onChange={(e) => setFollowUpDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
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

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-3 bg-zinc-800 hover:bg-zinc-700 rounded-lg font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={updating}
              className="flex-1 px-4 py-3 bg-linear-to-r from-orange-500 to-pink-500 rounded-lg font-semibold transition-opacity disabled:opacity-50"
            >
              {updating ? 'Saving...' : 'Save Changes'}
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex gap-2 pt-2">
            <a
              href={`tel:${lead.phone}`}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-colors"
            >
              📞 Call
            </a>
            <a
              href={`https://wa.me/${lead.phone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-green-500/20 text-green-400 rounded-lg font-semibold hover:bg-green-500/30 transition-colors"
            >
              💬 WhatsApp
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}