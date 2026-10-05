begin;

-- Preserve old RPC signature for clients already deployed, but never use the
-- legacy display flag to decide whether an awarded reward is announced.
update public.shop_redemptions set public_display = true where not public_display;
alter table public.shop_redemptions alter column public_display set default true;

create index shop_redemptions_delivered_date on public.shop_redemptions (delivered_at desc)
  where status = 'delivered';
drop index if exists public.shop_redemptions_announcements;

create or replace function public.request_shop_recharge(
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
  select * into v_existing from public.shop_redemptions where id = p_id;
  if found then
    if v_existing.user_id = v_user and v_existing.card_id = p_card_id
       and v_existing.points = p_points and v_existing.phone = p_phone then return p_id; end if;
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
    values(p_id,v_user,v_card.id,v_card.title,v_card.operator,v_card.recharge_type,p_phone,p_points,v_amount::integer,v_settings.nu_per_point,v_card.pricing_mode,true);
  update public.point_wallets set balance = balance - p_points where user_id = v_user;
  insert into public.point_transactions(user_id,delta,kind,redemption_id) values(v_user,-p_points,'redemption',p_id);
  return p_id;
end;
$$;

-- The public RPC returns only masked numbers and reward details; neither the
-- full phone number nor the account identifier is sent to anonymous visitors.
create or replace function public.shop_recent_deliveries()
returns table(masked_phone text, operator text, recharge_type text, amount_nu integer, delivered_at timestamptz)
language sql stable security definer set search_path = '' as $$
  select left(r.phone,4) || ' ' || substring(r.phone from 5 for 2) || '••••••',
    r.operator, r.recharge_type, r.amount_nu, r.delivered_at
  from public.shop_redemptions r where r.status = 'delivered'
  order by r.delivered_at desc limit 10;
$$;

notify pgrst, 'reload schema';
commit;
