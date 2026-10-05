import { Gift } from 'lucide-react';
import { useDeliveries } from '@/features/shop/api';
import { bhutanDate, operatorName } from '@/features/shop/utils';

/** Reward announcements have a shared presentation, regardless of reward category. */
export function RecentRewards() {
  const { data: deliveries, error } = useDeliveries();

  return (
    <aside
      className="mt-6 rounded-xl border border-amber-300 bg-yellow-50 p-4 text-amber-950"
      aria-label="Rewards delivered"
    >
      <h2 className="mb-3 flex items-center gap-2 font-bold">
        <Gift className="h-5 w-5" />
        Recent rewards delivered
      </h2>
      {error ? (
        <p className="text-sm">Recent deliveries are temporarily unavailable.</p>
      ) : deliveries?.length ? (
        <ul className="max-h-48 space-y-3 overflow-y-auto">
          {deliveries.map((item, index) => (
            <li key={`${item.delivered_at}-${index}`} className="text-sm">
              <strong>{item.recipient_label ?? item.masked_phone ?? 'Migsel member'}</strong>{' '}
              received{' '}
              <strong>
                {item.reward_label ??
                  `Nu. ${item.amount_nu} ${item.recharge_type === 'data' ? 'Data' : 'Talk time'}`}
              </strong>
              <p className="text-xs text-amber-800">
                {item.operator ? `${operatorName(item.operator)} · ` : ''}
                {bhutanDate(item.delivered_at)}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm">Delivered rewards will appear here with recipient details masked.</p>
      )}
    </aside>
  );
}
