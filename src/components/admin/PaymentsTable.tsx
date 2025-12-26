'use client';

interface Payment {
  id: string;
  member_name: string;
  amount: number;
  plan_type: string;
  mpesa_receipt_number: string | null;
  status: string;
  created_at: string;
}

interface PaymentsTableProps {
  payments: Payment[];
}

export function PaymentsTable({ payments }: PaymentsTableProps) {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return `Today, ${date.toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString('en-KE', { month: 'short', day: 'numeric' });
  };

  const planNames: Record<string, string> = {
    day: 'Day Pass',
    week: 'Weekly',
    month: 'Monthly',
    quarterly: 'Quarterly',
    semi_annual: 'Semi-Annual',
    annual: 'Annual',
  };

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden">
      <table className="w-full">
        <thead>
          <tr className="border-b border-zinc-800">
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Member</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Plan</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Amount</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">M-Pesa Code</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Status</th>
            <th className="text-left px-4 py-3 text-zinc-400 font-semibold text-sm">Date</th>
          </tr>
        </thead>
        <tbody>
          {payments.length === 0 ? (
            <tr>
              <td colSpan={6} className="px-4 py-8 text-center text-zinc-500">
                No payments found
              </td>
            </tr>
          ) : (
            payments.map((payment) => (
              <tr key={payment.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                <td className="px-4 py-3 text-white font-medium">{payment.member_name}</td>
                <td className="px-4 py-3 text-zinc-300 text-sm">
                  {planNames[payment.plan_type] || payment.plan_type}
                </td>
                <td className="px-4 py-3 text-green-400 font-semibold">
                  KES {payment.amount.toLocaleString()}
                </td>
                <td className="px-4 py-3 text-zinc-300 text-sm font-mono">
                  {payment.mpesa_receipt_number || '-'}
                </td>
                <td className="px-4 py-3">
                  {payment.status === 'completed' ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-500/20 text-green-400">
                      Paid
                    </span>
                  ) : payment.status === 'pending' ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-yellow-500/20 text-yellow-400">
                      Pending
                    </span>
                  ) : (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-500/20 text-red-400">
                      Failed
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-zinc-400 text-sm">{formatDate(payment.created_at)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}