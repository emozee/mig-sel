-- Seed new Diamond feature Q&A entries for chatbot knowledge base
-- Photo gallery, sharing, guidelines, admin moderation

insert into public.chatbot_knowledge (question, answer, keywords) values

('How do I view photos in a Diamond post?',
 'If a Diamond post has multiple photos, tap any photo to open the gallery viewer. You can swipe or use the arrow buttons to navigate between photos. Each photo has its own Like, Comment, and Share buttons. Tap a photo again to view it full-screen.',
 array['diamond photos', 'view photos', 'photo gallery', 'diamond gallery', 'view images', 'photo navigation', 'swipe photos']),

('How do I share a Diamond post?',
 'Tap the Share button on any Diamond post. If your device supports native sharing, it will open the share menu. Otherwise, the post link is copied to your clipboard. You can also tap Share on individual photos in the gallery viewer. The share count increases each time you share.',
 array['share diamond', 'share post', 'share button', 'share count', 'share photo']),

('What are the guidelines for Diamond posts?',
 'Diamond is a positive space for sharing your happiest moments and best experiences at GMC. Please keep posts respectful — no sensitive, defamatory, or inappropriate content. Posts that violate these guidelines may be removed by admins.',
 array['diamond guidelines', 'post rules', 'community guidelines', 'diamond rules', 'content policy', 'appropriate content', 'positive space']),

('Can admins remove Diamond posts?',
 'Yes. Admins can remove any Diamond post that violates community guidelines. If you see a post that contains sensitive, defamatory, or inappropriate content, please contact an admin. The post owner will also see their own Edit and Delete options.',
 array['admin remove post', 'admin delete diamond', 'remove post', 'delete diamond', 'moderate diamond']),

('What is share count on Diamond posts?',
 'The share count shows how many times a Diamond post has been shared. You can see it next to the Share button on each post and in the photo gallery. Share a post to spread positive moments from GMC!',
 array['share count', 'share counter', 'shares on diamond', 'shared count']),

('How do I view a single photo in full screen?',
 'If a Diamond post has only one photo, tapping it opens directly in full-screen mode with Like, Comment, and Share buttons. If a post has multiple photos, open the gallery first, then tap any photo to enter full-screen mode. Use the arrow keys or on-screen buttons to navigate.',
 array['full screen photo', 'single photo view', 'photo fullscreen', 'expand photo', 'view photo full']),

('How do I comment on a photo in the gallery?',
 'When viewing photos in the gallery or full-screen mode, tap the Comment button below the photo. The comment section will appear inline. Type your comment and press send. You can like, comment, and share directly from the photo viewer.',
 array['comment on photo', 'gallery comment', 'photo comment', 'comment in viewer', 'gallery actions']);
