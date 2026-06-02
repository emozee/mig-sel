-- Update existing knowledge entries to reflect new announcement features

update public.chatbot_knowledge
set answer = 'Announcements are official news and updates posted by city officials. They appear on the Announcements page and can include regular updates (green badge) or important notices (red badge) about civic services, events, policy changes, and community updates.'
where question = 'What are announcements?';

update public.chatbot_knowledge
set answer = 'If you have the Official role, go to your Profile page, tap "Announcements" in the Official Portal section. On the Announcements page, choose either "Announcement" or "Important Notice" (for urgent items), fill in the title and body, then click "Post Announcement". You can also pin, unpin, or delete your own announcements.'
where question = 'How do I post an announcement?';

update public.chatbot_knowledge
set answer = 'There are four roles: regular user (resident), inspector, official, and admin. Regular users can report issues and engage with the community. Inspectors can manage waste records. Officials can post announcements and important notices. Admins have full access to the dashboard.'
where question = 'What user roles are there?';
