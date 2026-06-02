INSERT INTO chatbot_knowledge (question, answer, keywords)
SELECT 'How do I reach the Admin Dashboard from my profile?',
 'If you have an admin or official role, your Profile page shows an "Official Portal" section with a link to the Admin Dashboard. Just tap "Official Portal" to go to /dashboard.',
 array['admin dashboard profile', 'profile dashboard', 'goto dashboard', 'admin portal profile', 'navigate dashboard']
on conflict (question) do nothing;
