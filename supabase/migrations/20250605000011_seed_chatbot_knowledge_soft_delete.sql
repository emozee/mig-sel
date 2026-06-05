insert into public.chatbot_knowledge (question, answer, keywords) values
('Why does my report show "Removed by admin"?',
 'When an admin removes your report from the system, it is not permanently deleted — it is soft-deleted so you can still see it in your My Reports page with a red border and "Removed by admin" label. You can dismiss it permanently by tapping the X button on the removed report card.',
 array['removed by admin', 'admin deleted', 'report removed', 'soft delete', 'administrative action', 'removed report']),

('What happens to points when admin removes my report?',
 'If your report had points awarded (e.g., from approval), those points will be revoked when the admin removes it. The points are deducted from your profile. If your report was never approved, no points were awarded so nothing is deducted.',
 array['remove points', 'deduct points', 'revoke points', 'lose points', 'points removed', 'points deducted']),

('How do I dismiss a removed report from My Reports?',
 'On your My Reports page, any report that was removed by an admin appears with a red border and an X button on the right. Tap the X button to permanently delete it from your view. This action cannot be undone.',
 array['dismiss report', 'remove from view', 'hide removed', 'delete removed report', 'clear removed']),

('Can I appeal an admin removal?',
 'If you believe your report was removed by mistake, please contact the Gelephu Mindfulness City administration directly. The app does not currently have an appeal system.',
 array['appeal removal', 'appeal admin', 'wrong removal', 'contact admin', 'mistaken removal'])
on conflict (question) do nothing;
