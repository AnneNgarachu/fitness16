'use client';

interface Payment {
  id: string;
  amount: number;
  plan_type: string;
  mpesa_receipt_number: string | null;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
}

interface PaymentHistoryCardProps {
  payment: Payment;
}

const planNames: Record<string, string> = {
  day: 'Day Pass',
  week: 'Weekly',
  month: 'Monthly',
  quarterly: 'Quarterly',
  semi_annual: 'Semi-Annual',
  annual: 'Annual',
};

export function PaymentHistoryCard({ payment }: PaymentHistoryCardProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-KE', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusConfig = {
    completed: {
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      text: 'text-green-400',
      label: '✓ Paid',
    },
    pending: {
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      text: 'text-yellow-400',
      label: '⏳ Pending',
    },
    failed: {
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      text: 'text-red-400',
      label: '✗ Failed',
    },
  };

  const status = statusConfig[payment.status];

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="font-bold text-white">
            {planNames[payment.plan_type] || payment.plan_type}
          </div>
          <div className="text-zinc-500 text-xs mt-1">
            {formatDate(payment.created_at)}
          </div>
        </div>
        <div className="text-right">
          <div className="font-extrabold text-white">
            KES {payment.amount.toLocaleString()}
          </div>
          <div className={`text-xs font-semibold mt-1 ${status.text}`}>
            {status.label}
          </div>
        </div>
      </div>

      {payment.mpesa_receipt_number && (
        <div className="bg-zinc-800 rounded-lg px-3 py-2 flex justify-between items-center">
          <span className="text-zinc-400 text-xs">M-Pesa Receipt</span>
          <span className="text-white text-sm font-mono">
            {payment.mpesa_receipt_number}
          </span>
        </div>
      )}
    </div>
  );
}