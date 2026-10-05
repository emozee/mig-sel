begin;
-- Block point writers until both the opening snapshot and sync trigger exist.
lock table public.profiles in share row exclusive mode;
-- Private wallets preserve lifetime contribution points on profiles.
create function public.is_shop_superadmin() returns boolean
language sql stable security definer set search_path = '' as $$
  select exists(select 1 from public.profiles where id = (select auth.uid()) and role = 'super_admin');
$$;
revoke all on function public.is_shop_superadmin() from public, anon;
grant execute on function public.is_shop_superadmin() to authenticated;

create table public.shop_settings (
  id boolean primary key default true check (id),
  enabled boolean not null default false,
  starts_at timestamptz,
  ends_at timestamptz,
  nu_per_point numeric(12,4) not null default 1 check (nu_per_point > 0),
  delivery_message text not null default 'Recharge requests are fulfilled manually within 24 hours.',
  updated_at timestamptz not null default clock_timestamp(),
  check (not enabled or (starts_at is not null and ends_at is not null)),
  check (ends_at > starts_at)
);
insert into public.shop_settings(id) values (true);

create table public.shop_cards (
  id uuid primary key default gen_random_uuid(),
  title text not null check (length(trim(title)) between 1 and 120),
  description text not null default '',
  operator text not null check (operator in ('bmobile', 'tashicell')),
  recharge_type text not null check (recharge_type in ('data', 'talktime')),
  enabled boolean not null default true,
  sort_order integer not null default 0,
  pricing_mode text not null default 'rate' check (pricing_mode in ('rate', 'fixed')),
  fixed_points integer check (fixed_points > 0),
  fixed_nu integer check (fixed_nu > 0),
  package_amounts integer[] not null default '{}',
  min_nu integer not null default 1 check (min_nu > 0),
  max_nu integer not null default 10000 check (max_nu >= min_nu),
  updated_at timestamptz not null default clock_timestamp(),
  check (pricing_mode <> 'fixed' or (fixed_points is not null and fixed_nu is not null)),
  check (0 < all(package_amounts)),
  check (recharge_type <> 'data' or cardinality(package_amounts) > 0),
  check (pricing_mode <> 'fixed' or (fixed_nu between min_nu and max_nu)),
  check (pricing_mode <> 'fixed' or recharge_type <> 'data' or fixed_nu = any(package_amounts))
);
insert into public.shop_cards(title, description, operator, recharge_type, package_amounts, sort_order) values
 ('B-Mobile data', 'Type points to request an eligible prepaid data package.', 'bmobile', 'data', array[19,29,39,49,99,199,299,499,699,799,999,1099,1199,1599,2499,2999,3999], 1),
 ('TashiCell data', 'Type points to request an eligible prepaid data package.', 'tashicell', 'data', array[19,49,99,199,299,499,599,699,777,999,1299,1499,1999,2499,2999], 2),
 ('B-Mobile talk time', 'Choose your prepaid talk-time recharge amount.', 'bmobile', 'talktime', '{}', 3),
 ('TashiCell talk time', 'Choose your prepaid talk-time recharge amount.', 'tashicell', 'talktime', '{}', 4);

create function public.stamp_shop_update() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at := clock_timestamp(); return new; end;
$$;
create trigger stamp_shop_settings before update on public.shop_settings for each row execute function public.stamp_shop_update();
create trigger stamp_shop_cards before update on public.shop_cards for each row execute function public.stamp_shop_update();

create table public.point_wallets (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  -- Negative balances retain corrections to awards already spent.
  balance bigint not null default 0
);
create table public.shop_redemptions (
  id uuid primary key,
  user_id uuid not null references public.profiles(id),
  card_id uuid not null references public.shop_cards(id),
  card_title text not null,
  operator text not null check (operator in ('bmobile', 'tashicell')),
  recharge_type text not null check (recharge_type in ('data', 'talktime')),
  phone text not null check (phone ~ '^\+975(17|16|77|78)[0-9]{6}$'),
  points integer not null check (points > 0),
  amount_nu integer not null check (amount_nu > 0),
  rate numeric(12,4) not null,
  pricing_mode text not null,
  public_display boolean not null default false,
  status text not null default 'pending' check (status in ('pending', 'processing', 'delivered', 'refunded')),
  bank_reference text,
  note text not null default '',
  created_at timestamptz not null default now(),
  delivered_at timestamptz,
  processed_by uuid references public.profiles(id)
);
create index shop_redemptions_user_date on public.shop_redemptions(user_id, created_at desc);
create index shop_redemptions_queue on public.shop_redemptions(status, created_at);
create index shop_redemptions_announcements on public.shop_redemptions(delivered_at desc) where status = 'delivered' and public_display;

create table public.point_transactions (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.profiles(id) on delete cascade,
  delta bigint not null,
  kind text not null check (kind in ('opening', 'earned', 'correction', 'redemption', 'refund')),
  redemption_id uuid references public.shop_redemptions(id),
  created_at timestamptz not null default now(),
  unique(redemption_id, kind)
);
create index point_transactions_user_date on public.point_transactions(user_id, created_at desc);
insert into public.point_wallets(user_id, balance) select id, coalesce(points,0) from public.profiles;
insert into public.point_transactions(user_id, delta, kind) select user_id, balance, 'opening' from public.point_wallets;

create function public.sync_redeemable_points() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_delta bigint;
begin
  if tg_op = 'INSERT' then v_delta := coalesce(new.points,0);
  else v_delta := coalesce(new.points,0)::bigint - coalesce(old.points,0)::bigint; end if;
  insert into public.point_wallets(user_id, balance) values(new.id, v_delta)
    on conflict(user_id) do update set balance = public.point_wallets.balance + excluded.balance;
  if v_delta <> 0 then
    insert into public.point_transactions(user_id, delta, kind)
      values(new.id, v_delta, case when v_delta > 0 then 'earned' else 'correction' end);
  end if;
  return new;
end;
$$;
create trigger sync_redeemable_points after insert or update of points on public.profiles
for each row execute function public.sync_redeemable_points();
revoke all on function public.sync_redeemable_points() from public, anon, authenticated;
revoke all on function public.stamp_shop_update() from public, anon, authenticated;

alter table public.shop_settings enable row level security;
alter table public.shop_cards enable row level security;
alter table public.point_wallets enable row level security;
alter table public.shop_redemptions enable row level security;
alter table public.point_transactions enable row level security;
revoke all on public.shop_settings, public.shop_cards, public.point_wallets, public.shop_redemptions, public.point_transactions from public, anon, authenticated;
grant select on public.shop_settings, public.shop_cards to anon, authenticated;
grant update on public.shop_settings to authenticated;
grant insert, update on public.shop_cards to authenticated;
grant select on public.point_wallets, public.shop_redemptions, public.point_transactions to authenticated;
create policy shop_settings_read on public.shop_settings for select to anon, authenticated using(true);
create policy shop_settings_edit on public.shop_settings for update to authenticated using((select public.is_shop_superadmin())) with check((select public.is_shop_superadmin()));
create policy shop_cards_read on public.shop_cards for select to anon, authenticated using(true);
create policy shop_cards_insert on public.shop_cards for insert to authenticated with check((select public.is_shop_superadmin()));
create policy shop_cards_edit on public.shop_cards for update to authenticated using((select public.is_shop_superadmin())) with check((select public.is_shop_superadmin()));
create policy wallet_read on public.point_wallets for select to authenticated using(user_id = (select auth.uid()));
create policy transactions_read on public.point_transactions for select to authenticated using(user_id = (select auth.uid()));
create policy redemption_read on public.shop_redemptions for select to authenticated using(user_id = (select auth.uid()) or (select public.is_shop_superadmin()));

create function public.request_shop_recharge(
  p_id uuid, p_card_id uuid, p_points integer, p_phone text, p_public_display boolean,
  p_settings_version timestamptz, p_card_version timestamptz
) returns uuid language plpgsql security definer set search_path = '' as $$
declare
  v_user uuid := (select auth.uid());
  v_settings public.shop_settings;
  v_card public.shop_cards;
  v_balance bigint;
  v_amount numeric;
  v_existing public.shop_redemptions;
begin
  if v_user is null then raise exception 'Sign in to redeem points'; end if;
  if p_id is null or p_points is null or p_points <= 0 then raise exception 'Enter a positive whole number of points'; end if;
  select * into v_settings from public.shop_settings where id for share;
  select * into v_card from public.shop_cards where id = p_card_id for share;
  if not found then raise exception 'Reward not found'; end if;
  select balance into v_balance from public.point_wallets where user_id = v_user for update;
  if not found then raise exception 'Points wallet not found'; end if;
  -- Retry after an uncertain network response returns the original request.
  select * into v_existing from public.shop_redemptions where id = p_id;
  if found then
    if v_existing.user_id = v_user and v_existing.card_id = p_card_id
       and v_existing.points = p_points and v_existing.phone = p_phone
       and v_existing.public_display = p_public_display then return p_id; end if;
    raise exception 'Request identifier already used';
  end if;
  if not v_settings.enabled or v_settings.starts_at is null or v_settings.ends_at is null
     or clock_timestamp() < v_settings.starts_at or clock_timestamp() >= v_settings.ends_at then
    raise exception 'This promotion is not open';
  end if;
  if not v_card.enabled then raise exception 'This reward is unavailable'; end if;
  if p_settings_version is distinct from v_settings.updated_at or p_card_version is distinct from v_card.updated_at then
    raise exception 'Shop settings changed. Refresh and review the new price.';
  end if;
  if p_phone is null or (v_card.operator = 'bmobile' and p_phone !~ '^\+975(17|16)[0-9]{6}$')
     or (v_card.operator = 'tashicell' and p_phone !~ '^\+975(77|78)[0-9]{6}$') then
    raise exception 'Enter a valid mobile number for this operator';
  end if;
  if v_card.pricing_mode = 'fixed' then
    if p_points <> v_card.fixed_points then raise exception 'Use the displayed card price'; end if;
    v_amount := v_card.fixed_nu;
  else v_amount := p_points * v_settings.nu_per_point; end if;
  if v_amount <> trunc(v_amount) or v_amount < v_card.min_nu or v_amount > v_card.max_nu then
    raise exception 'The recharge must be a whole Ngultrum amount within this card''s limits';
  end if;
  if v_card.recharge_type = 'data' and not (v_amount::integer = any(v_card.package_amounts)) then
    raise exception 'Choose an available data package amount';
  end if;
  if v_balance < p_points then raise exception 'Not enough redeemable points'; end if;
  insert into public.shop_redemptions(id,user_id,card_id,card_title,operator,recharge_type,phone,points,amount_nu,rate,pricing_mode,public_display)
    values(p_id,v_user,v_card.id,v_card.title,v_card.operator,v_card.recharge_type,p_phone,p_points,v_amount::integer,v_settings.nu_per_point,v_card.pricing_mode,coalesce(p_public_display,false));
  update public.point_wallets set balance = balance - p_points where user_id = v_user;
  insert into public.point_transactions(user_id,delta,kind,redemption_id) values(v_user,-p_points,'redemption',p_id);
  return p_id;
end;
$$;

create function public.process_shop_recharge(p_id uuid, p_status text, p_reference text default '', p_note text default '')
returns void language plpgsql security definer set search_path = '' as $$
declare v_request public.shop_redemptions;
begin
  if not public.is_shop_superadmin() then raise exception 'Only superadmin can fulfil rewards' using errcode = '42501'; end if;
  select * into v_request from public.shop_redemptions where id = p_id for update;
  if not found then raise exception 'Request not found'; end if;
  if p_status is null or p_status not in ('processing','delivered','refunded') then raise exception 'Invalid status'; end if;
  if v_request.status = p_status then return; end if;
  if v_request.status in ('delivered','refunded') then raise exception 'This request is already finalised'; end if;
  if p_status = 'delivered' and (v_request.status <> 'processing' or coalesce(trim(p_reference),'') = '') then
    raise exception 'Process the recharge first and enter its bank reference';
  end if;
  if p_status = 'refunded' then
    if coalesce(trim(p_note),'') = '' then raise exception 'Enter a refund reason'; end if;
    update public.point_wallets set balance = balance + v_request.points where user_id = v_request.user_id;
    insert into public.point_transactions(user_id,delta,kind,redemption_id) values(v_request.user_id,v_request.points,'refund',p_id);
  end if;
  update public.shop_redemptions set status = p_status, bank_reference = nullif(trim(p_reference),''),
    note = coalesce(p_note,''), processed_by = (select auth.uid()),
    delivered_at = case when p_status = 'delivered' then now() else null end where id = p_id;
end;
$$;

-- Public visitors never receive raw phone numbers or account identifiers.
create function public.shop_recent_deliveries()
returns table(masked_phone text, operator text, recharge_type text, amount_nu integer, delivered_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select left(r.phone,4) || ' ' || substring(r.phone from 5 for 2) || '••••••',
    r.operator, r.recharge_type, r.amount_nu, r.delivered_at
  from public.shop_redemptions r where r.status = 'delivered' and r.public_display
  order by r.delivered_at desc limit 10;
$$;
revoke all on function public.request_shop_recharge(uuid,uuid,integer,text,boolean,timestamptz,timestamptz) from public, anon;
revoke all on function public.process_shop_recharge(uuid,text,text,text) from public, anon;
revoke all on function public.shop_recent_deliveries() from public, anon, authenticated;
grant execute on function public.request_shop_recharge(uuid,uuid,integer,text,boolean,timestamptz,timestamptz) to authenticated;
grant execute on function public.process_shop_recharge(uuid,text,text,text) to authenticated;
grant execute on function public.shop_recent_deliveries() to anon, authenticated;
-- Awards are now spendable: do not let a retried approval award twice or lose
-- a simultaneous increment through a browser-side read/modify/write.
create function public.award_shop_submission_points(p_grievance_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare v_reporter uuid; v_bonus integer; v_approved boolean;
begin
  if not public.is_admin_or_super_admin() then raise exception 'Only an admin can award points' using errcode = '42501'; end if;
  select reporter_id, coalesce(bonus_awarded,0), approved into v_reporter,v_bonus,v_approved
    from public.grievances where id = p_grievance_id for update;
  if not found or v_reporter is null or not coalesce(v_approved,false) or v_bonus > 0 then return; end if;
  update public.profiles set points = coalesce(points,0) + 1 where id = v_reporter;
  update public.grievances set bonus_awarded = 1 where id = p_grievance_id;
end;
$$;
revoke all on function public.award_shop_submission_points(uuid) from public, anon;
grant execute on function public.award_shop_submission_points(uuid) to authenticated;

create or replace function public.adjust_points(p_reporter_id uuid,p_grievance_id uuid,p_delta integer,p_new_value integer)
returns void language plpgsql security definer set search_path = '' as $$
declare v_bonus integer; v_reporter uuid;
begin
  if not public.is_admin_or_super_admin() then raise exception 'Only an admin can adjust points' using errcode = '42501'; end if;
  if p_new_value is null or p_new_value not between 0 and 4 then raise exception 'Invalid grievance award'; end if;
  select reporter_id,coalesce(bonus_awarded,0) into v_reporter,v_bonus from public.grievances where id = p_grievance_id for update;
  if not found or v_reporter is distinct from p_reporter_id then raise exception 'Grievance reporter does not match'; end if;
  -- Derive the delta from the locked source, never from a stale client balance.
  update public.profiles set points = greatest(0,coalesce(points,0) + p_new_value - v_bonus) where id = v_reporter;
  update public.grievances set bonus_awarded = p_new_value where id = p_grievance_id;
end;
$$;
revoke all on function public.adjust_points(uuid,uuid,integer,integer) from public, anon;
grant execute on function public.adjust_points(uuid,uuid,integer,integer) to authenticated;
-- A second reviewer or network retry must not award the reporter twice.
-- The existing Diamond trigger awards owner/collaborator points; wallet sync
-- automatically mirrors those awards as well.
create or replace function public.accept_diamond(diamond_id bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare v_grievance uuid; v_reporter uuid; v_bonus integer;
begin
  if not public.is_admin_or_super_admin() then raise exception 'Only an admin can accept Diamond solutions' using errcode = '42501'; end if;
  select d.linked_grievance_id into v_grievance from public.diamonds d
    where d.id = diamond_id and d.status = 'pending' and d.linked_grievance_id is not null for update;
  if not found then return; end if;
  select reporter_id,coalesce(bonus_awarded,0) into v_reporter,v_bonus
    from public.grievances where id = v_grievance for update;
  if not found then raise exception 'Linked grievance not found'; end if;
  update public.diamonds set status = 'accepted' where id = diamond_id;
  update public.grievances set status = 'resolved', resolved_at = coalesce(resolved_at,now()), bonus_awarded = 4
    where id = v_grievance;
  if v_reporter is not null then
    update public.profiles set points = greatest(0,coalesce(points,0) + 4 - v_bonus) where id = v_reporter;
  end if;
end;
$$;
revoke all on function public.accept_diamond(bigint) from public, anon;
grant execute on function public.accept_diamond(bigint) to authenticated;
notify pgrst, 'reload schema';
commit;
