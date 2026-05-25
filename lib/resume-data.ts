// Structured, UI-facing résumé data for the scroll portfolio sections.
//
// This MIRRORS the facts in lib/profile.ts (the freeform PROFILE string the
// LLM is grounded on). Two sources, one truth — keep them in sync by hand.
// profile.ts = what the AI reads; this file = what the page renders.

import { LINKS, RESUME_PATH } from "./links";

export type Experience = {
  company: string;
  role: string;
  period: string;
  location: string;
  bullets: string[];
};

/** Animated icon shown as a card's default visual (see CardVisual.tsx). */
export type ProjectIcon =
  | "pipeline"
  | "mcp"
  | "insights"
  | "agent"
  | "eco"
  | "reel"
  | "budget";

export type Project = {
  slug: string;
  name: string;
  blurb: string;
  stack: string[];
  /** Award badge, rendered top-left (e.g. "Champion · Code Samurai 2024"). */
  award?: string;
  /** Company/context badge, rendered top-right (e.g. "VYG", "Indigo"). */
  tag?: string;
  /** Animated, work-specific icon used as the card's default visual. */
  icon?: ProjectIcon;
  /** Public path under /projects. Optional — the animated icon is the default
   *  visual; a screenshot fades in over it when present and loaded. */
  image?: string;
  repo?: string;
  demo?: string;
};

export type SkillGroup = { label: string; items: string[] };
export type Award = { title: string; org?: string; year?: string };

export const NAME = "Shawon Majid";
export const TAGLINE = "Software Engineer — AI-augmented backends & serverless infra";
export const LOCATION = "Sylhet, Bangladesh · remote across US + BD teams";

export const SUMMARY = [
  "I build production AI systems — MCP servers, agentic workflows, LLM orchestration, and serverless event-driven backends on AWS and GCP. I like hard systems problems and shipping things that hold up in production.",
  "At Vyg.ai I architected a high-scale CDP (Customer Data Platform) on AWS Lambda, EventBridge, Apache Unomi, and Elasticsearch handling 150k+ events/sec, and run an AI pipeline over 2,500+ conversations a day that cut inference cost in half. I've shipped internal and customer-facing MCP servers that let AI assistants query brand data straight from ChatGPT and Claude, and automated our dev and maintenance workflow with AI bots for monitoring and bug-fixing.",
];

export const EXPERIENCE: Experience[] = [
  {
    company: "Vyg.ai",
    role: "Software Engineer",
    period: "Feb 2025 — present",
    location: "Remote · USA",
    bullets: [
      "Conversation Insights: AI pipeline processing 2,500+ daily conversations via OpenAI tool calling + structured outputs.",
      "Deployed CDP infra (Rudderstack, Apache Unomi) and n8n on GCP with Pulumi IaC + Helm/Kubernetes.",
      "Built an OAuth-protected MCP server letting AI assistants query brand data in real time.",
      "Architected serverless event-driven systems on AWS (EventBridge, SQS, API Gateway, SST).",
      "Cut AI inference cost 50% with OpenAI Batch API + Gemini fallback.",
    ],
  },
  {
    company: "Indigo",
    role: "AI Engineer",
    period: "Oct 2025 — Jan 2026",
    location: "Remote · USA",
    bullets: [
      "Built DeepAgents, a LangGraph-powered meeting assistant.",
      "Designed an agentic chatbot architecture over the full meeting corpus.",
    ],
  },
  {
    company: "Pathao",
    role: "Intern Data Engineer",
    period: "Aug 2024 — Jan 2025",
    location: "Dhaka",
    bullets: [
      "Built a hierarchical address-parsing system (unstructured → standardized location data).",
      "Used LLMs to classify 10,000+ places by type, usage, and naming patterns.",
      "Developed Go APIs for address-quality validation (coord matching, GeoJSON, haversine).",
    ],
  },
  {
    company: "Zenet",
    role: "Contract Engineer",
    period: "Oct 2024 — Dec 2024",
    location: "Remote · Tokyo",
    bullets: [
      "Contributed to Xlabo, an e-learning platform. Localized JP↔EN with vue-i18n.",
    ],
  },
];

export const PROJECTS: Project[] = [
  {
    slug: "cdp-pipeline",
    name: "CDP Pipeline",
    tag: "VYG",
    icon: "pipeline",
    blurb:
      "High-scale Customer Data Platform on AWS Lambda, EventBridge, Apache Unomi and Elasticsearch — ingesting 150k+ events/sec.",
    stack: ["AWS Lambda", "EventBridge", "Apache Unomi", "Elasticsearch", "SST"],
  },
  {
    slug: "mcp-servers",
    name: "MCP Servers",
    tag: "VYG",
    icon: "mcp",
    blurb:
      "OAuth-protected MCP servers that let AI assistants query brand data directly from ChatGPT, Claude and other clients.",
    stack: ["MCP", "OAuth 2.0", "TypeScript", "AWS"],
  },
  {
    slug: "conversation-insights",
    name: "Conversation Insights",
    tag: "VYG",
    icon: "insights",
    blurb:
      "Production AI pipeline processing 2,500+ conversations/day with OpenAI tool calling and structured outputs.",
    stack: ["OpenAI", "AWS SST", "EventBridge", "SQS"],
  },
  {
    slug: "deepagents",
    name: "DeepAgents",
    tag: "Indigo",
    icon: "agent",
    blurb:
      "LangGraph-powered meeting assistant — an agentic chatbot over the full meeting corpus.",
    stack: ["LangGraph", "OpenAI", "TypeScript"],
  },
  {
    slug: "ecosync",
    name: "EcoSync",
    award: "Champion · Code Samurai 2024",
    icon: "eco",
    blurb:
      "Waste-management platform for Dhaka City Corp — RBAC, Google Maps, Socket.io live tracking, PDF reports.",
    stack: ["Next.js", "Express", "Prisma", "Postgres", "Socket.io"],
    image: "/projects/ecosync.png",
  },
  {
    slug: "reelify",
    name: "Re:elify",
    award: "1st Runners Up · CSE Carnival '24",
    icon: "reel",
    blurb:
      "Text-to-reel generator that turns a prompt into a finished short video.",
    stack: ["Next.js", "Remotion", "GPT-4", "DALL·E 3", "MongoDB"],
    image: "/projects/reelify.png",
  },
  {
    slug: "budget-ai",
    name: "Budget AI",
    icon: "budget",
    blurb: "Natural-language expense tracker — log spending by just typing it.",
    stack: ["LangChain", "LLM", "TypeScript"],
  },
];

export const SKILL_GROUPS: SkillGroup[] = [
  {
    label: "AI / ML",
    items: ["LangGraph", "LangChain", "OpenAI API", "Agentic workflows", "Vector search", "MCP"],
  },
  {
    label: "Cloud / DevOps",
    items: ["AWS (SST · Lambda · SQS · EventBridge)", "GCP", "Kubernetes", "Helm", "Docker", "Pulumi"],
  },
  {
    label: "Backend / Data",
    items: ["Node.js", "Express", "Prisma", "Drizzle", "PostgreSQL", "MongoDB", "Redis", "Qdrant"],
  },
  {
    label: "Languages",
    items: ["TypeScript", "Python", "JavaScript", "SQL", "Go"],
  },
  {
    label: "Frontend",
    items: ["Next.js", "React", "Tailwind"],
  },
];

export const AWARDS: Award[] = [
  { title: "Champion — Code Samurai 2024", org: "Dhaka University (EcoSync)", year: "2024" },
  { title: "Runner-up — Vivasoft AI Hackathon", org: "Marketflick AI on LangGraph", year: "2025" },
  { title: "1st Runners Up — CSE Carnival '24", org: "SUST (Re:elify)", year: "2024" },
  { title: "Finalist — DevOps Hackathon", org: "3-tier microservice + OpenTelemetry", year: "2024" },
  { title: "2nd Runners Up — CSE Carnival 2023", org: "Leading University", year: "2023" },
];

export const PROBLEM_SOLVING = [
  "Codeforces — Specialist, rated 1400+, 600+ problems solved.",
  "StopStalk — 1000+ problems solved across online judges.",
];

export const EDUCATION = {
  school: "Shahjalal University of Science & Technology",
  degree: "B.Sc. in Software Engineering",
  period: "Feb 2020 — Jul 2025 · CGPA 3.90 · Sylhet",
};

export { LINKS, RESUME_PATH };
