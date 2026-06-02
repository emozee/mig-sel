-- Seed new feature Q&A entries for auto-feed, bottom nav, tests, toasts, and swipe gestures

insert into public.chatbot_knowledge (question, answer, keywords) values

('How does the community feed get populated?',
 'When an admin approves a grievance, a feed entry is automatically created in the Reports Feed. Existing approved grievances were also backfilled. The feed entry includes the grievance title, reporter name, location, and image. Feed entries sync with grievance status updates automatically.',
 array['community feed', 'reports feed', 'auto feed', 'feed creation', 'grievance approval', 'feed population', 'backfill']),

('What pages have bottom navigation?',
 'All main app pages show the bottom navigation bar: Map, Diamond, Reports Feed, Leaderboard, Shop, Chat, and Profile. The bar is fixed at the bottom with a "rounded-t-2xl" design. The center button opens the Report form. Active tabs are highlighted with the primary green color.',
 array['bottom nav', 'navigation bar', 'map dock', 'bottom navigation', 'navbar']),

('What kind of tests exist in the app?',
 'The app uses Vitest with React Testing Library for testing. Current tests cover: the landing page (renders "GMC Resonance" and sign-in button), the Button component (variants, click handling, disabled state), and the Toaster component. Run "npm test" to run all tests once, or "npm run test:watch" for watch mode.',
 array['tests', 'testing', 'vitest', 'test suite', 'unit tests']),

('Does the app show toast notifications for errors?',
 'Yes. The app uses sonner for toast notifications. Error messages from failed submissions and failed upvote toggles are shown as toasts. The Toaster component is rendered globally in the app root. Successful operations also show toast feedback.',
 array['toast', 'notification', 'error message', 'sonner', 'toast notification']),

('Can I swipe through photos in the Diamond gallery?',
 'Yes. When viewing photos in the Diamond gallery fullscreen, you can swipe left or right to navigate between photos. You can also use the on-screen arrow buttons or the keyboard arrow keys. The thumbnail strip at the bottom lets you jump to a specific photo.',
 array['swipe photos', 'photo swipe', 'gallery swipe', 'touch navigation', 'swipe gesture']),

('How do I report an issue on the map?',
 'Tap the camera button (center FAB) in the bottom navigation bar. This opens the report page where you can describe the issue, select a category, attach a photo, and submit. Your GPS location is automatically captured. After submission, the report goes to admins for approval.',
 array['report issue', 'submit grievance', 'report complaint', 'report page', 'how to report']),

('What should I do if a toast notification appears?',
 'Toast notifications provide feedback for actions like submitting a report, toggling an upvote, or when an error occurs. They auto-dismiss after a few seconds. If you see a red error toast, try the action again. Success toasts (green) confirm your action worked.',
 array['toast appears', 'toast feedback', 'notification appears', 'error toast', 'success toast'])
on conflict (question) do nothing;
