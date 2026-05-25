// Single source of truth for the résumé PDF path + canonical external links.
// Referenced by the terminal UI (components/Terminal.tsx) and the scroll
// portfolio sections (lib/resume-data.ts → components/Portfolio.tsx).
//
// Keep this in sync with the contact facts in lib/profile.ts (the LLM-facing
// PROFILE string). When the résumé filename changes, change it HERE only.

export const RESUME_PATH = "/uploads/Shawon-Majid-FlowCV-Resume-20260214.pdf";

export const EMAIL = "shawon.majid@gmail.com";

// Pre-filled subject so a recruiter's mail client opens ready-to-send.
export const EMAIL_MAILTO = `mailto:${EMAIL}?subject=${encodeURIComponent(
  "Role opportunity — let's talk",
)}`;

export const LINKS = {
  email: EMAIL,
  emailHref: EMAIL_MAILTO,
  github: "https://github.com/shawon-majid",
  linkedin: "https://linkedin.com/in/shawon-majid",
  codeforces: "https://codeforces.com/profile/shawon.majid",
  site: "https://shawonmajid.com",
  resume: RESUME_PATH,
} as const;
