import { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { ArrowLeft, ShoppingBag, Lock, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Pagination } from '@/components/ui/pagination';
import { MapDock } from '@/components/layout/map-dock';
import { FloatingChat } from '@/features/chatbot/components/floating-chat';
import { useSession } from '@/features/auth/api/use-session';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useShop, useShopMutation, useWallet } from '@/features/shop/api';
import {
  normalizePhone,
  operatorName,
  rechargeAmount,
  validateRecharge,
} from '@/features/shop/utils';
import type { ShopCard, ShopSettings } from '@/features/shop/types';
import { supabase } from '@/lib/supabase';
import { RecentRewards } from '@/features/shop/components/recent-rewards';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { ITEMS } from '@/features/shop/shop-items';

const ITEMS_PER_PAGE = 3;
const field = 'mt-1 w-full rounded-lg border bg-white px-3 py-2 text-sm';

export function RechargeForm({
  cards,
  settings,
  balance,
  onClose,
}: {
  cards: ShopCard[];
  settings: ShopSettings;
  balance: number;
  onClose: () => void;
}) {
  const [operator, setOperator] = useState<ShopCard['operator']>('bmobile');
  const [rechargeType, setRechargeType] = useState<ShopCard['recharge_type']>('data');
  const [points, setPoints] = useState('');
  const [phone, setPhone] = useState('');
  const [review, setReview] = useState(false);
  const [requestId] = useState(() => crypto.randomUUID());
  const [attempted, setAttempted] = useState(false);
  const card = cards.find(
    (item) => item.operator === operator && item.recharge_type === rechargeType && item.enabled,
  );
  const cost = Number(points);
  const amount = card ? rechargeAmount(cost, card, settings.nu_per_point) : 0;
  const validation = card
    ? validateRecharge(cost, phone, card, settings.nu_per_point, balance)
    : 'This recharge option is unavailable.';
  const mutation = useShopMutation(async () => {
    if (!card) throw new Error('This recharge option is unavailable.');
    const { error } = await supabase.rpc('request_shop_recharge', {
      p_id: requestId,
      p_card_id: card.id,
      p_points: cost,
      p_phone: normalizePhone(phone),
      p_public_display: true,
      p_settings_version: settings.updated_at,
      p_card_version: card.updated_at,
    });
    if (error) throw error;
  });

  return (
    <section
      className="rounded-xl border border-green-200 bg-green-50 p-5"
      aria-label="Recharge request"
    >
      <h2 className="mb-3 text-lg font-bold">
        {review ? 'Confirm your recharge' : 'Mobile Recharge'}
      </h2>
      {review ? (
        <div className="space-y-3 text-sm">
          <p>
            <strong>{normalizePhone(phone)}</strong> · {operatorName(operator)}
          </p>
          <p>
            {cost} points →{' '}
            <strong>
              Nu. {amount} {rechargeType === 'data' ? 'data package' : 'talk time'}
            </strong>
          </p>
          <p>{settings.delivery_message}</p>
          <p>
            Check the recipient number carefully. Points are deducted on submission. Your total
            earned points stay unchanged.
          </p>
          <p>
            When delivered, this reward will appear in Recent rewards delivered with the phone
            number masked. Your full number and account remain private.
          </p>
          {mutation.error && (
            <p role="alert" className="text-red-700">
              {mutation.error.message} If the result is uncertain, retry this same request or check
              My recharges before starting another.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <Button
              disabled={mutation.isPending}
              onClick={() => {
                setAttempted(true);
                mutation.mutate(undefined, {
                  onSuccess: () => {
                    toast.success('Recharge requested');
                    onClose();
                  },
                });
              }}
            >
              {mutation.isPending
                ? 'Submitting…'
                : attempted
                  ? 'Retry same request'
                  : 'Confirm redemption'}
            </Button>
            {!attempted && (
              <Button variant="outline" onClick={() => setReview(false)}>
                Edit
              </Button>
            )}
            <Button variant="ghost" disabled={mutation.isPending} onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : (
        <form
          className="space-y-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!validation) setReview(true);
          }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Operator
              <select
                className={field}
                value={operator}
                onChange={(e) => {
                  setOperator(e.target.value as ShopCard['operator']);
                  setPoints('');
                }}
              >
                <option value="bmobile">B-Mobile</option>
                <option value="tashicell">TashiCell</option>
              </select>
            </label>
            <label className="text-sm">
              Recharge type
              <select
                className={field}
                value={rechargeType}
                onChange={(e) => {
                  setRechargeType(e.target.value as ShopCard['recharge_type']);
                  setPoints('');
                }}
              >
                <option value="data">Data</option>
                <option value="talktime">Talk time</option>
              </select>
            </label>
          </div>
          <label className="block text-sm">
            Recipient mobile number
            <input
              className={field}
              type="tel"
              autoComplete="tel"
              placeholder="+975 17XXXXXX"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Points to redeem
            <input
              className={field}
              type="number"
              min="1"
              step="1"
              required
              value={points}
              disabled={card?.pricing_mode === 'fixed'}
              onChange={(e) => setPoints(e.target.value)}
            />
          </label>
          {card?.pricing_mode === 'fixed' && (
            <Button
              variant="outline"
              type="button"
              onClick={() => setPoints(String(card.fixed_points))}
            >
              Use card price: {card.fixed_points} points
            </Button>
          )}
          {rechargeType === 'data' && card && (
            <div className="text-sm">
              <p className="mb-2">Available package values (Nu.)</p>
              <div className="flex flex-wrap gap-2">
                {card.package_amounts.map((value) => {
                  const required = (value * 10000) / Math.round(settings.nu_per_point * 10000);
                  return (
                    <button
                      type="button"
                      key={value}
                      disabled={card.pricing_mode === 'fixed' || !Number.isInteger(required)}
                      className="rounded border bg-white px-2 py-1 disabled:opacity-40"
                      onClick={() => setPoints(String(required))}
                    >
                      {value}
                    </button>
                  );
                })}
              </div>
              <a
                className="mt-2 inline-block underline"
                href={
                  operator === 'bmobile'
                    ? 'https://www.bt.bt/mobile/prepaid/'
                    : 'https://www.tashicell.com/mobile-services/prepaid-data-plans'
                }
                target="_blank"
                rel="noreferrer"
              >
                View operator plans
              </a>
            </div>
          )}
          <p className="font-semibold">
            {points ? `${cost} points → Nu. ${amount}` : 'Enter points to preview your recharge'}
          </p>
          {card && (
            <p className="text-xs text-gray-600">
              Supported value: Nu. {card.min_nu}–{card.max_nu}. Prepaid numbers only.
            </p>
          )}
          <p className="text-xs text-gray-600">
            Delivered rewards appear in Recent rewards delivered with masked phone numbers. Full
            numbers and account details are never public.
          </p>
          {points && validation && (
            <p role="alert" className="text-sm text-red-700">
              {validation}
            </p>
          )}
          <div className="flex gap-2">
            <Button disabled={!!validation}>Review request</Button>
            <Button type="button" variant="ghost" onClick={onClose}>
              Cancel
            </Button>
          </div>
        </form>
      )}
    </section>
  );
}

export function ShopPage() {
  const navigate = useNavigate();
  const shop = useShop();
  const { data: session } = useSession();
  const { data: profile } = useUserProfile();
  const wallet = useWallet();
  const [currentPage, setCurrentPage] = useState(1);
  const items = [
    {
      slug: 'mobile-recharge',
      icon: Smartphone,
      title: 'Mobile Recharge',
      description: 'Redeem points for B-Mobile or TashiCell data and talk time',
      cost: null,
    },
    ...ITEMS,
  ];
  const totalPages = Math.ceil(items.length / ITEMS_PER_PAGE);
  const paginatedItems = items.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE,
  );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      <main className="mx-auto max-w-2xl px-3 py-4 pb-24 sm:px-4 sm:py-6 sm:pb-24">
        <div className="mb-4 flex flex-wrap items-center gap-2 sm:mb-6 sm:flex-nowrap sm:justify-between">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate(-1)}
            className="-ml-2 text-gray-600 sm:ml-0"
          >
            <ArrowLeft className="mr-1 h-4 w-4" />
            Back
          </Button>
          {session && (
            <div className="ml-auto rounded-xl border bg-white px-3 py-1.5 shadow-sm sm:px-4 sm:py-2">
              <p className="text-[10px] font-bold tracking-wide text-gray-400 uppercase">
                Redeemable · Total earned
              </p>
              <p className="text-sm font-bold text-gray-900">
                {wallet.data === undefined ? '—' : Math.max(0, wallet.data)} ·{' '}
                {profile?.points ?? '—'}
              </p>
            </div>
          )}
          {!session && (
            <Link to="/" className="ml-auto text-sm font-semibold underline">
              Sign in to redeem
            </Link>
          )}
        </div>

        <div className="mb-5 text-center sm:mb-6">
          <div className="from-primary/80 to-primary mx-auto mb-2 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg sm:h-16 sm:w-16">
            <ShoppingBag className="h-7 w-7 text-white sm:h-8 sm:w-8" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 sm:text-2xl">Points Shop</h1>
          <p className="mt-1 text-xs text-gray-500 sm:text-sm">
            Redeem your points for city services and partner rewards
          </p>
        </div>

        {shop.error && (
          <p role="alert" className="mb-4 text-red-700">
            Shop unavailable: {shop.error.message}
          </p>
        )}
        <div className="space-y-3 sm:space-y-4">
          {paginatedItems.map((item) => {
            const Icon = item.icon;
            const isRecharge = item.cost === null;
            return (
              <div
                key={item.title}
                className="relative cursor-pointer overflow-hidden rounded-xl border bg-white p-4 shadow-sm transition-all hover:border-green-300 hover:shadow-md sm:p-5"
                role="link"
                tabIndex={0}
                aria-label={`View ${item.title}`}
                onClick={() => navigate(`/shop/${item.slug}`)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    navigate(`/shop/${item.slug}`);
                  }
                }}
              >
                {!isRecharge && (
                  <div className="absolute top-0 right-0 flex items-center gap-1 rounded-bl-lg bg-amber-100 px-2 py-1 text-[10px] font-bold tracking-wider text-amber-700 uppercase sm:px-2.5">
                    <Lock className="h-3 w-3" />
                    Coming Soon
                  </div>
                )}
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 sm:h-12 sm:w-12">
                    <Icon className="h-5 w-5 text-green-600 sm:h-6 sm:w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="text-sm font-bold text-gray-900 sm:text-base">{item.title}</h3>
                    <p className="mt-0.5 text-xs text-gray-500 sm:text-sm">{item.description}</p>
                    <div className="mt-3 flex flex-wrap items-center gap-2">
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2.5 py-1 text-xs font-bold text-green-700 sm:px-3">
                        <ShoppingBag className="h-3 w-3" />
                        {isRecharge ? (
                          `${shop.data?.settings.nu_per_point ?? 1} Nu./point`
                        ) : (
                          <>
                            <span className="blur-sm select-none" aria-hidden="true">
                              {item.cost}
                            </span>
                            <span className="sr-only">{item.cost}</span> points
                          </>
                        )}
                      </span>
                      <span className="inline-flex rounded-md bg-green-600 px-3 py-1.5 text-xs font-bold text-white">
                        View details
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        <div className="mt-6">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            totalItems={items.length}
            itemsPerPage={ITEMS_PER_PAGE}
            onPageChange={setCurrentPage}
          />
        </div>
        <RecentRewards />
      </main>
      {session && (
        <>
          <div className="fixed right-4 bottom-24 z-40">
            <FloatingChat />
          </div>
          <MapDock />
          <NotificationBell />
        </>
      )}
    </div>
  );
}
