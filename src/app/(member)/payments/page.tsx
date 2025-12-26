'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { PaymentHistoryCard } from '@/components/payments';
import BottomNav from '@/components/layout/BottomNav'

interface Payment {
  id: string;
  amount: number;
  plan_type: string;
  mpesa_receipt_number: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

export default function PaymentsPage() {
  const router = useRouter();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        const res = await fetch('/api/payments/history');

        if (res.status === 401) {
          router.push('/login');
          return;
        }

        if (!res.ok) {
          throw new Error('Failed to fetch payments');
        }

        const data = await res.json();
        setPayments(data.payments || []);
      } catch (err) {
        console.error('Failed to load payments:', err);
        setError('Could not load payment history');
      } finally {
        setLoading(false);
      }
    };

    fetchPayments();
  }, [router]);

  // Calculate totals
  const totalPaid = payments
    .filter((p) => p.status === 'completed')
    .reduce((sum, p) => sum + p.amount, 0);

  const completedCount = payments.filter((p) => p.status === 'completed').length;

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
          <h1 className="text-lg font-bold">Payment History</h1>
        </div>
      </header>

      <main className="max-w-lg mx-auto px-4 py-6">
        {/* Summary Card - only show if no error */}
        {!error && (
          <div className="bg-linear-to-r from-orange-500/20 to-pink-500/20 border border-orange-500/30 rounded-2xl p-4 mb-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-zinc-400 text-xs">Total Paid</div>
                <div className="text-2xl font-extrabold text-white">
                  KES {totalPaid.toLocaleString()}
                </div>
              </div>
              <div className="text-right">
                <div className="text-zinc-400 text-xs">Transactions</div>
                <div className="text-2xl font-extrabold text-white">
                  {completedCount}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">😕</div>
            <div className="text-white font-bold mb-2">Could not load payments</div>
            <div className="text-zinc-500 text-sm mb-6">
              Please try again later
            </div>
            <button
              onClick={() => window.location.reload()}
              className="px-6 py-3 rounded-xl font-bold text-white bg-zinc-800"
            >
              Retry
            </button>
          </div>
        )}

        {/* Empty State */}
        {!error && payments.length === 0 && (
          <div className="text-center py-12">
            <div className="text-5xl mb-4">💳</div>
            <div className="text-white font-bold mb-2">No payments yet</div>
            <div className="text-zinc-500 text-sm mb-6">
              Your M-Pesa transactions will appear here
            </div>
            <button
              onClick={() => router.push('/plans')}
              className="px-6 py-3 rounded-xl font-bold text-white bg-linear-to-r from-orange-500 to-pink-500"
            >
              View Plans
            </button>
          </div>
        )}

        {/* Payments List */}
        {payments.length > 0 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-zinc-400 mb-3">
              All Transactions
            </h2>
            {payments.map((payment) => (
              <PaymentHistoryCard key={payment.id} payment={payment} />
            ))}
          </div>
        )}

        {/* Help Text */}
        {payments.length > 0 && (
          <div className="mt-8 text-center text-zinc-500 text-xs">
            <p>Questions about a payment?</p>
            <p className="text-white font-medium">Call +254 793 466 828</p>
          </div>
        )}
      </main>

      {/* Bottom Navigation */}
      <BottomNav />
    </div>
  );
}