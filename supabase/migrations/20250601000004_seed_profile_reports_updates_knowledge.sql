-- Seed additional knowledge base entries for profile reports and updates

insert into public.chatbot_knowledge (question, answer, keywords) values

('How do I view my reports?',
 'Go to your Profile page and tap "My Reports". You will see a list of all issues you have reported. Tap any report to view it in a community feed-style card showing the title, description, photo, status, and location.',
 array['my reports', 'view reports', 'my issues', 'my complaints', 'profile reports', 'my reported issues']),

('How do I view my Diamond updates?',
 'Go to your Profile page and tap "My Updates". This shows all the Diamond posts you have published. Each post appears as a full Diamond card where you can edit, delete, view comments, and see upvotes — just like in the Diamond feed.',
 array['my updates', 'my diamond posts', 'my posts', 'view updates', 'profile updates', 'diamond updates']),

('What is the difference between My Reports and My Updates?',
 '"My Reports" shows the civic issues you have submitted (grievances), displayed in a community feed-style card. "My Updates" shows your Diamond social posts — the thoughts, photos, and updates you have shared with the community.',
 array['reports vs updates', 'difference reports updates', 'my reports vs my updates', 'profile activities']),

('How do I find my report on the Map from the detail view?',
 'When viewing a report in the community feed-style detail page, tap "Find on Map" in the details bar. This will navigate you to the Map page centered on your report''s location.',
 array['find on map report', 'report map location', 'navigate to report map', 'view report on map'])

on conflict (question) do nothing;
