import type { Project } from "@/lib/resume-data";
import CardVisual from "./CardVisual";
import ProjectThumb from "./ProjectThumb";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <article className="pcard">
      <div className="pcard-media">
        <CardVisual icon={project.icon} />
        <ProjectThumb src={project.image} name={project.name} />
        {project.award && <span className="pcard-award">{project.award}</span>}
        {project.tag && <span className="pcard-tag">{project.tag}</span>}
      </div>
      <div className="pcard-body">
        <h3 className="pcard-name">{project.name}</h3>
        <p className="pcard-blurb">{project.blurb}</p>
        <div className="pcard-stack">
          {project.stack.map((s) => (
            <span key={s} className="chip">
              {s}
            </span>
          ))}
        </div>
        {(project.demo || project.repo) && (
          <div className="pcard-links">
            {project.demo && (
              <a href={project.demo} target="_blank" rel="noreferrer">
                demo ↗
              </a>
            )}
            {project.repo && (
              <a href={project.repo} target="_blank" rel="noreferrer">
                code ↗
              </a>
            )}
          </div>
        )}
      </div>
    </article>
  );
}
