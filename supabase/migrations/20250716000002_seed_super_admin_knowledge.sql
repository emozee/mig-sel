-- Seed chatbot knowledge: super admin role and features

insert into public.chatbot_knowledge (question, answer, keywords) values

('What is a Super Admin?',
 'A Super Admin is the highest role in mig-sel. Super Admins have all the privileges of regular Admins (complaint monitoring, waste management, role assignment, analytics, knowledge base) plus access to the Super Admin Dashboard, which shows user analytics — total users, active users, and inactive users. Only Super Admins can assign other users as Super Admins.',
 array['super admin', 'superadmin', 'super_admin', 'highest role', 'user analytics', 'user counts', 'admin levels', 'admin hierarchy']),

('How do I become a Super Admin?',
 'Only existing Super Admins can assign the Super Admin role. If you need Super Admin access, contact a current Super Admin from your organization to update your role via the Admin Dashboard.',
 array['become super admin', 'super admin role', 'get super admin', 'super admin assignment', 'promote to super admin']),

('What is the Super Admin Dashboard?',
 'The Super Admin Dashboard shows user statistics: total registered users, active users (signed in within the last 30 days), and inactive users. It also includes a visual breakdown bar showing the active vs inactive ratio. Super Admins can access it from the sidebar in the Admin Dashboard or directly at /super-admin.',
 array['super admin dashboard', 'super admin page', 'user stats', 'user analytics dashboard', 'super admin panel'])

  on conflict (question) do nothing;
