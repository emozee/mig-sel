-- Seed chatbot knowledge entry for diamond rejection

insert into public.chatbot_knowledge (question, answer, keywords) values

('What happens if admin rejects my Diamond post?',
 'If an admin rejects your Diamond post, the post is automatically deleted. The linked issue stays unchanged (still public), and no points are awarded to anyone.',
 array['reject diamond', 'diamond rejected', 'post rejected', 'delete diamond', 'diamond declined']);
