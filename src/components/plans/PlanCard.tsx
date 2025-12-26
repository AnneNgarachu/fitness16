'use client';

export interface Plan {
  id: string;
  name: string;
  price: number;
  days: number;
  plan_type: string;
  popular?: boolean;
  save?: string;
}

interface PlanCardProps {
  plan: Plan;
  onSelect: (plan: Plan) => void;
  isSelected?: boolean;
}

export function PlanCard({ plan, onSelect, isSelected }: PlanCardProps) {
  return (
    <div
      className={`
        relative rounded-2xl p-4 transition-all cursor-pointer
        ${plan.popular 
          ? 'bg-linear-to-br from-orange-500/10 to-pink-500/10 border-2 border-orange-500' 
          : isSelected
            ? 'bg-zinc-800 border-2 border-orange-500'
            : 'bg-zinc-900 border border-zinc-800 hover:border-zinc-700'
        }
      `}
      onClick={() => onSelect(plan)}
    >
      {/* Popular badge */}
      {plan.popular && (
        <div className="absolute -top-3 right-4 bg-linear-to-r from-orange-500 to-pink-500 px-3 py-1 rounded-full text-[10px] font-bold text-white">
          MOST POPULAR
        </div>
      )}

      {/* Save badge */}
      {plan.save && !plan.popular && (
        <div className="absolute -top-3 right-4 bg-green-500 px-3 py-1 rounded-full text-[10px] font-bold text-white">
          SAVE {plan.save}
        </div>
      )}

      <div className="flex justify-between items-center mb-3">
        <div>
          <div className="font-bold text-white text-base">{plan.name}</div>
          <div className="text-zinc-500 text-xs">{plan.days} days</div>
        </div>
        <div className="text-right">
          <div className="text-xl font-extrabold text-white">
            KES {plan.price.toLocaleString()}
          </div>
          {plan.days > 1 && (
            <div className="text-zinc-500 text-[10px]">
              KES {Math.round(plan.price / plan.days)}/day
            </div>
          )}
        </div>
      </div>

      {/* Selection indicator */}
      <div className="flex items-center justify-between">
        <div className={`
          w-5 h-5 rounded-full border-2 flex items-center justify-center
          ${isSelected 
            ? 'border-orange-500 bg-orange-500' 
            : 'border-zinc-600'
          }
        `}>
          {isSelected && (
            <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
            </svg>
          )}
        </div>
        <button
          className={`
            px-4 py-2 rounded-lg text-sm font-bold transition-all
            ${plan.popular || isSelected
              ? 'bg-linear-to-r from-orange-500 to-pink-500 text-white'
              : 'bg-zinc-800 text-white hover:bg-zinc-700'
            }
          `}
          onClick={(e) => {
            e.stopPropagation();
            onSelect(plan);
          }}
        >
          Select
        </button>
      </div>
    </div>
  );
}