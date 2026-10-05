-- Development candidates only. These names and mappings require human review;
-- no URL, procedure, fee, requirement, or provider is marked verified.

insert into public.service_providers
  (id, name, abbreviation, provider_type, description, verified)
values
  ('10000000-0000-4000-8000-000000000001', 'Bhutan Construction and Transport Authority', 'BCTA', 'government_agency', 'Transport service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000002', 'Department of Civil Registration and Census', 'DCRC', 'government_agency', 'Civil registration service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000003', 'Passport authority under MFAET', 'MFAET', 'government_agency', 'Passport service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000004', 'National Land Commission Secretariat', 'NLCS', 'government_agency', 'Land service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000005', 'Department of Revenue and Customs', 'DRC', 'government_agency', 'Tax service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000006', 'Business licensing authority under MoICE', 'MoICE', 'government_agency', 'Business service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000007', 'Bhutan Labour Market Information System', 'BLMIS', 'public_service_provider', 'Employment service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000008', 'Bhutan Power Corporation', 'BPC', 'utility', 'Electricity service candidate for manual verification.', false),
  ('10000000-0000-4000-8000-000000000009', 'Community or Local Government', null, 'local_authority', 'Local-government service candidate for manual verification.', false)
on conflict (id) do nothing;

insert into public.services
  (id, provider_id, name, slug, short_description, service_category, verified)
values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', 'Replace Driving Licence', 'replace-driving-licence', 'Possible replacement service for a lost or damaged driving licence.', 'transport', false),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', 'Renew Driving Licence', 'renew-driving-licence', 'Possible renewal service for an expired driving licence.', 'transport', false),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', 'Vehicle Ownership Transfer', 'vehicle-ownership-transfer', 'Possible service for transferring vehicle ownership.', 'transport', false),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', 'Vehicle Registration Document Replacement', 'vehicle-registration-document-replacement', 'Possible replacement service for a vehicle registration document.', 'transport', false),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', 'New CID Application', 'new-cid-application', 'Possible service for a new citizenship identity card.', 'civil_registration', false),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', 'CID Replacement', 'cid-replacement', 'Possible replacement service for a lost or damaged CID.', 'civil_registration', false),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', 'Birth Registration', 'birth-registration', 'Possible service for registering a birth.', 'civil_registration', false),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000002', 'Census Transfer', 'census-transfer', 'Possible service for a census transfer.', 'civil_registration', false),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', 'Passport Application or Renewal', 'passport-application-renewal', 'Possible passport application or renewal service.', 'passport', false),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000004', 'Land Transaction', 'land-transaction', 'Possible service for a land transaction or ownership transfer.', 'land', false),
  ('20000000-0000-4000-8000-000000000011', '10000000-0000-4000-8000-000000000005', 'Property Tax', 'property-tax', 'Possible service for property tax.', 'tax', false),
  ('20000000-0000-4000-8000-000000000012', '10000000-0000-4000-8000-000000000006', 'Business Registration or Licensing', 'business-registration-licensing', 'Possible service for starting or licensing a business.', 'business', false),
  ('20000000-0000-4000-8000-000000000013', '10000000-0000-4000-8000-000000000006', 'Business Licence Renewal', 'business-licence-renewal', 'Possible service for renewing a business licence.', 'business', false),
  ('20000000-0000-4000-8000-000000000014', '10000000-0000-4000-8000-000000000007', 'Job Seeker Registration', 'job-seeker-registration', 'Possible employment service for job seekers.', 'employment', false),
  ('20000000-0000-4000-8000-000000000015', '10000000-0000-4000-8000-000000000008', 'Electricity Customer Service', 'electricity-customer-service', 'Possible customer-support service for electricity account or billing issues.', 'electricity', false)
on conflict (id) do nothing;

insert into public.service_keywords (service_id, keyword, language)
values
  ('20000000-0000-4000-8000-000000000001', 'lost driving licence', 'en'),
  ('20000000-0000-4000-8000-000000000001', 'lost licence', 'en'),
  ('20000000-0000-4000-8000-000000000001', 'missing licence', 'en'),
  ('20000000-0000-4000-8000-000000000001', 'damaged licence', 'en'),
  ('20000000-0000-4000-8000-000000000001', 'replace licence', 'en'),
  ('20000000-0000-4000-8000-000000000002', 'expired licence', 'en'),
  ('20000000-0000-4000-8000-000000000002', 'renew licence', 'en'),
  ('20000000-0000-4000-8000-000000000002', 'licence renewal', 'en'),
  ('20000000-0000-4000-8000-000000000003', 'sold my car', 'en'),
  ('20000000-0000-4000-8000-000000000003', 'transfer vehicle ownership', 'en'),
  ('20000000-0000-4000-8000-000000000003', 'transfer car', 'en'),
  ('20000000-0000-4000-8000-000000000004', 'lost vehicle registration document', 'en'),
  ('20000000-0000-4000-8000-000000000004', 'replace registration certificate', 'en'),
  ('20000000-0000-4000-8000-000000000005', 'new cid', 'en'),
  ('20000000-0000-4000-8000-000000000005', 'apply for cid', 'en'),
  ('20000000-0000-4000-8000-000000000006', 'lost cid', 'en'),
  ('20000000-0000-4000-8000-000000000006', 'replace cid', 'en'),
  ('20000000-0000-4000-8000-000000000007', 'newborn registration', 'en'),
  ('20000000-0000-4000-8000-000000000007', 'register baby', 'en'),
  ('20000000-0000-4000-8000-000000000007', 'birth certificate', 'en'),
  ('20000000-0000-4000-8000-000000000007', 'baby registration', 'en'),
  ('20000000-0000-4000-8000-000000000008', 'census transfer', 'en'),
  ('20000000-0000-4000-8000-000000000008', 'transfer census', 'en'),
  ('20000000-0000-4000-8000-000000000009', 'apply for passport', 'en'),
  ('20000000-0000-4000-8000-000000000009', 'renew passport', 'en'),
  ('20000000-0000-4000-8000-000000000010', 'land transfer', 'en'),
  ('20000000-0000-4000-8000-000000000010', 'transfer land', 'en'),
  ('20000000-0000-4000-8000-000000000010', 'sell land', 'en'),
  ('20000000-0000-4000-8000-000000000010', 'buy land', 'en'),
  ('20000000-0000-4000-8000-000000000011', 'pay property tax', 'en'),
  ('20000000-0000-4000-8000-000000000011', 'property tax', 'en'),
  ('20000000-0000-4000-8000-000000000012', 'open business', 'en'),
  ('20000000-0000-4000-8000-000000000012', 'business licence', 'en'),
  ('20000000-0000-4000-8000-000000000012', 'business registration', 'en'),
  ('20000000-0000-4000-8000-000000000012', 'start company', 'en'),
  ('20000000-0000-4000-8000-000000000013', 'renew business licence', 'en'),
  ('20000000-0000-4000-8000-000000000013', 'business licence renewal', 'en'),
  ('20000000-0000-4000-8000-000000000014', 'looking for a job', 'en'),
  ('20000000-0000-4000-8000-000000000014', 'job seeker', 'en'),
  ('20000000-0000-4000-8000-000000000014', 'employment service', 'en'),
  ('20000000-0000-4000-8000-000000000015', 'electricity bill wrong', 'en'),
  ('20000000-0000-4000-8000-000000000015', 'power bill problem', 'en'),
  ('20000000-0000-4000-8000-000000000015', 'electricity customer service', 'en')
on conflict do nothing;

insert into public.service_questions
  (id, service_family, question_key, question_text, question_type, required, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', 'driving_licence', 'driving_licence_issue', 'What happened to your driving licence?', 'single_choice', true, 10),
  ('30000000-0000-4000-8000-000000000002', 'business', 'business_need', 'Do you want to start a new business or renew an existing licence?', 'single_choice', true, 10),
  ('30000000-0000-4000-8000-000000000003', 'application_followup', 'followup_service', 'What service or complaint did you submit?', 'free_text', true, 10),
  ('30000000-0000-4000-8000-000000000004', 'water', 'water_location', 'Which area is affected by the water problem?', 'free_text', true, 10)
on conflict (id) do nothing;

insert into public.service_question_options
  (question_id, label, value, target_service_id, sort_order)
values
  ('30000000-0000-4000-8000-000000000001', 'Lost or damaged', 'lost_or_damaged', '20000000-0000-4000-8000-000000000001', 10),
  ('30000000-0000-4000-8000-000000000001', 'Expired', 'expired', '20000000-0000-4000-8000-000000000002', 20),
  ('30000000-0000-4000-8000-000000000001', 'Need a new licence', 'new', null, 30),
  ('30000000-0000-4000-8000-000000000002', 'Start a new business', 'new_business', '20000000-0000-4000-8000-000000000012', 10),
  ('30000000-0000-4000-8000-000000000002', 'Renew a business licence', 'renew_business_licence', '20000000-0000-4000-8000-000000000013', 20)
on conflict (question_id, value) do nothing;
