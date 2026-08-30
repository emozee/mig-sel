-- Chatbot KB: the admin dashboard is now fully usable on smartphones
-- (mobile card list for complaint monitoring, stacked analytics charts,
-- scrollable waste tables, and scrollable detail dialogs).
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'Can I use the admin dashboard on my phone?',
    'Yes. Open the menu with the button at the top-left to switch between Complaint Monitoring, Waste Management, Analytics, Roles, Users, Knowledge Base, and Diamond Review. On a phone, complaints appear as easy-to-tap cards instead of a wide table — tap a card to see full details, change urgency or status, approve, reject, or delete. Charts stack vertically on small screens.',
    '{}'
  ),
  (
    'How do I approve or reject reports from my phone?',
    'Go to the dashboard, open the menu (top-left), choose Complaint Monitoring, then tap the red Unapproved card. Each report shows as a card with its photo — tap Approve to publish it or Reject to permanently delete it. You can tick several cards to approve or reject them all at once.',
    '{}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
