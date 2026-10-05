import { useState } from 'react';
import { useSearchParams } from 'react-router';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useRedemption, useRedemptions, useShop, useShopMutation } from '../api';
import type { Redemption, ShopCard, ShopSettings } from '../types';
import { bhutanDate, fromBhutanInput, operatorName, toBhutanInput } from '../utils';
import { supabase } from '@/lib/supabase';

const field = 'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm';
const errorToast = (error: Error) => toast.error(error.message);

function SettingsEditor({ settings }: { settings: ShopSettings }) {
  const [draft, setDraft] = useState(settings);
  const save = useShopMutation(async () => {
    const { data, error } = await supabase
      .from('shop_settings')
      .update({
        enabled: draft.enabled,
        starts_at: draft.starts_at,
        ends_at: draft.ends_at,
        nu_per_point: draft.nu_per_point,
        delivery_message: draft.delivery_message,
      })
      .eq('id', true)
      .eq('updated_at', settings.updated_at)
      .select('id');
    if (error) throw error;
    if (!data.length) throw new Error('Settings changed elsewhere. Refresh before saving.');
  });
  return (
    <form
      className="space-y-4 rounded-xl border bg-white p-5"
      onSubmit={(e) => {
        e.preventDefault();
        if (draft.enabled && (!draft.starts_at || !draft.ends_at))
          return toast.error('Set both promotion dates before enabling.');
        if (
          draft.starts_at &&
          draft.ends_at &&
          Date.parse(draft.ends_at) <= Date.parse(draft.starts_at)
        )
          return toast.error('End must be after start.');
        save.mutate(undefined, {
          onSuccess: () => toast.success('Promotion saved'),
          onError: errorToast,
        });
      }}
    >
      <h2 className="font-bold">Promotion settings</h2>
      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={draft.enabled}
          onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
        />
        Enable promotion (uncheck to pause)
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-sm">
          Starts (Bhutan time)
          <input
            className={field}
            type="datetime-local"
            value={toBhutanInput(draft.starts_at)}
            onChange={(e) => setDraft({ ...draft, starts_at: fromBhutanInput(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Ends (Bhutan time)
          <input
            className={field}
            type="datetime-local"
            value={toBhutanInput(draft.ends_at)}
            onChange={(e) => setDraft({ ...draft, ends_at: fromBhutanInput(e.target.value) })}
          />
        </label>
      </div>
      <label className="block text-sm">
        1 Migsel point equals Nu.
        <input
          className={field}
          type="number"
          min="0.0001"
          max="99999999"
          step="0.0001"
          required
          value={draft.nu_per_point}
          onChange={(e) => setDraft({ ...draft, nu_per_point: Number(e.target.value) })}
        />
      </label>
      <label className="block text-sm">
        Delivery message
        <input
          className={field}
          required
          maxLength={500}
          value={draft.delivery_message}
          onChange={(e) => setDraft({ ...draft, delivery_message: e.target.value })}
        />
      </label>
      <p className="text-xs text-gray-500">
        Rate changes apply to new rate-based requests. Fixed-price cards keep their own point cost.
        Accepted requests retain their original value.
      </p>
      <Button disabled={save.isPending}>Save promotion</Button>
    </form>
  );
}

function CardEditor({ card }: { card: ShopCard }) {
  const [draft, setDraft] = useState(card);
  const [packages, setPackages] = useState(card.package_amounts.join(', '));
  const save = useShopMutation(async () => {
    const amounts = packages.trim()
      ? [...new Set(packages.split(',').map((s) => Number(s.trim())))]
      : [];
    if (
      amounts.some((n) => !Number.isInteger(n) || n <= 0) ||
      (draft.recharge_type === 'data' && !amounts.length)
    )
      throw new Error('Enter positive whole package amounts separated by commas.');
    const { data, error } = await supabase
      .from('shop_cards')
      .update({
        title: draft.title,
        description: draft.description,
        operator: draft.operator,
        recharge_type: draft.recharge_type,
        enabled: draft.enabled,
        sort_order: draft.sort_order,
        pricing_mode: draft.pricing_mode,
        fixed_points: draft.fixed_points,
        fixed_nu: draft.fixed_nu,
        package_amounts: amounts,
        min_nu: draft.min_nu,
        max_nu: draft.max_nu,
      })
      .eq('id', card.id)
      .eq('updated_at', card.updated_at)
      .select('id');
    if (error) throw error;
    if (!data.length) throw new Error('Card changed elsewhere. Refresh before saving.');
  });
  return (
    <details className="rounded-xl border bg-white p-4">
      <summary className="cursor-pointer font-semibold">
        {card.title} · {card.enabled ? 'Enabled' : 'Disabled'}
      </summary>
      <form
        className="mt-4 grid gap-3 sm:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          save.mutate(undefined, {
            onSuccess: () => toast.success('Card saved'),
            onError: errorToast,
          });
        }}
      >
        <label className="text-sm">
          Title
          <input
            className={field}
            required
            maxLength={120}
            value={draft.title}
            onChange={(e) => setDraft({ ...draft, title: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Display order
          <input
            className={field}
            type="number"
            step="1"
            required
            value={draft.sort_order}
            onChange={(e) => setDraft({ ...draft, sort_order: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm sm:col-span-2">
          Description
          <input
            className={field}
            value={draft.description}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </label>
        <label className="text-sm">
          Operator
          <select
            className={field}
            value={draft.operator}
            onChange={(e) =>
              setDraft({ ...draft, operator: e.target.value as ShopCard['operator'] })
            }
          >
            <option value="bmobile">B-Mobile</option>
            <option value="tashicell">TashiCell</option>
          </select>
        </label>
        <label className="text-sm">
          Recharge type
          <select
            className={field}
            value={draft.recharge_type}
            onChange={(e) =>
              setDraft({ ...draft, recharge_type: e.target.value as ShopCard['recharge_type'] })
            }
          >
            <option value="data">Data</option>
            <option value="talktime">Talk time</option>
          </select>
        </label>
        <label className="text-sm sm:col-span-2">
          Pricing
          <select
            className={field}
            value={draft.pricing_mode}
            onChange={(e) =>
              setDraft({ ...draft, pricing_mode: e.target.value as ShopCard['pricing_mode'] })
            }
          >
            <option value="rate">Use promotion rate — user types points</option>
            <option value="fixed">Fixed card price</option>
          </select>
        </label>
        {draft.pricing_mode === 'fixed' && (
          <>
            <label className="text-sm">
              Point cost
              <input
                className={field}
                required
                type="number"
                min="1"
                step="1"
                value={draft.fixed_points ?? ''}
                onChange={(e) => setDraft({ ...draft, fixed_points: Number(e.target.value) })}
              />
            </label>
            <label className="text-sm">
              Recharge value (Nu.)
              <input
                className={field}
                required
                type="number"
                min="1"
                step="1"
                value={draft.fixed_nu ?? ''}
                onChange={(e) => setDraft({ ...draft, fixed_nu: Number(e.target.value) })}
              />
            </label>
          </>
        )}
        <label className="text-sm">
          Minimum recharge (Nu.)
          <input
            className={field}
            required
            type="number"
            min="1"
            step="1"
            value={draft.min_nu}
            onChange={(e) => setDraft({ ...draft, min_nu: Number(e.target.value) })}
          />
        </label>
        <label className="text-sm">
          Maximum recharge (Nu.)
          <input
            className={field}
            required
            type="number"
            min={draft.min_nu}
            step="1"
            value={draft.max_nu}
            onChange={(e) => setDraft({ ...draft, max_nu: Number(e.target.value) })}
          />
        </label>
        {draft.recharge_type === 'data' && (
          <label className="text-sm sm:col-span-2">
            Available package values (comma-separated Nu.)
            <input
              className={field}
              required
              value={packages}
              onChange={(e) => setPackages(e.target.value)}
            />
          </label>
        )}
        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={draft.enabled}
            onChange={(e) => setDraft({ ...draft, enabled: e.target.checked })}
          />
          Available in shop
        </label>
        <Button disabled={save.isPending}>Save card</Button>
      </form>
    </details>
  );
}

function RequestRow({ request }: { request: Redemption }) {
  const [reference, setReference] = useState('');
  const [note, setNote] = useState('');
  const [confirm, setConfirm] = useState<'delivered' | 'refunded' | null>(null);
  const update = useShopMutation(async (status: string) => {
    const { error } = await supabase.rpc('process_shop_recharge', {
      p_id: request.id,
      p_status: status,
      p_reference: reference,
      p_note: note,
    });
    if (error) throw error;
  });
  const act = (status: string) =>
    update.mutate(status, {
      onError: errorToast,
      onSuccess: () => {
        setConfirm(null);
        toast.success('Request updated');
      },
    });
  return (
    <article className="space-y-3 rounded-xl border bg-white p-4 text-sm">
      <div className="flex flex-wrap justify-between gap-2">
        <strong>
          {request.phone} · Nu. {request.amount_nu}{' '}
          {request.recharge_type === 'data' ? 'Data' : 'Talk time'}
        </strong>
        <span className="capitalize">{request.status}</span>
      </div>
      <p>
        {operatorName(request.operator)} · {request.points} points · {request.card_title}
      </p>
      <p className="text-xs break-all text-gray-500">
        {bhutanDate(request.created_at)} · {request.id}
      </p>
      {request.note && <p>{request.note}</p>}
      {request.bank_reference && <p>Bank reference: {request.bank_reference}</p>}
      {['pending', 'processing'].includes(request.status) && (
        <>
          <label className="block">
            Recharge transaction reference
            <input
              className={field}
              value={reference}
              onChange={(e) => setReference(e.target.value)}
            />
          </label>
          <label className="block">
            Message / refund reason (visible to requester)
            <input className={field} value={note} onChange={(e) => setNote(e.target.value)} />
          </label>
          {confirm ? (
            <div className="space-y-2 rounded-lg bg-amber-50 p-3">
              <p>
                {confirm === 'delivered'
                  ? 'Confirm the bank shows a successful recharge to this number. This will finalise delivery.'
                  : 'Confirm no recharge was delivered and no bank transaction is pending. Points will be returned once.'}
              </p>
              <Button disabled={update.isPending} onClick={() => act(confirm)}>
                Confirm {confirm === 'delivered' ? 'delivery' : 'refund'}
              </Button>
              <Button variant="ghost" disabled={update.isPending} onClick={() => setConfirm(null)}>
                Back
              </Button>
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {request.status === 'pending' && (
                <Button disabled={update.isPending} onClick={() => act('processing')}>
                  Start processing
                </Button>
              )}
              {request.status === 'processing' && (
                <Button
                  disabled={update.isPending || !reference.trim()}
                  onClick={() => setConfirm('delivered')}
                >
                  Mark delivered
                </Button>
              )}
              <Button
                variant="outline"
                disabled={update.isPending || !note.trim()}
                onClick={() => setConfirm('refunded')}
              >
                Cancel & refund
              </Button>
            </div>
          )}
        </>
      )}
    </article>
  );
}

export function ShopManagement() {
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request');
  const { data: profile } = useUserProfile();
  const isSuperadmin = profile?.role === 'super_admin';
  const shop = useShop();
  const [page, setPage] = useState(0);
  const [status, setStatus] = useState('pending');
  const requests = useRedemptions(true, isSuperadmin, page, status);
  const selectedRequest = useRedemption(requestId, isSuperadmin);
  if (!isSuperadmin) return <p>Shop management is available to superadmin only.</p>;
  return (
    <div className="space-y-6">
      {shop.isPending && <p>Loading shop settings…</p>}
      {shop.error && <p role="alert">{shop.error.message}</p>}
      {shop.data && (
        <>
          <SettingsEditor key={shop.data.settings.updated_at} settings={shop.data.settings} />
          <details className="rounded-xl border bg-white p-4">
            <summary className="cursor-pointer font-semibold">Mobile recharge settings</summary>
            <p className="my-3 text-sm text-gray-600">
              These four operator/type options power the single Mobile Recharge form. Open one to
              change available data packages, recharge limits, or pricing. Confirm availability in
              your recharge app before enabling the promotion.
            </p>
            <div className="space-y-3">
              {shop.data.cards.map((card) => (
                <CardEditor key={`${card.id}-${card.updated_at}`} card={card} />
              ))}
            </div>
          </details>
        </>
      )}
      <section className="space-y-3">
        <h2 className="font-bold">Recharge requests</h2>
        {requestId && (
          <div
            className="rounded-xl border border-green-200 bg-green-50 p-3"
            aria-label="Selected recharge request"
          >
            <h3 className="mb-2 font-semibold">Requested recharge</h3>
            {selectedRequest.isPending && <p>Loading request…</p>}
            {selectedRequest.error && <p role="alert">Could not load request.</p>}
            {!selectedRequest.isPending && !selectedRequest.error && !selectedRequest.data && (
              <p>This request is unavailable.</p>
            )}
            {selectedRequest.data && (
              <RequestRow
                key={`${selectedRequest.data.id}-${selectedRequest.data.status}`}
                request={selectedRequest.data}
              />
            )}
          </div>
        )}
        <label className="block text-sm">
          Status
          <select
            className={field}
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(0);
            }}
          >
            {['pending', 'processing', 'delivered', 'refunded', 'all'].map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </label>
        {requests.isPending && <p>Loading requests…</p>}
        {requests.error && <p role="alert">{requests.error.message}</p>}
        {requests.data?.rows.length === 0 && (
          <p className="text-sm text-gray-500">No requests with this status.</p>
        )}
        {requests.data?.rows.map((request) => (
          <RequestRow key={`${request.id}-${request.status}`} request={request} />
        ))}
        <div className="flex gap-2">
          <Button variant="outline" disabled={page === 0} onClick={() => setPage(page - 1)}>
            Previous
          </Button>
          <Button
            variant="outline"
            disabled={(page + 1) * 20 >= (requests.data?.count ?? 0)}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </section>
    </div>
  );
}
