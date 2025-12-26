'use client';

import { useState } from 'react';

interface WalkInModalProps {
  onClose: () => void;
  onSubmit: (data: WalkInData) => void;
}

interface WalkInData {
  name: string;
  phone: string;
  location: string;
  plan_type: string;
}

const PLANS = [
  { id: 'day', name: 'Day Pass', price: 500 },
  { id: 'week', name: 'Weekly', price: 2000 },
  { id: 'month', name: 'Monthly', price: 5500 },
];

export function WalkInModal({ onClose, onSubmit }: WalkInModalProps) {
  const [formData, setFormData] = useState<WalkInData>({
    name: '',
    phone: '',
    location: 'juja',
    plan_type: 'day',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!formData.name || !formData.phone) return;
    
    setIsSubmitting(true);
    await onSubmit(formData);
    setIsSubmitting(false);
  };

  const selectedPlan = PLANS.find(p => p.id === formData.plan_type);

  return (
    <div className="fixed inset-0 bg-black/90 flex items-center justify-center z-50 p-4">
      <div className="bg-zinc-900 rounded-2xl w-full max-w-md">
        {/* Header */}
        <div className="px-5 py-4 border-b border-zinc-800 flex justify-between items-center">
          <h3 className="font-bold text-lg">Register Walk-in</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-white text-2xl">
            ×
          </button>
        </div>

        {/* Form */}
        <div className="p-5 space-y-4">
          <div>
            <label className="block text-zinc-400 text-xs mb-2">Customer Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-2">Phone Number</label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="0712 345 678"
              className="w-full px-4 py-3 bg-zinc-800 border border-zinc-700 rounded-xl text-white focus:outline-none focus:border-orange-500"
            />
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-2">Location</label>
            <div className="flex gap-2">
              {['juja', 'ruaka'].map((loc) => (
                <button
                  key={loc}
                  onClick={() => setFormData({ ...formData, location: loc })}
                  className={`flex-1 py-3 rounded-xl font-semibold transition-colors ${
                    formData.location === loc
                      ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
                      : 'bg-zinc-800 text-zinc-400'
                  }`}
                >
                  {loc.charAt(0).toUpperCase() + loc.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-zinc-400 text-xs mb-2">Plan</label>
            <div className="space-y-2">
              {PLANS.map((plan) => (
                <button
                  key={plan.id}
                  onClick={() => setFormData({ ...formData, plan_type: plan.id })}
                  className={`w-full flex justify-between items-center px-4 py-3 rounded-xl transition-colors ${
                    formData.plan_type === plan.id
                      ? 'bg-orange-500/20 border-2 border-orange-500'
                      : 'bg-zinc-800 border border-zinc-700'
                  }`}
                >
                  <span className="font-medium">{plan.name}</span>
                  <span className="font-bold">KES {plan.price.toLocaleString()}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Total */}
          <div className="bg-zinc-800 rounded-xl p-4 flex justify-between items-center">
            <span className="text-zinc-400">Total</span>
            <span className="text-2xl font-black text-white">
              KES {selectedPlan?.price.toLocaleString()}
            </span>
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!formData.name || !formData.phone || isSubmitting}
            className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 disabled:opacity-50"
          >
            {isSubmitting ? 'Sending M-Pesa Prompt...' : 'Send M-Pesa Prompt'}
          </button>
        </div>
      </div>
    </div>
  );
}