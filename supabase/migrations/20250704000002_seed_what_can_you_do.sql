-- Seed chatbot knowledge: bot capabilities overview

insert into public.chatbot_knowledge (question, answer, keywords) values

('What can you do?',
 'I''m the mig-sel AI assistant — your guide to everything on the platform. Here''s what I can help you with:

📋 **Reports & Issues** — how to report a problem, add photos, track status, edit or delete reports
🗺️ **Map** — what markers mean, how to filter by status or category
📰 **Community Feed** — upvoting, commenting, viewing posts
💎 **Diamond** — creating posts, linking issues, direct solve, earning points, gallery & sharing
🏆 **Leaderboard** — how rankings work, how points are calculated
⭐ **Points & Shop** — earning points, checking your balance, redeeming rewards
👤 **Profile** — editing your profile, viewing your reports and updates, signing out
🔐 **Account & Security** — creating an account, password reset, data privacy
🛡️ **Roles** — user, inspector, and admin permissions
⚙️ **Admin Features** — dashboard, role management, analytics, knowledge base

Just ask me anything in your own words — I understand natural language!',
 array['capabilities', 'what can you do', 'what do you do', 'your function', 'what can you help with', 'help', 'features', 'what do you know', 'how can you help', 'available topics', 'your purpose', 'introduction']),

('What topics do you cover?',
 'I can answer questions about all mig-sel features: reporting issues, the map, community feed, Diamond, leaderboard, points and shop, profile settings, account security, user roles, and admin tools. Try asking me something specific!',
 array['topics', 'subjects', 'what do you cover', 'what can i ask', 'categories', 'scope'])
  on conflict (question) do nothing;
