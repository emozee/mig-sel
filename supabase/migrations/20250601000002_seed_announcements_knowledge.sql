insert into public.chatbot_knowledge (question, answer, keywords) values

('What are announcements?',
 'Announcements are official news and updates posted by city officials. They appear on the Announcements page and can include important information about civic services, events, policy changes, and community updates.',
 array['announcements', 'announcement', 'official', 'news', 'updates', 'city news']),

('Who can post announcements?',
 'Only users with the Official role can post announcements. Officials have a special badge on their profile and access to the Official Portal where they can manage announcements.',
 array['official', 'post announcement', 'who can announce', 'official role', 'announcement permission']),

('How do I view announcements?',
 'Go to your Profile page and tap "Announcements" in the Official Portal section. All users can view announcements — no special role is needed to read them.',
 array['view announcements', 'read announcements', 'see announcements', 'announcements page']),

 ('How do I post an announcement?',
  'If you have the Official role, go to your Profile page, tap "Announcements" in the Official Portal section. On the Announcements page, fill in the title and body, then click "Post Announcement". You can also delete your own announcements.',
  array['post announcement', 'create announcement', 'write announcement', 'submit announcement', 'make announcement'])
 on conflict (question) do nothing;
