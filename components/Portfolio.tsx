import Reveal from "./Reveal";
import Avatar from "./Avatar";
import ProjectCard from "./ProjectCard";
import {
  AWARDS,
  EDUCATION,
  EXPERIENCE,
  LINKS,
  LOCATION,
  NAME,
  PROBLEM_SOLVING,
  PROJECTS,
  RESUME_PATH,
  SKILL_GROUPS,
  SUMMARY,
} from "@/lib/resume-data";

/**
 * The scannable scroll-down portfolio rendered directly below the terminal
 * hero. Gives a recruiter who won't type into the terminal an at-a-glance
 * story: who, work, experience, skills, proof, and a clear way to reach out.
 */
export default function Portfolio() {
  return (
    <div className="portfolio">
      {/* ABOUT */}
      <section className="section" id="about" aria-label="About">
        <Reveal>
          <div className="about">
            <Avatar src="/shawon.jpg" alt={NAME} />
            <div className="about-text">
              <p className="eyebrow">// about</p>
              <h2 className="display">{NAME}</h2>
              {SUMMARY.map((para, i) => (
                <p className="lede" key={i}>
                  {para}
                </p>
              ))}
              <p className="loc">{LOCATION}</p>
              <div className="inline-cta">
                <a className="btn btn-primary" href={LINKS.emailHref}>
                  Email me
                </a>
                <a className="btn btn-ghost" href={RESUME_PATH} target="_blank" rel="noreferrer">
                  Résumé ↓
                </a>
              </div>
            </div>
          </div>
        </Reveal>
      </section>

      {/* SELECTED WORK */}
      <section className="section" id="work" aria-label="Selected work">
        <Reveal>
          <p className="eyebrow">// selected work</p>
          <h2 className="section-title">Things I&apos;ve built</h2>
        </Reveal>
        <div className="pgrid">
          {PROJECTS.map((p, i) => (
            <Reveal key={p.slug} delay={i * 70}>
              <ProjectCard project={p} />
            </Reveal>
          ))}
        </div>
      </section>

      {/* EXPERIENCE */}
      <section className="section" id="experience" aria-label="Experience">
        <Reveal>
          <p className="eyebrow">// experience</p>
          <h2 className="section-title">Where I&apos;ve worked</h2>
        </Reveal>
        <div className="timeline">
          {EXPERIENCE.map((job, i) => (
            <Reveal key={job.company} delay={i * 60}>
              <div className="tl-item">
                <div className="tl-node" aria-hidden="true" />
                <div className="tl-head">
                  <span className="tl-co">{job.company}</span>
                  <span className="tl-role">{job.role}</span>
                  <span className="tl-meta">
                    {job.period} · {job.location}
                  </span>
                </div>
                <ul className="tl-bullets">
                  {job.bullets.map((b) => (
                    <li key={b}>{b}</li>
                  ))}
                </ul>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* SKILLS */}
      <section className="section" id="skills" aria-label="Skills">
        <Reveal>
          <p className="eyebrow">// stack</p>
          <h2 className="section-title">Tools I reach for</h2>
        </Reveal>
        <div className="skills">
          {SKILL_GROUPS.map((g, i) => (
            <Reveal key={g.label} delay={i * 50}>
              <div className="skill-group">
                <span className="skill-label">{g.label}</span>
                <div className="skill-chips">
                  {g.items.map((s) => (
                    <span key={s} className="chip">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* PROOF — awards, problem solving, education */}
      <section className="section" id="proof" aria-label="Recognition and education">
        <Reveal>
          <p className="eyebrow">// proof</p>
          <h2 className="section-title">Recognition</h2>
        </Reveal>
        <div className="proof">
          <Reveal className="proof-col">
            <h3 className="proof-h">Awards</h3>
            <ul className="award-list">
              {AWARDS.map((a) => (
                <li key={a.title}>
                  <span className="award-title">{a.title}</span>
                  {a.org && <span className="award-org">{a.org}</span>}
                </li>
              ))}
            </ul>
          </Reveal>
          <Reveal className="proof-col" delay={80}>
            <h3 className="proof-h">Problem solving</h3>
            <ul className="ps-list">
              {PROBLEM_SOLVING.map((p) => (
                <li key={p}>{p}</li>
              ))}
            </ul>
            <h3 className="proof-h" style={{ marginTop: 22 }}>
              Education
            </h3>
            <p className="edu">
              <span className="edu-school">{EDUCATION.school}</span>
              <span className="edu-degree">{EDUCATION.degree}</span>
              <span className="edu-meta">{EDUCATION.period}</span>
            </p>
          </Reveal>
        </div>
      </section>

      {/* CONTACT CTA */}
      <section className="section section-cta" id="contact" aria-label="Contact">
        <Reveal>
          <div className="cta">
            <p className="eyebrow eyebrow-accent">// let&apos;s talk</p>
            <h2 className="cta-title">Open to senior backend &amp; AI-engineering roles.</h2>
            <p className="cta-sub">
              If you&apos;re hiring for hard AI-systems problems, I&apos;d love to hear about it.
            </p>
            <div className="cta-actions">
              <a className="btn btn-primary btn-lg" href={LINKS.emailHref}>
                Email me
              </a>
              <a className="btn btn-ghost btn-lg" href={RESUME_PATH} target="_blank" rel="noreferrer">
                Download résumé ↓
              </a>
            </div>
            <nav className="cta-links">
              <a href={LINKS.github} target="_blank" rel="noreferrer">
                github
              </a>
              <a href={LINKS.linkedin} target="_blank" rel="noreferrer">
                linkedin
              </a>
              <a href={LINKS.codeforces} target="_blank" rel="noreferrer">
                codeforces
              </a>
            </nav>
            <p className="cta-copy">© {new Date().getFullYear()} Shawon Majid</p>
          </div>
        </Reveal>
      </section>
    </div>
  );
}
