-- Seed chatbot knowledge entries for direct solve and public status

insert into public.chatbot_knowledge (question, answer, keywords) values

('What does "Public" status mean on an issue?',
 'When an admin marks an issue as "Public", it becomes visible in the Diamond feature for users to find and link their direct-solve posts to. Only public issues can be linked to Diamond posts.',
 array['public status', 'public issue', 'public grievance', 'visible issue', 'link public']),

('How do I link an issue to my Diamond post?',
 'Click "Link to an Issue" on the Diamond creator. Only issues marked as "Public" by an admin will appear. Select the issue you want to help resolve. Your post becomes a Direct Solve.',
 array['link issue diamond', 'link grievance', 'direct solve', 'link to issue', 'connect issue']),

('What is Direct Solve in Diamond?',
 'Direct Solve lets you link your Diamond post to a public issue. When an admin accepts your post, the issue is marked as resolved and points are awarded — 4 points to the uploader (reporter of the issue) and 10 points to the volunteer (you and any collaborators).',
 array['direct solve', 'direct solve diamond', 'solve issue diamond', 'link solve']),

('How many points do I get for Direct Solve?',
 'When the admin accepts your Direct Solve Diamond post: the uploader (person who reported the issue) gets 4 points, and the volunteer (you, the Diamond post owner) gets 10 points. Collaborators also get 10 points each.',
 array['direct solve points', 'points direct solve', 'diamond points', 'solve points']);
