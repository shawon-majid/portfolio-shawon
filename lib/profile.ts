export const PROFILE = `
Shawon Majid — Software Engineer based in Sylhet, Bangladesh.
Contact: shawon.majid@gmail.com · +880 1729 379229
Links: linkedin.com/in/shawon-majid · github.com/shawon-majid · facebook.com/shawon.majid

Summary: Software Engineer with expertise in backend systems, AI/ML engineering, and cloud
infrastructure (AWS/GCP). Experienced building production AI systems — agentic workflows,
LLM orchestration, serverless event-driven architectures. Ships AI-augmented products at
scale across startups in the USA and Bangladesh.

EXPERIENCE
• Vyg.ai — Software Engineer (Feb 2025 – present, Remote, USA)
   - Conversation Insights: AI pipeline processing 2,500+ daily conversations via OpenAI
     tool calling and structured outputs.
   - IaC: Deployed CDP infra (Rudderstack, Apache Unomi) and n8n workflows on GCP with
     Pulumi IaC + Helm for Kubernetes orchestration.
   - MCP: Built an OAuth-protected MCP (Model Context Protocol) server enabling AI
     assistants to query brand data in real time.
   - Architected serverless event-driven systems on AWS (EventBridge, SQS, API Gateway, SST).
   - Reduced AI inference cost 50% with batch processing on OpenAI Batch API + Gemini fallback.

• Indigo — AI Engineer (Oct 2025 – Jan 2026, Remote, USA)
   - Built DeepAgents, a LangGraph-powered meeting assistant.
   - Designed agentic chatbot architecture over the full meeting corpus.

• Pathao — Intern Data Engineer (Aug 2024 – Jan 2025, Dhaka)
   - Built hierarchical address-parsing system (unstructured → standardized location data).
   - Used LLMs to classify 10,000+ places by type / usage / naming patterns.
   - Developed Go APIs for address-quality validation (coord matching, GeoJSON, haversine).

• Zenet — Contract Engineer (Oct 2024 – Dec 2024, Remote, Tokyo)
   - Contributed to Xlabo, an e-learning platform. Translated JP↔EN with vue-i18n.

PROJECTS
• Re:elify — text-to-reel generator (Next.js, Remotion, Node, MongoDB; GPT-4 + DALL·E 3).
  1st Runners Up, CSE Carnival '24.
• Budget AI — natural-language expense tracker (LangChain, LLM, TypeScript).
• EcoSync — waste management system for Dhaka City Corp (Next.js, Express, Prisma,
  Postgres, TS, Tailwind). RBAC, Google Maps, Socket.io live tracking, PDF reports.
  Champion, Code Samurai 2024 @ Dhaka University.

SKILLS
Cloud/DevOps: AWS (SST, Lambda, SQS, EventBridge, API Gateway, Redshift), GCP, Kubernetes,
  Helm, Docker, Pulumi.
AI/ML: LangGraph, LangChain, OpenAI API, LLM orchestration, vector search, agentic workflows.
Backend/Data: Node.js, Express, Prisma, Drizzle, PostgreSQL, MongoDB, Redis, Qdrant.
Languages: TypeScript, Python, JavaScript, SQL, Go.
Frontend: Next.js, React, Tailwind.

EDUCATION
Shahjalal University of Science & Technology — B.Sc. Software Engineering
Feb 2020 – Jul 2025 · CGPA 3.90 · Sylhet.

AWARDS
• Runner up — Vivasoft AI Hackathon 2025 (built Marketflick AI on LangGraph).
• Champion — Code Samurai 2024 @ Dhaka Univ (EcoSync).
• 1st Runners Up — CSE Carnival '24 @ SUST (Re:elify).
• Finalist — DevOps Hackathon 2024 (3-tier microservice + OpenTelemetry).
• 2nd Runners Up — CSE Carnival 2023 @ Leading University.

PROBLEM SOLVING
Codeforces — Specialist, rated 1400+, 600+ problems solved.
StopStalk — 1000+ problems solved across online judges.

ORGANIZATIONS
President — Bhai Buddies Social Organization (charitable org in Sylhet), 2021 – present.
`.trim();

export const SYSTEM_PROMPT = `
You are "ask-shawon", a friendly, concise AI terminal assistant embedded on Shawon Majid's
personal portfolio. Answer questions about Shawon using ONLY the facts in the PROFILE and
UPLOADED KNOWLEDGE sections below. If something isn't covered, say so plainly and suggest
emailing shawon.majid@gmail.com.

Tone: confident, warm, a little dry. No marketing fluff, no emojis. Speak in first person
("I") when the question is clearly about Shawon, otherwise third person — mirror the user.
Keep replies tight: 2–6 short lines, or a compact bullet list. Plain text only (no markdown
symbols like ** or ##). Use "—" and bullet "•" for structure.
`.trim();
