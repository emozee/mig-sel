// Isolated PostgreSQL smoke test. Pass an installed @electric-sql/pglite entry
// as argv[2], or install it outside the application and resolve it there.
// This verifies the shop migration against minimal existing schema fixtures;
// run Supabase integration tests as well before a production rollout.
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const { PGlite } = await import(
  process.argv[2] ? pathToFileURL(process.argv[2]).href : '@electric-sql/pglite'
);
const db = new PGlite();
const user = '00000000-0000-0000-0000-000000000001';
const admin = '00000000-0000-0000-0000-000000000002';
const other = '00000000-0000-0000-0000-000000000003';
let assertions = 0;
const equal = (a, b) => {
  assert.deepEqual(a, b);
  assertions++;
};
const scalar = async (sql, args = []) => Object.values((await db.query(sql, args)).rows[0])[0];
const rejects = async (action, pattern) => {
  await assert.rejects(action, pattern);
  assertions++;
};
const asUser = async (id, role = 'authenticated') => {
  await db.exec('reset role');
  await db.query("select set_config('request.jwt.claim.sub',$1,false)", [id]);
  await db.exec(`set role ${role}`);
};

try {
  await db.exec(`
    create role anon; create role authenticated; create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub',true),'')::uuid
    $$;
    grant usage on schema auth,public to anon,authenticated;
    create table auth.users(id uuid primary key);
    create table public.profiles(id uuid primary key, points integer default 0, role text);
    create table public.grievances(id uuid primary key,reporter_id uuid,bonus_awarded integer default 0,approved boolean,status text default 'pending',resolved_at timestamptz);
    create table public.diamonds(id bigint primary key, user_id uuid, linked_grievance_id uuid, status text default 'pending');
    create function public.is_admin_or_super_admin() returns boolean language sql security definer as $$
      select exists(select 1 from public.profiles where id=auth.uid() and role in ('admin','super_admin'))
    $$;
    create table public.notifications(
      id bigint generated always as identity primary key,
      user_id uuid not null references auth.users(id),
      type text not null,
      title text not null,
      body text not null,
      href text,
      entity_type text,
      entity_id text,
      metadata jsonb not null default '{}'::jsonb,
      read_at timestamptz,
      created_at timestamptz not null default now(),
      constraint notifications_type_check check(type in ('report_submitted','report_approved','report_status','report_rejected','report_removed','diamond_comment','diamond_status','announcement'))
    );
    alter table public.notifications enable row level security;
    grant select on public.notifications to authenticated;
    create policy own_notifications on public.notifications for select to authenticated using (user_id = auth.uid());
    insert into auth.users values ('${user}'),('${admin}'),('${other}');
    insert into public.profiles values ('${user}',1000,'user'),('${admin}',0,'super_admin'),('${other}',10,'user');
  `);
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261004000001_recharge_shop.sql', import.meta.url),
      'utf8',
    ),
  );
  const legacy = '10000000-0000-0000-0000-000000000010';
  await db.query(
    `insert into shop_redemptions(id,user_id,card_id,card_title,operator,recharge_type,phone,points,amount_nu,rate,pricing_mode,status,public_display,delivered_at)
     select $1,$2,id,title,operator,recharge_type,'+97577123456',99,99,1,'rate','delivered',false,now()-interval '1 day'
     from shop_cards where operator='tashicell' and recharge_type='data'`,
    [legacy, admin],
  );
  await db.exec(
    await readFile(
      new URL(
        '../supabase/migrations/20261005000001_announce_all_delivered_rewards.sql',
        import.meta.url,
      ),
      'utf8',
    ),
  );
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261005000002_shop_notifications.sql', import.meta.url),
      'utf8',
    ),
  );
  await db.exec("insert into shop_cards(title,operator,recharge_type,enabled) values ('New recharge reward','bmobile','talktime',false)");
  await db.exec(
    await readFile(
      new URL('../supabase/migrations/20261005000003_remove_unused_recharge_card.sql', import.meta.url),
      'utf8',
    ),
  );
  equal(await scalar("select count(*)::int from shop_cards where title='New recharge reward'"), 0);
  equal(await scalar('select count(*)::int from shop_cards'), 4);
  equal(await scalar('select public_display from shop_redemptions where id=$1', [legacy]), true);
  equal(await scalar('select balance from point_wallets where user_id=$1', [user]), 1000);
  equal(await scalar("select count(*)::int from point_transactions where kind='opening'"), 3);
  const card = await scalar(
    "select id from shop_cards where operator='bmobile' and recharge_type='data'",
  );
  const talk = await scalar(
    "select id from shop_cards where operator='bmobile' and recharge_type='talktime'",
  );
  await asUser(admin);
  await db.exec(
    "update shop_settings set enabled=true,starts_at=now()-interval '1 day',ends_at=now()+interval '1 day'",
  );
  const request = async (
    id,
    points = 99,
    selected = card,
    settingsVersion,
    phone = '+97517123456',
  ) => {
    const settings =
      settingsVersion ?? (await scalar('select updated_at::text from shop_settings'));
    const version = await scalar('select updated_at::text from shop_cards where id=$1', [selected]);
    return db.query('select request_shop_recharge($1,$2,$3,$4,false,$5,$6)', [
      id,
      selected,
      points,
      phone,
      settings,
      version,
    ]);
  };
  const one = '10000000-0000-0000-0000-000000000001';
  const two = '10000000-0000-0000-0000-000000000002';
  const three = '10000000-0000-0000-0000-000000000003';
  await asUser(user);
  await request(one);
  equal(await scalar('select balance from point_wallets'), 901);
  equal(await scalar('select public_display from shop_redemptions where id=$1', [one]), true);
  equal(await scalar("select count(*)::int from notifications where type='shop_status'"), 1);
  equal(
    await scalar('select href from notifications where entity_id=$1', [one]),
    `/shop/mobile-recharge?request=${one}`,
  );
  await request(one);
  equal(await scalar('select balance from point_wallets'), 901);
  equal(await scalar("select count(*)::int from notifications where type='shop_status'"), 1);
  equal(await scalar("select count(*)::int from point_transactions where kind='redemption'"), 1);
  await rejects(() => request(two, 50), /available data package/);
  await rejects(() => request(two, 999), /Not enough/);
  await rejects(() => request(two, 99, card, undefined, '+97577123456'), /valid mobile/);
  await rejects(() => db.exec('update point_wallets set balance=999999'), /permission denied/);
  await rejects(
    () => db.query("select process_shop_recharge($1,'processing')", [one]),
    /Only superadmin/,
  );
  await db.exec('update shop_settings set nu_per_point=10'); // RLS matches no rows
  equal(Number(await scalar('select nu_per_point from shop_settings')), 1);
  await asUser(other);
  equal(await scalar('select count(*)::int from shop_redemptions'), 0);
  equal(await scalar('select balance from point_wallets'), 10);
  equal(await scalar('select count(*)::int from notifications'), 0);
  await asUser(admin);
  equal(
    await scalar(
      "select count(*)::int from notifications where type='shop_request' and entity_id=$1",
      [one],
    ),
    1,
  );
  equal(
    await scalar("select href from notifications where type='shop_request' and entity_id=$1", [
      one,
    ]),
    `/dashboard?view=shop&request=${one}`,
  );
  await db.query("select process_shop_recharge($1,'processing')", [one]);
  await db.query("select process_shop_recharge($1,'delivered','RECHARGE-123')", [one]);
  await db.query("select process_shop_recharge($1,'delivered','RECHARGE-123')", [one]);
  await asUser(user);
  equal(
    await scalar(
      "select count(*)::int from notifications where type='shop_status' and entity_id=$1",
      [one],
    ),
    3,
  );
  equal(await scalar("select count(*)::int from notifications where body like '%17123456%'"), 0);
  await asUser(admin);
  await rejects(
    () => db.query("select process_shop_recharge($1,'refunded','','test')", [one]),
    /already finalised/,
  );
  await asUser('', 'anon');
  const publicRows = (await db.query('select * from shop_recent_deliveries()')).rows;
  equal(publicRows.length, 2);
  equal(publicRows[0].masked_phone, '+975 17••••••');
  equal(publicRows[1].masked_phone, '+975 77••••••');
  equal(Object.keys(publicRows[0]).sort(), [
    'amount_nu',
    'delivered_at',
    'masked_phone',
    'operator',
    'recharge_type',
  ]);
  await rejects(() => db.exec('select * from shop_redemptions'), /permission denied/);
  await rejects(() => db.exec('select * from point_wallets'), /permission denied/);
  await asUser(user);
  await request(two, 50, talk);
  await asUser(admin);
  await db.query("select process_shop_recharge($1,'refunded','','Unavailable')", [two]);
  await db.query("select process_shop_recharge($1,'refunded','','Unavailable')", [two]);
  await asUser(user);
  equal(await scalar('select balance from point_wallets'), 901);
  equal(await scalar("select count(*)::int from point_transactions where kind='refund'"), 1);
  const stale = await scalar('select updated_at::text from shop_settings');
  await asUser(admin);
  await db.exec('update shop_settings set nu_per_point=0.1');
  await asUser(user);
  await rejects(() => request(three, 190, card, stale), /settings changed/);
  await rejects(() => request(three, 191), /whole Ngultrum/);
  await request(three, 190);
  equal(await scalar('select amount_nu from shop_redemptions where id=$1', [three]), 19);
  await asUser(admin);
  await db.exec("update shop_settings set ends_at=now()-interval '1 hour'");
  await asUser(user);
  await rejects(() => request('10000000-0000-0000-0000-000000000004', 190), /not open/);
  // A successful request can still be safely retried after expiry.
  await request(three, 190);
  await db.exec('reset role');
  equal(await scalar('select points from profiles where id=$1', [user]), 1000);
  await db.query('update profiles set points=points+10 where id=$1', [user]);
  equal(await scalar('select balance from point_wallets where user_id=$1', [user]), 721);
  await db.query('update profiles set points=0 where id=$1', [user]);
  equal(await scalar('select balance from point_wallets where user_id=$1', [user]), -289);
  // Real-value fixed cards ignore the global rate, while still enforcing packages.
  await db.query('update profiles set points=1000 where id=$1', [user]);
  await asUser(admin);
  await db.exec(
    "update shop_settings set ends_at=now()+interval '1 day'; update shop_cards set pricing_mode='fixed',fixed_points=20,fixed_nu=99 where recharge_type='data'",
  );
  await asUser(user);
  const four = '10000000-0000-0000-0000-000000000004';
  await rejects(() => request(four, 19), /displayed card price/);
  await request(four, 20);
  equal(await scalar('select amount_nu from shop_redemptions where id=$1', [four]), 99);
  await db.exec('reset role');
  const grievance = '20000000-0000-0000-0000-000000000001';
  await db.query(
    'insert into grievances(id,reporter_id,bonus_awarded,approved) values($1,$2,0,true)',
    [grievance, other],
  );
  await asUser(admin);
  await db.query('select award_shop_submission_points($1)', [grievance]);
  await db.query('select award_shop_submission_points($1)', [grievance]);
  await db.query('select adjust_points($1,$2,3,4)', [other, grievance]);
  await db.query('select adjust_points($1,$2,3,4)', [other, grievance]);
  await asUser(other);
  equal(await scalar('select balance from point_wallets'), 14);
  await db.exec('reset role');
  await db.query('insert into diamonds(id,user_id,linked_grievance_id) values(1,$1,$2)', [
    user,
    grievance,
  ]);
  await asUser(admin);
  await db.exec('select accept_diamond(1); select accept_diamond(1)');
  await asUser(other);
  equal(await scalar('select balance from point_wallets'), 14);
  console.log(`Shop database checks passed (${assertions} assertions).`);
} finally {
  await db.close();
}
