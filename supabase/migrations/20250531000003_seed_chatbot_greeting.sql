-- Seed chatbot greeting response

insert into public.chatbot_knowledge (question, answer, keywords) values

('Hi',
 'Kuzu zangpola! I''m the mig-sel assistant. I can help you with reporting issues, earning points, using the Diamond feature, and anything else about the platform. What would you like to know?',
 array['greeting', 'hello', 'hey', 'kuzu zangpola', 'hi', 'good morning', 'good evening', 'howdy'])
  on conflict (question) do nothing;
