begin;

alter table public.notifications drop constraint if exists notifications_type_check;
alter table public.notifications add constraint notifications_type_check check (
  type in (
    'report_submitted', 'report_approved', 'report_status',
    'report_rejected', 'report_removed', 'diamond_comment',
    'diamond_status', 'announcement', 'shop_request', 'shop_status'
  )
);

-- The database creates notifications in the same transaction as a request or
-- status change, so retries cannot create duplicate alerts. Never put a phone
-- number or payment reference in notification text or metadata.
create function public.notify_shop_request() returns trigger
language plpgsql security definer set search_path = '' as $$
declare v_href text := '/shop/mobile-recharge?request=' || new.id::text;
begin
  insert into public.notifications (user_id, type, title, body, href, entity_type, entity_id, metadata)
  values (
    new.user_id, 'shop_status', 'Recharge requested',
    format('Your Nu. %s %s request is pending. %s points were reserved.',
      new.amount_nu, case when new.recharge_type = 'data' then 'data' else 'talk-time' end, new.points),
    v_href, 'shop_redemption', new.id::text, jsonb_build_object('status', 'pending')
  );

  insert into public.notifications (user_id, type, title, body, href, entity_type, entity_id, metadata)
  select p.id, 'shop_request', 'New recharge request',
    format('Nu. %s %s recharge is awaiting processing.',
      new.amount_nu, case when new.recharge_type = 'data' then 'data' else 'talk-time' end),
    '/dashboard?view=shop&request=' || new.id::text,
    'shop_redemption', new.id::text, jsonb_build_object('status', 'pending')
  from public.profiles p where p.role = 'super_admin' and p.id <> new.user_id;
  return new;
end;
$$;

create function public.notify_shop_status() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  v_title text;
  v_body text;
begin
  if new.status is not distinct from old.status then return new; end if;
  v_title := case new.status
    when 'processing' then 'Recharge being processed'
    when 'delivered' then 'Recharge delivered'
    when 'refunded' then 'Recharge refunded'
    else 'Recharge updated' end;
  v_body := case new.status
    when 'processing' then format('Your Nu. %s recharge is being processed.', new.amount_nu)
    when 'delivered' then format('Your Nu. %s recharge was delivered.', new.amount_nu)
    when 'refunded' then format('Your Nu. %s recharge could not be fulfilled. %s points were returned.', new.amount_nu, new.points)
    else 'Your recharge status has changed.' end;
  insert into public.notifications (user_id, type, title, body, href, entity_type, entity_id, metadata)
  values (new.user_id, 'shop_status', v_title, v_body,
    '/shop/mobile-recharge?request=' || new.id::text,
    'shop_redemption', new.id::text, jsonb_build_object('status', new.status));
  return new;
end;
$$;

create trigger trg_notify_shop_request after insert on public.shop_redemptions
for each row execute function public.notify_shop_request();
create trigger trg_notify_shop_status after update of status on public.shop_redemptions
for each row execute function public.notify_shop_status();

revoke all on function public.notify_shop_request() from public, anon, authenticated;
revoke all on function public.notify_shop_status() from public, anon, authenticated;

commit;
