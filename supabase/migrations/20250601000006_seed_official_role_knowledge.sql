-- Seed knowledge base entries for official role and announcement types

insert into public.chatbot_knowledge (question, answer, keywords) values

('What is the Official role?',
 'The Official role is a special role for city administrators who need to post announcements and important notices to the community. Officials can create, pin, and delete announcements. They have an "Official Portal" section on their Profile page with links to manage announcements and complaints.',
 array['official role', 'official', 'city official', 'official portal', 'what is official']),

('What is the difference between an announcement and an important notice?',
 'An announcement is a regular update or news item posted by an official (tagged with a green badge). An important notice is a critical alert that appears with a red badge to draw immediate attention — use it for urgent matters like service disruptions, emergencies, or policy changes that require immediate awareness.',
 array['announcement vs notice', 'important notice', 'announcement type', 'difference announcement notice', 'notice vs announcement']),

('How do I post an important notice?',
 'If you have the Official role, go to the Announcements page. Before filling in the form, select "Important Notice" (the red button) instead of "Announcement". Then fill in the title and body as usual and click "Post Announcement". Important notices appear with a red badge for visibility.',
 array['post important notice', 'create notice', 'important notice', 'urgent announcement', 'post urgent']),

('How do I pin or unpin an announcement?',
 'If you are the author of an announcement, a pin button appears next to the delete button on your announcement card. Tap the pin icon to pin it (it will appear at the top with an amber border). Tap it again to unpin. Only the announcement author can pin/unpin their own posts.',
 array['pin announcement', 'unpin announcement', 'pin post', 'feature announcement', 'stick announcement'])

on conflict (question) do nothing;
