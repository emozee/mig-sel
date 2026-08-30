-- Chatbot KB: pitch deck rebuilt to 10-slide PELSUP framework (2026-08-29).
-- Old deck had 15 slides; new deck has 10 in this order:
--   1 Title, 2 Problem, 3 Solution, 4 Product, 5 Traction,
--   6 Market, 7 Business model, 8 Competition, 9 Team, 10 The ask.
-- Money + the ask are combined on slide 10. Traction slide is pre-launch honest
-- (no paying customers yet — MVP live, GMC anchor in pipeline, SELISE partnership).
insert into public.chatbot_knowledge (question, answer, keywords)
values
  (
    'How is the MIGSEL pitch deck structured?',
    'The investor pitch deck has 10 slides in this order: 1 Title, 2 Problem, 3 Solution, 4 Product, 5 Traction, 6 Market, 7 Business model, 8 Competition, 9 Team, 10 The ask. The Money and Ask are combined on slide 10. The deck is built on the PELSUP Day 2 framework — one number per slide, customer-first language, no buzzwords.',
    '{pitch,deck,slides,investor,pelsup}'
  ),
  (
    'Does MIGSEL have any paying customers or revenue yet?',
    'No paying customers yet — MIGSEL is honest about being pre-launch. The traction slide shows what exists: MVP live in production, GMC (Gelephu Mindfulness City) anchor paid pilot in the pipeline, SELISE anchor technology partnership, MIGSEL Pvt Ltd registration in progress, 6-person team shipping the product, and lean burn of about Nu. 96,349 per month (~$1,014). The numbers come after the anchor signs; the proof of build is what we show now.',
    '{traction,revenue,customers,paying,users,numbers,mrr}'
  ),
  (
    'How much is MIGSEL raising and on what terms?',
    'MIGSEL is raising Nu. 5,000,000 on a SAFE (Simple Agreement for Future Equity). The SAFE has no interest, no maturity debt, and a valuation cap to protect the early investor. The round buys 16 months of runway and targets the milestone of a paid GMC deployment live plus 3+ paying government clients — Series-A-ready metrics.',
    '{raising,ask,fund,seed,investment,safe,round,terms,valuation}'
  ),
  (
    'How does MIGSEL make money?',
    'B2G SaaS — government municipalities pay, citizens use the platform free. Four revenue streams: Implementation (Nu. 500,000 one-time), Annual licence (Nu. 350,000 per year), Maintenance and support (Nu. 100,000 per year), and Custom development (Nu. 150,000 to 500,000 per project). Recurring revenue per municipality is Nu. 450,000 per year. Gross margin is about 85%. Government contracts are sticky, so target annual churn is under 10%.',
    '{business model,revenue,pricing,saas,b2g,municipality,license}'
  )
on conflict (question) do update
set answer = excluded.answer,
    keywords = excluded.keywords;
