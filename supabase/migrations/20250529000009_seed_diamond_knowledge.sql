-- Seed Diamond feature Q&A entries for chatbot knowledge base

insert into public.chatbot_knowledge (question, answer, keywords) values

('What is Diamond?',
 'Diamond is a social feature on the Community page where you can share your thoughts, daily life, and visual updates with others. It works like a personal micro-blog within mig-sel.',
 array['diamond', 'diamonds', 'social post', 'share', 'thoughts', 'micro-blog', 'personal update']),

('How do I create a Diamond post?',
 'Go to the Community page and find the Diamond card at the top. Type your message, optionally add photos, and click "Add Facet" to publish. Your post will appear in the community feed.',
 array['create diamond', 'post diamond', 'add facet', 'make post', 'new diamond', 'how to post']),

('Can I add multiple photos to a Diamond post?',
 'Yes. Tap "Add Photos" on the Diamond card and select multiple images from your device. Each image will show as a preview. You can remove individual images by tapping the X on any thumbnail before posting.',
 array['diamond photos', 'multiple images', 'add images to diamond', 'upload photos diamond', 'diamond media']),

('How do I remove a photo from my Diamond post before publishing?',
 'Each image preview has an X button in the top-right corner that appears when you hover over it. Tap the X to remove that specific image before posting.',
 array['remove photo diamond', 'delete image preview', 'remove image from post', 'diamond remove photo']);
