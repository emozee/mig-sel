-- Seed chatbot knowledge about the 10m radius duplicate check
insert into public.chatbot_knowledge (question, answer)
values
  (
    'what is the 10 meter radius check',
    'When you submit a grievance, the system checks if there is already a report within 10 meters of your location. If a nearby report exists, you will see a warning with details about the existing report(s) and you can choose to submit anyway or cancel. This prevents duplicate reports for the same issue.'
  ),
  (
    'why was my report flagged as duplicate',
    'Your report was flagged because another grievance was already submitted within 10 meters of your location. The system uses GPS coordinates and the Haversine formula to calculate distances. You can still choose to submit if your issue is different from the existing one.'
  ),
  (
    'can i submit a report if there is one nearby',
    'Yes. The 10m radius check only shows a warning — it does not block your submission. If your issue is different (e.g., a different category or a different specific problem in the same area), you can proceed to submit your report.'
  ),
  (
    'how does the app detect duplicate grievances',
    'The app checks two things: (1) geospatial proximity — any grievance within 10 meters of your location is flagged using the Haversine distance formula; and (2) image similarity (if enabled) — uploaded photos are compared against existing grievance images using pgvector with cosine similarity. Both checks are advisory and do not block submission.'
  )
on conflict (question) do nothing;
