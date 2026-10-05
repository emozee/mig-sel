begin;

-- The old "Add card" action created this disabled placeholder. It is not one
-- of the four operator/type settings used by the mobile recharge form.
delete from public.shop_cards as card
where card.title = 'New recharge reward'
  and card.enabled = false
  and card.description = ''
  and not exists (
    select 1 from public.shop_redemptions as redemption
    where redemption.card_id = card.id
  );

commit;
