import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router';
import { ArrowLeft, Lock, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { MapDock } from '@/components/layout/map-dock';
import { FloatingChat } from '@/features/chatbot/components/floating-chat';
import { useSession } from '@/features/auth/api/use-session';
import { useUserProfile } from '@/features/gamification/api/use-user-profile';
import { useRedemption, useRedemptions, useShop, useWallet } from '@/features/shop/api';
import { NotificationBell } from '@/features/notifications/components/notification-bell';
import { bhutanDate, promotionOpen } from '@/features/shop/utils';
import { RechargeForm } from './shop-page';
import { ITEMS } from '@/features/shop/shop-items';

export function ShopDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const requestId = searchParams.get('request');
  const { data: session } = useSession();
  const { data: profile } = useUserProfile();
  const wallet = useWallet();
  const shop = useShop();
  const [historyPage, setHistoryPage] = useState(0);
  const history = useRedemptions(false, true, historyPage);
  const selectedRequest = useRedemption(requestId, !!session && slug === 'mobile-recharge');
  const [showForm, setShowForm] = useState(true);
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const item = ITEMS.find((entry) => entry.slug === slug);
  const recharge = slug === 'mobile-recharge';
  const open = shop.data ? promotionOpen(shop.data.settings, now) : false;

  if (!recharge && !item)
    return (
      <div className="mx-auto max-w-2xl px-4 py-8">
        <Link className="underline" to="/shop">
          ← Back to shop
        </Link>
        <h1 className="mt-6 text-xl font-bold">Reward not found</h1>
      </div>
    );

  return (
    <div className="min-h-dvh bg-gradient-to-b from-gray-50 to-white">
      <main className="mx-auto max-w-2xl space-y-5 px-4 py-6 pb-28">
        <Link
          className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
          to="/shop"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to shop
        </Link>
        <div className="rounded-xl border bg-white p-5 shadow-sm">
          <div className="mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-green-50">
            {recharge ? (
              <Smartphone className="h-6 w-6 text-green-600" />
            ) : (
              item && <item.icon className="h-6 w-6 text-green-600" />
            )}
          </div>
          <h1 className="text-xl font-bold">{recharge ? 'Mobile Recharge' : item?.title}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {recharge
              ? 'Redeem points for B-Mobile or TashiCell data and talk time'
              : item?.description}
          </p>
        </div>
        {!recharge ? (
          <section
            className="rounded-xl border border-amber-200 bg-amber-50 p-5"
            aria-label="Coming soon"
          >
            <h2 className="flex items-center gap-2 font-bold text-amber-800">
              <Lock className="h-5 w-5" />
              Coming soon
            </h2>
            <p className="mt-2 text-sm text-amber-900">
              This reward is not available for redemption yet. Check the shop for updates.
            </p>
          </section>
        ) : (
          <>
            {session ? (
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-gray-500">Redeemable points</p>
                  <p className="text-xl font-bold">
                    {wallet.data === undefined ? '—' : Math.max(0, wallet.data)}
                  </p>
                </div>
                <div className="rounded-xl border bg-white p-4">
                  <p className="text-gray-500">Total earned</p>
                  <p className="text-xl font-bold">{profile?.points ?? '—'}</p>
                </div>
              </div>
            ) : (
              <Link
                className="block rounded-xl border bg-white p-4 text-sm font-semibold underline"
                to="/"
              >
                Sign in to redeem points
              </Link>
            )}
            {wallet.error && (
              <p role="alert" className="text-red-700">
                Could not load redeemable points: {wallet.error.message}
              </p>
            )}
            {shop.error && (
              <p role="alert" className="text-red-700">
                Shop unavailable: {shop.error.message}
              </p>
            )}
            {shop.data && (
              <section className="rounded-xl border bg-white p-4 text-sm">
                <p className="font-bold">
                  {open ? 'Recharge promotion open' : 'Recharge promotion currently closed'}
                </p>
                <p>
                  1 Migsel point = Nu. {shop.data.settings.nu_per_point} on rate-based recharge.
                </p>
                {shop.data.settings.starts_at && shop.data.settings.ends_at && (
                  <p className="mt-1 text-gray-600">
                    {bhutanDate(shop.data.settings.starts_at)} –{' '}
                    {bhutanDate(shop.data.settings.ends_at)} (Bhutan time)
                  </p>
                )}
                <p className="mt-1">{shop.data.settings.delivery_message}</p>
              </section>
            )}
            {session &&
              open &&
              shop.data &&
              wallet.data !== undefined &&
              (showForm ? (
                <RechargeForm
                  key={session.user.id}
                  cards={shop.data.cards}
                  settings={shop.data.settings}
                  balance={wallet.data}
                  onClose={() => setShowForm(false)}
                />
              ) : (
                <Button onClick={() => setShowForm(true)}>Request another recharge</Button>
              ))}
            {session && requestId && (
              <section
                className="rounded-xl border border-green-200 bg-green-50 p-4 text-sm"
                aria-label="Selected recharge request"
              >
                <h2 className="font-bold">Recharge request</h2>
                {selectedRequest.isPending && <p>Loading request…</p>}
                {selectedRequest.error && <p role="alert">Could not load request.</p>}
                {!selectedRequest.isPending && !selectedRequest.error && !selectedRequest.data && (
                  <p>This request is unavailable.</p>
                )}
                {selectedRequest.data && (
                  <>
                    <p className="mt-2 font-semibold">
                      Nu. {selectedRequest.data.amount_nu}{' '}
                      {selectedRequest.data.recharge_type === 'data' ? 'Data' : 'Talk time'} ·{' '}
                      {selectedRequest.data.status}
                    </p>
                    <p>
                      {selectedRequest.data.phone} · {selectedRequest.data.points} points
                    </p>
                    <p className="text-gray-600">
                      Requested {bhutanDate(selectedRequest.data.created_at)}
                    </p>
                    {selectedRequest.data.note && <p>{selectedRequest.data.note}</p>}
                  </>
                )}
              </section>
            )}
            {session && (
              <section className="rounded-xl border bg-white p-4">
                <h2 className="mb-3 font-bold">My recharges</h2>
                {history.isPending && <p className="text-sm">Loading requests…</p>}
                {history.error && <p role="alert">{history.error.message}</p>}
                {history.data?.rows.length === 0 && (
                  <p className="text-sm text-gray-500">Your recharge requests will appear here.</p>
                )}
                <div className="divide-y">
                  {history.data?.rows.map((request) => (
                    <div key={request.id} className="py-3 text-sm">
                      <div className="flex justify-between gap-2">
                        <strong>
                          Nu. {request.amount_nu}{' '}
                          {request.recharge_type === 'data' ? 'Data' : 'Talk time'}
                        </strong>
                        <span className="capitalize">{request.status}</span>
                      </div>
                      <p>
                        {request.phone} · {request.points} points
                      </p>
                      <p className="text-xs text-gray-500">
                        {bhutanDate(request.created_at)} · {request.id}
                      </p>
                      {request.note && <p>{request.note}</p>}
                    </div>
                  ))}
                </div>
                <div className="mt-3 flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={historyPage === 0}
                    onClick={() => setHistoryPage(historyPage - 1)}
                  >
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={(historyPage + 1) * 20 >= (history.data?.count ?? 0)}
                    onClick={() => setHistoryPage(historyPage + 1)}
                  >
                    Next
                  </Button>
                </div>
              </section>
            )}
            <p className="text-center text-xs text-gray-500">
              We never ask for passwords, banking PINs, or account access. Unspent points stay in
              your account after the promotion closes.
            </p>
          </>
        )}
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
