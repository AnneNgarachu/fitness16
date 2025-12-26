'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PlanCard, PaymentModal, MembershipStatus, type Plan } from '@/components/plans';
import BottomNav from '@/components/layout/BottomNav'

const PLANS: Plan[] = [
  { id: 'day', name: 'Day Pass', price: 500, days: 1, plan_type: 'day' },
  { id: 'week', name: 'Weekly', price: 2000, days: 7, plan_type: 'week' },
  { id: 'month', name: 'Monthly', price: 5500, days: 30, plan_type: 'month', popular: true },
  { id: 'quarterly', name: 'Quarterly', price: 15000, days: 90, plan_type: 'quarterly', save: '10%' },
  { id: 'semi_annual', name: 'Semi-Annual', price: 30000, days: 180, plan_type: 'semi_annual', save: '15%' },
  { id: 'annual', name: 'Annual', price: 54000, days: 365, plan_type: 'annual', save: '20%' },
];

interface Membership {
  plan_type: string;
  status: string;
  expiry_date: string;
  days_remaining: number;
}

interface Profile {
  phone: string;
  first_name: string;
}

export default function PlansPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [membership, setMembership] = useState<Membership | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // First get the current user
        const meRes = await fetch('/api/auth/me');
        if (!meRes.ok) {
          router.push('/login');
          return;
        }
        const meData = await meRes.json();

        // Then fetch profile with member_id
        const profileRes = await fetch(`/api/member/profile?member_id=${meData.user.id}`);
        
        if (profileRes.ok) {
          const data = await profileRes.json();
          
          // Set profile data
          if (data.member) {
            setProfile({
              phone: data.member.phone,
              first_name: data.member.first_name,
            });
          }
          
          // Set membership data
          if (data.membership) {
            const expiryDate = new Date(data.membership.expiry_date);
            const today = new Date();
            const daysRemaining = Math.ceil(
              (expiryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
            );
            
            setMembership({
              plan_type: data.membership.plan_type,
              status: daysRemaining > 0 ? 'active' : 'expired',
              expiry_date: data.membership.expiry_date,
              days_remaining: daysRemaining,
            });
          }
        }
      } catch (error) {
        console.error('Failed to load profile:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [router]);

  const handleSelectPlan = (plan: Plan) => {
    setSelectedPlan(plan);
  };

  const handlePayNow = () => {
    if (selectedPlan) {
      setShowPaymentModal(true);
    }
  };

  const handlePaymentSuccess = () => {
    router.push('/dashboard?payment=success');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white pb-24">
      {/* Header */}
      <header className="sticky top-0 bg-black/90 backdrop-blur-sm border-b border-zinc-900 px-4 py-3 z-40">
        <div className="max-w-lg mx-auto flex items-center">
          <button
            onClick={() => router.back()}
            className="mr-3 text-zinc-400 hover:text-white"
          >
            ←
          </button>
          <h1 className="text-lg font-bold">Membership Plans</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Current Membership Status */}
        <MembershipStatus membership={membership} />

        {/* Plans List */}
        <div className="mb-6">
          <h2 className="text-sm font-semibold text-zinc-400 mb-3">
            {membership ? 'Renew or Upgrade' : 'Choose a Plan'}
          </h2>
          <div className="space-y-3">
            {PLANS.map((plan) => (
              <PlanCard
                key={plan.id}
                plan={plan}
                onSelect={handleSelectPlan}
                isSelected={selectedPlan?.id === plan.id}
              />
            ))}
          </div>
        </div>

        {/* Plan Benefits */}
        <div className="bg-zinc-900 rounded-2xl p-4 mb-6">
          <h3 className="font-bold text-sm mb-3">💡 Why go longer?</h3>
          <div className="space-y-2 text-sm text-zinc-400">
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Save up to <strong className="text-white">20%</strong> with annual</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Access both Juja & Ruaka locations</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-green-500">✓</span>
              <span>Keep your workout streak going</span>
            </div>
          </div>
        </div>

        {/* Contact Info */}
        <div className="text-center text-zinc-500 text-xs">
          <p>Need help? Call us:</p>
          <p className="text-white font-medium">+254 793 466 828 (Juja)</p>
          <p className="text-white font-medium">+254 726 050 613 (Ruaka)</p>
        </div>
      </main>

      {/* Fixed Bottom CTA */}
      {selectedPlan && (
        <div className="fixed bottom-16 left-0 right-0 bg-zinc-900 border-t border-zinc-800 p-4 z-30">
          <div className="max-w-lg mx-auto">
            <div className="flex items-center justify-between mb-3">
              <div>
                <div className="text-zinc-400 text-xs">Selected Plan</div>
                <div className="font-bold text-white">{selectedPlan.name}</div>
              </div>
              <div className="text-right">
                <div className="font-extrabold text-xl text-white">
                  KES {selectedPlan.price.toLocaleString()}
                </div>
              </div>
            </div>
            <button
              onClick={handlePayNow}
              className="w-full py-4 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500 flex items-center justify-center gap-2"
            >
              <span>💳</span>
              Pay with M-Pesa
            </button>
          </div>
        </div>
      )}

      {/* Payment Modal */}
      {showPaymentModal && selectedPlan && (
        <PaymentModal
          plan={selectedPlan}
          phone={profile?.phone || ''}
          onClose={() => setShowPaymentModal(false)}
          onSuccess={handlePaymentSuccess}
        />
      )}

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}