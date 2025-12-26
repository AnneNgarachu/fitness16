/**
 * AddLeadForm Component
 * Location: src/components/reception/AddLeadForm.tsx
 * 
 * Features:
 * - Source selection (how they found us)
 * - Quick notes dropdown (common scenarios)
 * - Custom note option
 * - Auto-syncs to Admin Leads tab
 * 
 * Note: Follow-up date is set later when updating the lead
 */
'use client';

import { useState } from 'react';

interface AddLeadFormProps {
  location: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const SOURCES = [
  { id: 'physical_visit', name: 'Walk-in', icon: '🚶' },
  { id: 'whatsapp', name: 'WhatsApp', icon: '💬' },
  { id: 'instagram', name: 'Instagram', icon: '📸' },
  { id: 'phone_call', name: 'Phone Call', icon: '📞' },
  { id: 'referral', name: 'Referral', icon: '👥' },
  { id: 'website', name: 'Website', icon: '🌐' },
];

const QUICK_NOTES = [
  { id: 'visited', text: 'Visited gym - left contact info' },
  { id: 'prices', text: 'Called asking about prices' },
  { id: 'tour', text: 'Wants to tour the facility' },
  { id: 'callback', text: 'Asked for callback' },
  { id: 'interested', text: 'Interested in membership' },
  { id: 'pt', text: 'Asked about personal training' },
  { id: 'returning', text: 'Previous member - wants to return' },
  { id: 'custom', text: 'Custom note...' },
];

export function AddLeadForm({ location, onSuccess, onCancel }: AddLeadFormProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [source, setSource] = useState('physical_visit');
  const [selectedNote, setSelectedNote] = useState('');
  const [customNote, setCustomNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const formatPhone = (value: string) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length <= 4) return digits;
    if (digits.length <= 7) return `${digits.slice(0, 4)} ${digits.slice(4)}`;
    return `${digits.slice(0, 4)} ${digits.slice(4, 7)} ${digits.slice(7, 10)}`;
  };

  // Get final notes value
  const getFinalNotes = () => {
    if (selectedNote === 'custom') {
      return customNote || undefined;
    }
    const found = QUICK_NOTES.find(n => n.id === selectedNote);
    return found ? found.text : undefined;
  };

  const handleSubmit = async () => {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          phone: phone.replace(/\D/g, ''),
          source,
          location,
          notes: getFinalNotes(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error?.message || 'Failed to add lead');
      }

      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 1500);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setIsLoading(false);
    }
  };

  const isPhoneValid = phone.replace(/\D/g, '').length >= 9;

  if (success) {
    return (
      <div className="bg-green-500/10 border-2 border-green-500 rounded-2xl p-8 text-center">
        <div className="text-6xl mb-4">✅</div>
        <h3 className="text-2xl font-bold text-green-400 mb-2">Lead Added!</h3>
        <p className="text-zinc-400">{name} saved for follow-up</p>
      </div>
    );
  }

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6">
      <h3 className="text-lg font-bold mb-4">Add New Lead</h3>

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Name *</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="John Doe"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Phone */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Phone Number *</label>
          <input
            type="tel"
            value={formatPhone(phone)}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="0712 345 678"
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
          />
        </div>

        {/* Source - How did they reach us? */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">How did they find us? *</label>
          <div className="grid grid-cols-3 gap-2">
            {SOURCES.map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => setSource(s.id)}
                className={`p-2 rounded-xl text-center transition-colors ${
                  source === s.id
                    ? 'bg-orange-500/20 border-2 border-orange-500'
                    : 'bg-zinc-800 border border-zinc-700 hover:border-zinc-600'
                }`}
              >
                <span className="text-lg block">{s.icon}</span>
                <span className="text-xs font-medium">{s.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Quick Notes Dropdown */}
        <div>
          <label className="block text-zinc-400 text-xs mb-2">Quick Note</label>
          <select
            value={selectedNote}
            onChange={(e) => setSelectedNote(e.target.value)}
            className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
          >
            <option value="">Select a note (optional)</option>
            {QUICK_NOTES.map((note) => (
              <option key={note.id} value={note.id}>
                {note.text}
              </option>
            ))}
          </select>
        </div>

        {/* Custom Note - only show if "Custom note..." is selected */}
        {selectedNote === 'custom' && (
          <div>
            <label className="block text-zinc-400 text-xs mb-2">Custom Note</label>
            <textarea
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              placeholder="Enter your custom note..."
              rows={2}
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500 resize-none"
            />
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl text-sm">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-bold text-zinc-400 bg-zinc-800 hover:bg-zinc-700 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!name || !isPhoneValid || isLoading}
            className="flex-1 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
          >
            {isLoading ? 'Saving...' : 'Save Lead'}
          </button>
        </div>
      </div>
    </div>
  );
}