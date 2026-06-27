import { useEffect, useRef } from "react";
import type { Project } from "../data/site";
import { useLang } from "../i18n/lang";

export default function ProjectModal({
  project,
  onClose,
}: {
  project: Project | null;
  onClose: () => void;
}) {
  const { t } = useLang();
  const dialogRef = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!project) return;
    lastFocused.current = document.activeElement as HTMLElement;
    document.body.style.overflow = "hidden";

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    dialogRef.current?.focus();

    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
      lastFocused.current?.focus?.();
    };
  }, [project, onClose]);

  if (!project) return null;

  return (
    <div className="modal-scrim" onClick={onClose}>
      <div
        className="pmodal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="pmodal-title"
        tabIndex={-1}
        ref={dialogRef}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="pmodal-close" onClick={onClose} aria-label={t.ui.close}>
          ✕
        </button>

        <div className="pmodal-visual">
          <span aria-hidden="true">{project.short[0]}</span>
          <div className="pmodal-meta">{project.meta}</div>
        </div>

        <div className="pmodal-right">
          <h2 id="pmodal-title">{project.name}</h2>
          <div className="pmodal-sub">{project.subtitle}</div>

          <div className="tags">
            {project.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>

          <p className="pmodal-lead">{project.overview}</p>

          <div className="pmodal-h3">{t.ui.whatIBuilt}</div>
          <div className="pmodal-feat">
            {project.features.map((f) => (
              <div key={f}>{f}</div>
            ))}
          </div>

          <div className="pmodal-actions">
            {project.links.live && (
              <a className="btn solid" href={project.links.live} target="_blank" rel="noreferrer">
                {t.ui.viewLive}
              </a>
            )}
            {project.links.code && (
              <a className="btn" href={project.links.code} target="_blank" rel="noreferrer">
                {t.ui.viewCode}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
